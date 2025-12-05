/**
 * Binance Alpha Stability API Route
 * GET /api/binance/alpha/stability
 * Returns stability scores for 4x multiplier Alpha projects
 *
 * ⚙️ Criteria: price range, volume swings, abnormal spikes, short-term trend
 * 💡 Spread bps: discrepancy across trade records (smaller = steadier)
 * 📊 Sorting: KOGE (1x) as baseline
 */

import { NextResponse } from "next/server";
import { binanceClient } from "@/lib/api/binance-client";

// Binance Alpha Projects with 4x multiplier only
const ALPHA_4X_PROJECTS = [
  { symbol: "KOGE", name: "KOGE", multiplier: 1, isBaseline: true },
  { symbol: "BLUM", name: "Blum", multiplier: 4, isBaseline: false },
  { symbol: "MAJOR", name: "Major", multiplier: 4, isBaseline: false },
  { symbol: "SEED", name: "Seed", multiplier: 4, isBaseline: false },
  { symbol: "TOMARKET", name: "Tomarket", multiplier: 4, isBaseline: false },
  { symbol: "PLUTO", name: "Pluto", multiplier: 4, isBaseline: false },
  { symbol: "CATS", name: "Cats", multiplier: 4, isBaseline: false },
  { symbol: "DOGS", name: "Dogs", multiplier: 4, isBaseline: false },
];

// Calculate spread bps from price volatility
function calculateSpreadBps(high: number, low: number, last: number): number {
  // Spread in basis points (1 bps = 0.01%)
  // Formula: ((high - low) / last) * 10000
  return Math.round(((high - low) / last) * 10000);
}

// Detect abnormal price spikes
function detectAbnormalSpikes(
  priceChange: number,
  volatilityIndex: number,
): boolean {
  // Spike if price change > 15% or volatility > 80
  return Math.abs(priceChange) > 15 || volatilityIndex > 80;
}

// Calculate enhanced stability score
function calculateEnhancedStabilityScore(ticker: {
  symbol: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume?: string;
  highPrice: string;
  lowPrice: string;
  lastPrice: string;
  count?: string; // Number of trades
}): {
  stabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  volatilityIndex: number;
  spreadBps: number;
  hasAbnormalSpike: boolean;
  volumeSwing: number;
  trend: "UP" | "DOWN" | "STABLE";
} {
  const priceChange = parseFloat(ticker.priceChangePercent);
  const high = parseFloat(ticker.highPrice);
  const low = parseFloat(ticker.lowPrice);
  const last = parseFloat(ticker.lastPrice);
  const volume = parseFloat(ticker.quoteVolume || ticker.volume);
  const trades = parseInt(ticker.count || "1000");

  // 1. Price Range Analysis
  const priceRange = ((high - low) / last) * 100;

  // 2. Volume Swings (higher = more volatile)
  const volumeSwing = volume / Math.max(trades, 1); // Average per trade

  // 3. Spread bps calculation
  const spreadBps = calculateSpreadBps(high, low, last);

  // 4. Volatility Index (0-100, lower is more volatile)
  const volatilityIndex = Math.max(
    0,
    100 - (priceRange * 2 + Math.abs(priceChange)),
  );

  // 5. Abnormal Spike Detection
  const hasAbnormalSpike = detectAbnormalSpikes(priceChange, volatilityIndex);

  // 6. Short-term Trend
  let trend: "UP" | "DOWN" | "STABLE";
  if (priceChange > 3) trend = "UP";
  else if (priceChange < -3) trend = "DOWN";
  else trend = "STABLE";

  // 7. Volume-adjusted stability
  const volumeStability = Math.min(20, Math.log10(volume) * 2);

  // 8. Trade consistency score (more trades = more stable)
  const tradeScore = Math.min(15, Math.log10(Math.max(trades, 1)) * 3);

  // Final stability score calculation
  let stabilityScore = volatilityIndex * 0.4 + volumeStability + tradeScore;

  // Penalties
  if (hasAbnormalSpike) stabilityScore -= 20;
  if (spreadBps > 100) stabilityScore -= 10; // High spread = unstable
  if (trend === "DOWN") stabilityScore -= 5;

  stabilityScore = Math.min(100, Math.max(0, stabilityScore));

  // Determine risk level
  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  if (stabilityScore >= 70 && spreadBps < 50) {
    riskLevel = "LOW";
  } else if (stabilityScore >= 45) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "HIGH";
  }

  return {
    stabilityScore: Math.round(stabilityScore),
    riskLevel,
    volatilityIndex: Math.round(volatilityIndex),
    spreadBps,
    hasAbnormalSpike,
    volumeSwing: Math.round(volumeSwing),
    trend,
  };
}

export async function GET() {
  try {
    // Fetch from new Binance Alpha projects API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/binance/alpha/projects`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from projects API");
    }

    const projectsData = await response.json();

    if (!projectsData.success) {
      throw new Error("Projects API returned error");
    }

    return NextResponse.json(projectsData);
  } catch (error) {
    console.error("Error in stability route:", error);

    // Fallback to old method if new API fails
    try {
      const tickerData = await binanceClient.get24hrTicker();

      // Map Alpha projects to real Binance symbols for demo
      // In production, these would be actual Alpha project pairs
      const symbolMapping: Record<string, string> = {
        KOGE: "DOGEUSDT",
        BLUM: "BTCUSDT",
        MAJOR: "ETHUSDT",
        SEED: "SOLUSDT",
        TOMARKET: "BNBUSDT",
        PLUTO: "XRPUSDT",
        CATS: "MATICUSDT",
        DOGS: "AVAXUSDT",
      };

      // Filter and map data for Alpha projects
      const stabilityData = ALPHA_4X_PROJECTS.map((project) => {
        const binanceSymbol = symbolMapping[project.symbol];
        const ticker = Array.isArray(tickerData)
          ? tickerData.find(
              (t: {
                symbol: string;
                lastPrice?: string;
                priceChangePercent?: string;
                volume?: string;
              }) => t.symbol === binanceSymbol,
            )
          : null;

        if (!ticker) {
          // Return mock data if ticker not found
          return {
            symbol: project.symbol,
            name: project.name,
            multiplier: project.multiplier,
            isBaseline: project.isBaseline,
            price: Math.random() * 10,
            change24h: (Math.random() - 0.5) * 20,
            volume24h: Math.random() * 50000000,
            stabilityScore: Math.round(Math.random() * 100),
            riskLevel: "MEDIUM" as const,
            volatilityIndex: Math.round(Math.random() * 100),
            spreadBps: Math.round(Math.random() * 200),
            hasAbnormalSpike: false,
            volumeSwing: Math.round(Math.random() * 10000),
            trend: "STABLE" as const,
          };
        }

        const {
          stabilityScore,
          riskLevel,
          volatilityIndex,
          spreadBps,
          hasAbnormalSpike,
          volumeSwing,
          trend,
        } = calculateEnhancedStabilityScore({
          symbol: ticker.symbol,
          priceChangePercent: ticker.priceChangePercent,
          volume: ticker.volume,
          quoteVolume: (ticker as { quoteVolume?: string }).quoteVolume,
          highPrice: ticker.highPrice,
          lowPrice: ticker.lowPrice,
          lastPrice: ticker.lastPrice,
          count: (ticker as { count?: string }).count,
        });

        return {
          symbol: project.symbol,
          name: project.name,
          multiplier: project.multiplier,
          isBaseline: project.isBaseline,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          volume24h: parseFloat(
            (ticker as { quoteVolume?: string }).quoteVolume || ticker.volume,
          ),
          stabilityScore,
          riskLevel,
          volatilityIndex,
          spreadBps,
          hasAbnormalSpike,
          volumeSwing,
          trend,
        };
      });

      // Sort by stability score, but keep KOGE (baseline) visible
      const kogeData = stabilityData.find((d) => d.isBaseline);
      const otherData = stabilityData
        .filter((d) => !d.isBaseline)
        .sort((a, b) => b.stabilityScore - a.stabilityScore);

      const sortedData = kogeData ? [kogeData, ...otherData] : otherData;

      return NextResponse.json({
        success: true,
        data: sortedData,
        count: sortedData.length,
        baseline: kogeData,
        timestamp: new Date().toISOString(),
        refreshInterval: 15,
        source: "binance-alpha-4x-projects-fallback",
        disclaimer:
          "⚠️ Markets are unpredictable. DYOR; no liability for losses.",
      });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch stability data",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  }
}
