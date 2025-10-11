/**
 * Binance API Client
 * Handles authentication and API calls to Binance
 */

import crypto from "crypto";

interface BinanceConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.binance.com";

export class BinanceClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config?: BinanceConfig) {
    this.apiKey = config?.apiKey || process.env.BINANCE_API_KEY || "";
    this.apiSecret = config?.apiSecret || process.env.BINANCE_API_SECRET || "";
    this.baseUrl = config?.baseUrl || DEFAULT_BASE_URL;
  }

  /**
   * Create HMAC SHA256 signature for authenticated requests
   */
  private createSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(queryString)
      .digest("hex");
  }

  /**
   * Make authenticated request to Binance API
   */
  private async makeRequest(
    endpoint: string,
    params: Record<string, string | number> = {},
    signed: boolean = false
  ): Promise<unknown> {
    const queryParams = new URLSearchParams();

    // Add parameters
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    // Add timestamp for signed requests
    if (signed) {
      queryParams.append("timestamp", Date.now().toString());
      const signature = this.createSignature(queryParams.toString());
      queryParams.append("signature", signature);
    }

    const url = `${this.baseUrl}${endpoint}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey && signed) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      next: { revalidate: 5 }, // Cache for 5 seconds
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Binance API Error: ${error.msg || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get 24hr ticker price change statistics
   * https://binance-docs.github.io/apidocs/spot/en/#24hr-ticker-price-change-statistics
   */
  async get24hrTicker(symbol?: string) {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;
    return this.makeRequest("/api/v3/ticker/24hr", params);
  }

  /**
   * Get latest price for a symbol or symbols
   */
  async getTickerPrice(symbol?: string) {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;
    return this.makeRequest("/api/v3/ticker/price", params);
  }

  /**
   * Get current average price
   */
  async getAvgPrice(symbol: string) {
    return this.makeRequest("/api/v3/avgPrice", { symbol });
  }

  /**
   * Get kline/candlestick data
   */
  async getKlines(symbol: string, interval: string, limit: number = 100) {
    return this.makeRequest("/api/v3/klines", {
      symbol,
      interval,
      limit,
    });
  }

  /**
   * Get account information (requires API key)
   */
  async getAccountInfo() {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("API key and secret required for account info");
    }
    return this.makeRequest("/api/v3/account", {}, true);
  }

  /**
   * Get all account orders (requires API key)
   */
  async getAllOrders(symbol: string, limit: number = 500) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("API key and secret required for order history");
    }
    return this.makeRequest("/api/v3/allOrders", { symbol, limit }, true);
  }

  /**
   * Get server time (for timestamp synchronization)
   */
  async getServerTime() {
    const data = (await this.makeRequest("/api/v3/time")) as {
      serverTime: number;
    };
    return data.serverTime;
  }

  /**
   * Test connectivity
   */
  async ping() {
    return this.makeRequest("/api/v3/ping");
  }
}

// Export singleton instance
export const binanceClient = new BinanceClient();

// Helper function to format Binance ticker data
export interface FormattedTickerData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
}

interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  highPrice: string;
  lowPrice: string;
}

export function formatTickerData(
  ticker: BinanceTickerResponse
): FormattedTickerData {
  return {
    symbol: ticker.symbol.replace("USDT", ""),
    name: ticker.symbol.replace("USDT", ""),
    price: parseFloat(ticker.lastPrice),
    change24h: parseFloat(ticker.priceChangePercent),
    volume: parseFloat(ticker.volume),
    high24h: parseFloat(ticker.highPrice),
    low24h: parseFloat(ticker.lowPrice),
  };
}

// Popular trading pairs for market ticker
export const POPULAR_PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "MATICUSDT",
];
