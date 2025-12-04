"use client";

/**
 * Stability Page - Alpha Tokens Spread Monitor
 * Filters only Binance Alpha tokens and displays like alpha123.uk/stability/
 * Table headers: Project | Stability | Spread bps | 4x Days
 */

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

// ============= Types =============

interface StabilityData {
  project: string;
  symbol: string;
  mulPoint: number;
  stability: "STABLE" | "UNSTABLE" | "CHECKING";
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
}

interface StabilityApiResponse {
  success: boolean;
  data: StabilityData[];
  count: number;
  lastUpdate: number;
  error?: string;
}

// ============= Constants =============

const POLLING_INTERVAL = 10000; // 10 seconds

// ============= API Function =============

/**
 * Fetch stability data from internal API route
 */
async function fetchStabilityData(): Promise<StabilityData[]> {
  const response = await fetch("/api/binance/alpha/stability-data");

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: StabilityApiResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch stability data");
  }

  return data.data;
}

// ============= Column Helper =============

const columnHelper = createColumnHelper<StabilityData>();

// ============= Main Component =============

export default function StabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(35);

  // Fetch stability data with polling
  const {
    data: stabilityData = [],
    isLoading,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["stabilityData"],
    queryFn: fetchStabilityData,
    refetchInterval: POLLING_INTERVAL,
    staleTime: POLLING_INTERVAL - 1000,
    retry: 3,
    retryDelay: 1000,
  });

  // Top 3 most stable (lowest spread)
  const topParticipated = useMemo(() => {
    return [...stabilityData]
      .filter((item) => item.spreadBps > 0)
      .sort((a, b) => a.spreadBps - b.spreadBps)
      .slice(0, 3);
  }, [stabilityData]);

  // Table columns matching alpha123.uk style
  const columns = useMemo(
    () => [
      columnHelper.accessor("project", {
        header: "Project",
        cell: (info) => {
          const row = info.row.original;

          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30">
                <span className="text-white font-black text-xs">
                  {row.symbol.substring(0, 3)}
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {row.project}
                  </span>
                  <span className="px-1.5 py-0.5 rounded font-semibold text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    4x
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-slate-400">{row.chain}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">
                    ${row.price.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("stability", {
        header: "Stability",
        cell: (info) => {
          const value = info.getValue();
          const spreadBps = info.row.original.spreadBps;

          // For DEX tokens: < 500 bps (5%) = stable, < 1500 bps (15%) = moderate
          const isGreen = spreadBps > 0 && spreadBps < 500;
          const isYellow = spreadBps >= 500 && spreadBps < 1500;

          return (
            <div className="flex items-center justify-center">
              <div
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-2 ${
                  value === "CHECKING" || spreadBps === 0
                    ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                    : isGreen
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isYellow
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    value === "CHECKING" || spreadBps === 0
                      ? "bg-slate-500"
                      : isGreen
                        ? "bg-emerald-500 animate-pulse"
                        : isYellow
                          ? "bg-amber-500"
                          : "bg-rose-500"
                  }`}
                />
                {value === "CHECKING" || spreadBps === 0
                  ? "N/A"
                  : isGreen
                    ? "STABLE"
                    : isYellow
                      ? "MODERATE"
                      : "VOLATILE"}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("spreadBps", {
        header: "Spread bps",
        cell: (info) => {
          const bps = info.getValue();
          const spreadPercent = info.row.original.spreadPercent;
          // For DEX: < 500 bps (5%) = good, < 1500 bps (15%) = moderate
          const isGreen = bps > 0 && bps < 500;
          const isYellow = bps >= 500 && bps < 1500;

          if (bps === 0) {
            return (
              <div className="text-center text-slate-400 text-sm">N/A</div>
            );
          }

          return (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGreen
                      ? "bg-emerald-500"
                      : isYellow
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  }`}
                />
                <span
                  className={`font-bold ${
                    isGreen
                      ? "text-emerald-400"
                      : isYellow
                        ? "text-amber-400"
                        : "text-rose-400"
                  }`}
                >
                  {bps.toFixed(0)}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                ({spreadPercent.toFixed(2)}%)
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("fourXDays", {
        header: "4x Days",
        cell: (info) => {
          const days = info.getValue();

          return (
            <div className="text-center">
              <span
                className={`font-bold ${
                  days <= 7
                    ? "text-emerald-400"
                    : days <= 14
                      ? "text-amber-400"
                      : "text-slate-400"
                }`}
              >
                {days}
              </span>
            </div>
          );
        },
      }),
    ],
    [],
  );

  // Table instance with unique row ID
  const table = useReactTable({
    data: stabilityData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getRowId: (row, index) => `${row.symbol}-${row.chain}-${index}`, // Unique key combining symbol, chain, and index
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Stability alert
  const checkStabilityAlert = useCallback(() => {
    if (!alertEnabled) return;

    const stableProjects = stabilityData.filter(
      (item) => item.spreadBps > 0 && item.spreadBps < 500,
    );

    if (stableProjects.length > 0) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🟢 Stability Alert", {
          body: `${stableProjects[0].project} is stable! Spread: ${stableProjects[0].spreadBps.toFixed(0)} bps`,
        });
      }
    }
  }, [alertEnabled, stabilityData]);

  // Request notification permission
  const enableAlerts = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setAlertEnabled(true);
      }
    }
  }, []);

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

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#030305] p-4 md:p-8">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,169,72,0.1)_0%,transparent_60%)] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-gradient-to-r from-[rgba(212,169,72,0.08)] to-[rgba(212,169,72,0.08)] rounded-2xl" />
            <div className="h-[400px] bg-[rgba(212,169,72,0.04)] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030305] relative overflow-hidden p-4 md:p-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#030305] via-[#0a0a0c] to-[#030305]" />
        <motion.div
          className="absolute -top-32 -left-32 w-[600px] h-[600px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,169,72,0.1) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Stability Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                    4x Alpha
                  </span>
                  <span>
                    {stabilityData.length} tokens •{" "}
                    {dataUpdatedAt
                      ? new Date(dataUpdatedAt).toLocaleTimeString()
                      : "Loading..."}
                  </span>
                </span>
              </p>
            </div>
          </div>

          {/* Alerts Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                alertEnabled ? setAlertEnabled(false) : enableAlerts()
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                alertEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30"
              }`}
            >
              {alertEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              Alerts
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alert Settings */}
        {alertEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
          >
            <p className="text-sm text-emerald-400 mb-2">
              ⚙️ Alert after continuous stability:
            </p>
            <div className="flex gap-2 flex-wrap">
              {[6, 12, 18, 21, 35, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setAlertThreshold(sec)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                    alertThreshold === sec
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Table */}
        <MagicCard
          className="overflow-hidden rounded-2xl border-slate-700/50"
          gradientColor="rgba(212, 169, 72, 0.05)"
        >
          {/* Search */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-slate-700/50 bg-slate-800/30"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-amber-400 transition-colors"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-700/30 transition-colors ${
                        row.original.spreadBps > 0 &&
                        row.original.spreadBps < 500
                          ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                          : "hover:bg-slate-800/50"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50 bg-slate-800/20">
            <div className="text-sm text-slate-400">
              Showing{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}{" "}
              of {table.getFilteredRowModel().rows.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-slate-300">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </MagicCard>

        {/* Top 3 Most Participated */}
        <MagicCard
          className="overflow-hidden rounded-2xl border-slate-700/50 p-4"
          gradientColor="rgba(212, 169, 72, 0.05)"
        >
          <h3 className="text-sm font-bold text-slate-400 mb-3">
            Top 3 Most Participated Projects Today (for reference)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase">
                    Project
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase">
                    Trades
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase">
                    Avg Buy
                  </th>
                </tr>
              </thead>
              <tbody>
                {topParticipated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-4 text-center text-slate-500 text-sm"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : (
                  topParticipated.map((item, index) => (
                    <tr
                      key={`top-${item.symbol}-${item.chain}-${index}`}
                      className="border-b border-slate-700/30"
                    >
                      <td className="px-3 py-2 font-semibold text-white">
                        {item.project}
                      </td>
                      <td className="px-3 py-2 text-slate-400">-</td>
                      <td className="px-3 py-2 text-slate-400">-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MagicCard>

        {/* Notes Section */}
        <MagicCard
          className="overflow-hidden rounded-2xl border-slate-700/50 p-4"
          gradientColor="rgba(212, 169, 72, 0.05)"
        >
          <h4 className="text-sm font-bold text-slate-400 mb-3">Notes</h4>
          <div className="space-y-2 text-sm text-slate-500">
            <p className="flex items-start gap-2">
              <span>⚙️</span>
              <span>
                <strong>Criteria:</strong> price range, volume swings, abnormal
                spikes, short-term trend.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span>🔔</span>
              <span>
                When Alerts are enabled, you&apos;ll be notified after ~
                {alertThreshold}s of continuous stability. Please keep the page
                in the foreground.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span>💡</span>
              <span>
                <strong>Spread bps:</strong> the discrepancy across trade
                records; smaller is steadier, prefer double green. 1 bps means 1
                USDT wear per 10,000 USDT.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span>📊</span>
              <span>
                <strong>Sorting:</strong> KOGE (1x) as baseline;
              </span>
            </p>
            <p className="flex items-start gap-2 mt-3 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
              <span>⚠️</span>
              <span className="text-rose-400">
                <strong>Disclaimer:</strong> Markets are unpredictable. DYOR; no
                liability for losses.
              </span>
            </p>
          </div>
        </MagicCard>
      </motion.div>

      {/* Footer gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030305] to-transparent pointer-events-none z-0" />
    </div>
  );
}
