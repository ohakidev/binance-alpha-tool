"use client";

/**
 * Stability Page - Simplified to avoid duplicate components
 * EnhancedStabilityTable already contains its own header, stats, and filters
 */

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { EnhancedStabilityTable } from "@/components/features/stability/enhanced-stability-table";
import { useLanguage } from "@/lib/stores/language-store";

// Polling interval: 10 seconds
const POLLING_INTERVAL = 10000;

export default function StabilityPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch stability data with automatic polling every 10 seconds
  const { data: stabilityResponse, isLoading } = useQuery({
    queryKey: ["stability"],
    queryFn: async () => {
      const res = await fetch("/api/binance/alpha/stability");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: POLLING_INTERVAL,
    refetchOnWindowFocus: false,
    staleTime: POLLING_INTERVAL - 1000,
  });

  const stabilityData = useMemo(() => {
    return stabilityResponse?.data || [];
  }, [stabilityResponse?.data]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-32 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl border border-orange-500/20" />

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10"
                />
              ))}
            </div>

            {/* Filter skeleton */}
            <div className="h-20 bg-white/5 rounded-xl border border-white/10" />

            {/* Table skeleton */}
            <div className="h-96 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`stability-${language}`}
      className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* EnhancedStabilityTable contains its own header, stats, filters, and table */}
        <EnhancedStabilityTable data={stabilityData} />
      </motion.div>
    </div>
  );
}
