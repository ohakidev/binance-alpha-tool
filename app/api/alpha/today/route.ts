/**
 * Today's Airdrops API Route
 * GET /api/alpha/today - Redirects to /api/alpha/schedule?type=today
 *
 * This endpoint is a convenience alias for the schedule API.
 * For more options, use /api/alpha/schedule directly.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/today
 * Redirects to schedule API with type=today filter
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const scheduleUrl = `${origin}/api/alpha/schedule?type=today`;

  try {
    const response = await fetch(scheduleUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Transform response to match the original today endpoint format
    if (data.success && data.data?.today) {
      return NextResponse.json({
        success: true,
        data: {
          airdrops: data.data.today,
          count: data.data.today.length,
          liveCount: data.data.today.filter(
            (a: { status: string }) => a.status === "live",
          ).length,
          upcomingCount: data.data.today.filter(
            (a: { status: string }) => a.status === "upcoming",
          ).length,
          endedCount: data.data.today.filter(
            (a: { status: string }) => a.status === "ended",
          ).length,
          nextAirdrop:
            data.data.today.find(
              (a: { status: string }) => a.status === "upcoming",
            ) || null,
          stats: data.data.stats || {},
          lastSync: data.data.lastUpdate || null,
        },
        timestamp: data.timestamp || new Date().toISOString(),
        autoSync: true,
        _redirectedFrom: "/api/alpha/schedule?type=today",
      });
    }

    return NextResponse.json(data);
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
