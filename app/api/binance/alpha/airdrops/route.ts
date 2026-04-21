/**
 * Database-backed Binance Alpha event API.
 */

import { NextResponse } from "next/server";
import { airdropCalculator } from "@/lib/services/airdrop-calculator";
import { binanceEventTrackerService } from "@/lib/services/alpha/BinanceEventTrackerService";

export const dynamic = "force-dynamic";

const AIRDROPS_API_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const chain = searchParams.get("chain");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      1000,
    );

    const rows = await binanceEventTrackerService.getApiRows({
      status,
      chain,
      limit,
    });

    const data = rows.map((row) => ({
      ...binanceEventTrackerService.buildUiRow(row),
      sourceUrl: row.sourceUrl,
      confidence: row.confidence,
      requiredPoints: row.requiredPoints ?? 0,
      deductPoints: row.deductPoints ?? 0,
      airdropAmount: row.airdropAmount || "TBA",
    }));

    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length,
        source: "database",
        timestamp: new Date().toISOString(),
      },
      {
        headers: AIRDROPS_API_CACHE_HEADERS,
      },
    );
  } catch (error) {
    console.error("Airdrops API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch airdrops",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const airdrop = await airdropCalculator.createAirdrop({
      name: body.name || body.projectName,
      token: body.symbol || body.token,
      chain: body.chain,
      description: body.description,
      eligibility: body.eligibility || [],
      requirements: body.requirements || [],
      snapshotDate: body.snapshotDate ? new Date(body.snapshotDate) : undefined,
      claimStartDate:
        body.claimStartDate || body.dropTime
          ? new Date(body.claimStartDate || body.dropTime)
          : undefined,
      claimEndDate: body.claimEndDate ? new Date(body.claimEndDate) : undefined,
      estimatedValue: body.estimatedValue,
      websiteUrl: body.website || body.websiteUrl,
      twitterUrl: body.twitter || body.twitterUrl,
    });

    return NextResponse.json({
      success: true,
      data: airdrop,
    });
  } catch (error) {
    console.error("Create Airdrop Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create airdrop",
      },
      { status: 500 },
    );
  }
}
