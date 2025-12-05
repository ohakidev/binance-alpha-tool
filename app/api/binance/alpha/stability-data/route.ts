import { NextResponse } from "next/server";
import Moralis from "moralis";

/**
 * Stability Data API Route
 * Fetches Alpha tokens from Binance Alpha API
 * Uses Moralis API for accurate DEX spread calculation
 *
 * Sorting Priority:
 * 1. Stable tokens (green) - lowest spread
 * 2. Moderate tokens (yellow)
 * 3. Unstable tokens (red)
 * 4. No trade tokens
 * 5. Within each group, sort by volume
 */

const BINANCE_ALPHA_API_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";

const BINANCE_BOOK_TICKER_URL =
  "https://api.binance.com/api/v3/ticker/bookTicker";
const BINANCE_24H_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";

// Moralis API configuration
const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "";
const MORALIS_BASE_URL = "https://deep-index.moralis.io/api/v2.2";

// WBNB address for pair lookups (reserved for future use)
// const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
// const USDT_BSC_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

// Tokens that have Spot USDT pairs on Binance CEX
const SPOT_EXCEPTIONS: string[] = [];

// Initialize Moralis (only once)
let moralisInitialized = false;
async function initMoralis() {
  if (!moralisInitialized && MORALIS_API_KEY) {
    try {
      await Moralis.start({ apiKey: MORALIS_API_KEY });
      moralisInitialized = true;
    } catch {
      // Already initialized or error
      moralisInitialized = true;
    }
  }
}

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
  contractAddress?: string;
}

interface MoralisTokenPrice {
  tokenAddress: string;
  usdPrice: number;
  exchangeName?: string;
  exchangeAddress?: string;
  tokenSymbol?: string;
}

// MoralisSwap interface - reserved for future detailed swap analysis
// interface MoralisSwap {
//   transactionHash: string;
//   blockTimestamp: string;
//   tokenIn: { address: string; symbol: string; amount: string; };
//   tokenOut: { address: string; symbol: string; amount: string; };
//   priceNative?: string;
//   priceUsd?: string;
// }

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

// Stability levels for sorting
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
  sortPriority: number; // For custom sorting
}

// Stability thresholds based on trade-derived spread (like alpha123.uk)
// These are much tighter since we're using actual trade spread, not 24h range
const STABLE_THRESHOLD_BPS = 500; // 5 bps = stable (very tight spread)
const MODERATE_THRESHOLD_BPS = 1500; // 15 bps = moderate

// Fallback thresholds for 24h price range (when Moralis data unavailable)
const FALLBACK_STABLE_THRESHOLD_BPS = 500; // 5% = stable
const FALLBACK_MODERATE_THRESHOLD_BPS = 1500; // 15% = moderate

/**
 * Calculate days remaining in 4x period (30 days total)
 * Returns the number of days left until 4x multiplier expires
 */
function calculateFourXDaysRemaining(listingTime: number | null): number {
  if (!listingTime || listingTime <= 0) return 0;

  const now = Date.now();
  const FOUR_X_PERIOD_DAYS = 30;

  // Calculate days since listing
  const diffMs = now - listingTime;
  const daysSinceListing = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Calculate remaining days (30 - days passed)
  const daysRemaining = FOUR_X_PERIOD_DAYS - daysSinceListing;

  // Return 0 if period has ended, otherwise return remaining days
  return Math.max(0, daysRemaining);
}

/**
 * Calculate spread from price range (high - low) / mid price
 * This simulates spread based on 24h price volatility for DEX tokens
 */
function calculateSpreadFromPriceRange(
  price: number,
  priceHigh: number,
  priceLow: number,
): { spreadPercent: number; spreadBps: number } {
  if (price <= 0 || priceHigh <= 0 || priceLow <= 0) {
    return { spreadPercent: 0, spreadBps: 0 };
  }

  // Use midpoint of high-low as reference
  const midPrice = (priceHigh + priceLow) / 2;
  const priceRange = priceHigh - priceLow;

  // Spread percent = price range / mid price * 100
  const spreadPercent = (priceRange / midPrice) * 100;
  const spreadBps = spreadPercent * 100; // Convert to basis points

  return {
    spreadPercent: Number(spreadPercent.toFixed(4)),
    spreadBps: Number(spreadBps.toFixed(2)),
  };
}

/**
 * Calculate spread from orderbook (ask - bid) / mid price
 * More accurate for Spot pairs
 */
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

/**
 * Determine stability level based on spread
 */
function determineStability(
  spreadBps: number,
  hasVolume: boolean,
  hasTrades: boolean,
): StabilityLevel {
  if (!hasTrades) {
    return "NO_TRADE";
  }

  if (spreadBps === 0 || !hasVolume) {
    return "CHECKING";
  }

  if (spreadBps < STABLE_THRESHOLD_BPS) return "STABLE";
  if (spreadBps < MODERATE_THRESHOLD_BPS) return "MODERATE";
  return "UNSTABLE";
}

/**
 * Get sort priority for stability level
 * Lower number = higher priority (appears first)
 */
function getStabilitySortPriority(stability: StabilityLevel): number {
  switch (stability) {
    case "STABLE":
      return 1;
    case "MODERATE":
      return 2;
    case "UNSTABLE":
      return 3;
    case "NO_TRADE":
      return 4;
    case "CHECKING":
      return 5;
    default:
      return 6;
  }
}

/**
 * Fetch token price from Moralis
 */
async function fetchMoralisTokenPrice(
  contractAddress: string,
): Promise<MoralisTokenPrice | null> {
  if (!MORALIS_API_KEY || !contractAddress) return null;

  try {
    const response = await fetch(
      `${MORALIS_BASE_URL}/erc20/${contractAddress}/price?chain=bsc&include=percent_change`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
        next: { revalidate: 10 },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      tokenAddress: contractAddress,
      usdPrice: data.usdPrice || 0,
      exchangeName: data.exchangeName,
      exchangeAddress: data.exchangeAddress,
      tokenSymbol: data.tokenSymbol,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch recent swaps for a token from Moralis to calculate spread
 */
async function fetchMoralisSwaps(
  contractAddress: string,
): Promise<{ spreadBps: number; hasTrades: boolean; volume24h: number }> {
  if (!MORALIS_API_KEY || !contractAddress) {
    return { spreadBps: 0, hasTrades: false, volume24h: 0 };
  }

  try {
    // Get token swaps/trades
    const response = await fetch(
      `${MORALIS_BASE_URL}/erc20/${contractAddress}/swaps?chain=bsc&limit=50`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
        next: { revalidate: 10 },
      },
    );

    if (!response.ok) {
      return { spreadBps: 0, hasTrades: false, volume24h: 0 };
    }

    const data = await response.json();
    const swaps = data.result || [];

    if (swaps.length === 0) {
      return { spreadBps: 0, hasTrades: false, volume24h: 0 };
    }

    // Calculate spread from recent trades
    // Get buy and sell prices from swaps
    const prices: number[] = [];

    for (const swap of swaps) {
      // Extract price from swap data
      const valueUsd = parseFloat(swap.totalValueUsd || swap.valueUsd || "0");
      const baseAmount = parseFloat(swap.baseTokenAmount || "0");

      if (baseAmount > 0 && valueUsd > 0) {
        const price = valueUsd / baseAmount;
        if (price > 0 && isFinite(price)) {
          prices.push(price);
        }
      }
    }

    if (prices.length < 2) {
      return { spreadBps: 0, hasTrades: true, volume24h: 0 };
    }

    // Calculate spread as (max - min) / avg * 10000 (bps)
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    if (avgPrice === 0) {
      return { spreadBps: 0, hasTrades: true, volume24h: 0 };
    }

    const spreadBps = ((maxPrice - minPrice) / avgPrice) * 10000;

    return {
      spreadBps: Number(spreadBps.toFixed(2)),
      hasTrades: true,
      volume24h: 0,
    };
  } catch {
    return { spreadBps: 0, hasTrades: false, volume24h: 0 };
  }
}

/**
 * Fetch pair stats from Moralis for more accurate spread
 * Moralis API returns snake_case field names
 */
async function fetchMoralisPairStats(
  contractAddress: string,
): Promise<{ spreadBps: number; hasTrades: boolean; volume24h: number }> {
  if (!MORALIS_API_KEY || !contractAddress) {
    return { spreadBps: 0, hasTrades: false, volume24h: 0 };
  }

  try {
    // Get pairs for this token from Moralis
    const pairsResponse = await fetch(
      `${MORALIS_BASE_URL}/erc20/${contractAddress}/pairs?chain=bsc&limit=5`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": MORALIS_API_KEY,
        },
        next: { revalidate: 30 },
      },
    );

    if (!pairsResponse.ok) {
      return { spreadBps: 0, hasTrades: false, volume24h: 0 };
    }

    const pairsData = await pairsResponse.json();
    const pairs = pairsData.pairs || [];

    if (pairs.length === 0) {
      return { spreadBps: 0, hasTrades: false, volume24h: 0 };
    }

    // Get the main active pair (usually WBNB or USDT pair)
    // Filter out inactive pairs and prefer ones with volume
    const activePairs = pairs.filter(
      (p: { inactive_pair?: boolean; volume_24h_usd?: number }) =>
        !p.inactive_pair && p.volume_24h_usd,
    );
    const mainPair = activePairs.length > 0 ? activePairs[0] : pairs[0];

    // Moralis returns snake_case field names
    const volume24h = parseFloat(mainPair.volume_24h_usd || "0");
    const priceChangePercent = parseFloat(
      mainPair.usd_price_24hr_percent_change || "0",
    );
    const currentPrice = parseFloat(mainPair.usd_price || "0");
    const price24hAgo = parseFloat(mainPair.usd_price_24hr || "0");

    // Check if pair has recent trades
    const hasTrades = volume24h > 0 || currentPrice > 0;

    if (!hasTrades) {
      return { spreadBps: 0, hasTrades: false, volume24h: 0 };
    }

    // Calculate spread from 24h price movement
    // This approximates trade spread based on price volatility
    let spreadBps = 0;

    if (currentPrice > 0 && price24hAgo > 0) {
      // Calculate spread as the price range / average price
      const highPrice = Math.max(currentPrice, price24hAgo);
      const lowPrice = Math.min(currentPrice, price24hAgo);
      const avgPrice = (highPrice + lowPrice) / 2;
      const priceRange = highPrice - lowPrice;

      // Convert to basis points
      spreadBps = (priceRange / avgPrice) * 10000;
    } else if (Math.abs(priceChangePercent) > 0) {
      // Fallback: use price change percentage as spread estimate
      // Convert percentage to bps
      spreadBps = Math.abs(priceChangePercent) * 100;
    }

    return {
      spreadBps: Number(spreadBps.toFixed(2)),
      hasTrades,
      volume24h,
    };
  } catch {
    return { spreadBps: 0, hasTrades: false, volume24h: 0 };
  }
}

/**
 * Fetch Spot orderbook data for exception tokens
 */
async function fetchSpotBookTicker(
  symbol: string,
): Promise<BookTickerData | null> {
  try {
    const response = await fetch(
      `${BINANCE_BOOK_TICKER_URL}?symbol=${symbol}USDT`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 5 },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data as BookTickerData;
  } catch {
    return null;
  }
}

/**
 * Fetch 24h ticker data for Spot pairs
 */
async function fetchSpot24hTicker(
  symbol: string,
): Promise<Ticker24hData | null> {
  try {
    const response = await fetch(
      `${BINANCE_24H_TICKER_URL}?symbol=${symbol}USDT`,
      {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 5 },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data as Ticker24hData;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Initialize Moralis
    await initMoralis();

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
    const tokensToProcess = (alphaData.data as AlphaTokenRaw[]).filter(
      (t) => t.mulPoint === 4,
    );

    // Process tokens in parallel batches to speed up Moralis calls
    const batchSize = 5;
    for (let i = 0; i < tokensToProcess.length; i += batchSize) {
      const batch = tokensToProcess.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (token) => {
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

          // Try to get accurate spread from Moralis
          if (MORALIS_API_KEY && token.contractAddress) {
            try {
              // Get pair stats for spread calculation
              const pairStats = await fetchMoralisPairStats(
                token.contractAddress,
              );

              if (pairStats.hasTrades && pairStats.spreadBps > 0) {
                spreadBps = pairStats.spreadBps;
                spreadPercent = spreadBps / 100;
                hasTrades = true;

                // Use Moralis volume if available and higher
                if (pairStats.volume24h > 0) {
                  volume24h = Math.max(volume24h, pairStats.volume24h);
                }
              } else if (pairStats.hasTrades) {
                // Has trades but no spread data - try swap-based calculation
                const swapData = await fetchMoralisSwaps(token.contractAddress);
                if (swapData.spreadBps > 0) {
                  spreadBps = swapData.spreadBps;
                  spreadPercent = spreadBps / 100;
                }
                hasTrades = swapData.hasTrades;
              } else {
                hasTrades = pairStats.hasTrades;
              }

              // Get token price from Moralis
              const moralisPrice = await fetchMoralisTokenPrice(
                token.contractAddress,
              );
              if (moralisPrice && moralisPrice.usdPrice > 0) {
                price = moralisPrice.usdPrice;
              }
            } catch {
              // Fallback to Binance Alpha data
            }
          }

          // Fallback: Calculate spread from 24h price range if no Moralis data
          if (
            spreadBps === 0 &&
            price > 0 &&
            priceHigh24h > 0 &&
            priceLow24h > 0
          ) {
            if (isSpotException) {
              // Fetch Spot orderbook data for accurate spread
              const [bookTicker, ticker24h] = await Promise.all([
                fetchSpotBookTicker(token.symbol),
                fetchSpot24hTicker(token.symbol),
              ]);

              if (bookTicker) {
                const bidPrice = parseFloat(bookTicker.bidPrice);
                const askPrice = parseFloat(bookTicker.askPrice);
                const spreadData = calculateSpreadFromOrderbook(
                  bidPrice,
                  askPrice,
                );
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
            } else {
              // Calculate spread from price range for DEX tokens
              const spreadData = calculateSpreadFromPriceRange(
                price,
                priceHigh24h,
                priceLow24h,
              );
              spreadPercent = spreadData.spreadPercent;
              spreadBps = spreadData.spreadBps;
            }
          }

          // Determine stability level
          const hasVolume = volume24h > 0;
          const stability = determineStability(spreadBps, hasVolume, hasTrades);

          // Calculate sort priority
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
          } as StabilityData;
        }),
      );

      stabilityData.push(...batchResults);
    }

    // Sort by:
    // 1. sortPriority (KOGE first, then Stable > Moderate > Unstable)
    // 2. Within same priority, sort by volume (highest first)
    stabilityData.sort((a, b) => {
      // First compare by sort priority
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }
      // Within same priority, sort by volume descending
      return b.volume24h - a.volume24h;
    });

    // Calculate summary statistics
    const stableCount = stabilityData.filter(
      (t) => t.stability === "STABLE",
    ).length;
    const moderateCount = stabilityData.filter(
      (t) => t.stability === "MODERATE",
    ).length;
    const unstableCount = stabilityData.filter(
      (t) => t.stability === "UNSTABLE",
    ).length;
    const noTradeCount = stabilityData.filter(
      (t) => t.stability === "NO_TRADE",
    ).length;
    const checkingCount = stabilityData.filter(
      (t) => t.stability === "CHECKING",
    ).length;
    const totalVolume = stabilityData.reduce((sum, t) => sum + t.volume24h, 0);
    const tokensWithSpread = stabilityData.filter((t) => t.spreadPercent > 0);
    const avgSpread =
      tokensWithSpread.length > 0
        ? tokensWithSpread.reduce((sum, t) => sum + t.spreadPercent, 0) /
          tokensWithSpread.length
        : 0;

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
        spotPairsCount: stabilityData.filter((t) => t.isSpotPair).length,
        moralisEnabled: !!MORALIS_API_KEY,
      },
      thresholds: {
        stable: STABLE_THRESHOLD_BPS,
        moderate: MODERATE_THRESHOLD_BPS,
        fallback: {
          stable: FALLBACK_STABLE_THRESHOLD_BPS,
          moderate: FALLBACK_MODERATE_THRESHOLD_BPS,
        },
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
