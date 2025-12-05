/**
 * Alpha Constants
 * Centralized constants for chain mappings, type mappings, and status determination
 * This eliminates code duplication across multiple files
 */

import { AirdropType, AirdropStatus } from "@prisma/client";

// ============= Chain Mappings =============

/**
 * Chain ID to Name mapping
 */
export const CHAIN_ID_MAP: Record<string, string> = {
  "1": "Ethereum",
  "56": "BSC",
  "137": "Polygon",
  "42161": "Arbitrum",
  "10": "Optimism",
  "43114": "Avalanche",
  "250": "Fantom",
  "8453": "Base",
  "324": "zkSync",
  "534352": "Scroll",
  "59144": "Linea",
};

/**
 * Chain name aliases mapping
 */
export const CHAIN_NAME_ALIASES: Record<string, string> = {
  bsc: "BSC",
  bnb: "BSC",
  binance: "BSC",
  eth: "Ethereum",
  ethereum: "Ethereum",
  polygon: "Polygon",
  matic: "Polygon",
  arbitrum: "Arbitrum",
  arb: "Arbitrum",
  optimism: "Optimism",
  op: "Optimism",
  avalanche: "Avalanche",
  avax: "Avalanche",
  solana: "Solana",
  sol: "Solana",
  sui: "SUI",
  base: "Base",
  zksync: "zkSync",
  scroll: "Scroll",
  linea: "Linea",
};

// ============= Type Mappings =============

/**
 * Type string to AirdropType enum mapping
 */
export const AIRDROP_TYPE_MAP: Record<string, AirdropType> = {
  tge: "TGE",
  pretge: "PRETGE",
  "pre-tge": "PRETGE",
  grab: "AIRDROP",
  airdrop: "AIRDROP",
};

// ============= Helper Functions =============

/**
 * Normalize chain name from ID or name string
 * @param chainId - Chain ID or name
 * @param chainName - Optional chain name
 * @returns Normalized chain name
 */
export function normalizeChainName(
  chainId?: string,
  chainName?: string,
): string {
  // Try chain ID first (more reliable)
  if (chainId && CHAIN_ID_MAP[chainId]) {
    return CHAIN_ID_MAP[chainId];
  }

  // Try chain name
  if (chainName) {
    const normalized = chainName.toLowerCase();

    // Check aliases
    if (CHAIN_NAME_ALIASES[normalized]) {
      return CHAIN_NAME_ALIASES[normalized];
    }

    // Check if chain name contains known keywords
    for (const [alias, name] of Object.entries(CHAIN_NAME_ALIASES)) {
      if (normalized.includes(alias)) {
        return name;
      }
    }

    // Return original chain name if no match
    return chainName;
  }

  // Default to BSC
  return "BSC";
}

/**
 * Map type string to AirdropType enum
 * @param type - Type string from API
 * @returns AirdropType enum value
 */
export function mapAirdropType(type?: string): AirdropType {
  if (!type) return "AIRDROP";
  const normalized = type.toLowerCase();
  return AIRDROP_TYPE_MAP[normalized] || "AIRDROP";
}

/**
 * Determine airdrop status based on dates
 * @param claimDate - Claim/listing date
 * @param options - Additional options for status determination
 * @returns AirdropStatus enum value
 */
export function determineAirdropStatus(
  claimDate: Date | null,
  options?: {
    isOffline?: boolean;
    onlineAirdrop?: boolean;
  },
): AirdropStatus {
  const { isOffline = false, onlineAirdrop = false } = options || {};

  // Offline tokens are ended
  if (isOffline) {
    return "ENDED";
  }

  if (!claimDate) {
    return onlineAirdrop ? "CLAIMABLE" : "UPCOMING";
  }

  const now = new Date();
  const diffMs = claimDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -7) {
    return "ENDED";
  } else if (diffDays < 0) {
    return "CLAIMABLE";
  } else if (diffDays <= 7) {
    return onlineAirdrop ? "CLAIMABLE" : "SNAPSHOT";
  }

  return "UPCOMING";
}

/**
 * Parse date and time strings to Date object
 * @param date - Date string
 * @param time - Optional time string
 * @returns Date object or null
 */
export function parseDateTime(date?: string, time?: string): Date | null {
  if (!date) return null;

  try {
    let dateStr = date;
    if (time) {
      dateStr += ` ${time}`;
    }

    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  } catch {
    console.error("Failed to parse date:", date, time);
    return null;
  }
}

// ============= Default Headers =============

/**
 * Default headers for API requests
 */
export const DEFAULT_API_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

// ============= API URLs =============

/**
 * Default API URLs
 */
export const API_URLS = {
  BINANCE_ALPHA:
    process.env.BINANCE_ALPHA_API_URL ||
    "https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list",
  ALPHA123: process.env.ALPHA123_API_URL || "https://alpha123.uk",
} as const;

// ============= Default Timeouts =============

export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds
