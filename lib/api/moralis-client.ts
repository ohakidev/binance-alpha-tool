/**
 * Moralis API Client
 * Handles API calls to Moralis for wallet and token data
 * Extends BaseApiClient following OOP principles
 */

import { BaseApiClient, ApiClientConfig } from "./base-client";

// ============= Types =============

export interface MoralisClientConfig extends Partial<
  Omit<ApiClientConfig, "baseUrl">
> {
  apiKey?: string;
  baseUrl?: string;
}

export interface WalletTokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
}

export interface WalletNFT {
  token_address: string;
  token_id: string;
  amount: string;
  owner_of: string;
  token_hash: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri?: string;
  metadata?: string;
  last_token_uri_sync?: string;
  last_metadata_sync?: string;
  minter_address?: string;
  possible_spam: boolean;
  verified_collection: boolean;
}

export interface TokenPrice {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  tokenDecimals: string;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  usdPrice: number;
  usdPriceFormatted: string;
  exchangeAddress?: string;
  exchangeName?: string;
}

export interface WalletTransaction {
  hash: string;
  nonce: string;
  transaction_index: string;
  from_address: string;
  to_address: string;
  value: string;
  gas: string;
  gas_price: string;
  receipt_gas_used: string;
  receipt_status: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  logo?: string;
  logo_hash?: string;
  thumbnail?: string;
  block_number?: string;
  validated?: number;
  possible_spam: boolean;
  verified_contract: boolean;
}

export interface AirdropEligibility {
  hasNFTs: boolean;
  tokenCount: number;
  transactionCount: number;
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  result: T[];
  cursor?: string;
  page?: number;
  page_size?: number;
  total?: number;
}

// ============= Constants =============

const DEFAULT_BASE_URL = "https://deep-index.moralis.io/api/v2.2";

// Supported chains for Moralis API
export const MORALIS_CHAINS = {
  ETHEREUM: "eth",
  BSC: "bsc",
  POLYGON: "polygon",
  ARBITRUM: "arbitrum",
  OPTIMISM: "optimism",
  AVALANCHE: "avalanche",
  BASE: "base",
  FANTOM: "fantom",
} as const;

export type MoralisChain = (typeof MORALIS_CHAINS)[keyof typeof MORALIS_CHAINS];

// ============= Moralis Client Class =============

/**
 * Moralis API Client
 * Provides methods to interact with Moralis Web3 APIs
 *
 * @extends BaseApiClient
 * @example
 * ```typescript
 * const client = new MoralisClient({
 *   apiKey: process.env.MORALIS_API_KEY,
 * });
 *
 * const balances = await client.getWalletTokenBalances('0x...');
 * ```
 */
export class MoralisClient extends BaseApiClient {
  constructor(config: MoralisClientConfig = {}) {
    const apiKey = config.apiKey || process.env.MORALIS_API_KEY || "";
    const baseUrl = config.baseUrl || DEFAULT_BASE_URL;

    super({
      baseUrl,
      apiKey,
      timeout: config.timeout ?? 30000,
      headers: {
        Accept: "application/json",
      },
    });

    if (!apiKey) {
      console.warn("⚠️  MORALIS_API_KEY not set");
    }
  }

  /**
   * Get client name
   */
  get name(): string {
    return "MoralisClient";
  }

  /**
   * Override mergeHeaders to use Moralis API key header format
   */
  protected override mergeHeaders(
    customHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Moralis uses X-API-Key header for authentication
    if (this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  /**
   * Health check - test connectivity to Moralis API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to get web3 version as a simple health check
      await this.get("/web3/version");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get wallet token balances (ERC20)
   */
  async getWalletTokenBalances(
    address: string,
    chain: MoralisChain = "eth",
  ): Promise<WalletTokenBalance[]> {
    const response = await this.get<WalletTokenBalance[]>(`/${address}/erc20`, {
      params: { chain },
    });
    return response;
  }

  /**
   * Get wallet NFTs
   */
  async getWalletNFTs(
    address: string,
    chain: MoralisChain = "eth",
  ): Promise<PaginatedResponse<WalletNFT>> {
    return this.get<PaginatedResponse<WalletNFT>>(`/${address}/nft`, {
      params: { chain },
    });
  }

  /**
   * Get token price
   */
  async getTokenPrice(
    tokenAddress: string,
    chain: MoralisChain = "eth",
  ): Promise<TokenPrice> {
    return this.get<TokenPrice>(`/erc20/${tokenAddress}/price`, {
      params: { chain },
    });
  }

  /**
   * Get wallet transaction history
   */
  async getWalletTransactions(
    address: string,
    chain: MoralisChain = "eth",
  ): Promise<PaginatedResponse<WalletTransaction>> {
    return this.get<PaginatedResponse<WalletTransaction>>(`/${address}`, {
      params: { chain },
    });
  }

  /**
   * Get token metadata for multiple addresses
   */
  async getTokenMetadata(
    addresses: string[],
    chain: MoralisChain = "eth",
  ): Promise<TokenMetadata[]> {
    return this.get<TokenMetadata[]>("/erc20/metadata", {
      params: {
        chain,
        addresses: addresses.join(","),
      },
    });
  }

  /**
   * Get native balance for a wallet
   */
  async getNativeBalance(
    address: string,
    chain: MoralisChain = "eth",
  ): Promise<{ balance: string }> {
    return this.get<{ balance: string }>(`/${address}/balance`, {
      params: { chain },
    });
  }

  /**
   * Get wallet net worth
   */
  async getWalletNetWorth(
    address: string,
    chains?: MoralisChain[],
  ): Promise<{
    total_networth_usd: string;
    chains: Array<{
      chain: string;
      native_balance: string;
      native_balance_usd: string;
      token_balance_usd: string;
      networth_usd: string;
    }>;
  }> {
    const params: Record<string, string> = {};
    if (chains && chains.length > 0) {
      params.chains = chains.join(",");
    }

    return this.get(`/wallets/${address}/net-worth`, { params });
  }

  /**
   * Resolve ENS domain to address
   */
  async resolveENSDomain(domain: string): Promise<{ address: string }> {
    return this.get<{ address: string }>(`/resolve/ens/${domain}`);
  }

  /**
   * Resolve address to ENS domain
   */
  async resolveAddressToENS(address: string): Promise<{ name: string } | null> {
    try {
      return await this.get<{ name: string }>(`/resolve/${address}/reverse`);
    } catch {
      return null;
    }
  }

  /**
   * Get token transfers for a wallet
   */
  async getTokenTransfers(
    address: string,
    chain: MoralisChain = "eth",
  ): Promise<
    PaginatedResponse<{
      transaction_hash: string;
      address: string;
      block_timestamp: string;
      block_number: string;
      from_address: string;
      to_address: string;
      value: string;
      token_address: string;
      token_symbol?: string;
      token_name?: string;
      token_decimals?: string;
    }>
  > {
    return this.get(`/${address}/erc20/transfers`, {
      params: { chain },
    });
  }

  /**
   * Check wallet eligibility for airdrops
   * Analyzes wallet activity to determine potential eligibility
   */
  async checkAirdropEligibility(address: string): Promise<AirdropEligibility> {
    try {
      const [nfts, tokens, transactions] = await Promise.all([
        this.getWalletNFTs(address),
        this.getWalletTokenBalances(address),
        this.getWalletTransactions(address),
      ]);

      return {
        hasNFTs: (nfts.result?.length ?? 0) > 0,
        tokenCount: tokens?.length ?? 0,
        transactionCount: transactions.result?.length ?? 0,
        isActive: (transactions.result?.length ?? 0) > 10,
      };
    } catch (error) {
      console.error("Error checking airdrop eligibility:", error);
      return {
        hasNFTs: false,
        tokenCount: 0,
        transactionCount: 0,
        isActive: false,
      };
    }
  }

  /**
   * Get detailed wallet stats
   */
  async getWalletStats(
    address: string,
    chain: MoralisChain = "eth",
  ): Promise<{
    nfts: number;
    collections: number;
    transactions: {
      total: number;
    };
    nft_transfers: {
      total: number;
    };
    token_transfers: {
      total: number;
    };
  }> {
    return this.get(`/wallets/${address}/stats`, {
      params: { chain },
    });
  }
}

// ============= Helper Functions =============

/**
 * Format wei to ether
 */
export function weiToEther(wei: string, decimals: number = 18): number {
  const value = BigInt(wei);
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;

  // Convert to number with precision
  return Number(integerPart) + Number(fractionalPart) / Number(divisor);
}

/**
 * Format token balance with decimals
 */
export function formatTokenBalance(balance: string, decimals: number): string {
  const value = weiToEther(balance, decimals);
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidEthereumAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chain: MoralisChain): string {
  const chainNames: Record<MoralisChain, string> = {
    eth: "Ethereum",
    bsc: "BNB Smart Chain",
    polygon: "Polygon",
    arbitrum: "Arbitrum",
    optimism: "Optimism",
    avalanche: "Avalanche",
    base: "Base",
    fantom: "Fantom",
  };

  return chainNames[chain] || chain;
}

// ============= Singleton Export =============

export const moralisClient = new MoralisClient();
