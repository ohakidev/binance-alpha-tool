/**
 * Live Airdrops API Route
 * GET /api/alpha/live - Real-time airdrop data from Binance Alpha API
 *
 * This endpoint provides live data directly from Binance Alpha API
 * without database storage for fastest response
 */

import { NextResponse } from "next/server";
import { alphaService } from "@/lib/services/alpha/AlphaService";
import { airdropScheduleService } from "@/lib/services/alpha/AirdropScheduleService";

export const dynamic = "force-dynamic";

/**
 * GET /api/alpha/live
 * Query params:
 * - force: "true" to force refresh cache
 * - status: "CLAIMABLE" | "UPCOMING" | "ENDED" - Filter by status
 * - chain: string - Filter by chain (e.g., "BSC", "Ethereum")
 * - airdrop: "true" to only show tokens with active airdrops
 * - tge: "true" to only show tokens with active TGE
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";
    const statusFilter = searchParams.get("status");
    const chainFilter = searchParams.get("chain");
    const airdropOnly = searchParams.get("airdrop") === "true";
    const tgeOnly = searchParams.get("tge") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("📡 Live API request:", {
      forceRefresh,
      statusFilter,
      chainFilter,
      airdropOnly,
      tgeOnly,
      limit,
      offset,
    });

    // Get tokens from Alpha Service
    const response = await alphaService.getTokens(forceRefresh);
    let tokens = response.data;

    // Apply filters
    if (statusFilter) {
      tokens = tokens.filter(
        (t) => t.status.toUpperCase() === statusFilter.toUpperCase(),
      );
    }

    if (chainFilter) {
      tokens = tokens.filter(
        (t) => t.chain.toLowerCase() === chainFilter.toLowerCase(),
      );
    }

    if (airdropOnly) {
      tokens = tokens.filter((t) => t.onlineAirdrop);
    }

    if (tgeOnly) {
      tokens = tokens.filter((t) => t.onlineTge);
    }

    // Get total before pagination
    const total = tokens.length;

    // Apply pagination
    tokens = tokens.slice(offset, offset + limit);

    // Get schedule stats for additional context
    const scheduleStats = await airdropScheduleService.getStats();

    // Get Alpha service stats
    const alphaStats = await alphaService.getStats();

    // Format response like alpha123.uk
    const formattedTokens = tokens.map((token) => ({
      // Basic info
      token: token.symbol,
      name: token.name,
      chain: token.chain,
      chainId: token.chainId,
      contractAddress: token.contractAddress,

      // Alpha specific
      alphaId: token.alphaId,
      score: token.score,
      mulPoint: token.mulPoint,

      // Price data
      price: token.price,
      priceChange24h: token.priceChange24h,
      priceHigh24h: token.priceHigh24h,
      priceLow24h: token.priceLow24h,
      volume24h: token.volume24h,

      // Market data
      marketCap: token.marketCap,
      fdv: token.fdv,
      liquidity: token.liquidity,
      holders: token.holders,

      // Status flags
      onlineAirdrop: token.onlineAirdrop,
      onlineTge: token.onlineTge,
      hotTag: token.hotTag,
      isOffline: token.isOffline,

      // Type and status
      type: token.type,
      status: token.status,

      // Time
      listingTime: token.listingTime?.toISOString() || null,
      time: token.listingTime
        ? token.listingTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : null,

      // Value
      estimatedValue: token.estimatedValue,

      // Icon
      iconUrl: token.iconUrl,
    }));

    // Separate into today and upcoming (like alpha123.uk)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAirdrops = formattedTokens.filter((t) => {
      if (!t.listingTime) return t.onlineAirdrop || t.onlineTge;
      const listingDate = new Date(t.listingTime);
      return listingDate >= today && listingDate < tomorrow;
    });

    const upcomingAirdrops = formattedTokens.filter((t) => {
      if (!t.listingTime) return false;
      const listingDate = new Date(t.listingTime);
      return listingDate >= tomorrow;
    });

    const liveAirdrops = formattedTokens.filter((t) => {
      if (!t.listingTime) return false;
      const listingDate = new Date(t.listingTime);
      return listingDate < now && (t.onlineAirdrop || t.onlineTge);
    });

    return NextResponse.json({
      success: true,
      data: {
        // All tokens
        tokens: formattedTokens,
        total,

        // Categorized like alpha123.uk
        today: {
          count: todayAirdrops.length,
          airdrops: todayAirdrops,
        },
        upcoming: {
          count: upcomingAirdrops.length,
          airdrops: upcomingAirdrops,
        },
        live: {
          count: liveAirdrops.length,
          airdrops: liveAirdrops,
        },

        // Pagination
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },

        // Stats
        stats: {
          alpha: {
            total: alphaStats.total,
            activeAirdrops: alphaStats.activeAirdrops,
            activeTGE: alphaStats.activeTGE,
            byStatus: alphaStats.byStatus,
          },
          schedule: scheduleStats,
        },

        // Source info
        source: response.source,
        lastUpdate: response.lastUpdate.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Live API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch live airdrop data",
      },
      { status: 500 },
    );
  }
}
