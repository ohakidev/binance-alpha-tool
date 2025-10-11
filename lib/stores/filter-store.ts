/**
 * Filter Store - Zustand
 * Manages filter states for airdrops and stability dashboards
 */

import { create } from 'zustand';
import { AirdropFilters, StabilityFilters } from '@/lib/types';

interface FilterStore {
  airdropFilters: AirdropFilters;
  stabilityFilters: StabilityFilters;

  // Airdrop filter actions
  setAirdropFilters: (filters: Partial<AirdropFilters>) => void;
  clearAirdropFilters: () => void;

  // Stability filter actions
  setStabilityFilters: (filters: Partial<StabilityFilters>) => void;
  clearStabilityFilters: () => void;

  // Helper to get active filter count
  getAirdropFilterCount: () => number;
  getStabilityFilterCount: () => number;
}

const defaultAirdropFilters: AirdropFilters = {
  chain: 'all',
  status: 'all',
  sortBy: 'time',
  search: '',
};

const defaultStabilityFilters: StabilityFilters = {
  riskLevel: 'all',
  sortBy: 'stability',
  search: '',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  airdropFilters: defaultAirdropFilters,
  stabilityFilters: defaultStabilityFilters,

  setAirdropFilters: (filters) => {
    set((state) => ({
      airdropFilters: { ...state.airdropFilters, ...filters },
    }));
  },

  clearAirdropFilters: () => {
    set({ airdropFilters: defaultAirdropFilters });
  },

  setStabilityFilters: (filters) => {
    set((state) => ({
      stabilityFilters: { ...state.stabilityFilters, ...filters },
    }));
  },

  clearStabilityFilters: () => {
    set({ stabilityFilters: defaultStabilityFilters });
  },

  getAirdropFilterCount: () => {
    const filters = get().airdropFilters;
    let count = 0;
    if (filters.chain !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.search !== '') count++;
    return count;
  },

  getStabilityFilterCount: () => {
    const filters = get().stabilityFilters;
    let count = 0;
    if (filters.riskLevel !== 'all') count++;
    if (filters.search !== '') count++;
    return count;
  },
}));
