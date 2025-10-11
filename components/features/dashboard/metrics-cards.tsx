"use client";

/**
 * Dashboard Metrics Cards
 * RPG-style stat cards with trend indicators and animations
 */

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Award,
  Calendar,
} from "lucide-react";
import { useUserStore } from "@/lib/stores/user-store";
import { useIncomeStore } from "@/lib/stores/income-store";
import { cardVariants, containerVariants } from "@/lib/animations";
import { subMonths } from "date-fns";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ delay }}
      className="glass-card relative overflow-hidden group"
    >
      {/* Background gradient effect */}
      <div
        className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
          </div>

          <p className="text-3xl font-bold mb-1">
            {typeof value === "number" && label.includes("$")
              ? `$${value.toFixed(2)}`
              : value}
          </p>

          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend.isPositive ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
              <span className="text-muted-foreground text-xs ml-1">
                vs last month
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MetricsCards() {
  const activeUserId = useUserStore((state) => state.activeUserId);
  const getStats = useIncomeStore((state) => state.getStats);
  const getMonthStats = useIncomeStore((state) => state.getMonthStats);

  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);

  const allTimeStats = activeUserId ? getStats(activeUserId) : null;
  const currentMonthStats = activeUserId
    ? getMonthStats(activeUserId, currentMonth)
    : null;
  const lastMonthStats = activeUserId
    ? getMonthStats(activeUserId, lastMonth)
    : null;

  // Calculate trends
  const incomeTrend =
    currentMonthStats && lastMonthStats
      ? {
          value:
            lastMonthStats.monthIncome > 0
              ? ((currentMonthStats.monthIncome - lastMonthStats.monthIncome) /
                  lastMonthStats.monthIncome) *
                100
              : 0,
          isPositive:
            currentMonthStats.monthIncome >= lastMonthStats.monthIncome,
        }
      : undefined;

  const projectsTrend =
    currentMonthStats && lastMonthStats
      ? {
          value:
            lastMonthStats.monthProjects > 0
              ? ((currentMonthStats.monthProjects -
                  lastMonthStats.monthProjects) /
                  lastMonthStats.monthProjects) *
                100
              : 0,
          isPositive:
            currentMonthStats.monthProjects >= lastMonthStats.monthProjects,
        }
      : undefined;

  const entriesTrend =
    currentMonthStats && lastMonthStats
      ? {
          value:
            lastMonthStats.monthEntries > 0
              ? ((currentMonthStats.monthEntries -
                  lastMonthStats.monthEntries) /
                  lastMonthStats.monthEntries) *
                100
              : 0,
          isPositive:
            currentMonthStats.monthEntries >= lastMonthStats.monthEntries,
        }
      : undefined;

  const metrics = [
    {
      label: "Total Income",
      value: allTimeStats?.totalIncome || 0,
      icon: DollarSign,
      color: "text-[#10B981]",
    },
    {
      label: "Total Projects",
      value: allTimeStats?.totalProjects || 0,
      icon: Target,
      color: "text-[#00CED1]",
    },
    {
      label: "Total Entries",
      value: allTimeStats?.totalEntries || 0,
      icon: Award,
      color: "text-[#9B59B6]",
    },
    {
      label: "Month Income",
      value: currentMonthStats?.monthIncome || 0,
      icon: TrendingUp,
      color: "text-[#FFD700]",
      trend: incomeTrend,
    },
    {
      label: "Month Projects",
      value: currentMonthStats?.monthProjects || 0,
      icon: Calendar,
      color: "text-[#F59E0B]",
      trend: projectsTrend,
    },
    {
      label: "Month Entries",
      value: currentMonthStats?.monthEntries || 0,
      icon: Award,
      color: "text-[#EF4444]",
      trend: entriesTrend,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {metrics.map((metric, index) => (
        <MetricCard key={metric.label} {...metric} delay={index * 0.1} />
      ))}
    </motion.div>
  );
}
