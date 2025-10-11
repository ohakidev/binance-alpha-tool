/**
 * Income Store - Zustand
 * Manages income entries and calculations
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IncomeEntry, IncomeStats } from "@/lib/types";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface IncomeStore {
  entries: IncomeEntry[];

  // Actions
  addEntry: (
    entry: Omit<IncomeEntry, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateEntry: (id: string, data: Partial<IncomeEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntriesByUser: (userId: string) => IncomeEntry[];
  getEntriesByUserAndMonth: (userId: string, date: Date) => IncomeEntry[];
  getEntriesByDate: (userId: string, date: Date) => IncomeEntry[];
  getStats: (userId: string) => IncomeStats;
  getMonthStats: (userId: string, date: Date) => IncomeStats;
  restoreEntries: (entries: IncomeEntry[]) => void;
}

export const useIncomeStore = create<IncomeStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const newEntry: IncomeEntry = {
          ...entryData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
      },

      updateEntry: (id, data) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, ...data, updatedAt: new Date() }
              : entry
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      getEntriesByUser: (userId) => {
        return get().entries.filter((entry) => entry.userId === userId);
      },

      getEntriesByUserAndMonth: (userId, date) => {
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        return get().entries.filter(
          (entry) =>
            entry.userId === userId &&
            isWithinInterval(new Date(entry.date), { start, end })
        );
      },

      getEntriesByDate: (userId, date) => {
        const targetDate = new Date(date).toDateString();
        return get().entries.filter(
          (entry) =>
            entry.userId === userId &&
            new Date(entry.date).toDateString() === targetDate
        );
      },

      getStats: (userId) => {
        const userEntries = get().entries.filter((e) => e.userId === userId);
        const totalIncome = userEntries.reduce((sum, e) => sum + e.amount, 0);
        const uniqueProjects = new Set(userEntries.map((e) => e.projectName))
          .size;

        return {
          totalIncome,
          totalProjects: uniqueProjects,
          totalProfit: totalIncome, // In real app, calculate against costs
          totalEntries: userEntries.length,
          monthIncome: 0,
          monthProjects: 0,
          monthProfit: 0,
          monthEntries: 0,
        };
      },

      getMonthStats: (userId, date) => {
        const monthEntries = get().getEntriesByUserAndMonth(userId, date);
        const monthIncome = monthEntries.reduce((sum, e) => sum + e.amount, 0);
        const uniqueProjects = new Set(monthEntries.map((e) => e.projectName))
          .size;

        return {
          totalIncome: 0,
          totalProjects: 0,
          totalProfit: 0,
          totalEntries: 0,
          monthIncome,
          monthProjects: uniqueProjects,
          monthProfit: monthIncome,
          monthEntries: monthEntries.length,
        };
      },

      restoreEntries: (entries) => {
        set({ entries });
      },
    }),
    {
      name: "binance-alpha-income",
    }
  )
);
