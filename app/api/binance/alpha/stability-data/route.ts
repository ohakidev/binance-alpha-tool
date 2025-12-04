import { NextResponse } from "next/server";

/**
 * Stability Data API Route
 * Fetches Alpha tokens from Binance Alpha API
 * Shows all 4x multiplier tokens with spread calculation from Alpha data
 */

const BINANCE_ALPHA_API_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";

interface AlphaTokenRaw {
  symbol: string;
  name: string;
  alphaId: string;
  chainName: string;
  mulPoint: number;
  price: string;
  percentChange24h: string;
  volume24h: string;
  listingTime: number;
  priceHigh24h: string;
  priceLow24h: string;
  liquidity: string;
  marketCap: string;
}

interface StabilityData {
  project: string;
  symbol: string;
  mulPoint: number;
  stability: "STABLE" | "UNSTABLE" | "CHECKING";
  spreadBps: number;
  fourXDays: number;
  price: number;
  priceHigh24h: number;
  priceLow24h: number;
  spreadPercent: number;
  lastUpdate: number;
  chain: string;
  volume24h: number;
  liquidity: number;
}

// Stability thresholds based on price range volatility
const STABILITY_THRESHOLD_BPS = 500; // 5% = stable for DEX tokens

/**
 * Calculate days since listing (4x period)
 */
function calculateFourXDays(listingTime: number | null): number {
  if (!listingTime || listingTime <= 0) return 0;

  const now = Date.now();

  // If listing is in the future, return 0
  if (listingTime > now) return 0;

  const diffMs = now - listingTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate spread from price range (high - low) / price
 * This simulates spread based on 24h price volatility
 */
function calculateSpreadFromPriceRange(
  price: number,
  priceHigh: number,
  priceLow: number,
): { spreadPercent: number; spreadBps: number } {
  if (price <= 0 || priceHigh <= 0 || priceLow <= 0) {
    return { spreadPercent: 0, spreadBps: 0 };
  }

  // Calculate spread as percentage of price range relative to current price
  const priceRange = priceHigh - priceLow;
  const spreadPercent = (priceRange / price) * 100;
  const spreadBps = spreadPercent * 100; // Convert to basis points

  return {
    spreadPercent: Number(spreadPercent.toFixed(4)),
    spreadBps: Number(spreadBps.toFixed(2)),
  };
}

export async function GET() {
  try {
    const alphaResponse = await fetch(BINANCE_ALPHA_API_URL, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!alphaResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Alpha API error: ${alphaResponse.status}`,
          data: [],
        },
        { status: alphaResponse.status },
      );
    }

    const alphaData = await alphaResponse.json();

    // Validate Alpha API response
    if (alphaData.code !== "000000" || !Array.isArray(alphaData.data)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Alpha API response",
          data: [],
        },
        { status: 500 },
      );
    }

    // Process Alpha tokens - filter only 4x multiplier
    const stabilityData: StabilityData[] = [];

    for (const token of alphaData.data as AlphaTokenRaw[]) {
      // Filter: Only 4x multiplier tokens
      if (token.mulPoint !== 4) {
        continue;
      }

      const price = parseFloat(token.price) || 0;
      const priceHigh24h = parseFloat(token.priceHigh24h) || 0;
      const priceLow24h = parseFloat(token.priceLow24h) || 0;
      const volume24h = parseFloat(token.volume24h) || 0;
      const liquidity = parseFloat(token.liquidity) || 0;

      // Calculate spread from price range
      const { spreadPercent, spreadBps } = calculateSpreadFromPriceRange(
        price,
        priceHigh24h,
        priceLow24h,
      );

      // Determine stability based on spread
      let stability: "STABLE" | "UNSTABLE" | "CHECKING" = "CHECKING";
      if (spreadBps > 0) {
        stability = spreadBps < STABILITY_THRESHOLD_BPS ? "STABLE" : "UNSTABLE";
      }

      stabilityData.push({
        project: token.name || token.symbol,
        symbol: token.symbol,
        mulPoint: token.mulPoint,
        stability,
        spreadBps,
        fourXDays: calculateFourXDays(token.listingTime),
        price,
        priceHigh24h,
        priceLow24h,
        spreadPercent,
        lastUpdate: Date.now(),
        chain: token.chainName || "BSC",
        volume24h,
        liquidity,
      });
    }

    // Sort by spreadBps (lower first = more stable), then by volume
    stabilityData.sort((a, b) => {
      // If both have spread data, sort by spread
      if (a.spreadBps > 0 && b.spreadBps > 0) {
        return a.spreadBps - b.spreadBps;
      }
      // Items with spread data come first
      if (a.spreadBps > 0) return -1;
      if (b.spreadBps > 0) return 1;
      // Sort by volume for items without spread
      return b.volume24h - a.volume24h;
    });

    return NextResponse.json({
      success: true,
      data: stabilityData,
      count: stabilityData.length,
      lastUpdate: Date.now(),
      filters: {
        mulPoint: 4,
        source: "Alpha DEX",
      },
    });
  } catch (error) {
    console.error("Stability data fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
      },
      { status: 500 },
    );
  }
}
