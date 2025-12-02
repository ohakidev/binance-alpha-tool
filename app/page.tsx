"use client";

/**
 * Home Page - Unified Airdrop Dashboard
 * Clean, table-based UI with all airdrop information in one place
 * Auto-syncs data every 7 seconds from Binance/Alpha123
 */

import dynamic from "next/dynamic";
import { useAutoSync } from "@/lib/hooks/use-auto-sync";
import { SyncStatusIndicator } from "@/components/ui/sync-status-indicator";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  // Disable auto-sync to prevent excessive refreshing
  // User can manually refresh using the button
  const { state, syncNow } = useAutoSync({
    enabled: false, // Disabled - only manual refresh
    interval: 60000, // 1 minute (if enabled)
    onSync: (result) => {
      // Invalidate React Query cache to refetch ONLY airdrops data
      queryClient.invalidateQueries({
        queryKey: ['airdrops'],
        refetchType: 'active', // Only refetch active queries, not inactive ones
      });

      // Log successful sync for debugging
      if (result.data && (result.data.created > 0 || result.data.updated > 0)) {
        console.log(`✅ Data synced: Created ${result.data.created}, Updated ${result.data.updated}`);
      }
    },
    onError: (error) => {
      console.error("Auto-sync error:", error);
    },
  });

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    syncNow();
  };

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      {/* Sync Status Indicator - Fixed top-right */}
      <div className="fixed top-20 right-4 z-30">
        <SyncStatusIndicator
          isRunning={state.isRunning}
          isSyncing={state.isSyncing}
          secondsUntilNextSync={state.secondsUntilNextSync}
          syncCount={state.syncCount}
          errorCount={state.errorCount}
          lastSync={state.lastSync}
          onManualRefresh={handleManualRefresh}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <AirdropsTable />
      </div>
    </div>
  );
}
