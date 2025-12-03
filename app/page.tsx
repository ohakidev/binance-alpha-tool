"use client";

/**
 * Home Page - Unified Airdrop Dashboard
 * Premium Gold & Black Theme
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
        <div className="animate-pulse space-y-6">
          {/* Header skeleton with gold accent */}
          <div className="h-36 bg-gradient-to-r from-[rgba(212,169,72,0.08)] via-[rgba(184,134,11,0.05)] to-[rgba(212,169,72,0.08)] rounded-2xl border border-[rgba(212,169,72,0.15)]" />

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-gradient-to-br from-[rgba(212,169,72,0.06)] to-[rgba(10,10,12,0.9)] rounded-xl border border-[rgba(212,169,72,0.1)]"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Table skeleton */}
          <div className="h-[500px] bg-gradient-to-br from-[rgba(212,169,72,0.04)] via-[#0a0a0c] to-[rgba(184,134,11,0.03)] rounded-2xl border border-[rgba(212,169,72,0.1)]" />
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
      <div className="min-h-screen bg-[#030305]">
        {/* Premium gradient mesh background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,169,72,0.08)_0%,transparent_60%)] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(184,134,11,0.06)_0%,transparent_60%)] blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-36 bg-gradient-to-r from-[rgba(212,169,72,0.08)] to-[rgba(212,169,72,0.03)] rounded-2xl border border-[rgba(212,169,72,0.12)]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-[rgba(212,169,72,0.04)] rounded-xl border border-[rgba(212,169,72,0.1)]"
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
      className="min-h-screen bg-[#030305] relative overflow-hidden"
      suppressHydrationWarning
    >
      {/* Premium animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />

        {/* Gold ambient glow - top left */}
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,169,72,0.1) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Gold ambient glow - bottom right */}
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px]"
          style={{
            background:
              "radial-gradient(circle, rgba(184,134,11,0.08) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Subtle center glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,169,72,0.05) 0%, transparent 70%)",
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
            delay: 4,
          }}
        />

        {/* Premium mesh pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(212,169,72,0.15) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(184,134,11,0.1) 0%, transparent 50%)
            `,
          }}
        />

        {/* Subtle noise texture for premium feel */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Main Airdrops Table - has its own header and stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <AirdropsTable />
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030305] to-transparent pointer-events-none z-0" />
    </div>
  );
}
