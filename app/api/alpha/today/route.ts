/**
 * Today's Airdrops API Route
 * GET /api/alpha/today - Real-time today's airdrops like alpha123.uk
 *
 * This endpoint returns airdrops scheduled for today.
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
    timeZone: "Asia/Bangkok", // Thai timezone like alpha123.uk
  });
}

/**
 * GET /api/alpha/today
 * Returns today's airdrops - automatically updated by cron job
 */
export async function GET() {
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's airdrops from database (auto-synced by cron)
    const schedules = await (prisma as any).airdropSchedule.findMany({
      where: {
        scheduledTime: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
      orderBy: {
        scheduledTime: "asc",
      },
    });

    // Transform to display format like alpha123.uk
    const airdrops = schedules.map((schedule: any) => {
      // Determine current status
      let status: "upcoming" | "live" | "ended" = "upcoming";
      if (schedule.endTime && now > schedule.endTime) {
        status = "ended";
      } else if (now >= schedule.scheduledTime) {
        status = "live";
      }

      return {
        token: schedule.token,
        name: schedule.name,
        points: schedule.points,
        amount: schedule.amount,
        time: formatTime(schedule.scheduledTime),
        chain: schedule.chain,
        contractAddress: schedule.contractAddress,
        logoUrl: schedule.logoUrl,
        status,
        estimatedValue: schedule.estimatedValue,
        type: schedule.type,
      };
    });

    // Count by status
    const liveCount = airdrops.filter((a: any) => a.status === "live").length;
    const upcomingCount = airdrops.filter(
      (a: any) => a.status === "upcoming",
    ).length;
    const endedCount = airdrops.filter((a: any) => a.status === "ended").length;

    // Get next upcoming airdrop
    const nextAirdrop = airdrops.find((a: any) => a.status === "upcoming");

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
        liveCount,
        upcomingCount,
        endedCount,
        nextAirdrop: nextAirdrop
          ? {
              token: nextAirdrop.token,
              name: nextAirdrop.name,
              time: nextAirdrop.time,
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
