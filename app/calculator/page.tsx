"use client";

/**
 * Calculator Page
 * Airdrop profit calculator with income tracking integration
 */

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/stores/language-store";

// Dynamic import for UnifiedCalculator to avoid webpack errors in dev mode
const UnifiedCalculator = dynamic(
  () => import("@/components/features/calculator/unified-calculator").then(mod => mod.UnifiedCalculator),
  {
    loading: () => (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function CalculatorPage() {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <UnifiedCalculator />

      {/* Quick Action FAB - Link to Income Calendar */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="fixed bottom-24 md:bottom-8 right-4 z-40"
      >
        <Link href="/calendar">
          <motion.button
            className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/50 flex items-center justify-center overflow-hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse Animation */}
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Icon */}
            <div className="relative z-10">
              <Calendar className="w-8 h-8 text-white" />
            </div>

            {/* Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-900/95 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <p className="text-sm font-medium text-white">{t("calendar.title")}</p>
              <p className="text-xs text-emerald-300">Track your earnings</p>
            </div>
          </motion.button>
        </Link>
      </motion.div>

      {/* Quick Stats Link */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed top-20 right-4 z-30 hidden lg:block"
      >
        <Link href="/calendar">
          <motion.div
            className="glass-card bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 p-4 cursor-pointer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quick Access</p>
                <p className="text-sm font-semibold text-emerald-400">Income Tracker →</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}
