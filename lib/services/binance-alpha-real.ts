/**
 * Real Binance Alpha API Service
 * Fetches data directly from Binance official Alpha API
 *
 * API Documentation: https://developers.binance.com/docs/alpha/market-data/rest-api/token-list
 */

import { AirdropType, AirdropStatus } from '@prisma/client';

// Binance Alpha Token interface
interface BinanceAlphaToken {
  tokenId: string;
  symbol: string;
  name?: string;
  chain?: string;
  contractAddress?: string;
  // Add more fields as discovered from API
}

// Our internal format
interface AlphaProject {
  tokenId: string;
  symbol: string;
  name: string;
  chain: string;
  contractAddress?: string;
  type: 'TGE' | 'PRETGE' | 'AIRDROP';
  status: string;
  requiredPoints?: number;
  deductPoints?: number;
  airdropAmount?: string;
  estimatedValue?: number;
  description?: string;
  claimStartDate?: number;
  claimEndDate?: number;
  requirements?: string[];
  websiteUrl?: string;
  twitterUrl?: string;
}

interface AlphaResponse {
  success: boolean;
  data: AlphaProject[];
  source: 'binance-alpha';
  lastUpdate: Date;
}

class BinanceAlphaRealService {
  private cache: AlphaResponse | null = null;
  private cacheExpiry: number = 0;
  private cacheDuration: number = 300000; // 5 minutes

  // Official Binance Alpha API endpoint
  private apiUrl: string = 'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list';

  /**
   * Fetch token list from Binance Alpha API
   */
  async fetchTokenList(): Promise<BinanceAlphaToken[]> {
    try {
      console.log('🔍 Fetching from Binance Alpha API...');
      console.log(`📍 API URL: ${this.apiUrl}`);

      const response = await fetch(this.apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Binance Alpha API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Raw API Response:', JSON.stringify(data).substring(0, 200));

      // Parse response based on actual structure
      if (data.data && Array.isArray(data.data)) {
        console.log(`✅ Found ${data.data.length} tokens from Binance Alpha API`);
        return data.data;
      } else if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} tokens from Binance Alpha API`);
        return data;
      }

      throw new Error('Invalid Binance Alpha API response structure');
    } catch (error) {
      console.error('❌ Binance Alpha API fetch failed:', error);
      throw error;
    }
  }

  /**
   * Parse Binance token to our format
   */
  private parseToken(token: BinanceAlphaToken): AlphaProject {
    // Determine type and status based on available data
    const type: 'TGE' | 'PRETGE' | 'AIRDROP' = 'AIRDROP';
    const status = 'UPCOMING';

    return {
      tokenId: token.tokenId,
      symbol: token.symbol,
      name: token.name || token.symbol,
      chain: this.detectChain(token.chain || 'BSC'),
      contractAddress: token.contractAddress,
      type,
      status,
      requiredPoints: 100, // Default values - can be updated later
      deductPoints: 10,
      airdropAmount: '1000 ' + token.symbol,
      estimatedValue: 100,
      description: `${token.name || token.symbol} token on Binance Alpha`,
      requirements: ['Hold BNB', 'Complete KYC'],
    };
  }

  /**
   * Fetch all Alpha projects
   */
  async fetchAlphaProjects(forceRefresh: boolean = false): Promise<AlphaResponse> {
    // Check cache first
    if (!forceRefresh && this.cache && Date.now() < this.cacheExpiry) {
      console.log('📦 Returning cached data');
      return this.cache;
    }

    try {
      const tokens = await this.fetchTokenList();
      const projects = tokens.map(token => this.parseToken(token));

      const response: AlphaResponse = {
        success: true,
        data: projects,
        source: 'binance-alpha',
        lastUpdate: new Date(),
      };

      // Update cache
      this.cache = response;
      this.cacheExpiry = Date.now() + this.cacheDuration;

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch Alpha projects:', error);

      // Return cached data if available
      if (this.cache) {
        console.log('📦 Returning stale cache as fallback');
        return {
          ...this.cache,
          lastUpdate: this.cache.lastUpdate,
        };
      }

      throw error;
    }
  }

  /**
   * Detect chain from various formats
   */
  private detectChain(chain: string): string {
    const normalized = chain.toUpperCase();

    if (normalized.includes('BSC') || normalized.includes('BNB')) return 'BSC';
    if (normalized.includes('ETH') || normalized.includes('ETHEREUM')) return 'ETH';
    if (normalized.includes('POLYGON') || normalized.includes('MATIC')) return 'Polygon';
    if (normalized.includes('SOLANA') || normalized.includes('SOL')) return 'Solana';
    if (normalized.includes('ARBITRUM') || normalized.includes('ARB')) return 'Arbitrum';
    if (normalized.includes('OPTIMISM') || normalized.includes('OP')) return 'Optimism';
    if (normalized.includes('AVALANCHE') || normalized.includes('AVAX')) return 'Avalanche';
    if (normalized.includes('SUI')) return 'SUI';
    if (normalized.includes('BASE')) return 'Base';

    return chain || 'BSC';
  }

  /**
   * Convert to Prisma format
   */
  toPrismaFormat(project: AlphaProject) {
    return {
      token: project.symbol,
      name: project.name,
      chain: project.chain,
      type: this.mapType(project.type),
      requiredPoints: project.requiredPoints,
      deductPoints: project.deductPoints,
      contractAddress: project.contractAddress,
      airdropAmount: project.airdropAmount,
      estimatedValue: project.estimatedValue,
      claimStartDate: project.claimStartDate ? new Date(project.claimStartDate) : null,
      claimEndDate: project.claimEndDate ? new Date(project.claimEndDate) : null,
      status: this.mapStatus(project.status),
      description: project.description,
      requirements: JSON.stringify(project.requirements || []),
      websiteUrl: project.websiteUrl,
      twitterUrl: project.twitterUrl,
      verified: true,
      isActive: true,
    };
  }

  /**
   * Map type to Prisma enum
   */
  private mapType(type: string): AirdropType {
    const normalized = type.toUpperCase();
    if (normalized.includes('TGE') && !normalized.includes('PRE')) return 'TGE';
    if (normalized.includes('PRETGE') || normalized.includes('PRE-TGE')) return 'PRETGE';
    return 'AIRDROP';
  }

  /**
   * Map status to Prisma enum
   */
  private mapStatus(status: string): AirdropStatus {
    const normalized = status.toUpperCase();
    if (normalized.includes('CLAIM') || normalized.includes('LIVE')) return 'CLAIMABLE';
    if (normalized.includes('END') || normalized.includes('FINISH')) return 'ENDED';
    if (normalized.includes('SNAPSHOT')) return 'SNAPSHOT';
    if (normalized.includes('CANCEL')) return 'CANCELLED';
    return 'UPCOMING';
  }
}

export const binanceAlphaRealService = new BinanceAlphaRealService();
export type { AlphaProject, AlphaResponse };
