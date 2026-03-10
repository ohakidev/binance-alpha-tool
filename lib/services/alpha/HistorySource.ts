/**
 * External history source
 * Fallback implementation of IAlphaDataSource for history-style project data
 */

import {
  IAlphaDataSource,
  AlphaDataSourceType,
  AlphaToken,
  HistoryProjectRaw,
  ChainName,
} from "@/lib/types/alpha.types";
import {
  normalizeChainName,
  mapAirdropType,
  determineAirdropStatus,
  parseDateTime,
  API_URLS,
  DEFAULT_TIMEOUT,
  HEALTH_CHECK_TIMEOUT,
} from "@/lib/constants/alpha.constants";

/**
 * External history source
 * Fetches token data from the history endpoint as fallback
 */
export class HistorySource implements IAlphaDataSource {
  readonly name = AlphaDataSourceType.HISTORY_SOURCE;
  readonly priority = 2;

  private baseUrl: string;
  private timeout: number;

  constructor(options: { baseUrl?: string; timeout?: number } = {}) {
    this.baseUrl = options.baseUrl || API_URLS.HISTORY_SOURCE;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  private getRequestHeaders(): Record<string, string> {
    return {
      Accept: "application/json, text/plain, */*",
      Origin: this.baseUrl,
      Referer: `${this.baseUrl}/`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        HEALTH_CHECK_TIMEOUT,
      );

      const response = await fetch(`${this.baseUrl}/api/data`, {
        method: "GET",
        headers: this.getRequestHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn("History source API not available:", error);
      return false;
    }
  }

  async fetchTokens(): Promise<AlphaToken[]> {
    console.log("Fetching from history source API...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/data?fresh=1`, {
        method: "GET",
        headers: this.getRequestHeaders(),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`History source API error: ${response.status}`);
      }

      const data = await response.json();
      let projects: HistoryProjectRaw[] = [];

      if (Array.isArray(data)) {
        projects = data;
      } else if (data.airdrops && Array.isArray(data.airdrops)) {
        projects = data.airdrops;
      } else if (data.data && Array.isArray(data.data)) {
        projects = data.data;
      } else {
        console.warn("Unexpected data format from history source");
        return [];
      }

      console.log(`Found ${projects.length} projects from history source`);

      return projects.map((project) => this.transformProject(project));
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("History source API request timeout");
      }

      throw error;
    }
  }

  async fetchToken(symbol: string): Promise<AlphaToken | null> {
    const tokens = await this.fetchTokens();
    return (
      tokens.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase()) ||
      null
    );
  }

  async fetchTokenPrice(token: string): Promise<number | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/price/${token}`, {
        headers: this.getRequestHeaders(),
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

  private parseNumber(value: string | number | undefined): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (!value) {
      return 0;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parsePoints(value: string | number | undefined): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (!value) {
      return 0;
    }

    const match = value.match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
  }

  private transformProject(raw: HistoryProjectRaw): AlphaToken {
    const claimDate = parseDateTime(raw.date, raw.time);
    const price = this.parseNumber(raw.price);
    const amount = this.parseNumber(raw.amount);
    const chainName = normalizeChainName(raw.chain_id) as ChainName;
    const type = mapAirdropType(raw.type);
    const status = determineAirdropStatus(claimDate);

    return {
      id: `history_${raw.token}`,
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
      marketCap: this.parseNumber(raw.market_cap),
      fdv: this.parseNumber(raw.fdv),
      liquidity: 0,
      holders: 0,
      score: this.parsePoints(raw.points),
      mulPoint: 1,
      onlineTge: type === "TGE",
      onlineAirdrop: true,
      listingTime: claimDate,
      hotTag: false,
      isOffline: false,
      type,
      status,
      estimatedValue:
        price > 0 && amount > 0
          ? Math.round(price * amount * 10) / 10
          : price > 0
            ? Math.round(price * 100) / 100
            : null,
      iconUrl: "",
      lastUpdate: new Date(),
    };
  }
}

export const historySource = new HistorySource();
