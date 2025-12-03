"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface StabilityData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  stabilityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  volatilityIndex: number;
}

const columnHelper = createColumnHelper<StabilityData>();

export function StabilityTable({ data }: { data: StabilityData[] }) {
  const { language } = useLanguage();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: language === "th" ? "สัญลักษณ์" : "Symbol",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">
                {info.getValue().substring(0, 2)}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                {info.getValue()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "th" ? "BNB Chain" : "BNB Chain"}
              </p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("price", {
        header: language === "th" ? "ราคา" : "Price",
        cell: (info) => (
          <div className="text-right">
            <p className="font-bold text-lg text-slate-900 dark:text-white">
              ${info.getValue().toFixed(4)}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("change24h", {
        header: language === "th" ? "เปลี่ยนแปลง 24ชม." : "24h Change",
        cell: (info) => {
          const value = info.getValue();
          const isPositive = value >= 0;
          return (
            <div className="flex items-center justify-end gap-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
              <span
                className={`font-bold ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {value.toFixed(2)}%
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("volume24h", {
        header: language === "th" ? "ปริมาณ 24ชม." : "24h Volume",
        cell: (info) => (
          <div className="text-right">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              ${(info.getValue() / 1000000).toFixed(2)}M
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("stabilityScore", {
        header: language === "th" ? "คะแนนความเสถียร" : "Stability Score",
        cell: (info) => {
          const score = info.getValue();
          const getColor = () => {
            if (score >= 80) return "from-emerald-500 to-teal-500";
            if (score >= 60) return "from-cyan-500 to-blue-500";
            if (score >= 40) return "from-amber-500 to-orange-500";
            return "from-rose-500 to-pink-500";
          };
          return (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getColor()} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white w-12 text-right">
                {score}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("riskLevel", {
        header: language === "th" ? "ระดับความเสี่ยง" : "Risk Level",
        cell: (info) => {
          const risk = info.getValue();
          const config = {
            LOW: {
              label: language === "th" ? "ต่ำ" : "Low",
              color:
                "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
              icon: <CheckCircle2 className="w-4 h-4" />,
            },
            MEDIUM: {
              label: language === "th" ? "ปานกลาง" : "Medium",
              color:
                "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
              icon: <AlertTriangle className="w-4 h-4" />,
            },
            HIGH: {
              label: language === "th" ? "สูง" : "High",
              color:
                "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700",
              icon: <AlertTriangle className="w-4 h-4" />,
            },
          };
          const { label, color, icon } = config[risk];
          return (
            <div className="flex justify-end">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm border-2 ${color}`}
              >
                {icon}
                {label}
              </motion.div>
            </div>
          );
        },
      }),
    ],
    [language],
  );

  const table = useReactTable({
    data: safeData,
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-white dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 shadow-lg"
      >
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={
            language === "th" ? "ค้นหาสัญลักษณ์..." : "Search symbol..."
          }
          className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 font-medium"
        />
        {globalFilter && (
          <button
            onClick={() => setGlobalFilter("")}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            {language === "th" ? "ล้าง" : "Clear"}
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border-b-2 border-slate-200 dark:border-slate-700"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "rgba(249, 115, 22, 0.05)" }}
                  className="transition-colors"
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
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {language === "th"
              ? `แสดง ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} ถึง ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} จาก ${data.length} รายการ`
              : `Showing ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of ${data.length} entries`}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <span className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <StatCard
          label={language === "th" ? "คะแนนเฉลี่ย" : "Average Score"}
          value={
            safeData.length > 0
              ? Math.round(
                  safeData.reduce((sum, item) => sum + item.stabilityScore, 0) /
                    safeData.length,
                )
              : 0
          }
          color="cyan"
        />
        <StatCard
          label={language === "th" ? "ความเสี่ยงต่ำ" : "Low Risk"}
          value={safeData.filter((item) => item.riskLevel === "LOW").length}
          color="emerald"
        />
        <StatCard
          label={language === "th" ? "โครงการทั้งหมด" : "Total Projects"}
          value={safeData.length}
          color="orange"
        />
      </motion.div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  color: "cyan" | "emerald" | "orange";
}

function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    cyan: "from-cyan-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-500",
    orange: "from-orange-500 to-amber-500",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-5 rounded-xl bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 shadow-lg"
    >
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
        {label}
      </p>
      <p
        className={`text-4xl font-black bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}
      >
        {value}
      </p>
    </motion.div>
  );
}
