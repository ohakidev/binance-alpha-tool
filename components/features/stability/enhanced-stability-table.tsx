"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useLanguage } from "@/lib/stores/language-store";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Download,
  RefreshCw,
} from "lucide-react";
import { MagicCard, StatsCard } from "@/components/ui/magic-card";

interface StabilityData {
  symbol?: string;
  token?: string;
  name: string;
  multiplier: number;
  isBaseline: boolean;
  price: number;
  change24h: number;
  volume24h: number;
  stabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  volatilityIndex: number;
  spreadBps: number;
  hasAbnormalSpike?: boolean;
  volumeSwing?: number;
  trend: "UP" | "DOWN" | "STABLE";
  fourXDays?: number; // Number of days with 4x multiplier
}

const columnHelper = createColumnHelper<StabilityData>();

export function EnhancedStabilityTable({ data }: { data: StabilityData[] }) {
  const { language } = useLanguage();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState<
    "ALL" | "LOW" | "MEDIUM" | "HIGH"
  >("ALL");

  // Ensure data is always an array - memoize to prevent infinite loop
  const safeData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  // Filter by risk level
  const filteredData = useMemo(() => {
    if (riskFilter === "ALL") return safeData;
    return safeData.filter((item) => item.riskLevel === riskFilter);
  }, [safeData, riskFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.symbol || row.token, {
        id: "project",
        header: language === "th" ? "โปรเจกต์" : "PROJECT",
        cell: (info) => {
          const row = info.row.original;
          const tokenSymbol = row.symbol || row.token || "N/A";
          return (
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3"
            >
              <div className="flex flex-col">
                <p className="font-black text-lg text-slate-900 dark:text-white">
                  {tokenSymbol}
                </p>
                {row.isBaseline && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    1x Baseline
                  </span>
                )}
              </div>
            </motion.div>
          );
        },
      }),
      columnHelper.accessor("riskLevel", {
        header: language === "th" ? "ความเสถียร" : "STABILITY",
        cell: (info) => {
          const level = info.getValue();
          const config = {
            LOW: {
              label: language === "th" ? "เสถียร" : "Stable",
              bg: "bg-emerald-500/20",
              text: "text-emerald-400",
            },
            MEDIUM: {
              label: language === "th" ? "ปานกลาง" : "Moderate",
              bg: "bg-amber-500/20",
              text: "text-amber-400",
            },
            HIGH: {
              label: language === "th" ? "ไม่เสถียร" : "Unstable",
              bg: "bg-rose-500/20",
              text: "text-rose-400",
            },
          };

          const { label, bg, text } = config[level];

          return (
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${bg} ${text} font-semibold text-sm`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${level === "LOW" ? "bg-emerald-500" : level === "MEDIUM" ? "bg-amber-500" : "bg-rose-500"}`}
                />
                {label}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("spreadBps", {
        header: () => (
          <div className="flex items-center justify-center gap-2">
            <span>{language === "th" ? "Spread bps" : "SPREAD BPS"}</span>
          </div>
        ),
        cell: (info) => {
          const bps = info.getValue();
          const isGood = bps < 0.5;
          const isModerate = bps >= 0.5 && bps < 1.5;
          return (
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${isGood ? "bg-emerald-500" : isModerate ? "bg-amber-500" : "bg-rose-500"}`}
              />
              <span className="font-semibold text-slate-900 dark:text-white">
                {bps.toFixed(2)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("fourXDays", {
        header: language === "th" ? "4X วัน" : "4X DAYS",
        cell: (info) => {
          const days = info.getValue() || 0;
          return (
            <div className="text-center">
              <span className="font-semibold text-lg text-slate-900 dark:text-white">
                {days}
              </span>
            </div>
          );
        },
      }),
    ],
    [language],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const stats = useMemo(() => {
    return {
      avgScore:
        safeData.length > 0
          ? Math.round(
              safeData.reduce((sum, item) => sum + item.stabilityScore, 0) /
                safeData.length,
            )
          : 0,
      lowRisk: safeData.filter((item) => item.riskLevel === "LOW").length,
      mediumRisk: safeData.filter((item) => item.riskLevel === "MEDIUM").length,
      highRisk: safeData.filter((item) => item.riskLevel === "HIGH").length,
      total: safeData.length,
    };
  }, [safeData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/10 p-8 border border-orange-500/20"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                {language === "th"
                  ? "ความเสถียรของโครงการ"
                  : "Project Stability"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "th"
                  ? "ตรวจสอบความเสถียรและความเสี่ยงของโครงการ Binance Alpha"
                  : "Check stability and risk of Binance Alpha projects"}
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

      {/* Disclaimer Banner */}
      <MagicCard
        className="relative overflow-hidden rounded-2xl border-orange-500/30 p-6 backdrop-blur-xl"
        gradientColor="rgba(249, 115, 22, 0.15)"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              {language === "th"
                ? "⚙️ เกณฑ์การประเมิน"
                : "⚙️ Evaluation Criteria"}
            </h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <span className="font-bold">📊</span>
                <span>
                  <strong>Criteria:</strong> price range, volume swings,
                  abnormal spikes, short-term trend
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold">💡</span>
                <span>
                  <strong>Spread bps:</strong> discrepancy across trade records;
                  smaller is steadier, prefer double green 🟢🟢. 1 bps = 1 USDT
                  wear per 10,000 USDT
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold">📊</span>
                <span>
                  <strong>Baseline:</strong> KOGE (1x) as reference; above is
                  usually steadier
                </span>
              </p>
              <p className="flex items-center gap-2 mt-3 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                <span className="font-bold text-lg">⚠️</span>
                <span className="font-semibold text-rose-700 dark:text-rose-400">
                  <strong>Disclaimer:</strong> Markets are unpredictable. DYOR;
                  no liability for losses.
                </span>
              </p>
            </div>
          </div>
        </div>
      </MagicCard>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <StatsCard
          title={language === "th" ? "คะแนนเฉลี่ย" : "Avg Score"}
          value={stats.avgScore.toString()}
          gradientFrom="cyan-500"
          gradientTo="blue-500"
          icon={<TrendingUp className="w-5 h-5 text-cyan-500" />}
        />
        <StatsCard
          title={language === "th" ? "ความเสี่ยงต่ำ" : "Low Risk"}
          value={stats.lowRisk.toString()}
          gradientFrom="emerald-500"
          gradientTo="green-500"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <StatsCard
          title={language === "th" ? "ความเสี่ยงปานกลาง" : "Med Risk"}
          value={stats.mediumRisk.toString()}
          gradientFrom="amber-500"
          gradientTo="orange-500"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
        <StatsCard
          title={language === "th" ? "โครงการ 4x" : "4x Projects"}
          value={(stats.total - 1).toString()}
          gradientFrom="orange-500"
          gradientTo="red-500"
          icon={<Filter className="w-5 h-5 text-orange-500" />}
        />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={
                language === "th" ? "ค้นหาโครงการ..." : "Search projects..."
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Risk Filter Buttons */}
          <div className="flex gap-2">
            {(["ALL", "LOW", "MEDIUM", "HIGH"] as const).map((level) => (
              <motion.button
                key={level}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRiskFilter(level)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  riskFilter === level
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {level === "ALL"
                  ? language === "th"
                    ? "ทั้งหมด"
                    : "All"
                  : level.charAt(0) + level.slice(1).toLowerCase()}
              </motion.button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={language === "th" ? "รีเฟรช" : "Refresh"}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={language === "th" ? "ดาวน์โหลด" : "Download"}
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <MagicCard
        className="overflow-hidden rounded-2xl border-white/10"
        gradientColor="rgba(255, 255, 255, 0.05)"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <ArrowUpDown className="w-4 h-4 text-orange-500" />
                          </motion.div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {language === "th" ? "แสดง" : "Showing"}{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
            </span>{" "}
            {language === "th" ? "ถึง" : "to"}{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                filteredData.length,
              )}
            </span>{" "}
            {language === "th" ? "จากทั้งหมด" : "of"}{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredData.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i).map(
                (pageIndex) => (
                  <motion.button
                    key={pageIndex}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => table.setPageIndex(pageIndex)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      table.getState().pagination.pageIndex === pageIndex
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {pageIndex + 1}
                  </motion.button>
                ),
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
