/**
 * TypeScript Type Definitions
 * Centralized types for the Binance Alpha Tool
 *
 * This module consolidates all type exports for easy importing throughout the application.
 * Types are organized by domain and re-exported from their respective modules.
 */

// ============= Re-export Alpha Types =============

export { AlphaDataSourceType } from "./alpha.types";

export type {
  // Enums & Constants
  ScheduleStatus,
  ChainId,
  ChainName,
  PointMultiplier,

  // Raw API Types
  BinanceAlphaTokenRaw,
  Alpha123ProjectRaw,
  BinanceAlphaApiResponse,
  BinanceAnnouncementRaw,

  // Processed Types
  AlphaToken,
  AlphaProject,
  AlphaServiceResponse,
  AlphaSyncResult,
  AlphaStats,
  AlphaPrismaData,

  // Cache Types
  CacheEntry,
  CacheConfig,

  // Interface Types
  IAlphaDataSource,
  IAlphaService,

  // Filter & Options Types
  AlphaFilterOptions,
  ScheduleFilterOptions,

  // Event Types
  AlphaEventType,
  AlphaEvent,
  AlphaEventHandler,

  // Schedule Types
  AirdropScheduleData,
  TodayAirdrop,
  UpcomingAirdrop,
  ScheduleServiceResponse,
  ScheduleSyncResult,
  ParsedAirdropAnnouncement,
} from "./alpha.types";

// ============= UI & App Types =============

/**
 * Airdrop display type for UI components
 */
export interface Airdrop {
  id: string;
  projectName: string;
  logo: string;
  chain: "BSC" | "ETH" | "Polygon" | "Solana";
  requiredPoints: number;
  userPoints?: number;
  airdropAmount: string;
  dropTime: Date;
  status: "upcoming" | "live" | "ended";
  description?: string;
  website?: string;
  twitter?: string;
}

export interface AirdropFilters {
  chain: "all" | "BSC" | "ETH" | "Polygon" | "Solana";
  status: "all" | "upcoming" | "live" | "ended";
  sortBy: "time" | "amount" | "points";
  search: string;
}

// ============= Stability Types =============

export interface StabilityData {
  symbol: string;
  name: string;
  logo?: string;
  price: number;
  change24h: number;
  volume: number;
  stabilityScore: number; // 0-100
  riskLevel: "safe" | "moderate" | "high";
  volatilityIndex: number;
  lastUpdate: Date;
  marketCap?: number;
  holders?: number;
  liquidity?: number;
}

export interface StabilityFilters {
  riskLevel: "all" | "safe" | "moderate" | "high";
  sortBy: "stability" | "volume" | "change";
  search: string;
}

// ============= Income Calendar Types =============

export interface IncomeEntry {
  id: string;
  userId: string;
  date: Date;
  projectName: string;
  amount: number;
  category: "airdrop" | "trading" | "staking" | "other";
  notes?: string;
  proofUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeStats {
  totalIncome: number;
  totalProjects: number;
  totalProfit: number;
  totalEntries: number;
  monthIncome: number;
  monthProjects: number;
  monthProfit: number;
  monthEntries: number;
}

// ============= User Types =============

export interface User {
  id: string;
  username: string;
  avatar?: string;
  color?: string;
  totalEarnings: number;
  entryCount: number;
  balance: number;
  createdAt: Date;
  lastActive: Date;
}

// ============= BNB Calculator Types =============

export interface BNBCalculation {
  targetBNB: number;
  raisedBNB: number;
  oversubscription: number;
  inputBNB: number;
  getCoin: number;
  costBNB: number;
  valueUSD: number;
}

export interface CalculationHistory {
  id: string;
  calculation: BNBCalculation;
  timestamp: Date;
}

// ============= Settings Types =============

export interface NotificationSettings {
  enabled: boolean;
  airdropAlerts: boolean;
  airdropLeadTime: 5 | 10 | 20; // minutes
  stabilityAlerts: boolean;
  stabilityThreshold: number;
  soundEffects: boolean;
  volume: number;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface APISettings {
  binanceApiKey?: string;
  binanceSecretKey?: string;
  testConnection: boolean;
}

export interface AppSettings {
  theme: "dark" | "light" | "auto";
  accentColor: "gold" | "cyan" | "purple" | "green";
  animationSpeed: "fast" | "normal" | "slow" | "none";
  fontSize: "small" | "medium" | "large";
  language: "en" | "th";
  refreshInterval: 10 | 15 | 30 | 60; // seconds
  dataRetention: number; // days
}

export interface UserSettings {
  notifications: NotificationSettings;
  api: APISettings;
  app: AppSettings;
}

// ============= Backup Types =============

export interface BackupData {
  version: string;
  timestamp: Date;
  users: User[];
  incomeEntries: IncomeEntry[];
  settings: UserSettings;
  favorites?: string[];
}

export interface BackupMetadata {
  filename: string;
  size: number;
  timestamp: Date;
  entryCount: number;
  userCount: number;
}

// ============= Toast Types =============

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info" | "airdrop";
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============= Chart Types =============

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface PriceHistory {
  symbol: string;
  timeframe: "1h" | "4h" | "24h" | "7d";
  data: ChartDataPoint[];
}

// ============= Utility Types =============

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Extract non-nullable type
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Async function return type
 */
export type AsyncReturnType<
  T extends (...args: unknown[]) => Promise<unknown>,
> = T extends (...args: unknown[]) => Promise<infer R> ? R : never;
