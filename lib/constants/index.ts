/**
 * Constants Module
 * Centralized exports for all constants
 */

export {
  // Chain Mappings
  CHAIN_ID_MAP,
  CHAIN_NAME_ALIASES,

  // Type Mappings
  AIRDROP_TYPE_MAP,

  // Helper Functions
  normalizeChainName,
  mapAirdropType,
  determineAirdropStatus,
  parseDateTime,

  // API Configuration
  DEFAULT_API_HEADERS,
  API_URLS,
  DEFAULT_TIMEOUT,
  HEALTH_CHECK_TIMEOUT,
} from "./alpha.constants";
