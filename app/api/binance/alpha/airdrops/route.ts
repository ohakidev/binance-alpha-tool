/**
 * Binance Alpha Airdrops API Route
 * GET /api/binance/alpha/airdrops
 * Returns current airdrop opportunities from database
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { airdropCalculator } from "@/lib/services/airdrop-calculator";
import {
  type HistoryEnrichment,
  fetchHistoryEnrichmentLookup,
} from "@/lib/services/alpha/history-enrichment";
import { historySource } from "@/lib/services/alpha/HistorySource";
import {
  mapAirdropType,
  normalizeChainName,
} from "@/lib/constants/alpha.constants";
import type { AlphaToken } from "@/lib/types/alpha.types";
import type { Airdrop } from "@prisma/client";

export const dynamic = "force-dynamic";

interface ScheduleListingSource {
  id: string;
  token: string;
  name: string;
  scheduledTime: Date;
  endTime: Date | null;
  points: number | null;
  deductPoints: number | null;
  amount: string | null;
  chain: string;
  contractAddress: string | null;
  type: Airdrop["type"];
  estimatedPrice: number | null;
  estimatedValue: number | null;
  description: string | null;
  status: string | null;
  isActive: boolean;
  updatedAt: Date;
}

interface AirdropListing {
  id: string;
  projectName: string;
  symbol: string;
  logo: string;
  chain: string;
  status: string;
  scheduleStatus: string | null;
  description: string;
  website: string;
  twitter: string;
  discord: string;
  eligibility: string[];
  requirements: string[];
  airdropAmount: string;
  estimatedValue: number | null;
  snapshotDate: Date | null;
  claimStartDate: Date | null;
  claimEndDate: Date | null;
  dropTime: string;
  verified: boolean;
  participantCount: number | null;
  type: Airdrop["type"];
  requiredPoints: number;
  deductPoints: number;
  pointsText: string | null;
  slotText: string | null;
  estimatedPrice: number | null;
  contractAddress: string;
  score: number;
}

function extractSlotText(description?: string | null): string | null {
  if (!description) {
    return null;
  }

  const structuredMatch = description.match(/Slots:\s(.+?)(?=\sDEX Price:|$)/i);
  if (structuredMatch?.[1]) {
    return structuredMatch[1].trim();
  }

  const inlineMatch = description.match(/\b\d+(?:\.\d+)?k?\s+slots\b/i);
  return inlineMatch?.[0]?.trim() || null;
}

function extractEstimatedPrice(description?: string | null): number | null {
  if (!description) {
    return null;
  }

  const match = description.match(/DEX Price:\s*\$([0-9]+(?:\.[0-9]+)?)/i);
  if (!match?.[1]) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function hasConcreteAmount(amount?: string | null): boolean {
  if (!amount) {
    return false;
  }

  const normalized = amount.trim();
  if (!normalized) {
    return false;
  }

  return !/^Alpha Score:/i.test(normalized) && normalized !== "TBA";
}

function parseAmountValue(amount?: string | null): number | null {
  if (!hasConcreteAmount(amount)) {
    return null;
  }

  const parsed = Number.parseFloat(String(amount).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStatus(status?: string | null): string | null {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "LIVE" || normalized === "TODAY") {
    return "live";
  }

  if (normalized === "UPCOMING") {
    return "upcoming";
  }

  if (normalized === "CANCELLED") {
    return "cancelled";
  }

  if (normalized === "ENDED") {
    return "ended";
  }

  return normalized.toLowerCase();
}

function parseJsonArray(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildHistoryDescription(entry: HistoryEnrichment): string | null {
  const parts = [
    entry.pointsText ? `Points: ${entry.pointsText}` : null,
    entry.amountText ? `Amount: ${entry.amountText}` : null,
    entry.slotText ? `Slots: ${entry.slotText}` : null,
    entry.estimatedPrice ? `DEX Price: $${entry.estimatedPrice}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : null;
}

function determineHistoryScheduleStatus(
  scheduledAt: Date,
  now: Date,
): "TODAY" | "UPCOMING" {
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (scheduledAt < tomorrow) {
    return "TODAY";
  }

  return "UPCOMING";
}

export function buildScheduleSourcesFromHistory(
  lookup: Map<string, HistoryEnrichment[]>,
  now: Date = new Date(),
): ScheduleListingSource[] {
  const deduped = new Map<string, ScheduleListingSource>();

  for (const entries of lookup.values()) {
    for (const entry of entries) {
      if (!entry.scheduledAt || entry.scheduledAt <= now) {
        continue;
      }

      const key = `${entry.symbol}-${entry.scheduledAt.toISOString()}`;
      if (deduped.has(key)) {
        continue;
      }

      deduped.set(key, {
        id: `history-${key}`,
        token: entry.symbol,
        name: entry.name,
        scheduledTime: entry.scheduledAt,
        endTime: null,
        points: entry.pointsValue,
        deductPoints: null,
        amount: entry.amountText,
        chain: normalizeChainName(entry.chainId || undefined),
        contractAddress: entry.contractAddress,
        type: mapAirdropType(entry.type || undefined),
        estimatedPrice: entry.estimatedPrice,
        estimatedValue: entry.estimatedValue,
        description: buildHistoryDescription(entry),
        status: determineHistoryScheduleStatus(entry.scheduledAt, now),
        isActive: true,
        updatedAt: now,
      });
    }
  }

  return [...deduped.values()].sort(
    (left, right) =>
      left.scheduledTime.getTime() - right.scheduledTime.getTime(),
  );
}

function deriveAmountFromToken(token: AlphaToken): string | null {
  if (
    token.price > 0 &&
    token.estimatedValue !== null &&
    token.estimatedValue > token.price
  ) {
    const amount = token.estimatedValue / token.price;
    if (Number.isFinite(amount) && amount > 0) {
      return Number.isInteger(amount)
        ? String(amount)
        : amount.toFixed(2).replace(/\.?0+$/, "");
    }
  }

  return null;
}

export function buildScheduleSourcesFromTokens(
  tokens: AlphaToken[],
  now: Date = new Date(),
): ScheduleListingSource[] {
  const deduped = new Map<string, ScheduleListingSource>();

  for (const token of tokens) {
    if (!token.listingTime || token.listingTime <= now) {
      continue;
    }

    const key = `${token.symbol}-${token.listingTime.toISOString()}`;
    if (deduped.has(key)) {
      continue;
    }

    const amount = deriveAmountFromToken(token);
    deduped.set(key, {
      id: `token-feed-${key}`,
      token: token.symbol,
      name: token.name,
      scheduledTime: token.listingTime,
      endTime: null,
      points: token.score > 0 ? token.score : null,
      deductPoints: null,
      amount,
      chain: token.chain,
      contractAddress: token.contractAddress || null,
      type: token.type,
      estimatedPrice: token.price > 0 ? token.price : null,
      estimatedValue: token.estimatedValue,
      description: [
        token.score > 0 ? `Points: ${token.score}` : null,
        amount ? `Amount: ${amount}` : null,
        token.price > 0 ? `DEX Price: $${token.price}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      status: determineHistoryScheduleStatus(token.listingTime, now),
      isActive: !token.isOffline,
      updatedAt: token.lastUpdate ?? now,
    });
  }

  return [...deduped.values()].sort(
    (left, right) =>
      left.scheduledTime.getTime() - right.scheduledTime.getTime(),
  );
}

function computeEstimatedValue(
  amountText: string,
  estimatedPrice: number | null,
  fallbackValue?: number | null,
): number | null {
  const amountValue = parseAmountValue(amountText);
  if (amountValue !== null && estimatedPrice !== null && estimatedPrice > 0) {
    return Math.round(amountValue * estimatedPrice * 10) / 10;
  }

  return fallbackValue ?? null;
}

function buildListingFromSources(
  airdrop: Airdrop | undefined,
  schedule?: ScheduleListingSource,
): AirdropListing {
  const description = schedule?.description ?? airdrop?.description ?? "";
  const estimatedPrice =
    schedule?.estimatedPrice ??
    extractEstimatedPrice(description) ??
    extractEstimatedPrice(airdrop?.description);
  const airdropAmount =
    (schedule && hasConcreteAmount(schedule.amount)
      ? schedule.amount
      : airdrop?.airdropAmount) || "TBA";
  const estimatedValue = schedule
    ? computeEstimatedValue(
        airdropAmount,
        estimatedPrice,
        schedule.estimatedValue ?? airdrop?.estimatedValue,
      )
    : airdrop?.estimatedValue ??
      computeEstimatedValue(airdropAmount, estimatedPrice, null);
  const requiredPoints = schedule?.points ?? airdrop?.requiredPoints ?? 0;
  const deductPoints = schedule?.deductPoints ?? airdrop?.deductPoints ?? 0;
  const scheduleStatus = normalizeStatus(schedule?.status);
  const status = scheduleStatus ?? normalizeStatus(airdrop?.status) ?? "upcoming";
  const eligibility = parseJsonArray(airdrop?.eligibility);
  const requirements = parseJsonArray(airdrop?.requirements);
  const claimStartDate = schedule?.scheduledTime ?? airdrop?.claimStartDate ?? null;

  return {
    id: schedule?.id ?? airdrop?.id ?? `${schedule?.token || "unknown"}-${claimStartDate?.toISOString() || "unscheduled"}`,
    projectName: airdrop?.name ?? schedule?.name ?? schedule?.token ?? "Unknown",
    symbol: schedule?.token ?? airdrop?.token ?? "UNKNOWN",
    logo: "🎁",
    chain: schedule?.chain ?? airdrop?.chain ?? "BSC",
    status,
    scheduleStatus,
    description,
    website: airdrop?.websiteUrl || "",
    twitter: airdrop?.twitterUrl || "",
    discord: airdrop?.discordUrl || "",
    eligibility,
    requirements,
    airdropAmount,
    estimatedValue,
    snapshotDate: airdrop?.snapshotDate ?? null,
    claimStartDate,
    claimEndDate: schedule?.endTime ?? airdrop?.claimEndDate ?? null,
    dropTime: claimStartDate?.toISOString() || new Date().toISOString(),
    verified: airdrop?.verified ?? Boolean(schedule?.isActive),
    participantCount: airdrop?.participantCount ?? null,
    type: schedule?.type ?? airdrop?.type ?? "AIRDROP",
    requiredPoints,
    deductPoints,
    pointsText: requiredPoints > 0 ? String(requiredPoints) : null,
    slotText:
      extractSlotText(schedule?.description) ??
      extractSlotText(airdrop?.description) ??
      null,
    estimatedPrice: estimatedPrice ?? null,
    contractAddress:
      schedule?.contractAddress ?? airdrop?.contractAddress ?? "",
    score: airdropCalculator.calculateAirdropScore({
      estimatedValue: estimatedValue || undefined,
      participantCount: airdrop?.participantCount || undefined,
      verified: airdrop?.verified ?? true,
      requirements,
      claimEndDate: schedule?.endTime ?? airdrop?.claimEndDate ?? undefined,
    }),
  };
}

function compareListings(left: AirdropListing, right: AirdropListing): number {
  const leftTime = left.claimStartDate
    ? new Date(left.claimStartDate).getTime()
    : 0;
  const rightTime = right.claimStartDate
    ? new Date(right.claimStartDate).getTime()
    : 0;

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return right.score - left.score;
}

function matchesStatusFilter(item: AirdropListing, statusFilter?: string | null) {
  if (!statusFilter) {
    return true;
  }

  const normalized = statusFilter.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (normalized === "claimable") {
    return item.status === "claimable" || item.scheduleStatus === "live";
  }

  if (normalized === "live" || normalized === "today") {
    return item.scheduleStatus === "live" || item.status === "live";
  }

  return item.status === normalized || item.scheduleStatus === normalized;
}

export function buildAirdropListings(
  airdrops: Airdrop[],
  schedules: ScheduleListingSource[],
): AirdropListing[] {
  const airdropByToken = new Map(airdrops.map((airdrop) => [airdrop.token, airdrop]));
  const listings = schedules.map((schedule) =>
    buildListingFromSources(airdropByToken.get(schedule.token), schedule),
  );
  const scheduledTokens = new Set(schedules.map((schedule) => schedule.token));

  for (const airdrop of airdrops) {
    if (!scheduledTokens.has(airdrop.token)) {
      listings.push(buildListingFromSources(airdrop));
    }
  }

  return listings.sort(compareListings);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const chain = searchParams.get("chain");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20"), 1),
      1000,
    );

    // Build filter
    const where: Record<string, unknown> = {};

    if (chain) {
      where.chain = chain;
    }

    // Fetch airdrops from database
    const airdrops = await prisma.airdrop.findMany({
      where,
      orderBy: [{ claimStartDate: "desc" }, { createdAt: "desc" }],
    });

    const schedules = await prisma.airdropSchedule.findMany({
      where: {
        ...(chain ? { chain } : {}),
      },
      select: {
        id: true,
        token: true,
        name: true,
        scheduledTime: true,
        endTime: true,
        points: true,
        deductPoints: true,
        amount: true,
        chain: true,
        contractAddress: true,
        type: true,
        estimatedPrice: true,
        estimatedValue: true,
        description: true,
        status: true,
        isActive: true,
        updatedAt: true,
      },
      orderBy: [{ scheduledTime: "desc" }, { updatedAt: "desc" }],
    });

    let historySchedules: ScheduleListingSource[] = [];
    try {
      const historyLookup = await fetchHistoryEnrichmentLookup();
      historySchedules = buildScheduleSourcesFromHistory(historyLookup).filter(
        (schedule) => !chain || schedule.chain === chain,
      );
    } catch (error) {
      console.warn(
        "History schedule augmentation unavailable:",
        error instanceof Error ? error.message : String(error),
      );
    }

    let tokenSchedules: ScheduleListingSource[] = [];
    try {
      const historyTokens = await historySource.fetchTokens();
      tokenSchedules = buildScheduleSourcesFromTokens(historyTokens).filter(
        (schedule) => !chain || schedule.chain === chain,
      );
    } catch (error) {
      console.warn(
        "History token feed augmentation unavailable:",
        error instanceof Error ? error.message : String(error),
      );
    }

    const scheduleKeys = new Set(
      schedules.map(
        (schedule) =>
          `${schedule.token}-${schedule.scheduledTime.toISOString()}`,
      ),
    );
    const mergedSchedules = [
      ...schedules,
      ...historySchedules.filter((schedule) => {
        const key = `${schedule.token}-${schedule.scheduledTime.toISOString()}`;
        return !scheduleKeys.has(key);
      }),
      ...tokenSchedules.filter((schedule) => {
        const key = `${schedule.token}-${schedule.scheduledTime.toISOString()}`;
        return !scheduleKeys.has(key);
      }),
    ];

    const airdropsWithScores = buildAirdropListings(airdrops, mergedSchedules)
      .filter((item) => matchesStatusFilter(item, status))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: airdropsWithScores,
      count: airdropsWithScores.length,
      source: "database",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Airdrops API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch airdrops",
      },
      { status: 500 },
    );
  }
}

// POST - สร้าง airdrop ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const airdrop = await airdropCalculator.createAirdrop({
      name: body.name || body.projectName,
      token: body.symbol || body.token,
      chain: body.chain,
      description: body.description,
      eligibility: body.eligibility || [],
      requirements: body.requirements || [],
      snapshotDate: body.snapshotDate ? new Date(body.snapshotDate) : undefined,
      claimStartDate:
        body.claimStartDate || body.dropTime
          ? new Date(body.claimStartDate || body.dropTime)
          : undefined,
      claimEndDate: body.claimEndDate ? new Date(body.claimEndDate) : undefined,
      estimatedValue: body.estimatedValue,
      websiteUrl: body.website || body.websiteUrl,
      twitterUrl: body.twitter || body.twitterUrl,
    });

    return NextResponse.json({
      success: true,
      data: airdrop,
    });
  } catch (error) {
    console.error("Create Airdrop Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create airdrop",
      },
      { status: 500 },
    );
  }
}
