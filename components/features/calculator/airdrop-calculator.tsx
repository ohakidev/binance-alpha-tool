"use client";

import { motion } from "framer-motion";
import { useCalculatorStore } from "@/lib/stores/calculator-store";
import {
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState } from "react";

export function AirdropCalculator() {
  const {
    accountBalance,
    dailyTransaction,
    targetPoints,
    estimatedValue,
    dailyCost,
    dailyEarnedPoints,
    weeklyPoints,
    profitMargin,
    netProfit,
    netProfit30Days,
    canGetTimes,
    targetScore,
    updateSettings,
    calculateResults,
  } = useCalculatorStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    calculateResults();
  }, [calculateResults]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Airdrop Calculator
          </h2>
          <p className="text-sm text-gray-400">
            Calculate your airdrop profitability
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基础参数设置 (Basic Settings) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-6"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-orange-400">
              基础参数设置
            </h3>
          </div>

          {/* 账户余额 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">账户余额 (USDT)</label>
              <span className="text-xs text-gray-500">余额积分：2 分/天</span>
            </div>
            <div className="space-y-2">
              <input
                type="number"
                value={accountBalance}
                onChange={(e) =>
                  updateSettings({ accountBalance: Number(e.target.value) })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50 transition-all"
              />
              <input
                type="range"
                min="100"
                max="1000000"
                step="100"
                value={accountBalance}
                onChange={(e) =>
                  updateSettings({ accountBalance: Number(e.target.value) })
                }
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-orange"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>$100</span>
                <span>$1K</span>
                <span>$10K</span>
                <span>$100K</span>
                <span>$1M</span>
              </div>
            </div>
          </div>

          {/* 每日交易量 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">每日交易量 (USDT)</label>
            </div>
            <div className="relative">
              <input
                type="number"
                value={dailyTransaction}
                onChange={(e) =>
                  updateSettings({ dailyTransaction: Number(e.target.value) })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-24 text-white focus:outline-none focus:border-orange-500/50 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dailyTransaction >= 8192}
                  readOnly
                  className="w-4 h-4"
                />
                <span className="text-xs text-gray-400">BSC钱交易</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="262144"
              step="1000"
              value={dailyTransaction}
              onChange={(e) =>
                updateSettings({ dailyTransaction: Number(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-orange"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$8.192K</span>
              <span>$16.384K</span>
              <span>$32.768K</span>
              <span>$65.536K</span>
              <span>$131.072K</span>
              <span>$262.144K</span>
            </div>
            {dailyTransaction >= 8192 && (
              <div className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                卖出钱交易量：$32,768 | 交易量积分：15 分/天
              </div>
            )}
          </div>
        </motion.div>

        {/* 空投参数设置 (Airdrop Settings) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 space-y-6"
        >
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-cyan-400">
              空投参数设置
            </h3>
          </div>

          {/* 空投积分门槛 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-300">空投积分门槛</label>
            <input
              type="number"
              value={targetPoints}
              onChange={(e) =>
                updateSettings({ targetPoints: Number(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            />
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={targetPoints}
              onChange={(e) =>
                updateSettings({ targetPoints: Number(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-cyan"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>50分</span>
              <span>150分</span>
              <span>250分</span>
              <span>350分</span>
              <span>500分</span>
            </div>
          </div>

          {/* 单次空投价值 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-300">单次空投价值 (USDT)</label>
            <input
              type="number"
              value={estimatedValue}
              onChange={(e) =>
                updateSettings({ estimatedValue: Number(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            />
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={estimatedValue}
              onChange={(e) =>
                updateSettings({ estimatedValue: Number(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-cyan"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$10</span>
              <span>$50</span>
              <span>$100</span>
              <span>$200</span>
              <span>$500</span>
            </div>
          </div>

          {/* 每日费用成本 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-300">每日费用成本 (USDT)</label>
            <input
              type="number"
              value={dailyCost}
              onChange={(e) =>
                updateSettings({ dailyCost: Number(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            />
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={dailyCost}
              onChange={(e) =>
                updateSettings({ dailyCost: Number(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-cyan"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>$5</span>
              <span>$15</span>
              <span>$30</span>
              <span>$50</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 积分计算 (Points Calculation) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-white/10 mb-6">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-purple-400">积分计算</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="text-xs text-gray-400 mb-1">每日代币积分</div>
            <div className="text-2xl font-bold text-blue-400">
              {dailyEarnedPoints} 分
            </div>
            <div className="text-xs text-gray-500 mt-1">
              余额 + 交易量积分 15
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="text-xs text-gray-400 mb-1">近7天期限积分</div>
            <div className="text-2xl font-bold text-green-400">
              {weeklyPoints} 分
            </div>
            <div className="text-xs text-gray-500 mt-1">17 × 15天</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/20">
            <div className="text-xs text-gray-400 mb-1">可领取空投次数</div>
            <div className="text-2xl font-bold text-orange-400">
              {canGetTimes} 次
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-500/20">
            <div className="text-xs text-gray-400 mb-1">割裂积分</div>
            <div className="text-2xl font-bold text-red-400">
              {targetScore} 分
            </div>
            <div className="text-xs text-gray-500 mt-1">
              计算领取, 每次这样会验证等于2.0倍分割率内可领次
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <div className="text-sm text-gray-300 mb-2">空投领取分析</div>
          <div className="text-xs text-gray-400">
            计算类型: 每次这样会验证等于2.0倍分割率内可领次. 因入国后均可/倍分
          </div>
        </div>
      </motion.div>

      {/* 收益计算 (Profit Calculation) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-white/10 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-emerald-400">收益计算</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm text-gray-400">
                  项目
                </th>
                <th className="text-right py-3 px-4 text-sm text-gray-400">
                  近7天期限
                </th>
                <th className="text-right py-3 px-4 text-sm text-gray-400">
                  近30天度
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 text-sm text-gray-300">空投收入</td>
                <td className="text-right py-3 px-4">
                  <span className="text-green-400 font-semibold">
                    +${canGetTimes * estimatedValue}
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className="text-green-400 font-semibold">
                    +${Math.round(canGetTimes * 4.3 * estimatedValue)}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-4 text-sm text-gray-300">票据成本</td>
                <td className="text-right py-3 px-4">
                  <span className="text-red-400">-${dailyCost * 7}</span>
                </td>
                <td className="text-right py-3 px-4">
                  <span className="text-red-400">-${dailyCost * 30}</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-sm font-semibold text-gray-200">
                  净收益
                </td>
                <td className="text-right py-3 px-4">
                  <span
                    className={`text-lg font-bold ${
                      netProfit > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    ${netProfit}
                  </span>
                </td>
                <td className="text-right py-3 px-4">
                  <span
                    className={`text-lg font-bold ${
                      netProfit30Days > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    ${netProfit30Days}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
            profitMargin > 0
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          {profitMargin > 0 ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-sm font-semibold text-green-400">
                  盈利模型
                </div>
                <div className="text-xs text-gray-400">
                  当前参数为盈利模型。月度率格: 建议执行试验策略。
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-sm font-semibold text-red-400">
                  亏损预警
                </div>
                <div className="text-xs text-gray-400">
                  当前参数可能导致亏损。建议调整参数后再试。
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
