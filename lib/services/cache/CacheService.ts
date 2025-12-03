/**
 * Cache Service
 * Centralized caching mechanism with TTL support
 * Follows Single Responsibility Principle
 */

import {
  CacheEntry,
  CacheConfig,
  AlphaDataSourceType,
} from "@/lib/types/alpha.types";

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  staleWhileRevalidate: true,
  staleTime: 10 * 60 * 1000, // 10 minutes stale time
};

/**
 * Generic Cache Service class
 * Provides in-memory caching with TTL and stale-while-revalidate support
 *
 * @template T - Type of data to cache
 */
export class CacheService<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get item from cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if entry is expired
    if (now > entry.expiresAt) {
      // If stale-while-revalidate is enabled, return stale data within stale time
      if (this.config.staleWhileRevalidate && this.config.staleTime) {
        const staleExpiresAt = entry.expiresAt + this.config.staleTime;
        if (now <= staleExpiresAt) {
          return entry.data;
        }
      }

      // Entry is completely expired
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Get entry with metadata
   * @param key - Cache key
   * @returns Full cache entry or null
   */
  getEntry(key: string): CacheEntry<T> | null {
    return this.cache.get(key) || null;
  }

  /**
   * Set item in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param source - Data source identifier
   * @param ttl - Optional custom TTL in milliseconds
   */
  set(
    key: string,
    data: T,
    source: AlphaDataSourceType = AlphaDataSourceType.CACHE,
    ttl?: number,
  ): void {
    // Enforce max size
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    const effectiveTtl = ttl ?? this.config.ttl;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + effectiveTtl,
      source,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is valid
   * @param key - Cache key
   * @returns Boolean indicating if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    return Date.now() <= entry.expiresAt;
  }

  /**
   * Check if entry is stale but still usable
   * @param key - Cache key
   * @returns Boolean indicating if entry is stale
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;

    const now = Date.now();
    return now > entry.expiresAt;
  }

  /**
   * Delete item from cache
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    keys: string[];
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize || Infinity,
      ttl: this.config.ttl,
      keys: Array.from(this.cache.keys()),
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
      newestEntry: newestTimestamp ? new Date(newestTimestamp) : null,
    };
  }

  /**
   * Get remaining TTL for a key
   * @param key - Cache key
   * @returns Remaining TTL in milliseconds, or -1 if not found/expired
   */
  getTTL(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;

    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -1;
  }

  /**
   * Touch entry to refresh its TTL
   * @param key - Cache key
   * @param ttl - Optional new TTL
   */
  touch(key: string, ttl?: number): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    const effectiveTtl = ttl ?? this.config.ttl;
    entry.expiresAt = Date.now() + effectiveTtl;
    this.cache.set(key, entry);
  }

  /**
   * Evict oldest entry from cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp: number | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove all expired entries
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const staleExpiresAt =
        this.config.staleWhileRevalidate && this.config.staleTime
          ? entry.expiresAt + this.config.staleTime
          : entry.expiresAt;

      if (now > staleExpiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }
}

/**
 * Cache key generators for consistent key naming
 */
export const CacheKeys = {
  allTokens: () => "alpha:tokens:all",
  tokensByStatus: (status: string) => `alpha:tokens:status:${status}`,
  tokenBySymbol: (symbol: string) => `alpha:token:${symbol.toLowerCase()}`,
  stats: () => "alpha:stats",
  lastSync: () => "alpha:lastSync",
} as const;

/**
 * Pre-configured cache instances for different use cases
 */
export const createAlphaCache = <T = unknown>() =>
  new CacheService<T>({
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500,
    staleWhileRevalidate: true,
    staleTime: 15 * 60 * 1000, // 15 minutes stale time
  });

export const createShortLivedCache = <T = unknown>() =>
  new CacheService<T>({
    ttl: 60 * 1000, // 1 minute
    maxSize: 100,
    staleWhileRevalidate: false,
  });

export const createLongLivedCache = <T = unknown>() =>
  new CacheService<T>({
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 200,
    staleWhileRevalidate: true,
    staleTime: 60 * 60 * 1000, // 1 hour stale time
  });
