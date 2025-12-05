/**
 * Upcoming Airdrops API Route
 * GET /api/alpha/upcoming - Redirects to /api/alpha/schedule?type=upcoming
 *
 * This endpoint is a convenience alias for the schedule API.
 * For more options, use /api/alpha/schedule directly.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/upcoming
 * Redirects to schedule API with type=upcoming filter
 *
 * Query params (passed through):
 * - limit: number (default: 20)
 * - chain: string - Filter by chain
 * - days: number - Only show airdrops within X days
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);

  // Build schedule URL with type=upcoming and pass through other params
  const scheduleParams = new URLSearchParams();
  scheduleParams.set("type", "upcoming");

  // Pass through optional params
  const limit = searchParams.get("limit");
  if (limit) scheduleParams.set("limit", limit);

  const chain = searchParams.get("chain");
  if (chain) scheduleParams.set("chain", chain);

  const scheduleUrl = `${origin}/api/alpha/schedule?${scheduleParams.toString()}`;

  try {
    const response = await fetch(scheduleUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Transform response to match the original upcoming endpoint format
    if (data.success && data.data?.upcoming) {
      const airdrops = data.data.upcoming;

      // Group by date for display
      const byDate: Record<
        string,
        {
          date: string;
          count: number;
          airdrops: typeof airdrops;
        }
      > = {};

      airdrops.forEach((airdrop: { date: string }) => {
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
      const chains = [
        ...new Set(airdrops.map((a: { chain: string }) => a.chain)),
      ];

      // Get next airdrop
      const nextAirdrop = airdrops.length > 0 ? airdrops[0] : null;

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
          stats: data.data.stats || {},
          lastSync: data.data.lastUpdate || null,
        },
        timestamp: data.timestamp || new Date().toISOString(),
        autoSync: true,
        _redirectedFrom: `/api/alpha/schedule?type=upcoming`,
      });
    }

    return NextResponse.json(data);
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
