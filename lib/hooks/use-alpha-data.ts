"use client";

import { useState, useEffect, useCallback } from "react";
import { AirdropType, AirdropStatus } from "@prisma/client";
import {
  normalizeChainName,
  mapAirdropType,
  determineAirdropStatus,
  parseDateTime,
  DEFAULT_API_HEADERS,
  API_URLS,
} from "@/lib/constants/alpha.constants";

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

interface UseAlphaDataOptions {
  autoRefresh?: boolean;
  interval?: number;
}

interface UseAlphaDataReturn {
  data: ProcessedProject[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
}

/**
 * Transform raw Alpha123 project to processed format
 */
function transformProject(project: Alpha123Project): ProcessedProject {
  const claimDate = parseDateTime(project.date, project.time);
  const type = mapAirdropType(project.type);
  const status = determineAirdropStatus(claimDate);

  return {
    token: project.token,
    name: project.name || project.token,
    chain: normalizeChainName(project.chain_id),
    airdropAmount: project.amount || "TBA",
    claimStartDate: claimDate,
    contractAddress: project.contract_address || null,
    requiredPoints: project.points || 0,
    deductPoints: Math.floor((project.points || 0) * 0.1),
    type,
    status,
    estimatedValue: project.price || null,
  };
}

/**
 * Client-side hook to fetch real data from alpha123.uk
 * Fetches directly from browser to bypass server-side bot detection
 */
export function useAlphaData(
  options: UseAlphaDataOptions = {},
): UseAlphaDataReturn {
  const { autoRefresh = true, interval = 7000 } = options;

  const [data, setData] = useState<ProcessedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching from alpha123.uk (client-side)...");

      const response = await fetch(`${API_URLS.ALPHA123}/api/data?fresh=1`, {
        method: "GET",
        headers: {
          Accept: DEFAULT_API_HEADERS.Accept,
          "Accept-Language": DEFAULT_API_HEADERS["Accept-Language"],
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const rawData = await response.json();
      console.log("✅ Received data from alpha123.uk:", rawData);

      // Handle different response formats
      let projects: Alpha123Project[] = [];
      if (Array.isArray(rawData)) {
        projects = rawData;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        projects = rawData.data;
      }

      // Transform projects using shared logic
      const processed = projects.map(transformProject);

      console.log(`✅ Processed ${processed.length} projects`);

      setData(processed);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Failed to fetch from alpha123.uk:", errorMessage);
      setError(errorMessage);
    } finally {
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

    const intervalId = setInterval(fetchData, interval);
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
