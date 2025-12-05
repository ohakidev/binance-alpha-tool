import { NextResponse } from "next/server";

/**
 * Stability Data API Route - Optimized Version
 * Fetches Alpha tokens from Binance Alpha API
 * Uses parallel processing and caching for maximum performance
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
const BINANCE_BOOK_TICKER_URL =
  "https://api.binance.com/api/v3/ticker/bookTicker";
const BINANCE_24H_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";

// Moralis API configuration
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "";
const MORALIS_BASE_URL = "https://deep-index.moralis.io/api/v2.2";

// Tokens that have Spot USDT pairs on Binance CEX
const SPOT_EXCEPTIONS: string[] = [];

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 5000;

// Stability thresholds (in basis points)
const STABLE_THRESHOLD_BPS = 500; // 5%
const MODERATE_THRESHOLD_BPS = 1500; // 15%

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 8000; // 8 seconds

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

interface BookTickerData {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

interface Ticker24hData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
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

interface MoralisPairData {
  spreadBps: number;
  hasTrades: boolean;
  volume24h: number;
  price: number;
}

// Utility: Fetch with timeout and AbortController
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

// Calculate days remaining in 4x period (30 days total)
function calculateFourXDaysRemaining(listingTime: number | null): number {
  if (!listingTime || listingTime <= 0) return 0;

  const now = Date.now();
  const FOUR_X_PERIOD_DAYS = 30;
  const diffMs = now - listingTime;
  const daysSinceListing = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = FOUR_X_PERIOD_DAYS - daysSinceListing;

  return Math.max(0, daysRemaining);
}

// Calculate spread from price range
function calculateSpreadFromPriceRange(
  price: number,
  priceHigh: number,
  priceLow: number,
): { spreadPercent: number; spreadBps: number } {
  if (price <= 0 || priceHigh <= 0 || priceLow <= 0) {
    return { spreadPercent: 0, spreadBps: 0 };
  }

  const midPrice = (priceHigh + priceLow) / 2;
  const priceRange = priceHigh - priceLow;
  const spreadPercent = (priceRange / midPrice) * 100;
  const spreadBps = spreadPercent * 100;

  return {
    spreadPercent: Number(spreadPercent.toFixed(4)),
    spreadBps: Number(spreadBps.toFixed(2)),
  };
}

// Calculate spread from orderbook
function calculateSpreadFromOrderbook(
  bidPrice: number,
  askPrice: number,
): { spreadPercent: number; spreadBps: number } {
  if (bidPrice <= 0 || askPrice <= 0) {
    return { spreadPercent: 0, spreadBps: 0 };
  }

  const midPrice = (bidPrice + askPrice) / 2;
  const spread = askPrice - bidPrice;
  const spreadPercent = (spread / midPrice) * 100;
  const spreadBps = spreadPercent * 100;

  return {
    spreadPercent: Number(spreadPercent.toFixed(4)),
    spreadBps: Number(spreadBps.toFixed(2)),
  };
}

// Determine stability level
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

// Fetch Moralis pair stats (with caching)
async function fetchMoralisPairStats(
  contractAddress: string,
): Promise<MoralisPairData> {
  const defaultResult: MoralisPairData = {
    spreadBps: 0,
    hasTrades: false,
    volume24h: 0,
    price: 0,
  };

  if (!MORALIS_API_KEY || !contractAddress) return defaultResult;

  const cacheKey = `moralis_${contractAddress}`;
  const cached = getCached<MoralisPairData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${MORALIS_BASE_URL}/erc20/${contractAddress}/pairs?chain=bsc&limit=3`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
      },
      3000,
    );

    if (!response.ok) return defaultResult;

    const pairsData = await response.json();
    const pairs = pairsData.pairs || [];

    if (pairs.length === 0) return defaultResult;

    // Get active pair with volume
    const activePairs = pairs.filter(
      (p: { inactive_pair?: boolean; volume_24h_usd?: number }) =>
        !p.inactive_pair && p.volume_24h_usd,
    );
    const mainPair = activePairs.length > 0 ? activePairs[0] : pairs[0];

    const volume24h = parseFloat(mainPair.volume_24h_usd || "0");
    const currentPrice = parseFloat(mainPair.usd_price || "0");
    const price24hAgo = parseFloat(mainPair.usd_price_24hr || "0");
    const priceChangePercent = parseFloat(
      mainPair.usd_price_24hr_percent_change || "0",
    );

    const hasTrades = volume24h > 0 || currentPrice > 0;
    if (!hasTrades) return defaultResult;

    let spreadBps = 0;
    if (currentPrice > 0 && price24hAgo > 0) {
      const highPrice = Math.max(currentPrice, price24hAgo);
      const lowPrice = Math.min(currentPrice, price24hAgo);
      const avgPrice = (highPrice + lowPrice) / 2;
      const priceRange = highPrice - lowPrice;
      spreadBps = (priceRange / avgPrice) * 10000;
    } else if (Math.abs(priceChangePercent) > 0) {
      spreadBps = Math.abs(priceChangePercent) * 100;
    }

    const result: MoralisPairData = {
      spreadBps: Number(spreadBps.toFixed(2)),
      hasTrades,
      volume24h,
      price: currentPrice,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return defaultResult;
  }
}

// Fetch Spot book ticker (with caching)
async function fetchSpotBookTicker(
  symbol: string,
): Promise<BookTickerData | null> {
  const cacheKey = `book_${symbol}`;
  const cached = getCached<BookTickerData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${BINANCE_BOOK_TICKER_URL}?symbol=${symbol}USDT`,
      { headers: { Accept: "application/json" } },
      2000,
    );

    if (!response.ok) return null;

    const data = await response.json();
    setCache(cacheKey, data);
    return data as BookTickerData;
  } catch {
    return null;
  }
}

// Fetch Spot 24h ticker (with caching)
async function fetchSpot24hTicker(
  symbol: string,
): Promise<Ticker24hData | null> {
  const cacheKey = `ticker24h_${symbol}`;
  const cached = getCached<Ticker24hData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${BINANCE_24H_TICKER_URL}?symbol=${symbol}USDT`,
      { headers: { Accept: "application/json" } },
      2000,
    );

    if (!response.ok) return null;

    const data = await response.json();
    setCache(cacheKey, data);
    return data as Ticker24hData;
  } catch {
    return null;
  }
}

// Process a single token (optimized)
async function processToken(token: AlphaTokenRaw): Promise<StabilityData> {
  const isSpotException = SPOT_EXCEPTIONS.includes(token.symbol);
  let price = parseFloat(token.price) || 0;
  let priceHigh24h = parseFloat(token.priceHigh24h) || 0;
  let priceLow24h = parseFloat(token.priceLow24h) || 0;
  let volume24h = parseFloat(token.volume24h) || 0;
  const liquidity = parseFloat(token.liquidity) || 0;
  let spreadPercent = 0;
  let spreadBps = 0;
  let priceChange24h = parseFloat(token.percentChange24h) || 0;
  let hasTrades = volume24h > 0;

  // Try Moralis for DEX tokens (parallel with Binance Alpha data)
  if (MORALIS_API_KEY && token.contractAddress && !isSpotException) {
    const moralisData = await fetchMoralisPairStats(token.contractAddress);

    if (moralisData.hasTrades && moralisData.spreadBps > 0) {
      spreadBps = moralisData.spreadBps;
      spreadPercent = spreadBps / 100;
      hasTrades = true;

      if (moralisData.volume24h > 0) {
        volume24h = Math.max(volume24h, moralisData.volume24h);
      }
      if (moralisData.price > 0) {
        price = moralisData.price;
      }
    }
  }

  // Handle Spot exceptions
  if (isSpotException && spreadBps === 0) {
    const [bookTicker, ticker24h] = await Promise.all([
      fetchSpotBookTicker(token.symbol),
      fetchSpot24hTicker(token.symbol),
    ]);

    if (bookTicker) {
      const bidPrice = parseFloat(bookTicker.bidPrice);
      const askPrice = parseFloat(bookTicker.askPrice);
      const spreadData = calculateSpreadFromOrderbook(bidPrice, askPrice);
      spreadPercent = spreadData.spreadPercent;
      spreadBps = spreadData.spreadBps;
      price = (bidPrice + askPrice) / 2;
    }

    if (ticker24h) {
      priceHigh24h = parseFloat(ticker24h.highPrice) || priceHigh24h;
      priceLow24h = parseFloat(ticker24h.lowPrice) || priceLow24h;
      volume24h = parseFloat(ticker24h.quoteVolume) || volume24h;
      priceChange24h =
        parseFloat(ticker24h.priceChangePercent) || priceChange24h;
    }
  }

  // Fallback: Calculate spread from 24h price range
  if (spreadBps === 0 && price > 0 && priceHigh24h > 0 && priceLow24h > 0) {
    const spreadData = calculateSpreadFromPriceRange(
      price,
      priceHigh24h,
      priceLow24h,
    );
    spreadPercent = spreadData.spreadPercent;
    spreadBps = spreadData.spreadBps;
  }

  const hasVolume = volume24h > 0;
  const stability = determineStability(spreadBps, hasVolume, hasTrades);
  const sortPriority = getStabilitySortPriority(stability);

  return {
    project: token.name || token.symbol,
    symbol: token.symbol,
    mulPoint: token.mulPoint,
    stability,
    spreadBps,
    fourXDays: calculateFourXDaysRemaining(token.listingTime),
    price,
    priceHigh24h,
    priceLow24h,
    spreadPercent,
    lastUpdate: Date.now(),
    chain: token.chainName || "BSC",
    volume24h,
    liquidity,
    isSpotPair: isSpotException,
    priceChange24h,
    sortPriority,
  };
}

export async function GET() {
  try {
    // Check cache first for full response
    const cachedResponse = getCached<StabilityData[]>("stability_data");

    // Fetch Alpha data
    const alphaResponse = await fetchWithTimeout(
      BINANCE_ALPHA_API_URL,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      6000,
    );

    if (!alphaResponse.ok) {
      // Return cached data if available
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
          error: `Alpha API error: ${alphaResponse.status}`,
          data: [],
        },
        { status: alphaResponse.status },
      );
    }

    const alphaData = await alphaResponse.json();

    if (alphaData.code !== "000000" || !Array.isArray(alphaData.data)) {
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
          error: "Invalid Alpha API response",
          data: [],
        },
        { status: 500 },
      );
    }

    // Filter 4x multiplier tokens AND KOGE (1x baseline)
    const tokensToProcess = (alphaData.data as AlphaTokenRaw[]).filter(
      (t) => t.mulPoint === 4 || t.symbol === "KOGE",
    );

    // Process ALL tokens in parallel for maximum speed
    const stabilityData = await Promise.all(
      tokensToProcess.map((token) => processToken(token)),
    );

    // Sort: KOGE first (baseline), then by priority, then by volume
    stabilityData.sort((a, b) => {
      // KOGE always first
      if (a.symbol === "KOGE" && b.symbol !== "KOGE") return -1;
      if (b.symbol === "KOGE" && a.symbol !== "KOGE") return 1;

      // Then by stability priority
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      // Then by volume descending
      return b.volume24h - a.volume24h;
    });

    // Cache the result
    setCache("stability_data", stabilityData);

    // Calculate summary (optimized single pass)
    let stableCount = 0;
    let moderateCount = 0;
    let unstableCount = 0;
    let noTradeCount = 0;
    let checkingCount = 0;
    let totalVolume = 0;
    let spreadSum = 0;
    let spreadCount = 0;
    let spotPairsCount = 0;

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
      totalVolume += item.volume24h;
      if (item.spreadPercent > 0) {
        spreadSum += item.spreadPercent;
        spreadCount++;
      }
      if (item.isSpotPair) spotPairsCount++;
    }

    const avgSpread = spreadCount > 0 ? spreadSum / spreadCount : 0;

    return NextResponse.json({
      success: true,
      data: stabilityData,
      count: stabilityData.length,
      lastUpdate: Date.now(),
      filters: {
        mulPoint: 4,
        source: "Alpha DEX + Spot Exceptions",
      },
      summary: {
        stableCount,
        moderateCount,
        unstableCount,
        noTradeCount,
        checkingCount,
        totalVolume24h: totalVolume,
        avgSpreadPercent: Number(avgSpread.toFixed(2)),
        spotPairsCount,
        moralisEnabled: !!MORALIS_API_KEY,
      },
      thresholds: {
        stable: STABLE_THRESHOLD_BPS,
        moderate: MODERATE_THRESHOLD_BPS,
      },
    });
  } catch (error) {
    console.error("Stability data fetch error:", error);

    // Try to return cached data on error
    const cachedResponse = getCached<StabilityData[]>("stability_data");
    if (cachedResponse) {
      return NextResponse.json({
        success: true,
        data: cachedResponse,
        count: cachedResponse.length,
        lastUpdate: Date.now(),
        fromCache: true,
        error: "Using cached data due to fetch error",
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
