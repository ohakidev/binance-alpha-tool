/**
 * Real Binance Alpha Sync API
 * Uses the new AlphaService with OOP pattern
 *
 * GET /api/binance/alpha/real-sync
 * Query params:
 * - force: boolean (force refresh cache)
 * - notify: boolean (send telegram notifications, default: true)
 *
 * POST /api/binance/alpha/real-sync
 * Force refresh and sync
 */

import { NextResponse } from "next/server";
import { alphaService } from "@/lib/services/alpha";
import { prisma } from "@/lib/prisma";
import { telegramService } from "@/lib/services/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";
    const notifyNew = searchParams.get("notify") !== "false"; // Default: true

    console.log("🔄 Starting Alpha sync...", {
      forceRefresh,
      notifyNew,
    });

    // Use AlphaService to sync to database
    const syncResult = await alphaService.syncToDatabase();

    if (!syncResult.success && syncResult.errors > 0) {
      console.warn(`⚠️ Sync completed with ${syncResult.errors} errors`);
    }

    // Get stats from service
    const stats = await alphaService.getStats();
    console.log("📊 Stats:", stats);

    // Get tokens for notification
    const response = await alphaService.getTokens(false);
    const tokens = response.data;

    // Track notifications
    let notified = 0;

    // Send Telegram notifications for newly created airdrops
    if (syncResult.created > 0 && notifyNew) {
      console.log(
        `📤 Sending Telegram notifications for ${syncResult.created} new airdrops...`,
      );

      // Get recently created airdrops from database
      const recentAirdrops = await prisma.airdrop.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60000), // Created in last minute
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: syncResult.created,
      });

      for (const airdrop of recentAirdrops) {
        try {
          const sent = await telegramService.sendAirdropAlert({
            name: airdrop.name,
            symbol: airdrop.token,
            chain: airdrop.chain,
            status: airdrop.status,
            claimStartDate: airdrop.claimStartDate || undefined,
            claimEndDate: airdrop.claimEndDate || undefined,
            estimatedValue: airdrop.estimatedValue || undefined,
            airdropAmount: airdrop.airdropAmount || undefined,
            requiredPoints: airdrop.requiredPoints || undefined,
            deductPoints: airdrop.deductPoints || undefined,
            contractAddress: airdrop.contractAddress || undefined,
          });

          if (sent) {
            notified++;
            console.log(
              `✅ Telegram notification sent for: ${airdrop.name} (${airdrop.token})`,
            );
          } else {
            console.log(
              `⚠️ Telegram notification skipped (disabled): ${airdrop.name}`,
            );
          }

          // Add small delay between notifications to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `❌ Failed to send Telegram notification for ${airdrop.token}:`,
            errorMessage,
          );
        }
      }
    }

    console.log("✅ Sync completed:", {
      ...syncResult,
      notified,
    });

    // Get database counts
    const dbCounts = await prisma.airdrop.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const dbStats = {
      total: await prisma.airdrop.count(),
      byStatus: Object.fromEntries(
        dbCounts.map((item) => [item.status, item._count.status]),
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        source: syncResult.source,
        lastUpdate: syncResult.timestamp.toISOString(),
        duration: syncResult.duration,
        apiStats: stats,
        dbStats,
        syncResults: {
          total: tokens.length,
          created: syncResult.created,
          updated: syncResult.updated,
          unchanged: syncResult.unchanged,
          failed: syncResult.errors,
          notified,
        },
      },
    });
  } catch (error: unknown) {
    console.error("❌ Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Failed to sync from Alpha API",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/binance/alpha/real-sync
 * Force refresh and sync
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set("force", "true");
  return GET(new Request(url.toString()));
}
