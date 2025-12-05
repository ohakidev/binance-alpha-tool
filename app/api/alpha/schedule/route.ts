/**
 * Airdrop Schedule API Route
 * GET /api/alpha/schedule - Get today's and upcoming airdrops like alpha123.uk
 * POST /api/alpha/schedule - Add a manual schedule entry
 *
 * This API provides schedule data formatted like alpha123.uk displays
 */

import { NextResponse } from "next/server";
import { airdropScheduleService } from "@/lib/services/alpha/AirdropScheduleService";
import type { ScheduleStatus } from "@/lib/types/alpha.types";

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/schedule
 * Query params:
 * - type: "today" | "upcoming" | "all" (default: "all")
 * - limit: number (default: 20)
 * - status: ScheduleStatus filter
 * - chain: string filter
 * - token: string search
 * - sync: "true" to force sync before returning
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const statusFilter = searchParams.get("status") as ScheduleStatus | null;
    const chainFilter = searchParams.get("chain");
    const tokenSearch = searchParams.get("token");
    const shouldSync = searchParams.get("sync") === "true";

    console.log("📅 Schedule API request:", {
      type,
      limit,
      statusFilter,
      chainFilter,
      tokenSearch,
      shouldSync,
    });

    // Sync from Binance Alpha if requested
    if (shouldSync) {
      console.log("🔄 Syncing schedules from Binance Alpha...");
      await airdropScheduleService.syncFromBinanceAlpha();
    }

    // Update statuses based on current time
    await airdropScheduleService.updateAllStatuses();

    // Return based on type
    if (type === "today") {
      const today = await airdropScheduleService.getTodayAirdrops();
      return NextResponse.json({
        success: true,
        data: {
          today,
          count: today.length,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (type === "upcoming") {
      const upcoming = await airdropScheduleService.getUpcomingAirdrops(limit);
      return NextResponse.json({
        success: true,
        data: {
          upcoming,
          count: upcoming.length,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Return all (default)
    const response = await airdropScheduleService.getScheduleResponse();
    const stats = await airdropScheduleService.getStats();

    return NextResponse.json({
      success: true,
      data: {
        today: response.today,
        upcoming: response.upcoming,
        stats,
        lastUpdate: response.lastUpdate.toISOString(),
        source: response.source,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Schedule API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch schedules",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/alpha/schedule
 * Add a manual schedule entry
 *
 * Body:
 * {
 *   token: string (required)
 *   name: string (required)
 *   scheduledTime: string (ISO date, required)
 *   endTime?: string (ISO date)
 *   points?: number
 *   deductPoints?: number
 *   amount?: string
 *   chain?: string
 *   contractAddress?: string
 *   type?: "TGE" | "PRETGE" | "AIRDROP"
 *   estimatedPrice?: number
 *   estimatedValue?: number
 *   sourceUrl?: string
 *   logoUrl?: string
 *   description?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.token || !body.name || !body.scheduledTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: token, name, scheduledTime",
        },
        { status: 400 },
      );
    }

    // Parse dates
    const scheduledTime = new Date(body.scheduledTime);
    if (isNaN(scheduledTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid scheduledTime format. Use ISO date string.",
        },
        { status: 400 },
      );
    }

    let endTime: Date | undefined;
    if (body.endTime) {
      endTime = new Date(body.endTime);
      if (isNaN(endTime.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid endTime format. Use ISO date string.",
          },
          { status: 400 },
        );
      }
    }

    // Add manual schedule
    await airdropScheduleService.addManualSchedule({
      token: body.token,
      name: body.name,
      scheduledTime,
      endTime,
      points: body.points,
      deductPoints: body.deductPoints,
      amount: body.amount,
      chain: body.chain,
      contractAddress: body.contractAddress,
      type: body.type,
      estimatedPrice: body.estimatedPrice,
      estimatedValue: body.estimatedValue,
      sourceUrl: body.sourceUrl,
      logoUrl: body.logoUrl,
      description: body.description,
    });

    console.log(`✅ Manual schedule added: ${body.token} - ${body.name}`);

    return NextResponse.json({
      success: true,
      message: `Schedule added for ${body.token}`,
      data: {
        token: body.token,
        name: body.name,
        scheduledTime: scheduledTime.toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Add Schedule Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to add schedule",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/alpha/schedule
 * Cleanup old ended schedules
 *
 * Query params:
 * - daysOld: number (default: 30)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get("daysOld") || "30");

    const deleted = await airdropScheduleService.cleanupOldSchedules(daysOld);

    console.log(`🗑️ Cleaned up ${deleted} old schedules`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted} schedules older than ${daysOld} days`,
      deleted,
    });
  } catch (error) {
    console.error("❌ Cleanup Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to cleanup schedules",
      },
      { status: 500 },
    );
  }
}
