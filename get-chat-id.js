/**
 * Script to get Chat ID from Telegram
 *
 * Steps:
 * 1. Start your bot and send it a message on Telegram
 * 2. Run this script: node get-chat-id.js
 * 3. Copy the Chat ID shown and use it in .env
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}

console.log('🤖 Starting bot to get Chat ID...');
console.log('');
console.log('📝 Instructions:');
console.log('1. Open Telegram and find your bot');
console.log('2. Send a message to your bot (e.g., /start or hello)');
console.log('3. Wait for the Chat ID to appear here');
console.log('4. Copy the Chat ID and add it to .env');
console.log('');
console.log('⏳ Waiting for messages...');
console.log('Press Ctrl+C to stop');
console.log('');

// Create bot with polling enabled
const bot = new TelegramBot(token, { polling: true });

// Listen for any message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const chatTitle = msg.chat.title || msg.chat.first_name || 'Unknown';
  const username = msg.chat.username ? `@${msg.chat.username}` : 'No username';

  console.log('✅ Received message!');
  console.log('');
  console.log('📋 Chat Information:');
  console.log('─────────────────────────────────');
  console.log('Chat ID:', chatId);
  console.log('Chat Type:', chatType);
  console.log('Chat Title:', chatTitle);
  console.log('Username:', username);
  console.log('─────────────────────────────────');
  console.log('');
  console.log('💡 Add this to your .env file:');
  console.log(`TELEGRAM_CHAT_ID="${chatId}"`);
  console.log('');

  // Send confirmation
  bot.sendMessage(chatId, '✅ Chat ID received!\n\nYour Chat ID is: ' + chatId)
    .then(() => {
      console.log('✅ Confirmation message sent');
      console.log('');
      console.log('You can now press Ctrl+C to stop this script');
    })
    .catch((err) => {
      console.error('Error sending confirmation:', err.message);
    });
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('');
  console.log('👋 Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});
