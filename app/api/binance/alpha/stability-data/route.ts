import { NextResponse } from "next/server";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Stability Data API Route - DexScreener Order Book Spread Version
 * Fetches Alpha tokens from Binance Alpha API
 * Uses DexScreener API to calculate real-time spread from liquidity depth
 *
 * Sorting Priority:
 * 1. Stable tokens (green) - lowest spread
 * 2. Moderate tokens (yellow)
 * 3. Unstable tokens (red)
 * 4. No trade tokens
 * 5. Within each group, sort by volume
 */

// API URLs
const BINANCE_ALPHA_API_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";
const DEXSCREENER_TOKEN_PAIRS_URL =
  "https://api.dexscreener.com/token-pairs/v1";

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 8000;

// Stability thresholds (in basis points) - adjusted for order book spread
const STABLE_THRESHOLD_BPS = 50; // 0.5% - very tight spread
const MODERATE_THRESHOLD_BPS = 200; // 2% - moderate spread

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 10000; // 10 seconds for fresher data

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Types
interface AlphaTokenRaw {
  symbol: string;
  name: string;
  alphaId: string;
  chainName: string;
  chainId: string;
  mulPoint: number;
  price: string;
  percentChange24h: string;
  volume24h: string;
  listingTime: number;
  priceHigh24h: string;
  priceLow24h: string;
  liquidity: string;
  marketCap: string;
  contractAddress?: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange?: {
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
}

type StabilityLevel =
  | "STABLE"
  | "MODERATE"
  | "UNSTABLE"
  | "NO_TRADE"
  | "CHECKING";

interface StabilityData {
  project: string;
  symbol: string;
  mulPoint: number;
  stability: StabilityLevel;
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
  isSpotPair: boolean;
  priceChange24h: number;
  sortPriority: number;
}

// Fetch with timeout helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Calculate 4x days remaining
function calculateFourXDaysRemaining(listingTimeMs: number): number {
  if (!listingTimeMs || listingTimeMs <= 0) return 0;

  const now = Date.now();
  const FOUR_X_PERIOD_DAYS = 30;

  // Calculate elapsed time
  const elapsedMs = now - listingTimeMs;
  if (elapsedMs < 0) return FOUR_X_PERIOD_DAYS;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysSinceListing = elapsedMs / MS_PER_DAY;

  // Use Math.ceil for partial day counting
  const daysRemaining = Math.ceil(FOUR_X_PERIOD_DAYS - daysSinceListing);

  return Math.max(0, daysRemaining);
}

/**
 * Calculate Order Book Spread from DexScreener liquidity data
 *
 * For AMM pools, the effective spread can be estimated using:
 * Spread ≈ 2 * (tradeSize / poolLiquidity) for constant product AMM
 *
 * We use a small trade size ($100) to estimate the minimum spread
 * This gives us the bid-ask equivalent spread for DEX tokens
 */
function calculateOrderBookSpread(
  liquidity: number,
  volume24h: number,
  priceUsd: number,
  txns24h: number,
): { spreadPercent: number; spreadBps: number } {
  // Default for no liquidity
  if (liquidity <= 0 || priceUsd <= 0) {
    return { spreadPercent: 0, spreadBps: 0 };
  }

  // Trade size for spread calculation ($100 equivalent)
  const tradeSize = 100;

  // For AMM constant product formula: price impact ≈ tradeSize / (liquidity / 2)
  // The effective spread is approximately 2x the price impact for a round trip
  const priceImpact = tradeSize / (liquidity / 2);

  // Adjust spread based on activity level
  // Higher volume relative to liquidity = tighter effective spread due to arbitrage
  let activityMultiplier = 1.0;
  if (volume24h > 0 && liquidity > 0) {
    const volumeToLiquidityRatio = volume24h / liquidity;
    // High activity means tighter spreads due to more arbitrage
    if (volumeToLiquidityRatio > 1) {
      activityMultiplier = 0.5; // Very active pool
    } else if (volumeToLiquidityRatio > 0.1) {
      activityMultiplier = 0.7; // Active pool
    } else if (volumeToLiquidityRatio < 0.01) {
      activityMultiplier = 1.5; // Low activity = wider spread
    }
  }

  // Transaction frequency adjustment
  // More transactions = more efficient price discovery = tighter spread
  if (txns24h > 1000) {
    activityMultiplier *= 0.6;
  } else if (txns24h > 100) {
    activityMultiplier *= 0.8;
  } else if (txns24h < 10) {
    activityMultiplier *= 1.3;
  }

  // Calculate final spread (in percentage)
  // We multiply by 100 to get percentage and by 2 for round-trip spread
  let spreadPercent = priceImpact * 100 * 2 * activityMultiplier;

  // Apply minimum spread based on typical DEX fees (0.3% for most AMMs)
  const minSpread = 0.03; // 0.03% minimum (3 bps)
  spreadPercent = Math.max(spreadPercent, minSpread);

  // Cap maximum spread at reasonable level
  const maxSpread = 50; // 50% max
  spreadPercent = Math.min(spreadPercent, maxSpread);

  const spreadBps = spreadPercent * 100;

  return {
    spreadPercent: Number(spreadPercent.toFixed(4)),
    spreadBps: Number(spreadBps.toFixed(2)),
  };
}

// Determine stability level based on spread
function determineStability(
  spreadBps: number,
  hasVolume: boolean,
  hasTrades: boolean,
): StabilityLevel {
  if (!hasTrades) return "NO_TRADE";
  if (spreadBps === 0 || !hasVolume) return "CHECKING";
  if (spreadBps < STABLE_THRESHOLD_BPS) return "STABLE";
  if (spreadBps < MODERATE_THRESHOLD_BPS) return "MODERATE";
  return "UNSTABLE";
}

// Get sort priority
function getStabilitySortPriority(stability: StabilityLevel): number {
  const priorities: Record<StabilityLevel, number> = {
    STABLE: 1,
    MODERATE: 2,
    UNSTABLE: 3,
    NO_TRADE: 4,
    CHECKING: 5,
  };
  return priorities[stability] ?? 6;
}

// Fetch DexScreener pair data for a token
async function fetchDexScreenerData(
  contractAddress: string,
  chainId: string = "bsc",
): Promise<DexScreenerPair | null> {
  if (!contractAddress) return null;

  const cacheKey = `dexscreener_${chainId}_${contractAddress}`;
  const cached = getCached<DexScreenerPair>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${DEXSCREENER_TOKEN_PAIRS_URL}/${chainId}/${contractAddress}`,
      {
        headers: { Accept: "application/json" },
      },
      5000,
    );

    if (!response.ok) return null;

    const pairs = (await response.json()) as DexScreenerPair[];

    if (!Array.isArray(pairs) || pairs.length === 0) return null;

    // Find the best pair (highest liquidity with USDT/USDC/WBNB quote)
    const stableQuotes = ["USDT", "USDC", "BUSD", "WBNB", "WETH"];
    const validPairs = pairs.filter(
      (p) =>
        p.liquidity?.usd > 0 && stableQuotes.includes(p.quoteToken?.symbol),
    );

    // Sort by liquidity and pick the best one
    validPairs.sort(
      (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0),
    );

    const bestPair = validPairs[0] || pairs[0];

    if (bestPair) {
      setCache(cacheKey, bestPair);
    }

    return bestPair;
  } catch {
    return null;
  }
}

// Process a single token
async function processToken(token: AlphaTokenRaw): Promise<StabilityData> {
  let price = parseFloat(token.price) || 0;
  const priceHigh24h = parseFloat(token.priceHigh24h) || 0;
  const priceLow24h = parseFloat(token.priceLow24h) || 0;
  let volume24h = parseFloat(token.volume24h) || 0;
  let liquidity = parseFloat(token.liquidity) || 0;
  let spreadPercent = 0;
  let spreadBps = 0;
  let priceChange24h = parseFloat(token.percentChange24h) || 0;
  let hasTrades = volume24h > 0;
  let txns24h = 0;

  // Try to get DexScreener data for better spread calculation
  if (token.contractAddress) {
    const chainId =
      token.chainName?.toLowerCase() === "bsc"
        ? "bsc"
        : token.chainName?.toLowerCase() === "ethereum"
          ? "ethereum"
          : token.chainName?.toLowerCase() === "solana"
            ? "solana"
            : "bsc";

    const dexData = await fetchDexScreenerData(token.contractAddress, chainId);

    if (dexData) {
      // Update with DexScreener data
      if (dexData.priceUsd) {
        price = parseFloat(dexData.priceUsd);
      }
      if (dexData.liquidity?.usd > 0) {
        liquidity = dexData.liquidity.usd;
      }
      if (dexData.volume?.h24 > 0) {
        volume24h = Math.max(volume24h, dexData.volume.h24);
      }
      if (dexData.priceChange?.h24 !== undefined) {
        priceChange24h = dexData.priceChange.h24;
      }

      // Calculate total transactions
      if (dexData.txns?.h24) {
        txns24h = dexData.txns.h24.buys + dexData.txns.h24.sells;
      }

      hasTrades =
        (dexData.txns?.h24?.buys || 0) + (dexData.txns?.h24?.sells || 0) > 0;

      // Calculate order book spread from DexScreener liquidity
      const spreadData = calculateOrderBookSpread(
        liquidity,
        volume24h,
        price,
        txns24h,
      );
      spreadPercent = spreadData.spreadPercent;
      spreadBps = spreadData.spreadBps;
    }
  }

  // Fallback: Calculate spread from 24h price range if no DexScreener data
  if (spreadBps === 0 && price > 0 && priceHigh24h > 0 && priceLow24h > 0) {
    // Use 5-minute volatility estimate as spread proxy
    // Typical relationship: spread ≈ 24h_range / 100 (rough approximation)
    const midPrice = (priceHigh24h + priceLow24h) / 2;
    const priceRange = priceHigh24h - priceLow24h;
    const rangePercent = (priceRange / midPrice) * 100;

    // Convert range to estimated spread (divide by time factor)
    // 24h has ~288 5-minute intervals, spread is typically range / sqrt(intervals)
    spreadPercent = rangePercent / Math.sqrt(288);
    spreadBps = spreadPercent * 100;

    // Apply minimum
    if (spreadBps < 3) spreadBps = 3;
    spreadPercent = spreadBps / 100;
  }

  const hasVolume = volume24h > 0;
  const stability = determineStability(spreadBps, hasVolume, hasTrades);
  const sortPriority = getStabilitySortPriority(stability);

  return {
    project: token.name || token.symbol,
    symbol: token.symbol,
    mulPoint: token.mulPoint,
    stability,
    spreadBps: Number(spreadBps.toFixed(2)),
    fourXDays: calculateFourXDaysRemaining(token.listingTime),
    price,
    priceHigh24h,
    priceLow24h,
    spreadPercent: Number(spreadPercent.toFixed(4)),
    lastUpdate: Date.now(),
    chain: token.chainName || "BSC",
    volume24h,
    liquidity,
    isSpotPair: false,
    priceChange24h,
    sortPriority,
  };
}

// Main GET handler
export async function GET() {
  try {
    // Fetch Binance Alpha token list
    const alphaResponse = await fetchWithTimeout(
      BINANCE_ALPHA_API_URL,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      },
      REQUEST_TIMEOUT,
    );

    if (!alphaResponse.ok) {
      // Return cached response if available
      const cachedResponse = getCached<StabilityData[]>("stability_data");
      if (cachedResponse) {
        return NextResponse.json({
          success: true,
          data: cachedResponse,
          count: cachedResponse.length,
          lastUpdate: Date.now(),
          fromCache: true,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch Binance Alpha data",
          data: [],
        },
        { status: 500 },
      );
    }

    const alphaData = await alphaResponse.json();

    // Binance Alpha API returns { code: "000000", data: [...tokens] }
    if (alphaData.code !== "000000" || !Array.isArray(alphaData.data)) {
      const cachedResponse = getCached<StabilityData[]>("stability_data");
      if (cachedResponse) {
        return NextResponse.json({
          success: true,
          data: cachedResponse,
          count: cachedResponse.length,
          lastUpdate: Date.now(),
          fromCache: true,
        });
      }
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        lastUpdate: Date.now(),
        fromCache: false,
      });
    }

    // Filter 4x multiplier tokens AND KOGE (1x baseline)
    const tokensToProcess = (alphaData.data as AlphaTokenRaw[]).filter(
      (t) => t.mulPoint === 4 || t.symbol === "KOGE",
    );

    // Process tokens in parallel with concurrency limit
    const BATCH_SIZE = 10;
    const stabilityData: StabilityData[] = [];

    for (let i = 0; i < tokensToProcess.length; i += BATCH_SIZE) {
      const batch = tokensToProcess.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((token: AlphaTokenRaw) => processToken(token)),
      );
      stabilityData.push(...batchResults);
    }

    // Sort by stability priority, then by spread (ascending)
    stabilityData.sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      // Within same stability, sort by spread (lower is better)
      return a.spreadBps - b.spreadBps;
    });

    // Calculate summary statistics
    let stableCount = 0;
    let moderateCount = 0;
    let unstableCount = 0;
    let noTradeCount = 0;
    let checkingCount = 0;
    let totalVolume = 0;
    let spreadSum = 0;
    let spreadCount = 0;

    for (const item of stabilityData) {
      switch (item.stability) {
        case "STABLE":
          stableCount++;
          break;
        case "MODERATE":
          moderateCount++;
          break;
        case "UNSTABLE":
          unstableCount++;
          break;
        case "NO_TRADE":
          noTradeCount++;
          break;
        case "CHECKING":
          checkingCount++;
          break;
      }
      totalVolume += item.volume24h || 0;
      if (item.spreadPercent > 0) {
        spreadSum += item.spreadPercent;
        spreadCount++;
      }
    }

    const avgSpread = spreadCount > 0 ? spreadSum / spreadCount : 0;

    // Cache the result
    setCache("stability_data", stabilityData);

    return NextResponse.json(
      {
        success: true,
        data: stabilityData,
        count: stabilityData.length,
        lastUpdate: Date.now(),
        filters: {
          mulPoint: 4,
          source: "DexScreener Order Book Spread",
        },
        summary: {
          stableCount,
          moderateCount,
          unstableCount,
          noTradeCount,
          checkingCount,
          totalVolume24h: totalVolume,
          avgSpreadPercent: Number(avgSpread.toFixed(2)),
          spreadMethod: "orderbook",
        },
        thresholds: {
          stable: STABLE_THRESHOLD_BPS,
          moderate: MODERATE_THRESHOLD_BPS,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Stability API error:", error);

    // Try to return cached data on error
    const cachedResponse = getCached<StabilityData[]>("stability_data");
    if (cachedResponse) {
      return NextResponse.json({
        success: true,
        data: cachedResponse,
        count: cachedResponse.length,
        lastUpdate: Date.now(),
        fromCache: true,
        error: "Partial failure - using cached data",
      });
    }

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
