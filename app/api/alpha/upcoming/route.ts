/**
 * Upcoming Airdrops API Route
 * GET /api/alpha/upcoming - Get upcoming airdrops directly from database
 *
 * Optimized to query database directly instead of calling another API
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/upcoming
 * Get upcoming airdrops directly from database
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const chain = searchParams.get("chain");

    const now = new Date();

    // Build where clause
    const where: Record<string, unknown> = {
      scheduledTime: {
        gt: now,
      },
      isActive: true,
      status: {
        in: ["UPCOMING", "SCHEDULED"],
      },
    };

    // Add chain filter if provided
    if (chain) {
      where.chain = chain;
    }

    // Query directly from airdropSchedule table
    const upcomingAirdrops = await prisma.airdropSchedule.findMany({
      where,
      orderBy: {
        scheduledTime: "asc",
      },
      take: limit,
    });

    // Get total count for pagination info
    const totalCount = await prisma.airdropSchedule.count({ where });

    // Group by date for better organization
    const groupedByDate: Record<string, typeof upcomingAirdrops> = {};
    upcomingAirdrops.forEach((airdrop) => {
      const dateKey = new Date(airdrop.scheduledTime)
        .toISOString()
        .split("T")[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(airdrop);
    });

    // Find the next airdrop (soonest)
    const nextAirdrop = upcomingAirdrops[0] || null;

    // Calculate time until next airdrop
    let timeUntilNext = null;
    if (nextAirdrop) {
      const diff =
        new Date(nextAirdrop.scheduledTime).getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeUntilNext = {
        milliseconds: diff,
        hours,
        minutes,
        formatted: `${hours}h ${minutes}m`,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        airdrops: upcomingAirdrops,
        groupedByDate,
        count: upcomingAirdrops.length,
        totalCount,
        nextAirdrop,
        timeUntilNext,
        stats: {
          total: totalCount,
          returned: upcomingAirdrops.length,
          hasMore: totalCount > upcomingAirdrops.length,
        },
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Upcoming API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch upcoming airdrops",
      },
      { status: 500 },
    );
  }
}
