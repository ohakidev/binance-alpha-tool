/**
 * Today's Airdrops API Route
 * GET /api/alpha/today - Get today's airdrops directly from database
 *
 * Optimized to query database directly instead of calling another API
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/today
 * Get today's airdrops directly from database
 */
export async function GET() {
  try {
    // Get today's date range (start and end of day in UTC)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Query directly from airdropSchedule table
    const todayAirdrops = await prisma.airdropSchedule.findMany({
      where: {
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isActive: true,
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });

    // Count by status
    const liveCount = todayAirdrops.filter((a) => a.status === "LIVE").length;
    const upcomingCount = todayAirdrops.filter(
      (a) => a.status === "UPCOMING" || a.status === "TODAY",
    ).length;
    const endedCount = todayAirdrops.filter(
      (a) => a.status === "ENDED" || a.status === "CANCELLED",
    ).length;

    // Find next upcoming airdrop
    const nextAirdrop =
      todayAirdrops.find(
        (a) =>
          (a.status === "UPCOMING" || a.status === "TODAY") &&
          new Date(a.scheduledTime) > now,
      ) || null;

    return NextResponse.json({
      success: true,
      data: {
        airdrops: todayAirdrops,
        count: todayAirdrops.length,
        liveCount,
        upcomingCount,
        endedCount,
        nextAirdrop,
        stats: {
          total: todayAirdrops.length,
          live: liveCount,
          upcoming: upcomingCount,
          ended: endedCount,
        },
        lastSync: now.toISOString(),
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Today API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch today's airdrops",
      },
      { status: 500 },
    );
  }
}
