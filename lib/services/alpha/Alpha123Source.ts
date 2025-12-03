/**
 * Alpha123 Data Source
 * Fallback implementation of IAlphaDataSource for alpha123.uk API
 */

import {
  IAlphaDataSource,
  AlphaDataSourceType,
  AlphaToken,
  Alpha123ProjectRaw,
  ChainName,
} from "@/lib/types/alpha.types";
import {
  normalizeChainName,
  mapAirdropType,
  determineAirdropStatus,
  parseDateTime,
  DEFAULT_API_HEADERS,
  API_URLS,
  DEFAULT_TIMEOUT,
  HEALTH_CHECK_TIMEOUT,
} from "@/lib/constants/alpha.constants";

/**
 * Alpha123 Data Source
 * Fetches token data from alpha123.uk API as fallback
 */
export class Alpha123Source implements IAlphaDataSource {
  readonly name = AlphaDataSourceType.ALPHA123;
  readonly priority = 2; // Secondary priority

  private baseUrl: string;
  private timeout: number;

  constructor(options: { baseUrl?: string; timeout?: number } = {}) {
    this.baseUrl = options.baseUrl || API_URLS.ALPHA123;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Check if Alpha123 API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        HEALTH_CHECK_TIMEOUT,
      );

      const response = await fetch(`${this.baseUrl}/api/data`, {
        method: "GET",
        headers: DEFAULT_API_HEADERS,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn("⚠️ Alpha123 API not available:", error);
      return false;
    }
  }

  /**
   * Fetch all tokens from Alpha123 API
   */
  async fetchTokens(): Promise<AlphaToken[]> {
    console.log("🔍 Fetching from Alpha123 API...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/data?fresh=1`, {
        method: "GET",
        headers: DEFAULT_API_HEADERS,
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Alpha123 API error: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      let projects: Alpha123ProjectRaw[] = [];

      if (Array.isArray(data)) {
        projects = data;
      } else if (data.data && Array.isArray(data.data)) {
        projects = data.data;
      } else {
        console.warn("⚠️ Unexpected data format from Alpha123");
        return [];
      }

      console.log(`✅ Found ${projects.length} projects from Alpha123`);

      return projects.map((project) => this.transformProject(project));
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Alpha123 API request timeout");
      }

      throw error;
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
   * Fetch price for a specific token
   */
  async fetchTokenPrice(token: string): Promise<number | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/price/${token}`, {
        headers: DEFAULT_API_HEADERS,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.price || null;
    } catch (error) {
      console.error(`Failed to fetch price for ${token}:`, error);
      return null;
    }
  }

  /**
   * Transform Alpha123 project to normalized AlphaToken
   */
  private transformProject(raw: Alpha123ProjectRaw): AlphaToken {
    const claimDate = parseDateTime(raw.date, raw.time);
    const price = raw.price || 0;
    const chainName = normalizeChainName(raw.chain_id) as ChainName;
    const type = mapAirdropType(raw.type);
    const status = determineAirdropStatus(claimDate);

    return {
      id: `alpha123_${raw.token}`,
      symbol: raw.token,
      name: raw.name || raw.token,
      alphaId: "",
      chain: chainName,
      chainId: raw.chain_id || "56",
      contractAddress: raw.contract_address || "",
      price,
      priceChange24h: 0,
      priceHigh24h: 0,
      priceLow24h: 0,
      volume24h: 0,
      marketCap: 0,
      fdv: 0,
      liquidity: 0,
      holders: 0,
      score: raw.points || 0,
      mulPoint: 1,
      onlineTge: type === "TGE",
      onlineAirdrop: true,
      listingTime: claimDate,
      hotTag: false,
      isOffline: false,
      type,
      status,
      estimatedValue: price > 0 ? Math.round(price * 100) / 100 : null,
      iconUrl: "",
      lastUpdate: new Date(),
    };
  }
}

/**
 * Export singleton instance
 */
export const alpha123Source = new Alpha123Source();
