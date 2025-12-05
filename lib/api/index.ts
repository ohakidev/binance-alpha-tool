/**
 * API Module
 * Centralized exports for all API clients
 *
 * This module provides a unified interface for all external API integrations.
 * All API clients extend the BaseApiClient abstract class, ensuring consistent
 * error handling, request patterns, and configuration.
 */

import { BaseApiClient } from "./base-client";
import { BinanceClient } from "./binance-client";
import { MoralisClient } from "./moralis-client";

// ============= Base Client =============

export { BaseApiClient, createApiError, isApiError } from "./base-client";

export type {
  ApiClientConfig,
  RequestOptions,
  ApiResponse,
  ApiError,
} from "./base-client";

// ============= Binance Client =============

export {
  BinanceClient,
  binanceClient,
  formatTickerData,
  isStablecoinPair,
  parseSymbol,
  POPULAR_PAIRS,
} from "./binance-client";

export type {
  BinanceClientConfig,
  BinanceTickerResponse,
  FormattedTickerData,
  BinanceKlineData,
  BinanceAccountInfo,
} from "./binance-client";

// ============= Moralis Client =============

export {
  MoralisClient,
  moralisClient,
  weiToEther,
  formatTokenBalance,
  isValidEthereumAddress,
  shortenAddress,
  getChainName,
  MORALIS_CHAINS,
} from "./moralis-client";

export type {
  MoralisClientConfig,
  MoralisChain,
  WalletTokenBalance,
  WalletNFT,
  TokenPrice,
  WalletTransaction,
  TokenMetadata,
  AirdropEligibility,
  PaginatedResponse,
} from "./moralis-client";

// ============= Factory Functions =============

/**
 * Create a new Binance client with custom configuration
 */
export function createBinanceClient(config?: {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
}): BinanceClient {
  return new BinanceClient(config);
}

/**
 * Create a new Moralis client with custom configuration
 */
export function createMoralisClient(config?: {
  apiKey?: string;
  baseUrl?: string;
}): MoralisClient {
  return new MoralisClient(config);
}

// ============= Type Guards =============

/**
 * Check if client is a Binance client
 */
export function isBinanceClient(
  client: BaseApiClient,
): client is BinanceClient {
  return client.name === "BinanceClient";
}

/**
 * Check if client is a Moralis client
 */
export function isMoralisClient(
  client: BaseApiClient,
): client is MoralisClient {
  return client.name === "MoralisClient";
}
