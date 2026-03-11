import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { binanceAlphaSource } from "@/lib/services/alpha/BinanceAlphaSource";
import {
  fetchHistoryEnrichmentLookup,
  type HistoryEnrichment,
} from "@/lib/services/alpha/history-enrichment";
import type { AlphaToken } from "@/lib/types/alpha.types";
import { AirdropStatus, AirdropType } from "@prisma/client";
import {
  buildCanonicalAliasKeys,
  dedupeEventApiRows,
  deriveCanonicalStatus,
  mergeCanonicalEvents,
  normalizeOfficialTextToEvent,
  normalizeSquarePostToEvent,
  parseSquareProfileHtml,
  type CanonicalEventRecord,
  type CanonicalEventStatus,
  type EventApiRow,
  type EventSourceType,
  type OfficialTextRecord,
  type SquarePostRecord,
} from "@/lib/services/alpha/binance-event-pipeline";

const BINANCE_SQUARE_PROFILE_URL =
  "https://www.binance.com/en/square/profile/BinanceWallet";
const BINANCE_WALLET_TELEGRAM_URL =
  "https://t.me/s/binance_wallet_announcements";
const ANNOUNCEMENT_LINK_RE =
  /https:\/\/www\.binance\.com\/(?:[a-z]{2}\/)?support\/announcement\/detail\/[a-z0-9]+/gi;
const SLOT_RE = /\b\d+(?:\.\d+)?k?\s+slots\b/i;
const TELEGRAM_MESSAGE_RE =
  /<div class="tgme_widget_message text_not_supported_wrap js-widget_message"[^>]*data-post="([^"]+)"[\s\S]*?<div class="tgme_widget_message_text js-message_text" dir="auto">([\s\S]*?)<\/div>[\s\S]*?<a class="tgme_widget_message_date" href="([^"]+)"><time datetime="([^"]+)"/gi;

interface RawSourceSnapshot {
  sourceType: EventSourceType;
  sourceUrl: string | null;
  sourcePublishedAt: Date | null;
  rawText: string;
  parsedPayload?: string | null;
}

interface EventGroup {
  event: CanonicalEventRecord;
  aliases: Set<string>;
  rawSources: Map<string, RawSourceSnapshot>;
}

export interface EventSyncStats {
  squareFetchStatus: "healthy" | "degraded";
  squarePostCount: number;
  parsedSuccessCount: number;
  parseFailureCount: number;
  insertedEvents: number;
  updatedEvents: number;
  dedupedEvents: number;
  enrichmentSuccessCount: number;
  enrichmentFailureCount: number;
  finalScheduleCount: number;
  finalEventCount: number;
  errors: string[];
  newEvents: CanonicalEventRecord[];
}

function sanitize(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value: string): string {
  return sanitize(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractMetaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1];
    if (match) {
      return sanitize(match);
    }
  }

  return null;
}

function extractPublishedAt(html: string): Date | null {
  const patterns = [
    /"datePublished":"([^"]+)"/i,
    /"publishTime":(\d{10,13})/i,
    /"publishedAt":(\d{10,13})/i,
    /"createTime":(\d{10,13})/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1];
    if (!match) {
      continue;
    }

    if (/^\d{10,13}$/.test(match)) {
      const numeric = Number.parseInt(match, 10);
      const millis = match.length === 13 ? numeric : numeric * 1000;
      const parsed = new Date(millis);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
      continue;
    }

    const parsed = new Date(match);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function extractPostText(html: string): string | null {
  return (
    extractMetaContent(html, "og:description") ||
    extractMetaContent(html, "description") ||
    stripHtml(html).match(/Binance (?:Wallet|Alpha)[^.]{0,2000}\./i)?.[0] ||
    null
  );
}

function normalizeLookupKey(value: string | null | undefined): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildSourceKey(source: RawSourceSnapshot): string {
  if (source.sourceUrl) {
    return `${source.sourceType}:${source.sourceUrl}`;
  }

  return `${source.sourceType}:${crypto
    .createHash("sha1")
    .update(source.rawText)
    .digest("hex")}`;
}

function normalizeClaimDay(date: Date | null): Date | null {
  if (!date) {
    return null;
  }

  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function formatTokenAmount(event: {
  tokenAmountText?: string | null;
  tokenAmount?: number | null;
  symbol?: string | null;
}): string | null {
  if (event.tokenAmountText) {
    return event.tokenAmountText;
  }

  if (
    event.tokenAmount !== null &&
    event.tokenAmount !== undefined &&
    event.symbol
  ) {
    const numeric = Number.isInteger(event.tokenAmount)
      ? String(event.tokenAmount)
      : event.tokenAmount.toFixed(4).replace(/\.?0+$/, "");
    return `${numeric} ${event.symbol}`;
  }

  return null;
}

function extractSlotText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.match(SLOT_RE)?.[0] || null;
}

function buildRequirements(event: CanonicalEventRecord): string[] {
  return [
    event.sourceType === "BINANCE_SQUARE"
      ? "Official Binance Wallet post"
      : event.sourceType === "BINANCE_WALLET_TELEGRAM"
        ? "Official Binance Wallet announcement mirror"
      : event.sourceType === "BINANCE_ANNOUNCEMENT"
        ? "Official Binance announcement"
        : "Official Binance Alpha token signal",
    event.requiredAlphaPoints !== null
      ? `Alpha Points: ${event.requiredAlphaPoints}`
      : null,
    event.deductPoints !== null ? `Deduct: ${event.deductPoints} points` : null,
    event.phaseLabel ? `Round: ${event.phaseLabel}` : null,
  ].filter((value): value is string => Boolean(value));
}

function buildDescription(event: CanonicalEventRecord): string {
  const parts = [
    event.notes,
    event.latestPrice ? `Price: $${event.latestPrice}` : null,
    event.sourceType === "BINANCE_SQUARE"
      ? "Source: Binance Wallet"
      : event.sourceType === "BINANCE_WALLET_TELEGRAM"
        ? "Source: Binance Wallet Announcements"
        : null,
  ].filter((value): value is string => Boolean(value));

  return parts.join(" | ");
}

function mapEventStatusToScheduleStatus(
  status: CanonicalEventStatus,
): "UPCOMING" | "TODAY" | "LIVE" | "ENDED" {
  switch (status) {
    case "today":
      return "TODAY";
    case "live":
    case "claimable":
      return "LIVE";
    case "ended":
      return "ENDED";
    default:
      return "UPCOMING";
  }
}

function finalizeEventStatus(
  event: CanonicalEventRecord,
  now: Date,
): CanonicalEventStatus {
  const baseStatus = deriveCanonicalStatus(event, now);
  const anchorTime = event.claimStartAt || event.listingTime;

  if (
    (baseStatus === "claimable" || baseStatus === "live") &&
    !event.onlineAirdrop &&
    !event.onlineTge &&
    anchorTime &&
    now.getTime() - anchorTime.getTime() > 36 * 60 * 60 * 1000
  ) {
    return "ended";
  }

  return baseStatus;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });

  if (
    response.status === 202 ||
    response.headers?.get?.("x-amzn-waf-action") === "challenge"
  ) {
    throw new Error(
      `Binance returned an AWS WAF challenge for ${url}; raw server-side HTML fetching is blocked`,
    );
  }

  if (!response.ok || response.status !== 200) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  const html = await response.text();
  if (
    html.includes("window.awsWafCookieDomainList") ||
    html.includes("window.gokuProps")
  ) {
    throw new Error(
      `Binance returned a challenge page for ${url}; raw server-side HTML fetching is blocked`,
    );
  }

  return html;
}

async function fetchSquarePost(
  sourceUrl: string,
): Promise<{ post: SquarePostRecord; announcementUrls: string[] }> {
  const html = await fetchHtml(sourceUrl);
  const sourceRawText = extractPostText(html);
  if (!sourceRawText) {
    throw new Error(`Unable to extract post text from ${sourceUrl}`);
  }

  return {
    post: {
      sourceType: "BINANCE_SQUARE",
      sourceUrl,
      sourcePublishedAt: extractPublishedAt(html),
      sourceRawText,
    },
    announcementUrls: [...new Set(html.match(ANNOUNCEMENT_LINK_RE) || [])],
  };
}

async function fetchAnnouncementRecord(
  sourceUrl: string,
): Promise<{ record: OfficialTextRecord; rawSource: RawSourceSnapshot } | null> {
  const html = await fetchHtml(sourceUrl);
  const title = extractMetaContent(html, "og:title");
  const description = extractMetaContent(html, "og:description");
  const sourceRawText = sanitize([title, description].filter(Boolean).join(". "));

  if (!sourceRawText) {
    return null;
  }

  const record: OfficialTextRecord = {
    sourceType: "BINANCE_ANNOUNCEMENT",
    sourceUrl,
    sourcePublishedAt: extractPublishedAt(html),
    sourceRawText,
  };

  return {
    record,
    rawSource: {
      sourceType: record.sourceType,
      sourceUrl: record.sourceUrl,
      sourcePublishedAt: record.sourcePublishedAt,
      rawText: record.sourceRawText,
      parsedPayload: JSON.stringify({ title, description }),
    },
  };
}

function extractTelegramChannelPosts(html: string): OfficialTextRecord[] {
  const posts: OfficialTextRecord[] = [];

  for (const match of html.matchAll(TELEGRAM_MESSAGE_RE)) {
    const [, , rawTextHtml, href, datetime] = match;
    const sourceRawText = stripHtml(rawTextHtml.replace(/<br\s*\/?>/gi, " "));
    if (!/Binance Alpha|Alpha Points|airdrop/i.test(sourceRawText)) {
      continue;
    }

    const sourcePublishedAt = new Date(datetime);
    posts.push({
      sourceType: "BINANCE_WALLET_TELEGRAM",
      sourceUrl: href,
      sourcePublishedAt: Number.isNaN(sourcePublishedAt.getTime())
        ? null
        : sourcePublishedAt,
      sourceRawText,
    });
  }

  return posts;
}

async function fetchTelegramAnnouncementRecords(): Promise<OfficialTextRecord[]> {
  const html = await fetchHtml(BINANCE_WALLET_TELEGRAM_URL);
  return extractTelegramChannelPosts(html);
}

function inferTokenListEvent(token: AlphaToken, now: Date): CanonicalEventRecord | null {
  if (
    token.isOffline ||
    (!token.onlineAirdrop &&
      !token.onlineTge &&
      (!token.listingTime || token.listingTime.getTime() < now.getTime()))
  ) {
    return null;
  }

  const event: CanonicalEventRecord = {
    dedupeKey: "",
    sourceType: "BINANCE_ALPHA_TOKEN_LIST",
    sourceUrl: null,
    sourcePublishedAt: now,
    sourceRawText: sanitize(
      `${token.name} (${token.symbol}) token-list signal. listing=${
        token.listingTime ? token.listingTime.toISOString() : "unknown"
      } onlineAirdrop=${String(token.onlineAirdrop)} onlineTge=${String(
        token.onlineTge,
      )}`,
    ),
    projectName: token.name,
    symbol: token.symbol,
    eventType: token.onlineTge ? "TGE" : "AIRDROP",
    status: "unknown",
    confidence: 0.7,
    claimStartAt: token.listingTime,
    listingTime: token.listingTime,
    requiredAlphaPoints: null,
    deductPoints: null,
    tokenAmount: null,
    tokenAmountText: null,
    estimatedUsdValue: null,
    chain: token.chain,
    contractAddress: token.contractAddress || null,
    alphaId: token.alphaId,
    latestPrice: token.price > 0 ? token.price : null,
    onlineAirdrop: token.onlineAirdrop,
    onlineTge: token.onlineTge,
    notes: "Derived from Binance Alpha token list state.",
    phaseLabel: null,
  };

  event.status = finalizeEventStatus(event, now);
  event.dedupeKey = buildCanonicalAliasKeys(event)[0];
  return event;
}

function findBestTokenMatch(
  event: CanonicalEventRecord,
  tokens: AlphaToken[],
  tokenBySymbol: Map<string, AlphaToken>,
  tokenByName: Map<string, AlphaToken>,
): AlphaToken | null {
  if (event.symbol) {
    const exact = tokenBySymbol.get(event.symbol.toUpperCase());
    if (exact) {
      return exact;
    }
  }

  const normalizedName = normalizeLookupKey(event.projectName);
  if (!normalizedName) {
    return null;
  }

  if (tokenByName.has(normalizedName)) {
    return tokenByName.get(normalizedName) || null;
  }

  return (
    tokens.find((token) => {
      const tokenName = normalizeLookupKey(token.name);
      return (
        tokenName.includes(normalizedName) || normalizedName.includes(tokenName)
      );
    }) || null
  );
}

function enrichEventWithToken(
  event: CanonicalEventRecord,
  token: AlphaToken | null,
  now: Date,
): CanonicalEventRecord {
  if (!token) {
    event.status = finalizeEventStatus(event, now);
    return event;
  }

  const nextEvent: CanonicalEventRecord = {
    ...event,
    chain: event.chain || token.chain,
    contractAddress: event.contractAddress || token.contractAddress || null,
    alphaId: event.alphaId || token.alphaId,
    latestPrice:
      event.latestPrice !== null && event.latestPrice !== undefined
        ? event.latestPrice
        : token.price > 0
          ? token.price
          : null,
    onlineAirdrop:
      event.onlineAirdrop !== null && event.onlineAirdrop !== undefined
        ? event.onlineAirdrop
        : token.onlineAirdrop,
    onlineTge:
      event.onlineTge !== null && event.onlineTge !== undefined
        ? event.onlineTge
        : token.onlineTge,
    listingTime: event.listingTime || token.listingTime,
  };

  if (!nextEvent.claimStartAt && event.eventType !== "PRE_TGE") {
    nextEvent.claimStartAt = token.listingTime;
  }

  if (
    nextEvent.tokenAmount !== null &&
    nextEvent.tokenAmount !== undefined &&
    nextEvent.latestPrice
  ) {
    nextEvent.estimatedUsdValue =
      Math.round(nextEvent.tokenAmount * nextEvent.latestPrice * 100) / 100;
  }

  nextEvent.status = finalizeEventStatus(nextEvent, now);
  return nextEvent;
}

async function upsertSourceHealth(
  sourceKey: string,
  displayName: string,
  status: "healthy" | "degraded",
  options?: { message?: string; details?: unknown },
): Promise<void> {
  const now = new Date();
  const existing = await (prisma as any).sourceHealth.findUnique({
    where: { sourceKey },
  });

  await (prisma as any).sourceHealth.upsert({
    where: { sourceKey },
    create: {
      sourceKey,
      displayName,
      status,
      lastSuccessAt: status === "healthy" ? now : null,
      lastFailureAt: status === "degraded" ? now : null,
      lastCheckedAt: now,
      consecutiveFailures: status === "degraded" ? 1 : 0,
      message: options?.message || null,
      details: options?.details ? JSON.stringify(options.details) : null,
    },
    update: {
      displayName,
      status,
      lastSuccessAt: status === "healthy" ? now : existing?.lastSuccessAt,
      lastFailureAt: status === "degraded" ? now : existing?.lastFailureAt,
      lastCheckedAt: now,
      consecutiveFailures:
        status === "degraded" ? (existing?.consecutiveFailures || 0) + 1 : 0,
      message: options?.message || null,
      details: options?.details ? JSON.stringify(options.details) : null,
    },
  });
}

async function upsertLegacyRows(event: CanonicalEventRecord): Promise<boolean> {
  const scheduledTime = event.claimStartAt || event.listingTime;
  let scheduleWritten = false;

  if (scheduledTime) {
    await (prisma as any).airdropSchedule.upsert({
      where: { dedupeKey: event.dedupeKey },
      create: {
        dedupeKey: event.dedupeKey,
        token: event.symbol || event.projectName,
        name: event.projectName,
        scheduledTime,
        endTime:
          event.sourceRawText.includes("24-hour") && event.claimStartAt
            ? new Date(event.claimStartAt.getTime() + 24 * 60 * 60 * 1000)
            : null,
        points: event.requiredAlphaPoints,
        deductPoints: event.deductPoints,
        amount: formatTokenAmount(event),
        chain: event.chain || "BSC",
        contractAddress: event.contractAddress,
        status: mapEventStatusToScheduleStatus(event.status),
        type: event.eventType === "PRE_TGE" ? "PRETGE" : event.eventType,
        estimatedPrice: event.latestPrice,
        estimatedValue: event.estimatedUsdValue,
        source: event.sourceType,
        sourceUrl: event.sourceUrl,
        description: buildDescription(event) || event.sourceRawText,
        confidence: event.confidence,
        sourcePublishedAt: event.sourcePublishedAt,
        isActive: event.status !== "ended",
        isVerified:
          event.sourceType === "BINANCE_SQUARE" ||
          event.sourceType === "BINANCE_ANNOUNCEMENT",
        notified: false,
      },
      update: {
        name: event.projectName,
        scheduledTime,
        endTime:
          event.sourceRawText.includes("24-hour") && event.claimStartAt
            ? new Date(event.claimStartAt.getTime() + 24 * 60 * 60 * 1000)
            : null,
        points: event.requiredAlphaPoints,
        deductPoints: event.deductPoints,
        amount: formatTokenAmount(event),
        chain: event.chain || "BSC",
        contractAddress: event.contractAddress,
        status: mapEventStatusToScheduleStatus(event.status),
        type: event.eventType === "PRE_TGE" ? "PRETGE" : event.eventType,
        estimatedPrice: event.latestPrice,
        estimatedValue: event.estimatedUsdValue,
        source: event.sourceType,
        sourceUrl: event.sourceUrl,
        description: buildDescription(event) || event.sourceRawText,
        confidence: event.confidence,
        sourcePublishedAt: event.sourcePublishedAt,
        isActive: event.status !== "ended",
        isVerified:
          event.sourceType === "BINANCE_SQUARE" ||
          event.sourceType === "BINANCE_ANNOUNCEMENT",
      },
    });
    scheduleWritten = true;
  }

  if (event.symbol) {
    const existing = await prisma.airdrop.findUnique({
      where: { token: event.symbol },
    });
    const payload = {
      token: event.symbol,
      name: event.projectName,
      chain: event.chain || "BSC",
      contractAddress: event.contractAddress,
      airdropAmount: formatTokenAmount(event),
      claimStartDate: event.claimStartAt,
      listingDate: event.listingTime,
      requiredPoints: event.requiredAlphaPoints,
      deductPoints: event.deductPoints,
      type: (event.eventType === "PRE_TGE"
        ? "PRETGE"
        : event.eventType) as AirdropType,
      status: (
        event.status === "claimable" || event.status === "live"
          ? "CLAIMABLE"
          : event.status === "ended"
            ? "ENDED"
            : "UPCOMING"
      ) as AirdropStatus,
      estimatedValue: event.estimatedUsdValue,
      description: buildDescription(event) || event.sourceRawText,
      eligibility: JSON.stringify(buildRequirements(event)),
      requirements: JSON.stringify(buildRequirements(event)),
      verified:
        event.sourceType === "BINANCE_SQUARE" ||
        event.sourceType === "BINANCE_ANNOUNCEMENT",
      isActive: event.status !== "ended",
      notes: event.notes,
    };

    if (existing) {
      await prisma.airdrop.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.airdrop.create({ data: payload });
    }
  }

  return scheduleWritten;
}

function mapDbEventToApiRow(event: any): EventApiRow {
  return {
    id: event.id,
    projectName: event.projectName,
    symbol: event.symbol,
    chain: event.chain || "BSC",
    type: event.eventType,
    status: event.status.toLowerCase(),
    claimStartDate: event.claimStartAt?.toISOString() || null,
    listingTime: event.listingTime?.toISOString() || null,
    requiredPoints: event.requiredAlphaPoints,
    deductPoints: event.deductPoints,
    airdropAmount: event.tokenAmountText || formatTokenAmount(event),
    estimatedValue: event.estimatedUsdValue,
    contractAddress: event.contractAddress,
    scheduleStatus: event.status.toLowerCase(),
    sourceUrl: event.sourceUrl,
    confidence: event.confidence,
  };
}

function mapCanonicalEventToApiRow(event: CanonicalEventRecord): EventApiRow {
  return {
    id: event.sourceUrl || event.dedupeKey,
    projectName: event.projectName,
    symbol: event.symbol,
    chain: event.chain || "BSC",
    type: event.eventType,
    status: event.status,
    claimStartDate: event.claimStartAt?.toISOString() || null,
    listingTime: event.listingTime?.toISOString() || null,
    requiredPoints: event.requiredAlphaPoints,
    deductPoints: event.deductPoints,
    airdropAmount: formatTokenAmount(event),
    estimatedValue: event.estimatedUsdValue,
    contractAddress: event.contractAddress,
    scheduleStatus: event.status,
    sourceUrl: event.sourceUrl,
    confidence: event.confidence,
  };
}

let hasWarnedLegacyEventFallback = false;
let hasWarnedCurrentEnrichmentFallback = false;
let hasWarnedCanonicalEventProbeFailure = false;
let canonicalEventTableReadinessCache:
  | {
      checkedAt: number;
      exists: boolean;
    }
  | null = null;

const CANONICAL_EVENT_TABLE_READINESS_TTL_MS = 60_000;

function getPrismaRecord(): Record<string, unknown> {
  return prisma as unknown as Record<string, unknown>;
}

function hasDelegateMethod(delegate: unknown, methodName: string): boolean {
  return Boolean(
    delegate &&
      typeof delegate === "object" &&
      methodName in delegate &&
      typeof (delegate as Record<string, unknown>)[methodName] === "function",
  );
}

function getPrismaDelegate(
  modelName: string,
  methods: string[],
): Record<string, (...args: any[]) => Promise<any>> {
  const delegate = getPrismaRecord()[modelName];
  const missingMethods = methods.filter(
    (methodName) => !hasDelegateMethod(delegate, methodName),
  );

  if (missingMethods.length === 0) {
    return delegate as Record<string, (...args: any[]) => Promise<any>>;
  }

  throw new Error(
    `Canonical event storage is not ready because the Prisma model delegate "${modelName}" is missing methods: ${missingMethods.join(
      ", ",
    )}. Run "npm run db:generate" and apply the Prisma schema changes with "npm run db:push" or your migration workflow.`,
  );
}

function createCanonicalEventStorageSetupError(reason: string): Error {
  return new Error(
    `Canonical event storage is not ready because ${reason}. Run "npm run db:generate" and apply the Prisma schema changes with "npm run db:push" or your migration workflow.`,
  );
}

function ensureCanonicalEventPersistenceReady(): void {
  getPrismaDelegate("airdropEvent", ["findUnique", "upsert", "count", "findMany"]);
  getPrismaDelegate("eventRawSource", ["upsert"]);
  getPrismaDelegate("sourceHealth", ["findUnique", "upsert"]);
}

function isCanonicalEventStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Canonical event storage is not ready|airdropEvent|AirdropEvent|airdrop_events|eventRawSource|event_raw_sources|sourceHealth|source_health|P2021|relation .* does not exist|table .* does not exist/i.test(
    message,
  );
}

function warnLegacyEventFallback(error: unknown): void {
  if (hasWarnedLegacyEventFallback) {
    return;
  }

  hasWarnedLegacyEventFallback = true;
  console.warn(
    "[binance-event-tracker] Falling back to legacy airdrop tables because canonical event storage is unavailable. Run \"npm run db:generate\" and apply the Prisma schema changes to restore the official event pipeline.",
    error instanceof Error ? error.message : String(error),
  );
}

function warnCurrentEnrichmentFallback(error: unknown): void {
  if (hasWarnedCurrentEnrichmentFallback) {
    return;
  }

  hasWarnedCurrentEnrichmentFallback = true;
  console.warn(
    "[binance-event-tracker] Canonical event storage is unavailable. Serving current enrichment data instead of stale legacy rows while Binance Square HTML remains blocked by WAF.",
    error instanceof Error ? error.message : String(error),
  );
}

function warnCanonicalEventProbeFailure(error: unknown): void {
  if (hasWarnedCanonicalEventProbeFailure) {
    return;
  }

  hasWarnedCanonicalEventProbeFailure = true;
  console.warn(
    "[binance-event-tracker] Canonical event readiness probe failed; attempting the direct canonical read path.",
    error instanceof Error ? error.message : String(error),
  );
}

async function probeCanonicalEventTableExists(): Promise<boolean | null> {
  const now = Date.now();
  if (
    canonicalEventTableReadinessCache &&
    now - canonicalEventTableReadinessCache.checkedAt <
      CANONICAL_EVENT_TABLE_READINESS_TTL_MS
  ) {
    return canonicalEventTableReadinessCache.exists;
  }

  try {
    const rows = await prisma.$queryRaw<{ ready: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'airdrop_events'
      ) AS ready
    `;
    const exists = Boolean(rows[0]?.ready);
    canonicalEventTableReadinessCache = {
      checkedAt: now,
      exists,
    };
    return exists;
  } catch (error) {
    warnCanonicalEventProbeFailure(error);
    canonicalEventTableReadinessCache = null;
    return null;
  }
}

async function getFallbackApiRows(
  error: unknown,
  options?: {
    status?: string | null;
    chain?: string | null;
    limit?: number;
  },
): Promise<EventApiRow[]> {
  try {
    const enrichedRows = await getCurrentEnrichedApiRows(options);
    if (enrichedRows.length > 0) {
      warnCurrentEnrichmentFallback(error);
      return enrichedRows;
    }
  } catch (enrichmentError) {
    console.warn(
      "[binance-event-tracker] Current enrichment fallback failed; reverting to legacy rows.",
      enrichmentError instanceof Error
        ? enrichmentError.message
        : String(enrichmentError),
    );
  }

  warnLegacyEventFallback(error);
  return getLegacyApiRows(options);
}

function normalizeLegacyEventType(value?: string | null): CanonicalEventRecord["eventType"] {
  switch ((value || "").toUpperCase()) {
    case "TGE":
      return "TGE";
    case "PRETGE":
    case "PRE_TGE":
      return "PRE_TGE";
    default:
      return "AIRDROP";
  }
}

function normalizeLegacyStatus(value?: string | null): CanonicalEventStatus {
  switch ((value || "").toUpperCase()) {
    case "TODAY":
      return "today";
    case "LIVE":
      return "live";
    case "CLAIMABLE":
      return "claimable";
    case "ENDED":
      return "ended";
    case "UPCOMING":
    case "SNAPSHOT":
      return "upcoming";
    default:
      return "unknown";
  }
}

function mapLegacyScheduleToApiRow(schedule: any): EventApiRow {
  const status = normalizeLegacyStatus(schedule.status);
  const scheduledAt = schedule.scheduledTime?.toISOString() || null;

  return {
    id: schedule.id,
    projectName: schedule.name,
    symbol: schedule.token || null,
    chain: schedule.chain || "BSC",
    type: normalizeLegacyEventType(schedule.type),
    status,
    claimStartDate: scheduledAt,
    listingTime: scheduledAt,
    requiredPoints: schedule.points ?? null,
    deductPoints: schedule.deductPoints ?? null,
    airdropAmount: schedule.amount ?? null,
    estimatedValue: schedule.estimatedValue ?? null,
    contractAddress: schedule.contractAddress ?? null,
    scheduleStatus: status,
    sourceUrl: schedule.sourceUrl ?? null,
    confidence: schedule.confidence ?? 0.55,
  };
}

function mapLegacyAirdropToApiRow(airdrop: any): EventApiRow {
  const status = normalizeLegacyStatus(airdrop.status);

  return {
    id: airdrop.id,
    projectName: airdrop.name,
    symbol: airdrop.token || null,
    chain: airdrop.chain || "BSC",
    type: normalizeLegacyEventType(airdrop.type),
    status,
    claimStartDate: airdrop.claimStartDate?.toISOString() || null,
    listingTime:
      airdrop.listingDate?.toISOString() ||
      airdrop.claimStartDate?.toISOString() ||
      null,
    requiredPoints: airdrop.requiredPoints ?? null,
    deductPoints: airdrop.deductPoints ?? null,
    airdropAmount: airdrop.airdropAmount ?? null,
    estimatedValue: airdrop.estimatedValue ?? null,
    contractAddress: airdrop.contractAddress ?? null,
    scheduleStatus: status,
    sourceUrl: null,
    confidence: airdrop.verified ? 0.6 : 0.45,
  };
}

function normalizeHistoryEventType(value?: string | null): CanonicalEventRecord["eventType"] {
  switch ((value || "").toUpperCase()) {
    case "TGE":
      return "TGE";
    case "PRETGE":
    case "PRE_TGE":
      return "PRE_TGE";
    default:
      return "AIRDROP";
  }
}

function normalizeHistoryStatus(
  value: string | null | undefined,
  scheduledAt: Date | null,
  now: Date,
): CanonicalEventStatus {
  const normalized = normalizeLegacyStatus(value);
  if (normalized !== "unknown") {
    return normalized;
  }

  if (!scheduledAt) {
    return "unknown";
  }

  const sameUtcDay = scheduledAt.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (scheduledAt.getTime() > now.getTime()) {
    return sameUtcDay ? "today" : "upcoming";
  }

  return "claimable";
}

function buildHistoryAmountText(entry: HistoryEnrichment): string | null {
  if (!entry.amountText) {
    return null;
  }

  const normalized = entry.amountText.trim();
  if (!normalized) {
    return null;
  }

  return /[A-Z]{2,15}/.test(normalized)
    ? normalized
    : `${normalized} ${entry.symbol}`;
}

function buildHistoryRowId(entry: HistoryEnrichment): string {
  return `history:${entry.symbol}:${entry.scheduledAt?.toISOString() || "unknown"}`;
}

function mapHistoryEnrichmentToApiRow(
  entry: HistoryEnrichment,
  token: AlphaToken | null,
  now: Date,
): EventApiRow {
  const scheduledAt = entry.scheduledAt?.toISOString() || null;
  const status = normalizeHistoryStatus(entry.status, entry.scheduledAt, now);

  return {
    id: buildHistoryRowId(entry),
    projectName: entry.name,
    symbol: entry.symbol || null,
    chain: token?.chain || "BSC",
    type: normalizeHistoryEventType(entry.type),
    status,
    claimStartDate: scheduledAt,
    listingTime: scheduledAt,
    requiredPoints: entry.pointsValue,
    deductPoints: null,
    airdropAmount: buildHistoryAmountText(entry),
    estimatedValue: entry.estimatedValue,
    contractAddress: token?.contractAddress || entry.contractAddress,
    scheduleStatus: status,
    sourceUrl: entry.sourceUrl,
    confidence: 0.78,
  };
}

function matchesApiRowFilters(
  row: EventApiRow,
  options?: {
    status?: string | null;
    chain?: string | null;
    limit?: number;
  },
): boolean {
  if (!options?.status) {
    return true;
  }

  const normalizedStatus = options.status.toLowerCase();
  if (normalizedStatus === "claimable") {
    return row.status === "claimable" || row.scheduleStatus === "live";
  }

  return (
    row.status === normalizedStatus || row.scheduleStatus === normalizedStatus
  );
}

function sortApiRows(left: EventApiRow, right: EventApiRow): number {
  const leftTime = left.claimStartDate
    ? new Date(left.claimStartDate).getTime()
    : Number.MAX_SAFE_INTEGER;
  const rightTime = right.claimStartDate
    ? new Date(right.claimStartDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return (right.confidence || 0) - (left.confidence || 0);
}

function buildCurrentFallbackDedupeKey(row: EventApiRow): string {
  const day = row.claimStartDate?.slice(0, 10) || row.listingTime?.slice(0, 10);
  if (row.symbol && day) {
    return `symbol:${row.symbol}:${row.type}:${day}`;
  }

  if (row.projectName && day) {
    return `project:${row.projectName.toLowerCase()}:${row.type}:${day}`;
  }

  if (row.contractAddress && day) {
    return `contract:${row.contractAddress.toLowerCase()}:${row.type}:${day}`;
  }

  return row.sourceUrl || row.id;
}

function dedupeCurrentFallbackRows(rows: EventApiRow[]): EventApiRow[] {
  const deduped = new Map<string, EventApiRow>();

  for (const row of rows) {
    const key = buildCurrentFallbackDedupeKey(row);
    const existing = deduped.get(key);
    if (
      !existing ||
      row.confidence > existing.confidence ||
      (!existing.airdropAmount && row.airdropAmount) ||
      (!existing.requiredPoints && row.requiredPoints) ||
      (!existing.claimStartDate && row.claimStartDate)
    ) {
      deduped.set(key, row);
    }
  }

  return [...deduped.values()];
}

async function getLegacyApiRows(options?: {
  status?: string | null;
  chain?: string | null;
  limit?: number;
}): Promise<EventApiRow[]> {
  const scheduleDelegate = getPrismaRecord().airdropSchedule;
  const schedules = hasDelegateMethod(scheduleDelegate, "findMany")
    ? await (scheduleDelegate as Record<string, (...args: any[]) => Promise<any>>).findMany({
        where: {
          ...(options?.chain ? { chain: options.chain } : {}),
        },
        select: {
          id: true,
          token: true,
          name: true,
          chain: true,
          scheduledTime: true,
          points: true,
          deductPoints: true,
          amount: true,
          estimatedValue: true,
          contractAddress: true,
          status: true,
          type: true,
          sourceUrl: true,
        },
        orderBy: [{ scheduledTime: "asc" }, { updatedAt: "desc" }],
      })
    : [];

  const airdrops = await prisma.airdrop.findMany({
    where: {
      ...(options?.chain ? { chain: options.chain } : {}),
    },
    select: {
      id: true,
      token: true,
      name: true,
      chain: true,
      type: true,
      status: true,
      claimStartDate: true,
      listingDate: true,
      requiredPoints: true,
      deductPoints: true,
      airdropAmount: true,
      estimatedValue: true,
      contractAddress: true,
      verified: true,
      createdAt: true,
    },
    orderBy: [{ claimStartDate: "asc" }, { createdAt: "desc" }],
  });

  return dedupeEventApiRows([
    ...schedules.map(mapLegacyScheduleToApiRow),
    ...airdrops.map(mapLegacyAirdropToApiRow),
  ])
    .filter((row) => matchesApiRowFilters(row, options))
    .sort(sortApiRows)
    .slice(0, options?.limit || 500);
}

async function getCurrentEnrichedApiRows(
  options?: {
    status?: string | null;
    chain?: string | null;
    limit?: number;
  },
  now: Date = new Date(),
): Promise<EventApiRow[]> {
  const [historyLookup, tokens, telegramPosts] = await Promise.all([
    fetchHistoryEnrichmentLookup(),
    binanceAlphaSource.fetchTokens().catch(() => [] as AlphaToken[]),
    fetchTelegramAnnouncementRecords().catch(() => [] as OfficialTextRecord[]),
  ]);
  const tokenBySymbol = new Map(
    tokens.map((token) => [token.symbol.toUpperCase(), token]),
  );
  const tokenByName = new Map(
    tokens.map((token) => [normalizeLookupKey(token.name), token]),
  );

  const rows: EventApiRow[] = [];
  for (const entries of historyLookup.values()) {
    for (const entry of entries) {
      const token = tokenBySymbol.get(entry.symbol.toUpperCase()) || null;
      if (options?.chain && token?.chain !== options.chain) {
        continue;
      }

      if (options?.chain && !token && entry.chainId) {
        continue;
      }

      rows.push(mapHistoryEnrichmentToApiRow(entry, token, now));
    }
  }

  for (const post of telegramPosts) {
    const normalizedEvent = normalizeOfficialTextToEvent(post, now);
    if (!normalizedEvent.symbol) {
      continue;
    }

    const token = findBestTokenMatch(
      normalizedEvent,
      tokens,
      tokenBySymbol,
      tokenByName,
    );
    if (options?.chain && token?.chain !== options.chain) {
      continue;
    }

    rows.push(mapCanonicalEventToApiRow(enrichEventWithToken(normalizedEvent, token, now)));
  }

  for (const token of tokens) {
    if (options?.chain && token.chain !== options.chain) {
      continue;
    }

    const inferred = inferTokenListEvent(token, now);
    if (!inferred) {
      continue;
    }

    rows.push(mapCanonicalEventToApiRow(inferred));
  }

  return dedupeCurrentFallbackRows(rows)
    .filter((row) => matchesApiRowFilters(row, options))
    .sort(sortApiRows)
    .slice(0, options?.limit || 500);
}

export class BinanceEventTrackerService {
  async syncEvents(now: Date = new Date()): Promise<EventSyncStats> {
    ensureCanonicalEventPersistenceReady();

    const stats: EventSyncStats = {
      squareFetchStatus: "healthy",
      squarePostCount: 0,
      parsedSuccessCount: 0,
      parseFailureCount: 0,
      insertedEvents: 0,
      updatedEvents: 0,
      dedupedEvents: 0,
      enrichmentSuccessCount: 0,
      enrichmentFailureCount: 0,
      finalScheduleCount: 0,
      finalEventCount: 0,
      errors: [],
      newEvents: [],
    };

    const groupedEvents = new Map<string, EventGroup>();
    const aliasToGroupKey = new Map<string, string>();

    const addCandidate = (
      candidate: CanonicalEventRecord,
      rawSource: RawSourceSnapshot,
    ) => {
      const aliases = buildCanonicalAliasKeys(candidate);
      const matchedAlias = aliases.find((alias) => aliasToGroupKey.has(alias));
      if (!matchedAlias) {
        const group: EventGroup = {
          event: candidate,
          aliases: new Set(aliases),
          rawSources: new Map([[buildSourceKey(rawSource), rawSource]]),
        };
        groupedEvents.set(candidate.dedupeKey, group);
        for (const alias of aliases) {
          aliasToGroupKey.set(alias, candidate.dedupeKey);
        }
        return;
      }

      const groupKey = aliasToGroupKey.get(matchedAlias)!;
      const group = groupedEvents.get(groupKey);
      if (!group) {
        return;
      }

      group.event = mergeCanonicalEvents(group.event, candidate, now);
      groupedEvents.delete(groupKey);
      groupedEvents.set(group.event.dedupeKey, group);
      group.rawSources.set(buildSourceKey(rawSource), rawSource);
      group.aliases = new Set([
        ...group.aliases,
        ...aliases,
        ...buildCanonicalAliasKeys(group.event),
      ]);
      for (const alias of group.aliases) {
        aliasToGroupKey.set(alias, group.event.dedupeKey);
      }
    };

    let squareUrls: string[] = [];
    try {
      const squareProfileHtml = await fetchHtml(BINANCE_SQUARE_PROFILE_URL);
      squareUrls = parseSquareProfileHtml(squareProfileHtml).slice(0, 12);
      stats.squarePostCount = squareUrls.length;
      await upsertSourceHealth("square:binance-wallet", "Binance Wallet Square", "healthy", {
        details: { count: squareUrls.length },
      });
    } catch (error) {
      stats.squareFetchStatus = "degraded";
      stats.errors.push(
        `Square fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await upsertSourceHealth("square:binance-wallet", "Binance Wallet Square", "degraded", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    for (const squareUrl of squareUrls) {
      try {
        const { post, announcementUrls } = await fetchSquarePost(squareUrl);
        const squareEvent = normalizeSquarePostToEvent(post, now);
        addCandidate(squareEvent, {
          sourceType: post.sourceType,
          sourceUrl: post.sourceUrl,
          sourcePublishedAt: post.sourcePublishedAt,
          rawText: post.sourceRawText,
          parsedPayload: JSON.stringify({
            projectName: squareEvent.projectName,
            symbol: squareEvent.symbol,
            eventType: squareEvent.eventType,
          }),
        });
        stats.parsedSuccessCount++;

        for (const announcementUrl of announcementUrls) {
          try {
            const announcement = await fetchAnnouncementRecord(announcementUrl);
            if (!announcement) {
              continue;
            }
            addCandidate(
              normalizeOfficialTextToEvent(announcement.record, now),
              announcement.rawSource,
            );
          } catch (error) {
            stats.errors.push(
              `Announcement verify failed (${announcementUrl}): ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      } catch (error) {
        stats.parseFailureCount++;
        stats.errors.push(
          `Square parse failed (${squareUrl}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    let telegramPosts: OfficialTextRecord[] = [];
    try {
      telegramPosts = await fetchTelegramAnnouncementRecords();
      await upsertSourceHealth(
        "telegram:binance-wallet",
        "Binance Wallet Announcements",
        "healthy",
        {
          details: { count: telegramPosts.length },
        },
      );
    } catch (error) {
      stats.errors.push(
        `Telegram mirror fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await upsertSourceHealth(
        "telegram:binance-wallet",
        "Binance Wallet Announcements",
        "degraded",
        {
          message: error instanceof Error ? error.message : String(error),
        },
      );
    }

    for (const post of telegramPosts) {
      try {
        const event = normalizeOfficialTextToEvent(post, now);
        if (!event.symbol) {
          continue;
        }

        addCandidate(event, {
          sourceType: post.sourceType,
          sourceUrl: post.sourceUrl,
          sourcePublishedAt: post.sourcePublishedAt,
          rawText: post.sourceRawText,
          parsedPayload: JSON.stringify({
            projectName: event.projectName,
            symbol: event.symbol,
            eventType: event.eventType,
          }),
        });
        stats.parsedSuccessCount++;
      } catch (error) {
        stats.parseFailureCount++;
        stats.errors.push(
          `Telegram mirror parse failed (${post.sourceUrl}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    let tokens: AlphaToken[] = [];
    try {
      tokens = await binanceAlphaSource.fetchTokens();
      await upsertSourceHealth("alpha:token-list", "Binance Alpha Token List", "healthy", {
        details: { count: tokens.length },
      });
    } catch (error) {
      stats.errors.push(
        `Alpha token fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await upsertSourceHealth("alpha:token-list", "Binance Alpha Token List", "degraded", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const tokenBySymbol = new Map(
      tokens.map((token) => [token.symbol.toUpperCase(), token]),
    );
    const tokenByName = new Map(
      tokens.map((token) => [normalizeLookupKey(token.name), token]),
    );

    for (const token of tokens) {
      const inferred = inferTokenListEvent(token, now);
      if (!inferred) {
        continue;
      }
      addCandidate(inferred, {
        sourceType: inferred.sourceType,
        sourceUrl: inferred.sourceUrl,
        sourcePublishedAt: inferred.sourcePublishedAt,
        rawText: inferred.sourceRawText,
        parsedPayload: JSON.stringify({
          alphaId: inferred.alphaId,
          onlineAirdrop: inferred.onlineAirdrop,
          onlineTge: inferred.onlineTge,
        }),
      });
    }

    const finalGroups = [...groupedEvents.values()].map((group) => {
      const token = findBestTokenMatch(
        group.event,
        tokens,
        tokenBySymbol,
        tokenByName,
      );
      group.event = enrichEventWithToken(group.event, token, now);
      if (token) {
        stats.enrichmentSuccessCount++;
      } else {
        stats.enrichmentFailureCount++;
      }
      return group;
    });

    stats.dedupedEvents = finalGroups.length;

    for (const group of finalGroups) {
      const existing = await (prisma as any).airdropEvent.findUnique({
        where: { dedupeKey: group.event.dedupeKey },
      });
      const persisted = await (prisma as any).airdropEvent.upsert({
        where: { dedupeKey: group.event.dedupeKey },
        create: {
          dedupeKey: group.event.dedupeKey,
          sourceType: group.event.sourceType,
          sourceUrl: group.event.sourceUrl,
          sourcePublishedAt: group.event.sourcePublishedAt,
          sourceRawText: group.event.sourceRawText,
          projectName: group.event.projectName,
          symbol: group.event.symbol,
          eventType: group.event.eventType,
          status: group.event.status.toUpperCase(),
          confidence: group.event.confidence,
          claimStartAt: group.event.claimStartAt,
          listingTime: group.event.listingTime,
          normalizedClaimDay: normalizeClaimDay(
            group.event.claimStartAt || group.event.listingTime,
          ),
          requiredAlphaPoints: group.event.requiredAlphaPoints,
          deductPoints: group.event.deductPoints,
          tokenAmount: group.event.tokenAmount,
          tokenAmountText: formatTokenAmount(group.event),
          estimatedUsdValue: group.event.estimatedUsdValue,
          chain: group.event.chain,
          contractAddress: group.event.contractAddress,
          alphaId: group.event.alphaId,
          latestPrice: group.event.latestPrice,
          onlineAirdrop: group.event.onlineAirdrop,
          onlineTge: group.event.onlineTge,
          notes: group.event.notes,
          phaseLabel: group.event.phaseLabel,
        },
        update: {
          sourceType: group.event.sourceType,
          sourceUrl: group.event.sourceUrl,
          sourcePublishedAt: group.event.sourcePublishedAt,
          sourceRawText: group.event.sourceRawText,
          projectName: group.event.projectName,
          symbol: group.event.symbol,
          eventType: group.event.eventType,
          status: group.event.status.toUpperCase(),
          confidence: group.event.confidence,
          claimStartAt: group.event.claimStartAt,
          listingTime: group.event.listingTime,
          normalizedClaimDay: normalizeClaimDay(
            group.event.claimStartAt || group.event.listingTime,
          ),
          requiredAlphaPoints: group.event.requiredAlphaPoints,
          deductPoints: group.event.deductPoints,
          tokenAmount: group.event.tokenAmount,
          tokenAmountText: formatTokenAmount(group.event),
          estimatedUsdValue: group.event.estimatedUsdValue,
          chain: group.event.chain,
          contractAddress: group.event.contractAddress,
          alphaId: group.event.alphaId,
          latestPrice: group.event.latestPrice,
          onlineAirdrop: group.event.onlineAirdrop,
          onlineTge: group.event.onlineTge,
          notes: group.event.notes,
          phaseLabel: group.event.phaseLabel,
        },
      });

      if (existing) {
        stats.updatedEvents++;
      } else {
        stats.insertedEvents++;
        stats.newEvents.push(group.event);
      }

      for (const rawSource of group.rawSources.values()) {
        await (prisma as any).eventRawSource.upsert({
          where: { sourceKey: buildSourceKey(rawSource) },
          create: {
            eventId: persisted.id,
            sourceType: rawSource.sourceType,
            sourceKey: buildSourceKey(rawSource),
            sourceUrl: rawSource.sourceUrl,
            sourcePublishedAt: rawSource.sourcePublishedAt,
            rawText: rawSource.rawText,
            parsedPayload: rawSource.parsedPayload || null,
          },
          update: {
            eventId: persisted.id,
            sourcePublishedAt: rawSource.sourcePublishedAt,
            rawText: rawSource.rawText,
            parsedPayload: rawSource.parsedPayload || null,
          },
        });
      }

      if (await upsertLegacyRows(group.event)) {
        stats.finalScheduleCount++;
      }
    }

    stats.finalEventCount = await (prisma as any).airdropEvent.count();
    return stats;
  }

  async getApiRows(options?: {
    status?: string | null;
    chain?: string | null;
    limit?: number;
  }): Promise<EventApiRow[]> {
    let airdropEvent: Record<string, (...args: any[]) => Promise<any>>;

    try {
      airdropEvent = getPrismaDelegate("airdropEvent", ["findMany"]);
    } catch (error) {
      return getFallbackApiRows(error, options);
    }

    const canonicalEventTableExists = await probeCanonicalEventTableExists();
    if (canonicalEventTableExists === false) {
      return getFallbackApiRows(
        createCanonicalEventStorageSetupError(
          'the "airdrop_events" table is missing from the connected database',
        ),
        options,
      );
    }

    try {
      const events = await airdropEvent.findMany({
        where: {
          ...(options?.chain ? { chain: options.chain } : {}),
        },
        orderBy: [
          { claimStartAt: "asc" },
          { sourcePublishedAt: "desc" },
          { confidence: "desc" },
        ],
      });

      return dedupeEventApiRows(events.map(mapDbEventToApiRow))
        .filter((row) => matchesApiRowFilters(row, options))
        .sort(sortApiRows)
        .slice(0, options?.limit || 500);
    } catch (error) {
      if (!isCanonicalEventStorageError(error)) {
        throw error;
      }
      canonicalEventTableReadinessCache = {
        checkedAt: Date.now(),
        exists: false,
      };
      return getFallbackApiRows(error, options);
    }
  }

  buildUiRow(row: EventApiRow): EventApiRow & {
    logo: string;
    claimEndDate: string | null;
    requirements: string[];
    estimatedPrice: number | null;
    pointsText: string | null;
    slotText: string | null;
    description: string;
    website: string;
    twitter: string;
    score: number;
  } {
    return {
      ...row,
      logo: "🎁",
      claimEndDate: null,
      requirements: [],
      estimatedPrice: null,
      pointsText:
        row.requiredPoints !== null && row.requiredPoints !== undefined
          ? String(row.requiredPoints)
          : null,
      slotText: extractSlotText(row.airdropAmount),
      description: row.sourceUrl ? `Official source: ${row.sourceUrl}` : "",
      website: "",
      twitter: "",
      score: Math.round((row.confidence || 0) * 100),
    };
  }
}

export const binanceEventTrackerService = new BinanceEventTrackerService();
