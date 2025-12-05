/**
 * Binance Market Ticker API Route
 * GET /api/binance/market/ticker
 * Returns latest market prices from real Binance API
 */

import { NextResponse } from "next/server";
import {
  binanceClient,
  formatTickerData,
  POPULAR_PAIRS,
} from "@/lib/api/binance-client";

export async function GET() {
  try {
    // Fetch real data from Binance API
    const tickerData = await binanceClient.get24hrTicker();

    // Filter for popular pairs only
    const popularPairsArray: string[] = [...POPULAR_PAIRS];
    const filteredData = Array.isArray(tickerData)
      ? tickerData.filter((ticker: { symbol: string }) =>
          popularPairsArray.includes(ticker.symbol),
        )
      : [];

    // Format the data
    const formattedData = filteredData.map(
      (ticker: {
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        volume: string;
        highPrice: string;
        lowPrice: string;
      }) => formatTickerData(ticker),
    );

    return NextResponse.json({
      success: true,
      data: formattedData,
      timestamp: new Date().toISOString(),
      source: "binance-api",
    });
  } catch (error) {
    console.error("Error fetching market ticker from Binance:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market data from Binance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
