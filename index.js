const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Webhook configuration
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const WEBHOOK_PATH = '/webhook';  // This can be any endpoint you choose

// Middleware setup
app.use(express.json());  // For parsing application/json
app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded

// Webhook endpoint
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);  // Process the incoming update
  res.sendStatus(200);  // Respond with OK status
});

// Health check endpoint (important for monitoring)
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Initialize webhook
const initWebhook = async () => {
  try {
    await bot.setWebHook(`${process.env.RAILWAY_STATIC_URL}${WEBHOOK_PATH}`);
    console.log('Webhook set successfully');
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initWebhook();
});

// Your existing bot command handlers remain unchanged below
// bot.onText(), bot.on('message'), etc.