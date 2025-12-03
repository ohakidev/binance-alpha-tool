import { prisma } from "@/lib/db/prisma";
import { moralisClient } from "@/lib/api/moralis-client";
import { telegramService } from "./telegram";
import { AirdropStatus, AlertType } from "@prisma/client";
import { determineAirdropStatus } from "@/lib/constants/alpha.constants";

// ============= Types =============

interface AirdropData {
  name: string;
  token: string;
  chain: string;
  description?: string;
  eligibility: string[];
  requirements: string[];
  snapshotDate?: Date;
  claimStartDate?: Date;
  claimEndDate?: Date;
  estimatedValue?: number;
  websiteUrl?: string;
  twitterUrl?: string;
}

interface AirdropScoreInput {
  estimatedValue?: number;
  participantCount?: number;
  verified: boolean;
  requirements: string[];
  claimEndDate?: Date | null;
}

interface EligibilityResult {
  isEligible: boolean;
  metRequirements: string[];
  missedRequirements: string[];
}

// ============= Helper Functions =============

/**
 * Parse JSON string to array safely
 */
function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ============= Airdrop Calculator Service =============

/**
 * Airdrop Calculator Service
 * Handles airdrop scoring, eligibility checks, and status management
 */
export class AirdropCalculator {
  /**
   * Calculate airdrop interest score (0-100)
   */
  calculateAirdropScore(airdrop: AirdropScoreInput): number {
    let score = 0;

    // Estimated value score (0-40)
    if (airdrop.estimatedValue) {
      score += Math.min(40, (airdrop.estimatedValue / 1000) * 40);
    }

    // Participant count - fewer is better (0-20)
    if (airdrop.participantCount) {
      const participantScore = Math.max(
        0,
        20 - (airdrop.participantCount / 100000) * 20,
      );
      score += participantScore;
    }

    // Verified status (0-20)
    if (airdrop.verified) {
      score += 20;
    }

    // Requirement complexity - fewer is better (0-10)
    score += Math.max(0, 10 - airdrop.requirements.length * 2);

    // Time urgency (0-10)
    if (airdrop.claimEndDate) {
      const daysLeft = Math.ceil(
        (airdrop.claimEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft <= 7) {
        score += 10;
      } else if (daysLeft <= 30) {
        score += 5;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Check user eligibility for airdrop
   */
  async checkUserEligibility(
    walletAddress: string,
    requirements: string[],
  ): Promise<EligibilityResult> {
    try {
      const eligibilityData =
        await moralisClient.checkAirdropEligibility(walletAddress);

      const metRequirements: string[] = [];
      const missedRequirements: string[] = [];

      for (const req of requirements) {
        const reqLower = req.toLowerCase();

        const isMet =
          (reqLower.includes("nft") && eligibilityData.hasNFTs) ||
          (reqLower.includes("token") && eligibilityData.tokenCount > 0) ||
          (reqLower.includes("transaction") && eligibilityData.isActive) ||
          (reqLower.includes("active") && eligibilityData.isActive);

        if (isMet) {
          metRequirements.push(req);
        } else {
          missedRequirements.push(req);
        }
      }

      return {
        isEligible: missedRequirements.length === 0,
        metRequirements,
        missedRequirements,
      };
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return {
        isEligible: false,
        metRequirements: [],
        missedRequirements: requirements,
      };
    }
  }

  /**
   * Create a new airdrop
   */
  async createAirdrop(data: AirdropData) {
    const status = this.determineStatus(data);

    const airdrop = await prisma.airdrop.create({
      data: {
        ...data,
        eligibility: JSON.stringify(data.eligibility),
        requirements: JSON.stringify(data.requirements),
        status,
      },
    });

    // Send Telegram notification
    await telegramService.sendAirdropAlert({
      name: airdrop.name,
      symbol: airdrop.token,
      chain: airdrop.chain,
      status: airdrop.status,
      claimStartDate: airdrop.claimStartDate || undefined,
      claimEndDate: airdrop.claimEndDate || undefined,
      estimatedValue: airdrop.estimatedValue || undefined,
    });

    return airdrop;
  }

  /**
   * Determine airdrop status based on dates
   */
  private determineStatus(data: AirdropData): AirdropStatus {
    const now = new Date();

    if (data.claimEndDate && data.claimEndDate < now) {
      return AirdropStatus.ENDED;
    }

    if (data.claimStartDate && data.claimStartDate <= now) {
      return AirdropStatus.CLAIMABLE;
    }

    if (data.snapshotDate) {
      const daysDiff = Math.ceil(
        (data.snapshotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff <= 0) {
        return AirdropStatus.SNAPSHOT;
      }
    }

    return AirdropStatus.UPCOMING;
  }

  /**
   * Update all airdrop statuses
   */
  async updateAllAirdropStatuses() {
    const airdrops = await prisma.airdrop.findMany({
      where: {
        status: {
          notIn: [AirdropStatus.ENDED, AirdropStatus.CANCELLED],
        },
      },
    });

    for (const airdrop of airdrops) {
      const newStatus = determineAirdropStatus(airdrop.claimStartDate);

      if (newStatus !== airdrop.status) {
        await prisma.airdrop.update({
          where: { id: airdrop.id },
          data: { status: newStatus },
        });

        // Send notifications for status changes
        if (newStatus === AirdropStatus.SNAPSHOT) {
          await telegramService.sendSnapshotAlert({
            name: airdrop.name,
            symbol: airdrop.token,
            snapshotDate: airdrop.snapshotDate || undefined,
          });
        } else if (newStatus === AirdropStatus.CLAIMABLE) {
          await telegramService.sendClaimableAlert({
            name: airdrop.name,
            symbol: airdrop.token,
            claimEndDate: airdrop.claimEndDate || undefined,
          });
        }
      }
    }
  }

  /**
   * Create user alert
   */
  async createUserAlert(
    userId: string,
    airdropId: string | null,
    type: AlertType,
    title: string,
    message: string,
  ) {
    return prisma.alert.create({
      data: {
        userId,
        airdropId,
        type,
        title,
        message,
      },
    });
  }

  /**
   * Get upcoming airdrops
   */
  async getUpcomingAirdrops(limit = 10) {
    return prisma.airdrop.findMany({
      where: {
        status: {
          in: [
            AirdropStatus.UPCOMING,
            AirdropStatus.SNAPSHOT,
            AirdropStatus.CLAIMABLE,
          ],
        },
      },
      orderBy: [{ claimStartDate: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  /**
   * Track airdrop for user
   */
  async trackAirdropForUser(
    userId: string,
    airdropId: string,
    walletAddress?: string,
  ) {
    const airdrop = await prisma.airdrop.findUnique({
      where: { id: airdropId },
    });

    if (!airdrop) {
      throw new Error("Airdrop not found");
    }

    let isEligible = false;

    if (walletAddress) {
      const requirements = parseJsonArray(airdrop.requirements);
      const eligibility = await this.checkUserEligibility(
        walletAddress,
        requirements,
      );
      isEligible = eligibility.isEligible;
    }

    return prisma.userAirdrop.upsert({
      where: {
        userId_airdropId: {
          userId,
          airdropId,
        },
      },
      update: {
        isEligible,
      },
      create: {
        userId,
        airdropId,
        isEligible,
      },
    });
  }
}

// ============= Singleton Export =============

export const airdropCalculator = new AirdropCalculator();
