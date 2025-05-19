// index.js
require('dotenv').config();
const { Telegraf, session } = require('telegraf');

// Initialize the bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Enable session middleware
bot.use(session());

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Oops, something went wrong. Try again later.');
});

// Logging middleware
bot.use((ctx, next) => {
  console.log(`Received: ${JSON.stringify(ctx.message)} \nfrom ${ctx.from?.username || 'unknown'}`);
  return next();
});

// Start command
bot.start((ctx) => {
  ctx.reply('Welcome! Use /askname to start sharing info, or /help for commands.');
});

// Help command
bot.help((ctx) => {
  ctx.reply('Commands:\n/start - Start the bot\n/help - Show this help\n/askname - Share your name and more\n/stop - End the conversation');
});

// Askname command
bot.command('askname', (ctx) => {
  // Initialize session if not exists
  ctx.session = ctx.session || {};
  // Set conversation state
  ctx.session.conversationState = 'waitingForName';
  // Initialize message history array
  ctx.session.messageHistory = [];
  ctx.reply('Please tell me your name.');
});
// cancel 
bot.command('cancel', (ctx) => {
  ctx.session = {};
  ctx.reply('Conversation canceled.');
});

// Stop command to end conversation
bot.command('stop', (ctx) => {
  if (ctx.session?.conversationState) {
    // Summarize collected messages
    const history = ctx.session.messageHistory.length > 0
      ? `You shared: ${ctx.session.messageHistory.join(', ')}`
      : 'No info shared.';
    ctx.reply(`Conversation ended. ${history}`);
    // Clear session
    ctx.session.conversationState = null;
    ctx.session.messageHistory = [];
  } else {
    ctx.reply('No active conversation to stop.');
  }
});

// Handle text messages
bot.on('text', (ctx) => {
  const message = ctx.message.text;
  
  // Ignore commands (except /stop, handled above)
  if (message.startsWith('/') && message !== '/stop') {
    return;
  }

  // Initialize session if not exists
  ctx.session = ctx.session || {};
  ctx.session.messageHistory = ctx.session.messageHistory || [];

  // Handle based on conversation state
  if (ctx.session.conversationState === 'waitingForName') {
    // Store the name
    ctx.session.messageHistory.push(message);
    ctx.reply(`Thanks, ${message}! Anything else you want to share? (Use /stop to end)`);
    // Move to next state
    ctx.session.conversationState = 'collectingMoreInfo';
  } else if (ctx.session.conversationState === 'collectingMoreInfo') {
    // Store additional info
    ctx.session.messageHistory.push(message);
    ctx.reply(`Got it: "${message}". Anything else? (Use /stop to end)`);
  } else {
    // No active conversation
    ctx.reply(`You said: "${message}". Start a conversation with /askname.`);
  }
});

// Launch the bot
bot.launch()
  .then(() => console.log('Bot is running...'))
  .catch((err) => console.error('Error launching bot:', err));

// Graceful stop
process.once('SIGINT', () => {
  console.log('Received SIGINT. Stopping bot...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  console.log('Received SIGTERM. Stopping bot...');
  bot.stop('SIGTERM');
});