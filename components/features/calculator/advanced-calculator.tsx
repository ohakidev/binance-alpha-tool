"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/stores/language-store";
import { Calculator, TrendingUp, DollarSign, Activity } from "lucide-react";

interface CalculatorState {
  // Basic Settings
  totalCost: number;
  dailyTransactions: number;
  includeBSC: boolean;
  soldBeforeMaxFee: number;
  buyingPrice: number;

  // AirDrop Settings
  pointsAllocated: number;
  singlePointValue: number;
  dailyCostPerUnit: number;
}

export function AdvancedCalculator() {
  const { t } = useLanguage();

  const [values, setValues] = useState<CalculatorState>({
    totalCost: 1000,
    dailyTransactions: 8192,
    includeBSC: true,
    soldBeforeMaxFee: 32768,
    buyingPrice: 0,
    pointsAllocated: 220,
    singlePointValue: 40,
    dailyCostPerUnit: 2,
  });

  // Calculations
  const pointsPerDay = Math.floor(
    (values.dailyTransactions / 1000) * (values.includeBSC ? 4 : 1)
  );
  const pointsPerWeek = pointsPerDay * 7;
  const possiblePointsPerWeek = Math.floor(
    (values.soldBeforeMaxFee / 1000) * 7
  );
  const earnedPoints = Math.min(pointsPerWeek, values.pointsAllocated);

  // Profit Calculation
  const weeklyIncome = earnedPoints * values.singlePointValue;
  const weeklyCost = values.dailyCostPerUnit * 7;
  const weeklyProfit = weeklyIncome - weeklyCost;

  const monthlyIncome = weeklyIncome * 4.3;
  const monthlyCost = weeklyCost * 4.3;
  const monthlyProfit = monthlyIncome - monthlyCost;

  const updateValue = (key: keyof CalculatorState, value: number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30 mb-4"
          >
            <Calculator className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-orange-300 bg-clip-text text-transparent">
              {t("calc.title")}
            </h1>
          </motion.div>
          <p className="text-slate-400 text-sm">{t("calc.strategyDesc")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Settings */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <GlassCard
              title={t("calc.basicSettings")}
              icon={<DollarSign className="w-5 h-5" />}
              color="amber"
            >
              <SliderControl
                label={t("calc.totalCost")}
                value={values.totalCost}
                onChange={(v) => updateValue("totalCost", v)}
                min={100}
                max={1000000}
                step={100}
                format={(v) => `$${v.toLocaleString()}`}
                hint={`${(values.totalCost / 365).toFixed(2)} ${t(
                  "common.perDay"
                )}`}
              />

              <SliderControl
                label={t("calc.dailyTransactions")}
                value={values.dailyTransactions}
                onChange={(v) => updateValue("dailyTransactions", v)}
                min={0}
                max={300000}
                step={100}
                format={(v) => `$${v.toLocaleString()}`}
              />

              <CheckboxControl
                label={t("calc.includeBSC")}
                checked={values.includeBSC}
                onChange={(checked) => updateValue("includeBSC", checked)}
              />

              <SliderControl
                label={t("calc.soldBeforeMaxFee")}
                value={values.soldBeforeMaxFee}
                onChange={(v) => updateValue("soldBeforeMaxFee", v)}
                min={0}
                max={300000}
                step={1000}
                format={(v) => `$${v.toLocaleString()}`}
                hint={`จำนวนธุรกรรมสูงสุด: ${(
                  values.soldBeforeMaxFee / 1000
                ).toFixed(0)} ครั้ง`}
              />
            </GlassCard>

            {/* AirDrop Settings */}
            <GlassCard
              title={t("calc.airDropSettings")}
              icon={<Activity className="w-5 h-5" />}
              color="cyan"
            >
              <SliderControl
                label={t("calc.pointsAllocated")}
                value={values.pointsAllocated}
                onChange={(v) => updateValue("pointsAllocated", v)}
                min={50}
                max={5000}
                step={10}
                format={(v) => `${v} ${t("calc.pointsPerDay").split(" ")[0]}`}
              />

              <SliderControl
                label={t("calc.singlePointValue")}
                value={values.singlePointValue}
                onChange={(v) => updateValue("singlePointValue", v)}
                min={10}
                max={500}
                step={10}
                format={(v) => `$${v}`}
              />

              <SliderControl
                label={t("calc.dailyCostPerUnit")}
                value={values.dailyCostPerUnit}
                onChange={(v) => updateValue("dailyCostPerUnit", v)}
                min={0}
                max={50}
                step={1}
                format={(v) => `$${v}`}
              />
            </GlassCard>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {/* Calculation Results */}
            <GlassCard
              title={t("calc.calculation")}
              icon={<Calculator className="w-5 h-5" />}
              color="emerald"
            >
              <ResultRow
                label={t("calc.pointsPerDay")}
                value={`${pointsPerDay} ${
                  t("calc.pointsPerDay").split(" ")[0]
                }`}
                color="blue"
              />
              <ResultRow
                label={t("calc.pointsPerWeek")}
                value={`${pointsPerWeek} ${
                  t("calc.pointsPerDay").split(" ")[0]
                }`}
                color="purple"
              />
              <ResultRow
                label={t("calc.possiblePointsPerWeek")}
                value={`${possiblePointsPerWeek} ${
                  t("calc.pointsPerDay").split(" ")[0]
                }`}
                color="amber"
                hint={`เฉลี่ย: ${(possiblePointsPerWeek / 7).toFixed(0)} ${t(
                  "common.perDay"
                )}`}
              />
              <ResultRow
                label={t("calc.earnedPoints")}
                value={`${earnedPoints} ${
                  t("calc.pointsPerDay").split(" ")[0]
                }`}
                color="emerald"
                highlight
              />
            </GlassCard>

            {/* Profit Calculation */}
            <GlassCard
              title={t("calc.profitCalc")}
              icon={<TrendingUp className="w-5 h-5" />}
              color="rose"
            >
              <div className="overflow-hidden rounded-lg border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        {t("calc.item")}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-cyan-300">
                        {t("calc.thisWeek")}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-purple-300">
                        {t("calc.last30Days")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {t("calc.airdropIncome")}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">
                        +${weeklyIncome.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">
                        +${monthlyIncome.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {t("calc.costOfSelling")}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-rose-400">
                        -${weeklyCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-rose-400">
                        -${monthlyCost.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-t-2 border-amber-500/30">
                      <td className="px-4 py-4 text-sm font-bold text-amber-200">
                        {t("calc.netProfit")}
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-bold text-emerald-400">
                        ${weeklyProfit.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-bold text-emerald-400">
                        ${monthlyProfit.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Strategy Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-300 mb-1">
                      {t("calc.profitStrategy")}
                    </h4>
                    <p className="text-xs text-cyan-200/70 leading-relaxed">
                      {t("calc.strategyDesc")}
                    </p>
                  </div>
                </div>
              </motion.div>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Glass Card Component
interface GlassCardProps {
  title: string;
  icon: React.ReactNode;
  color: "amber" | "cyan" | "emerald" | "rose";
  children: React.ReactNode;
}

function GlassCard({ title, icon, color, children }: GlassCardProps) {
  const colors = {
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    rose: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
    >
      <div
        className={`px-6 py-4 bg-gradient-to-r ${colors[color]} border-b border-white/10`}
      >
        <div className="flex items-center gap-3">
          <div className="text-white">{icon}</div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </motion.div>
  );
}

// Slider Control Component
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  hint?: string;
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
}: SliderControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-lg font-bold text-white px-3 py-1 bg-white/10 rounded-lg">
          {format(value)}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gradient-to-r from-slate-700 to-slate-600 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-gradient-to-r
                   [&::-webkit-slider-thumb]:from-amber-400
                   [&::-webkit-slider-thumb]:to-orange-500
                   [&::-webkit-slider-thumb]:shadow-lg
                   [&::-webkit-slider-thumb]:shadow-amber-500/50
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-all
                   [&::-webkit-slider-thumb]:hover:scale-110
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-gradient-to-r
                   [&::-moz-range-thumb]:from-amber-400
                   [&::-moz-range-thumb]:to-orange-500
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:shadow-lg
                   [&::-moz-range-thumb]:shadow-amber-500/50
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:transition-all
                   [&::-moz-range-thumb]:hover:scale-110"
      />

      <div className="flex justify-between text-xs text-slate-500">
        <span>{format(min)}</span>
        {hint && <span className="text-cyan-400">{hint}</span>}
        <span>{format(max)}</span>
      </div>
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
    <label className="flex items-center gap-3 cursor-pointer group">
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
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
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
    </motion.div>
  );
}
