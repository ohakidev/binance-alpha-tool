"use client";

/**
 * Calculator Page
 * Modern crypto-themed airdrop profit calculator with full i18n support
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UnifiedCalculator } from "@/components/features/calculator/unified-calculator";
import { useLanguage } from "@/lib/stores/language-store";

export default function CalculatorPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-center">
              <div className="h-12 w-64 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex justify-center">
              <div className="h-12 w-80 bg-white/5 rounded-xl border border-white/10" />
            </div>

            {/* Content grid skeleton */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20" />
                <div className="h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20" />
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/20" />
                <div className="h-64 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-2xl border border-rose-500/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`calculator-${language}`}
      className="relative min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <UnifiedCalculator />
      </motion.div>
    </div>
  );
}
