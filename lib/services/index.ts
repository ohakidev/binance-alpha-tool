/**
 * Services Module
 * Centralized exports for all services
 */

// Alpha Service - Main data fetching service
export {
  AlphaService,
  alphaService,
  BinanceAlphaSource,
  binanceAlphaSource,
  Alpha123Source,
  alpha123Source,
  AlphaDataSourceType,
} from "./alpha";

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
} from "./alpha";

// Telegram Service - Notification service
export { TelegramService, telegramService } from "./telegram";

export type {
  Language,
  MessageType,
  AirdropAlertData,
  SnapshotAlertData,
  ClaimableAlertData,
  AirdropReminderData,
  StabilityWarningData,
  TelegramConfig,
} from "./telegram";

// Airdrop Calculator Service
export { AirdropCalculator, airdropCalculator } from "./airdrop-calculator";

// Cache Service
export {
  CacheService,
  CacheKeys,
  createAlphaCache,
  createShortLivedCache,
  createLongLivedCache,
} from "./cache/CacheService";

// WebSocket Service - Real-time stability monitoring
export {
  StabilityWebSocket,
  getStabilityWebSocket,
  resetStabilityWebSocket,
} from "./websocket";

export type {
  StabilityLevel,
  TradeData,
  PriceBuffer,
  TokenStabilityData,
  StabilityConfig,
  WebSocketMessage,
  StabilityUpdateCallback,
  ConnectionStatusCallback,
} from "./websocket";
