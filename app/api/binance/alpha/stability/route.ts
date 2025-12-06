/**
 * Binance Alpha Stability API
 * GET /api/binance/alpha/stability
 *
 * Fetches project data directly from Binance Alpha API
 * Calculates stability scores and risk metrics
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 30;

// ============= Types =============

interface BinanceAlphaTokenRaw {
  tokenId: string;
  chainId: string;
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
  alphaId: string;
  priceHigh24h: string;
  priceLow24h: string;
  count24h: string;
  onlineTge: boolean;
  onlineAirdrop: boolean;
  score: number;
  listingTime: number;
  mulPoint: number;
}

interface BinanceAlphaApiResponse {
  code: string;
  message: string | null;
  data: BinanceAlphaTokenRaw[];
}

interface StabilityProject {
  token: string;
  name: string;
  chain: string;
  multiplier: number;
  isBaseline: boolean;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  stabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  volatilityIndex: number;
  trend: "up" | "down" | "stable";
  iconUrl: string;
  contractAddress: string;
  isAirdrop: boolean;
  isTge: boolean;
}

// ============= Constants =============

const BINANCE_API_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";

const CHAIN_MAP: Record<string, string> = {
  "1": "Ethereum",
  "56": "BSC",
  "137": "Polygon",
  "42161": "Arbitrum",
  "10": "Optimism",
  "43114": "Avalanche",
  "8453": "Base",
  "324": "zkSync",
};

// Simple in-memory cache
let cache: {
  data: StabilityProject[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 30 * 1000; // 30 seconds

// ============= Helper Functions =============

function parseNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

function calculateStabilityScore(token: BinanceAlphaTokenRaw): number {
  const priceChange = Math.abs(parseNumber(token.percentChange24h));
  const volume = parseNumber(token.volume24h);
  const liquidity = parseNumber(token.liquidity);
  const marketCap = parseNumber(token.marketCap);
  const holders = parseNumber(token.holders);
  const price = parseNumber(token.price);
  const priceHigh = parseNumber(token.priceHigh24h);
  const priceLow = parseNumber(token.priceLow24h);

  let score = 100;

  // Volatility penalty (0-30 points)
  if (priceChange > 50) score -= 30;
  else if (priceChange > 30) score -= 20;
  else if (priceChange > 15) score -= 10;
  else if (priceChange > 5) score -= 5;

  // Price range volatility
  if (price > 0 && priceHigh > 0 && priceLow > 0) {
    const priceRange = ((priceHigh - priceLow) / price) * 100;
    if (priceRange > 50) score -= 15;
    else if (priceRange > 30) score -= 10;
    else if (priceRange > 15) score -= 5;
  }

  // Volume bonus (0-15 points)
  if (volume > 10000000) score += 15;
  else if (volume > 1000000) score += 10;
  else if (volume > 100000) score += 5;
  else if (volume < 10000) score -= 10;

  // Liquidity bonus (0-15 points)
  if (liquidity > 5000000) score += 15;
  else if (liquidity > 1000000) score += 10;
  else if (liquidity > 100000) score += 5;
  else if (liquidity < 50000) score -= 10;

  // Market cap bonus (0-10 points)
  if (marketCap > 100000000) score += 10;
  else if (marketCap > 10000000) score += 5;
  else if (marketCap < 1000000) score -= 5;

  // Holders bonus (0-10 points)
  if (holders > 10000) score += 10;
  else if (holders > 1000) score += 5;
  else if (holders < 100) score -= 5;

  // Multiplier bonus (baseline = stable)
  const multiplier = token.mulPoint || 1;
  if (multiplier === 1) score += 10;
  else if (multiplier > 3) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateVolatilityIndex(token: BinanceAlphaTokenRaw): number {
  const priceChange = Math.abs(parseNumber(token.percentChange24h));
  const price = parseNumber(token.price);
  const priceHigh = parseNumber(token.priceHigh24h);
  const priceLow = parseNumber(token.priceLow24h);

  let volatility = priceChange;

  if (price > 0 && priceHigh > 0 && priceLow > 0) {
    const priceRange = ((priceHigh - priceLow) / price) * 100;
    volatility = (volatility + priceRange) / 2;
  }

  return Math.round(volatility * 100) / 100;
}

function getRiskLevel(
  stabilityScore: number,
): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
  if (stabilityScore >= 75) return "LOW";
  if (stabilityScore >= 50) return "MEDIUM";
  if (stabilityScore >= 25) return "HIGH";
  return "VERY_HIGH";
}

function getTrend(priceChange: number): "up" | "down" | "stable" {
  if (priceChange > 2) return "up";
  if (priceChange < -2) return "down";
  return "stable";
}

async function fetchBinanceAlphaData(): Promise<StabilityProject[]> {
  // Check cache first
  const now = Date.now();
  if (cache.data && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(BINANCE_API_URL, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const json: BinanceAlphaApiResponse = await response.json();

    if (json.code !== "000000" || !json.data) {
      throw new Error(json.message || "Invalid API response");
    }

    const projects: StabilityProject[] = json.data.map((token) => {
      const priceChange = parseNumber(token.percentChange24h);
      const stabilityScore = calculateStabilityScore(token);
      const volatilityIndex = calculateVolatilityIndex(token);

      return {
        token: token.symbol,
        name: token.name,
        chain: CHAIN_MAP[token.chainId] || token.chainName || "Unknown",
        multiplier: token.mulPoint || 1,
        isBaseline: (token.mulPoint || 1) === 1,
        price: parseNumber(token.price),
        priceChange24h: priceChange,
        volume24h: parseNumber(token.volume24h),
        marketCap: parseNumber(token.marketCap),
        liquidity: parseNumber(token.liquidity),
        holders: parseNumber(token.holders),
        stabilityScore,
        riskLevel: getRiskLevel(stabilityScore),
        volatilityIndex,
        trend: getTrend(priceChange),
        iconUrl: token.iconUrl || "",
        contractAddress: token.contractAddress || "",
        isAirdrop: token.onlineAirdrop || false,
        isTge: token.onlineTge || false,
      };
    });

    // Sort by stability score descending
    projects.sort((a, b) => b.stabilityScore - a.stabilityScore);

    // Update cache
    cache = {
      data: projects,
      timestamp: now,
    };

    return projects;
  } catch (error) {
    clearTimeout(timeoutId);

    // Return cached data if available, even if stale
    if (cache.data) {
      console.warn("Using stale cache due to fetch error:", error);
      return cache.data;
    }

    throw error;
  }
}

// ============= API Handler =============

export async function GET() {
  try {
    const projects = await fetchBinanceAlphaData();

    // Calculate summary stats
    const stats = {
      total: projects.length,
      lowRisk: projects.filter((p) => p.riskLevel === "LOW").length,
      mediumRisk: projects.filter((p) => p.riskLevel === "MEDIUM").length,
      highRisk: projects.filter((p) => p.riskLevel === "HIGH").length,
      veryHighRisk: projects.filter((p) => p.riskLevel === "VERY_HIGH").length,
      avgStabilityScore:
        projects.length > 0
          ? Math.round(
              projects.reduce((sum, p) => sum + p.stabilityScore, 0) /
                projects.length,
            )
          : 0,
      withAirdrop: projects.filter((p) => p.isAirdrop).length,
      withTge: projects.filter((p) => p.isTge).length,
      baselineCount: projects.filter((p) => p.isBaseline).length,
    };

    return NextResponse.json({
      success: true,
      data: projects,
      stats,
      timestamp: new Date().toISOString(),
      source: "binance-alpha-api",
      cached: cache.timestamp > 0 && Date.now() - cache.timestamp < CACHE_TTL,
    });
  } catch (error) {
    console.error("❌ Stability API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch stability data",
        data: [],
        stats: {
          total: 0,
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0,
          veryHighRisk: 0,
          avgStabilityScore: 0,
          withAirdrop: 0,
          withTge: 0,
          baselineCount: 0,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
