/**
 * Alpha Service
 * Main service that orchestrates data sources, caching, and database synchronization
 *
 * Follows SOLID principles:
 * - Single Responsibility: Orchestration of data flow
 * - Open/Closed: Extensible through data sources
 * - Liskov Substitution: Data sources are interchangeable
 * - Interface Segregation: Clean interfaces for different operations
 * - Dependency Inversion: Depends on abstractions (IAlphaDataSource)
 */

import { AirdropStatus } from "@prisma/client";
import {
  IAlphaService,
  IAlphaDataSource,
  AlphaDataSourceType,
  AlphaToken,
  AlphaServiceResponse,
  AlphaSyncResult,
  AlphaStats,
  AlphaFilterOptions,
  AlphaPrismaData,
  AlphaEvent,
  AlphaEventHandler,
  AlphaEventType,
} from "@/lib/types/alpha.types";
import {
  CacheService,
  CacheKeys,
  createAlphaCache,
} from "../cache/CacheService";
import { BinanceAlphaSource } from "./BinanceAlphaSource";
import { Alpha123Source } from "./Alpha123Source";
import { prisma } from "@/lib/db/prisma";

/**
 * Alpha Service Configuration
 */
interface AlphaServiceConfig {
  /** Enable automatic fallback to secondary sources */
  enableFallback?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  /** Enable event emission */
  enableEvents?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AlphaServiceConfig = {
  enableFallback: true,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  enableEvents: true,
};

/**
 * Alpha Service
 * Central service for managing Alpha token data
 */
export class AlphaService implements IAlphaService {
  private dataSources: IAlphaDataSource[];
  private cache: CacheService<AlphaToken[]>;
  private config: AlphaServiceConfig;
  private eventHandlers: Map<AlphaEventType, AlphaEventHandler[]> = new Map();
  private lastSyncResult: AlphaSyncResult | null = null;

  constructor(
    dataSources?: IAlphaDataSource[],
    config: AlphaServiceConfig = {},
  ) {
    // Initialize data sources (sorted by priority)
    this.dataSources = dataSources || [
      new BinanceAlphaSource(),
      new Alpha123Source(),
    ];
    this.dataSources.sort((a, b) => a.priority - b.priority);

    // Initialize cache with proper type
    this.cache = createAlphaCache<AlphaToken[]>();

    // Merge configuration
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get all tokens with optional force refresh
   */
  async getTokens(
    forceRefresh: boolean = false,
  ): Promise<AlphaServiceResponse> {
    const cacheKey = CacheKeys.allTokens();

    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.emit("cache:hit", { key: cacheKey });
        return this.createResponse(cached, AlphaDataSourceType.CACHE);
      }
      this.emit("cache:miss", { key: cacheKey });
    }

    // Fetch from data sources
    let tokens: AlphaToken[] = [];
    let source: AlphaDataSourceType = AlphaDataSourceType.CACHE;
    let error: string | undefined;

    for (const dataSource of this.dataSources) {
      try {
        const isAvailable = await dataSource.isAvailable();
        if (!isAvailable) {
          console.warn(`⚠️ Data source ${dataSource.name} is not available`);
          continue;
        }

        tokens = await dataSource.fetchTokens();
        source = dataSource.name;

        // Cache the results
        this.cache.set(cacheKey, tokens, source);

        console.log(`✅ Fetched ${tokens.length} tokens from ${source}`);
        break;
      } catch (err) {
        console.error(`❌ Error fetching from ${dataSource.name}:`, err);
        error = err instanceof Error ? err.message : "Unknown error";

        if (!this.config.enableFallback) {
          break;
        }
      }
    }

    // If all sources failed, try to return stale cache
    if (tokens.length === 0) {
      const staleEntry = this.cache.getEntry(cacheKey);
      if (staleEntry) {
        console.log("📦 Returning stale cache data");
        this.emit("cache:expired", { key: cacheKey });
        return this.createResponse(
          staleEntry.data,
          AlphaDataSourceType.CACHE,
          error,
        );
      }
    }

    return this.createResponse(tokens, source, error);
  }

  /**
   * Get tokens filtered by status
   */
  async getTokensByStatus(
    status: AirdropStatus,
    forceRefresh: boolean = false,
  ): Promise<AlphaServiceResponse> {
    const response = await this.getTokens(forceRefresh);
    const filtered = response.data.filter((t) => t.status === status);

    return {
      ...response,
      data: filtered,
      count: filtered.length,
    };
  }

  /**
   * Get active airdrops
   */
  async getActiveAirdrops(
    forceRefresh: boolean = false,
  ): Promise<AlphaServiceResponse> {
    const response = await this.getTokens(forceRefresh);
    const filtered = response.data.filter(
      (t) => t.onlineAirdrop && t.status === "CLAIMABLE",
    );

    return {
      ...response,
      data: filtered,
      count: filtered.length,
    };
  }

  /**
   * Get upcoming TGE tokens
   */
  async getUpcomingTGE(
    forceRefresh: boolean = false,
  ): Promise<AlphaServiceResponse> {
    const response = await this.getTokens(forceRefresh);
    const filtered = response.data.filter(
      (t) => t.onlineTge && t.status === "UPCOMING",
    );

    return {
      ...response,
      data: filtered,
      count: filtered.length,
    };
  }

  /**
   * Get tokens with custom filters
   */
  async getFilteredTokens(
    filters: AlphaFilterOptions,
    forceRefresh: boolean = false,
  ): Promise<AlphaServiceResponse> {
    const response = await this.getTokens(forceRefresh);
    let filtered = [...response.data];

    // Apply filters
    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      filtered = filtered.filter((t) => statuses.includes(t.status));
    }

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      filtered = filtered.filter((t) => types.includes(t.type));
    }

    if (filters.chain) {
      const chains = Array.isArray(filters.chain)
        ? filters.chain
        : [filters.chain];
      filtered = filtered.filter((t) =>
        chains.some((c) => t.chain.toLowerCase() === c.toLowerCase()),
      );
    }

    if (filters.minScore !== undefined) {
      filtered = filtered.filter((t) => t.score >= filters.minScore!);
    }

    if (filters.maxScore !== undefined) {
      filtered = filtered.filter((t) => t.score <= filters.maxScore!);
    }

    if (filters.mulPoint !== undefined) {
      filtered = filtered.filter((t) => t.mulPoint === filters.mulPoint);
    }

    if (filters.onlineAirdrop !== undefined) {
      filtered = filtered.filter(
        (t) => t.onlineAirdrop === filters.onlineAirdrop,
      );
    }

    if (filters.onlineTge !== undefined) {
      filtered = filtered.filter((t) => t.onlineTge === filters.onlineTge);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.symbol.toLowerCase().includes(searchLower) ||
          t.name.toLowerCase().includes(searchLower),
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];

        if (aVal === null || aVal === undefined) return sortOrder;
        if (bVal === null || bVal === undefined) return -sortOrder;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * sortOrder;
        }

        return String(aVal).localeCompare(String(bVal)) * sortOrder;
      });
    }

    // Apply pagination
    if (filters.offset !== undefined || filters.limit !== undefined) {
      const offset = filters.offset || 0;
      const limit = filters.limit || filtered.length;
      filtered = filtered.slice(offset, offset + limit);
    }

    return {
      ...response,
      data: filtered,
      count: filtered.length,
    };
  }

  /**
   * Sync tokens to database
   */
  async syncToDatabase(): Promise<AlphaSyncResult> {
    const startTime = Date.now();
    this.emit("sync:start", {});

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    let source = AlphaDataSourceType.CACHE;

    try {
      const response = await this.getTokens(true);
      source = response.source;

      for (const token of response.data) {
        try {
          const prismaData = this.toPrismaFormat(token);

          // Check if token exists
          const existing = await prisma.airdrop.findFirst({
            where: { token: token.symbol },
          });

          if (existing) {
            // Check if data has changed
            const hasChanged = this.hasDataChanged(existing, prismaData);

            if (hasChanged) {
              await prisma.airdrop.update({
                where: { id: existing.id },
                data: {
                  ...prismaData,
                  updatedAt: new Date(),
                },
              });
              updated++;
              this.emit("token:updated", { symbol: token.symbol });
            } else {
              unchanged++;
            }
          } else {
            await prisma.airdrop.create({
              data: prismaData,
            });
            created++;
            this.emit("token:new", { symbol: token.symbol });
          }
        } catch (err) {
          console.error(`Error syncing token ${token.symbol}:`, err);
          errors++;
        }
      }

      const result: AlphaSyncResult = {
        success: errors === 0,
        created,
        updated,
        unchanged,
        errors,
        source,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.lastSyncResult = result;
      this.emit("sync:complete", result);

      console.log(
        `✅ Sync completed: ${created} created, ${updated} updated, ${unchanged} unchanged, ${errors} errors`,
      );

      return result;
    } catch (error) {
      const result: AlphaSyncResult = {
        success: false,
        created,
        updated,
        unchanged,
        errors: errors + 1,
        source,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.lastSyncResult = result;
      this.emit("sync:error", { error });

      throw error;
    }
  }

  /**
   * Check if data has changed
   */
  private hasDataChanged(
    existing: { [key: string]: unknown },
    newData: AlphaPrismaData,
  ): boolean {
    const fieldsToCompare: (keyof AlphaPrismaData)[] = [
      "name",
      "chain",
      "status",
      "type",
      "estimatedValue",
      "requiredPoints",
      "deductPoints",
    ];

    for (const field of fieldsToCompare) {
      if (existing[field] !== newData[field]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get statistics about tokens
   */
  async getStats(): Promise<AlphaStats> {
    const response = await this.getTokens();
    const tokens = response.data;

    const stats: AlphaStats = {
      total: tokens.length,
      byStatus: {
        UPCOMING: 0,
        CLAIMABLE: 0,
        ENDED: 0,
        SNAPSHOT: 0,
        CANCELLED: 0,
      },
      byType: {
        TGE: 0,
        PRETGE: 0,
        AIRDROP: 0,
      },
      byChain: {},
      byMultiplier: {
        "1x": 0,
        "2x": 0,
        "4x": 0,
      },
      activeAirdrops: 0,
      activeTGE: 0,
      lastUpdate: response.lastUpdate,
    };

    for (const token of tokens) {
      // By status
      stats.byStatus[token.status]++;

      // By type
      stats.byType[token.type]++;

      // By chain
      stats.byChain[token.chain] = (stats.byChain[token.chain] || 0) + 1;

      // By multiplier
      const mulKey = `${token.mulPoint}x`;
      if (mulKey in stats.byMultiplier) {
        stats.byMultiplier[mulKey]++;
      }

      // Active counts
      if (token.onlineAirdrop) {
        stats.activeAirdrops++;
      }
      if (token.onlineTge) {
        stats.activeTGE++;
      }
    }

    return stats;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Alpha cache cleared");
  }

  /**
   * Get last sync result
   */
  getLastSyncResult(): AlphaSyncResult | null {
    return this.lastSyncResult;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Register event handler
   */
  on(event: AlphaEventType, handler: AlphaEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event handler
   */
  off(event: AlphaEventType, handler: AlphaEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(type: AlphaEventType, data?: unknown): void {
    if (!this.config.enableEvents) return;

    const event: AlphaEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  /**
   * Create standardized response
   */
  private createResponse(
    data: AlphaToken[],
    source: AlphaDataSourceType,
    error?: string,
  ): AlphaServiceResponse {
    return {
      success: !error || data.length > 0,
      data,
      source,
      lastUpdate: new Date(),
      count: data.length,
      error,
    };
  }

  /**
   * Convert token to Prisma format
   */
  toPrismaFormat(token: AlphaToken): AlphaPrismaData {
    const claimStartDate = token.listingTime;
    const claimEndDate = claimStartDate
      ? new Date(claimStartDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;

    return {
      token: token.symbol,
      name: token.name,
      chain: token.chain,
      contractAddress: token.contractAddress || null,
      airdropAmount: token.score > 0 ? `Alpha Score: ${token.score}` : null,
      claimStartDate,
      claimEndDate,
      requiredPoints: token.score || null,
      deductPoints: token.score ? Math.floor(token.score * 0.1) : null,
      type: token.type,
      status: token.status,
      estimatedValue: token.estimatedValue,
      description: `${token.name} (${token.symbol}) on ${token.chain}. Alpha ID: ${token.alphaId}. Point Multiplier: ${token.mulPoint}x`,
      websiteUrl: null,
      twitterUrl: null,
      eligibility: JSON.stringify([
        "Binance Alpha User",
        `Min Score: ${token.score}`,
      ]),
      requirements: JSON.stringify(
        [
          "Binance Alpha Points Required",
          `Point Multiplier: ${token.mulPoint}x`,
          token.onlineTge ? "TGE Active" : "",
          token.onlineAirdrop ? "Airdrop Active" : "",
        ].filter(Boolean),
      ),
      verified: true,
      isActive: token.status !== "ENDED",
      multiplier: token.mulPoint,
      isBaseline: token.mulPoint === 1,
    };
  }
}

/**
 * Export singleton instance
 */
export const alphaService = new AlphaService();
