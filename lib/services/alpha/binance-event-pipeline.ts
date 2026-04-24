const BINANCE_HOST = "https://www.binance.com";

export type EventSourceType =
  | "BINANCE_SQUARE"
  | "BINANCE_WALLET_TELEGRAM"
  | "BINANCE_ANNOUNCEMENT"
  | "BINANCE_ALPHA_TOKEN_LIST"
  | "DATABASE_CACHE";

export type CanonicalEventType = "AIRDROP" | "TGE" | "PRE_TGE";

export type CanonicalEventStatus =
  | "upcoming"
  | "today"
  | "live"
  | "claimable"
  | "ended"
  | "unknown";

export interface SquarePostRecord {
  sourceType: Extract<EventSourceType, "BINANCE_SQUARE">;
  sourceUrl: string;
  sourcePublishedAt: Date | null;
  sourceRawText: string;
}

export interface OfficialTextRecord {
  sourceType: Exclude<EventSourceType, "BINANCE_ALPHA_TOKEN_LIST" | "DATABASE_CACHE">;
  sourceUrl: string | null;
  sourcePublishedAt: Date | null;
  sourceRawText: string;
}

export interface CanonicalEventRecord {
  dedupeKey: string;
  sourceType: EventSourceType;
  sourceUrl: string | null;
  sourcePublishedAt: Date | null;
  sourceRawText: string;
  projectName: string;
  symbol: string | null;
  eventType: CanonicalEventType;
  status: CanonicalEventStatus;
  confidence: number;
  claimStartAt: Date | null;
  listingTime: Date | null;
  requiredAlphaPoints: number | null;
  deductPoints: number | null;
  tokenAmount: number | null;
  tokenAmountText: string | null;
  estimatedUsdValue: number | null;
  chain: string | null;
  contractAddress: string | null;
  alphaId: string | null;
  latestPrice: number | null;
  onlineAirdrop: boolean | null;
  onlineTge: boolean | null;
  notes: string | null;
  phaseLabel: string | null;
}

export interface EventApiRow {
  id: string;
  projectName: string;
  symbol: string | null;
  chain: string;
  type: CanonicalEventType;
  status: CanonicalEventStatus;
  claimStartDate: string | null;
  listingTime: string | null;
  requiredPoints: number | null;
  deductPoints: number | null;
  airdropAmount: string | null;
  estimatedValue: number | null;
  contractAddress: string | null;
  scheduleStatus: CanonicalEventStatus | null;
  sourceUrl: string | null;
  confidence: number;
  sourceType?: EventSourceType | null;
  pointsText?: string | null;
  slotText?: string | null;
}

const MONTH_PATTERN =
  "January|Jan|February|Feb|March|Mar|April|Apr|May|June|Jun|July|Jul|August|Aug|September|Sept|Sep|October|Oct|November|Nov|December|Dec";
const ABSOLUTE_DATE_TIME_RE = new RegExp(
  `(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?,?\\s+(?:at|from)\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)?(?:\\s+to\\s+\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)?)?\\s*\\(UTC\\)`,
  "i",
);
const DATE_WITH_TIME_RANGE_RE = new RegExp(
  `(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?\\s*\\|\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)?\\s*(?:-|to)\\s*\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)?\\s*\\(UTC\\)`,
  "i",
);
const TIME_FIRST_ABSOLUTE_DATE_TIME_RE = new RegExp(
  `(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)?\\s*(?:-|to)\\s*\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)?\\s*\\(UTC\\)\\s+on\\s+(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?`,
  "i",
);
const RELATIVE_DAY_TIME_RE =
  /\b(today|tomorrow)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*\(UTC\)/i;
const ACTION_TIME_WITH_DATE_RE = new RegExp(
  `\\b(?:claim(?:ing)?(?:\\s+the\\s+(?:token|airdrop))?(?:\\s+and\\s+start\\s+trading)?|start\\s+trading|trading\\s+(?:starts?|opens?|opened)|debut\\s+and\\s+trading\\s+open(?:\\s+as\\s+of)?)\\b[^.]{0,120}?(?:on\\s+)?(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?[^\\d]{0,24}(?:at\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)?\\s*\\(UTC\\)`,
  "i",
);
const ACTION_TIME_ONLY_RE =
  /\b(?:claim(?:ing)?(?:\s+the\s+(?:token|airdrop))?(?:\s+and\s+start\s+trading)?|start\s+trading|trading\s+(?:starts?|opens?|opened))\b[^.]{0,120}?(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*\(UTC\)/i;
const DATE_ONLY_RE = new RegExp(
  `(${MONTH_PATTERN})\\s+(\\d{1,2})(?:,\\s*(\\d{4}))?`,
  "i",
);
const SYMBOL_RE = /\(([A-Z0-9]{2,15})\)/;
const AMOUNT_RE =
  /(?:claim(?:\s+(?:an?|the))?(?:\s+token)?(?:\s+airdrop)?(?:\s+of)?|receive|users can claim(?:\s+(?:an?|the))?(?:\s+token)?(?:\s+airdrop)?(?:\s+of)?|eligible users can claim(?:\s+(?:an?|the))?(?:\s+token)?(?:\s+airdrop)?(?:\s+of)?|reward(?:s)?(?: pool)?(?: of)?)\s+([\d,]+(?:\.\d+)?)\s+([A-Z0-9]{2,15})\s+tokens?/i;
const POINTS_RE =
  /(?:at least|minimum of|have|with)\s+([\d,]+)\s+Binance Alpha Points/i;
const DEDUCT_RE =
  /(?:consume|deduct(?:ed)?|spend|cost(?:s)?|priced at)\s+([\d,]+)\s+Binance Alpha Points/i;
const CLAIM_NOW_RE = /\b(claim now|claimable now|now claimable|can now claim)\b/i;
const END_RE = /\b(ended|expired|claim period ended|closed)\b/i;
const LIVE_NOW_RE = /\b(rewards are here|reward(?:s)? are here|is now live|now live)\b/i;
const BOOSTER_RE = /\bbooster\b/i;
const PRE_TGE_RE = /\bpre[\s-]?tge\b/i;
const TGE_RE = /\btge\b/i;
const AIRDROP_RE = /\bairdrop\b/i;
const ROUND_RE = /\b(second wave|wave 2|round 2|phase 2|season \d+)\b/i;
const IGNORED_SYMBOLS = new Set(["UTC"]);

function sanitizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isGenericListSourceUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /\/history\.html(?:[?#].*)?$/i.test(value);
}

function parsePositiveNumber(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function extractSymbol(text: string): string | null {
  for (const match of text.matchAll(new RegExp(SYMBOL_RE.source, "g"))) {
    const candidate = match[1]?.toUpperCase();
    if (candidate && !IGNORED_SYMBOLS.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function startOfUtcDay(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function buildUtcDate(
  year: number,
  monthName: string,
  day: number,
  hour: number = 0,
  minute: number = 0,
): Date | null {
  const monthIndex = new Date(`${monthName} 1, 2000 UTC`).getUTCMonth();
  if (!Number.isFinite(monthIndex)) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sourceTextHasExplicitClockTime(text: string): boolean {
  return (
    ABSOLUTE_DATE_TIME_RE.test(text) ||
    DATE_WITH_TIME_RANGE_RE.test(text) ||
    TIME_FIRST_ABSOLUTE_DATE_TIME_RE.test(text) ||
    RELATIVE_DAY_TIME_RE.test(text) ||
    ACTION_TIME_WITH_DATE_RE.test(text) ||
    ACTION_TIME_ONLY_RE.test(text)
  );
}

function parseUtcClockTime(
  hourText: string,
  minuteText?: string | null,
  meridiem?: string | null,
): { hour: number; minute: number } | null {
  let hour = Number.parseInt(hourText, 10);
  const minute = minuteText ? Number.parseInt(minuteText, 10) : 0;

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  if (meridiem) {
    const normalizedMeridiem = meridiem.toUpperCase();
    if (hour < 1 || hour > 12) {
      return null;
    }

    if (normalizedMeridiem === "AM") {
      hour = hour === 12 ? 0 : hour;
    } else if (normalizedMeridiem === "PM") {
      hour = hour === 12 ? 12 : hour + 12;
    } else {
      return null;
    }
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function buildDateFromAnchor(
  anchorDate: Date,
  hour: number,
  minute: number,
): Date | null {
  const parsed = new Date(anchorDate);
  parsed.setUTCHours(hour, minute, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickAnchorDate(text: string, sourcePublishedAt: Date | null): Date | null {
  const relativeDayMatch = text.match(/\b(today|tomorrow)\b/i);
  if (relativeDayMatch && sourcePublishedAt) {
    const parsed = new Date(sourcePublishedAt);
    parsed.setUTCHours(0, 0, 0, 0);

    if (relativeDayMatch[1]?.toLowerCase() === "tomorrow") {
      parsed.setUTCDate(parsed.getUTCDate() + 1);
    }

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateMatch = text.match(DATE_ONLY_RE);
  if (dateMatch) {
    const [, monthName, dayText, yearText] = dateMatch;
    const year =
      yearText !== undefined
        ? Number.parseInt(yearText, 10)
        : sourcePublishedAt?.getUTCFullYear();
    if (year) {
      return buildUtcDate(year, monthName, Number.parseInt(dayText, 10));
    }
  }

  if (!sourcePublishedAt) {
    return null;
  }

  const parsed = new Date(sourcePublishedAt);
  parsed.setUTCHours(0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickPriorityActionDate(
  text: string,
  sourcePublishedAt: Date | null,
): Date | null {
  const actionWithDateMatch = text.match(ACTION_TIME_WITH_DATE_RE);
  if (actionWithDateMatch) {
    const [, monthName, dayText, yearText, hourText, minuteText, meridiem] =
      actionWithDateMatch;
    const year =
      yearText !== undefined
        ? Number.parseInt(yearText, 10)
        : sourcePublishedAt?.getUTCFullYear();
    const parsedTime = parseUtcClockTime(hourText, minuteText, meridiem);

    if (year && parsedTime) {
      return buildUtcDate(
        year,
        monthName,
        Number.parseInt(dayText, 10),
        parsedTime.hour,
        parsedTime.minute,
      );
    }
  }

  const actionTimeOnlyMatch = text.match(ACTION_TIME_ONLY_RE);
  if (!actionTimeOnlyMatch) {
    return null;
  }

  const [, hourText, minuteText, meridiem] = actionTimeOnlyMatch;
  const parsedTime = parseUtcClockTime(hourText, minuteText, meridiem);
  const anchorDate = pickAnchorDate(text, sourcePublishedAt);

  if (!parsedTime || !anchorDate) {
    return null;
  }

  return buildDateFromAnchor(anchorDate, parsedTime.hour, parsedTime.minute);
}

function pickFirstDate(
  text: string,
  sourcePublishedAt: Date | null,
  eventType?: CanonicalEventType,
): Date | null {
  if (eventType === "TGE") {
    const actionDate = pickPriorityActionDate(text, sourcePublishedAt);
    if (actionDate) {
      return actionDate;
    }
  }

  const explicitDateTimeMatch = text.match(ABSOLUTE_DATE_TIME_RE);
  if (explicitDateTimeMatch) {
    const [, monthName, dayText, yearText, hourText, minuteText, meridiem] =
      explicitDateTimeMatch;
    const year =
      yearText !== undefined
        ? Number.parseInt(yearText, 10)
        : sourcePublishedAt?.getUTCFullYear();
    const parsedTime = parseUtcClockTime(hourText, minuteText, meridiem);
    if (year && parsedTime) {
      return buildUtcDate(
        year,
        monthName,
        Number.parseInt(dayText, 10),
        parsedTime.hour,
        parsedTime.minute,
      );
    }
  }

  const dateWithTimeRangeMatch = text.match(DATE_WITH_TIME_RANGE_RE);
  if (dateWithTimeRangeMatch) {
    const [, monthName, dayText, yearText, hourText, minuteText, meridiem] =
      dateWithTimeRangeMatch;
    const year =
      yearText !== undefined
        ? Number.parseInt(yearText, 10)
        : sourcePublishedAt?.getUTCFullYear();
    const parsedTime = parseUtcClockTime(hourText, minuteText, meridiem);
    if (year && parsedTime) {
      return buildUtcDate(
        year,
        monthName,
        Number.parseInt(dayText, 10),
        parsedTime.hour,
        parsedTime.minute,
      );
    }
  }

  const timeFirstDateTimeMatch = text.match(TIME_FIRST_ABSOLUTE_DATE_TIME_RE);
  if (timeFirstDateTimeMatch) {
    const [, hourText, minuteText, meridiem, monthName, dayText, yearText] =
      timeFirstDateTimeMatch;
    const year =
      yearText !== undefined
        ? Number.parseInt(yearText, 10)
        : sourcePublishedAt?.getUTCFullYear();
    const parsedTime = parseUtcClockTime(hourText, minuteText, meridiem);
    if (year && parsedTime) {
      return buildUtcDate(
        year,
        monthName,
        Number.parseInt(dayText, 10),
        parsedTime.hour,
        parsedTime.minute,
      );
    }
  }

  const relativeDayMatch = text.match(RELATIVE_DAY_TIME_RE);
  if (relativeDayMatch && sourcePublishedAt) {
    const [, relativeDay, hourText, minuteText, meridiem] = relativeDayMatch;
    const parsedTime = parseUtcClockTime(hourText, minuteText, meridiem);
    if (!parsedTime) {
      return null;
    }

    const parsed = new Date(sourcePublishedAt);
    parsed.setUTCHours(
      parsedTime.hour,
      parsedTime.minute,
      0,
      0,
    );

    if (relativeDay.toLowerCase() === "tomorrow") {
      parsed.setUTCDate(parsed.getUTCDate() + 1);
    }

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateMatch = text.match(DATE_ONLY_RE);
  if (dateMatch) {
    const [, monthName, dayText, yearText] = dateMatch;
    const year =
      yearText !== undefined
        ? Number.parseInt(yearText, 10)
        : sourcePublishedAt?.getUTCFullYear();
    if (year) {
      return buildUtcDate(year, monthName, Number.parseInt(dayText, 10));
    }
  }

  if (sourcePublishedAt && LIVE_NOW_RE.test(text)) {
    return new Date(sourcePublishedAt);
  }

  return null;
}

function extractProjectName(text: string, symbol: string | null): string {
  if (symbol) {
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const beforeSymbol = text.match(
      new RegExp(
        `(?:feature|announces?|launch(?:es|ing)?|introduces?|for|second wave of|wave 2 of|round 2 of|phase 2 of)\\s+(.+?)\\s+\\(${escapedSymbol}\\)`,
        "i",
      ),
    );
    if (beforeSymbol?.[1]) {
      return sanitizeWhitespace(beforeSymbol[1]).replace(/^(the)\s+/i, "");
    }

    const bareSymbol = text.match(
      new RegExp(`(.+?)\\s+\\(${escapedSymbol}\\)`, "i"),
    );
    if (bareSymbol?.[1]) {
      const candidate = sanitizeWhitespace(bareSymbol[1])
        .replace(/^(Binance (?:Alpha|Wallet) (?:will be the first platform to feature|announces?))\s+/i, "")
        .replace(/^(the)\s+/i, "");
      if (candidate && candidate.length <= 80) {
        return candidate;
      }
    }
  }

  const fallback = text.match(/Binance (?:Wallet|Alpha) announces? the\s+(.+?)(?:\.|,)/i);
  if (fallback?.[1]) {
    return sanitizeWhitespace(fallback[1]).replace(/^(the)\s+/i, "");
  }

  return symbol || "Unknown Project";
}

function detectPhaseLabel(text: string): string | null {
  const match = text.match(ROUND_RE);
  if (!match?.[1]) {
    return null;
  }

  return sanitizeWhitespace(match[1]).toLowerCase().replace(/\s+/g, "-");
}

function deriveEventType(text: string): CanonicalEventType {
  const hasAirdrop = AIRDROP_RE.test(text);
  if (BOOSTER_RE.test(text) || PRE_TGE_RE.test(text)) {
    return "PRE_TGE";
  }

  if (TGE_RE.test(text) && !hasAirdrop) {
    return "TGE";
  }

  return "AIRDROP";
}

function deriveConfidence(event: {
  sourceType: EventSourceType;
  symbol: string | null;
  claimStartAt: Date | null;
  listingTime: Date | null;
  requiredAlphaPoints: number | null;
  hasExplicitTime: boolean;
}): number {
  const hasToken = Boolean(event.symbol);
  const hasTime = Boolean(event.claimStartAt || event.listingTime);
  const hasThreshold = event.requiredAlphaPoints !== null;

  if (event.sourceType === "BINANCE_SQUARE") {
    if (hasToken && hasTime && hasThreshold) return 1;
    if (hasToken && hasTime && event.hasExplicitTime) return 0.95;
    if (hasToken) return 0.9;
    return 0.5;
  }

  if (event.sourceType === "BINANCE_WALLET_TELEGRAM") {
    if (hasToken && hasTime && hasThreshold) return 0.96;
    if (hasToken && hasTime) return 0.92;
    if (hasToken) return 0.88;
    return 0.5;
  }

  if (event.sourceType === "BINANCE_ANNOUNCEMENT") {
    return 0.85;
  }

  if (event.sourceType === "BINANCE_ALPHA_TOKEN_LIST") {
    return hasToken ? 0.7 : 0.5;
  }

  return 0.5;
}

export function deriveCanonicalStatus(
  input: Pick<
    CanonicalEventRecord,
    | "eventType"
    | "claimStartAt"
    | "listingTime"
    | "sourceRawText"
    | "onlineAirdrop"
    | "onlineTge"
  >,
  now: Date = new Date(),
): CanonicalEventStatus {
  const text = input.sourceRawText || "";

  if (END_RE.test(text)) {
    return "ended";
  }

  if (CLAIM_NOW_RE.test(text) || input.onlineAirdrop) {
    return "claimable";
  }

  const effectiveTime = input.claimStartAt || input.listingTime;
  if (!effectiveTime) {
    return "unknown";
  }

  if (effectiveTime.getTime() <= now.getTime()) {
    const sameUtcDay = startOfUtcDay(effectiveTime) === startOfUtcDay(now);
    if (
      sameUtcDay &&
      !sourceTextHasExplicitClockTime(text) &&
      !LIVE_NOW_RE.test(text) &&
      !input.onlineAirdrop &&
      !input.onlineTge
    ) {
      return "today";
    }

    if (input.eventType === "PRE_TGE" || input.onlineTge) {
      return "live";
    }

    return "claimable";
  }

  const sameUtcDay = startOfUtcDay(effectiveTime) === startOfUtcDay(now);
  return sameUtcDay ? "today" : "upcoming";
}

function compareSourcePriority(
  left: EventSourceType,
  right: EventSourceType,
): number {
  const priority: Record<EventSourceType, number> = {
    BINANCE_SQUARE: 4,
    BINANCE_WALLET_TELEGRAM: 3,
    BINANCE_ANNOUNCEMENT: 2,
    BINANCE_ALPHA_TOKEN_LIST: 1,
    DATABASE_CACHE: 0,
  };

  return priority[left] - priority[right];
}

function isValuePresent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function prefersCandidate(
  left:
    | CanonicalEventRecord
    | EventApiRow,
  right:
    | CanonicalEventRecord
    | EventApiRow,
): boolean {
  if (left.confidence !== right.confidence) {
    return left.confidence > right.confidence;
  }

  const leftHasAmount = isValuePresent("tokenAmount" in left ? left.tokenAmount : left.airdropAmount);
  const rightHasAmount = isValuePresent("tokenAmount" in right ? right.tokenAmount : right.airdropAmount);
  if (leftHasAmount !== rightHasAmount) {
    return leftHasAmount;
  }

  const leftHasTime = isValuePresent(
    "claimStartAt" in left ? left.claimStartAt || left.listingTime : left.claimStartDate || left.listingTime,
  );
  const rightHasTime = isValuePresent(
    "claimStartAt" in right ? right.claimStartAt || right.listingTime : right.claimStartDate || right.listingTime,
  );
  if (leftHasTime !== rightHasTime) {
    return leftHasTime;
  }

  if ("sourceType" in left && "sourceType" in right) {
    const leftSourceType = left.sourceType;
    const rightSourceType = right.sourceType;
    if (leftSourceType && rightSourceType) {
      const sourceDelta = compareSourcePriority(leftSourceType, rightSourceType);
      if (sourceDelta !== 0) {
        return sourceDelta > 0;
      }
    }
  }

  return true;
}

export function parseSquareProfileHtml(html: string): string[] {
  const matches = html.match(/href="([^"]*\/square\/post\/[^"]+)"/gi) || [];
  const urls = new Set<string>();

  for (const match of matches) {
    const href = match.match(/href="([^"]+)"/i)?.[1];
    if (!href) {
      continue;
    }

    const absoluteUrl = href.startsWith("http") ? href : `${BINANCE_HOST}${href}`;
    urls.add(absoluteUrl);
  }

  return [...urls];
}

export function buildCanonicalDedupeKey(
  event: Pick<
    CanonicalEventRecord,
    | "sourceUrl"
    | "symbol"
    | "projectName"
    | "eventType"
    | "claimStartAt"
    | "listingTime"
    | "contractAddress"
    | "phaseLabel"
  >,
): string {
  if (event.sourceUrl) {
    return `url:${event.sourceUrl}`;
  }

  const normalizedDay = startOfUtcDay(event.claimStartAt || event.listingTime);
  const phaseSuffix = event.phaseLabel ? `:${event.phaseLabel}` : "";

  if (event.symbol && normalizedDay) {
    return `symbol:${event.symbol}:${event.eventType}:${normalizedDay}${phaseSuffix}`;
  }

  if (event.projectName && normalizedDay) {
    return `project:${event.projectName.toLowerCase()}:${event.eventType}:${normalizedDay}${phaseSuffix}`;
  }

  if (event.contractAddress && normalizedDay) {
    return `contract:${event.contractAddress.toLowerCase()}:${event.eventType}:${normalizedDay}${phaseSuffix}`;
  }

  return `fallback:${event.projectName.toLowerCase()}:${event.eventType}${phaseSuffix}`;
}

export function buildCanonicalAliasKeys(
  event: Pick<
    CanonicalEventRecord,
    | "sourceUrl"
    | "symbol"
    | "projectName"
    | "eventType"
    | "claimStartAt"
    | "listingTime"
    | "contractAddress"
    | "phaseLabel"
  >,
): string[] {
  const normalizedDay = startOfUtcDay(event.claimStartAt || event.listingTime);
  const phaseSuffix = event.phaseLabel ? `:${event.phaseLabel}` : "";
  const aliases = new Set<string>();

  if (event.sourceUrl) {
    aliases.add(`url:${event.sourceUrl}`);
  }

  if (event.symbol && normalizedDay) {
    aliases.add(`symbol:${event.symbol}:${event.eventType}:${normalizedDay}${phaseSuffix}`);
  }

  if (event.projectName && normalizedDay) {
    aliases.add(
      `project:${event.projectName.toLowerCase()}:${event.eventType}:${normalizedDay}${phaseSuffix}`,
    );
  }

  if (event.contractAddress && normalizedDay) {
    aliases.add(
      `contract:${event.contractAddress.toLowerCase()}:${event.eventType}:${normalizedDay}${phaseSuffix}`,
    );
  }

  if (aliases.size === 0) {
    aliases.add(`fallback:${event.projectName.toLowerCase()}:${event.eventType}${phaseSuffix}`);
  }

  return [...aliases];
}

export function normalizeOfficialTextToEvent(
  post: OfficialTextRecord,
  now: Date = new Date(),
): CanonicalEventRecord {
  const sourceRawText = sanitizeWhitespace(post.sourceRawText);
  const hasExplicitTime = sourceTextHasExplicitClockTime(sourceRawText);
  const symbol = extractSymbol(sourceRawText);
  const eventType = deriveEventType(sourceRawText);
  const claimStartAt = pickFirstDate(
    sourceRawText,
    post.sourcePublishedAt,
    eventType,
  );
  const requiredAlphaPoints = parsePositiveNumber(
    sourceRawText.match(POINTS_RE)?.[1],
  );
  const deductPoints = parsePositiveNumber(sourceRawText.match(DEDUCT_RE)?.[1]);
  const amountMatch = sourceRawText.match(AMOUNT_RE);
  const tokenAmount = parsePositiveNumber(amountMatch?.[1]);
  const tokenAmountText =
    amountMatch?.[1] && amountMatch?.[2]
      ? `${amountMatch[1].replace(/,/g, "")} ${amountMatch[2]}`
      : null;
  const projectName = extractProjectName(sourceRawText, symbol);
  const phaseLabel = detectPhaseLabel(sourceRawText);
  const listingTime = eventType === "TGE" ? claimStartAt : null;
  const confidence = deriveConfidence({
    sourceType: post.sourceType,
    symbol,
    claimStartAt,
    listingTime,
    requiredAlphaPoints,
    hasExplicitTime,
  });

  const event: CanonicalEventRecord = {
    dedupeKey: "",
    sourceType: post.sourceType,
    sourceUrl: post.sourceUrl,
    sourcePublishedAt: post.sourcePublishedAt,
    sourceRawText,
    projectName,
    symbol,
    eventType,
    status: "unknown",
    confidence,
    claimStartAt,
    listingTime,
    requiredAlphaPoints,
    deductPoints,
    tokenAmount,
    tokenAmountText,
    estimatedUsdValue: null,
    chain: null,
    contractAddress: null,
    alphaId: null,
    latestPrice: null,
    onlineAirdrop: null,
    onlineTge: null,
    notes: null,
    phaseLabel,
  };

  event.status = deriveCanonicalStatus(event, now);
  event.dedupeKey = buildCanonicalDedupeKey(event);

  return event;
}

export function normalizeSquarePostToEvent(
  post: SquarePostRecord,
  now: Date = new Date(),
): CanonicalEventRecord {
  return normalizeOfficialTextToEvent(post, now);
}

function mergeNotes(
  preferred: string | null,
  fallback: string | null,
): string | null {
  if (preferred && fallback && preferred !== fallback) {
    return `${preferred} | ${fallback}`;
  }

  return preferred || fallback;
}

export function mergeCanonicalEvents(
  left: CanonicalEventRecord,
  right: CanonicalEventRecord,
  now: Date = new Date(),
): CanonicalEventRecord {
  const preferred = prefersCandidate(left, right) ? left : right;
  const fallback = preferred === left ? right : left;

  const merged: CanonicalEventRecord = {
    ...preferred,
    sourcePublishedAt: preferred.sourcePublishedAt || fallback.sourcePublishedAt,
    claimStartAt: preferred.claimStartAt || fallback.claimStartAt,
    listingTime: preferred.listingTime || fallback.listingTime,
    requiredAlphaPoints:
      preferred.requiredAlphaPoints ?? fallback.requiredAlphaPoints,
    deductPoints: preferred.deductPoints ?? fallback.deductPoints,
    tokenAmount: preferred.tokenAmount ?? fallback.tokenAmount,
    tokenAmountText: preferred.tokenAmountText || fallback.tokenAmountText,
    estimatedUsdValue:
      preferred.estimatedUsdValue ?? fallback.estimatedUsdValue,
    chain: preferred.chain || fallback.chain,
    contractAddress: preferred.contractAddress || fallback.contractAddress,
    alphaId: preferred.alphaId || fallback.alphaId,
    latestPrice: preferred.latestPrice ?? fallback.latestPrice,
    onlineAirdrop: preferred.onlineAirdrop ?? fallback.onlineAirdrop,
    onlineTge: preferred.onlineTge ?? fallback.onlineTge,
    notes: mergeNotes(preferred.notes, fallback.notes),
    phaseLabel: preferred.phaseLabel || fallback.phaseLabel,
  };

  merged.status = deriveCanonicalStatus(merged, now);
  merged.dedupeKey = buildCanonicalDedupeKey(merged);

  return merged;
}

function buildApiDedupeKey(row: EventApiRow): string {
  const day =
    row.claimStartDate?.slice(0, 10) || row.listingTime?.slice(0, 10);

  if (row.symbol && day) {
    return `symbol:${row.symbol}:${row.type}:${day}`;
  }

  if (row.projectName && day) {
    return `project:${row.projectName.toLowerCase()}:${row.type}:${day}`;
  }

  if (row.contractAddress && day) {
    return `contract:${row.contractAddress.toLowerCase()}:${row.type}:${day}`;
  }

  if (row.sourceUrl && !isGenericListSourceUrl(row.sourceUrl)) {
    return `url:${row.sourceUrl}`;
  }

  return row.id;
}

function hasUsefulApiAmount(row: EventApiRow): boolean {
  return Boolean(
    row.airdropAmount &&
      row.airdropAmount.trim() &&
      row.airdropAmount.trim().toUpperCase() !== "TBA",
  );
}

function hasSpecificApiTime(row: EventApiRow): boolean {
  const value = row.claimStartDate || row.listingTime;
  if (!value) {
    return false;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getUTCHours() !== 0 ||
    date.getUTCMinutes() !== 0 ||
    date.getUTCSeconds() !== 0
  );
}

function getApiRowCompletenessScore(row: EventApiRow): number {
  let score = 0;

  if (hasUsefulApiAmount(row)) score += 8;
  if ((row.requiredPoints ?? 0) > 0) score += 6;
  if ((row.deductPoints ?? 0) > 0) score += 2;
  if (row.estimatedValue && row.estimatedValue > 0) score += 2;
  if (row.contractAddress) score += 2;
  if (row.claimStartDate || row.listingTime) score += 2;
  if (hasSpecificApiTime(row)) score += 3;
  if (row.sourceUrl && !isGenericListSourceUrl(row.sourceUrl)) score += 1;

  return score;
}

function prefersApiRowCandidate(left: EventApiRow, right: EventApiRow): boolean {
  const leftCompleteness = getApiRowCompletenessScore(left);
  const rightCompleteness = getApiRowCompletenessScore(right);
  if (leftCompleteness !== rightCompleteness) {
    return leftCompleteness > rightCompleteness;
  }

  return prefersCandidate(left, right);
}

export function dedupeEventApiRows(rows: EventApiRow[]): EventApiRow[] {
  const deduped = new Map<string, EventApiRow>();

  for (const row of rows) {
    const key = buildApiDedupeKey(row);
    const existing = deduped.get(key);
    if (!existing || prefersApiRowCandidate(row, existing)) {
      deduped.set(key, row);
    }
  }

  return [...deduped.values()];
}

function buildApiAssetDedupeKey(row: EventApiRow): string {
  const symbol = row.symbol?.trim().toUpperCase();
  if (symbol) {
    return `symbol:${symbol}`;
  }

  const contractAddress = row.contractAddress?.trim().toLowerCase();
  if (contractAddress) {
    return `contract:${contractAddress}`;
  }

  return `project:${row.projectName.trim().toLowerCase()}`;
}

function getApiRowTimestamp(row: EventApiRow): number {
  const value = row.claimStartDate || row.listingTime;
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function prefersApiAssetCandidate(
  left: EventApiRow,
  right: EventApiRow,
): boolean {
  const leftCompleteness = getApiRowCompletenessScore(left);
  const rightCompleteness = getApiRowCompletenessScore(right);
  if (leftCompleteness !== rightCompleteness) {
    return leftCompleteness > rightCompleteness;
  }

  const leftTimestamp = getApiRowTimestamp(left);
  const rightTimestamp = getApiRowTimestamp(right);
  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp > rightTimestamp;
  }

  return prefersCandidate(left, right);
}

export function dedupeEventApiRowsByAsset(rows: EventApiRow[]): EventApiRow[] {
  const deduped = new Map<string, EventApiRow>();

  for (const row of rows) {
    const key = buildApiAssetDedupeKey(row);
    const existing = deduped.get(key);
    if (!existing || prefersApiAssetCandidate(row, existing)) {
      deduped.set(key, row);
    }
  }

  return [...deduped.values()];
}
