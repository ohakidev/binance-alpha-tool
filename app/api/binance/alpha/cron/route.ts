import { NextResponse } from "next/server";
import { alphaService } from "@/lib/services/alpha";
import { prisma } from "@/lib/prisma";
import { telegramService } from "@/lib/services/telegram";

/**
 * API Route: Auto-Sync Cron Job
 *
 * GET /api/binance/alpha/cron
 *
 * Uses the new AlphaService with OOP pattern for data fetching
 *
 * This endpoint is designed to be called by:
 * 1. Vercel Cron Jobs (in production)
 * 2. Client-side interval (in development)
 * 3. External cron service
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Features:
 * - Automatically syncs data from Alpha data sources
 * - Sends Telegram notifications for new airdrops
 * - Updates existing airdrops with latest data
 */
export async function GET(request: Request) {
  try {
    // Security check: Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || secret !== cronSecret) {
      console.error("❌ Unauthorized cron request");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    console.log(
      "⏰ Cron job triggered - Starting auto-sync from Alpha Service...",
    );

    // Use AlphaService to sync to database
    const syncResult = await alphaService.syncToDatabase();

    if (!syncResult.success && syncResult.errors > 0) {
      console.warn(`⚠️ Sync completed with ${syncResult.errors} errors`);
    }

    // Get stats from service
    const stats = await alphaService.getStats();
    console.log("📊 Stats:", stats);

    // Track notifications
    let notified = 0;

    // Send Telegram notifications for newly created airdrops
    if (syncResult.created > 0) {
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

    console.log("✅ Cron sync completed:", {
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
          total: stats.total,
          created: syncResult.created,
          updated: syncResult.updated,
          unchanged: syncResult.unchanged,
          failed: syncResult.errors,
          notified,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("❌ Cron job error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Cron job failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * POST method - Alternative trigger method
 */
export async function POST(request: Request) {
  return GET(request);
}
