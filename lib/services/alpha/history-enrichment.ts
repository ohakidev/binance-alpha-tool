import type { HistoryProjectRaw } from "@/lib/types/alpha.types";
import { API_URLS } from "@/lib/constants/alpha.constants";

const HISTORY_SOURCE_BASE_URL = API_URLS.HISTORY_SOURCE;
const HISTORY_SOURCE_HISTORY_URL = `${HISTORY_SOURCE_BASE_URL}/api/historydata`;
const HISTORY_SOURCE_PRICE_URL = `${HISTORY_SOURCE_BASE_URL}/api/price/?batch_dex=true`;
const HISTORY_SOURCE_PAGE_URL = `${HISTORY_SOURCE_BASE_URL}/history.html`;

const HISTORY_SOURCE_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  Origin: HISTORY_SOURCE_BASE_URL,
  Referer: HISTORY_SOURCE_PAGE_URL,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
};

interface HistoryResponse {
  airdrops?: HistoryProjectRaw[];
}

interface HistoryPriceEntry {
  token?: string;
  dex_price?: number;
  price?: number;
}

interface HistoryPriceResponse {
  success?: boolean;
  prices?: Record<string, HistoryPriceEntry>;
}

export interface HistoryEnrichment {
  symbol: string;
  name: string;
  pointsText: string | null;
  pointsValue: number | null;
  amountText: string | null;
  amountValue: number | null;
  totalAmountValue: number | null;
  slotCount: number | null;
  slotText: string | null;
  estimatedPrice: number | null;
  estimatedValue: number | null;
  marketCap: number | null;
  fdv: number | null;
  chainId: string | null;
  contractAddress: string | null;
  scheduledAt: Date | null;
  type: string | null;
  status: string | null;
  sourceUrl: string;
}

function normalizeSymbol(symbol?: string | null): string {
  return (symbol || "").trim().toUpperCase();
}

function parseFloatValue(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePoints(
  value: string | number | null | undefined,
): { pointsText: string | null; pointsValue: number | null } {
  if (typeof value === "number" && Number.isFinite(value)) {
    return {
      pointsText: String(value),
      pointsValue: value,
    };
  }

  if (typeof value !== "string") {
    return {
      pointsText: null,
      pointsValue: null,
    };
  }

  const pointsText = value.trim();
  if (!pointsText) {
    return {
      pointsText: null,
      pointsValue: null,
    };
  }

  const matches = pointsText.match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) {
    return {
      pointsText,
      pointsValue: null,
    };
  }

  return {
    pointsText,
    pointsValue: Number.parseFloat(matches[0]),
  };
}

function parseScheduledAt(project: HistoryProjectRaw): Date | null {
  if (!project.date) {
    return null;
  }

  const time = project.time?.trim() ? project.time.trim() : "00:00";
  const iso = `${project.date}T${time}:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatSlotText(slotCount: number | null): string | null {
  if (!slotCount || !Number.isFinite(slotCount) || slotCount <= 0) {
    return null;
  }

  if (slotCount >= 1000) {
    return `${Math.round(slotCount / 1000)}k slots`;
  }

  return `${Math.round(slotCount)} slots`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: HISTORY_SOURCE_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`History source request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function buildHistoryEnrichmentRecord(
  project: HistoryProjectRaw,
  estimatedPrice: number | null,
  options?: { sourceUrl?: string },
): HistoryEnrichment {
  const symbol = normalizeSymbol(project.token);
  const { pointsText, pointsValue } = parsePoints(project.points);
  const amountValue = parseFloatValue(project.amount);
  const totalAmountValue = parseFloatValue(project.total_amount);
  const slotCount =
    amountValue && totalAmountValue ? totalAmountValue / amountValue : null;

  return {
    symbol,
    name: project.name || symbol,
    pointsText,
    pointsValue,
    amountText:
      typeof project.amount === "string"
        ? project.amount.trim() || null
        : amountValue !== null
          ? String(amountValue)
          : null,
    amountValue,
    totalAmountValue,
    slotCount,
    slotText: formatSlotText(slotCount),
    estimatedPrice,
    estimatedValue:
      estimatedPrice && amountValue
        ? Math.round(estimatedPrice * amountValue * 10) / 10
        : null,
    marketCap: parseFloatValue(project.market_cap),
    fdv: parseFloatValue(project.fdv),
    chainId: project.chain_id?.trim() || null,
    contractAddress: project.contract_address?.trim() || null,
    scheduledAt: parseScheduledAt(project),
    type: project.type?.trim() || null,
    status: project.status?.trim() || null,
    sourceUrl: options?.sourceUrl || HISTORY_SOURCE_PAGE_URL,
  };
}

export async function fetchHistoryProjects(): Promise<HistoryProjectRaw[]> {
  const response = await fetchJson<HistoryResponse>(HISTORY_SOURCE_HISTORY_URL);
  return Array.isArray(response.airdrops) ? response.airdrops : [];
}

export async function fetchHistoryDexPrices(): Promise<Record<string, number>> {
  const response = await fetchJson<HistoryPriceResponse>(HISTORY_SOURCE_PRICE_URL);
  const entries = Object.entries(response.prices || {});

  return entries.reduce<Record<string, number>>((accumulator, [symbol, value]) => {
    const normalizedSymbol = normalizeSymbol(symbol);
    const price = parseFloatValue(value?.dex_price ?? value?.price ?? null);

    if (normalizedSymbol && price && price > 0) {
      accumulator[normalizedSymbol] = price;
    }

    return accumulator;
  }, {});
}

export async function fetchHistoryEnrichmentLookup(): Promise<
  Map<string, HistoryEnrichment[]>
> {
  const [projects, dexPrices] = await Promise.all([
    fetchHistoryProjects(),
    fetchHistoryDexPrices(),
  ]);

  return projects.reduce<Map<string, HistoryEnrichment[]>>((lookup, project) => {
    const symbol = normalizeSymbol(project.token);
    if (!symbol) {
      return lookup;
    }

    const enrichment = buildHistoryEnrichmentRecord(
      project,
      dexPrices[symbol] ?? null,
    );

    const existing = lookup.get(symbol) || [];
    existing.push(enrichment);
    lookup.set(symbol, existing);

    return lookup;
  }, new Map<string, HistoryEnrichment[]>());
}

function compareNullableDates(a: Date | null, b: Date | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return b.getTime() - a.getTime();
}

function normalizeContractAddress(address?: string | null): string {
  return (address || "").trim().toLowerCase();
}

export function findBestHistoryEnrichmentMatch(
  lookup: Map<string, HistoryEnrichment[]>,
  token: {
    symbol: string;
    chainId?: string | null;
    contractAddress?: string | null;
    listingTime?: number | Date | null;
  },
): HistoryEnrichment | null {
  const matches = lookup.get(normalizeSymbol(token.symbol));
  if (!matches?.length) {
    return null;
  }

  const listingTimestamp =
    token.listingTime instanceof Date
      ? token.listingTime.getTime()
      : typeof token.listingTime === "number"
        ? token.listingTime
        : null;
  const targetContract = normalizeContractAddress(token.contractAddress);
  const targetChainId = token.chainId?.trim() || null;

  const ranked = [...matches].sort((left, right) => {
    const leftContractMatch =
      targetContract &&
      normalizeContractAddress(left.contractAddress) === targetContract
        ? 1
        : 0;
    const rightContractMatch =
      targetContract &&
      normalizeContractAddress(right.contractAddress) === targetContract
        ? 1
        : 0;

    if (leftContractMatch !== rightContractMatch) {
      return rightContractMatch - leftContractMatch;
    }

    const leftChainMatch = targetChainId && left.chainId === targetChainId ? 1 : 0;
    const rightChainMatch =
      targetChainId && right.chainId === targetChainId ? 1 : 0;

    if (leftChainMatch !== rightChainMatch) {
      return rightChainMatch - leftChainMatch;
    }

    if (listingTimestamp && left.scheduledAt && right.scheduledAt) {
      const leftDiff = Math.abs(left.scheduledAt.getTime() - listingTimestamp);
      const rightDiff = Math.abs(right.scheduledAt.getTime() - listingTimestamp);

      if (leftDiff !== rightDiff) {
        return leftDiff - rightDiff;
      }
    }

    return compareNullableDates(left.scheduledAt, right.scheduledAt);
  });

  return ranked[0] || null;
}
