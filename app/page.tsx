"use client";

/**
 * Home Page - Unified Airdrop Dashboard
 * Uses React Query polling for automatic data refresh every 10 seconds
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamic import for AirdropsTable for better performance
const AirdropsTable = dynamic(
  () =>
    import("@/components/features/airdrops/airdrops-table").then((mod) => ({
      default: mod.AirdropsTable,
    })),
  {
    loading: () => (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10"
              />
            ))}
          </div>
          <div className="h-96 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10" />
        </div>
      </div>
    ),
    ssr: true,
  },
);

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white/5 rounded-xl border border-white/10"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900"
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Main Airdrops Table - has its own header and stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AirdropsTable />
        </motion.div>
      </div>
    </div>
  );
}
