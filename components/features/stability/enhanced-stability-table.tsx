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
  Zap,
} from "lucide-react";
import { MagicCard, StatsCard } from "@/components/ui/magic-card";

// Interface for bookTicker stability data
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
  fourXDays?: number;
  // New fields for bookTicker data
  bestBid?: number;
  bestAsk?: number;
  spreadPercent?: number; // ((ask - bid) / ask) * 100
  wearCost?: number; // 1000 USDT * (spreadPercent / 100)
  zone?: "GREEN" | "RED" | "NORMAL"; // GREEN: < 0.02%, RED: > 0.1%
  lastUpdate?: number;
}

interface EnhancedStabilityTableProps {
  data: StabilityData[];
  isRealtime?: boolean;
}

const columnHelper = createColumnHelper<StabilityData>();

export function EnhancedStabilityTable({
  data,
  isRealtime = false,
}: EnhancedStabilityTableProps) {
  const { language } = useLanguage();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState<
    "ALL" | "GREEN" | "NORMAL" | "RED"
  >("ALL");

  // Ensure data is always an array
  const safeData = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  // Filter by zone
  const filteredData = useMemo(() => {
    if (zoneFilter === "ALL") return safeData;
    return safeData.filter((item) => item.zone === zoneFilter);
  }, [safeData, zoneFilter]);

  // Column definitions for real-time bookTicker data
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.symbol || row.token, {
        id: "symbol",
        header: language === "th" ? "สัญลักษณ์" : "SYMBOL",
        cell: (info) => {
          const row = info.row.original;
          const symbol = row.symbol || row.token || "N/A";
          const zone = row.zone;
          return (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  zone === "GREEN"
                    ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30"
                    : zone === "RED"
                      ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30"
                      : "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/30"
                }`}
              >
                <span className="text-white font-black text-sm">
                  {symbol.substring(0, 2)}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="font-black text-lg text-slate-900 dark:text-white">
                  {symbol}
                </p>
                {isRealtime && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Live
                  </span>
                )}
              </div>
            </motion.div>
          );
        },
      }),
      columnHelper.accessor("bestBid", {
        header: language === "th" ? "ราคาเสนอซื้อ" : "BEST BID",
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-right">
              <span className="font-semibold text-emerald-500 dark:text-emerald-400">
                {value?.toFixed(8) || "-"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("bestAsk", {
        header: language === "th" ? "ราคาเสนอขาย" : "BEST ASK",
        cell: (info) => {
          const value = info.getValue();
          return (
            <div className="text-right">
              <span className="font-semibold text-rose-500 dark:text-rose-400">
                {value?.toFixed(8) || "-"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("spreadPercent", {
        header: () => (
          <div className="flex items-center justify-center gap-2">
            <span>{language === "th" ? "Spread %" : "SPREAD %"}</span>
          </div>
        ),
        cell: (info) => {
          const spread = info.getValue();
          const zone = info.row.original.zone;

          if (spread === undefined) return <span>-</span>;

          // Determine color based on zone
          // GREEN: < 0.02%, RED: > 0.1%
          const isGreen = zone === "GREEN" || spread < 0.02;
          const isRed = zone === "RED" || spread > 0.1;

          return (
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-3 py-1.5 rounded-lg font-bold text-sm flex items-center gap-2 ${
                  isGreen
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isRed
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isGreen
                      ? "bg-emerald-500"
                      : isRed
                        ? "bg-rose-500"
                        : "bg-amber-500"
                  }`}
                />
                {spread.toFixed(4)}%
              </motion.div>
            </div>
          );
        },
      }),
      columnHelper.accessor("wearCost", {
        header: () => (
          <div className="flex flex-col items-center">
            <span>{language === "th" ? "ค่าสึกหรอ" : "WEAR COST"}</span>
            <span className="text-xs text-slate-500">(1000 USDT)</span>
          </div>
        ),
        cell: (info) => {
          const cost = info.getValue();
          const zone = info.row.original.zone;

          if (cost === undefined) return <span>-</span>;

          const isGreen = zone === "GREEN";
          const isRed = zone === "RED";

          return (
            <div className="text-center">
              <span
                className={`font-bold text-lg ${
                  isGreen
                    ? "text-emerald-400"
                    : isRed
                      ? "text-rose-400"
                      : "text-amber-400"
                }`}
              >
                ${cost.toFixed(4)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("zone", {
        header: language === "th" ? "โซน" : "ZONE",
        cell: (info) => {
          const zone = info.getValue();

          const config = {
            GREEN: {
              label: language === "th" ? "ดีมาก" : "Excellent",
              bg: "bg-emerald-500/20",
              text: "text-emerald-400",
              border: "border-emerald-500/30",
              icon: <CheckCircle2 className="w-4 h-4" />,
            },
            NORMAL: {
              label: language === "th" ? "ปกติ" : "Normal",
              bg: "bg-amber-500/20",
              text: "text-amber-400",
              border: "border-amber-500/30",
              icon: <AlertTriangle className="w-4 h-4" />,
            },
            RED: {
              label: language === "th" ? "สูง" : "High",
              bg: "bg-rose-500/20",
              text: "text-rose-400",
              border: "border-rose-500/30",
              icon: <AlertTriangle className="w-4 h-4" />,
            },
          };

          const zoneConfig = config[zone || "NORMAL"];

          return (
            <div className="flex justify-center">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${zoneConfig.bg} ${zoneConfig.text} border ${zoneConfig.border} font-semibold text-sm`}
              >
                {zoneConfig.icon}
                {zoneConfig.label}
              </motion.span>
            </div>
          );
        },
      }),
      columnHelper.accessor("spreadBps", {
        header: () => (
          <div className="flex items-center justify-center gap-2">
            <span>{language === "th" ? "Spread BPS" : "SPREAD BPS"}</span>
          </div>
        ),
        cell: (info) => {
          const bps = info.getValue();
          const isGood = bps < 2; // < 0.02% = < 2 bps
          const isModerate = bps >= 2 && bps < 10; // 0.02% - 0.1% = 2-10 bps
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
    ],
    [language, isRealtime],
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
        pageSize: 20,
      },
    },
  });

  // Statistics
  const stats = useMemo(() => {
    const greenZone = safeData.filter((item) => item.zone === "GREEN").length;
    const redZone = safeData.filter((item) => item.zone === "RED").length;
    const normalZone = safeData.filter((item) => item.zone === "NORMAL").length;
    const avgSpread =
      safeData.length > 0
        ? safeData.reduce((sum, item) => sum + (item.spreadPercent || 0), 0) /
          safeData.length
        : 0;
    const avgWearCost =
      safeData.length > 0
        ? safeData.reduce((sum, item) => sum + (item.wearCost || 0), 0) /
          safeData.length
        : 0;

    return {
      greenZone,
      redZone,
      normalZone,
      total: safeData.length,
      avgSpread,
      avgWearCost,
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
                  ? "ความเสถียร - Spread Monitor"
                  : "Stability - Spread Monitor"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "th"
                  ? "ติดตาม Spread % และค่าใช้จ่ายแบบเรียลไทม์จาก Binance bookTicker"
                  : "Real-time Spread % and Wear Cost monitoring from Binance bookTicker"}
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

      {/* Calculation Info Banner */}
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
              {language === "th" ? "⚙️ วิธีคำนวณ" : "⚙️ Calculation Method"}
            </h3>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <span className="font-bold">📊</span>
                <span>
                  <strong>Spread %:</strong> ((Ask - Bid) / Ask) × 100 (4
                  decimal places)
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold">💰</span>
                <span>
                  <strong>Wear Cost:</strong> 1000 USDT × (Spread % / 100) =
                  Cost per farming cycle
                </span>
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {language === "th"
                    ? "🟢 Green Zone: Spread < 0.02%"
                    : "🟢 Green Zone: Spread < 0.02%"}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {language === "th"
                    ? "🔴 Red Zone: Spread > 0.1%"
                    : "🔴 Red Zone: Spread > 0.1%"}
                </span>
              </div>
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
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <StatsCard
          title={language === "th" ? "Green Zone" : "Green Zone"}
          value={stats.greenZone.toString()}
          gradientFrom="emerald-500"
          gradientTo="green-500"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <StatsCard
          title={language === "th" ? "Normal Zone" : "Normal Zone"}
          value={stats.normalZone.toString()}
          gradientFrom="amber-500"
          gradientTo="orange-500"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
        <StatsCard
          title={language === "th" ? "Red Zone" : "Red Zone"}
          value={stats.redZone.toString()}
          gradientFrom="rose-500"
          gradientTo="red-500"
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        />
        <StatsCard
          title={language === "th" ? "Avg Spread %" : "Avg Spread %"}
          value={stats.avgSpread.toFixed(4) + "%"}
          gradientFrom="cyan-500"
          gradientTo="blue-500"
          icon={<TrendingUp className="w-5 h-5 text-cyan-500" />}
        />
        <StatsCard
          title={language === "th" ? "Avg Wear Cost" : "Avg Wear Cost"}
          value={"$" + stats.avgWearCost.toFixed(4)}
          gradientFrom="purple-500"
          gradientTo="pink-500"
          icon={<Filter className="w-5 h-5 text-purple-500" />}
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
                language === "th"
                  ? "ค้นหาคู่เทรด (เช่น BTCUSDT)..."
                  : "Search trading pair (e.g., BTCUSDT)..."
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

          {/* Zone Filter Buttons */}
          <div className="flex gap-2">
            {(["ALL", "GREEN", "NORMAL", "RED"] as const).map((zone) => (
              <motion.button
                key={zone}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setZoneFilter(zone)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  zoneFilter === zone
                    ? zone === "GREEN"
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30"
                      : zone === "RED"
                        ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/30"
                        : zone === "NORMAL"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {zone === "ALL"
                  ? language === "th"
                    ? "ทั้งหมด"
                    : "All"
                  : zone}
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
                {table.getRowModel().rows.map((row, index) => {
                  const zone = row.original.zone;
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className={`border-b border-slate-200 dark:border-slate-700 transition-colors ${
                        zone === "GREEN"
                          ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                          : zone === "RED"
                            ? "bg-rose-500/5 hover:bg-rose-500/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
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
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {table.getRowModel().rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Zap className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {language === "th"
                ? "รอรับข้อมูลจาก WebSocket..."
                : "Waiting for WebSocket data..."}
            </p>
            <p className="text-sm mt-2">
              {language === "th"
                ? "ข้อมูลจะปรากฏเมื่อเชื่อมต่อสำเร็จ"
                : "Data will appear once connected"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {table.getRowModel().rows.length > 0 && (
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
                {Array.from(
                  { length: Math.min(table.getPageCount(), 5) },
                  (_, i) => i,
                ).map((pageIndex) => (
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
                ))}
                {table.getPageCount() > 5 && (
                  <span className="px-2 text-slate-500">...</span>
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
        )}
      </MagicCard>
    </div>
  );
}
