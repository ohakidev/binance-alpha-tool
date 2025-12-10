/**
 * StabilityWebSocket Service
 * Real-time WebSocket connection for Binance Alpha DEX stability monitoring
 *
 * Criteria for stability calculation:
 * - Price range (Max - Min) in short time window (1-5 minutes)
 * - Volume swings
 * - Abnormal spikes detection
 * - Short-term trend analysis
 *
 * Spread BPS formula: ((Ask - Bid) / Ask) * 10,000
 * Stability: Price range < 0.01% in 1 minute = STABLE
 */

export type StabilityLevel =
  | "STABLE"
  | "MODERATE"
  | "UNSTABLE"
  | "NO_TRADE"
  | "CHECKING";

export interface TradeData {
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface PriceBuffer {
  prices: number[];
  timestamps: number[];
  volumes: number[];
  maxSize: number;
}

export interface TokenStabilityData {
  symbol: string;
  alphaId: string;
  contractAddress: string;
  chain: string;
  stability: StabilityLevel;
  spreadBps: number;
  spreadPercent: number;
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  priceHigh1m: number;
  priceLow1m: number;
  priceRange1m: number;
  priceRangePercent: number;
  volume1m: number;
  tradeCount1m: number;
  lastTradeTime: number;
  trend: "UP" | "DOWN" | "FLAT";
  volatilityScore: number;
  hasAbnormalSpike: boolean;
  lastUpdate: number;
}

export interface StabilityConfig {
  // Time window for stability calculation (ms)
  timeWindowMs: number;
  // Price buffer size (number of trades to keep)
  bufferSize: number;
  // Stable threshold: price range percent < this = STABLE
  stableThresholdPercent: number;
  // Moderate threshold: price range percent < this = MODERATE
  moderateThresholdPercent: number;
  // Abnormal spike threshold (percent change)
  spikeThresholdPercent: number;
  // Minimum trades required for stability calculation
  minTradesRequired: number;
  // No trade timeout (ms)
  noTradeTimeoutMs: number;
}

export interface WebSocketMessage {
  type: "trade" | "orderbook" | "ticker" | "error";
  data: unknown;
  symbol: string;
  timestamp: number;
}

export type StabilityUpdateCallback = (data: TokenStabilityData) => void;
export type ConnectionStatusCallback = (
  status: "connected" | "disconnected" | "reconnecting" | "error",
  message?: string,
) => void;

// Default configuration
const DEFAULT_CONFIG: StabilityConfig = {
  timeWindowMs: 60000, // 1 minute
  bufferSize: 500,
  stableThresholdPercent: 0.01, // 0.01% = very stable (flatline)
  moderateThresholdPercent: 0.5, // 0.5% = moderate
  spikeThresholdPercent: 2.0, // 2% = abnormal spike
  minTradesRequired: 3,
  noTradeTimeoutMs: 30000, // 30 seconds
};

// Binance Alpha Trade API for fetching recent trades
const BINANCE_ALPHA_AGG_TRADES_URL =
  "https://www.binance.com/bapi/defi/v1/public/alpha-trade/agg-trades";

// Binance Alpha Token List API
const BINANCE_ALPHA_TOKEN_LIST_URL =
  "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list";

/**
 * StabilityWebSocket Service Class
 * Manages real-time stability monitoring for Binance Alpha tokens
 */
export class StabilityWebSocket {
  private config: StabilityConfig;
  private priceBuffers: Map<string, PriceBuffer> = new Map();
  private stabilityData: Map<string, TokenStabilityData> = new Map();
  private tokenMap: Map<
    string,
    { alphaId: string; contractAddress: string; chain: string }
  > = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private updateCallbacks: Set<StabilityUpdateCallback> = new Set();
  private statusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private isRunning = false;
  private lastPollTime = 0;
  private pollIntervalMs = 3000; // Poll every 3 seconds for near real-time

  constructor(config: Partial<StabilityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Subscribe to stability updates
   */
  onStabilityUpdate(callback: StabilityUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: ConnectionStatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * Initialize token map from Binance Alpha API
   */
  async initializeTokens(): Promise<void> {
    try {
      const response = await fetch(BINANCE_ALPHA_TOKEN_LIST_URL, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token list: ${response.status}`);
      }

      const data = await response.json();
      if (data.code !== "000000" || !Array.isArray(data.data)) {
        throw new Error("Invalid token list response");
      }

      // Filter 4x multiplier tokens and KOGE
      const tokens = data.data.filter(
        (t: { mulPoint: number; symbol: string }) =>
          t.mulPoint === 4 || t.symbol === "KOGE",
      );

      this.tokenMap.clear();
      for (const token of tokens) {
        this.tokenMap.set(token.symbol, {
          alphaId: token.alphaId?.toString() || "",
          contractAddress: token.contractAddress || "",
          chain: token.chainName || "BSC",
        });

        // Initialize price buffer
        this.priceBuffers.set(token.symbol, {
          prices: [],
          timestamps: [],
          volumes: [],
          maxSize: this.config.bufferSize,
        });

        // Initialize stability data
        this.stabilityData.set(token.symbol, {
          symbol: token.symbol,
          alphaId: token.alphaId?.toString() || "",
          contractAddress: token.contractAddress || "",
          chain: token.chainName || "BSC",
          stability: "CHECKING",
          spreadBps: 0,
          spreadPercent: 0,
          currentPrice: parseFloat(token.price) || 0,
          bidPrice: 0,
          askPrice: 0,
          priceHigh1m: 0,
          priceLow1m: 0,
          priceRange1m: 0,
          priceRangePercent: 0,
          volume1m: 0,
          tradeCount1m: 0,
          lastTradeTime: 0,
          trend: "FLAT",
          volatilityScore: 0,
          hasAbnormalSpike: false,
          lastUpdate: Date.now(),
        });
      }

      console.log(`[StabilityWS] Initialized ${this.tokenMap.size} tokens`);
    } catch (error) {
      console.error("[StabilityWS] Failed to initialize tokens:", error);
      throw error;
    }
  }

  /**
   * Start polling for real-time trade data
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("[StabilityWS] Already running");
      return;
    }

    this.isRunning = true;
    this.notifyStatus("connected");

    // Initialize tokens first
    await this.initializeTokens();

    // Start polling loop
    this.pollingInterval = setInterval(() => {
      this.pollAllTokens();
    }, this.pollIntervalMs);

    // Initial poll
    this.pollAllTokens();

    console.log("[StabilityWS] Started real-time stability monitoring");
  }

  /**
   * Stop the service
   */
  stop(): void {
    this.isRunning = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.notifyStatus("disconnected");
    console.log("[StabilityWS] Stopped");
  }

  /**
   * Poll all tokens for recent trades
   */
  private async pollAllTokens(): Promise<void> {
    if (!this.isRunning) return;

    const now = Date.now();
    this.lastPollTime = now;

    // Process tokens in parallel batches to avoid rate limiting
    const symbols = Array.from(this.tokenMap.keys());
    const batchSize = 5;

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((symbol) => this.fetchAndProcessTrades(symbol)),
      );

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Fetch and process recent trades for a token
   */
  private async fetchAndProcessTrades(symbol: string): Promise<void> {
    const tokenInfo = this.tokenMap.get(symbol);
    if (!tokenInfo || !tokenInfo.alphaId) return;

    try {
      // Construct symbol for Alpha API (e.g., ALPHA_175USDT)
      const alphaSymbol = `ALPHA_${tokenInfo.alphaId}USDT`;

      const response = await fetch(
        `${BINANCE_ALPHA_AGG_TRADES_URL}?symbol=${alphaSymbol}&limit=100`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        },
      );

      if (!response.ok) {
        // Token might not have trading pairs, mark as NO_TRADE
        this.updateTokenStability(symbol, [], Date.now());
        return;
      }

      const trades = await response.json();

      if (!Array.isArray(trades) || trades.length === 0) {
        this.updateTokenStability(symbol, [], Date.now());
        return;
      }

      // Parse trades
      const parsedTrades: TradeData[] = trades.map(
        (t: { p: string; q: string; T: number; m: boolean }) => ({
          price: parseFloat(t.p),
          quantity: parseFloat(t.q),
          timestamp: t.T,
          isBuyerMaker: t.m,
        }),
      );

      this.updateTokenStability(symbol, parsedTrades, Date.now());
    } catch (error) {
      // Silent fail for individual tokens
      console.debug(`[StabilityWS] Error fetching ${symbol}:`, error);
    }
  }

  /**
   * Update token stability based on recent trades
   */
  private updateTokenStability(
    symbol: string,
    trades: TradeData[],
    now: number,
  ): void {
    const buffer = this.priceBuffers.get(symbol);
    const currentData = this.stabilityData.get(symbol);

    if (!buffer || !currentData) return;

    // Add new trades to buffer
    for (const trade of trades) {
      // Only add trades within time window
      if (now - trade.timestamp <= this.config.timeWindowMs) {
        buffer.prices.push(trade.price);
        buffer.timestamps.push(trade.timestamp);
        buffer.volumes.push(trade.quantity * trade.price);
      }
    }

    // Remove old data outside time window
    const cutoffTime = now - this.config.timeWindowMs;
    while (buffer.timestamps.length > 0 && buffer.timestamps[0] < cutoffTime) {
      buffer.prices.shift();
      buffer.timestamps.shift();
      buffer.volumes.shift();
    }

    // Trim buffer to max size
    while (buffer.prices.length > buffer.maxSize) {
      buffer.prices.shift();
      buffer.timestamps.shift();
      buffer.volumes.shift();
    }

    // Calculate stability metrics
    const stabilityData = this.calculateStability(symbol, buffer, now);

    // Update stored data
    this.stabilityData.set(symbol, stabilityData);

    // Notify subscribers
    this.notifyUpdate(stabilityData);
  }

  /**
   * Calculate stability metrics from price buffer
   */
  private calculateStability(
    symbol: string,
    buffer: PriceBuffer,
    now: number,
  ): TokenStabilityData {
    const currentData = this.stabilityData.get(symbol)!;
    const tokenInfo = this.tokenMap.get(symbol);

    // No trades case
    if (buffer.prices.length < this.config.minTradesRequired) {
      const lastTrade = buffer.timestamps[buffer.timestamps.length - 1] || 0;
      const timeSinceLastTrade = now - lastTrade;

      return {
        ...currentData,
        stability:
          timeSinceLastTrade > this.config.noTradeTimeoutMs
            ? "NO_TRADE"
            : "CHECKING",
        lastUpdate: now,
      };
    }

    // Calculate price range
    const priceHigh1m = Math.max(...buffer.prices);
    const priceLow1m = Math.min(...buffer.prices);
    const priceRange1m = priceHigh1m - priceLow1m;
    const midPrice = (priceHigh1m + priceLow1m) / 2;
    const priceRangePercent =
      midPrice > 0 ? (priceRange1m / midPrice) * 100 : 0;

    // Calculate current price (latest trade)
    const currentPrice = buffer.prices[buffer.prices.length - 1];

    // Use price range as spread approximation for DEX
    // For DEX without orderbook, bid ≈ low price, ask ≈ high price
    const bidPrice = priceLow1m;
    const askPrice = priceHigh1m;

    // Spread BPS: ((Ask - Bid) / Ask) * 10,000
    const spreadBps =
      askPrice > 0 ? ((askPrice - bidPrice) / askPrice) * 10000 : 0;
    const spreadPercent = spreadBps / 100;

    // Calculate volume
    const volume1m = buffer.volumes.reduce((a, b) => a + b, 0);
    const tradeCount1m = buffer.prices.length;

    // Determine trend
    let trend: "UP" | "DOWN" | "FLAT" = "FLAT";
    if (buffer.prices.length >= 2) {
      const firstPrice = buffer.prices[0];
      const lastPrice = buffer.prices[buffer.prices.length - 1];
      const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;

      if (changePercent > 0.1) trend = "UP";
      else if (changePercent < -0.1) trend = "DOWN";
    }

    // Detect abnormal spikes
    let hasAbnormalSpike = false;
    for (let i = 1; i < buffer.prices.length; i++) {
      const changePercent = Math.abs(
        ((buffer.prices[i] - buffer.prices[i - 1]) / buffer.prices[i - 1]) *
          100,
      );
      if (changePercent >= this.config.spikeThresholdPercent) {
        hasAbnormalSpike = true;
        break;
      }
    }

    // Calculate volatility score (0-100)
    const volatilityScore = Math.min(
      100,
      (priceRangePercent / this.config.moderateThresholdPercent) * 50 +
        (hasAbnormalSpike ? 50 : 0),
    );

    // Determine stability level
    let stability: StabilityLevel;
    if (hasAbnormalSpike) {
      stability = "UNSTABLE";
    } else if (priceRangePercent <= this.config.stableThresholdPercent) {
      // Very stable - flatline condition
      stability = "STABLE";
    } else if (priceRangePercent <= this.config.moderateThresholdPercent) {
      stability = "MODERATE";
    } else {
      stability = "UNSTABLE";
    }

    // Also check spread - very high spread indicates instability
    if (spreadBps > 500) {
      // > 5% spread
      stability = stability === "STABLE" ? "MODERATE" : stability;
    }
    if (spreadBps > 1500) {
      // > 15% spread
      stability = "UNSTABLE";
    }

    return {
      symbol,
      alphaId: tokenInfo?.alphaId || "",
      contractAddress: tokenInfo?.contractAddress || "",
      chain: tokenInfo?.chain || "BSC",
      stability,
      spreadBps: Number(spreadBps.toFixed(2)),
      spreadPercent: Number(spreadPercent.toFixed(4)),
      currentPrice,
      bidPrice,
      askPrice,
      priceHigh1m,
      priceLow1m,
      priceRange1m,
      priceRangePercent: Number(priceRangePercent.toFixed(4)),
      volume1m,
      tradeCount1m,
      lastTradeTime: buffer.timestamps[buffer.timestamps.length - 1] || 0,
      trend,
      volatilityScore: Number(volatilityScore.toFixed(2)),
      hasAbnormalSpike,
      lastUpdate: now,
    };
  }

  /**
   * Get all stability data
   */
  getAllStabilityData(): TokenStabilityData[] {
    return Array.from(this.stabilityData.values());
  }

  /**
   * Get stability data for a specific token
   */
  getStabilityData(symbol: string): TokenStabilityData | undefined {
    return this.stabilityData.get(symbol);
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    stableCount: number;
    moderateCount: number;
    unstableCount: number;
    noTradeCount: number;
    checkingCount: number;
    totalTokens: number;
    avgSpreadBps: number;
    lastUpdate: number;
  } {
    const data = this.getAllStabilityData();
    let stableCount = 0;
    let moderateCount = 0;
    let unstableCount = 0;
    let noTradeCount = 0;
    let checkingCount = 0;
    let totalSpread = 0;
    let spreadCount = 0;

    for (const item of data) {
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

      if (item.spreadBps > 0) {
        totalSpread += item.spreadBps;
        spreadCount++;
      }
    }

    return {
      stableCount,
      moderateCount,
      unstableCount,
      noTradeCount,
      checkingCount,
      totalTokens: data.length,
      avgSpreadBps: spreadCount > 0 ? totalSpread / spreadCount : 0,
      lastUpdate: this.lastPollTime,
    };
  }

  /**
   * Notify all update subscribers
   */
  private notifyUpdate(data: TokenStabilityData): void {
    for (const callback of this.updateCallbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error("[StabilityWS] Update callback error:", error);
      }
    }
  }

  /**
   * Notify all status subscribers
   */
  private notifyStatus(
    status: "connected" | "disconnected" | "reconnecting" | "error",
    message?: string,
  ): void {
    for (const callback of this.statusCallbacks) {
      try {
        callback(status, message);
      } catch (error) {
        console.error("[StabilityWS] Status callback error:", error);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StabilityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): StabilityConfig {
    return { ...this.config };
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let instance: StabilityWebSocket | null = null;

/**
 * Get singleton instance of StabilityWebSocket
 */
export function getStabilityWebSocket(
  config?: Partial<StabilityConfig>,
): StabilityWebSocket {
  if (!instance) {
    instance = new StabilityWebSocket(config);
  } else if (config) {
    instance.updateConfig(config);
  }
  return instance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetStabilityWebSocket(): void {
  if (instance) {
    instance.stop();
    instance = null;
  }
}

export default StabilityWebSocket;
