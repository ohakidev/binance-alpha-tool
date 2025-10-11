import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CalculatorSettings {
  // Basic Settings
  accountBalance: number; // Account Balance (USDT)
  dailyTransaction: number; // Daily Transaction Volume (USDT)

  // Airdrop Settings
  targetPoints: number; // Target Airdrop Points
  estimatedValue: number; // Single Airdrop Value (USDT)
  dailyCost: number; // Daily Cost (USDT)

  // Calculation Results
  dailyEarnedPoints: number; // Daily Earned Points
  weeklyPoints: number; // 15-Day Points Total
  profitMargin: number; // Profit Margin (%)
  netProfit: number; // Net Profit (7 days)
  netProfit30Days: number; // Net Profit (30 days)
  canGetTimes: number; // Airdrop Claim Times
  targetScore: number; // Points Split Score

  // Methods
  updateSettings: (
    settings: Partial<
      Omit<CalculatorSettings, "updateSettings" | "calculateResults">
    >
  ) => void;
  calculateResults: () => void;
}

export const useCalculatorStore = create<CalculatorSettings>()(
  persist(
    (set, get) => ({
      // Default values
      accountBalance: 1000,
      dailyTransaction: 8192,
      targetPoints: 220,
      estimatedValue: 40,
      dailyCost: 2,

      // Results
      dailyEarnedPoints: 17,
      weeklyPoints: 255,
      profitMargin: 2.0,
      netProfit: 90,
      netProfit30Days: 180,
      canGetTimes: 3,
      targetScore: 2.0,

      updateSettings: (settings) => {
        set(settings);
        get().calculateResults();
      },

      calculateResults: () => {
        const state = get();

        // Calculation Formula (Based on image logic)
        // Daily Points = (Daily Transaction / Account Balance) * Base Multiplier
        const dailyEarnedPoints = Math.floor(
          (state.dailyTransaction / state.accountBalance) * 2
        );

        // 15-Day Points Total
        const weeklyPoints = dailyEarnedPoints * 15; // 15 days accumulation

        // Claim Times = 15-Day Points / Target Points
        const canGetTimes = Math.floor(weeklyPoints / state.targetPoints);

        // Airdrop Income (7 days)
        const airdropIncome7Days = canGetTimes * state.estimatedValue;

        // Cost (7 days)
        const cost7Days = state.dailyCost * 7;

        // Net Profit (7 days)
        const netProfit = airdropIncome7Days - cost7Days;

        // Net Profit (30 days)
        const netProfit30Days =
          canGetTimes * 4.3 * state.estimatedValue - state.dailyCost * 30;

        // Profit Margin
        const profitMargin =
          netProfit > 0 ? (netProfit / airdropIncome7Days) * 100 : 0;

        // Points Split Score (calculate points gap for each airdrop)
        const targetScore =
          state.targetPoints > 0 ? weeklyPoints / state.targetPoints : 0;

        set({
          dailyEarnedPoints,
          weeklyPoints,
          canGetTimes,
          netProfit: Math.round(netProfit),
          netProfit30Days: Math.round(netProfit30Days),
          profitMargin: Number(profitMargin.toFixed(1)),
          targetScore: Number(targetScore.toFixed(1)),
        });
      },
    }),
    {
      name: "airdrop-calculator-storage",
    }
  )
);
