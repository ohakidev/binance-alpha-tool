/**
 * Alpha Service Module
 * Centralized exports for Alpha-related services
 */

// Main Service
export { AlphaService, alphaService } from "./AlphaService";

// Airdrop Schedule Service
export {
  AirdropScheduleService,
  airdropScheduleService,
} from "./AirdropScheduleService";

// Data Sources
export { BinanceAlphaSource, binanceAlphaSource } from "./BinanceAlphaSource";
export { Alpha123Source, alpha123Source } from "./Alpha123Source";

// Re-export types for convenience
export type {
  AlphaToken,
  AlphaProject,
  AlphaServiceResponse,
  AlphaSyncResult,
  AlphaStats,
  AlphaFilterOptions,
  AlphaPrismaData,
  IAlphaService,
  IAlphaDataSource,
  AlphaEvent,
  AlphaEventHandler,
  AlphaEventType,
  // Schedule types
  AirdropScheduleData,
  TodayAirdrop,
  UpcomingAirdrop,
  ScheduleServiceResponse,
  ScheduleSyncResult,
  ScheduleFilterOptions,
} from "@/lib/types/alpha.types";

export { AlphaDataSourceType } from "@/lib/types/alpha.types";
