/**
 * Real Alpha Data Fetcher
 * Fetches actual data from alpha123.uk and other sources
 */

import { AirdropType, AirdropStatus } from '@prisma/client';

interface Alpha123Project {
  token: string;
  name: string;
  amount: string;
  date?: string;
  time?: string;
  chain_id?: string;
  contract_address?: string;
  points?: number;
  type?: string; // 'tge', 'grab', etc.
  price?: number;
  listing?: {
    spot?: boolean;
    futures?: boolean;
  };
}

interface ProcessedProject {
  token: string;
  name: string;
  chain: string;
  airdropAmount: string;
  claimStartDate: Date | null;
  contractAddress: string | null;
  requiredPoints: number;
  deductPoints: number;
  type: AirdropType;
  status: AirdropStatus;
  estimatedValue: number | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  description: string | null;
}

class RealAlphaFetcher {
  private alpha123BaseUrl = 'https://alpha123.uk';
  private cache: { data: ProcessedProject[]; timestamp: number } | null = null;
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch data from alpha123.uk/api/data
   */
  async fetchFromAlpha123(): Promise<Alpha123Project[]> {
    try {
      console.log('🔍 Fetching from alpha123.uk/api/data...');

      const response = await fetch(`${this.alpha123BaseUrl}/api/data?fresh=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://alpha123.uk/',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
        },
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Alpha123 API error: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data)) {
        console.log(`✅ Received ${data.length} projects from alpha123.uk`);
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        console.log(`✅ Received ${data.data.length} projects from alpha123.uk`);
        return data.data;
      }

      console.warn('⚠️ Unexpected data format from alpha123.uk');
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch from alpha123.uk:', error);
      throw error;
    }
  }

  /**
   * Fetch price data for a specific token
   */
  async fetchTokenPrice(token: string): Promise<number | null> {
    try {
      const response = await fetch(`${this.alpha123BaseUrl}/api/price/${token}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.price || null;
    } catch (error) {
      console.error(`Failed to fetch price for ${token}:`, error);
      return null;
    }
  }

  /**
   * Map chain_id to readable chain name
   */
  private mapChain(chainId?: string): string {
    if (!chainId) return 'BSC';

    const chainMap: Record<string, string> = {
      '56': 'BSC',
      'bsc': 'BSC',
      '1': 'Ethereum',
      'eth': 'Ethereum',
      '137': 'Polygon',
      'polygon': 'Polygon',
      'matic': 'Polygon',
      '42161': 'Arbitrum',
      'arbitrum': 'Arbitrum',
      '10': 'Optimism',
      'optimism': 'Optimism',
      '43114': 'Avalanche',
      'avalanche': 'Avalanche',
    };

    return chainMap[chainId.toLowerCase()] || 'BSC';
  }

  /**
   * Map type to AirdropType enum
   */
  private mapType(type?: string): AirdropType {
    if (!type) return 'AIRDROP';

    const typeMap: Record<string, AirdropType> = {
      'tge': 'TGE',
      'pretge': 'PRETGE',
      'pre-tge': 'PRETGE',
      'grab': 'AIRDROP',
      'airdrop': 'AIRDROP',
    };

    return typeMap[type.toLowerCase()] || 'AIRDROP';
  }

  /**
   * Parse date and time from alpha123 format
   */
  private parseDateTime(date?: string, time?: string): Date | null {
    if (!date) return null;

    try {
      // Try to parse the date string
      // Format could be: "2025-01-15", "15/01/2025", etc.
      let dateStr = date;

      if (time) {
        dateStr += ` ${time}`;
      }

      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      return null;
    } catch (error) {
      console.error('Failed to parse date:', date, time);
      return null;
    }
  }

  /**
   * Determine status based on date
   */
  private determineStatus(claimDate: Date | null): AirdropStatus {
    if (!claimDate) return 'UPCOMING';

    const now = new Date();
    const diffDays = Math.ceil((claimDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < -7) {
      return 'ENDED';
    } else if (diffDays < 0) {
      return 'CLAIMABLE';
    } else if (diffDays <= 7) {
      return 'SNAPSHOT';
    }

    return 'UPCOMING';
  }

  /**
   * Process raw data into our format
   */
  async processProjects(rawProjects: Alpha123Project[]): Promise<ProcessedProject[]> {
    const processed: ProcessedProject[] = [];

    for (const project of rawProjects) {
      try {
        const claimDate = this.parseDateTime(project.date, project.time);
        const price = project.price || (await this.fetchTokenPrice(project.token));

        processed.push({
          token: project.token,
          name: project.name || project.token,
          chain: this.mapChain(project.chain_id),
          airdropAmount: project.amount || 'TBA',
          claimStartDate: claimDate,
          contractAddress: project.contract_address || null,
          requiredPoints: project.points || 0,
          deductPoints: Math.floor((project.points || 0) * 0.1), // 10% of required points
          type: this.mapType(project.type),
          status: this.determineStatus(claimDate),
          estimatedValue: price || null,
          websiteUrl: null,
          twitterUrl: null,
          description: null,
        });
      } catch (error) {
        console.error(`Failed to process project ${project.token}:`, error);
      }
    }

    return processed;
  }

  /**
   * Main method to fetch and process all data
   */
  async fetchAllProjects(forceRefresh: boolean = false): Promise<ProcessedProject[]> {
    // Check cache
    if (!forceRefresh && this.cache && Date.now() - this.cache.timestamp < this.cacheDuration) {
      console.log('📦 Returning cached data');
      return this.cache.data;
    }

    try {
      // Fetch raw data
      const rawProjects = await this.fetchFromAlpha123();

      // Process data
      const processed = await this.processProjects(rawProjects);

      // Update cache
      this.cache = {
        data: processed,
        timestamp: Date.now(),
      };

      console.log(`✅ Processed ${processed.length} projects`);
      return processed;
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);

      // Return stale cache if available
      if (this.cache) {
        console.log('📦 Returning stale cache');
        return this.cache.data;
      }

      throw error;
    }
  }

  /**
   * Convert to Prisma format
   */
  toPrismaFormat(project: ProcessedProject) {
    return {
      token: project.token,
      name: project.name,
      chain: project.chain,
      airdropAmount: project.airdropAmount,
      claimStartDate: project.claimStartDate,
      claimEndDate: project.claimStartDate
        ? new Date(project.claimStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days
        : null,
      contractAddress: project.contractAddress,
      requiredPoints: project.requiredPoints,
      deductPoints: project.deductPoints,
      type: project.type,
      status: project.status,
      estimatedValue: project.estimatedValue,
      websiteUrl: project.websiteUrl,
      twitterUrl: project.twitterUrl,
      description: project.description,
      eligibility: JSON.stringify([]),
      requirements: JSON.stringify([]),
      verified: true,
    };
  }
}

export const realAlphaFetcher = new RealAlphaFetcher();
export type { Alpha123Project, ProcessedProject };
