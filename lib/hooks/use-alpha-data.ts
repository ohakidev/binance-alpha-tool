'use client';

import { useState, useEffect, useCallback } from 'react';
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
  type?: string;
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
}

/**
 * Client-side hook to fetch real data from alpha123.uk
 * Fetches directly from browser to bypass server-side bot detection
 */
export function useAlphaData(autoRefresh: boolean = true, interval: number = 7000) {
  const [data, setData] = useState<ProcessedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const mapChain = (chainId?: string): string => {
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
  };

  const mapType = (type?: string): AirdropType => {
    if (!type) return 'AIRDROP';
    const typeMap: Record<string, AirdropType> = {
      'tge': 'TGE',
      'pretge': 'PRETGE',
      'pre-tge': 'PRETGE',
      'grab': 'AIRDROP',
      'airdrop': 'AIRDROP',
    };
    return typeMap[type.toLowerCase()] || 'AIRDROP';
  };

  const parseDateTime = (date?: string, time?: string): Date | null => {
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
    } catch (error) {
      console.error('Failed to parse date:', date, time);
      return null;
    }
  };

  const determineStatus = (claimDate: Date | null): AirdropStatus => {
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
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching from alpha123.uk (client-side)...');

      // Fetch directly from browser - this bypasses server-side bot detection
      const response = await fetch('https://alpha123.uk/api/data?fresh=1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const rawData = await response.json();
      console.log('✅ Received data from alpha123.uk:', rawData);

      // Handle different response formats
      let projects: Alpha123Project[] = [];
      if (Array.isArray(rawData)) {
        projects = rawData;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        projects = rawData.data;
      }

      // Process the data
      const processed: ProcessedProject[] = projects.map((project) => {
        const claimDate = parseDateTime(project.date, project.time);
        return {
          token: project.token,
          name: project.name || project.token,
          chain: mapChain(project.chain_id),
          airdropAmount: project.amount || 'TBA',
          claimStartDate: claimDate,
          contractAddress: project.contract_address || null,
          requiredPoints: project.points || 0,
          deductPoints: Math.floor((project.points || 0) * 0.1),
          type: mapType(project.type),
          status: determineStatus(claimDate),
          estimatedValue: project.price || null,
        };
      });

      console.log(`✅ Processed ${processed.length} projects`);

      setData(processed);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('❌ Failed to fetch from alpha123.uk:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, interval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, interval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refetch: fetchData,
  };
}
