// const { Telegraf } = require('telegraf');
// require('dotenv').config();

// const token = process.env.TELEGRAM_BOT_TOKEN || '7433555703:AAEXMi6pPKY87UN50wPMEvhj2j2hM-j-Evg';

// if (!token || token.trim() === '') {
//   console.error('❌ TELEGRAM_BOT_TOKEN is missing! Please set it in your .env file.');
//   process.exit(1);
// }

// const bot = new Telegraf(token);

// bot.use((ctx, next) => {
//   console.log(`Received: ${JSON.stringify(ctx.message)} from ${ctx.from?.username || 'unknown'}`);
//   return next();
// });

// bot.catch((err, ctx) => {
//   console.error(`Error for ${ctx.updateType}:`, err);
//   ctx.reply('Oops, something went wrong. Try again later.');
// });

// bot.start(async (ctx) => {
//   const botInfo =  bot.telegram.getMe();
//   console.log(`Bot Info:\nUsername: @${botInfo.username}\nID: ${botInfo.id}\nFirst Name: ${botInfo.first_name}`);
//   ctx.reply('Hi! I am a learning bot. I can help you learn new things. How can I help you?');
// });

// bot.command('menu', (ctx) => {
//   ctx.reply('Choose an option:', {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: 'Option 1', callback_data: 'opt1' }],
//         [{ text: 'Option 2', callback_data: 'opt2' }],
//       ],
//     },
//   });
// });

// bot.action('opt1', (ctx) => ctx.reply('You chose Option 1!'));
// bot.action('opt2', (ctx) => ctx.reply('You chose Option 2!'));

// bot.command('info', async (ctx) => {
//   try {
//     const botInfo = await bot.telegram.getMe();
//     ctx.reply(`Bot Info:\nUsername: @${botInfo.username}\nID: ${botInfo.id}\nFirst Name: ${botInfo.first_name}`);
//   } catch (err) {
//     console.error('Error fetching bot info:', err);
//     ctx.reply('Error fetching bot info.');
//   }
// });

// bot.command('user', (ctx) =>{
//   const user = ctx.from;
//   ctx.reply(`User Info:\nUsername: ${user.username}\nID: ${user.id}\nFirst Name: ${user.first_name}`)
//   console.log(ctx);
// });


// bot.launch()
//   .then( () => {
//     console.log('🤖 Bot is running!');
//   })
//   .catch((err) => {
//     console.error('Failed to launch bot:', err);
//     process.exit(1);
//   });

//   bot.on('text', (ctx) => {
//   const message = ctx.message.text; // Get the message text
//   console.log(`Recieve Text: ${message} `); // Log the message
//   if (!message.startsWith('/')) { // Ignore commands
//     ctx.reply(`You said: "${message}"\nI'm listening! Send another message or try /help.`);
//   }
// });

// // Optional: Keep process alive and handle graceful shutdown
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));



require('dotenv').config();
const { Telegraf, session } = require('telegraf');

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
  console.log(`Received: ${JSON.stringify(ctx.message)} from ${ctx.from?.username || 'unknown'}`);
  return next();
});

// Start command
bot.start((ctx) => {
  ctx.reply('Welcome to my Telegram bot! Type /help for commands.');
});

// Help command
bot.help((ctx) => {
  ctx.reply('Available commands:\n/start - Start the bot\n/help - Show this help\n/info - Bot info\n/user - Your info\n/askname - Tell me your name');
});

// Bot info
bot.command('info', async (ctx) => {
  try {
    const botInfo = await bot.telegram.getMe();
    ctx.reply(`Bot Info:\nUsername: @${botInfo.username}\nID: ${botInfo.id}\nFirst Name: ${botInfo.first_name}`);
  } catch (err) {
    console.error('Error fetching bot info:', err);
    ctx.reply('Error fetching bot info.');
  }
});

// User info
bot.command('user', (ctx) => {
  const user = ctx.from;
  ctx.reply(`User Info:\nID: ${user.id}\nFirst Name: ${user.first_name}${user.last_name ? `\nLast Name: ${user.last_name}` : ''}\nUsername: ${user.username ? `@${user.username}` : 'N/A'}`);
});

// Ask for name
bot.command('askname', (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.waitingForName = true;
  ctx.reply('Please tell me your name.');
});

// Handle text messages
bot.on('text', (ctx) => {
  if (ctx.session?.waitingForName) {
    const name = ctx.message.text;
    ctx.reply(`Nice to meet you, ${name}!`);
    ctx.session.waitingForName = false;
  } else if (!ctx.message.text.startsWith('/')) {
    ctx.reply(`You said: "${ctx.message.text}"\nTry /askname to tell me your name!`);
  }
});

// Launch the bot
bot.launch()
  .then(() => console.log('Bot is running...'))
  .catch((err) => console.error('Error launching bot:', err));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));