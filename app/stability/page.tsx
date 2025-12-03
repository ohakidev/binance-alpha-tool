"use client";

/**
 * Stability Page - Redesigned with full i18n support
 * Uses React Query polling for automatic data refresh every 10 seconds
 */

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Shield,
  AlertTriangle,
  Activity,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { EnhancedStabilityTable } from "@/components/features/stability/enhanced-stability-table";
import { useLanguage } from "@/lib/stores/language-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { containerVariants, cardVariants } from "@/lib/animations";

// Polling interval: 10 seconds
const POLLING_INTERVAL = 10000;

export default function StabilityPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch stability data with automatic polling every 10 seconds
  const {
    data: stabilityResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["stability"],
    queryFn: async () => {
      const res = await fetch("/api/binance/alpha/stability");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: POLLING_INTERVAL, // Auto-refresh every 10 seconds
    refetchOnWindowFocus: false,
    staleTime: POLLING_INTERVAL - 1000, // Consider stale just before next poll
  });

  const stabilityData = useMemo(() => {
    const rawData = stabilityResponse?.data || [];
    if (!rawData.length) return [];

    // Apply search and risk filters
    return rawData.filter(
      (item: { symbol?: string; token?: string; riskLevel?: string }) => {
        const symbol = item.symbol || item.token || "";
        const matchesSearch = symbol
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesRisk =
          riskFilter === "all" || item.riskLevel === riskFilter;
        return matchesSearch && matchesRisk;
      },
    );
  }, [stabilityResponse?.data, searchQuery, riskFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!stabilityData.length)
      return { avgScore: 0, lowRisk: 0, mediumRisk: 0, highRisk: 0, total: 0 };

    const avgScore =
      stabilityData.reduce(
        (acc: number, item: { stabilityScore?: number }) =>
          acc + (item.stabilityScore || 0),
        0,
      ) / stabilityData.length;
    const lowRisk = stabilityData.filter(
      (d: { riskLevel?: string }) => d.riskLevel === "LOW",
    ).length;
    const mediumRisk = stabilityData.filter(
      (d: { riskLevel?: string }) => d.riskLevel === "MEDIUM",
    ).length;
    const highRisk = stabilityData.filter(
      (d: { riskLevel?: string }) => d.riskLevel === "HIGH",
    ).length;

    return {
      avgScore,
      lowRisk,
      mediumRisk,
      highRisk,
      total: stabilityData.length,
    };
  }, [stabilityData]);

  const handleManualRefresh = () => {
    refetch();
  };

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

  const statCards = [
    {
      label: t("stability.avgScore"),
      value: stats.avgScore.toFixed(1),
      icon: Activity,
      color: "text-cyan-400",
      bgColor: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
    },
    {
      label: t("stability.safeProjects"),
      value: stats.lowRisk,
      icon: Shield,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/30",
    },
    {
      label: t("stability.moderateProjects"),
      value: stats.mediumRisk,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
    },
    {
      label: t("stability.highRiskProjects"),
      value: stats.highRisk,
      icon: TrendingUp,
      color: "text-rose-400",
      bgColor: "from-rose-500/20 to-red-500/20",
      borderColor: "border-rose-500/30",
    },
  ];

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
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/10 p-8 border border-orange-500/20 mb-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                    {t("stability.title")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("stability.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
            />
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`bg-gradient-to-br ${stat.bgColor} border ${stat.borderColor} hover:shadow-lg transition-all cursor-pointer`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl bg-white/10 ${stat.color}`}
                      >
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("stability.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className="pl-10 bg-white/5 border-white/10"
                  />
                </div>

                {/* Risk Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={riskFilter}
                    onValueChange={(value) => {
                      setRiskFilter(value);
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                      <SelectValue placeholder={t("stability.filterByRisk")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("stability.allRisks")}
                      </SelectItem>
                      <SelectItem value="LOW">
                        {t("stability.lowRisk")}
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        {t("stability.mediumRisk")}
                      </SelectItem>
                      <SelectItem value="HIGH">
                        {t("stability.highRisk")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  onClick={handleManualRefresh}
                  className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                  {t("stability.refresh")}
                </Button>
              </div>

              {/* Active Filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-white/20"
                    onClick={() => setSearchQuery("")}
                  >
                    {t("common.search")}: {searchQuery}
                    <span className="ml-1">×</span>
                  </Badge>
                )}
                {riskFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="gap-1 cursor-pointer hover:bg-white/20"
                    onClick={() => setRiskFilter("all")}
                  >
                    {t("stability.riskLevel")}: {riskFilter}
                    <span className="ml-1">×</span>
                  </Badge>
                )}
                <Badge variant="outline" className="text-muted-foreground">
                  {t("stability.showing")} {stabilityData.length}{" "}
                  {t("stability.entries")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {stabilityData.length > 0 ? (
            <EnhancedStabilityTable data={stabilityData} />
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("stability.noDataFound")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("common.tryAgain")}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
