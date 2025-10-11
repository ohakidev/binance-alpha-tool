import { prisma } from "@/lib/db/prisma";
import { moralisClient } from "@/lib/api/moralis-client";
import { telegramService } from "./telegram";
import { AirdropStatus, AlertType } from "@prisma/client";

interface AirdropData {
  name: string;
  symbol: string;
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

export class AirdropCalculator {
  // คำนวณคะแนนความน่าสนใจของ airdrop (0-100)
  calculateAirdropScore(airdrop: {
    estimatedValue?: number;
    participantCount?: number;
    verified: boolean;
    requirements: string[];
    claimEndDate?: Date | null;
  }): number {
    let score = 0;

    // Estimated value score (0-40)
    if (airdrop.estimatedValue) {
      score += Math.min(40, (airdrop.estimatedValue / 1000) * 40);
    }

    // Participant count (inverse - fewer = better) (0-20)
    if (airdrop.participantCount) {
      const participantScore = Math.max(
        0,
        20 - (airdrop.participantCount / 100000) * 20
      );
      score += participantScore;
    }

    // Verified status (0-20)
    if (airdrop.verified) {
      score += 20;
    }

    // Requirement complexity (fewer = better) (0-10)
    const requirementScore = Math.max(0, 10 - airdrop.requirements.length * 2);
    score += requirementScore;

    // Time urgency (0-10)
    if (airdrop.claimEndDate) {
      const daysLeft = Math.ceil(
        (airdrop.claimEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 7) {
        score += 10;
      } else if (daysLeft <= 30) {
        score += 5;
      }
    }

    return Math.min(100, Math.round(score));
  }

  // ตรวจสอบความสามารถในการรับ airdrop
  async checkUserEligibility(
    walletAddress: string,
    requirements: string[]
  ): Promise<{
    isEligible: boolean;
    metRequirements: string[];
    missedRequirements: string[];
  }> {
    try {
      const eligibilityData = await moralisClient.checkAirdropEligibility(
        walletAddress
      );

      const metRequirements: string[] = [];
      const missedRequirements: string[] = [];

      for (const req of requirements) {
        const reqLower = req.toLowerCase();

        if (reqLower.includes("nft") && eligibilityData.hasNFTs) {
          metRequirements.push(req);
        } else if (
          reqLower.includes("token") &&
          eligibilityData.tokenCount > 0
        ) {
          metRequirements.push(req);
        } else if (
          reqLower.includes("transaction") &&
          eligibilityData.isActive
        ) {
          metRequirements.push(req);
        } else if (reqLower.includes("active") && eligibilityData.isActive) {
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

  // สร้าง airdrop ใหม่
  async createAirdrop(data: AirdropData) {
    const airdrop = await prisma.airdrop.create({
      data: {
        ...data,
        eligibility: JSON.stringify(data.eligibility),
        requirements: JSON.stringify(data.requirements),
        status: this.determineStatus(data),
      },
    });

    // ส่งการแจ้งเตือนไปยัง Telegram
    await telegramService.sendAirdropAlert({
      name: airdrop.name,
      symbol: airdrop.symbol,
      chain: airdrop.chain,
      status: airdrop.status,
      claimStartDate: airdrop.claimStartDate || undefined,
      claimEndDate: airdrop.claimEndDate || undefined,
      estimatedValue: airdrop.estimatedValue || undefined,
    });

    return airdrop;
  }

  // กำหนดสถานะของ airdrop
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
        (data.snapshotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 0) {
        return AirdropStatus.SNAPSHOT;
      }
    }

    return AirdropStatus.UPCOMING;
  }

  // อัพเดทสถานะ airdrops ทั้งหมด
  async updateAllAirdropStatuses() {
    const airdrops = await prisma.airdrop.findMany({
      where: {
        status: {
          notIn: [AirdropStatus.ENDED, AirdropStatus.CANCELLED],
        },
      },
    });

    for (const airdrop of airdrops) {
      // Parse JSON strings to arrays
      const eligibility = (() => {
        try {
          return typeof airdrop.eligibility === "string"
            ? JSON.parse(airdrop.eligibility)
            : airdrop.eligibility;
        } catch {
          return [];
        }
      })();

      const requirements = (() => {
        try {
          return typeof airdrop.requirements === "string"
            ? JSON.parse(airdrop.requirements)
            : airdrop.requirements;
        } catch {
          return [];
        }
      })();

      const newStatus = this.determineStatus({
        name: airdrop.name,
        symbol: airdrop.symbol,
        chain: airdrop.chain,
        eligibility,
        requirements,
        snapshotDate: airdrop.snapshotDate || undefined,
        claimStartDate: airdrop.claimStartDate || undefined,
        claimEndDate: airdrop.claimEndDate || undefined,
      });

      if (newStatus !== airdrop.status) {
        await prisma.airdrop.update({
          where: { id: airdrop.id },
          data: { status: newStatus },
        });

        // ส่งการแจ้งเตือนเมื่อสถานะเปลี่ยน
        if (newStatus === AirdropStatus.SNAPSHOT) {
          await telegramService.sendSnapshotAlert({
            name: airdrop.name,
            symbol: airdrop.symbol,
            snapshotDate: airdrop.snapshotDate || undefined,
          });
        } else if (newStatus === AirdropStatus.CLAIMABLE) {
          await telegramService.sendClaimableAlert({
            name: airdrop.name,
            symbol: airdrop.symbol,
            claimEndDate: airdrop.claimEndDate || undefined,
          });
        }
      }
    }
  }

  // สร้าง alert สำหรับผู้ใช้
  async createUserAlert(
    userId: string,
    airdropId: string | null,
    type: AlertType,
    title: string,
    message: string
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

  // ดึง airdrops ที่กำลังจะมาถึง
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

  // ติดตาม airdrop สำหรับผู้ใช้
  async trackAirdropForUser(
    userId: string,
    airdropId: string,
    walletAddress?: string
  ) {
    const airdrop = await prisma.airdrop.findUnique({
      where: { id: airdropId },
    });

    if (!airdrop) {
      throw new Error("Airdrop not found");
    }

    let isEligible = false;

    if (walletAddress) {
      // Parse requirements from JSON string
      const requirements = (() => {
        try {
          return typeof airdrop.requirements === "string"
            ? JSON.parse(airdrop.requirements)
            : airdrop.requirements;
        } catch {
          return [];
        }
      })();

      const eligibility = await this.checkUserEligibility(
        walletAddress,
        requirements
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

export const airdropCalculator = new AirdropCalculator();
