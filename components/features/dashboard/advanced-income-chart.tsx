'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/lib/stores/language-store';
import { useState, useMemo } from 'react';

interface ChartData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export function AdvancedIncomeChart() {
  const { language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data - replace with real data
  const data: ChartData[] = [
    { month: 'Jan', income: 12000, expenses: 8000, profit: 4000 },
    { month: 'Feb', income: 15000, expenses: 9000, profit: 6000 },
    { month: 'Mar', income: 18000, expenses: 10000, profit: 8000 },
    { month: 'Apr', income: 22000, expenses: 11000, profit: 11000 },
    { month: 'May', income: 25000, expenses: 12000, profit: 13000 },
    { month: 'Jun', income: 28000, expenses: 13000, profit: 15000 },
  ];

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expenses)));

  const stats = useMemo(() => {
    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;
    const avgProfit = totalProfit / data.length;
    const trend = data[data.length - 1].profit > data[0].profit ? 'up' : 'down';
    const trendPercentage = ((data[data.length - 1].profit - data[0].profit) / data[0].profit) * 100;

    return { totalIncome, totalExpenses, totalProfit, avgProfit, trend, trendPercentage };
  }, [data]);

  const periods = [
    { value: '7d' as const, label: language === 'th' ? '7 วัน' : '7 Days' },
    { value: '30d' as const, label: language === 'th' ? '30 วัน' : '30 Days' },
    { value: '90d' as const, label: language === 'th' ? '90 วัน' : '90 Days' },
    { value: '1y' as const, label: language === 'th' ? '1 ปี' : '1 Year' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white mb-2">
            {language === 'th' ? 'ภาพรวมรายได้' : 'Income Overview'}
          </h2>
          <p className="text-sm text-slate-400">
            {language === 'th'
              ? 'ติดตามรายได้และค่าใช้จ่ายของคุณ'
              : 'Track your income and expenses'}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <motion.button
              key={period.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                selectedPeriod === period.value
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {period.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label={language === 'th' ? 'รายได้รวม' : 'Total Income'}
          value={`$${stats.totalIncome.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label={language === 'th' ? 'ค่าใช้จ่าย' : 'Expenses'}
          value={`$${stats.totalExpenses.toLocaleString()}`}
          icon={<TrendingDown className="w-5 h-5" />}
          color="rose"
        />
        <StatCard
          label={language === 'th' ? 'กำไรสุทธิ' : 'Net Profit'}
          value={`$${stats.totalProfit.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="cyan"
          trend={stats.trend as 'up' | 'down' | undefined}
          trendValue={`${stats.trendPercentage > 0 ? '+' : ''}${stats.trendPercentage.toFixed(1)}%`}
        />
        <StatCard
          label={language === 'th' ? 'กำไรเฉลี่ย' : 'Avg. Profit'}
          value={`$${stats.avgProfit.toLocaleString()}`}
          icon={<Calendar className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex items-center gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-400" />
              <span className="text-sm font-medium text-slate-300">
                {language === 'th' ? 'รายได้' : 'Income'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-red-400" />
              <span className="text-sm font-medium text-slate-300">
                {language === 'th' ? 'ค่าใช้จ่าย' : 'Expenses'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" />
              <span className="text-sm font-medium text-slate-300">
                {language === 'th' ? 'กำไร' : 'Profit'}
              </span>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative h-80">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500 text-right pr-2">
              <span>${(maxValue / 1000).toFixed(0)}k</span>
              <span>${(maxValue * 0.75 / 1000).toFixed(0)}k</span>
              <span>${(maxValue * 0.5 / 1000).toFixed(0)}k</span>
              <span>${(maxValue * 0.25 / 1000).toFixed(0)}k</span>
              <span>$0</span>
            </div>

            {/* Grid lines */}
            <div className="absolute left-16 right-0 top-0 bottom-0">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute left-0 right-0 border-t border-slate-800"
                  style={{ top: `${100 - percent}%` }}
                />
              ))}
            </div>

            {/* Bars */}
            <div className="absolute left-16 right-0 top-0 bottom-8 flex items-end justify-around gap-2">
              {data.map((item, index) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center gap-1 h-full">
                    {/* Income Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.income / maxValue) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className="flex-1 bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-lg relative group cursor-pointer"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-xs font-bold text-emerald-400 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        ${item.income.toLocaleString()}
                      </div>
                    </motion.div>

                    {/* Expenses Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.expenses / maxValue) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.1, duration: 0.8, ease: 'easeOut' }}
                      className="flex-1 bg-gradient-to-t from-rose-500 to-red-400 rounded-t-lg relative group cursor-pointer"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-xs font-bold text-rose-400 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        ${item.expenses.toLocaleString()}
                      </div>
                    </motion.div>

                    {/* Profit Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.profit / maxValue) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: 'easeOut' }}
                      className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t-lg relative group cursor-pointer"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 rounded text-xs font-bold text-cyan-400 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        ${item.profit.toLocaleString()}
                      </div>
                    </motion.div>
                  </div>

                  {/* X-axis label */}
                  <span className="text-xs font-medium text-slate-400">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'emerald' | 'rose' | 'cyan' | 'amber';
  trend?: 'up' | 'down';
  trendValue?: string;
}

function StatCard({ label, value, icon, color, trend, trendValue }: StatCardProps) {
  const colors = {
    emerald: {
      bg: 'from-emerald-500/20 to-green-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: 'bg-emerald-500/20',
    },
    rose: {
      bg: 'from-rose-500/20 to-red-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      icon: 'bg-rose-500/20',
    },
    cyan: {
      bg: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      icon: 'bg-cyan-500/20',
    },
    amber: {
      bg: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: 'bg-amber-500/20',
    },
  };

  const config = colors[color];

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`glass-card bg-gradient-to-br ${config.bg} border ${config.border} relative overflow-hidden group`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${config.icon} ${config.text}`}>{icon}</div>
          {trend && trendValue && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                trend === 'up'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-xs font-bold">{trendValue}</span>
            </motion.div>
          )}
        </div>

        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-2xl font-black text-white mb-1"
        >
          {value}
        </motion.p>

        <p className="text-sm font-medium text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
}
