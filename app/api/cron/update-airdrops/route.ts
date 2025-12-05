/**
 * Auto-Sync Cron Job - Automatic airdrop updates and Telegram notifications
 *
 * This cron job runs automatically to:
 * 1. Sync data from Binance Alpha API directly to Airdrop table
 * 2. Update airdrop schedules and statuses
 * 3. Send Telegram notifications for new/upcoming airdrops (20 min before)
 * 4. No manual intervention required - fully automated like alpha123.uk
 *
 * Vercel Cron Schedule: Every 5 minutes for real-time updates
 * GET /api/cron/update-airdrops
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  telegramService,
  type AirdropReminderData,
} from "@/lib/services/telegram";
import { AirdropStatus, AirdropType } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 seconds max for Vercel

// Security: Verify request from Vercel Cron or with secret
function isAuthorized(request: Request): boolean {
  // Allow Vercel Cron (has specific header)
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron) {
    return true;
  }

  // Check authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // Check query parameter (for manual testing)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret === process.env.CRON_SECRET) {
    return true;
  }

  // Allow in development
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

/**
 * Binance Alpha API response types
 */
interface BinanceAlphaToken {
  alphaId: string;
  tokenId: string;
  symbol: string;
  name: string;
  chainId: string;
  chainName: string;
  contractAddress: string;
  price: string;
  percentChange24h: string;
  priceHigh24h: string;
  priceLow24h: string;
  volume24h: string;
  marketCap: string;
  fdv: string;
  liquidity: string;
  holders: string;
  totalSupply: string;
  circulatingSupply: string;
  score: number;
  mulPoint: number;
  listingTime: number;
  onlineTge: boolean;
  onlineAirdrop: boolean;
  hotTag: boolean;
  offline: boolean;
  offsell: boolean;
  listingCex: boolean;
  iconUrl: string;
}

interface BinanceAlphaResponse {
  code: string;
  message: string | null;
  data: BinanceAlphaToken[];
}

// Chain ID to name mapping
const CHAIN_MAP: Record<string, string> = {
  "1": "Ethereum",
  "56": "BSC",
  "137": "Polygon",
  "42161": "Arbitrum",
  "10": "Optimism",
  "43114": "Avalanche",
  "8453": "Base",
  "324": "zkSync",
};

function normalizeChainName(chainId: string, chainName: string): string {
  if (chainId && CHAIN_MAP[chainId]) {
    return CHAIN_MAP[chainId];
  }
  const lower = chainName?.toLowerCase() || "";
  if (lower.includes("bsc") || lower.includes("bnb")) return "BSC";
  if (lower.includes("eth")) return "Ethereum";
  if (lower.includes("sol")) return "Solana";
  if (lower.includes("arb")) return "Arbitrum";
  if (lower.includes("base")) return "Base";
  return chainName || "BSC";
}

function determineStatus(token: BinanceAlphaToken): AirdropStatus {
  const now = Date.now();
  const listingTime = token.listingTime || 0;

  // Offline tokens are always ended
  if (token.offline || token.offsell) {
    return "ENDED";
  }

  // Token not launched yet
  if (listingTime > now) {
    return "UPCOMING";
  }

  // PRIMARY: If onlineAirdrop is true, token is CLAIMABLE regardless of time
  // This is the key indicator from Binance Alpha API
  if (token.onlineAirdrop) {
    return "CLAIMABLE";
  }

  // If TGE is active but no airdrop, still show as claimable for visibility
  if (token.onlineTge) {
    return "CLAIMABLE";
  }

  // No active airdrop or TGE - mark as ended
  return "ENDED";
}

function determineType(token: BinanceAlphaToken): AirdropType {
  if (token.onlineTge) return "TGE";
  return "AIRDROP";
}

/**
 * Fetch tokens directly from Binance Alpha API with proper gzip handling
 */
async function fetchBinanceAlphaTokens(): Promise<BinanceAlphaToken[]> {
  const https = await import("https");
  const zlib = await import("zlib");

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.binance.com",
      path: "/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list",
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      // Handle gzip compression
      let stream: NodeJS.ReadableStream = res;
      const encoding = res.headers["content-encoding"];

      if (encoding === "gzip") {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === "deflate") {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === "br") {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        try {
          const data = Buffer.concat(chunks).toString("utf-8");
          const json: BinanceAlphaResponse = JSON.parse(data);

          if (json.code !== "000000") {
            reject(new Error(`API Error: ${json.message || "Unknown error"}`));
            return;
          }

          resolve(json.data || []);
        } catch (e) {
          reject(e);
        }
      });
      stream.on("error", reject);
    });

    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

/**
 * Check if a date is within X minutes from now
 */
function isWithinMinutes(date: Date, minutes: number): boolean {
  const now = new Date();
  const targetTime = date.getTime();
  const diff = targetTime - now.getTime();
  return diff > 0 && diff <= minutes * 60 * 1000;
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const results = {
    synced: 0,
    created: 0,
    updated: 0,
    notified: 0,
    errors: [] as string[],
  };

  try {
    // Verify authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("🤖 [AUTO-SYNC] Starting automatic sync job...");

    // ========================================
    // STEP 1: Fetch fresh data from Binance Alpha API
    // ========================================
    console.log("📡 [STEP 1] Fetching data from Binance Alpha API...");

    let tokens: BinanceAlphaToken[] = [];
    try {
      tokens = await fetchBinanceAlphaTokens();
      results.synced = tokens.length;
      console.log(`✅ Fetched ${tokens.length} tokens from Binance Alpha`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`API fetch failed: ${errMsg}`);
      console.error("❌ Failed to fetch from Binance Alpha:", errMsg);
      // Don't fail completely - continue with what we have
    }

    // ========================================
    // STEP 2: Sync directly to main Airdrop table
    // ========================================
    console.log("📅 [STEP 2] Syncing to main Airdrop table...");

    const now = new Date();
    const newAirdrops: Array<{
      token: string;
      name: string;
      chain: string;
      status: AirdropStatus;
      type: AirdropType;
      claimStartDate: Date | null;
      points: number | null;
      deductPoints: number | null;
      estimatedValue: number | null;
      contractAddress: string | null;
    }> = [];

    for (const token of tokens) {
      // Only process tokens with active airdrops or TGE, or upcoming ones
      const status = determineStatus(token);
      const type = determineType(token);

      // Skip ended tokens that aren't interesting
      if (status === "ENDED" && !token.onlineAirdrop && !token.onlineTge) {
        continue;
      }

      try {
        const listingTime =
          token.listingTime > 0 ? new Date(token.listingTime) : null;
        // Don't set a fixed claimEndDate - let onlineAirdrop flag determine if still active
        // Set a far future date if airdrop is active, otherwise use listing + 30 days as estimate
        const claimEndDate =
          token.onlineAirdrop || token.onlineTge
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now if active
            : listingTime
              ? new Date(listingTime.getTime() + 30 * 24 * 60 * 60 * 1000)
              : null;

        const price = parseFloat(token.price) || 0;
        const estimatedValue = price > 0 ? Math.round(price * 100) / 100 : null;

        const airdropData = {
          name: token.name,
          chain: normalizeChainName(token.chainId, token.chainName),
          contractAddress: token.contractAddress || null,
          airdropAmount: token.score > 0 ? `Alpha Score: ${token.score}` : null,
          claimStartDate: listingTime,
          claimEndDate,
          requiredPoints: token.score || null,
          deductPoints: token.score ? Math.floor(token.score * 0.1) : null,
          type,
          status,
          estimatedValue,
          description: `${token.name} (${token.symbol}) on ${normalizeChainName(token.chainId, token.chainName)}. Alpha ID: ${token.alphaId}. Point Multiplier: ${token.mulPoint}x`,
          eligibility: JSON.stringify([
            "Binance Alpha User",
            `Min Score: ${token.score}`,
          ]),
          requirements: JSON.stringify(
            [
              "Binance Alpha Points Required",
              `Point Multiplier: ${token.mulPoint}x`,
              token.onlineTge ? "TGE Active" : "",
              token.onlineAirdrop ? "Airdrop Active" : "",
            ].filter(Boolean),
          ),
          verified: true,
          isActive: status !== "ENDED",
          multiplier: token.mulPoint || 1,
          isBaseline: token.mulPoint === 1,
          logoUrl: token.iconUrl || null,
        };

        // Check if exists by token symbol (unique constraint)
        const existing = await prisma.airdrop.findUnique({
          where: { token: token.symbol },
        });

        if (existing) {
          // Update existing - check if significant changes
          const hasChanges =
            existing.status !== status ||
            existing.estimatedValue !== estimatedValue ||
            existing.name !== token.name;

          if (hasChanges) {
            await prisma.airdrop.update({
              where: { id: existing.id },
              data: {
                ...airdropData,
                updatedAt: new Date(),
              },
            });
            results.updated++;
          }
        } else {
          // Create new
          await prisma.airdrop.create({
            data: {
              token: token.symbol,
              ...airdropData,
            },
          });
          results.created++;

          // Track new airdrops for notifications
          if (status === "CLAIMABLE" || status === "UPCOMING") {
            newAirdrops.push({
              token: token.symbol,
              name: token.name,
              chain: normalizeChainName(token.chainId, token.chainName),
              status,
              type,
              claimStartDate: listingTime,
              points: token.score || null,
              deductPoints: token.score ? Math.floor(token.score * 0.1) : null,
              estimatedValue,
              contractAddress: token.contractAddress || null,
            });
          }
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        // Don't spam errors for duplicates
        if (!errMsg.includes("Unique constraint")) {
          results.errors.push(`Token ${token.symbol}: ${errMsg}`);
        }
      }
    }

    console.log(
      `✅ Airdrop table synced: ${results.created} created, ${results.updated} updated`,
    );

    // ========================================
    // STEP 3: Also update AirdropSchedule for detailed tracking
    // ========================================
    console.log("📅 [STEP 3] Updating AirdropSchedule table...");

    for (const token of tokens) {
      if (!token.onlineAirdrop && !token.onlineTge) {
        continue;
      }

      try {
        const scheduledTime =
          token.listingTime > 0
            ? new Date(token.listingTime)
            : new Date(now.getTime() + 3600000);
        const endTime = token.listingTime
          ? new Date(token.listingTime + 7 * 24 * 60 * 60 * 1000)
          : null;

        // Determine schedule status
        let scheduleStatus = "UPCOMING";
        if (endTime && now > endTime) {
          scheduleStatus = "ENDED";
        } else if (now >= scheduledTime) {
          scheduleStatus = "LIVE";
        } else if (isToday(scheduledTime)) {
          scheduleStatus = "TODAY";
        }

        const scheduleData = {
          token: token.symbol,
          name: token.name,
          scheduledTime,
          endTime,
          points: token.score || null,
          deductPoints: token.score ? Math.floor(token.score * 0.1) : null,
          amount: token.score ? `Alpha Score: ${token.score}` : null,
          chain: normalizeChainName(token.chainId, token.chainName),
          contractAddress: token.contractAddress || null,
          status: scheduleStatus,
          type: token.onlineTge ? "TGE" : "AIRDROP",
          estimatedPrice: parseFloat(token.price) || null,
          estimatedValue:
            parseFloat(token.price) > 0
              ? Math.round(parseFloat(token.price) * 100) / 100
              : null,
          source: "binance-alpha",
          logoUrl: token.iconUrl || null,
          description: `${token.name} (${token.symbol}) - ${token.mulPoint}x multiplier`,
          isActive: !token.offline,
          isVerified: true,
        };

        // Use upsert with unique constraint on [token, scheduledTime]
        await (prisma as any).airdropSchedule.upsert({
          where: {
            token_scheduledTime: {
              token: token.symbol,
              scheduledTime,
            },
          },
          update: {
            ...scheduleData,
            updatedAt: new Date(),
          },
          create: scheduleData,
        });
      } catch (error) {
        // Silently handle schedule errors - main table is more important
        console.warn(`Schedule update warning for ${token.symbol}:`, error);
      }
    }

    // ========================================
    // STEP 4: Update statuses based on time
    // ========================================
    console.log("⏰ [STEP 4] Updating statuses based on time...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Update main Airdrop table statuses
    // UPCOMING -> CLAIMABLE (if listing time has passed)
    await prisma.airdrop.updateMany({
      where: {
        status: "UPCOMING",
        claimStartDate: { lte: now },
        isActive: true,
      },
      data: { status: "CLAIMABLE" },
    });

    // NOTE: We don't auto-mark CLAIMABLE -> ENDED based on claimEndDate anymore
    // The status is determined by onlineAirdrop flag from API during sync
    // This prevents active airdrops from being incorrectly marked as ended

    // Also update schedule statuses
    try {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // UPCOMING -> TODAY
      await (prisma as any).airdropSchedule.updateMany({
        where: {
          status: "UPCOMING",
          scheduledTime: { gte: today, lt: tomorrow },
          isActive: true,
        },
        data: { status: "TODAY" },
      });

      // TODAY/UPCOMING -> LIVE
      await (prisma as any).airdropSchedule.updateMany({
        where: {
          status: { in: ["UPCOMING", "TODAY"] },
          scheduledTime: { lte: now },
          isActive: true,
        },
        data: { status: "LIVE" },
      });

      // LIVE -> ENDED
      await (prisma as any).airdropSchedule.updateMany({
        where: {
          status: "LIVE",
          endTime: { lte: now },
          isActive: true,
        },
        data: { status: "ENDED" },
      });
    } catch (error) {
      console.warn("Schedule status update warning:", error);
    }

    // ========================================
    // STEP 5: Send Telegram notifications
    // ========================================
    console.log("📤 [STEP 5] Sending Telegram notifications...");

    // 5a. Notify for NEW airdrops (just discovered)
    for (const airdrop of newAirdrops) {
      try {
        const sent = await telegramService.sendAirdropAlert({
          name: airdrop.name,
          symbol: airdrop.token,
          chain: airdrop.chain,
          status: airdrop.status.toLowerCase(),
          claimStartDate: airdrop.claimStartDate ?? undefined,
          claimEndDate: airdrop.claimStartDate
            ? new Date(
                airdrop.claimStartDate.getTime() + 30 * 24 * 60 * 60 * 1000,
              )
            : undefined,
          estimatedValue: airdrop.estimatedValue ?? undefined,
          airdropAmount: airdrop.points
            ? `Alpha Score: ${airdrop.points}`
            : undefined,
          requiredPoints: airdrop.points ?? undefined,
          deductPoints: airdrop.deductPoints ?? undefined,
          contractAddress: airdrop.contractAddress ?? undefined,
        });

        if (sent) {
          results.notified++;
          console.log(`📱 NEW airdrop notification sent: ${airdrop.token}`);
        }
      } catch (error) {
        console.error(`Failed to notify for ${airdrop.token}:`, error);
      }
    }

    // 5b. Notify for airdrops starting in 20 minutes (reminder like alpha123.uk)
    try {
      const upcomingNotifications = await (
        prisma as any
      ).airdropSchedule.findMany({
        where: {
          scheduledTime: {
            gte: now,
            lte: new Date(now.getTime() + 25 * 60 * 1000),
          },
          notified: false,
          isActive: true,
          status: { in: ["UPCOMING", "TODAY"] },
        },
      });

      for (const schedule of upcomingNotifications) {
        if (isWithinMinutes(schedule.scheduledTime, 25)) {
          try {
            const minutesUntil = Math.round(
              (schedule.scheduledTime.getTime() - now.getTime()) / 60000,
            );

            const reminderData: AirdropReminderData = {
              name: schedule.name,
              symbol: schedule.token,
              scheduledTime: schedule.scheduledTime,
              minutesUntil,
              chain: schedule.chain,
              points: schedule.points,
              amount: schedule.amount,
              contractAddress: schedule.contractAddress,
              type: schedule.type,
            };

            const sent =
              await telegramService.sendAirdropReminder(reminderData);

            if (sent) {
              await (prisma as any).airdropSchedule.update({
                where: { id: schedule.id },
                data: { notified: true },
              });
              results.notified++;
              console.log(
                `📱 Reminder sent: ${schedule.token} (${minutesUntil}m)`,
              );
            }
          } catch (error) {
            console.error(
              `Failed to send reminder for ${schedule.token}:`,
              error,
            );
          }
        }
      }
    } catch (error) {
      console.warn("Reminder notifications warning:", error);
    }

    // 5c. Notify for airdrops that just went LIVE
    try {
      const justLive = await (prisma as any).airdropSchedule.findMany({
        where: {
          status: "LIVE",
          notified: false,
          scheduledTime: {
            gte: new Date(now.getTime() - 10 * 60 * 1000),
            lte: now,
          },
          isActive: true,
        },
      });

      for (const schedule of justLive) {
        try {
          const liveData: AirdropReminderData = {
            name: schedule.name,
            symbol: schedule.token,
            scheduledTime: schedule.scheduledTime,
            minutesUntil: 0,
            chain: schedule.chain,
            points: schedule.points,
            amount: schedule.amount,
            contractAddress: schedule.contractAddress,
            type: schedule.type,
          };

          await telegramService.sendAirdropLive(liveData);

          await (prisma as any).airdropSchedule.update({
            where: { id: schedule.id },
            data: { notified: true },
          });
          results.notified++;
          console.log(`📱 LIVE notification sent: ${schedule.token}`);
        } catch (error) {
          console.error(
            `Failed to send live notification for ${schedule.token}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.warn("Live notifications warning:", error);
    }

    // ========================================
    // STEP 6: Log sync result
    // ========================================
    const duration = Date.now() - startTime;

    try {
      await (prisma as any).syncLog.create({
        data: {
          source: "cron-auto-sync",
          action: "full-sync",
          success: results.errors.length === 0,
          tokensCount: results.synced,
          created: results.created,
          updated: results.updated,
          errors: results.errors.length,
          duration,
          details: JSON.stringify({
            notified: results.notified,
            errors: results.errors.slice(0, 10), // Limit error details
          }),
        },
      });
    } catch (error) {
      console.error("Failed to log sync:", error);
    }

    // ========================================
    // STEP 7: Cleanup old data
    // ========================================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      await (prisma as any).airdropSchedule.deleteMany({
        where: {
          status: "ENDED",
          scheduledTime: { lt: thirtyDaysAgo },
        },
      });
    } catch (error) {
      console.warn("Cleanup warning:", error);
    }

    // Get final stats
    const airdropStats = await prisma.airdrop.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const finalStats = {
      upcoming: 0,
      claimable: 0,
      ended: 0,
      total: 0,
    };

    airdropStats.forEach((s) => {
      switch (s.status) {
        case "UPCOMING":
          finalStats.upcoming = s._count.status;
          break;
        case "CLAIMABLE":
          finalStats.claimable = s._count.status;
          break;
        case "ENDED":
          finalStats.ended = s._count.status;
          break;
      }
      finalStats.total += s._count.status;
    });

    console.log("✅ [AUTO-SYNC] Completed in", duration, "ms");
    console.log("📊 Stats:", finalStats);
    console.log("📱 Notifications sent:", results.notified);

    return NextResponse.json({
      success: true,
      message: "Auto-sync completed successfully",
      data: {
        duration,
        synced: results.synced,
        created: results.created,
        updated: results.updated,
        notified: results.notified,
        errors: results.errors.length,
        stats: finalStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [AUTO-SYNC] Critical error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Auto-sync failed",
        data: results,
      },
      { status: 500 },
    );
  }
}

// Also support POST for manual trigger
export async function POST(request: Request) {
  return GET(request);
}
