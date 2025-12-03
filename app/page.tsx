"use client";

/**
 * Home Page - Unified Airdrop Dashboard
 * Uses React Query polling for automatic data refresh every 10 seconds
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/stores/language-store";
import { Sparkles, TrendingUp, Coins, Zap, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { containerVariants, cardVariants } from "@/lib/animations";

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
  const { t, language } = useLanguage();
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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

  const quickStats = [
    {
      label: t("dashboard.activeAirdrops"),
      value: "12",
      icon: Sparkles,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      iconBg: "bg-amber-500/20",
    },
    {
      label: t("dashboard.todayDrops"),
      value: "3",
      icon: Zap,
      color: "text-cyan-400",
      bgColor: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      iconBg: "bg-cyan-500/20",
    },
    {
      label: t("dashboard.totalValue"),
      value: "$2.5K",
      icon: Coins,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/30",
      iconBg: "bg-emerald-500/20",
    },
    {
      label: t("dashboard.activeUsers"),
      value: "1.2K",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      iconBg: "bg-purple-500/20",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900"
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Hero Header */}
        <motion.div
          key={`hero-${language}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/10 p-8 border border-amber-500/20 backdrop-blur-xl">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: 0.2,
                    }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
                  >
                    <TrendingUp className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent"
                    >
                      {t("dashboard.heroTitle")}
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm md:text-base text-muted-foreground mt-1"
                    >
                      {t("dashboard.heroDesc")}
                    </motion.p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-amber-200">
                    {t("dashboard.recentActivity")}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          key={`stats-${language}`}
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((stat, index) => (
            <motion.div
              key={`${stat.label}-${index}`}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} hover:shadow-lg hover:shadow-${stat.color}/10 transition-all duration-300 cursor-pointer backdrop-blur-xl overflow-hidden relative group`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>

                {/* Hover glow effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.bgColor} opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl`}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <AirdropsTable />
        </motion.div>
      </div>
    </div>
  );
}
