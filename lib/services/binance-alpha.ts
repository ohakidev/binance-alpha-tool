import { AirdropType, AirdropStatus } from '@prisma/client';

interface BinanceAlphaProject {
  projectId: string;
  projectName: string;
  symbol: string;
  chain: string;

  // Airdrop details
  type: 'TGE' | 'PRETGE' | 'AIRDROP';
  requiredPoints?: number;
  deductPoints?: number;
  contractAddress?: string;
  airdropAmount?: string;
  estimatedValue?: number;

  // Dates
  startTime?: number; // Unix timestamp
  endTime?: number;
  listingDate?: number;

  // Status
  status: string;

  // Additional info
  description?: string;
  requirements?: string[];
  websiteUrl?: string;
  twitterUrl?: string;
}

interface AlphaResponse {
  success: boolean;
  data: BinanceAlphaProject[];
  source: 'binance' | 'alpha123' | 'cache';
  lastUpdate: Date;
}

class BinanceAlphaService {
  private cache: AlphaResponse | null = null;
  private cacheExpiry: number = 0;
  private cacheDuration: number = parseInt(process.env.ALPHA_CACHE_DURATION || '300000'); // From .env or default 5 minutes
  private binanceApiUrl: string = process.env.BINANCE_ALPHA_API_URL || 'https://www.binance.com/bapi/composite/v1/public/alpha/project/list';
  private alpha123ApiUrl: string = process.env.ALPHA123_API_URL || 'https://alpha123.uk/api/projects';

  /**
   * Fetch Alpha projects from Binance API
   */
  async fetchFromBinance(): Promise<BinanceAlphaProject[]> {
    try {
      console.log('🔍 Fetching from Binance API...');
      console.log(`📍 API URL: ${this.binanceApiUrl}`);

      // Try official Binance API with configured URL
      const response = await fetch(this.binanceApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          pageIndex: 1,
          pageSize: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.projectList) {
        console.log(`✅ Found ${data.data.projectList.length} projects from Binance API`);
        return this.parseBinanceData(data.data.projectList);
      }

      throw new Error('Invalid Binance API response');
    } catch (error) {
      console.error('❌ Binance API fetch failed:', error);
      throw error;
    }
  }

  /**
   * Parse Binance API response to our format
   */
  private parseBinanceData(projects: any[]): BinanceAlphaProject[] {
    return projects.map((project) => {
      // Determine type based on project data
      let type: 'TGE' | 'PRETGE' | 'AIRDROP' = 'AIRDROP';
      if (project.projectType?.includes('TGE') || project.listingDate) {
        type = 'TGE';
      } else if (project.projectType?.includes('PRE')) {
        type = 'PRETGE';
      }

      // Determine status
      const now = Date.now();
      let status = 'UPCOMING';
      if (project.startTime && now >= project.startTime && (!project.endTime || now <= project.endTime)) {
        status = 'CLAIMABLE';
      } else if (project.endTime && now > project.endTime) {
        status = 'ENDED';
      }

      return {
        projectId: project.projectId || project.id,
        projectName: project.projectName || project.name,
        symbol: project.symbol || project.ticker,
        chain: this.detectChain(project.chain || project.network || 'BSC'),

        type,
        requiredPoints: project.requiredPoints || project.minPoints,
        deductPoints: project.deductPoints || project.pointDeduction || 0,
        contractAddress: project.contractAddress || project.tokenAddress,
        airdropAmount: project.airdropAmount || project.rewardAmount,
        estimatedValue: project.estimatedValue || project.usdValue,

        startTime: project.startTime || project.claimStartTime,
        endTime: project.endTime || project.claimEndTime,
        listingDate: project.listingDate,

        status,

        description: project.description || project.intro,
        requirements: project.requirements || [],
        websiteUrl: project.websiteUrl || project.website,
        twitterUrl: project.twitterUrl || project.twitter,
      };
    });
  }

  /**
   * Fetch from alpha123.uk as fallback
   */
  async fetchFromAlpha123(): Promise<BinanceAlphaProject[]> {
    try {
      console.log('🔍 Fetching from alpha123.uk as fallback...');
      console.log(`📍 API URL: ${this.alpha123ApiUrl}`);

      const response = await fetch(this.alpha123ApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Alpha123 API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Found ${data.length} projects from alpha123.uk`);

      return this.parseAlpha123Data(data);
    } catch (error) {
      console.error('❌ Alpha123 fetch failed:', error);
      throw error;
    }
  }

  /**
   * Parse alpha123.uk response
   */
  private parseAlpha123Data(projects: any[]): BinanceAlphaProject[] {
    return projects.map((project) => ({
      projectId: project.id || project.symbol,
      projectName: project.name || project.project,
      symbol: project.symbol || project.ticker,
      chain: this.detectChain(project.chain || 'BSC'),

      type: this.detectType(project.type || project.category),
      requiredPoints: project.points || project.threshold,
      deductPoints: project.deduct || 0,
      contractAddress: project.contract,
      airdropAmount: project.amount,
      estimatedValue: project.value,

      startTime: project.start ? new Date(project.start).getTime() : undefined,
      endTime: project.end ? new Date(project.end).getTime() : undefined,

      status: project.status || 'UPCOMING',
      description: project.description,
      requirements: project.requirements || [],
    }));
  }

  /**
   * Main method to fetch Alpha projects with fallback
   */
  async fetchAlphaProjects(forceRefresh: boolean = false): Promise<AlphaResponse> {
    // Check cache first
    if (!forceRefresh && this.cache && Date.now() < this.cacheExpiry) {
      console.log('📦 Returning cached data');
      return this.cache;
    }

    let projects: BinanceAlphaProject[] = [];
    let source: 'binance' | 'alpha123' | 'cache' = 'binance';

    try {
      // Try Binance API first
      projects = await this.fetchFromBinance();
      source = 'binance';
    } catch (binanceError) {
      console.warn('⚠️ Binance API failed, trying alpha123.uk...');

      try {
        // Fallback to alpha123.uk
        projects = await this.fetchFromAlpha123();
        source = 'alpha123';
      } catch (alpha123Error) {
        console.error('❌ Both sources failed');

        // Return cached data if available, even if expired
        if (this.cache) {
          console.log('📦 Returning stale cache as last resort');
          return {
            ...this.cache,
            lastUpdate: this.cache.lastUpdate,
          };
        }

        throw new Error('All data sources failed');
      }
    }

    // Update cache
    const response: AlphaResponse = {
      success: true,
      data: projects,
      source,
      lastUpdate: new Date(),
    };

    this.cache = response;
    this.cacheExpiry = Date.now() + this.cacheDuration;

    return response;
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

    return chain;
  }

  /**
   * Detect type from string
   */
  private detectType(type: string): 'TGE' | 'PRETGE' | 'AIRDROP' {
    const normalized = type.toUpperCase();

    if (normalized.includes('TGE') && !normalized.includes('PRE')) return 'TGE';
    if (normalized.includes('PRETGE') || normalized.includes('PRE-TGE')) return 'PRETGE';

    return 'AIRDROP';
  }

  /**
   * Convert to Prisma format
   */
  toPrismaFormat(project: BinanceAlphaProject) {
    return {
      token: project.symbol,
      name: project.projectName,
      chain: project.chain,

      type: project.type as AirdropType,
      requiredPoints: project.requiredPoints,
      deductPoints: project.deductPoints,
      contractAddress: project.contractAddress,
      airdropAmount: project.airdropAmount,
      estimatedValue: project.estimatedValue,

      claimStartDate: project.startTime ? new Date(project.startTime) : null,
      claimEndDate: project.endTime ? new Date(project.endTime) : null,
      listingDate: project.listingDate ? new Date(project.listingDate) : null,

      status: this.mapStatus(project.status),
      description: project.description,
      requirements: JSON.stringify(project.requirements || []),

      websiteUrl: project.websiteUrl,
      twitterUrl: project.twitterUrl,
    };
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

export const binanceAlphaService = new BinanceAlphaService();
export type { BinanceAlphaProject, AlphaResponse };
