/**
 * Test script to verify Telegram bot functionality
 * Run with: node test-telegram.js
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log('=== Telegram Bot Test ===');
console.log('Token:', token ? '✅ Found' : '❌ Missing');
console.log('Chat ID:', chatId || '❌ Missing');
console.log('');

if (!token || !chatId) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env');
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(token, { polling: false });

// สร้างวันที่ทดสอบ
const startDate = new Date('2025-10-09T07:00:00Z');
const endDate = new Date('2025-10-10T07:00:00Z');

// แปลงเป็นเวลาไทย (UTC+7)
const thaiStartTime = new Date(startDate.getTime() + (7 * 60 * 60 * 1000));
const thaiEndTime = new Date(endDate.getTime() + (7 * 60 * 60 * 1000));

const startStr = thaiStartTime.toLocaleString('en-US', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
}) + ' UTC';

const endStr = thaiEndTime.toLocaleString('en-US', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
}) + ' UTC';

// Test message (ตามรูปแบบใหม่)
const testMessage = `🎁 *Binance Alpha Airdrop Tracker*
Airdrop ใหม่มาแล้ว 🎉

🍄 Airdrop: *Walrus*
💎 Symbol: $WAL
📅 Start: ${startStr}
🏆 End: ${endStr}

🎯 Threshold: 210 pts
⚖️ Deduct points: -15 pts
🎁 Airdrop: 150 $WAL ($60)

🔗 Chain: #SUI
📦 Contract:
\`0x356a26eb9e01a6895808234d0ddc4116e7f55615cf27afcf209cf0ae54f59::wal::WAL\``;

// สร้าง inline keyboard buttons
const keyboard = {
  inline_keyboard: [
    [
      {
        text: '🌐 DEX',
        url: 'https://www.binance.com/en/trade/WAL_USDT',
      },
      {
        text: '📊 MEXC',
        url: 'https://www.mexc.com/exchange/WAL_USDT',
      },
    ],
  ],
};

console.log('📤 Sending test message to:', chatId);
console.log('');

bot.sendMessage(chatId, testMessage, {
  parse_mode: 'Markdown',
  disable_web_page_preview: true,
  reply_markup: keyboard,
})
.then(() => {
  console.log('✅ Message sent successfully!');
  console.log('Check your Telegram:', chatId);
  console.log('');
  console.log('✨ Features tested:');
  console.log('  - ✅ Thai timezone conversion (UTC+7)');
  console.log('  - ✅ Inline keyboard buttons (DEX & MEXC)');
  console.log('  - ✅ No emoji reactions');
  console.log('  - ✅ Markdown formatting');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ Error sending message:', error.message);
  if (error.response && error.response.body) {
    console.error('Response:', error.response.body);
  }
  process.exit(1);
});
