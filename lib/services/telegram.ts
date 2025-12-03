/**
 * Telegram Notification Service
 * Clean OOP implementation with proper type safety
 */

import TelegramBot from "node-telegram-bot-api";

// ============= Types =============

type Language = "th" | "en";
type MessageType = "info" | "warning" | "success" | "error";

interface AirdropAlertData {
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
}

interface SnapshotAlertData {
  name: string;
  symbol: string;
  snapshotDate?: Date;
  requiredPoints?: number;
  requirements?: string[];
}

interface ClaimableAlertData {
  name: string;
  symbol: string;
  claimEndDate?: Date;
  claimAmount?: string;
  requiredPoints?: number;
}

interface StabilityWarningData {
  stabilityScore: number;
  riskLevel: string;
  volatilityIndex: number;
  priceChange: number;
}

interface TelegramConfig {
  token?: string;
  chatId?: string;
  language?: Language;
}

// ============= Translations =============

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  th: {
    newAirdrop: "Airdrop ใหม่มาแล้ว",
    snapshot: "การ Snapshot กำลังจะมาถึง",
    claimable: "พร้อม Claim แล้ว",
    ending: "ใกล้สิ้นสุด",
    name: "ชื่อ",
    symbol: "สัญลักษณ์",
    chain: "เชน",
    airdrop: "Airdrop",
    start: "เริ่ม",
    end: "สิ้นสุด",
    threshold: "เงื่อนไข",
    deductPoints: "หักคะแนน",
    amount: "จำนวน",
    contract: "Contract",
    claimBefore: "Claim ก่อน",
    claimNow: "รีบ Claim เลย!",
    makeReady: "เตรียมตัวให้พร้อม!",
    snapshotSoon: "Snapshot เร็วๆ นี้!",
    hours: "ชั่วโมง",
  },
  en: {
    newAirdrop: "New Alpha Drop Available",
    snapshot: "Snapshot Coming Soon",
    claimable: "Claim Available",
    ending: "Ending Soon",
    name: "Name",
    symbol: "Symbol",
    chain: "Chain",
    airdrop: "Airdrop",
    start: "Start",
    end: "End",
    threshold: "Threshold",
    deductPoints: "Deduct Points",
    amount: "Amount",
    contract: "Contract",
    claimBefore: "Claim Before",
    claimNow: "Claim Now!",
    makeReady: "Get Ready!",
    snapshotSoon: "Snapshot Soon!",
    hours: "hours",
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
   * Format date to Thai timezone string
   */
  private formatDateThai(date: Date): string {
    const thaiTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return (
      thaiTime.toLocaleString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
      }) + " UTC"
    );
  }

  /**
   * Format date based on language
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    if (this.language === "th") {
      return date.toLocaleDateString("th-TH", options);
    }
    return date.toLocaleDateString("en-US", options) + " UTC";
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
      const keyboard = this.buildAirdropKeyboard(airdrop.symbol);

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
   */
  private buildAirdropMessage(airdrop: AirdropAlertData): string {
    const lines: string[] = [
      `🎁 *Binance Alpha Airdrop Tracker*`,
      `${this.t("newAirdrop")} 🎉\n`,
      `🍄 ${this.t("airdrop")}: *${airdrop.name}*`,
      `💎 ${this.t("symbol")}: $${airdrop.symbol}`,
    ];

    // Timeline
    if (airdrop.claimStartDate) {
      lines.push(
        `📅 ${this.t("start")}: ${this.formatDateThai(new Date(airdrop.claimStartDate))}`,
      );
    }

    if (airdrop.claimEndDate) {
      lines.push(
        `🏆 ${this.t("end")}: ${this.formatDateThai(new Date(airdrop.claimEndDate))}`,
      );
    }

    lines.push("");

    // Requirements
    if (airdrop.requiredPoints) {
      lines.push(`🎯 ${this.t("threshold")}: ${airdrop.requiredPoints} pts`);
    }

    if (airdrop.deductPoints) {
      lines.push(`⚖️ ${this.t("deductPoints")}: -${airdrop.deductPoints} pts`);
    }

    // Airdrop amount
    if (airdrop.airdropAmount) {
      const valueText = airdrop.estimatedValue
        ? ` ($${airdrop.estimatedValue})`
        : "";
      lines.push(
        `🎁 ${this.t("airdrop")}: ${airdrop.airdropAmount}${valueText}`,
      );
    }

    lines.push("");

    // Chain info
    lines.push(`🔗 ${this.t("chain")}: #${airdrop.chain}`);

    if (airdrop.contractAddress) {
      lines.push(`📦 ${this.t("contract")}:`);
      lines.push(`\`${airdrop.contractAddress}\``);
    }

    return lines.join("\n");
  }

  /**
   * Build inline keyboard for airdrop message
   */
  private buildAirdropKeyboard(symbol: string) {
    return {
      inline_keyboard: [
        [
          {
            text: "🌐 DEX",
            url: `https://www.binance.com/en/trade/${symbol}_USDT`,
          },
          {
            text: "📊 MEXC",
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
        lines.push(
          `📸 Snapshot: ${this.formatDate(new Date(airdrop.snapshotDate))}\n`,
        );
      }

      if (airdrop.requiredPoints) {
        lines.push(
          `🎯 ${this.t("threshold")}: ${airdrop.requiredPoints} pts\n`,
        );
      }

      lines.push(`⚠️ ${this.t("makeReady")}`);

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
        `🍄 ${airdrop.symbol} ${this.t("claimNow")}`,
      ];

      if (airdrop.claimAmount) {
        lines.push(`🎁 ${this.t("airdrop")}: ${airdrop.claimAmount}`);
      }

      if (airdrop.requiredPoints) {
        lines.push(`🎯 Minimum ${airdrop.requiredPoints} pts`);
      }

      if (airdrop.claimEndDate) {
        const endDate = new Date(airdrop.claimEndDate);
        const now = new Date();
        const hoursLeft = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60),
        );

        lines.push(
          `\n⏰ ${this.t("claimBefore")}: ${this.formatDate(endDate)}`,
        );

        if (hoursLeft <= 24 && hoursLeft > 0) {
          lines.push(`⚠️ ${hoursLeft} ${this.t("hours")} left!`);
        }
      }

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

// Export singleton instance
export const telegramService = new TelegramService();

// Export class for testing or custom instances
export { TelegramService };

// Export types
export type {
  Language,
  MessageType,
  AirdropAlertData,
  SnapshotAlertData,
  ClaimableAlertData,
  StabilityWarningData,
  TelegramConfig,
};
