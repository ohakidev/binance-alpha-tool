/**
 * React Query Hooks
 * Optimized hooks for data fetching with smart caching, deduplication, and traffic reduction
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";

// ============================================
// Cache Configuration - Optimized for each data type
// ============================================

export const CACHE_CONFIG = {
  // Market data - real-time updates needed
  market: {
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 20 * 1000, // 20 seconds
    refetchOnWindowFocus: true,
  },
  // Airdrops - less frequent updates
  airdrops: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  },
  // Stability data - moderate refresh
  stability: {
    staleTime: 45 * 1000, // 45 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  },
  // Static data - rarely changes
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchInterval: false as const,
    refetchOnWindowFocus: false,
  },
  // User data - session based
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: false as const,
    refetchOnWindowFocus: true,
  },
} as const;

// ============================================
// Request Deduplication & Throttling
// ============================================

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  abortController: AbortController;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, PendingRequest<any>>();
const lastFetchTime = new Map<string, number>();
const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between identical requests
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout

/**
 * Fetch with deduplication, throttling, and timeout
 */
async function fetchWithDeduplication<T>(
  key: string,
  fetchFn: (signal: AbortSignal) => Promise<T>,
  minInterval: number = MIN_FETCH_INTERVAL,
): Promise<T> {
  const now = Date.now();

  // Check if we have a valid pending request
  const pending = pendingRequests.get(key);
  if (pending && now - pending.timestamp < REQUEST_TIMEOUT) {
    return pending.promise;
  }

  // Cleanup stale pending request
  if (pending) {
    pending.abortController.abort();
    pendingRequests.delete(key);
  }

  // Check throttling
  const lastFetch = lastFetchTime.get(key);
  if (lastFetch && now - lastFetch < minInterval) {
    const waitTime = minInterval - (now - lastFetch);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  // Create new request with abort controller
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT);

  const promise = fetchFn(abortController.signal)
    .then((data) => {
      clearTimeout(timeoutId);
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      pendingRequests.delete(key);

      // Don't throw for abort errors
      if (error.name === "AbortError") {
        throw new Error("Request timeout or cancelled");
      }
      throw error;
    });

  pendingRequests.set(key, {
    promise,
    timestamp: now,
    abortController,
  });
  lastFetchTime.set(key, now);

  return promise;
}

// ============================================
// Optimized Fetch Functions
// ============================================

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchJSON<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeout = REQUEST_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
      );
    }

    const json = await response.json();
    return json.data ?? json;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// ============================================
// Market Data Hooks
// ============================================

export function useMarketTicker(enabled: boolean = true) {
  return useQuery({
    queryKey: ["market", "ticker"],
    queryFn: () =>
      fetchWithDeduplication("market-ticker", () =>
        fetchJSON("/api/binance/market/ticker"),
      ),
    enabled,
    ...CACHE_CONFIG.market,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useMarketPrice(symbol: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["market", "price", symbol],
    queryFn: () =>
      fetchWithDeduplication(`market-price-${symbol}`, () =>
        fetchJSON(
          `/api/binance/market/price?symbol=${encodeURIComponent(symbol)}`,
        ),
      ),
    enabled: enabled && !!symbol,
    ...CACHE_CONFIG.market,
  });
}

// ============================================
// Airdrop Hooks
// ============================================

interface AirdropFilters {
  status?: string;
  chain?: string;
  type?: string;
  limit?: number;
}

export function useAirdrops(filters?: AirdropFilters, enabled: boolean = true) {
  const queryString = filters
    ? "?" +
      new URLSearchParams(
        Object.entries(filters)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";

  return useQuery({
    queryKey: ["airdrops", filters ?? {}],
    queryFn: () =>
      fetchWithDeduplication(`airdrops${queryString}`, () =>
        fetchJSON(`/api/binance/alpha/airdrops${queryString}`),
      ),
    enabled,
    ...CACHE_CONFIG.airdrops,
    placeholderData: (previousData) => previousData,
  });
}

export function useLiveAirdrops(enabled: boolean = true) {
  return useQuery({
    queryKey: ["airdrops", { status: "live" }],
    queryFn: () =>
      fetchWithDeduplication("airdrops-live", () =>
        fetchJSON("/api/binance/alpha/airdrops?status=live"),
      ),
    enabled,
    ...CACHE_CONFIG.airdrops,
    placeholderData: (previousData) => previousData,
  });
}

export function useUpcomingAirdrops(enabled: boolean = true) {
  return useQuery({
    queryKey: ["airdrops", { status: "upcoming" }],
    queryFn: () =>
      fetchWithDeduplication("airdrops-upcoming", () =>
        fetchJSON("/api/binance/alpha/airdrops?status=upcoming"),
      ),
    enabled,
    ...CACHE_CONFIG.airdrops,
    placeholderData: (previousData) => previousData,
  });
}

export function useAirdropDetails(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["airdrops", "detail", id],
    queryFn: () =>
      fetchWithDeduplication(`airdrop-${id}`, () =>
        fetchJSON(`/api/binance/alpha/airdrops/${encodeURIComponent(id)}`),
      ),
    enabled: enabled && !!id,
    ...CACHE_CONFIG.static,
  });
}

// ============================================
// Stability Hooks
// ============================================

export function useStabilityData(enabled: boolean = true) {
  return useQuery({
    queryKey: ["stability"],
    queryFn: () =>
      fetchWithDeduplication("stability", () =>
        fetchJSON("/api/binance/alpha/stability"),
      ),
    enabled,
    ...CACHE_CONFIG.stability,
    placeholderData: (previousData) => previousData,
  });
}

export function useStabilityHistory(symbol: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["stability", "history", symbol],
    queryFn: () =>
      fetchWithDeduplication(`stability-history-${symbol}`, () =>
        fetchJSON(
          `/api/binance/alpha/stability/${encodeURIComponent(symbol)}/history`,
        ),
      ),
    enabled: enabled && !!symbol,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Sync Hooks
// ============================================

export function useSyncAirdrops() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (force: boolean = false) => {
      const response = await fetch(
        `/api/binance/alpha/real-sync${force ? "?force=true" : ""}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) {
        const error = await response.text().catch(() => "Sync failed");
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch airdrops
      queryClient.invalidateQueries({ queryKey: ["airdrops"] });
    },
    retry: 1,
  });
}

// ============================================
// Smart Refresh Hook
// ============================================

export function useSmartRefresh(queryKey: string[]) {
  const queryClient = useQueryClient();
  const lastRefresh = useRef<number>(0);
  const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes

  const refresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefresh.current < MIN_REFRESH_INTERVAL) {
      console.debug("⏳ Refresh throttled, too soon since last refresh");
      return false;
    }

    lastRefresh.current = now;
    await queryClient.invalidateQueries({ queryKey });
    return true;
  }, [queryClient, queryKey]);

  const forceRefresh = useCallback(async () => {
    lastRefresh.current = Date.now();
    await queryClient.resetQueries({ queryKey });
    return true;
  }, [queryClient, queryKey]);

  return { refresh, forceRefresh };
}

// ============================================
// Visibility-based Refresh Hook
// ============================================

export function useVisibilityRefresh(
  queryKey: string[],
  options: { enabled?: boolean; minInterval?: number } = {},
) {
  const { enabled = true, minInterval = 60000 } = options;
  const queryClient = useQueryClient();
  const lastRefresh = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRefresh.current >= minInterval) {
        lastRefresh.current = now;
        queryClient.invalidateQueries({ queryKey });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, minInterval, queryClient, queryKey]);

  return { lastRefresh: lastRefresh.current };
}

// ============================================
// Polling Hook with Smart Backoff
// ============================================

export function usePollingQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    baseInterval?: number;
    maxInterval?: number;
    enabled?: boolean;
    onError?: (error: Error) => void;
  } = {},
) {
  const {
    baseInterval = 10000,
    maxInterval = 60000,
    enabled = true,
    onError,
  } = options;

  const errorCount = useRef(0);

  // Calculate interval based on errors (exponential backoff)
  const currentInterval = Math.min(
    baseInterval * Math.pow(2, errorCount.current),
    maxInterval,
  );

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await queryFn();
        errorCount.current = 0; // Reset on success
        return result;
      } catch (error) {
        errorCount.current++;
        onError?.(error as Error);
        throw error;
      }
    },
    enabled,
    refetchInterval: currentInterval,
    refetchOnWindowFocus: false,
    staleTime: baseInterval - 1000,
  });
}

// ============================================
// Query Client Configuration
// ============================================

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false, // Disable by default to reduce traffic
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Network mode: try cache first
        networkMode: "offlineFirst",
        // Structural sharing for better performance
        structuralSharing: true,
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error("Mutation error:", error);
        },
      },
    },
  });
}

// ============================================
// Prefetch Helpers
// ============================================

export async function prefetchMarketData(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: ["market", "ticker"],
    queryFn: () => fetchJSON("/api/binance/market/ticker"),
    staleTime: CACHE_CONFIG.market.staleTime,
  });
}

export async function prefetchAirdrops(queryClient: QueryClient) {
  // Prefetch both statuses in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["airdrops", { status: "live" }],
      queryFn: () => fetchJSON("/api/binance/alpha/airdrops?status=live"),
      staleTime: CACHE_CONFIG.airdrops.staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: ["airdrops", { status: "upcoming" }],
      queryFn: () => fetchJSON("/api/binance/alpha/airdrops?status=upcoming"),
      staleTime: CACHE_CONFIG.airdrops.staleTime,
    }),
  ]);
}

export async function prefetchStabilityData(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: ["stability"],
    queryFn: () => fetchJSON("/api/binance/alpha/stability"),
    staleTime: CACHE_CONFIG.stability.staleTime,
  });
}

export async function prefetchAllData(queryClient: QueryClient) {
  await Promise.all([
    prefetchMarketData(queryClient),
    prefetchAirdrops(queryClient),
    prefetchStabilityData(queryClient),
  ]);
}

// ============================================
// Cache Utilities
// ============================================

export function clearAllCache(queryClient: QueryClient) {
  queryClient.clear();
  pendingRequests.clear();
  lastFetchTime.clear();
}

export function getCacheStats(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  return {
    totalQueries: queries.length,
    staleQueries: queries.filter((q) => q.isStale()).length,
    fetchingQueries: queries.filter((q) => q.state.fetchStatus === "fetching")
      .length,
    pendingRequests: pendingRequests.size,
    cachedKeys: Array.from(lastFetchTime.keys()),
  };
}

/**
 * Cancel all pending requests - useful when unmounting
 */
export function cancelAllPendingRequests() {
  for (const [, request] of pendingRequests) {
    request.abortController.abort();
  }
  pendingRequests.clear();
}

// ============================================
// Batch Query Configuration Helper
// ============================================

/**
 * Helper to create query configurations for batch queries
 * Use with useQueries from @tanstack/react-query
 */
export function createBatchQueryConfigs<T>(
  queries: Array<{
    key: string[];
    fn: () => Promise<T>;
    options?: Partial<UseQueryOptions<T>>;
  }>,
) {
  return queries.map((query) => ({
    queryKey: query.key,
    queryFn: query.fn,
    enabled: query.options?.enabled ?? true,
    staleTime: CACHE_CONFIG.airdrops.staleTime,
    gcTime: CACHE_CONFIG.airdrops.gcTime,
    ...query.options,
  }));
}
