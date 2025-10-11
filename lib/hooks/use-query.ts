/**
 * React Query Hooks
 * Custom hooks for data fetching with caching and real-time updates
 */

import { useQuery, QueryClient } from "@tanstack/react-query";

// ============= Market Data Hooks =============

export function useMarketTicker() {
  return useQuery({
    queryKey: ["market", "ticker"],
    queryFn: async () => {
      const response = await fetch("/api/binance/market/ticker");
      if (!response.ok) throw new Error("Failed to fetch market data");
      const json = await response.json();
      return json.data;
    },
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
    refetchOnWindowFocus: true,
  });
}

// ============= Airdrop Hooks =============

export function useAirdrops() {
  return useQuery({
    queryKey: ["airdrops"],
    queryFn: async () => {
      const response = await fetch("/api/binance/alpha/airdrops");
      if (!response.ok) throw new Error("Failed to fetch airdrops");
      const json = await response.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useAirdropDetails(id: string) {
  return useQuery({
    queryKey: ["airdrops", id],
    queryFn: async () => {
      const response = await fetch(`/api/binance/alpha/airdrops/${id}`);
      if (!response.ok) throw new Error("Failed to fetch airdrop details");
      const json = await response.json();
      return json.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ============= Stability Hooks =============

export function useStabilityData() {
  return useQuery({
    queryKey: ["stability"],
    queryFn: async () => {
      const response = await fetch("/api/binance/alpha/stability");
      if (!response.ok) throw new Error("Failed to fetch stability data");
      const json = await response.json();
      return json.data;
    },
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    refetchOnWindowFocus: true,
  });
}

export function useStabilityHistory(symbol: string) {
  return useQuery({
    queryKey: ["stability", "history", symbol],
    queryFn: async () => {
      const response = await fetch(
        `/api/binance/alpha/stability/${symbol}/history`
      );
      if (!response.ok) throw new Error("Failed to fetch stability history");
      const json = await response.json();
      return json.data;
    },
    enabled: !!symbol,
    staleTime: 60 * 1000,
  });
}

// ============= Query Client Configuration =============

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        refetchOnWindowFocus: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error("Mutation error:", error);
          // Add toast notification here if needed
        },
      },
    },
  });
}

// ============= Prefetch Helpers =============

export async function prefetchMarketData(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: ["market", "ticker"],
    queryFn: async () => {
      const response = await fetch("/api/binance/market/ticker");
      const json = await response.json();
      return json.data;
    },
  });
}

export async function prefetchAirdrops(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: ["airdrops"],
    queryFn: async () => {
      const response = await fetch("/api/binance/alpha/airdrops");
      const json = await response.json();
      return json.data;
    },
  });
}

export async function prefetchStabilityData(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: ["stability"],
    queryFn: async () => {
      const response = await fetch("/api/binance/alpha/stability");
      const json = await response.json();
      return json.data;
    },
  });
}
