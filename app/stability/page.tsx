"use client";

/**
 * Stability Dashboard - Pro UI/UX Design
 * Real-time Alpha Token Spread Monitor
 *
 * Features:
 * - Real-time countdown timer and live status indicators
 * - KOGE prioritized first, then sorted by stability (Green > Yellow > Red)
 * - Professional dark theme with glass morphism effects
 * - Responsive 2-column layout
 * - Optimized performance with useMemo and useCallback
 */

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import {
  TrendingUp,
  Bell,
  BellOff,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Info,
  Zap,
  Crown,
  Shield,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Spinner, LiveIndicator, CountdownRing } from "@/components/ui/spinner";

// ============= Types =============

type StabilityLevel =
  | "STABLE"
  | "MODERATE"
  | "UNSTABLE"
  | "NO_TRADE"
  | "CHECKING";

interface StabilityData {
  project: string;
  symbol: string;
  mulPoint: number;
  stability: StabilityLevel;
  spreadBps: number;
  fourXDays: number;
  price: number;
  priceHigh24h: number;
  priceLow24h: number;
  spreadPercent: number;
  lastUpdate: number;
  chain: string;
  volume24h: number;
  liquidity: number;
  isSpotPair?: boolean;
  priceChange24h?: number;
  sortPriority?: number;
}

interface StabilityApiResponse {
  success: boolean;
  data: StabilityData[];
  count: number;
  lastUpdate: number;
  error?: string;
  summary?: {
    stableCount: number;
    moderateCount: number;
    unstableCount: number;
    checkingCount: number;
    totalVolume24h: number;
    avgSpreadPercent: number;
    spotPairsCount: number;
  };
  thresholds?: {
    spot: { stable: number; moderate: number };
    dex: { stable: number; moderate: number };
  };
}

// ============= Constants =============

const POLLING_INTERVAL = 10000; // 10 seconds

// Stability badge configuration - moved outside component to prevent recreation
const stabilityConfig: Record<
  StabilityLevel,
  {
    label: string;
    icon: React.ElementType;
    bgClass: string;
    textClass: string;
    dotClass: string;
    borderClass: string;
  }
> = {
  STABLE: {
    label: "Stable",
    icon: Shield,
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    dotClass: "bg-emerald-400",
    borderClass: "border-emerald-500/30",
  },
  MODERATE: {
    label: "Moderate",
    icon: AlertTriangle,
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-400",
    dotClass: "bg-amber-400",
    borderClass: "border-amber-500/30",
  },
  UNSTABLE: {
    label: "Unstable",
    icon: XCircle,
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    dotClass: "bg-rose-400",
    borderClass: "border-rose-500/30",
  },
  NO_TRADE: {
    label: "No trade",
    icon: XCircle,
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    dotClass: "bg-rose-400",
    borderClass: "border-rose-500/30",
  },
  CHECKING: {
    label: "No Data",
    icon: Info,
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
    dotClass: "bg-slate-400",
    borderClass: "border-slate-500/30",
  },
};

// ============= Utility Functions (moved outside component) =============

const formatVolume = (v: number): string => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(2)}K`;
  return `$${v.toFixed(0)}`;
};

const formatPrice = (p: number): string => {
  if (p >= 1000) return `$${p.toFixed(2)}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
};

// ============= API Function =============

async function fetchStabilityData(): Promise<StabilityApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/binance/alpha/stability-data", {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: StabilityApiResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch stability data");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============= Column Helper =============

const columnHelper = createColumnHelper<StabilityData>();

// ============= Memoized Sub-Components =============

const ProjectCell = memo(function ProjectCell({
  symbol,
  chain,
  isKoge,
  isSpotPair,
}: {
  symbol: string;
  chain: string;
  isKoge: boolean;
  isSpotPair?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg ${
          isKoge
            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30"
            : isSpotPair
              ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-500/30"
              : "bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200"
        }`}
      >
        {symbol.substring(0, 2)}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-base">{symbol}</span>
          {isKoge && <Crown className="w-4 h-4 text-amber-400" />}
          {isSpotPair && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              SPOT
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">{chain}</span>
      </div>
    </div>
  );
});

const StabilityBadge = memo(function StabilityBadge({
  stability,
}: {
  stability: StabilityLevel;
}) {
  const config = stabilityConfig[stability];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bgClass} ${config.textClass} border ${config.borderClass}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dotClass} ${
          stability === "STABLE" ? "animate-pulse" : ""
        }`}
      />
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
});

const SpreadCell = memo(function SpreadCell({
  spreadPercent,
  spreadBps,
  stability,
}: {
  spreadPercent: number;
  spreadBps: number;
  stability: StabilityLevel;
}) {
  const config = stabilityConfig[stability];

  if (spreadBps === 0) {
    return <span className="text-slate-500 text-sm">—</span>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
        <span className={`font-bold text-base ${config.textClass}`}>
          {spreadPercent.toFixed(2)}%
        </span>
      </div>
      <span className="text-xs text-slate-500 ml-4">
        {spreadBps.toFixed(0)} bps
      </span>
    </div>
  );
});

const PriceCell = memo(function PriceCell({
  price,
  change,
}: {
  price: number;
  change: number;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-white text-base">
        {formatPrice(price)}
      </span>
      {change !== 0 && (
        <span
          className={`text-xs font-medium ${
            change >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});

const FourXDaysCell = memo(function FourXDaysCell({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-bold text-base ${
          days <= 5
            ? "text-red-400"
            : days <= 10
              ? "text-amber-400"
              : "text-emerald-400"
        }`}
      >
        {days}
      </span>
      <span className="text-xs text-slate-500">days</span>
    </div>
  );
});

const TopVolumeItem = memo(function TopVolumeItem({
  item,
  index,
}: {
  item: StabilityData;
  index: number;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-all`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            index === 0
              ? "bg-amber-500/20 text-amber-400"
              : index === 1
                ? "bg-slate-400/20 text-slate-400"
                : "bg-orange-700/20 text-orange-400"
          }`}
        >
          {index + 1}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{item.symbol}</span>
            {item.symbol === "KOGE" && (
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            )}
            {item.isSpotPair && (
              <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-400">
                SPOT
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-cyan-400 font-bold">
          {formatVolume(item.volume24h)}
        </span>
      </div>
    </div>
  );
});

// ============= Main Component =============

export default function StabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(35);
  const [showNotes, setShowNotes] = useState(false);
  const [countdown, setCountdown] = useState(POLLING_INTERVAL / 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch stability data with polling
  const {
    data: apiResponse,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["stabilityData"],
    queryFn: fetchStabilityData,
    refetchInterval: POLLING_INTERVAL,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache old data
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  // Memoized data
  const stabilityData = useMemo(
    () => apiResponse?.data || [],
    [apiResponse?.data],
  );

  // Countdown timer effect - optimized
  useEffect(() => {
    if (!dataUpdatedAt) return;

    let animationFrameId: number;
    let lastUpdate = performance.now();

    const updateCountdown = (currentTime: number) => {
      if (currentTime - lastUpdate >= 100) {
        const elapsed = Date.now() - dataUpdatedAt;
        const remaining = Math.max(0, (POLLING_INTERVAL - elapsed) / 1000);
        setCountdown(remaining);
        setIsRefreshing(remaining < 0.5 || isFetching);
        lastUpdate = currentTime;
      }
      animationFrameId = requestAnimationFrame(updateCountdown);
    };

    animationFrameId = requestAnimationFrame(updateCountdown);

    return () => cancelAnimationFrame(animationFrameId);
  }, [dataUpdatedAt, isFetching]);

  // Top 3 most participated (highest volume) - memoized
  const topParticipated = useMemo(() => {
    if (stabilityData.length === 0) return [];
    return [...stabilityData]
      .filter((item) => item.volume24h > 0)
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 3);
  }, [stabilityData]);

  // Table columns - memoized with stable references
  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: "Project",
        cell: (info) => {
          const row = info.row.original;
          return (
            <ProjectCell
              symbol={row.symbol}
              chain={row.chain}
              isKoge={row.symbol === "KOGE"}
              isSpotPair={row.isSpotPair}
            />
          );
        },
      }),
      columnHelper.accessor("stability", {
        header: "Status",
        cell: (info) => <StabilityBadge stability={info.getValue()} />,
      }),
      columnHelper.accessor("spreadPercent", {
        header: "Spread",
        cell: (info) => (
          <SpreadCell
            spreadPercent={info.getValue()}
            spreadBps={info.row.original.spreadBps}
            stability={info.row.original.stability}
          />
        ),
      }),
      columnHelper.accessor("price", {
        header: "Price",
        cell: (info) => (
          <PriceCell
            price={info.getValue()}
            change={info.row.original.priceChange24h || 0}
          />
        ),
      }),
      columnHelper.accessor("volume24h", {
        header: "Volume 24h",
        cell: (info) => (
          <span className="font-semibold text-cyan-400 text-base">
            {formatVolume(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("fourXDays", {
        header: "4x Days",
        cell: (info) => <FourXDaysCell days={info.getValue()} />,
      }),
    ],
    [],
  );

  // Custom global filter function that searches across symbol, project, and chain
  const globalFilterFn = useCallback(
    (
      row: { original: StabilityData },
      columnId: string,
      filterValue: string,
    ) => {
      const search = filterValue.toLowerCase();
      const { symbol, project, chain } = row.original;
      return (
        symbol.toLowerCase().includes(search) ||
        project.toLowerCase().includes(search) ||
        chain.toLowerCase().includes(search)
      );
    },
    [],
  );

  // Table instance - memoized configuration
  const table = useReactTable({
    data: stabilityData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: useCallback(
      (row: StabilityData, index: number) =>
        `${row.symbol}-${row.chain}-${index}`,
      [],
    ),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: globalFilterFn,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Stability alert - memoized callback
  const checkStabilityAlert = useCallback(() => {
    if (!alertEnabled || stabilityData.length === 0) return;

    const stableProjects = stabilityData.filter(
      (item) => item.stability === "STABLE",
    );

    if (stableProjects.length > 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🟢 Stability Alert", {
          body: `${stableProjects[0].symbol} is stable! Spread: ${stableProjects[0].spreadPercent.toFixed(2)}%`,
        });
      }
    }
  }, [alertEnabled, stabilityData]);

  // Request notification permission - memoized callback
  const enableAlerts = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setAlertEnabled(true);
      }
    }
  }, []);

  // Toggle alerts - memoized callback
  const handleToggleAlerts = useCallback(() => {
    if (alertEnabled) {
      setAlertEnabled(false);
    } else {
      enableAlerts();
    }
  }, [alertEnabled, enableAlerts]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Alert check effect
  useEffect(() => {
    if (alertEnabled) {
      const interval = setInterval(checkStabilityAlert, 5000);
      return () => clearInterval(interval);
    }
  }, [alertEnabled, checkStabilityAlert]);

  // Manual refresh handler - memoized callback
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetch();
  }, [refetch]);

  // Search handler - memoized callback
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setGlobalFilter(e.target.value);
    },
    [],
  );

  // Toggle notes - memoized callback
  const handleToggleNotes = useCallback(() => {
    setShowNotes((prev) => !prev);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] p-4">
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <span className="text-slate-400 text-sm animate-pulse">
                Loading market data...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] relative p-4 md:p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                Stability Dashboard
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold">
                  4x ALPHA
                </span>
                <span className="text-sm text-slate-500">
                  {stabilityData.length} tokens tracked
                </span>
                <LiveIndicator
                  isLive={!isRefreshing}
                  size="sm"
                  variant={isRefreshing ? "warning" : "success"}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Real-time Counter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              {isRefreshing ? (
                <Spinner size="sm" variant="premium" />
              ) : (
                <CountdownRing
                  duration={POLLING_INTERVAL / 1000}
                  remaining={countdown}
                  size="sm"
                  variant="premium"
                  showValue={false}
                />
              )}
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Next Update
                </span>
                <span className="text-sm font-bold text-amber-400 tabular-nums">
                  {isRefreshing ? "Updating..." : `${Math.ceil(countdown)}s`}
                </span>
              </div>
            </div>

            {/* Alert Button */}
            <button
              onClick={handleToggleAlerts}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                alertEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              {alertEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Alerts</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Alert Settings */}
        <AnimatePresence>
          {alertEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-emerald-400 font-medium">
                    Alert after stable for:
                  </span>
                  {[6, 12, 18, 35, 60].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setAlertThreshold(sec)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Table */}
          <div className="lg:col-span-2">
            <MagicCard
              className="overflow-hidden rounded-2xl border-slate-800/50"
              gradientColor="rgba(251, 191, 36, 0.03)"
            >
              {/* Search Bar */}
              <div className="p-4 border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={globalFilter}
                      onChange={handleSearchChange}
                      className="w-full pl-11 pr-4 py-3 text-sm bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    />
                  </div>
                  {/* Live Status Badge */}
                  <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <LiveIndicator
                      isLive={!isRefreshing}
                      size="sm"
                      variant={isRefreshing ? "warning" : "success"}
                    />
                    <span className="text-xs text-slate-400">
                      {dataUpdatedAt
                        ? new Date(dataUpdatedAt).toLocaleTimeString()
                        : "..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-900/30">
                      {table.getHeaderGroups().map((headerGroup) =>
                        headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className="px-4 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: " ↑",
                                desc: " ↓",
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          </th>
                        )),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-slate-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Info className="w-8 h-8 text-slate-600" />
                            <span>No tokens found</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => {
                        const isKoge = row.original.symbol === "KOGE";
                        const stability = row.original.stability;

                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-slate-800/30 transition-all ${
                              isKoge
                                ? "bg-amber-500/5 hover:bg-amber-500/10"
                                : stability === "STABLE"
                                  ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                                  : stability === "MODERATE"
                                    ? "bg-amber-500/5 hover:bg-amber-500/10"
                                    : "hover:bg-slate-800/30"
                            }`}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-4">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-4 border-t border-slate-800/50 bg-slate-900/20">
                <div className="text-sm text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                      1}
                  </span>
                  {" - "}
                  <span className="font-semibold text-white">
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) *
                        table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length,
                    )}
                  </span>
                  {" of "}
                  <span className="font-semibold text-white">
                    {table.getFilteredRowModel().rows.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm text-slate-300">
                    <span className="font-semibold">
                      {table.getState().pagination.pageIndex + 1}
                    </span>
                    <span className="text-slate-500"> / </span>
                    <span>{table.getPageCount()}</span>
                  </span>
                  <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </MagicCard>
          </div>

          {/* Right Column - Side Panel */}
          <div className="space-y-6">
            {/* Live Status Card */}
            <MagicCard
              className="overflow-hidden rounded-2xl border-slate-800/50 p-5"
              gradientColor="rgba(251, 191, 36, 0.03)"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Live Status
                  </h3>
                </div>
                <LiveIndicator
                  isLive={!isRefreshing}
                  size="md"
                  variant={isRefreshing ? "warning" : "success"}
                  showLabel
                />
              </div>

              {/* Progress Bar */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">
                    Refresh Progress
                  </span>
                  <span className="text-sm font-bold text-amber-400 tabular-nums">
                    {isRefreshing ? "..." : `${Math.ceil(countdown)}s`}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-100"
                    style={{
                      width: `${(countdown / (POLLING_INTERVAL / 1000)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>Auto-refresh every {POLLING_INTERVAL / 1000}s</span>
                  <span>
                    {dataUpdatedAt
                      ? new Date(dataUpdatedAt).toLocaleTimeString()
                      : "..."}
                  </span>
                </div>
              </div>
            </MagicCard>

            {/* Top 3 Most Participated */}
            <MagicCard
              className="overflow-hidden rounded-2xl border-slate-800/50 p-5"
              gradientColor="rgba(251, 191, 36, 0.03)"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Top Volume</h3>
              </div>
              <div className="space-y-3">
                {topParticipated.map((item, index) => (
                  <TopVolumeItem
                    key={`top-${item.symbol}-${index}`}
                    item={item}
                    index={index}
                  />
                ))}
                {topParticipated.length === 0 && (
                  <div className="text-center text-slate-500 py-6">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    No volume data
                  </div>
                )}
              </div>
            </MagicCard>

            {/* Notes Section */}
            <div className="rounded-2xl border border-slate-800/50 overflow-hidden bg-slate-900/20">
              <button
                onClick={handleToggleNotes}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-400">
                    Information
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: showNotes ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showNotes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-3 border-t border-slate-800/50 pt-4">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <Shield className="w-4 h-4 text-emerald-400 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-emerald-400">
                            SPOT Pairs (KOGE)
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            Real-time orderbook spread. Stable &lt;0.3%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-amber-400">
                            DEX Tokens
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            24h price range spread. Stable &lt;5%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                        <TrendingUp className="w-4 h-4 text-cyan-400 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-cyan-400">
                            Spread Definition
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            Lower spread = Better stability. 1% = 100 USDT cost
                            per 10,000 USDT.
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                        <p className="text-xs text-rose-400/80">
                          <strong>⚠️ Disclaimer:</strong> Markets are
                          unpredictable. DYOR. No liability for losses.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
