const { evaluate } = require('mathjs');

function Calculator(message) {
    try {
        // Only allow numbers and basic math operators
        if (/^[\d+\-*/().\s]+$/.test(message)) {
            const result = evaluate(message);
            return `Result: ${result}`;
        } else {
            return 'Invalid input. Please enter a valid math expression (e.g., 2+2).';
        }
    } catch (error) {
        return 'Error calculating the expression.';
    }
}

module.exports = { Calculator };

// // In your message handler
// if (/^[\d+\-*/().\s]+$/.test(msg.text)) {
//     Calculator(msg.chat.id, msg.text, bot);
// }


















// testing bot
// const { Telegraf, Markup, session } = require('telegraf');
// require('dotenv').config();

// // Initialize bot with your token (store it properly in .env)
// const bot = new Telegraf(process.env.BOT_TOKEN || '7433555703:AAEXMi6pPKY87UN50wPMEvhj2j2hM-j-Evg');

// // Configure session middleware properly
// bot.use(session({
//   defaultSession: () => ({
//     selectedOption: null
//   })
// }));

// // Start command handler
// bot.start(async (ctx) => {
//   try {
//     await ctx.reply(
//       'Welcome! Please choose an option:',
//       Markup.inlineKeyboard([
//         [Markup.button.callback('Option 1', 'opt1')],
//         [Markup.button.callback('Option 2', 'opt2')]
//       ])
//     );
//   } catch (error) {
//     console.error('Error in start command:', error);
//   }
// });

// // Handle option selections
// bot.action(['opt1', 'opt2'], async (ctx) => {
//   try {
//     ctx.session.selectedOption = ctx.match[0];
    
//     // Try to delete the original message with the buttons
//     try {
//       await ctx.deleteMessage();
//     } catch (deleteError) {
//       console.log('Could not delete message:', deleteError.message);
//     }
    
//     await ctx.reply(`You selected ${ctx.session.selectedOption}. Please send me some text now:`);
//   } catch (error) {
//     console.error('Error in option selection:', error);
//     await ctx.reply('Sorry, something went wrong. Please try again.');
//   }
// });

// // Handle text messages
// bot.on('text', async (ctx) => {
//   try {
//     if (ctx.session.selectedOption) {
//       const chatId = ctx.message.chat.id;
//       const userText = ctx.message.text;
      
//       await ctx.reply(
//         `Here's your information:\n` +
//         `Chat ID: <code>${chatId}</code>\n` +
//         `Option: ${ctx.session.selectedOption}\n` +
//         `Text: ${userText}`,
//         { parse_mode: 'HTML' }
//       );
      
//       // Reset the session
//       ctx.session.selectedOption = null;
//     } else {
//       await ctx.reply(
//         'Please select an option first using the /start command',
//         Markup.keyboard(['/start']).resize()
//       );
//     }
//   } catch (error) {
//     console.error('Error in text handling:', error);
//     await ctx.reply('Sorry, I encountered an error processing your message.');
//   }
// });

// // Error handling
// bot.catch((err, ctx) => {
//   console.error('Bot error:', err);
//   ctx.reply('An error occurred. Please try again later.');
// });

// // Start the bot
// bot.launch()
//   .then(() => console.log('Bot is running'))
//   .catch(err => console.error('Bot failed to start:', err));

// // Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));







// // Load required libraries
// const { Telegraf, Markup, session } = require('telegraf');
// require('dotenv').config();

// // Initialize the bot with your token from @BotFather
// const bot = new Telegraf(process.env.BOT_TOKEN || "7433555703:AAEXMi6pPKY87UN50wPMEvhj2j2hM-j-Evg");

// // ----------------------------
// // SESSION MIDDLEWARE
// // ----------------------------
// // This helps remember user choices between messages
// bot.use(session({
//   defaultSession: () => ({
//     selectedOption: null // We'll store user's choice here
//   })
// }));

// // ----------------------------
// // START COMMAND
// // ----------------------------
// // This runs when user sends /start
// bot.start(async (ctx) => {
//   // Send welcome message with inline buttons
//   await ctx.reply(
//     '👋 Welcome to my bot! Please choose an option:',
//     Markup.inlineKeyboard([
//       // First row buttons
//       [Markup.button.callback('🍎 Option 1', 'opt1')],
//       // Second row buttons
//       [Markup.button.callback('🍊 Option 2', 'opt2')]
//     ])
//   );
// });

// // ----------------------------
// // BUTTON HANDLERS
// // ----------------------------
// // When user clicks Option 1
// bot.action('opt1', async (ctx) => {
//   // Store the choice in session
//   ctx.session.selectedOption = 'Option 1';
  
//   // Delete the original message with buttons
//   try {
//     await ctx.deleteMessage();
//   } catch (err) {
//     console.log("Couldn't delete message:", err.message);
//   }
  
//   // Ask for text input
//   await ctx.reply('You chose � Option 1. Now please send me some text:');
// });

// // When user clicks Option 2
// bot.action('opt2', async (ctx) => {
//   ctx.session.selectedOption = 'Option 2';
//   try {
//     await ctx.deleteMessage();
//   } catch (err) {
//     console.log("Couldn't delete message:", err.message);
//   }
//   await ctx.reply('You chose 🍊 Option 2. Now please send me some text:');
// });

// // ----------------------------
// // TEXT MESSAGE HANDLER
// // ----------------------------
// // When user sends regular text message
// bot.on('text', async (ctx) => {
//   // Check if user has selected an option first
//   if (!ctx.session.selectedOption) {
//     await ctx.reply('⚠️ Please select an option first with /start');
//     return;
//   }
  
//   // Get message details
//   const chatId = ctx.message.chat.id;
//   const userText = ctx.message.text;
  
//   // Send formatted response
//   await ctx.replyWithHTML(
//     `📋 <b>Here's your info:</b>\n\n` +
//     `🆔 <b>Chat ID:</b> <code>${chatId}</code>\n` +
//     `🔘 <b>Option:</b> ${ctx.session.selectedOption}\n` +
//     `✏️ <b>Your text:</b> ${userText}`
//   );
  
//   // Reset the session for next interaction
//   ctx.session.selectedOption = null;
// });

// // ----------------------------
// // ERROR HANDLING
// // ----------------------------
// // Handle any errors that occur
// bot.catch((err, ctx) => {
//   console.error('Bot error:', err);
//   ctx.reply('❌ An error occurred. Please try again.');
// });

// // ----------------------------
// // START THE BOT
// // ----------------------------
// bot.launch()
//   .then(() => console.log('🤖 Bot is running!'))
//   .catch(err => console.error('🚨 Bot failed to start:', err));

// // Enable graceful shutdown
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));


