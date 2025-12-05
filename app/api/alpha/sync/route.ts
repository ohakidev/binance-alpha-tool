/**
 * Airdrop Schedule Sync API Route
 * GET /api/alpha/sync - Get sync status
 * POST /api/alpha/sync - Trigger sync from Binance Alpha API
 *
 * This API syncs airdrop schedule data from Binance Alpha API
 */

import { NextResponse } from "next/server";
import { airdropScheduleService } from "@/lib/services/alpha/AirdropScheduleService";
import { alphaService } from "@/lib/services/alpha/AlphaService";
import { prisma } from "@/lib/db/prisma";

// Get the base URL for internal API calls
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/sync
 * Get sync status and statistics
 */
export async function GET() {
  try {
    // Get schedule statistics
    const scheduleStats = await airdropScheduleService.getStats();

    // Get Alpha service stats
    const alphaStats = await alphaService.getStats();

    // Get recent sync logs
    const recentSyncs = await (prisma as any).syncLog.findMany({
      where: {
        source: "binance-alpha",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get last successful sync
    const lastSuccessfulSync = await (prisma as any).syncLog.findFirst({
      where: {
        source: "binance-alpha",
        success: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        scheduleStats,
        alphaStats: {
          total: alphaStats.total,
          byStatus: alphaStats.byStatus,
          activeAirdrops: alphaStats.activeAirdrops,
          activeTGE: alphaStats.activeTGE,
        },
        lastSync: lastSuccessfulSync
          ? {
              timestamp: lastSuccessfulSync.createdAt.toISOString(),
              created: lastSuccessfulSync.created,
              updated: lastSuccessfulSync.updated,
              errors: lastSuccessfulSync.errors,
              duration: lastSuccessfulSync.duration,
            }
          : null,
        recentSyncs: recentSyncs.map((s: any) => ({
          timestamp: s.createdAt.toISOString(),
          action: s.action,
          success: s.success,
          tokensCount: s.tokensCount,
          created: s.created,
          updated: s.updated,
          errors: s.errors,
          duration: s.duration,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Sync Status Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get sync status",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/alpha/sync
 * Trigger sync from Binance Alpha API
 *
 * Query params:
 * - type: "schedules" | "tokens" | "all" | "full" (default: "full")
 *   - "full": Triggers the main cron job which does complete sync with Telegram notifications
 *   - "all": Syncs both tokens and schedules using AlphaService
 *   - "tokens": Only syncs tokens
 *   - "schedules": Only syncs schedules
 * - notify: "true" to send notifications for new airdrops (only for non-full sync)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syncType = searchParams.get("type") || "full";
    const shouldNotify = searchParams.get("notify") === "true";

    console.log("🔄 Starting sync...", { syncType, shouldNotify });

    // For "full" sync, trigger the cron job directly which handles everything
    if (syncType === "full") {
      console.log("🚀 Triggering full sync via cron job...");

      try {
        const baseUrl = getBaseUrl();
        const cronUrl = `${baseUrl}/api/cron/update-airdrops`;

        const response = await fetch(cronUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Allow the request in development
            ...(process.env.CRON_SECRET && {
              Authorization: `Bearer ${process.env.CRON_SECRET}`,
            }),
          },
        });

        const cronResult = await response.json();

        if (!response.ok) {
          throw new Error(cronResult.error || "Cron job failed");
        }

        return NextResponse.json({
          success: true,
          data: {
            syncType: "full",
            cronResult: cronResult.data,
            message: "Full sync completed via cron job",
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("❌ Failed to trigger cron job:", error);
        // Fall back to regular sync if cron fails
        console.log("⚠️ Falling back to regular sync...");
      }
    }

    const results: {
      schedules?: {
        success: boolean;
        created: number;
        updated: number;
        errors: number;
        duration: number;
      };
      tokens?: {
        success: boolean;
        created: number;
        updated: number;
        errors: number;
        duration: number;
      };
    } = {};

    // Sync tokens from Binance Alpha
    if (syncType === "tokens" || syncType === "all" || syncType === "full") {
      console.log("📦 Syncing tokens from Binance Alpha...");
      const tokenResult = await alphaService.syncToDatabase();
      results.tokens = {
        success: tokenResult.success,
        created: tokenResult.created,
        updated: tokenResult.updated,
        errors: tokenResult.errors,
        duration: tokenResult.duration,
      };
    }

    // Sync schedules
    if (syncType === "schedules" || syncType === "all" || syncType === "full") {
      console.log("📅 Syncing schedules...");
      const scheduleResult =
        await airdropScheduleService.syncFromBinanceAlpha();
      results.schedules = {
        success: scheduleResult.success,
        created: scheduleResult.created,
        updated: scheduleResult.updated,
        errors: scheduleResult.errors,
        duration: scheduleResult.duration,
      };
    }

    // Update all schedule statuses
    await airdropScheduleService.updateAllStatuses();

    // Send notifications if requested
    let notified = 0;
    if (shouldNotify) {
      const schedulesForNotification =
        await airdropScheduleService.getSchedulesForNotification();
      console.log(
        `📤 Found ${schedulesForNotification.length} schedules for notification`,
      );

      // Here you would integrate with your notification service
      // For now, just mark them as notified
      for (const schedule of schedulesForNotification) {
        if (schedule.id) {
          await airdropScheduleService.markAsNotified(schedule.id);
          notified++;
        }
      }
    }

    // Get updated stats
    const scheduleStats = await airdropScheduleService.getStats();

    console.log("✅ Sync completed:", results);

    return NextResponse.json({
      success: true,
      data: {
        syncType,
        results,
        notified,
        currentStats: scheduleStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Sync Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}
