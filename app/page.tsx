"use client";

/**
 * Home Page - Unified Airdrop Dashboard
 * Clean, table-based UI with all airdrop information in one place
 * Auto-syncs data every 7 seconds from Binance/Alpha123
 */

import dynamic from "next/dynamic";
import { useAutoSync } from "@/lib/hooks/use-auto-sync";
import { useEffect } from "react";

// Dynamic import for AirdropsTable for better performance
const AirdropsTable = dynamic(
  () => import("@/components/features/airdrops/airdrops-table").then(mod => ({ default: mod.AirdropsTable })),
  {
    loading: () => (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-24 bg-muted rounded-lg" />
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    ),
    ssr: true,
  }
);

export default function Home() {
  // Enable auto-sync every 7 seconds
  const { state } = useAutoSync({
    enabled: true, // Auto-start on mount
    interval: 7000, // 7 seconds
    onSync: (result) => {
      // Log successful sync for debugging
      if (result.data && (result.data.created > 0 || result.data.updated > 0)) {
        console.log(`✅ Data synced: Created ${result.data.created}, Updated ${result.data.updated}`);
      }
    },
    onError: (error) => {
      console.error("Auto-sync error:", error);
    },
  });

  // Log sync status for debugging
  useEffect(() => {
    if (state.isRunning) {
      console.log(
        `🔄 Auto-sync active | Syncs: ${state.syncCount} | Errors: ${state.errorCount} | Last: ${state.lastSync?.toLocaleTimeString() || "N/A"}`
      );
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Auto-sync status indicator (hidden in production) */}
        {process.env.NODE_ENV === "development" && state.isRunning && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400">
              Auto-sync: {state.syncCount} syncs
            </span>
          </div>
        )}

        <AirdropsTable />
      </div>
    </div>
  );
}
