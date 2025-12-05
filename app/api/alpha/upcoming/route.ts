/**
 * Upcoming Airdrops API Route
 * GET /api/alpha/upcoming - Real-time upcoming airdrops like alpha123.uk
 *
 * This endpoint returns upcoming airdrops (future dates).
 * Data is automatically synced by cron job every 5 minutes.
 * No manual sync needed - just read from database.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * Format time to display format (e.g., "05:00 PM")
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Bangkok",
  });
}

/**
 * Format date to display format (e.g., "2024-01-15")
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate days until a date
 */
function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * GET /api/alpha/upcoming
 * Returns upcoming airdrops - automatically updated by cron job
 *
 * Query params:
 * - limit: number (default: 20)
 * - chain: string - Filter by chain
 * - days: number - Only show airdrops within X days
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const chainFilter = searchParams.get("chain");
    const daysFilter = searchParams.get("days")
      ? parseInt(searchParams.get("days")!)
      : undefined;

    // Get tomorrow's start (upcoming = future dates, not today)
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build where clause
    const where: any = {
      scheduledTime: {
        gte: tomorrow,
      },
      isActive: true,
      status: {
        in: ["UPCOMING"],
      },
    };

    // Add chain filter
    if (chainFilter) {
      where.chain = chainFilter;
    }

    // Add days filter
    if (daysFilter) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + daysFilter);
      where.scheduledTime.lte = maxDate;
    }

    // Get upcoming airdrops from database (auto-synced by cron)
    const schedules = await (prisma as any).airdropSchedule.findMany({
      where,
      orderBy: {
        scheduledTime: "asc",
      },
      take: limit,
    });

    // Transform to display format like alpha123.uk
    const airdrops = schedules.map((schedule: any) => ({
      token: schedule.token,
      name: schedule.name,
      points: schedule.points,
      amount: schedule.amount,
      date: formatDate(schedule.scheduledTime),
      time: formatTime(schedule.scheduledTime),
      chain: schedule.chain,
      contractAddress: schedule.contractAddress,
      logoUrl: schedule.logoUrl,
      daysUntil: daysUntil(schedule.scheduledTime),
      estimatedValue: schedule.estimatedValue,
      type: schedule.type,
    }));

    // Group by date for display
    const byDate: Record<
      string,
      {
        date: string;
        count: number;
        airdrops: typeof airdrops;
      }
    > = {};

    airdrops.forEach((airdrop: any) => {
      if (!byDate[airdrop.date]) {
        byDate[airdrop.date] = {
          date: airdrop.date,
          count: 0,
          airdrops: [],
        };
      }
      byDate[airdrop.date].count++;
      byDate[airdrop.date].airdrops.push(airdrop);
    });

    // Get unique chains
    const chains = [...new Set(airdrops.map((a: any) => a.chain))];

    // Get next airdrop
    const nextAirdrop = airdrops.length > 0 ? airdrops[0] : null;

    // Get total stats
    const stats = await (prisma as any).airdropSchedule.groupBy({
      by: ["status"],
      where: { isActive: true },
      _count: { status: true },
    });

    const totalStats = {
      today: 0,
      upcoming: 0,
      live: 0,
    };

    stats.forEach((s: any) => {
      switch (s.status) {
        case "TODAY":
          totalStats.today = s._count.status;
          break;
        case "UPCOMING":
          totalStats.upcoming = s._count.status;
          break;
        case "LIVE":
          totalStats.live = s._count.status;
          break;
      }
    });

    // Get last sync time
    const lastSync = await (prisma as any).syncLog.findFirst({
      where: { source: "cron-auto-sync", success: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        airdrops,
        count: airdrops.length,
        byDate: Object.values(byDate),
        uniqueDates: Object.keys(byDate).length,
        chains,
        nextAirdrop: nextAirdrop
          ? {
              token: nextAirdrop.token,
              name: nextAirdrop.name,
              date: nextAirdrop.date,
              time: nextAirdrop.time,
              daysUntil: nextAirdrop.daysUntil,
              chain: nextAirdrop.chain,
            }
          : null,
        stats: totalStats,
        lastSync: lastSync?.createdAt?.toISOString() || null,
      },
      timestamp: new Date().toISOString(),
      // Data is auto-synced by cron every 5 minutes
      autoSync: true,
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
