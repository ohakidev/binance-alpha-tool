/**
 * Binance Alpha Data Source
 * Implementation of IAlphaDataSource for official Binance Alpha API
 */

import { AirdropType, AirdropStatus } from "@prisma/client";
import {
  IAlphaDataSource,
  AlphaDataSourceType,
  AlphaToken,
  BinanceAlphaTokenRaw,
  BinanceAlphaApiResponse,
  ChainName,
} from "@/lib/types/alpha.types";
import {
  normalizeChainName,
  DEFAULT_API_HEADERS,
  API_URLS,
  BINANCE_ALPHA_DEFAULT_API_URL,
  DEFAULT_TIMEOUT,
  HEALTH_CHECK_TIMEOUT,
} from "@/lib/constants/alpha.constants";

const BINANCE_ALPHA_DEPRECATED_API_URLS = new Set([
  "https://www.binance.com/bapi/composite/v1/public/alpha/project/list",
]);
const BINANCE_ALPHA_TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Binance Alpha Data Source
 * Fetches token data from official Binance Alpha API
 */
export class BinanceAlphaSource implements IAlphaDataSource {
  readonly name = AlphaDataSourceType.BINANCE_ALPHA;
  readonly priority = 1;

  private apiUrl: string;
  private timeout: number;
  private tokensCache:
    | {
        tokens: AlphaToken[];
        expiresAt: number;
      }
    | null = null;
  private tokensRequestPromise: Promise<AlphaToken[]> | null = null;

  constructor(options: { apiUrl?: string; timeout?: number } = {}) {
    this.apiUrl = this.normalizeApiUrl(options.apiUrl || API_URLS.BINANCE_ALPHA);
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  private normalizeApiUrl(url: string): string {
    return BINANCE_ALPHA_DEPRECATED_API_URLS.has(url)
      ? BINANCE_ALPHA_DEFAULT_API_URL
      : url;
  }

  private getCandidateUrls(): string[] {
    const urls = [this.apiUrl];

    if (this.apiUrl !== BINANCE_ALPHA_DEFAULT_API_URL) {
      urls.push(BINANCE_ALPHA_DEFAULT_API_URL);
    }

    return urls;
  }

  private async fetchTokensFromUrl(url: string): Promise<AlphaToken[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: DEFAULT_API_HEADERS,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Binance Alpha API error: ${response.status} ${response.statusText}`,
        );
      }

      const data: BinanceAlphaApiResponse = await response.json();

      if (data.code !== "000000") {
        throw new Error(
          `Binance Alpha API error: ${data.message || "Unknown error"}`,
        );
      }

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid Binance Alpha API response structure");
      }

      return data.data.map((token) => this.transformToken(token));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Binance Alpha API request timeout");
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if Binance Alpha API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      for (const url of this.getCandidateUrls()) {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          HEALTH_CHECK_TIMEOUT,
        );

        try {
          const response = await fetch(url, {
            method: "GET",
            headers: DEFAULT_API_HEADERS,
            signal: controller.signal,
          });

          if (response.ok) {
            return true;
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }

      return false;
    } catch (error) {
      console.warn("Binance Alpha API not available:", error);
      return false;
    }
  }

  /**
   * Fetch all tokens from Binance Alpha API
   */
  async fetchTokens(): Promise<AlphaToken[]> {
    const now = Date.now();
    if (this.tokensCache && this.tokensCache.expiresAt > now) {
      return this.tokensCache.tokens;
    }

    if (this.tokensRequestPromise) {
      return this.tokensRequestPromise;
    }

    console.log("Fetching from Binance Alpha API...");
    this.tokensRequestPromise = (async () => {
      let lastError: unknown = null;

      for (const url of this.getCandidateUrls()) {
        try {
          const tokens = await this.fetchTokensFromUrl(url);
          console.log(`Found ${tokens.length} tokens from Binance Alpha API`);
          this.tokensCache = {
            tokens,
            expiresAt: Date.now() + BINANCE_ALPHA_TOKEN_CACHE_TTL_MS,
          };
          return tokens;
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error(String(lastError || "Unknown Binance Alpha API error"));
    })();

    try {
      return await this.tokensRequestPromise;
    } finally {
      this.tokensRequestPromise = null;
    }
  }

  /**
   * Fetch a single token by symbol
   */
  async fetchToken(symbol: string): Promise<AlphaToken | null> {
    const tokens = await this.fetchTokens();
    return (
      tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase()) ||
      null
    );
  }

  /**
   * Transform raw Binance token to normalized AlphaToken
   */
  private transformToken(raw: BinanceAlphaTokenRaw): AlphaToken {
    const price = this.parseNumber(raw.price);
    const priceChange24h = this.parseNumber(raw.percentChange24h);
    const volume24h = this.parseNumber(raw.volume24h);
    const marketCap = this.parseNumber(raw.marketCap);
    const liquidity = this.parseNumber(raw.liquidity);
    const holders = parseInt(raw.holders) || 0;
    const listingTime = raw.listingTime > 0 ? new Date(raw.listingTime) : null;

    return {
      id: raw.alphaId || raw.tokenId,
      symbol: raw.symbol,
      name: raw.name,
      alphaId: raw.alphaId,
      chain: normalizeChainName(raw.chainId, raw.chainName) as ChainName,
      chainId: raw.chainId,
      contractAddress: raw.contractAddress,
      price,
      priceChange24h,
      priceHigh24h: this.parseNumber(raw.priceHigh24h),
      priceLow24h: this.parseNumber(raw.priceLow24h),
      volume24h,
      marketCap,
      fdv: this.parseNumber(raw.fdv),
      liquidity,
      holders,
      score: raw.score || 0,
      mulPoint: raw.mulPoint || 1,
      onlineTge: raw.onlineTge,
      onlineAirdrop: raw.onlineAirdrop,
      listingTime,
      hotTag: raw.hotTag,
      isOffline: raw.offline || raw.offsell,
      type: this.determineType(raw),
      status: this.determineStatus(raw),
      estimatedValue: price > 0 ? Math.round(price * 100) / 100 : null,
      iconUrl: raw.iconUrl || "",
      lastUpdate: new Date(),
    };
  }

  /**
   * Parse string number to float
   */
  private parseNumber(value: string | number | undefined): number {
    if (typeof value === "number") return value;
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Determine token type based on raw data
   */
  private determineType(raw: BinanceAlphaTokenRaw): AirdropType {
    return raw.onlineTge ? "TGE" : "AIRDROP";
  }

  /**
   * Determine token status based on raw data
   */
  private determineStatus(raw: BinanceAlphaTokenRaw): AirdropStatus {
    const now = Date.now();
    const listingTime = raw.listingTime || 0;

    if (raw.offline || raw.offsell) {
      return "ENDED";
    }

    if (listingTime > now) {
      return "UPCOMING";
    }

    if (raw.onlineAirdrop && listingTime > 0 && listingTime <= now) {
      return "CLAIMABLE";
    }

    if (raw.onlineAirdrop) {
      return "CLAIMABLE";
    }

    return "UPCOMING";
  }
}

/**
 * Export singleton instance
 */
export const binanceAlphaSource = new BinanceAlphaSource();
