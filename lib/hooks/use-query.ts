/**
 * React Query Hooks
 * Optimized hooks for data fetching with smart caching and traffic reduction
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { useCallback, useRef } from "react";

// ============================================
// Cache Configuration
// ============================================

const CACHE_CONFIG = {
  // Market data - real-time, but not too frequent
  market: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 15 * 1000, // 15 seconds
    refetchOnWindowFocus: true,
  },
  // Airdrops - changes less frequently
  airdrops: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  },
  // Stability data - moderate refresh
  stability: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  },
  // Static data - rarely changes
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: false as const,
    refetchOnWindowFocus: false,
  },
};

// ============================================
// Request Deduplication & Throttling
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, Promise<any>>();
const lastFetchTime = new Map<string, number>();
const MIN_FETCH_INTERVAL = 1000; // Minimum 1 second between identical requests

async function fetchWithDeduplication<T>(
  key: string,
  fetchFn: () => Promise<T>,
  minInterval: number = MIN_FETCH_INTERVAL,
): Promise<T> {
  // Check if we have a pending request
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // Check throttling
  const lastFetch = lastFetchTime.get(key);
  if (lastFetch && Date.now() - lastFetch < minInterval) {
    // Return cached data if available, or wait
    await new Promise((resolve) =>
      setTimeout(resolve, minInterval - (Date.now() - lastFetch)),
    );
  }

  // Create new request
  const request = fetchFn()
    .then((data) => {
      pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, request);
  lastFetchTime.set(key, Date.now());

  return request;
}

// ============================================
// Optimized Fetch Functions
// ============================================

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

// ============================================
// Market Data Hooks
// ============================================

export function useMarketTicker() {
  return useQuery({
    queryKey: ["market", "ticker"],
    queryFn: () =>
      fetchWithDeduplication("market-ticker", () =>
        fetchJSON("/api/binance/market/ticker"),
      ),
    ...CACHE_CONFIG.market,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useMarketPrice(symbol: string) {
  return useQuery({
    queryKey: ["market", "price", symbol],
    queryFn: () =>
      fetchWithDeduplication(`market-price-${symbol}`, () =>
        fetchJSON(`/api/binance/market/price?symbol=${symbol}`),
      ),
    enabled: !!symbol,
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
}

export function useAirdrops(filters?: AirdropFilters) {
  const queryString = filters
    ? "?" + new URLSearchParams(filters as Record<string, string>).toString()
    : "";

  return useQuery({
    queryKey: ["airdrops", filters],
    queryFn: () =>
      fetchWithDeduplication(`airdrops${queryString}`, () =>
        fetchJSON(`/api/binance/alpha/airdrops${queryString}`),
      ),
    ...CACHE_CONFIG.airdrops,
    // Use placeholder data while loading
    placeholderData: (previousData) => previousData,
  });
}

export function useLiveAirdrops() {
  return useQuery({
    queryKey: ["airdrops", "live"],
    queryFn: () =>
      fetchWithDeduplication("airdrops-live", () =>
        fetchJSON("/api/binance/alpha/airdrops?status=live"),
      ),
    ...CACHE_CONFIG.airdrops,
    placeholderData: (previousData) => previousData,
  });
}

export function useUpcomingAirdrops() {
  return useQuery({
    queryKey: ["airdrops", "upcoming"],
    queryFn: () =>
      fetchWithDeduplication("airdrops-upcoming", () =>
        fetchJSON("/api/binance/alpha/airdrops?status=upcoming"),
      ),
    ...CACHE_CONFIG.airdrops,
    placeholderData: (previousData) => previousData,
  });
}

export function useAirdropDetails(id: string) {
  return useQuery({
    queryKey: ["airdrops", "detail", id],
    queryFn: () =>
      fetchWithDeduplication(`airdrop-${id}`, () =>
        fetchJSON(`/api/binance/alpha/airdrops/${id}`),
      ),
    enabled: !!id,
    ...CACHE_CONFIG.static,
  });
}

// ============================================
// Stability Hooks
// ============================================

export function useStabilityData() {
  return useQuery({
    queryKey: ["stability"],
    queryFn: () =>
      fetchWithDeduplication("stability", () =>
        fetchJSON("/api/binance/alpha/stability"),
      ),
    ...CACHE_CONFIG.stability,
    placeholderData: (previousData) => previousData,
  });
}

export function useStabilityHistory(symbol: string) {
  return useQuery({
    queryKey: ["stability", "history", symbol],
    queryFn: () =>
      fetchWithDeduplication(`stability-history-${symbol}`, () =>
        fetchJSON(`/api/binance/alpha/stability/${symbol}/history`),
      ),
    enabled: !!symbol,
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
        { method: "GET" },
      );
      if (!response.ok) throw new Error("Sync failed");
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
      console.log("⏳ Refresh throttled, too soon since last refresh");
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

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;
    if (document.visibilityState !== "visible") return;

    const now = Date.now();
    if (now - lastRefresh.current >= minInterval) {
      lastRefresh.current = now;
      queryClient.invalidateQueries({ queryKey });
    }
  }, [enabled, minInterval, queryClient, queryKey]);

  // Effect to add listener
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  return { lastRefresh: lastRefresh.current };
}

// ============================================
// Query Client Configuration
// ============================================

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false, // Disable by default to reduce traffic
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Network mode: always try to fetch even if offline (for PWA)
        networkMode: "offlineFirst",
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
    options?: { enabled?: boolean };
  }>,
) {
  return queries.map((query) => ({
    queryKey: query.key,
    queryFn: query.fn,
    enabled: query.options?.enabled ?? true,
    staleTime: CACHE_CONFIG.airdrops.staleTime,
    gcTime: CACHE_CONFIG.airdrops.gcTime,
  }));
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
  // Prefetch both live and upcoming in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["airdrops", "live"],
      queryFn: () => fetchJSON("/api/binance/alpha/airdrops?status=live"),
      staleTime: CACHE_CONFIG.airdrops.staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: ["airdrops", "upcoming"],
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
  };
}
