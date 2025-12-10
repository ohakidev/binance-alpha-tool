"use client";

/**
 * Stability Dashboard - Premium Edition
 *
 * Features:
 * - TanStack Table with sortable columns
 * - Optimized for lower server load
 * - Modern glassmorphism UI
 * - Responsive design
 * - Real-time auto-refresh
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  TrendingUp,
  Bell,
  BellOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Crown,
  Shield,
  AlertTriangle,
  XCircle,
  Volume2,
  Zap,
  Activity,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { LiveIndicator } from "@/components/ui/spinner";

// ============= Types =============

type StabilityLevel = "STABLE" | "MODERATE" | "UNSTABLE" | "NO_TRADE";

interface TokenData {
  symbol: string;
  name: string;
  chain: string;
  mulPoint: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  fourXDays: number;
  tradeSymbol: string;
  stability: StabilityLevel;
  spreadBps: number;
  tradeCount: number;
  lastTradeTime: number;
  avgPrice: number;
  stdDev: number;
}

interface ApiResponse {
  success: boolean;
  data: TokenData[];
  count: number;
  lastUpdate: number;
  fromCache?: boolean;
  summary?: {
    stable: number;
    moderate: number;
    unstable: number;
    noTrade: number;
  };
  config?: {
    refreshInterval: number;
    stableThreshold: number;
    moderateThreshold: number;
  };
}

// ============= Constants =============

const REFRESH_INTERVAL = 5000;

const stabilityConfig: Record<
  StabilityLevel,
  {
    label: string;
    icon: React.ElementType;
    gradient: string;
    textClass: string;
    ringClass: string;
    order: number;
  }
> = {
  STABLE: {
    label: "Stable",
    icon: Shield,
    gradient: "from-emerald-500/20 to-emerald-600/10",
    textClass: "text-emerald-400",
    ringClass: "ring-emerald-500/30",
    order: 1,
  },
  MODERATE: {
    label: "Moderate",
    icon: AlertTriangle,
    gradient: "from-amber-500/20 to-amber-600/10",
    textClass: "text-amber-400",
    ringClass: "ring-amber-500/30",
    order: 2,
  },
  UNSTABLE: {
    label: "Unstable",
    icon: XCircle,
    gradient: "from-rose-500/20 to-rose-600/10",
    textClass: "text-rose-400",
    ringClass: "ring-rose-500/30",
    order: 3,
  },
  NO_TRADE: {
    label: "No Trade",
    icon: Info,
    gradient: "from-slate-500/20 to-slate-600/10",
    textClass: "text-slate-400",
    ringClass: "ring-slate-500/30",
    order: 4,
  },
};

// ============= Components =============

function StabilityBadge({
  stability,
  compact = false,
}: {
  stability: StabilityLevel;
  compact?: boolean;
}) {
  const config = stabilityConfig[stability];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${compact ? "px-2 py-0.5" : "px-3 py-1.5"} rounded-full bg-gradient-to-r ${config.gradient} ring-1 ${config.ringClass} backdrop-blur-sm`}
    >
      <span
        className={`${compact ? "w-1" : "w-1.5"} ${compact ? "h-1" : "h-1.5"} rounded-full bg-current ${config.textClass} ${stability === "STABLE" ? "animate-pulse" : ""}`}
      />
      <Icon
        className={`${compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} ${config.textClass}`}
      />
      <span
        className={`${compact ? "text-[10px]" : "text-xs"} font-semibold ${config.textClass}`}
      >
        {config.label}
      </span>
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (!sorted) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-50" />;
  }
  return sorted === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  textColor,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 ring-1 ring-white/5 backdrop-blur-xl`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
          <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center ring-1 ring-white/10`}
        >
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
      </div>
    </motion.div>
  );
}

// ============= Column Helper =============

const columnHelper = createColumnHelper<TokenData>();

// ============= Main Component =============

export default function StabilityPage() {
  const [data, setData] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(35);
  const [showNotes, setShowNotes] = useState(false);
  const [stableStartTime, setStableStartTime] = useState<
    Record<string, number>
  >({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Define columns for TanStack Table
  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: "Project",
        cell: (info) => {
          const token = info.row.original;
          const isKoge = token.symbol === "KOGE";

          return (
            <div className="flex items-center gap-3">
              <div
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-transform hover:scale-105 ${
                  isKoge
                    ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/20"
                    : "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 ring-1 ring-white/10"
                }`}
              >
                {token.symbol.slice(0, 2)}
                {isKoge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5 text-amber-900" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">{token.symbol}</span>
                  {token.mulPoint === 4 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-[10px] font-bold text-purple-300 ring-1 ring-purple-500/20">
                      4x
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {token.chain}
                </span>
              </div>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          if (rowA.original.symbol === "KOGE") return -1;
          if (rowB.original.symbol === "KOGE") return 1;
          return rowA.original.symbol.localeCompare(rowB.original.symbol);
        },
      }),
      columnHelper.accessor("stability", {
        header: "Stability",
        cell: (info) => <StabilityBadge stability={info.getValue()} />,
        sortingFn: (rowA, rowB) => {
          const orderA = stabilityConfig[rowA.original.stability].order;
          const orderB = stabilityConfig[rowB.original.stability].order;
          return orderA - orderB;
        },
      }),
      columnHelper.accessor("spreadBps", {
        header: "Spread BPS",
        cell: (info) => {
          const token = info.row.original;
          const config = stabilityConfig[token.stability];

          if (token.spreadBps <= 0 && token.tradeCount <= 0) {
            return <span className="text-slate-500">—</span>;
          }

          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-base ${config.textClass}`}>
                  {token.spreadBps.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500">bps</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Activity className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">
                  {token.tradeCount} trades
                </span>
              </div>
            </div>
          );
        },
        sortingFn: "basic",
      }),
      columnHelper.accessor("fourXDays", {
        header: "4x Days",
        cell: (info) => {
          const days = info.getValue();
          const urgency =
            days <= 5
              ? "from-rose-500 to-pink-500"
              : days <= 10
                ? "from-amber-500 to-orange-500"
                : "from-emerald-500 to-teal-500";
          const textColor =
            days <= 5
              ? "text-rose-400"
              : days <= 10
                ? "text-amber-400"
                : "text-emerald-400";

          return (
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${urgency} flex items-center justify-center shadow-lg`}
              >
                <span className="text-xs font-bold text-white">{days}</span>
              </div>
              <span className={`text-xs font-medium ${textColor}`}>days</span>
            </div>
          );
        },
        sortingFn: "basic",
      }),
    ],
    [],
  );

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: true,
  });

  // Fetch data from server
  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const res = await fetch("/api/binance/alpha/stability-data", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const json: ApiResponse = await res.json();

      if (json.success && json.data) {
        setData(json.data);
        setLastUpdate(Date.now());
        setIsLoading(false);

        const now = Date.now();
        const newStableStartTime: Record<string, number> = {};

        json.data.forEach((token) => {
          if (token.stability === "STABLE") {
            newStableStartTime[token.symbol] =
              stableStartTime[token.symbol] || now;
          }
        });

        setStableStartTime(newStableStartTime);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [stableStartTime]);

  // Initial fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - lastUpdate;
      const remaining = Math.max(0, (REFRESH_INTERVAL - elapsed) / 1000);
      setCountdown(remaining);
    }, 100);

    return () => clearInterval(timer);
  }, [lastUpdate]);

  // Stability alerts
  useEffect(() => {
    if (!alertEnabled) return;

    const now = Date.now();

    Object.entries(stableStartTime).forEach(([symbol, startTime]) => {
      const duration = (now - startTime) / 1000;

      if (duration >= alertThreshold) {
        const lastAlertKey = `lastAlert_${symbol}`;
        const lastAlert = parseInt(sessionStorage.getItem(lastAlertKey) || "0");

        if (now - lastAlert > alertThreshold * 1000) {
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const token = data.find((t) => t.symbol === symbol);
            new Notification(`🟢 ${symbol} Stable Alert`, {
              body: `${symbol} has been stable for ${Math.floor(duration)}s! Spread: ${token?.spreadBps.toFixed(2)} bps`,
              icon: "/favicon.ico",
            });
          }

          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {
            // Ignore audio errors
          }

          sessionStorage.setItem(lastAlertKey, now.toString());
        }
      }
    });
  }, [data, alertEnabled, alertThreshold, stableStartTime]);

  // Request notification permission
  const enableAlerts = useCallback(async () => {
    if (!alertEnabled && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setAlertEnabled(true);
      }
    } else {
      setAlertEnabled(!alertEnabled);
    }
  }, [alertEnabled]);

  // Summary stats
  const summary = useMemo(() => {
    return {
      stable: data.filter((d) => d.stability === "STABLE").length,
      moderate: data.filter((d) => d.stability === "MODERATE").length,
      unstable: data.filter((d) => d.stability === "UNSTABLE").length,
      total: data.length,
    };
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-amber-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium">Loading stability data</p>
            <p className="text-slate-500 text-sm mt-1">
              Analyzing market conditions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090b] p-4 md:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-xl shadow-amber-500/25">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-4 ring-[#08090b]">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Stability Dashboard
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-400">
                    LIVE
                  </span>
                </span>
                <span className="text-sm text-slate-500">
                  {data.length} tokens tracked
                </span>
                <LiveIndicator
                  isLive={!isRefreshing}
                  size="sm"
                  variant="success"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Countdown */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/40 ring-1 ring-white/5 backdrop-blur-sm">
              <div className="relative w-6 h-6">
                <svg className="w-6 h-6 -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-700"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(countdown / (REFRESH_INTERVAL / 1000)) * 62.83} 62.83`}
                    strokeLinecap="round"
                    className="text-amber-400 transition-all duration-100"
                  />
                </svg>
              </div>
              <span className="text-sm text-slate-400 tabular-nums font-medium min-w-[36px]">
                {countdown.toFixed(1)}s
              </span>
            </div>

            {/* Alert Button */}
            <button
              onClick={enableAlerts}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                alertEnabled
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-800/40 text-slate-400 ring-1 ring-white/5 hover:bg-slate-800/60 hover:text-slate-300"
              }`}
            >
              {alertEnabled ? (
                <>
                  <Bell className="w-4 h-4" />
                  <Volume2 className="w-3.5 h-3.5" />
                </>
              ) : (
                <BellOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="group p-2.5 rounded-xl bg-slate-800/40 text-slate-400 ring-1 ring-white/5 hover:bg-slate-800/60 hover:text-slate-300 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : "group-hover:rotate-45 transition-transform"}`}
              />
            </button>
          </div>
        </motion.div>

        {/* Alert Threshold Settings */}
        <AnimatePresence>
          {alertEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 ring-1 ring-emerald-500/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-emerald-400 font-medium">
                    🔔 Alert after stable for:
                  </span>
                  <div className="flex gap-2">
                    {[6, 12, 18, 21, 35, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setAlertThreshold(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          alertThreshold === sec
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <StatCard
            label="Stable"
            value={summary.stable}
            icon={Shield}
            gradient="from-emerald-500/10 to-emerald-600/5"
            textColor="text-emerald-400"
            delay={0}
          />
          <StatCard
            label="Moderate"
            value={summary.moderate}
            icon={AlertTriangle}
            gradient="from-amber-500/10 to-amber-600/5"
            textColor="text-amber-400"
            delay={0.1}
          />
          <StatCard
            label="Unstable"
            value={summary.unstable}
            icon={XCircle}
            gradient="from-rose-500/10 to-rose-600/5"
            textColor="text-rose-400"
            delay={0.2}
          />
          <StatCard
            label="Total"
            value={summary.total}
            icon={Activity}
            gradient="from-slate-500/10 to-slate-600/5"
            textColor="text-white"
            delay={0.3}
          />
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-slate-900/40 ring-1 ring-white/5 backdrop-blur-xl overflow-hidden shadow-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="bg-gradient-to-r from-slate-800/60 to-slate-800/40"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 md:px-6 py-4 text-left"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-2 ${
                              header.column.getCanSort()
                                ? "cursor-pointer select-none hover:text-amber-400 transition-colors group"
                                : ""
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-colors">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </span>
                            {header.column.getCanSort() && (
                              <SortIcon
                                sorted={
                                  header.column.getIsSorted() as
                                    | false
                                    | "asc"
                                    | "desc"
                                }
                              />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {table.getRowModel().rows.map((row, index) => {
                    const isKoge = row.original.symbol === "KOGE";
                    const isStable = row.original.stability === "STABLE";

                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={`border-b border-white/5 transition-colors duration-200 hover:bg-white/5 ${
                          isKoge
                            ? "bg-gradient-to-r from-amber-500/5 to-transparent"
                            : isStable
                              ? "bg-gradient-to-r from-emerald-500/5 to-transparent"
                              : ""
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 md:px-6 py-4 text-sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Info className="w-8 h-8 text-slate-600" />
                        <p className="text-sm">No data available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 md:px-6 py-3 bg-slate-800/30 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-refresh every 5s</span>
            </div>
            <span>
              Last update:{" "}
              {lastUpdate
                ? new Date(lastUpdate).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"}
            </span>
          </div>
        </motion.div>

        {/* Notes Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 rounded-2xl bg-slate-900/40 ring-1 ring-white/5 backdrop-blur-xl overflow-hidden"
        >
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 text-slate-400">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">Information & Tips</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                showNotes ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3 text-sm text-slate-400 border-t border-white/5 pt-4">
                  <div className="flex gap-3 items-start">
                    <span className="text-emerald-400 text-lg">⚙️</span>
                    <p>
                      <strong className="text-emerald-400">Criteria:</strong>{" "}
                      Price range, volume swings, abnormal spikes, short-term
                      trend analysis.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-amber-400 text-lg">💡</span>
                    <p>
                      <strong className="text-amber-400">Spread BPS:</strong>{" "}
                      Standard Deviation of trade prices. Lower = more
                      consistent = STABLE. {"<"}5 bps = Stable, {"<"}50 bps =
                      Moderate.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-cyan-400 text-lg">📊</span>
                    <p>
                      <strong className="text-cyan-400">Sorting:</strong> Click
                      column headers to sort. KOGE (1x) as baseline → Green
                      (Stable) → Yellow (Moderate) → Red (Unstable)
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-purple-400 text-lg">🔔</span>
                    <p>
                      <strong className="text-purple-400">Alerts:</strong> When
                      enabled, you&apos;ll be notified after continuous
                      stability. Keep the page in foreground.
                    </p>
                  </div>
                  <div className="flex gap-3 items-start pt-2 border-t border-white/5">
                    <span className="text-rose-400 text-lg">⚠️</span>
                    <p className="text-rose-400/80">
                      <strong>Disclaimer:</strong> Markets are unpredictable.
                      DYOR; no liability for losses.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
