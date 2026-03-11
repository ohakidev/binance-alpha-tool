/**
 * Telegram Notification Service
 * Handles Telegram delivery for airdrop, reminder, and live notifications.
 */

import TelegramBot from "node-telegram-bot-api";

export type Language = "th" | "en";
export type MessageType = "info" | "warning" | "success" | "error";

export interface AirdropAlertData {
  name: string;
  symbol: string;
  chain: string;
  status: string;
  claimStartDate?: Date;
  claimEndDate?: Date;
  estimatedPrice?: number;
  estimatedValue?: number;
  airdropAmount?: string;
  requirements?: string[];
  requiredPoints?: number;
  pointsText?: string;
  deductPoints?: number;
  slotText?: string;
  contractAddress?: string;
  marketCap?: number;
}

export interface SnapshotAlertData {
  name: string;
  symbol: string;
  snapshotDate?: Date;
  requiredPoints?: number;
  requirements?: string[];
}

export interface ClaimableAlertData {
  name: string;
  symbol: string;
  claimEndDate?: Date;
  claimAmount?: string;
  requiredPoints?: number;
}

export interface AirdropReminderData {
  name: string;
  symbol: string;
  scheduledTime: Date;
  minutesUntil: number;
  chain: string;
  points?: number | null;
  pointsText?: string | null;
  amount?: string | null;
  slotText?: string | null;
  contractAddress?: string | null;
  type?: string;
  estimatedPrice?: number | null;
  estimatedValue?: number | null;
  marketCap?: number | null;
}

export interface StabilityWarningData {
  stabilityScore: number;
  riskLevel: string;
  volatilityIndex: number;
  priceChange: number;
}

export interface TelegramConfig {
  token?: string;
  chatId?: string;
  language?: Language;
}

const DEFAULT_WEBSITE_URL = "https://binance-alpha-tool-chi.vercel.app";
const DIVIDER = "--------------------";

const getWebsiteUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return DEFAULT_WEBSITE_URL;
  }

  return envUrl;
};

const WEBSITE_URL = getWebsiteUrl();

const CHAIN_TO_DEXSCREENER: Record<string, string> = {
  BSC: "bsc",
  BNB: "bsc",
  "BNB Smart Chain": "bsc",
  Ethereum: "ethereum",
  ETH: "ethereum",
  Polygon: "polygon",
  MATIC: "polygon",
  Arbitrum: "arbitrum",
  ARB: "arbitrum",
  Optimism: "optimism",
  OP: "optimism",
  Avalanche: "avalanche",
  AVAX: "avalanche",
  Base: "base",
  zkSync: "zksync",
  Scroll: "scroll",
  Linea: "linea",
  Fantom: "fantom",
  FTM: "fantom",
  Solana: "solana",
  SOL: "solana",
  SUI: "sui",
  Sui: "sui",
};

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  th: {
    newAirdrop: "\u{1F680} Airdrop \u0E43\u0E2B\u0E21\u0E48\u0E21\u0E32\u0E41\u0E25\u0E49\u0E27!",
    snapshot: "\u{1F4F8} Snapshot \u0E43\u0E01\u0E25\u0E49\u0E08\u0E30\u0E16\u0E36\u0E07",
    claimable: "\u{1F4B0} \u0E1E\u0E23\u0E49\u0E2D\u0E21 Claim \u0E41\u0E25\u0E49\u0E27",
    ending: "\u{23F3} \u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E40\u0E27\u0E25\u0E32",
    symbol: "Symbol",
    chain: "\u0E40\u0E0A\u0E19",
    airdrop: "Airdrop",
    date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
    time: "\u0E40\u0E27\u0E25\u0E32",
    threshold: "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33",
    deductPoints: "\u0E2B\u0E31\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19",
    amount: "Amount",
    slots: "Slots",
    contract: "Contract",
    claimBefore: "\u0E40\u0E04\u0E25\u0E21\u0E01\u0E48\u0E2D\u0E19",
    claimNow: "\u0E23\u0E35\u0E1A Claim \u0E40\u0E25\u0E22!",
    makeReady: "\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E15\u0E31\u0E27\u0E43\u0E2B\u0E49\u0E1E\u0E23\u0E49\u0E2D\u0E21",
    estimatedValue: "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E42\u0E14\u0E22\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13",
    estimatedFromMcap:
      "\u0E04\u0E32\u0E14\u0E08\u0E32\u0E01 Market Cap",
    checkMore:
      "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21",
    liveNow: "\u{1F525} LIVE \u0E41\u0E25\u0E49\u0E27!",
    startingSoon: "\u{23F0} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E23\u0E47\u0E27\u0E46 \u0E19\u0E35\u0E49",
    minutes: "\u0E19\u0E32\u0E17\u0E35",
    price: "Price",
    type: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",
    startsIn: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E43\u0E19",
  },
  en: {
    newAirdrop: "\u{1F680} New Alpha Drop Available!",
    snapshot: "\u{1F4F8} Snapshot Coming Soon",
    claimable: "\u{1F4B0} Claim Available",
    ending: "\u{23F3} Ending Soon",
    symbol: "Symbol",
    chain: "Chain",
    airdrop: "Airdrop",
    date: "Date",
    time: "Time",
    threshold: "Points Required",
    deductPoints: "Deduct Points",
    amount: "Amount",
    slots: "Slots",
    contract: "Contract",
    claimBefore: "Claim Before",
    claimNow: "Claim Now!",
    makeReady: "Get Ready",
    estimatedValue: "Estimated Value",
    estimatedFromMcap: "Estimated from Market Cap",
    checkMore: "Check more details",
    liveNow: "\u{1F525} LIVE NOW!",
    startingSoon: "\u{23F0} Starting Soon",
    minutes: "minutes",
    price: "Price",
    type: "Type",
    startsIn: "Starts in",
  },
};

const MESSAGE_EMOJIS: Record<MessageType, string> = {
  info: "\u2139\uFE0F",
  warning: "\u26A0\uFE0F",
  success: "\u2705",
  error: "\u274C",
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string;
  private language: Language;
  private isEnabled: boolean;

  constructor(config?: TelegramConfig) {
    const token = config?.token || process.env.TELEGRAM_BOT_TOKEN;
    let chatId = config?.chatId || process.env.TELEGRAM_CHAT_ID || "";

    if (
      chatId &&
      !chatId.startsWith("@") &&
      !chatId.startsWith("-") &&
      Number.isNaN(Number(chatId))
    ) {
      chatId = `@${chatId}`;
    }

    this.chatId = chatId;
    this.language =
      config?.language || (process.env.TELEGRAM_LANGUAGE as Language) || "th";
    this.isEnabled = Boolean(token && this.chatId);

    if (this.isEnabled && token) {
      this.bot = new TelegramBot(token, { polling: false });
      console.log(`Telegram bot initialized - Chat ID: ${this.chatId}`);
    } else {
      console.warn(
        "Telegram bot disabled: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      );
    }
  }

  private t(key: string): string {
    return TRANSLATIONS[this.language][key] || key;
  }

  setLanguage(lang: Language): void {
    this.language = lang;
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private formatThaiDate(date: Date): string {
    return date.toLocaleDateString("th-TH-u-nu-latn", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  private formatThaiTime(date: Date): string {
    const time = date.toLocaleTimeString("th-TH-u-nu-latn", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return `${time} \u0E19.`;
  }

  private requireText(value: string | null | undefined, fallback: string): string {
    const normalized = typeof value === "string" ? value.trim() : "";
    return normalized || fallback;
  }

  private normalizeAirdropAlert(airdrop: AirdropAlertData): AirdropAlertData {
    return {
      ...airdrop,
      name: this.requireText(airdrop.name, "Unknown Project"),
      symbol: this.requireText(airdrop.symbol, "TBA"),
      chain: this.requireText(airdrop.chain, "BSC"),
    };
  }

  private getDexscreenerUrl(chain: string, contractAddress?: string): string {
    const dexChain = CHAIN_TO_DEXSCREENER[chain] || chain.toLowerCase();
    if (contractAddress) {
      return `https://dexscreener.com/${dexChain}/${contractAddress}`;
    }

    return `https://dexscreener.com/${dexChain}`;
  }

  private estimateValueFromMcap(
    marketCap?: number,
  ): { value: number; isEstimated: boolean } | null {
    if (!marketCap || marketCap <= 0) {
      return null;
    }

    if (marketCap >= 1_000_000_000) {
      return { value: 50, isEstimated: true };
    }

    if (marketCap >= 100_000_000) {
      return { value: 20, isEstimated: true };
    }

    if (marketCap >= 10_000_000) {
      return { value: 10, isEstimated: true };
    }

    if (marketCap >= 1_000_000) {
      return { value: 5, isEstimated: true };
    }

    return { value: 1, isEstimated: true };
  }

  private formatValue(
    estimatedValue?: number,
    marketCap?: number,
  ): string | null {
    if (estimatedValue && estimatedValue > 0) {
      return `~$${estimatedValue.toFixed(1)}`;
    }

    const mcapEstimate = this.estimateValueFromMcap(marketCap);
    if (mcapEstimate) {
      return `~$${mcapEstimate.value.toFixed(1)} (${this.t("estimatedFromMcap")})`;
    }

    return null;
  }

  private formatPrice(price?: number | null): string | null {
    if (!price || price <= 0) {
      return null;
    }

    if (price >= 1) {
      return `$${price.toFixed(2)}`;
    }

    if (price >= 0.1) {
      return `$${price.toFixed(4)}`;
    }

    return `$${price.toFixed(6)}`;
  }

  private getPointsText(
    requiredPoints?: number | null,
    pointsText?: string | null,
  ): string | null {
    if (pointsText?.trim()) {
      return pointsText.trim();
    }

    if (requiredPoints) {
      return String(requiredPoints);
    }

    return null;
  }

  private buildFooterLines(): string[] {
    return ["", DIVIDER, `${this.t("checkMore")}: ${WEBSITE_URL}`];
  }

  private appendOptionalLine(lines: string[], label: string, value?: string | null) {
    if (!value) {
      return;
    }

    lines.push(`${label}: ${escapeHtml(value)}`);
  }

  private appendContract(lines: string[], contractAddress?: string | null) {
    if (!contractAddress) {
      return;
    }

    lines.push(`${this.t("contract")}:`);
    lines.push(`<code>${escapeHtml(contractAddress)}</code>`);
  }

  private buildAirdropKeyboard(
    symbol: string,
    chain: string,
    contractAddress?: string,
  ): TelegramBot.SendMessageOptions["reply_markup"] {
    return {
      inline_keyboard: [
        [
          {
            text: "DEXScreener",
            url: this.getDexscreenerUrl(chain, contractAddress),
          },
          {
            text: "MEXC",
            url: `https://www.mexc.com/exchange/${symbol}_USDT`,
          },
        ],
      ],
    };
  }

  private async sendFormattedMessage(
    message: string,
    options: TelegramBot.SendMessageOptions = {},
  ): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      return false;
    }

    await this.bot.sendMessage(this.chatId, message, {
      parse_mode: "HTML",
      ...options,
    });

    return true;
  }

  async sendMessage(
    title: string,
    message: string,
    type: MessageType = "info",
  ): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram notification (disabled):", title, "-", message);
      return false;
    }

    try {
      const formattedMessage = `${MESSAGE_EMOJIS[type]} <b>${escapeHtml(title)}</b>\n\n${escapeHtml(message)}`;
      await this.sendFormattedMessage(formattedMessage);
      console.log(`Message sent to ${this.chatId}`);
      return true;
    } catch (error) {
      this.logError("sendMessage", error);
      return false;
    }
  }

  async sendAirdropAlert(airdrop: AirdropAlertData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const normalizedAirdrop = this.normalizeAirdropAlert(airdrop);
      const message = this.buildEnhancedAirdropMessage(normalizedAirdrop);
      const keyboard = this.buildAirdropKeyboard(
        normalizedAirdrop.symbol,
        normalizedAirdrop.chain,
        normalizedAirdrop.contractAddress,
      );

      await this.sendFormattedMessage(message, {
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });

      console.log(`Airdrop alert sent for: ${airdrop.name}`);
      return true;
    } catch (error) {
      this.logError("sendAirdropAlert", error, airdrop.name);
      return false;
    }
  }

  private buildAirdropMessage(airdrop: AirdropAlertData): string {
    return this.buildEnhancedAirdropMessage(airdrop);
  }

  private buildEnhancedAirdropMessage(airdrop: AirdropAlertData): string {
    const normalizedAirdrop = this.normalizeAirdropAlert(airdrop);
    const lines: string[] = [
      `\u{1F381} <b>Binance Alpha Airdrop Tracker</b>`,
      this.t("newAirdrop"),
      "",
      `<b>${escapeHtml(normalizedAirdrop.name)}</b>`,
      `${this.t("symbol")}: $${escapeHtml(normalizedAirdrop.symbol)}`,
    ];

    if (normalizedAirdrop.claimStartDate) {
      const startDate = new Date(normalizedAirdrop.claimStartDate);
      lines.push(`${this.t("date")}: ${this.formatThaiDate(startDate)}`);
      lines.push(`${this.t("time")}: ${this.formatThaiTime(startDate)}`);
    }

    lines.push("");

    this.appendOptionalLine(lines, this.t("amount"), normalizedAirdrop.airdropAmount);

    const pointsText = this.getPointsText(
      normalizedAirdrop.requiredPoints,
      normalizedAirdrop.pointsText,
    );
    this.appendOptionalLine(lines, "Points", pointsText);
    this.appendOptionalLine(lines, this.t("slots"), normalizedAirdrop.slotText);

    if (normalizedAirdrop.deductPoints && normalizedAirdrop.deductPoints > 0) {
      lines.push(`${this.t("deductPoints")}: -${normalizedAirdrop.deductPoints} pts`);
    }

    const priceText = this.formatPrice(normalizedAirdrop.estimatedPrice);
    this.appendOptionalLine(lines, this.t("price"), priceText);

    const valueText = this.formatValue(
      normalizedAirdrop.estimatedValue,
      normalizedAirdrop.marketCap,
    );
    this.appendOptionalLine(lines, this.t("estimatedValue"), valueText);

    lines.push("");
    lines.push(`${this.t("chain")}: #${escapeHtml(normalizedAirdrop.chain)}`);
    this.appendContract(lines, normalizedAirdrop.contractAddress);
    lines.push(...this.buildFooterLines());

    return lines.join("\n");
  }

  async sendSnapshotAlert(airdrop: SnapshotAlertData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram snapshot alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lines: string[] = [
        `\u{1F4F8} <b>Binance Alpha Airdrop Tracker</b>`,
        this.t("snapshot"),
        "",
        `${this.t("airdrop")}: <b>${escapeHtml(airdrop.name)}</b>`,
        `${this.t("symbol")}: $${escapeHtml(airdrop.symbol)}`,
      ];

      if (airdrop.snapshotDate) {
        const snapshotDate = new Date(airdrop.snapshotDate);
        lines.push(`${this.t("date")}: ${this.formatThaiDate(snapshotDate)}`);
        lines.push(`${this.t("time")}: ${this.formatThaiTime(snapshotDate)}`);
      }

      const pointsText = this.getPointsText(airdrop.requiredPoints);
      this.appendOptionalLine(lines, this.t("threshold"), pointsText);

      lines.push("", this.t("makeReady"));
      lines.push(...this.buildFooterLines());

      await this.sendFormattedMessage(lines.join("\n"));
      return true;
    } catch (error) {
      this.logError("sendSnapshotAlert", error, airdrop.name);
      return false;
    }
  }

  async sendClaimableAlert(airdrop: ClaimableAlertData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram claimable alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lines: string[] = [
        `\u{1F4B0} <b>Binance Alpha Airdrop Tracker</b>`,
        this.t("claimable"),
        "",
        `<b>${escapeHtml(airdrop.name)}</b> ($${escapeHtml(airdrop.symbol)})`,
      ];

      this.appendOptionalLine(lines, this.t("amount"), airdrop.claimAmount);
      const pointsText = this.getPointsText(airdrop.requiredPoints);
      this.appendOptionalLine(lines, this.t("threshold"), pointsText);

      if (airdrop.claimEndDate) {
        const claimEndDate = new Date(airdrop.claimEndDate);
        lines.push(`${this.t("claimBefore")}: ${this.formatThaiDate(claimEndDate)}`);
      }

      lines.push("", this.t("claimNow"));
      lines.push(...this.buildFooterLines());

      await this.sendFormattedMessage(lines.join("\n"));
      return true;
    } catch (error) {
      this.logError("sendClaimableAlert", error, airdrop.name);
      return false;
    }
  }

  async sendStabilityWarning(
    symbol: string,
    data: StabilityWarningData,
  ): Promise<boolean> {
    const message = [
      `Symbol: ${symbol}`,
      `Stability Score: ${data.stabilityScore.toFixed(2)}/100`,
      `Risk Level: ${data.riskLevel}`,
      `Volatility: ${data.volatilityIndex.toFixed(2)}`,
      `Price Change: ${data.priceChange > 0 ? "+" : ""}${data.priceChange.toFixed(2)}%`,
    ].join("\n");

    return this.sendMessage("Stability Warning", message, "warning");
  }

  async sendPriceAlert(
    symbol: string,
    price: number,
    threshold: number,
    direction: "above" | "below",
  ): Promise<boolean> {
    const message = [
      `Symbol: ${symbol}`,
      `Current Price: $${price}`,
      `Threshold: $${threshold}`,
      `Triggered: Price ${direction} threshold`,
    ].join("\n");

    return this.sendMessage("Price Alert", message, "info");
  }

  async sendAirdropReminder(data: AirdropReminderData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop reminder (disabled):", data.name);
      return false;
    }

    try {
      const lines: string[] = [
        `\u{23F0} <b>Binance Alpha Airdrop Reminder</b>`,
        this.t("startingSoon"),
        "",
        `<b>${escapeHtml(data.name)}</b> ($${escapeHtml(data.symbol)})`,
        `${this.t("startsIn")} ${data.minutesUntil} ${this.t("minutes")}`,
        `${this.t("date")}: ${this.formatThaiDate(data.scheduledTime)}`,
        `${this.t("time")}: ${this.formatThaiTime(data.scheduledTime)}`,
        "",
      ];

      const pointsText = this.getPointsText(data.points, data.pointsText);
      this.appendOptionalLine(lines, this.t("threshold"), pointsText);
      this.appendOptionalLine(lines, this.t("amount"), data.amount ?? null);
      this.appendOptionalLine(lines, this.t("slots"), data.slotText ?? null);

      lines.push(`${this.t("chain")}: #${escapeHtml(data.chain)}`);

      if (data.type) {
        lines.push(`${this.t("type")}: ${escapeHtml(data.type)}`);
      }

      const priceText = this.formatPrice(data.estimatedPrice);
      this.appendOptionalLine(lines, this.t("price"), priceText);

      const valueText = this.formatValue(
        data.estimatedValue ?? undefined,
        data.marketCap ?? undefined,
      );
      this.appendOptionalLine(lines, this.t("estimatedValue"), valueText);

      if (data.contractAddress) {
        lines.push("");
        this.appendContract(lines, data.contractAddress);
      }

      lines.push("", this.t("makeReady"));
      lines.push(...this.buildFooterLines());

      await this.sendFormattedMessage(lines.join("\n"), {
        disable_web_page_preview: true,
        reply_markup: this.buildAirdropKeyboard(
          data.symbol,
          data.chain,
          data.contractAddress ?? undefined,
        ),
      });

      console.log(`Airdrop reminder sent for: ${data.name} (${data.minutesUntil}m)`);
      return true;
    } catch (error) {
      this.logError("sendAirdropReminder", error, data.name);
      return false;
    }
  }

  async sendAirdropLive(data: AirdropReminderData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop live (disabled):", data.name);
      return false;
    }

    try {
      const lines: string[] = [
        `\u{1F525} <b>Binance Alpha Airdrop Live</b>`,
        this.t("liveNow"),
        "",
        `<b>${escapeHtml(data.name)}</b> ($${escapeHtml(data.symbol)})`,
        `${this.t("date")}: ${this.formatThaiDate(data.scheduledTime)}`,
        `${this.t("time")}: ${this.formatThaiTime(data.scheduledTime)}`,
        "",
      ];

      const pointsText = this.getPointsText(data.points, data.pointsText);
      this.appendOptionalLine(lines, this.t("threshold"), pointsText);
      this.appendOptionalLine(lines, this.t("amount"), data.amount ?? null);
      this.appendOptionalLine(lines, this.t("slots"), data.slotText ?? null);
      lines.push(`${this.t("chain")}: #${escapeHtml(data.chain)}`);

      if (data.type) {
        lines.push(`${this.t("type")}: ${escapeHtml(data.type)}`);
      }

      const priceText = this.formatPrice(data.estimatedPrice);
      this.appendOptionalLine(lines, this.t("price"), priceText);

      const valueText = this.formatValue(
        data.estimatedValue ?? undefined,
        data.marketCap ?? undefined,
      );
      this.appendOptionalLine(lines, this.t("estimatedValue"), valueText);

      if (data.contractAddress) {
        lines.push("");
        this.appendContract(lines, data.contractAddress);
      }

      lines.push(...this.buildFooterLines());

      await this.sendFormattedMessage(lines.join("\n"), {
        disable_web_page_preview: true,
        reply_markup: this.buildAirdropKeyboard(
          data.symbol,
          data.chain,
          data.contractAddress ?? undefined,
        ),
      });

      console.log(`Airdrop LIVE notification sent for: ${data.name}`);
      return true;
    } catch (error) {
      this.logError("sendAirdropLive", error, data.name);
      return false;
    }
  }

  private logError(method: string, error: unknown, context?: string): void {
    const err = error as { message?: string; response?: { body?: unknown } };
    console.error(`Telegram ${method} error:`, {
      chatId: this.chatId,
      context,
      error: err.message,
      response: err.response?.body,
    });
  }
}

export const telegramService = new TelegramService();
export { TelegramService };
