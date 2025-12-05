/**
 * Alpha Service Type Definitions
 * Comprehensive types for Binance Alpha data handling
 */

import { AirdropType, AirdropStatus } from "@prisma/client";

// Schedule status type (matches Prisma enum)
export type ScheduleStatus =
  | "UPCOMING"
  | "TODAY"
  | "LIVE"
  | "ENDED"
  | "CANCELLED";

// ============= Enums =============

export enum AlphaDataSourceType {
  BINANCE_ALPHA = "binance-alpha",
  ALPHA123 = "alpha123",
  CACHE = "cache",
}

export enum ChainId {
  BSC = "56",
  ETHEREUM = "1",
  POLYGON = "137",
  ARBITRUM = "42161",
  OPTIMISM = "10",
  AVALANCHE = "43114",
  BASE = "8453",
  ZKSYNC = "324",
  SCROLL = "534352",
  LINEA = "59144",
  FANTOM = "250",
}

// ============= Base Interfaces =============

/**
 * Raw token data from Binance Alpha API
 */
export interface BinanceAlphaTokenRaw {
  tokenId: string;
  chainId: string;
  chainIconUrl: string;
  chainName: string;
  contractAddress: string;
  name: string;
  symbol: string;
  iconUrl: string;
  price: string;
  percentChange24h: string;
  volume24h: string;
  marketCap: string;
  fdv: string;
  liquidity: string;
  totalSupply: string;
  circulatingSupply: string;
  holders: string;
  decimals: number;
  listingCex: boolean;
  hotTag: boolean;
  cexCoinName: string;
  canTransfer: boolean;
  denomination: number;
  offline: boolean;
  tradeDecimal: number;
  alphaId: string;
  offsell: boolean;
  priceHigh24h: string;
  priceLow24h: string;
  count24h: string;
  onlineTge: boolean;
  onlineAirdrop: boolean;
  score: number;
  cexOffDisplay: boolean;
  stockState: boolean;
  listingTime: number;
  mulPoint: number;
  bnExclusiveState: boolean;
}

/**
 * Raw project data from Alpha123 API
 */
export interface Alpha123ProjectRaw {
  token: string;
  name: string;
  amount: string;
  date?: string;
  time?: string;
  chain_id?: string;
  contract_address?: string;
  points?: number;
  type?: string;
  price?: number;
  listing?: {
    spot?: boolean;
    futures?: boolean;
  };
}

/**
 * Processed Alpha token with normalized data
 */
export interface AlphaToken {
  // Identification
  id: string;
  symbol: string;
  name: string;
  alphaId: string;

  // Blockchain info
  chain: string;
  chainId: string;
  contractAddress: string;

  // Market data
  price: number;
  priceChange24h: number;
  priceHigh24h: number;
  priceLow24h: number;
  volume24h: number;
  marketCap: number;
  fdv: number;
  liquidity: number;
  holders: number;

  // Alpha specific
  score: number;
  mulPoint: number;
  onlineTge: boolean;
  onlineAirdrop: boolean;
  listingTime: Date | null;
  hotTag: boolean;
  isOffline: boolean;

  // Derived fields
  type: AirdropType;
  status: AirdropStatus;
  estimatedValue: number | null;

  // Metadata
  iconUrl: string;
  lastUpdate: Date;
}

/**
 * Simplified project representation for UI/DB
 */
export interface AlphaProject {
  token: string;
  name: string;
  chain: string;
  contractAddress?: string;
  airdropAmount?: string;
  claimStartDate?: Date | null;
  claimEndDate?: Date | null;
  requiredPoints?: number;
  deductPoints?: number;
  type: AirdropType;
  status: AirdropStatus;
  estimatedValue?: number | null;
  description?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  mulPoint?: number;
  score?: number;
  iconUrl?: string;
  isActive?: boolean;
}

// ============= API Response Interfaces =============

/**
 * Binance Alpha API response wrapper
 */
export interface BinanceAlphaApiResponse {
  code: string;
  message: string | null;
  messageDetail: string | null;
  data: BinanceAlphaTokenRaw[];
}

/**
 * Standardized response from Alpha services
 */
export interface AlphaServiceResponse<T = AlphaToken[]> {
  success: boolean;
  data: T;
  source: AlphaDataSourceType;
  lastUpdate: Date;
  count: number;
  error?: string;
}

/**
 * Sync operation result
 */
export interface AlphaSyncResult {
  success: boolean;
  created: number;
  updated: number;
  unchanged: number;
  errors: number;
  source: AlphaDataSourceType;
  duration: number;
  timestamp: Date;
}

// ============= Cache Interfaces =============

/**
 * Generic cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  source: AlphaDataSourceType;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Maximum entries in cache */
  maxSize?: number;
  /** Enable stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
}

// ============= Data Source Interface =============

/**
 * Interface for Alpha data sources
 * Follows Strategy pattern for different data providers
 */
export interface IAlphaDataSource {
  /** Unique identifier for the data source */
  readonly name: AlphaDataSourceType;

  /** Priority level (lower = higher priority) */
  readonly priority: number;

  /** Whether this source is currently available */
  isAvailable(): Promise<boolean>;

  /** Fetch all tokens from the source */
  fetchTokens(): Promise<AlphaToken[]>;

  /** Fetch a single token by symbol */
  fetchToken?(symbol: string): Promise<AlphaToken | null>;
}

// ============= Service Interfaces =============

/**
 * Main Alpha service interface
 */
export interface IAlphaService {
  /** Get all tokens with optional force refresh */
  getTokens(forceRefresh?: boolean): Promise<AlphaServiceResponse>;

  /** Get tokens by status */
  getTokensByStatus(
    status: AirdropStatus,
    forceRefresh?: boolean,
  ): Promise<AlphaServiceResponse>;

  /** Get active airdrops */
  getActiveAirdrops(forceRefresh?: boolean): Promise<AlphaServiceResponse>;

  /** Get upcoming TGEs */
  getUpcomingTGE(forceRefresh?: boolean): Promise<AlphaServiceResponse>;

  /** Sync data to database */
  syncToDatabase(): Promise<AlphaSyncResult>;

  /** Get statistics */
  getStats(): Promise<AlphaStats>;

  /** Clear cache */
  clearCache(): void;
}

/**
 * Statistics about Alpha tokens
 */
export interface AlphaStats {
  total: number;
  byStatus: Record<AirdropStatus, number>;
  byType: Record<AirdropType, number>;
  byChain: Record<string, number>;
  byMultiplier: Record<string, number>;
  activeAirdrops: number;
  activeTGE: number;
  lastUpdate: Date;
}

// ============= Prisma Format =============

/**
 * Data formatted for Prisma database operations
 */
export interface AlphaPrismaData {
  token: string;
  name: string;
  chain: string;
  contractAddress?: string | null;
  airdropAmount?: string | null;
  claimStartDate?: Date | null;
  claimEndDate?: Date | null;
  requiredPoints?: number | null;
  deductPoints?: number | null;
  type: AirdropType;
  status: AirdropStatus;
  estimatedValue?: number | null;
  description?: string | null;
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  eligibility?: string;
  requirements?: string;
  verified?: boolean;
  isActive?: boolean;
  multiplier?: number;
  isBaseline?: boolean;
}

// ============= Utility Types =============

/**
 * Chain name mapping
 */
export type ChainName =
  | "BSC"
  | "Ethereum"
  | "Polygon"
  | "Arbitrum"
  | "Optimism"
  | "Avalanche"
  | "Base"
  | "zkSync"
  | "Scroll"
  | "Linea"
  | "Fantom"
  | "Solana"
  | "SUI";

/**
 * Point multiplier values
 */
export type PointMultiplier = 1 | 2 | 4;

/**
 * Filter options for querying tokens
 */
export interface AlphaFilterOptions {
  status?: AirdropStatus | AirdropStatus[];
  type?: AirdropType | AirdropType[];
  chain?: ChainName | ChainName[];
  minScore?: number;
  maxScore?: number;
  mulPoint?: PointMultiplier;
  onlineAirdrop?: boolean;
  onlineTge?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: keyof AlphaToken;
  sortOrder?: "asc" | "desc";
}

/**
 * Event types for Alpha service
 */
export type AlphaEventType =
  | "sync:start"
  | "sync:complete"
  | "sync:error"
  | "token:new"
  | "token:updated"
  | "cache:hit"
  | "cache:miss"
  | "cache:expired";

/**
 * Event payload for Alpha service events
 */
export interface AlphaEvent {
  type: AlphaEventType;
  timestamp: Date;
  data?: unknown;
}

/**
 * Event handler type
 */
export type AlphaEventHandler = (event: AlphaEvent) => void;

// ============= Airdrop Schedule Types =============

/**
 * Airdrop schedule data like alpha123.uk displays
 */
export interface AirdropScheduleData {
  id?: string;
  token: string;
  name: string;
  scheduledTime: Date;
  endTime?: Date | null;
  points?: number | null;
  deductPoints?: number | null;
  amount?: string | null;
  chain: string;
  contractAddress?: string | null;
  status: ScheduleStatus;
  type: AirdropType;
  estimatedPrice?: number | null;
  estimatedValue?: number | null;
  source: string;
  sourceUrl?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  isVerified: boolean;
  notified: boolean;
}

/**
 * Today's airdrop display format (like alpha123.uk)
 */
export interface TodayAirdrop {
  token: string;
  name: string;
  points: number | null;
  amount: string | null;
  time: string; // e.g., "05:00 PM"
  chain: string;
  contractAddress?: string | null;
  logoUrl?: string | null;
  status: "upcoming" | "live" | "ended";
  estimatedValue?: number | null;
}

/**
 * Upcoming airdrop display format
 */
export interface UpcomingAirdrop {
  token: string;
  name: string;
  points: number | null;
  amount: string | null;
  date: string; // e.g., "2024-01-15"
  time: string; // e.g., "05:00 PM"
  chain: string;
  contractAddress?: string | null;
  logoUrl?: string | null;
  daysUntil: number;
  estimatedValue?: number | null;
}

/**
 * Schedule service response
 */
export interface ScheduleServiceResponse {
  success: boolean;
  today: TodayAirdrop[];
  upcoming: UpcomingAirdrop[];
  lastUpdate: Date;
  source: string;
}

/**
 * Raw announcement data from Binance
 */
export interface BinanceAnnouncementRaw {
  id: string;
  title: string;
  code: string;
  publishDate: number;
  type: string;
  catalogId: string;
  catalogName: string;
}

/**
 * Parsed announcement with airdrop info
 */
export interface ParsedAirdropAnnouncement {
  token: string;
  name: string;
  scheduledTime: Date;
  points?: number;
  amount?: string;
  chain?: string;
  source: string;
  sourceUrl: string;
}

/**
 * Sync result for schedule data
 */
export interface ScheduleSyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: number;
  source: string;
  duration: number;
  timestamp: Date;
}

/**
 * Schedule filter options
 */
export interface ScheduleFilterOptions {
  status?: ScheduleStatus | ScheduleStatus[];
  type?: AirdropType | AirdropType[];
  chain?: string | string[];
  fromDate?: Date;
  toDate?: Date;
  token?: string;
  limit?: number;
  offset?: number;
}
