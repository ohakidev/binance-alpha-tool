/**
 * Binance Alpha Projects API
 * GET /api/binance/alpha/projects
 *
 * Fetches REAL project data from Binance Alpha API
 * Source: https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list
 */

import { NextResponse } from "next/server";

// ============= Types =============

interface BinanceAlphaTokenRaw {
  tokenId: string;
  chainId: string;
  chainIconUrl: string;
  chainName: string;
  contractAddress: string;
  name: string;
  symbol: string;
  iconUrl: string;
  price: string;
  percentChange24h: string;
  volume24h: string;
  marketCap: string;
  fdv: string;
  liquidity: string;
  totalSupply: string;
  circulatingSupply: string;
  holders: string;
  decimals: number;
  listingCex: boolean;
  hotTag: boolean;
  cexCoinName: string;
  canTransfer: boolean;
  denomination: number;
  offline: boolean;
  tradeDecimal: number;
  alphaId: string;
  offsell: boolean;
  priceHigh24h: string;
  priceLow24h: string;
  count24h: string;
  onlineTge: boolean;
  onlineAirdrop: boolean;
  score: number;
  cexOffDisplay: boolean;
  stockState: boolean;
  listingTime: number;
  mulPoint: number;
  bnExclusiveState: boolean;
}

interface BinanceAlphaApiResponse {
  code: string;
  message: string | null;
  messageDetail: string | null;
  data: BinanceAlphaTokenRaw[];
}

interface ProcessedProject {
  token: string;
  name: string;
  chain: string;
  chainId: string;
  multiplier: number;
  isBaseline: boolean;
  price: number;
  priceHigh24h: number;
  priceLow24h: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  stabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  spreadBps: number;
  volatilityIndex: number;
  trend: "UP" | "DOWN" | "STABLE";
  fourXDays: number;
  contractAddress: string;
  iconUrl: string;
  alphaId: string;
  listingTime: number | null;
  score: number;
  hotTag: boolean;
  isOffline: boolean;
  hasBinancePair: boolean;
}

// ============= Constants =============

const BINANCE_ALPHA_API_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// Chain ID to name mapping
const CHAIN_ID_MAP: Record<string, string> = {
  "1": "Ethereum",
  "56": "BSC",
  "137": "Polygon",
  "42161": "Arbitrum",
  "10": "Optimism",
  "43114": "Avalanche",
  "250": "Fantom",
  "8453": "Base",
  "324": "zkSync",
  "534352": "Scroll",
  "59144": "Linea",
  "1399811149": "Solana",
};

// Alpha tokens that have USDT pairs on Binance Spot
const ALPHA_WITH_BINANCE_PAIRS = [
  "ALEO",
  "KAITO",
  "BERA",
  "LAYER",
  "IP",
  "SHELL",
  "BMT",
  "NIL",
  "PARTI",
  "PLUME",
  "MUBARAK",
  "BROCCOLI",
  "TUT",
  "B2",
  "GPS",
  "RED",
  "HAEDAL",
  "SIGN",
  "INIT",
  "ZORA",
];

// ============= Helper Functions =============

function parseNumber(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function normalizeChainName(chainId: string, chainName?: string): string {
  if (chainId && CHAIN_ID_MAP[chainId]) {
    return CHAIN_ID_MAP[chainId];
  }
  if (chainName) {
    return chainName;
  }
  return "Unknown";
}

/**
 * Calculate stability score based on multiple factors
 */
function calculateStabilityScore(token: BinanceAlphaTokenRaw): number {
  const price = parseNumber(token.price);
  const high = parseNumber(token.priceHigh24h);
  const low = parseNumber(token.priceLow24h);
  const change = parseNumber(token.percentChange24h);
  const volume = parseNumber(token.volume24h);
  const liquidity = parseNumber(token.liquidity);

  let score = 50; // Base score

  // Price volatility factor (lower is better)
  if (price > 0 && high > 0 && low > 0) {
    const priceRange = ((high - low) / price) * 100;
    if (priceRange < 5) score += 20;
    else if (priceRange < 10) score += 10;
    else if (priceRange > 20) score -= 15;
  }

  // 24h change factor
  const absChange = Math.abs(change);
  if (absChange < 5) score += 15;
  else if (absChange < 10) score += 5;
  else if (absChange > 20) score -= 10;

  // Liquidity factor (higher is better)
  if (liquidity > 1000000) score += 15;
  else if (liquidity > 500000) score += 10;
  else if (liquidity > 100000) score += 5;
  else score -= 5;

  // Volume factor
  if (volume > 5000000) score += 10;
  else if (volume > 1000000) score += 5;

  // Multiplier bonus (4x tokens might be more volatile)
  const mulPoint = token.mulPoint || 1;
  if (mulPoint === 1) score += 5; // Baseline tokens tend to be more stable

  // Cap score between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate spread in basis points from price range
 */
function calculateSpreadBps(token: BinanceAlphaTokenRaw): number {
  const high = parseNumber(token.priceHigh24h);
  const low = parseNumber(token.priceLow24h);
  const price = parseNumber(token.price);

  if (price <= 0 || high <= 0 || low <= 0) return 0;

  // Approximate spread from price range
  const spread = ((high - low) / price) * 10000;
  return Math.round(spread * 100) / 100;
}

/**
 * Determine risk level from stability score
 */
function determineRiskLevel(
  stabilityScore: number,
  spreadBps: number,
): "LOW" | "MEDIUM" | "HIGH" {
  if (stabilityScore >= 70 && spreadBps < 500) return "LOW";
  if (stabilityScore >= 45 && spreadBps < 1000) return "MEDIUM";
  return "HIGH";
}

/**
 * Determine price trend
 */
function determineTrend(change24h: number): "UP" | "DOWN" | "STABLE" {
  if (change24h > 3) return "UP";
  if (change24h < -3) return "DOWN";
  return "STABLE";
}

/**
 * Calculate volatility index (0-100, higher = more volatile)
 */
function calculateVolatilityIndex(token: BinanceAlphaTokenRaw): number {
  const price = parseNumber(token.price);
  const high = parseNumber(token.priceHigh24h);
  const low = parseNumber(token.priceLow24h);
  const change = Math.abs(parseNumber(token.percentChange24h));

  if (price <= 0) return 50;

  const priceRange = ((high - low) / price) * 100;
  const volatility = (priceRange + change) / 2;

  return Math.min(100, Math.round(volatility * 2));
}

/**
 * Estimate 4x days based on listing time and multiplier
 */
function estimate4xDays(token: BinanceAlphaTokenRaw): number {
  if (token.mulPoint !== 4) return 0;

  const listingTime = token.listingTime || 0;
  if (listingTime === 0) return 0;

  const now = Date.now();
  const daysSinceListing = Math.floor(
    (now - listingTime) / (1000 * 60 * 60 * 24),
  );

  return Math.max(0, daysSinceListing);
}

/**
 * Transform raw token to processed project
 */
function transformToken(token: BinanceAlphaTokenRaw): ProcessedProject {
  const price = parseNumber(token.price);
  const change24h = parseNumber(token.percentChange24h);
  const stabilityScore = calculateStabilityScore(token);
  const spreadBps = calculateSpreadBps(token);
  const mulPoint = token.mulPoint || 1;

  return {
    token: token.symbol,
    name: token.name,
    chain: normalizeChainName(token.chainId, token.chainName),
    chainId: token.chainId,
    multiplier: mulPoint,
    isBaseline: mulPoint === 1,
    price,
    priceHigh24h: parseNumber(token.priceHigh24h),
    priceLow24h: parseNumber(token.priceLow24h),
    change24h,
    volume24h: parseNumber(token.volume24h),
    marketCap: parseNumber(token.marketCap),
    liquidity: parseNumber(token.liquidity),
    holders: parseInt(token.holders) || 0,
    stabilityScore,
    riskLevel: determineRiskLevel(stabilityScore, spreadBps),
    spreadBps,
    volatilityIndex: calculateVolatilityIndex(token),
    trend: determineTrend(change24h),
    fourXDays: estimate4xDays(token),
    contractAddress: token.contractAddress,
    iconUrl: token.iconUrl,
    alphaId: token.alphaId,
    listingTime: token.listingTime || null,
    score: token.score || 0,
    hotTag: token.hotTag,
    isOffline: token.offline || token.offsell,
    hasBinancePair: ALPHA_WITH_BINANCE_PAIRS.includes(
      token.symbol.toUpperCase(),
    ),
  };
}

/**
 * Fetch real data from Binance Alpha API
 */
async function fetchBinanceAlphaProjects(): Promise<ProcessedProject[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    console.log("🔍 Fetching from Binance Alpha API...");

    const response = await fetch(BINANCE_ALPHA_API_URL, {
      method: "GET",
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: BinanceAlphaApiResponse = await response.json();

    if (data.code !== "000000") {
      throw new Error(`Binance API error: ${data.message || "Unknown error"}`);
    }

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid API response structure");
    }

    console.log(`✅ Found ${data.data.length} tokens from Binance Alpha API`);

    // Filter out offline tokens and transform
    const activeTokens = data.data.filter(
      (token) => !token.offline && !token.offsell,
    );

    return activeTokens.map(transformToken);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Binance Alpha API request timeout");
    }

    throw error;
  }
}

// ============= API Handler =============

export async function GET() {
  try {
    const projects = await fetchBinanceAlphaProjects();

    // Sort: baseline (1x) first, then by stability score descending
    const sorted = projects.sort((a, b) => {
      // Baseline first
      if (a.isBaseline && !b.isBaseline) return -1;
      if (!a.isBaseline && b.isBaseline) return 1;

      // Then by stability score
      return b.stabilityScore - a.stabilityScore;
    });

    // Find baseline project (1x multiplier)
    const baselineProject = sorted.find((p) => p.isBaseline);

    // Stats
    const stats = {
      total: sorted.length,
      fourX: sorted.filter((p) => p.multiplier === 4).length,
      withBinancePairs: sorted.filter((p) => p.hasBinancePair).length,
      lowRisk: sorted.filter((p) => p.riskLevel === "LOW").length,
      mediumRisk: sorted.filter((p) => p.riskLevel === "MEDIUM").length,
      highRisk: sorted.filter((p) => p.riskLevel === "HIGH").length,
    };

    return NextResponse.json({
      success: true,
      data: sorted,
      count: sorted.length,
      baseline: baselineProject || null,
      stats,
      timestamp: new Date().toISOString(),
      source: "binance-alpha-api-real",
      disclaimer:
        "⚠️ Markets are unpredictable. DYOR; no liability for losses.",
    });
  } catch (error) {
    console.error("❌ Error fetching Binance Alpha projects:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch Binance Alpha projects",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
