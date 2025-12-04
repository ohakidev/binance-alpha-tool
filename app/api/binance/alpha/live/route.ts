/**
 * Live Binance Alpha Data API
 * Fetches real-time data directly from Alpha Service
 * No database interaction - returns fresh data from API sources
 *
 * GET /api/binance/alpha/live
 * Query params:
 * - force: boolean (force refresh cache)
 * - status: string (filter by status: CLAIMABLE, UPCOMING, ENDED)
 * - chain: string (filter by chain: BSC, Ethereum, etc.)
 * - limit: number (limit results, default: 100)
 * - offset: number (offset for pagination, default: 0)
 */

import { NextResponse } from "next/server";
import { alphaService } from "@/lib/services/alpha";
import { AirdropStatus } from "@prisma/client";
import type { ChainName } from "@/lib/types/alpha.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";
    const statusFilter = searchParams.get("status")?.toUpperCase() as
      | AirdropStatus
      | undefined;
    const chainFilter = searchParams.get("chain");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("📡 Fetching live Alpha data...", {
      forceRefresh,
      statusFilter,
      chainFilter,
      limit,
      offset,
    });

    // Use AlphaService with filters
    const response = await alphaService.getFilteredTokens(
      {
        status: statusFilter,
        chain: chainFilter ? (chainFilter as ChainName) : undefined,
        limit,
        offset,
        sortBy: "score",
        sortOrder: "desc",
      },
      forceRefresh,
    );

    // Get total count without pagination
    const allResponse = await alphaService.getFilteredTokens(
      {
        status: statusFilter,
        chain: chainFilter ? (chainFilter as ChainName) : undefined,
      },
      false,
    );
    const total = allResponse.count;

    // Get stats
    const stats = await alphaService.getStats();

    return NextResponse.json({
      success: true,
      data: {
        source: response.source,
        lastUpdate: response.lastUpdate.toISOString(),
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        tokens: response.data.map((t) => ({
          symbol: t.symbol,
          name: t.name,
          chain: t.chain,
          chainId: t.chainId,
          contractAddress: t.contractAddress,
          alphaId: t.alphaId,
          price: t.price,
          priceChange24h: t.priceChange24h,
          volume24h: t.volume24h,
          marketCap: t.marketCap,
          liquidity: t.liquidity,
          holders: t.holders,
          score: t.score,
          mulPoint: t.mulPoint,
          listingTime: t.listingTime?.toISOString() || null,
          onlineTge: t.onlineTge,
          onlineAirdrop: t.onlineAirdrop,
          type: t.type,
          status: t.status,
          estimatedValue: t.estimatedValue,
          iconUrl: t.iconUrl,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("❌ Live data fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage || "Failed to fetch live Alpha data",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
