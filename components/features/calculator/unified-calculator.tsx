"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/stores/language-store";
import { useUserStore } from "@/lib/stores/user-store";
import { useIncomeStore } from "@/lib/stores/income-store";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { endOfMonth } from "date-fns";
import { MagicCard } from "@/components/ui/magic-card";

interface CalculatorState {
  // Basic Settings
  accountCost: number;
  dailyTransactions: number;
  includeBSC: boolean;

  // AirDrop Settings
  pointsAllocated: number;
  singlePointValue: number;
  dailyCostPerUnit: number;
}

export function UnifiedCalculator() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("calculator");
  const [mounted, setMounted] = useState(false);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get active user
  const activeUserId = useUserStore((state) => state.activeUserId);
  const getEntriesByUserAndMonth = useIncomeStore(
    (state) => state.getEntriesByUserAndMonth,
  );

  // Memoize current month to prevent re-creation on every render
  const currentMonth = useMemo(() => new Date(), []);

  // Memoize month entries to prevent infinite loop
  const monthEntries = useMemo(() => {
    if (!activeUserId) return [];
    return getEntriesByUserAndMonth(activeUserId, currentMonth);
  }, [activeUserId, getEntriesByUserAndMonth, currentMonth]);

  const [values, setValues] = useState<CalculatorState>({
    accountCost: 1000,
    dailyTransactions: 8192, // 2^13
    includeBSC: true,
    pointsAllocated: 220,
    singlePointValue: 40,
    dailyCostPerUnit: 2,
  });

  // Calculations
  const calculations = useMemo(() => {
    const pointsPerDay = Math.floor(
      (values.dailyTransactions / 1000) * (values.includeBSC ? 4 : 1),
    );
    const points15Days = pointsPerDay * 15;
    const maxAllocations = Math.floor(points15Days / values.pointsAllocated);
    const totalPointsRemaining =
      points15Days - maxAllocations * values.pointsAllocated;

    // 15-day period
    const income15Days =
      maxAllocations * values.pointsAllocated * values.singlePointValue;
    const cost15Days = values.dailyCostPerUnit * 15;
    const profit15Days = income15Days - cost15Days;

    // 30-day period
    const income30Days = income15Days * 2;
    const cost30Days = cost15Days * 2;
    const profit30Days = income30Days - cost30Days;

    const transactionBonus =
      values.dailyTransactions * (values.includeBSC ? 4 : 1);

    return {
      pointsPerDay,
      points15Days,
      maxAllocations,
      totalPointsRemaining,
      income15Days,
      cost15Days,
      profit15Days,
      income30Days,
      cost30Days,
      profit30Days,
      transactionBonus,
    };
  }, [values]);

  const updateValue = (key: keyof CalculatorState, value: number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const isProfitable = calculations.profit30Days > 0;

  // Daily volume data - Generate from user's income entries
  const dailyVolumeData = useMemo(() => {
    if (!activeUserId) {
      // Return mock data if no user is selected
      return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        points: 0,
        volume: 0,
      }));
    }

    // Group entries by day
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = monthEnd.getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;

      // Filter entries for this day
      const dayEntries = monthEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.getDate() === day;
      });

      // Calculate total volume (sum of amounts) for the day
      const volume = dayEntries.reduce((sum, entry) => sum + entry.amount, 0);

      // Calculate points based on transactions (using dailyTransactions value)
      const points = Math.floor(
        (values.dailyTransactions / 1000) * (values.includeBSC ? 4 : 1),
      );

      return {
        day,
        points: dayEntries.length > 0 ? points : 0,
        volume: Math.round(volume),
      };
    });
  }, [
    activeUserId,
    monthEntries,
    currentMonth,
    values.dailyTransactions,
    values.includeBSC,
  ]);

  // Show loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="flex justify-center">
              <div className="h-12 w-64 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex justify-center">
              <div className="h-12 w-80 bg-white/5 rounded-xl border border-white/10" />
            </div>

            {/* Content grid skeleton */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20" />
                <div className="h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20" />
              </div>
              <div className="space-y-6">
                <div className="h-64 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/20" />
                <div className="h-64 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-2xl border border-rose-500/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={`calculator-${language}`}
      className="min-h-screen bg-[#fafbfc] dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30 mb-4"
          >
            <Calculator className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
              {t("calc.title")}
            </h1>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>{t("calc.calculation")}</span>
            </TabsTrigger>
            <TabsTrigger value="volume" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>{t("calc.dailyVolumeTracker")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column: Settings */}
              <div className="space-y-6">
                {/* Basic Settings */}
                <SectionCard
                  title={t("calc.basicSettings")}
                  icon={<DollarSign className="w-5 h-5" />}
                  gradient="from-amber-500/20 to-orange-500/20"
                  border="border-amber-500/30"
                >
                  <SliderControl
                    label={t("calc.accountCost")}
                    value={values.accountCost}
                    onChange={(v) => updateValue("accountCost", v)}
                    min={100}
                    max={1000000}
                    step={100}
                    format={(v) => `$${v.toLocaleString()}`}
                    hint={`${(values.accountCost / 365).toFixed(2)} ${t("common.perDay")}`}
                    showTicks
                    tickValues={[100, 1000, 100000, 500000, 1000000]}
                  />

                  {/* Daily Transactions Slider - Changed from Dropdown */}
                  <SliderControl
                    label={t("calc.dailyTransactions")}
                    value={values.dailyTransactions}
                    onChange={(v) =>
                      updateValue("dailyTransactions", Math.round(v))
                    }
                    min={2}
                    max={262144}
                    step={1}
                    format={(v) => `$${v.toLocaleString()}`}
                    hint={`${t("calc.transactionBonus")}: ${Math.floor((values.dailyTransactions / 1000) * (values.includeBSC ? 4 : 1))}`}
                    showTicks
                    tickValues={[2, 16000, 65000, 131000, 262000]}
                  />

                  <CheckboxControl
                    label={t("calc.includeBSC")}
                    checked={values.includeBSC}
                    onChange={(checked) => updateValue("includeBSC", checked)}
                  />

                  <InfoRow
                    label={t("calc.transactionBonus")}
                    value={`${calculations.transactionBonus.toLocaleString()}`}
                    hint={`${t("calc.bonusPerDay")}: ${calculations.transactionBonus / (values.includeBSC ? 4 : 1)} ${t("common.perDay")}`}
                    color="blue"
                  />
                </SectionCard>

                {/* AirDrop Settings */}
                <SectionCard
                  title={t("calc.airDropSettings")}
                  icon={<Activity className="w-5 h-5" />}
                  gradient="from-cyan-500/20 to-blue-500/20"
                  border="border-cyan-500/30"
                >
                  <SliderControl
                    label={t("calc.pointsAllocated")}
                    value={values.pointsAllocated}
                    onChange={(v) => updateValue("pointsAllocated", v)}
                    min={50}
                    max={5000}
                    step={10}
                    format={(v) => `${v} ${t("calc.points")}`}
                    showTicks
                    tickValues={[50, 500, 1000, 2000, 3000, 5000]}
                  />

                  <SliderControl
                    label={t("calc.singlePointValue")}
                    value={values.singlePointValue}
                    onChange={(v) => updateValue("singlePointValue", v)}
                    min={10}
                    max={500}
                    step={10}
                    format={(v) => `$${v}`}
                    showTicks
                    tickValues={[10, 50, 100, 200, 300, 500]}
                  />

                  <SliderControl
                    label={t("calc.dailyCostPerUnit")}
                    value={values.dailyCostPerUnit}
                    onChange={(v) => updateValue("dailyCostPerUnit", v)}
                    min={0}
                    max={50}
                    step={1}
                    format={(v) => `$${v}`}
                    showTicks
                    tickValues={[0, 10, 20, 30, 40, 50]}
                  />
                </SectionCard>
              </div>

              {/* Right Column: Results */}
              <div className="space-y-6">
                {/* Calculation Results */}
                <SectionCard
                  title={t("calc.calculation")}
                  icon={<Calculator className="w-5 h-5" />}
                  gradient="from-emerald-500/20 to-teal-500/20"
                  border="border-emerald-500/30"
                >
                  <ResultRow
                    label={t("calc.pointsPerDay")}
                    value={`${calculations.pointsPerDay} ${t("calc.points")}`}
                    hint={`${t("calc.bonusPerDay")} ${calculations.pointsPerDay / (values.includeBSC ? 4 : 1)}`}
                    color="blue"
                  />

                  <ResultRow
                    label={t("calc.pointsPerWeek")}
                    value={`${calculations.points15Days} ${t("calc.points")}`}
                    hint={`17 × ${calculations.pointsPerDay / 15}`}
                    color="purple"
                  />

                  <ResultRow
                    label={t("calc.maxAllocations")}
                    value={`${calculations.maxAllocations} ${t("calc.timesAllocation")}`}
                    color="amber"
                  />

                  <ResultRow
                    label={t("calc.totalPointsRemaining")}
                    value={`${calculations.totalPointsRemaining} ${t("calc.points")}`}
                    hint={t("calc.calculatedHint")}
                    color="emerald"
                    highlight
                  />
                </SectionCard>

                {/* Profit Calculation */}
                <SectionCard
                  title={t("calc.profitCalc")}
                  icon={<TrendingUp className="w-5 h-5" />}
                  gradient="from-rose-500/20 to-pink-500/20"
                  border="border-rose-500/30"
                >
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                            {t("calc.item")}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-cyan-300">
                            {t("calc.period15Days")}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-purple-300">
                            {t("calc.period30Days")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {t("calc.airdropIncome")}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">
                            +${calculations.income15Days.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">
                            +${calculations.income30Days.toLocaleString()}
                          </td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {t("calc.costOfSelling")}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-rose-400">
                            -${calculations.cost15Days.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-rose-400">
                            -${calculations.cost30Days.toLocaleString()}
                          </td>
                        </tr>
                        <tr className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-t-2 border-amber-500/30">
                          <td className="px-4 py-4 text-sm font-bold text-amber-200">
                            {t("calc.netProfit")}
                          </td>
                          <td
                            className={`px-4 py-4 text-right text-lg font-bold ${
                              calculations.profit15Days >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            ${calculations.profit15Days.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-4 text-right text-lg font-bold ${
                              calculations.profit30Days >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            ${calculations.profit30Days.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Strategy Info */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`mt-4 p-4 rounded-xl border ${
                      isProfitable
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-rose-500/10 border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full ${
                          isProfitable ? "bg-emerald-500/20" : "bg-rose-500/20"
                        } flex items-center justify-center flex-shrink-0 mt-0.5`}
                      >
                        {isProfitable ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-semibold mb-1 ${
                            isProfitable ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {t("calc.profitStrategy")}
                        </h4>
                        <p
                          className={`text-xs leading-relaxed ${
                            isProfitable
                              ? "text-emerald-200/70"
                              : "text-rose-200/70"
                          }`}
                        >
                          {t("calc.strategyDesc")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="volume" className="mt-0">
            <SectionCard
              title="Daily Volume & Points Tracker"
              icon={<BarChart3 className="w-5 h-5" />}
              gradient="from-purple-500/20 to-pink-500/20"
              border="border-purple-500/30"
            >
              <div className="space-y-4">
                {/* Latest Volume - Highlighted */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-bold text-amber-200">
                      {t("calc.latestVolume")}
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <p className="text-5xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
                      $
                      {dailyVolumeData[
                        dailyVolumeData.length - 1
                      ]?.volume.toLocaleString()}
                    </p>
                    <div className="flex flex-col">
                      <p className="text-sm text-amber-300">
                        {dailyVolumeData[
                          dailyVolumeData.length - 1
                        ]?.points.toLocaleString()}{" "}
                        {t("calc.points")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("calc.day")}{" "}
                        {dailyVolumeData[dailyVolumeData.length - 1]?.day}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
                    <p className="text-xs text-blue-300 mb-1">
                      {t("calc.totalPoints")}
                    </p>
                    <p className="text-2xl font-bold text-blue-400">
                      {dailyVolumeData
                        .reduce((sum, d) => sum + d.points, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                    <p className="text-xs text-purple-300 mb-1">
                      {t("calc.totalVolume")}
                    </p>
                    <p className="text-2xl font-bold text-purple-400">
                      $
                      {dailyVolumeData
                        .reduce((sum, d) => sum + d.volume, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
                    <p className="text-xs text-emerald-300 mb-1">
                      {t("calc.avgDaily")}
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {Math.floor(
                        dailyVolumeData.reduce((sum, d) => sum + d.points, 0) /
                          dailyVolumeData.length,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Table */}
                <div className="max-h-[600px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                          {t("calc.day")}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                          {t("calc.points")}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                          {t("calc.totalVolume")}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">
                          {t("calc.pointsVolumeRatio")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dailyVolumeData.map((data, index) => (
                        <motion.tr
                          key={data.day}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-300">
                            {t("calc.day")} {data.day}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-blue-400">
                              {data.points.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-purple-400">
                              ${data.volume.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-emerald-400">
                              {data.volume > 0
                                ? ((data.points / data.volume) * 100).toFixed(2)
                                : "0.00"}
                              %
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// Section Card Component
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  children: React.ReactNode;
}

function SectionCard({
  title,
  icon,
  gradient,
  border,
  children,
}: SectionCardProps) {
  // Extract color from gradient string for MagicCard
  const colorMatch = gradient.match(/from-([a-z]+)-/);
  const colorName = colorMatch ? colorMatch[1] : "slate";

  const colorMap: Record<string, string> = {
    amber: "rgba(251, 191, 36, 0.15)",
    cyan: "rgba(6, 182, 212, 0.15)",
    emerald: "rgba(16, 185, 129, 0.15)",
    rose: "rgba(244, 63, 94, 0.15)",
    purple: "rgba(168, 85, 247, 0.15)",
    blue: "rgba(59, 130, 246, 0.15)",
  };

  return (
    <MagicCard
      className={`overflow-hidden rounded-2xl border ${border}`}
      gradientColor={colorMap[colorName] || "rgba(255, 255, 255, 0.1)"}
    >
      <div
        className={`px-6 py-4 bg-gradient-to-r ${gradient} border-b ${border}`}
      >
        <div className="flex items-center gap-3">
          <div className="text-white">{icon}</div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-6 relative z-10">{children}</div>
    </MagicCard>
  );
}

// Slider Control Component with Direct Input and Tick Marks
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  hint?: string;
  showTicks?: boolean;
  tickValues?: number[];
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  hint,
  showTicks = false,
  tickValues = [],
}: SliderControlProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = Number(inputValue.replace(/[^0-9.-]/g, ""));
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min), max);
      onChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  // Update input value when value prop changes (from slider)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  // Format tick value for display - shorter format
  const formatTick = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return `${val}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-sm font-medium text-slate-300 flex-shrink-0">
          {label}
        </label>
        <input
          type="text"
          value={isEditing ? inputValue : format(value)}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="text-lg font-bold text-white px-4 py-2 bg-white/10 border-2 border-white/20 hover:border-orange-500/50 focus:border-orange-500 rounded-xl backdrop-blur-sm transition-all outline-none text-right w-full sm:w-auto sm:min-w-[140px]"
        />
      </div>

      <div className="relative pt-1">
        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 shadow-lg shadow-orange-500/30"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer z-10"
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-xl shadow-orange-500/60 pointer-events-none border-2 border-white/20"
          style={{
            left: `calc(${percentage}% - 12px)`,
            top: "calc(50% + 2px)",
          }}
          whileHover={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>

      {/* Tick marks with values - improved spacing */}
      {showTicks && tickValues.length > 0 && (
        <div className="flex justify-between items-center px-1 mt-1">
          {tickValues.slice(0, 5).map((tickVal, index) => {
            const isFirst = index === 0;
            const isLast = index === tickValues.slice(0, 5).length - 1;
            return (
              <button
                key={tickVal}
                onClick={() => onChange(tickVal)}
                className={`text-[10px] text-slate-400 hover:text-cyan-400 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isFirst ? "text-left" : isLast ? "text-right" : "text-center"
                }`}
              >
                {formatTick(tickVal)}
              </button>
            );
          })}
        </div>
      )}

      {/* Hint text */}
      {hint && (
        <div className="text-center mt-2">
          <span className="text-xs text-cyan-400 font-medium px-3 py-1 bg-cyan-500/10 rounded-full">
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}

// Checkbox Control Component
interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxControl({ label, checked, onChange }: CheckboxControlProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-6 h-6 rounded-md border-2 border-slate-600 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/20 transition-all group-hover:border-slate-500">
          {checked && (
            <motion.svg
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-full h-full text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}

// Info Row (read-only calculated value)
interface InfoRowProps {
  label: string;
  value: string;
  hint?: string;
  color: "blue" | "purple" | "amber" | "emerald";
}

function InfoRow({ label, value, hint, color }: InfoRowProps) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center justify-between p-4 rounded-lg border ${colors[color]}`}
    >
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
      <p className={`text-xl font-bold ${colors[color].split(" ")[0]}`}>
        {value}
      </p>
    </motion.div>
  );
}

// Result Row Component
interface ResultRowProps {
  label: string;
  value: string;
  color: "blue" | "purple" | "amber" | "emerald";
  highlight?: boolean;
  hint?: string;
}

function ResultRow({ label, value, color, highlight, hint }: ResultRowProps) {
  const colors = {
    blue: "text-blue-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
        highlight
          ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/20"
          : "bg-white/5 hover:bg-white/10"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
      <motion.p
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={`text-xl font-bold ${colors[color]}`}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}
