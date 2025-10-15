import TelegramBot from "node-telegram-bot-api";

type Language = "th" | "en";

interface Translations {
  th: Record<string, string>;
  en: Record<string, string>;
}

const translations: Translations = {
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
    dex: "DEX",
    mexc: "MEXC",
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
    dex: "DEX",
    mexc: "MEXC",
  },
};

class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string;
  private isEnabled: boolean;
  private language: Language;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    let chatId = process.env.TELEGRAM_CHAT_ID || "";

    // Auto-add @ prefix if chatId is username without @
    if (chatId && !chatId.startsWith('@') && !chatId.startsWith('-') && isNaN(Number(chatId))) {
      chatId = '@' + chatId;
      console.log(`ℹ️  Auto-added @ prefix to chat ID: ${chatId}`);
    }

    this.chatId = chatId;
    this.language = (process.env.TELEGRAM_LANGUAGE as Language) || "th";
    this.isEnabled = !!(token && this.chatId);

    if (this.isEnabled && token) {
      this.bot = new TelegramBot(token, { polling: false });
      console.log(`✅ Telegram bot initialized - Chat ID: ${this.chatId}`);
    } else {
      console.warn(
        "⚠️  Telegram bot disabled: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"
      );
    }
  }

  private t(key: string): string {
    return translations[this.language][key] || key;
  }

  setLanguage(lang: Language) {
    this.language = lang;
  }

  async sendMessage(
    title: string,
    message: string,
    type: "info" | "warning" | "success" | "error" = "info"
  ): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram notification (disabled):", title, "-", message);
      return false;
    }

    try {
      const emojis = {
        info: "ℹ️",
        warning: "⚠️",
        success: "✅",
        error: "❌",
      };
      const formattedMessage = `${emojis[type]} *${title}*\n\n${message}`;

      console.log(`📤 Sending to Telegram (${this.chatId}):`, title);

      await this.bot.sendMessage(this.chatId, formattedMessage, {
        parse_mode: "Markdown",
      });

      console.log(`✅ Message sent successfully to ${this.chatId}`);
      return true;
    } catch (error: any) {
      console.error("❌ Telegram send error:", {
        chatId: this.chatId,
        error: error.message,
        response: error.response?.body,
      });
      return false;
    }
  }

  // แจ้งเตือน Airdrop ใหม่ (แบบในรูป - รูปแบบสวย)
  async sendAirdropAlert(airdrop: {
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
  }): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram airdrop alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lang = this.language;

      // Header
      let message = `🎁 *Binance Alpha Airdrop Tracker*\n`;
      message += `${this.t("newAirdrop")} 🎉\n\n`;

      // Airdrop details
      message += `🍄 ${this.t("airdrop")}: *${airdrop.name}*\n`;
      message += `💎 ${this.t("symbol")}: $${airdrop.symbol}\n`;

      // Timeline - แปลงเป็นเวลาไทย (UTC+7)
      if (airdrop.claimStartDate) {
        const startDate = new Date(airdrop.claimStartDate);
        // แปลงเป็นเวลาไทย
        const thaiTime = new Date(startDate.getTime() + (7 * 60 * 60 * 1000));
        const dateStr = thaiTime.toLocaleString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }) + " UTC";
        message += `📅 ${this.t("start")}: ${dateStr}\n`;
      }

      if (airdrop.claimEndDate) {
        const endDate = new Date(airdrop.claimEndDate);
        // แปลงเป็นเวลาไทย
        const thaiTime = new Date(endDate.getTime() + (7 * 60 * 60 * 1000));
        const dateStr = thaiTime.toLocaleString("en-US", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
        }) + " UTC";
        message += `🏆 ${this.t("end")}: ${dateStr}\n`;
      }

      message += `\n`;

      // Requirements
      if (airdrop.requiredPoints) {
        message += `🎯 ${this.t("threshold")}: ${airdrop.requiredPoints} pts\n`;
      }

      if (airdrop.deductPoints) {
        message += `⚖️ ${this.t("deductPoints")}: -${airdrop.deductPoints} pts\n`;
      }

      // Airdrop amount
      if (airdrop.airdropAmount) {
        const valueText = airdrop.estimatedValue
          ? ` ($${airdrop.estimatedValue})`
          : "";
        message += `🎁 ${this.t("airdrop")}: ${airdrop.airdropAmount}${valueText}\n`;
      }

      message += `\n`;

      // Chain info
      message += `🔗 ${this.t("chain")}: #${airdrop.chain}\n`;

      if (airdrop.contractAddress) {
        message += `📦 ${this.t("contract")}:\n`;
        message += `\`${airdrop.contractAddress}\``;
      }

      console.log(`📤 Sending airdrop alert to Telegram (${this.chatId}):`, airdrop.name);

      // สร้าง inline keyboard buttons
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🌐 DEX",
              url: `https://www.binance.com/en/trade/${airdrop.symbol}_USDT`,
            },
            {
              text: "📊 MEXC",
              url: `https://www.mexc.com/exchange/${airdrop.symbol}_USDT`,
            },
          ],
        ],
      };

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: keyboard,
      });

      console.log(`✅ Airdrop alert sent successfully to ${this.chatId}`);
      return true;
    } catch (error: any) {
      console.error("❌ Telegram airdrop alert error:", {
        chatId: this.chatId,
        airdrop: airdrop.name,
        error: error.message,
        response: error.response?.body,
      });
      return false;
    }
  }

  async sendSnapshotAlert(airdrop: {
    name: string;
    symbol: string;
    snapshotDate?: Date;
    requiredPoints?: number;
    requirements?: string[];
  }): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram snapshot alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lang = this.language;

      let message = `📸 *Binance Alpha Airdrop Tracker*\n`;
      message += `${this.t("snapshot")} ⏰\n\n`;

      message += `🍄 ${this.t("airdrop")}: *${airdrop.name}*\n`;
      message += `💎 ${this.t("symbol")}: $${airdrop.symbol}\n\n`;

      if (airdrop.snapshotDate) {
        const snapDate = new Date(airdrop.snapshotDate);
        const dateStr =
          lang === "th"
            ? snapDate.toLocaleDateString("th-TH", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : snapDate.toLocaleDateString("en-US", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }) + " UTC";
        message += `📸 Snapshot: ${dateStr}\n\n`;
      }

      if (airdrop.requiredPoints) {
        message += `🎯 ${this.t("threshold")}: ${
          airdrop.requiredPoints
        } pts\n\n`;
      }

      message += `⚠️ ${this.t("makeReady")}\n`;
      message += `👁 ${
        Math.floor(Math.random() * 5000) + 1000
      }   ${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "Markdown",
      });

      return true;
    } catch (error) {
      console.error("❌ Telegram snapshot alert error:", error);
      return false;
    }
  }

  async sendClaimableAlert(airdrop: {
    name: string;
    symbol: string;
    claimEndDate?: Date;
    claimAmount?: string;
    requiredPoints?: number;
  }): Promise<boolean> {
    if (!this.isEnabled || !this.bot) {
      console.log("Telegram claimable alert (disabled):", airdrop.name);
      return false;
    }

    try {
      const lang = this.language;

      let message = `💰 *Binance Alpha Airdrop Tracker*\n`;
      message += `${this.t("claimable")} 🎯\n\n`;

      message += `🍄 ${airdrop.symbol} ${this.t("claimNow")}\n`;

      if (airdrop.claimAmount) {
        message += `🎁 ${this.t("airdrop")}: ${airdrop.claimAmount}\n`;
      }

      if (airdrop.requiredPoints) {
        message += `🎯 Minimum ${airdrop.requiredPoints} pts\n`;
      }

      if (airdrop.claimEndDate) {
        const endDate = new Date(airdrop.claimEndDate);
        const now = new Date();
        const hoursLeft = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        );

        const dateStr =
          lang === "th"
            ? endDate.toLocaleDateString("th-TH", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : endDate.toLocaleDateString("en-US", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }) + " UTC";

        message += `\n⏰ ${this.t("claimBefore")}: ${dateStr}\n`;

        if (hoursLeft <= 24) {
          message += `⚠️ เหลือเวลา ${hoursLeft} ${
            lang === "th" ? "ชั่วโมง" : "hours"
          }!\n`;
        }
      }

      message += `\n👁 ${
        Math.floor(Math.random() * 5000) + 1000
      }   ${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "Markdown",
      });

      return true;
    } catch (error) {
      console.error("❌ Telegram claimable alert error:", error);
      return false;
    }
  }

  async sendStabilityWarning(
    symbol: string,
    data: {
      stabilityScore: number;
      riskLevel: string;
      volatilityIndex: number;
      priceChange: number;
    }
  ): Promise<boolean> {
    const message = [
      `*Symbol:* ${symbol}`,
      `*Stability Score:* ${data.stabilityScore.toFixed(2)}/100`,
      `*Risk Level:* ${data.riskLevel}`,
      `*Volatility:* ${data.volatilityIndex.toFixed(2)}`,
      `*Price Change:* ${
        data.priceChange > 0 ? "+" : ""
      }${data.priceChange.toFixed(2)}%`,
    ].join("\n");

    return this.sendMessage("⚠️ Stability Warning", message, "warning");
  }

  async sendPriceAlert(
    symbol: string,
    price: number,
    threshold: number,
    direction: "above" | "below"
  ): Promise<boolean> {
    const message = [
      `*Symbol:* ${symbol}`,
      `*Current Price:* $${price}`,
      `*Threshold:* $${threshold}`,
      `*Triggered:* Price ${direction} threshold`,
    ].join("\n");

    return this.sendMessage("💹 Price Alert", message, "info");
  }
}

export const telegramService = new TelegramService();
