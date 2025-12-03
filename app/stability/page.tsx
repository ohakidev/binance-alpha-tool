"use client";

/**
 * Stability Page - Premium Gold & Black Theme
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
      <div className="min-h-screen bg-[#030305] p-4 md:p-8">
        {/* Premium gradient mesh background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,169,72,0.1)_0%,transparent_60%)] blur-3xl" />
          <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(184,134,11,0.08)_0%,transparent_60%)] blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-36 bg-gradient-to-r from-[rgba(212,169,72,0.08)] via-[rgba(184,134,11,0.05)] to-[rgba(212,169,72,0.08)] rounded-2xl border border-[rgba(212,169,72,0.15)]" />

            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-gradient-to-br from-[rgba(212,169,72,0.06)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)]"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>

            {/* Filter skeleton */}
            <div className="h-20 bg-[rgba(212,169,72,0.05)] rounded-xl border border-[rgba(212,169,72,0.12)]" />

            {/* Table skeleton */}
            <div className="h-[500px] bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.1)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`stability-${language}`}
      className="min-h-screen bg-[#030305] relative overflow-hidden p-4 md:p-8"
    >
      {/* Premium animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />

        {/* Gold ambient glow - top left */}
        <motion.div
          className="absolute -top-32 -left-32 w-[600px] h-[600px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,169,72,0.1) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Gold ambient glow - top right */}
        <motion.div
          className="absolute top-40 -right-20 w-[500px] h-[500px]"
          style={{
            background:
              "radial-gradient(circle, rgba(184,134,11,0.08) 0%, transparent 60%)",
            filter: "blur(70px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Gold ambient glow - bottom left */}
        <motion.div
          className="absolute bottom-20 left-1/4 w-[450px] h-[450px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,169,72,0.06) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Center subtle glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,169,72,0.04) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />

        {/* Premium mesh pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(212,169,72,0.2) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(184,134,11,0.15) 0%, transparent 40%)
            `,
          }}
        />

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* EnhancedStabilityTable contains its own header, stats, filters, and table */}
        <EnhancedStabilityTable data={stabilityData} />
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030305] to-transparent pointer-events-none z-0" />
    </div>
  );
}
