import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Stability Data API - Optimized Version
 *
 * Improvements:
 * - Smarter caching with stale-while-revalidate
 * - Parallel fetching with controlled concurrency
 * - Lighter response payload
 * - Better rate limiting with sliding window
 * - Memory-efficient data structures
 */

// API URLs
const BINANCE_ALPHA_API_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";
const BINANCE_ALPHA_AGG_TRADES_URL =
  "https://www.binance.com/bapi/defi/v1/public/alpha-trade/agg-trades";

// Config - Optimized for lower server load
const MAX_TOKENS = 8;
const REQUEST_TIMEOUT = 3000;
const TRADE_LIMIT = 30; // Reduced from 50
const CACHE_TTL = 4000; // 4 seconds fresh
const STALE_TTL = 10000; // 10 seconds stale-while-revalidate
const CONCURRENT_REQUESTS = 4; // Limit parallel requests

// Stability thresholds (bps)
const STABLE_THRESHOLD = 5;
const MODERATE_THRESHOLD = 50;

// Types
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
}

interface Trade {
  p: string;
  q: string;
  T: number;
}

type StabilityLevel = "STABLE" | "MODERATE" | "UNSTABLE" | "NO_TRADE";

interface TokenWithStability {
  symbol: string;
  name: string;
  chain: string;
  mulPoint: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fourXDays: number;
  tradeSymbol: string;
  stability: StabilityLevel;
  spreadBps: number;
  tradeCount: number;
  lastTradeTime: number;
  avgPrice: number;
  stdDev: number;
}

interface CacheEntry {
  data: TokenWithStability[];
  timestamp: number;
  isRefreshing: boolean;
}

// Cache with stale-while-revalidate support
let cache: CacheEntry = {
  data: [],
  timestamp: 0,
  isRefreshing: false,
};

// Rate limiting with sliding window
const rateLimitWindow = new Map<
  string,
  { timestamps: number[]; blocked: boolean }
>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 30000; // 30 second window
const BLOCK_DURATION = 60000; // 1 minute block

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let record = rateLimitWindow.get(ip);

  if (!record) {
    record = { timestamps: [], blocked: false };
    rateLimitWindow.set(ip, record);
  }

  // Check if blocked
  if (record.blocked) {
    const oldestBlock = record.timestamps[0];
    if (now - oldestBlock < BLOCK_DURATION) {
      return {
        allowed: false,
        retryAfter: Math.ceil((BLOCK_DURATION - (now - oldestBlock)) / 1000),
      };
    }
    record.blocked = false;
    record.timestamps = [];
  }

  // Clean old timestamps
  record.timestamps = record.timestamps.filter((t) => now - t < RATE_WINDOW);

  // Check rate limit
  if (record.timestamps.length >= RATE_LIMIT) {
    record.blocked = true;
    return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION / 1000) };
  }

  record.timestamps.push(now);
  return { allowed: true };
}

// Calculate 4x days remaining
function calcFourXDays(listingTime: number): number {
  if (!listingTime) return 0;
  const days = Math.ceil((Date.now() - listingTime) / 86400000);
  return Math.max(0, 30 - days);
}

// Optimized fetch with timeout and abort
async function fetchWithTimeout(
  url: string,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": "Mozilla/5.0",
        Connection: "keep-alive",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Fetch trades with retry
async function fetchTrades(tradeSymbol: string, retries = 1): Promise<Trade[]> {
  for (let i = 0; i <= retries; i++) {
    try {
      const url = `${BINANCE_ALPHA_AGG_TRADES_URL}?symbol=${tradeSymbol}&limit=${TRADE_LIMIT}`;
      const res = await fetchWithTimeout(url, 2500);

      if (!res.ok) {
        if (i === retries) return [];
        continue;
      }

      const data = await res.json();
      return data?.data || [];
    } catch {
      if (i === retries) return [];
    }
  }
  return [];
}

/**
 * Calculate Spread BPS using Standard Deviation
 * Optimized with early returns and minimal allocations
 */
function calculateSpreadBps(trades: Trade[]): {
  spreadBps: number;
  avgPrice: number;
  stdDev: number;
  tradeCount: number;
  lastTradeTime: number;
} {
  const len = trades.length;

  if (len < 2) {
    return {
      spreadBps: 0,
      avgPrice: len > 0 ? parseFloat(trades[0].p) : 0,
      stdDev: 0,
      tradeCount: len,
      lastTradeTime: trades[0]?.T || 0,
    };
  }

  // Use recent trades only (last 45 seconds for faster response)
  const now = Date.now();
  const recentCutoff = now - 45000;

  let sum = 0;
  let count = 0;
  let lastTime = 0;

  // First pass: calculate sum and find recent trades
  const prices: number[] = [];
  for (let i = len - 1; i >= 0 && count < 20; i--) {
    const trade = trades[i];
    if (trade.T >= recentCutoff || count < 5) {
      const price = parseFloat(trade.p);
      if (price > 0) {
        prices.push(price);
        sum += price;
        count++;
        if (trade.T > lastTime) lastTime = trade.T;
      }
    }
  }

  if (count < 2) {
    return {
      spreadBps: 0,
      avgPrice: sum / Math.max(count, 1),
      stdDev: 0,
      tradeCount: count,
      lastTradeTime: lastTime,
    };
  }

  const avgPrice = sum / count;

  if (avgPrice === 0) {
    return {
      spreadBps: 0,
      avgPrice: 0,
      stdDev: 0,
      tradeCount: count,
      lastTradeTime: lastTime,
    };
  }

  // Second pass: calculate variance
  let squaredDiffSum = 0;
  for (const price of prices) {
    const diff = price - avgPrice;
    squaredDiffSum += diff * diff;
  }

  const stdDev = Math.sqrt(squaredDiffSum / count);
  const spreadBps = Math.round((stdDev / avgPrice) * 10000 * 100) / 100;

  return {
    spreadBps,
    avgPrice,
    stdDev,
    tradeCount: count,
    lastTradeTime: lastTime,
  };
}

// Determine stability level
function getStability(spreadBps: number, tradeCount: number): StabilityLevel {
  if (tradeCount < 2) return "NO_TRADE";
  if (spreadBps < STABLE_THRESHOLD) return "STABLE";
  if (spreadBps < MODERATE_THRESHOLD) return "MODERATE";
  return "UNSTABLE";
}

// Process single token
async function processToken(token: AlphaTokenRaw): Promise<TokenWithStability> {
  const numericId = token.alphaId.replace(/^ALPHA_/i, "");
  const tradeSymbol = `ALPHA_${numericId}USDT`;

  const trades = await fetchTrades(tradeSymbol);
  const { spreadBps, avgPrice, stdDev, tradeCount, lastTradeTime } =
    calculateSpreadBps(trades);
  const stability = getStability(spreadBps, tradeCount);

  return {
    symbol: token.symbol,
    name: token.name,
    chain: token.chainName || "BSC",
    mulPoint: token.mulPoint,
    price: avgPrice > 0 ? avgPrice : parseFloat(token.price) || 0,
    priceChange24h: parseFloat(token.percentChange24h) || 0,
    volume24h: parseFloat(token.volume24h) || 0,
    fourXDays: calcFourXDays(token.listingTime),
    tradeSymbol,
    stability,
    spreadBps,
    tradeCount,
    lastTradeTime,
    avgPrice,
    stdDev,
  };
}

// Process tokens with controlled concurrency
async function processTokensWithConcurrency(
  tokens: AlphaTokenRaw[],
): Promise<TokenWithStability[]> {
  const results: TokenWithStability[] = [];
  const chunks: AlphaTokenRaw[][] = [];

  // Split into chunks for controlled concurrency
  for (let i = 0; i < tokens.length; i += CONCURRENT_REQUESTS) {
    chunks.push(tokens.slice(i, i + CONCURRENT_REQUESTS));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map((t) => processToken(t)),
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
}

// Sort tokens: KOGE first, then by stability, then by spread
function sortTokens(tokens: TokenWithStability[]): TokenWithStability[] {
  const stabilityOrder: Record<StabilityLevel, number> = {
    STABLE: 1,
    MODERATE: 2,
    UNSTABLE: 3,
    NO_TRADE: 4,
  };

  return tokens.sort((a, b) => {
    if (a.symbol === "KOGE") return -1;
    if (b.symbol === "KOGE") return 1;

    const aOrder = stabilityOrder[a.stability];
    const bOrder = stabilityOrder[b.stability];

    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.spreadBps - b.spreadBps;
  });
}

// Background refresh function
async function refreshCache(): Promise<void> {
  if (cache.isRefreshing) return;

  cache.isRefreshing = true;

  try {
    const listRes = await fetchWithTimeout(BINANCE_ALPHA_API_URL);

    if (!listRes.ok) {
      cache.isRefreshing = false;
      return;
    }

    const listData = await listRes.json();

    if (listData.code !== "000000" || !Array.isArray(listData.data)) {
      cache.isRefreshing = false;
      return;
    }

    const eligibleTokens = (listData.data as AlphaTokenRaw[])
      .filter((t) => t.mulPoint === 4 || t.symbol === "KOGE")
      .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
      .slice(0, MAX_TOKENS);

    const processedTokens = await processTokensWithConcurrency(eligibleTokens);
    const sortedTokens = sortTokens(processedTokens);

    cache = {
      data: sortedTokens,
      timestamp: Date.now(),
      isRefreshing: false,
    };
  } catch {
    cache.isRefreshing = false;
  }
}

// Main handler
export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please slow down.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfter || 60),
            "X-RateLimit-Limit": String(RATE_LIMIT),
            "X-RateLimit-Window": String(RATE_WINDOW / 1000),
          },
        },
      );
    }

    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    // Return fresh cache
    if (cache.data.length > 0 && cacheAge < CACHE_TTL) {
      return createResponse(cache.data, cache.timestamp, true);
    }

    // Return stale cache while refreshing in background
    if (cache.data.length > 0 && cacheAge < STALE_TTL) {
      // Trigger background refresh
      refreshCache();
      return createResponse(cache.data, cache.timestamp, true);
    }

    // Cache is too old or empty, need fresh data
    await refreshCache();

    if (cache.data.length > 0) {
      return createResponse(cache.data, cache.timestamp, false);
    }

    // Last resort: return error
    return NextResponse.json(
      {
        success: false,
        error: "Unable to fetch stability data",
        data: [],
      },
      { status: 503 },
    );
  } catch (error) {
    console.error("[Stability API Error]:", error);

    // Return cached data on error
    if (cache.data.length > 0) {
      return createResponse(cache.data, cache.timestamp, true);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        data: [],
      },
      { status: 500 },
    );
  }
}

// Create optimized response
function createResponse(
  data: TokenWithStability[],
  timestamp: number,
  fromCache: boolean,
): NextResponse {
  const summary = {
    stable: data.filter((t) => t.stability === "STABLE").length,
    moderate: data.filter((t) => t.stability === "MODERATE").length,
    unstable: data.filter((t) => t.stability === "UNSTABLE").length,
    noTrade: data.filter((t) => t.stability === "NO_TRADE").length,
  };

  return NextResponse.json(
    {
      success: true,
      data,
      count: data.length,
      lastUpdate: timestamp,
      fromCache,
      summary,
      config: {
        refreshInterval: 5000,
        stableThreshold: STABLE_THRESHOLD,
        moderateThreshold: MODERATE_THRESHOLD,
        maxTokens: MAX_TOKENS,
      },
    },
    {
      headers: {
        "Cache-Control": fromCache
          ? "public, max-age=2, stale-while-revalidate=8"
          : "public, max-age=3",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-Response-Time": `${Date.now() - timestamp}ms`,
      },
    },
  );
}

// Cleanup rate limit records periodically
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, record] of rateLimitWindow.entries()) {
        // Clean old timestamps
        record.timestamps = record.timestamps.filter(
          (t) => now - t < RATE_WINDOW,
        );
        // Remove empty records
        if (record.timestamps.length === 0 && !record.blocked) {
          rateLimitWindow.delete(ip);
        }
        // Unblock expired blocks
        if (record.blocked && now - record.timestamps[0] > BLOCK_DURATION) {
          rateLimitWindow.delete(ip);
        }
      }
    },
    30000, // Every 30 seconds
  );
}
