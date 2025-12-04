/**
 * React Query Provider
 * Optimized configuration for maximum performance and reduced network traffic
 */

"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useCallback, useEffect } from "react";

// ============================================
// Query Client Configuration
// ============================================

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - data is fresh for this duration
        staleTime: 60 * 1000, // 1 minute default

        // Garbage collection time - cached data is kept for this duration
        gcTime: 10 * 60 * 1000, // 10 minutes

        // Retry configuration with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch behavior - optimized for performance
        refetchOnWindowFocus: false, // Disable by default
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Network mode - prioritize cached data
        networkMode: "offlineFirst",

        // Structural sharing for better performance
        structuralSharing: true,

        // Placeholder data for smoother UX
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        retry: 1,
        networkMode: "online",
        onError: (error) => {
          console.error("Mutation error:", error);
        },
      },
    },
  });
}

// ============================================
// Provider Component
// ============================================

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient only once per component lifecycle
  const [queryClient] = useState(() => createQueryClient());

  // Handle visibility change for smart refetching
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      // Only invalidate stale queries when tab becomes visible
      const cache = queryClient.getQueryCache();
      const staleQueries = cache.getAll().filter((query) => query.isStale());

      // Limit refetch to avoid thundering herd
      if (staleQueries.length > 0) {
        // Refetch at most 3 queries at once
        const queriesToRefetch = staleQueries.slice(0, 3);
        queriesToRefetch.forEach((query) => {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        });
      }
    }
  }, [queryClient]);

  // Setup visibility listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Handle online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      // Refetch failed queries when coming back online
      queryClient.resumePausedMutations().then(() => {
        queryClient.invalidateQueries();
      });
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

// ============================================
// Exports for external use
// ============================================

export { createQueryClient };
