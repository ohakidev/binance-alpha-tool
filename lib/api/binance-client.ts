/**
 * Binance API Client
 * Handles authentication and API calls to Binance
 * Extends BaseApiClient following OOP principles
 */

import crypto from "crypto";
import { BaseApiClient, ApiClientConfig } from "./base-client";

// ============= Types =============

export interface BinanceClientConfig extends Partial<
  Omit<ApiClientConfig, "baseUrl">
> {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
}

export interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  highPrice: string;
  lowPrice: string;
}

export interface FormattedTickerData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
}

export interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

export interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  balances: Array<{
    asset: string;
    free: string;
    locked: string;
  }>;
}

// ============= Constants =============

const DEFAULT_BASE_URL = "https://api.binance.com";

/** Popular trading pairs for market ticker */
export const POPULAR_PAIRS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "MATICUSDT",
] as const;

// ============= Binance Client Class =============

/**
 * Binance API Client
 * Provides methods to interact with Binance public and private APIs
 *
 * @extends BaseApiClient
 * @example
 * ```typescript
 * const client = new BinanceClient({
 *   apiKey: process.env.BINANCE_API_KEY,
 *   apiSecret: process.env.BINANCE_API_SECRET,
 * });
 *
 * const ticker = await client.get24hrTicker('BTCUSDT');
 * ```
 */
export class BinanceClient extends BaseApiClient {
  private readonly apiSecret: string;

  constructor(config: BinanceClientConfig = {}) {
    const apiKey = config.apiKey || process.env.BINANCE_API_KEY || "";
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;

    super({
      baseUrl,
      apiKey,
      timeout: config.timeout ?? 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.apiSecret = config.apiSecret || process.env.BINANCE_API_SECRET || "";
  }

  /**
   * Get client name
   */
  get name(): string {
    return "BinanceClient";
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
   * Override mergeHeaders to use Binance's API key header format
   */
  protected override mergeHeaders(
    customHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Binance uses X-MBX-APIKEY header for authentication
    if (this.apiKey) {
      headers["X-MBX-APIKEY"] = this.apiKey;
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  /**
   * Make signed request to Binance API
   */
  private async makeSignedRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
  ): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("API key and secret required for signed requests");
    }

    const queryParams = new URLSearchParams();

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    // Add timestamp for signed requests
    queryParams.append("timestamp", Date.now().toString());

    // Create signature
    const signature = this.createSignature(queryParams.toString());
    queryParams.append("signature", signature);

    const url = `${endpoint}?${queryParams.toString()}`;

    return this.get<T>(url, { revalidate: 5 });
  }

  /**
   * Health check - test connectivity to Binance API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test connectivity to Binance API
   */
  async ping(): Promise<void> {
    await this.get("/api/v3/ping");
  }

  /**
   * Get server time (for timestamp synchronization)
   */
  async getServerTime(): Promise<number> {
    const data = await this.get<{ serverTime: number }>("/api/v3/time");
    return data.serverTime;
  }

  /**
   * Get 24hr ticker price change statistics
   * @see https://binance-docs.github.io/apidocs/spot/en/#24hr-ticker-price-change-statistics
   */
  async get24hrTicker(
    symbol?: string,
  ): Promise<BinanceTickerResponse | BinanceTickerResponse[]> {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;

    return this.get<BinanceTickerResponse | BinanceTickerResponse[]>(
      "/api/v3/ticker/24hr",
      { params, revalidate: 5 },
    );
  }

  /**
   * Get latest price for a symbol or symbols
   */
  async getTickerPrice(
    symbol?: string,
  ): Promise<
    { symbol: string; price: string } | Array<{ symbol: string; price: string }>
  > {
    const params: Record<string, string> = {};
    if (symbol) params.symbol = symbol;

    return this.get("/api/v3/ticker/price", { params, revalidate: 5 });
  }

  /**
   * Get current average price for a symbol
   */
  async getAvgPrice(symbol: string): Promise<{ mins: number; price: string }> {
    return this.get("/api/v3/avgPrice", { params: { symbol } });
  }

  /**
   * Get kline/candlestick data
   */
  async getKlines(
    symbol: string,
    interval: string,
    limit: number = 100,
  ): Promise<BinanceKlineData[]> {
    const data = await this.get<unknown[][]>("/api/v3/klines", {
      params: { symbol, interval, limit },
    });

    // Transform array response to typed objects
    return data.map((k) => ({
      openTime: k[0] as number,
      open: k[1] as string,
      high: k[2] as string,
      low: k[3] as string,
      close: k[4] as string,
      volume: k[5] as string,
      closeTime: k[6] as number,
      quoteVolume: k[7] as string,
      trades: k[8] as number,
      takerBuyBaseVolume: k[9] as string,
      takerBuyQuoteVolume: k[10] as string,
    }));
  }

  /**
   * Get account information (requires API key and secret)
   */
  async getAccountInfo(): Promise<BinanceAccountInfo> {
    return this.makeSignedRequest<BinanceAccountInfo>("/api/v3/account");
  }

  /**
   * Get all account orders (requires API key and secret)
   */
  async getAllOrders(symbol: string, limit: number = 500): Promise<unknown[]> {
    return this.makeSignedRequest("/api/v3/allOrders", { symbol, limit });
  }

  /**
   * Get open orders (requires API key and secret)
   */
  async getOpenOrders(symbol?: string): Promise<unknown[]> {
    const params: Record<string, string | number> = {};
    if (symbol) params.symbol = symbol;
    return this.makeSignedRequest("/api/v3/openOrders", params);
  }

  /**
   * Get exchange information
   */
  async getExchangeInfo(): Promise<unknown> {
    return this.get("/api/v3/exchangeInfo", { revalidate: 3600 });
  }

  /**
   * Get order book depth
   */
  async getDepth(
    symbol: string,
    limit: number = 100,
  ): Promise<{ lastUpdateId: number; bids: string[][]; asks: string[][] }> {
    return this.get("/api/v3/depth", { params: { symbol, limit } });
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(
    symbol: string,
    limit: number = 500,
  ): Promise<
    Array<{
      id: number;
      price: string;
      qty: string;
      time: number;
      isBuyerMaker: boolean;
    }>
  > {
    return this.get("/api/v3/trades", { params: { symbol, limit } });
  }
}

// ============= Helper Functions =============

/**
 * Format Binance ticker data for display
 */
export function formatTickerData(
  ticker: BinanceTickerResponse,
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

/**
 * Check if trading pair is a stablecoin pair
 */
export function isStablecoinPair(symbol: string): boolean {
  const stablecoins = ["USDT", "USDC", "BUSD", "DAI", "TUSD"];
  return stablecoins.some(
    (stable) => symbol.endsWith(stable) || symbol.startsWith(stable),
  );
}

/**
 * Parse symbol to base and quote assets
 */
export function parseSymbol(
  symbol: string,
): { base: string; quote: string } | null {
  const quoteAssets = ["USDT", "USDC", "BUSD", "BTC", "ETH", "BNB"];

  for (const quote of quoteAssets) {
    if (symbol.endsWith(quote)) {
      return {
        base: symbol.slice(0, -quote.length),
        quote,
      };
    }
  }

  return null;
}

// ============= Singleton Export =============

export const binanceClient = new BinanceClient();
