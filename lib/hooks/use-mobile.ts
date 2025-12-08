"use client";

import { useSyncExternalStore, useCallback } from "react";

// Breakpoints matching Tailwind CSS defaults
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

// SSR-safe media query hook using useSyncExternalStore
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") {
        return () => {};
      }
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Check if viewport is below a breakpoint (mobile-first)
export function useIsMobile(breakpoint: Breakpoint = "md"): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`);
}

// Check if viewport is at or above a breakpoint
export function useIsDesktop(breakpoint: Breakpoint = "lg"): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
}

// Check if viewport is between two breakpoints
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  );
}

// Get current breakpoint name
export function useBreakpoint(): Breakpoint | "xs" {
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS["2xl"]}px)`);

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return "xs";
}

// Hook that provides mounted state for hydration safety using useSyncExternalStore
export function useMounted(): boolean {
  const subscribe = useCallback(() => {
    // No-op: we just need to track client-side mounting
    return () => {};
  }, []);

  const getSnapshot = useCallback(() => true, []);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Combined hook for responsive rendering with hydration safety
export function useResponsive() {
  const mounted = useMounted();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const breakpoint = useBreakpoint();

  return {
    mounted,
    isMobile: mounted ? isMobile : false,
    isTablet: mounted ? isTablet : false,
    isDesktop: mounted ? isDesktop : true, // Default to desktop for SSR
    breakpoint: mounted ? breakpoint : "lg", // Default to lg for SSR
  };
}

export { useMediaQuery, BREAKPOINTS };
export type { Breakpoint };
