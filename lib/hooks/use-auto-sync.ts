'use client';

import { useEffect, useRef, useState } from 'react';

interface AutoSyncOptions {
  /**
   * Enable/disable auto-sync
   * @default true
   */
  enabled?: boolean;

  /**
   * Sync interval in milliseconds
   * @default 7000 (7 seconds)
   */
  interval?: number;

  /**
   * Callback function when sync completes
   */
  onSync?: (result: any) => void;

  /**
   * Callback function when sync fails
   */
  onError?: (error: Error) => void;
}

interface AutoSyncState {
  isRunning: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  syncCount: number;
  errorCount: number;
}

/**
 * Hook to automatically sync Alpha projects from external APIs
 *
 * Usage:
 * ```tsx
 * const { state, start, stop, syncNow } = useAutoSync({
 *   enabled: true,
 *   interval: 7000, // 7 seconds
 *   onSync: (result) => console.log('Synced:', result),
 * });
 * ```
 */
export function useAutoSync(options: AutoSyncOptions = {}) {
  const {
    enabled = true,
    interval = parseInt(process.env.NEXT_PUBLIC_ALPHA_SYNC_INTERVAL || '7000'),
    onSync,
    onError,
  } = options;

  const [state, setState] = useState<AutoSyncState>({
    isRunning: false,
    lastSync: null,
    nextSync: null,
    syncCount: 0,
    errorCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Perform sync operation
   * Fetches data directly from alpha123.uk (client-side) then saves to database
   */
  const syncNow = async () => {
    try {
      console.log('🔄 Triggering auto-sync (client-side)...');

      // Step 1: Fetch data via server-side proxy (avoids CORS)
      console.log('📡 Fetching from real Binance Alpha API...');
      const fetchResponse = await fetch('/api/binance/alpha/real-sync?force=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!fetchResponse.ok) {
        throw new Error(`Sync API error: ${fetchResponse.status}`);
      }

      const result = await fetchResponse.json();
      console.log(`✅ Sync completed:`, result);

      if (result.success) {
        console.log(`✅ ${result.data.created} created, ${result.data.updated} updated`);

        setState((prev) => ({
          ...prev,
          lastSync: new Date(),
          nextSync: new Date(Date.now() + interval),
          syncCount: prev.syncCount + 1,
        }));

        onSync?.(result);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);

      setState((prev) => ({
        ...prev,
        errorCount: prev.errorCount + 1,
      }));

      onError?.(error as Error);
    }
  };

  /**
   * Start auto-sync
   */
  const start = () => {
    if (intervalRef.current) {
      console.warn('⚠️ Auto-sync already running');
      return;
    }

    console.log(`🚀 Starting auto-sync (every ${interval / 1000}s)`);

    setState((prev) => ({
      ...prev,
      isRunning: true,
      nextSync: new Date(Date.now() + interval),
    }));

    // Sync immediately on start
    syncNow();

    // Set up interval
    intervalRef.current = setInterval(() => {
      syncNow();
    }, interval);
  };

  /**
   * Stop auto-sync
   */
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;

      setState((prev) => ({
        ...prev,
        isRunning: false,
        nextSync: null,
      }));

      console.log('🛑 Auto-sync stopped');
    }
  };

  /**
   * Auto-start/stop based on enabled prop
   */
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    // Cleanup on unmount
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval]);

  return {
    state,
    start,
    stop,
    syncNow,
  };
}
