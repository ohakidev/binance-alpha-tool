'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { EnhancedStabilityTable } from '@/components/features/stability/enhanced-stability-table';
import { useLanguage } from '@/lib/stores/language-store';
import { useAutoSync } from '@/lib/hooks/use-auto-sync';
import { SyncStatusIndicator } from '@/components/ui/sync-status-indicator';

export default function StabilityPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  // Disable auto-sync to prevent excessive refreshing
  const { state, syncNow } = useAutoSync({
    enabled: false, // Disabled - only manual refresh
    interval: 60000, // 1 minute
    onSync: (result) => {
      // Invalidate stability query to refetch ONLY this data
      queryClient.invalidateQueries({
        queryKey: ['stability'],
        refetchType: 'active',
      });
      if (result.success) {
        console.log('✅ Stability data synced');
      }
    },
    onError: (error) => {
      console.error('Stability sync error:', error);
    },
  });

  const { data: stabilityResponse, isLoading } = useQuery({
    queryKey: ['stability'],
    queryFn: async () => {
      const res = await fetch('/api/binance/alpha/stability');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    refetchInterval: false, // Disable auto-refetch
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const stabilityData = stabilityResponse?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const handleManualRefresh = () => {
    console.log('🔄 Manual stability refresh triggered');
    syncNow();
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >

        <div className="mb-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-2xl shadow-orange-500/30 mb-4 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <TrendingUp className="w-7 h-7 text-white relative z-10" />
            <h1 className="text-2xl font-black text-white relative z-10 tracking-tight">
              {language === 'th' ? 'ความเสถียรของโครงการ' : 'Project Stability'}
            </h1>
          </motion.div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {language === 'th' 
              ? 'ตรวจสอบความเสถียรและความเสี่ยงของโครงการ Binance Alpha'
              : 'Monitor stability and risk levels of Binance Alpha projects'}
          </p>
        </div>

        <EnhancedStabilityTable data={stabilityData} />
      </motion.div>
    </div>
  );
}
