/**
 * Telegram Notification Service
 * Clean OOP implementation with proper type safety
 * Updated: Thai timezone support, dexscreener links, website link
 */

import TelegramBot from "node-telegram-bot-api";

// ============= Types =============

export type Language = "th" | "en";
export type MessageType = "info" | "warning" | "success" | "error";

export interface AirdropAlertData {
  name: string;
  symbol: string;
  chain: string;
  status: string;
  claimStartDate?: Date;
  claimEndDate?: Date;
  estimatedValue?: number;
  airdropAmount?: string;
  requirements?: string[];
  requiredPoints?: number;
  deductPoints?: number;
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
  amount?: string | null;
  contractAddress?: string | null;
  type?: string;
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

// ============= Constants =============

// Website URL for check more info
// Telegram doesn't allow localhost URLs in inline keyboard buttons
// Always use production URL for inline buttons, fallback to default if localhost
const getWebsiteUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  // If no env URL or it's localhost, use the production fallback
  if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return "https://binance-alpha-tool-chi.vercel.app";
  }
  return envUrl;
};

const WEBSITE_URL = getWebsiteUrl();

// Chain mapping for dexscreener
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
};

// ============= Translations =============

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  th: {
    newAirdrop: "🚀 Airdrop ใหม่มาแล้ว!",
    snapshot: "การ Snapshot กำลังจะมาถึง",
    claimable: "พร้อม Claim แล้ว",
    ending: "ใกล้สิ้นสุด",
    name: "ชื่อ",
    symbol: "สัญลักษณ์",
    chain: "เชน",
    airdrop: "Airdrop",
    start: "เริ่ม",
    date: "วันที่",
    time: "เวลา",
    threshold: "Alpha Points ขั้นต่ำ",
    deductPoints: "หักคะแนน",
    amount: "จำนวน",
    contract: "Contract",
    claimBefore: "Claim ก่อน",
    claimNow: "รีบ Claim เลย!",
    makeReady: "เตรียมตัวให้พร้อม!",
    snapshotSoon: "Snapshot เร็วๆ นี้!",
    hours: "ชั่วโมง",
    estimatedValue: "มูลค่าโดยประมาณ",
    estimatedFromMcap: "คาดการณ์จาก Market Cap",
    checkMore: "ดูรายละเอียดเพิ่มเติมที่เว็บไซต์",
    liveNow: "🔴 LIVE แล้ว!",
    startingSoon: "⏰ เริ่มเร็วๆ นี้!",
    minutes: "นาที",
  },
  en: {
    newAirdrop: "🚀 New Alpha Drop Available!",
    snapshot: "Snapshot Coming Soon",
    claimable: "Claim Available",
    ending: "Ending Soon",
    name: "Name",
    symbol: "Symbol",
    chain: "Chain",
    airdrop: "Airdrop",
    start: "Start",
    date: "Date",
    time: "Time",
    threshold: "Alpha Points Required",
    deductPoints: "Deduct Points",
    amount: "Amount",
    contract: "Contract",
    claimBefore: "Claim Before",
    claimNow: "Claim Now!",
    makeReady: "Get Ready!",
    snapshotSoon: "Snapshot Soon!",
    hours: "hours",
    estimatedValue: "Estimated Value",
    estimatedFromMcap: "Estimated from Market Cap",
    checkMore: "Check more details on website",
    liveNow: "🔴 LIVE NOW!",
    startingSoon: "⏰ Starting Soon!",
    minutes: "minutes",
  },
};

const MESSAGE_EMOJIS: Record<MessageType, string> = {
  info: "ℹ️",
  warning: "⚠️",
  success: "✅",
  error: "❌",
};

// ============= Telegram Service =============

/**
 * Telegram Notification Service
 * Provides methods for sending various types of notifications via Telegram
 */
class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string;
  private language: Language;
  private isEnabled: boolean;

  constructor(config?: TelegramConfig) {
    const token = config?.token || process.env.TELEGRAM_BOT_TOKEN;
    let chatId = config?.chatId || process.env.TELEGRAM_CHAT_ID || "";

    // Auto-add @ prefix if chatId is username without @
    if (
      chatId &&
      !chatId.startsWith("@") &&
      !chatId.startsWith("-") &&
      isNaN(Number(chatId))
    ) {
      chatId = "@" + chatId;
    }

    this.chatId = chatId;
    this.language =
      config?.language || (process.env.TELEGRAM_LANGUAGE as Language) || "th";
    this.isEnabled = !!(token && this.chatId);

    if (this.isEnabled && token) {
      this.bot = new TelegramBot(token, { polling: false });
      console.log(`✅ Telegram bot initialized - Chat ID: ${this.chatId}`);
    } else {
      console.warn(
        "⚠️ Telegram bot disabled: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID",
      );
    }
  }

  /**
   * Get translation for key
   */
  private t(key: string): string {
    return TRANSLATIONS[this.language][key] || key;
  }

  /**
   * Set notification language
   */
  setLanguage(lang: Language): void {
    this.language = lang;
  }

  /**
   * Check if service is enabled
   */
  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Format date to Thai timezone - Date only (DD/MM/YYYY)
   */
  private formatThaiDate(date: Date): string {
    return date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  /**
   * Format time to Thai timezone - Time only (HH:MM น.)
   */
  private formatThaiTime(date: Date): string {
    const time = date.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${time} น.`;
  }

  /**
   * Format datetime to Thai timezone - Full format
   */
  private formatThaiDateTime(date: Date): string {
    return `${this.formatThaiDate(date)} ${this.formatThaiTime(date)}`;
  }

  /**
   * Get dexscreener URL for a token
   */
  private getDexscreenerUrl(chain: string, contractAddress?: string): string {
    const dexChain = CHAIN_TO_DEXSCREENER[chain] || chain.toLowerCase();
    if (contractAddress) {
      return `https://dexscreener.com/${dexChain}/${contractAddress}`;
    }
    return `https://dexscreener.com/${dexChain}`;
  }

  /**
   * Estimate value from market cap if no direct value
   */
  private estimateValueFromMcap(
    marketCap?: number,
  ): { value: number; isEstimated: boolean } | null {
    if (!marketCap || marketCap <= 0) return null;

    // Rough estimation: assume typical airdrop is 1-5% of supply
    // And typical claim amount based on mcap tier
    let estimatedValue = 0;

    if (marketCap >= 1000000000) {
      // >= $1B mcap
      estimatedValue = 50; // ~$50 estimated
    } else if (marketCap >= 100000000) {
      // >= $100M mcap
      estimatedValue = 20; // ~$20 estimated
    } else if (marketCap >= 10000000) {
      // >= $10M mcap
      estimatedValue = 10; // ~$10 estimated
    } else if (marketCap >= 1000000) {
      // >= $1M mcap
      estimatedValue = 5; // ~$5 estimated
    } else {
      estimatedValue = 1; // ~$1 estimated for smaller mcap
    }

    return { value: estimatedValue, isEstimated: true };
  }

  /**
   * Format value with estimation indicator
   */
  private formatValue(
    estimatedValue?: number,
    marketCap?: number,
  ): string | null {
    if (estimatedValue && estimatedValue > 0) {
      return `~$${estimatedValue.toFixed(2)}`;
    }

    const mcapEstimate = this.estimateValueFromMcap(marketCap);
    if (mcapEstimate) {
      return `~$${mcapEstimate.value.toFixed(2)} (${this.t("estimatedFromMcap")})`;
    }

    return null;
  }

  /**
   * Send a generic message
   */
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
      const formattedMessage = `${MESSAGE_EMOJIS[type]} *${title}*\n\n${message}`;

      await this.bot.sendMessage(this.chatId, formattedMessage, {
        parse_mode: "Markdown",
      });

      console.log(`✅ Message sent to ${this.chatId}`);
      return true;
    } catch (error) {
      this.logError("sendMessage", error);
      return false;
    }
  }

  /**
   * Send airdrop alert notification
   */
  async sendAirdropAlert(airdrop: AirdropAlertData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const message = this.buildAirdropMessage(airdrop);
      const keyboard = this.buildAirdropKeyboard(
        airdrop.symbol,
        airdrop.chain,
        airdrop.contractAddress,
      );

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });

      console.log(`✅ Airdrop alert sent for: ${airdrop.name}`);
      return true;
    } catch (error) {
      this.logError("sendAirdropAlert", error, airdrop.name);
      return false;
    }
  }

  /**
   * Build airdrop message content
   * NO end time - only start date/time separated
   */
  private buildAirdropMessage(airdrop: AirdropAlertData): string {
    const lines: string[] = [
      `🎁 *Binance Alpha Airdrop Tracker*`,
      `${this.t("newAirdrop")}\n`,
      `🍄 *${airdrop.name}*`,
      `💎 Symbol: $${airdrop.symbol}`,
    ];

    // Date and Time - SEPARATED (Thai timezone)
    if (airdrop.claimStartDate) {
      const startDate = new Date(airdrop.claimStartDate);
      lines.push(`📅 ${this.t("date")}: ${this.formatThaiDate(startDate)}`);
      lines.push(`⏰ ${this.t("time")}: ${this.formatThaiTime(startDate)}`);
    }

    lines.push("");

    // Requirements - Points
    if (airdrop.requiredPoints) {
      lines.push(`🎯 ${this.t("threshold")}: ${airdrop.requiredPoints} pts`);
    }

    if (airdrop.deductPoints) {
      lines.push(`⚖️ ${this.t("deductPoints")}: -${airdrop.deductPoints} pts`);
    }

    // Airdrop amount with value estimation
    if (airdrop.airdropAmount) {
      lines.push(`🎁 ${this.t("amount")}: ${airdrop.airdropAmount}`);
    }

    // Value estimation
    const valueText = this.formatValue(
      airdrop.estimatedValue,
      airdrop.marketCap,
    );
    if (valueText) {
      lines.push(`💰 ${this.t("estimatedValue")}: ${valueText}`);
    }

    lines.push("");

    // Chain info
    lines.push(`🔗 ${this.t("chain")}: #${airdrop.chain}`);

    if (airdrop.contractAddress) {
      lines.push(`📦 ${this.t("contract")}:`);
      lines.push(`\`${airdrop.contractAddress}\``);
    }

    // Footer with website link
    lines.push("");
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🌐 ดูเว็บไซต์: ${WEBSITE_URL}`);

    return lines.join("\n");
  }

  /**
   * Build inline keyboard for airdrop message
   * Uses dexscreener instead of Binance DEX
   */
  private buildAirdropKeyboard(
    symbol: string,
    chain: string,
    contractAddress?: string,
  ) {
    const dexscreenerUrl = this.getDexscreenerUrl(chain, contractAddress);

    return {
      inline_keyboard: [
        [
          {
            text: "📊 DEXScreener",
            url: dexscreenerUrl,
          },
          {
            text: "📈 MEXC",
            url: `https://www.mexc.com/exchange/${symbol}_USDT`,
          },
        ],
      ],
    };
  }

  /**
   * Send snapshot alert notification
   */
  async sendSnapshotAlert(airdrop: SnapshotAlertData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram snapshot alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lines: string[] = [
        `📸 *Binance Alpha Airdrop Tracker*`,
        `${this.t("snapshot")} ⏰\n`,
        `🍄 ${this.t("airdrop")}: *${airdrop.name}*`,
        `💎 ${this.t("symbol")}: $${airdrop.symbol}\n`,
      ];

      if (airdrop.snapshotDate) {
        const snapshotDate = new Date(airdrop.snapshotDate);
        lines.push(
          `📅 ${this.t("date")}: ${this.formatThaiDate(snapshotDate)}`,
        );
        lines.push(
          `⏰ ${this.t("time")}: ${this.formatThaiTime(snapshotDate)}\n`,
        );
      }

      if (airdrop.requiredPoints) {
        lines.push(
          `🎯 ${this.t("threshold")}: ${airdrop.requiredPoints} pts\n`,
        );
      }

      lines.push(`⚠️ ${this.t("makeReady")}`);
      lines.push("");
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`🌐 ดูเว็บไซต์: ${WEBSITE_URL}`);

      await this.bot.sendMessage(this.chatId, lines.join("\n"), {
        parse_mode: "Markdown",
      });

      return true;
    } catch (error) {
      this.logError("sendSnapshotAlert", error, airdrop.name);
      return false;
    }
  }

  /**
   * Send claimable alert notification
   */
  async sendClaimableAlert(airdrop: ClaimableAlertData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram claimable alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lines: string[] = [
        `💰 *Binance Alpha Airdrop Tracker*`,
        `${this.t("claimable")} 🎯\n`,
        `🍄 $${airdrop.symbol} ${this.t("claimNow")}`,
      ];

      if (airdrop.claimAmount) {
        lines.push(`🎁 ${this.t("amount")}: ${airdrop.claimAmount}`);
      }

      if (airdrop.requiredPoints) {
        lines.push(`🎯 ${this.t("threshold")}: ${airdrop.requiredPoints} pts`);
      }

      lines.push("");
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`🌐 ดูเว็บไซต์: ${WEBSITE_URL}`);

      await this.bot.sendMessage(this.chatId, lines.join("\n"), {
        parse_mode: "Markdown",
      });

      return true;
    } catch (error) {
      this.logError("sendClaimableAlert", error, airdrop.name);
      return false;
    }
  }

  /**
   * Send stability warning notification
   */
  async sendStabilityWarning(
    symbol: string,
    data: StabilityWarningData,
  ): Promise<boolean> {
    const message = [
      `*Symbol:* ${symbol}`,
      `*Stability Score:* ${data.stabilityScore.toFixed(2)}/100`,
      `*Risk Level:* ${data.riskLevel}`,
      `*Volatility:* ${data.volatilityIndex.toFixed(2)}`,
      `*Price Change:* ${data.priceChange > 0 ? "+" : ""}${data.priceChange.toFixed(2)}%`,
    ].join("\n");

    return this.sendMessage("⚠️ Stability Warning", message, "warning");
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlert(
    symbol: string,
    price: number,
    threshold: number,
    direction: "above" | "below",
  ): Promise<boolean> {
    const message = [
      `*Symbol:* ${symbol}`,
      `*Current Price:* $${price}`,
      `*Threshold:* $${threshold}`,
      `*Triggered:* Price ${direction} threshold`,
    ].join("\n");

    return this.sendMessage("💹 Price Alert", message, "info");
  }

  /**
   * Send airdrop reminder notification (before airdrop starts)
   * Like alpha123.uk's pre-airdrop notifications
   */
  async sendAirdropReminder(data: AirdropReminderData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop reminder (disabled):", data.name);
      return false;
    }

    try {
      const lines: string[] = [
        `⏰ *Binance Alpha Airdrop Reminder*`,
        `${this.t("startingSoon")}\n`,
        `🚀 *${data.name}* ($${data.symbol})`,
        ``,
        `⏱️ เริ่มใน *${data.minutesUntil} ${this.t("minutes")}*`,
        `📅 ${this.t("date")}: ${this.formatThaiDate(data.scheduledTime)}`,
        `⏰ ${this.t("time")}: ${this.formatThaiTime(data.scheduledTime)}`,
        ``,
      ];

      if (data.points) {
        lines.push(`🎯 ${this.t("threshold")}: ${data.points} pts`);
      }

      if (data.amount) {
        lines.push(`🎁 ${this.t("amount")}: ${data.amount}`);
      }

      lines.push(`🔗 ${this.t("chain")}: #${data.chain}`);

      if (data.type) {
        lines.push(`📋 Type: ${data.type}`);
      }

      // Value estimation
      const valueText = this.formatValue(
        data.estimatedValue ?? undefined,
        data.marketCap ?? undefined,
      );
      if (valueText) {
        lines.push(`💰 ${this.t("estimatedValue")}: ${valueText}`);
      }

      if (data.contractAddress) {
        lines.push(``, `📦 ${this.t("contract")}:`);
        lines.push(`\`${data.contractAddress}\``);
      }

      lines.push(``, `⚡ ${this.t("makeReady")}`);
      lines.push("");
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`🌐 ดูเว็บไซต์: ${WEBSITE_URL}`);

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📊 DEXScreener",
              url: this.getDexscreenerUrl(
                data.chain,
                data.contractAddress ?? undefined,
              ),
            },
            {
              text: "📈 MEXC",
              url: `https://www.mexc.com/exchange/${data.symbol}_USDT`,
            },
          ],
        ],
      };

      await this.bot.sendMessage(this.chatId, lines.join("\n"), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });

      console.log(
        `✅ Airdrop reminder sent for: ${data.name} (${data.minutesUntil}m)`,
      );
      return true;
    } catch (error) {
      this.logError("sendAirdropReminder", error, data.name);
      return false;
    }
  }

  /**
   * Send airdrop live notification (just started)
   */
  async sendAirdropLive(data: AirdropReminderData): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop live (disabled):", data.name);
      return false;
    }

    try {
      const lines: string[] = [
        `🔴 *LIVE NOW - Binance Alpha Airdrop*`,
        ``,
        `🎁 *${data.name}* ($${data.symbol}) กำลัง LIVE!`,
        ``,
        `📅 ${this.t("date")}: ${this.formatThaiDate(data.scheduledTime)}`,
        `⏰ ${this.t("time")}: ${this.formatThaiTime(data.scheduledTime)}`,
        ``,
      ];

      if (data.points) {
        lines.push(`🎯 ${this.t("threshold")}: ${data.points} pts`);
      }

      if (data.amount) {
        lines.push(`🎁 ${this.t("amount")}: ${data.amount}`);
      }

      lines.push(`🔗 ${this.t("chain")}: #${data.chain}`);

      // Value estimation
      const valueText = this.formatValue(
        data.estimatedValue ?? undefined,
        data.marketCap ?? undefined,
      );
      if (valueText) {
        lines.push(`💰 ${this.t("estimatedValue")}: ${valueText}`);
      }

      if (data.contractAddress) {
        lines.push(``, `📦 ${this.t("contract")}:`);
        lines.push(`\`${data.contractAddress}\``);
      }

      lines.push(``);
      lines.push("");
      lines.push(`━━━━━━━━━━━━━━━━━━━━`);
      lines.push(`🌐 ดูเว็บไซต์: ${WEBSITE_URL}`);

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "📊 DEXScreener",
              url: this.getDexscreenerUrl(
                data.chain,
                data.contractAddress ?? undefined,
              ),
            },
            {
              text: "📈 MEXC",
              url: `https://www.mexc.com/exchange/${data.symbol}_USDT`,
            },
          ],
        ],
      };

      await this.bot.sendMessage(this.chatId, lines.join("\n"), {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });

      console.log(`✅ Airdrop LIVE notification sent for: ${data.name}`);
      return true;
    } catch (error) {
      this.logError("sendAirdropLive", error, data.name);
      return false;
    }
  }

  /**
   * Log error with context
   */
  private logError(method: string, error: unknown, context?: string): void {
    const err = error as { message?: string; response?: { body?: unknown } };
    console.error(`❌ Telegram ${method} error:`, {
      chatId: this.chatId,
      context,
      error: err.message,
      response: err.response?.body,
    });
  }
}

// ============= Singleton Export =============

export const telegramService = new TelegramService();

// Export class for testing or custom instances
export { TelegramService };
