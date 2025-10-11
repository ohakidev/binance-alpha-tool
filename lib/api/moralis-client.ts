import Moralis from "moralis";

let isInitialized = false;

export async function initMoralis() {
  if (isInitialized) return;

  try {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    isInitialized = true;
    console.log("✅ Moralis initialized");
  } catch (error) {
    console.error("❌ Moralis initialization failed:", error);
    throw error;
  }
}

export class MoralisClient {
  private apiKey: string;
  private baseUrl = "https://deep-index.moralis.io/api/v2.2";

  constructor() {
    this.apiKey = process.env.MORALIS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️  MORALIS_API_KEY not set");
    }
  }

  private async request(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Moralis API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get wallet token balances
  async getWalletTokenBalances(address: string, chain = "eth") {
    return this.request(`/${address}/erc20`, { chain });
  }

  // Get wallet NFTs
  async getWalletNFTs(address: string, chain = "eth") {
    return this.request(`/${address}/nft`, { chain });
  }

  // Get token price
  async getTokenPrice(address: string, chain = "eth") {
    return this.request(`/erc20/${address}/price`, { chain });
  }

  // Get wallet transaction history
  async getWalletTransactions(address: string, chain = "eth") {
    return this.request(`/${address}`, { chain });
  }

  // Get token metadata
  async getTokenMetadata(addresses: string[], chain = "eth") {
    return this.request(`/erc20/metadata`, {
      chain,
      addresses: addresses.join(","),
    });
  }

  // Check wallet eligibility for airdrops
  async checkAirdropEligibility(address: string): Promise<{
    hasNFTs: boolean;
    tokenCount: number;
    transactionCount: number;
    isActive: boolean;
  }> {
    try {
      const [nfts, tokens, transactions] = await Promise.all([
        this.getWalletNFTs(address) as Promise<{ result: unknown[] }>,
        this.getWalletTokenBalances(address) as Promise<{ result: unknown[] }>,
        this.getWalletTransactions(address) as Promise<{ result: unknown[] }>,
      ]);

      return {
        hasNFTs: (nfts.result?.length ?? 0) > 0,
        tokenCount: tokens.result?.length ?? 0,
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
}

export const moralisClient = new MoralisClient();
