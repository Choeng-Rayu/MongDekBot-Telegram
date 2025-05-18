// const express = require('express');
// const TelegramBot = require('node-telegram-bot-api');
// require('dotenv').config();

// // Initialize Express app
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Webhook configuration
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
// const WEBHOOK_PATH = '/webhook';  // This can be any endpoint you choose

// // Middleware setup
// app.use(express.json());  // For parsing application/json
// app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded

// // Webhook endpoint
// app.post(WEBHOOK_PATH, (req, res) => {
//   bot.processUpdate(req.body);  // Process the incoming update
//   res.sendStatus(200);  // Respond with OK status
// });


// // Health check endpoint (important for monitoring)
// app.get('/', (req, res) => {
//   res.send('Bot is running!');
// });

// // Initialize webhook
// const initWebhook = async () => {
//   try {
//     await bot.setWebHook(`${process.env.RAILWAY_STATIC_URL}${WEBHOOK_PATH}`);
//     console.log('Webhook set successfully');
//   } catch (error) {
//     console.error('Error setting webhook:', error);
//   }
// };

// // Start serverv
// app.listen(PORT, async () => {
//   console.log(`Server running on port ${PORT}`);
//   await initWebhook();
// });

// // Your existing bot command handlers remain unchanged below
// // bot.onText(), bot.on('message'), etc.






const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create a bot instance
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
//create a bot instance without env file
const bot = new TelegramBot('7433555703:AAEXMi6pPKY87UN50wPMEvhj2j2hM-j-Evg', { polling: true });

// Basic command handler - responds to /start
// Basic command handler - responds to /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['Option 1', 'Option 2'],
                ['Option 3', 'Option 4']
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };
    bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋');
    bot.sendMessage(chatId, 'Select an option:', keyboard);
    console.log(msg);
});

// // Handle Option 1 selection and send document
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const filePath = './style.css';
//     if (msg.text === 'Option 1') {
//         bot.sendDocument(chatId, filePath, {
//             caption: 'Here is your document!'
//         });
//     }
// });

// // Handle regular messages
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const getText = msg.text;
//     const username = msg.from.username;
//     // If message is not a command
//     if (!msg.text.startsWith('/')) {
//         bot.sendMessage(chatId, `You said: ${msg.text}`);
//     }
//     // console.log(chatId + '\n');
//     // console.log(getText + '\n');
//     // console.log(username + '\n');
//     console.log(msg);
//     // console.log(`Received message from ${msg.from.username}: ${text}`);
// });


// Handle Different Message Types Here's a more advanced example that handles different types of messages:
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo;
    const document = msg.document;
    console.log(msg);


  //   const options = {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [{ text: "I did it!", callback_data: `ack_${timeOfDay}` }],
  //       [{ text: "Skip today", callback_data: `skip_${timeOfDay}` }]
  //     ]
  //   }
  // };

    // Handle text messages
    if (msg.text) {
        bot.sendMessage(chatId, `You sent text: ${msg.text}`);
        console.log(msg);
    }
    // Handle photos
    else if (msg.photo) {
        bot.sendMessage(chatId, 'Thanks for the photo!');
    }
    // Handle documents
    else if (msg.document) {
        bot.sendMessage(chatId, 'I received your file!');
    }
    // Handle other message types
    else {
        bot.sendMessage(chatId, 'I received your message but I can only process text, photos, and documents.');
    }
    // console.log(msg.photo + `' '` + msg.from.first_name);
});






// Log bot info
bot.getMe().then((me) => {
  console.log(`Bot ${me.username} is running...`);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});












//learn building telegram both with node js
// https://core.telegram.org/bots/api
// https://core.telegram.org/bots/samples
//https://github.com/yagop/node-telegram-bot-api


// To use these examples:

// Choose the code example you want to use
// Add it to your index.js file
// Make sure it's after the bot initialization and before the app.listen() call
// Restart your bot
// Some helpful tips:

// Use msg.from to get information about the sender
// Use msg.chat to get information about the chat
// Always include error handling in production code
// Log important events for debugging
// Test your bot thoroughly with different types of messages
// Remember that msg object contains lots of useful information:

// msg.from.username: Sender's username
// msg.from.first_name: Sender's first name
// msg.chat.id: Chat ID (needed for replying)
// msg.text: The message text
// msg.photo: Array of photos (if present)
// msg.document: Document info (if present)






// // Simple message handler
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text;

//     // Log message details
//     console.log(`Received message from ${msg.from.username}: ${text}`);

//     // Send a reply
//     bot.sendMessage(chatId, `I received your message: ${text}`);
// });
// //Handle Different Message Types Here's a more advanced example that handles different types of messages:
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     // Handle text messages
//     if (msg.text) {
//         bot.sendMessage(chatId, `You sent text: ${msg.text}`);
//     }
//     // Handle photos
//     else if (msg.photo) {
//         bot.sendMessage(chatId, 'Thanks for the photo!');
//     }
//     // Handle documents
//     else if (msg.document) {
//         bot.sendMessage(chatId, 'I received your file!');
//     }
//     // Handle other message types
//     else {
//         bot.sendMessage(chatId, 'I received your message but I can only process text, photos, and documents.');
//     }
// });


// //Custom Keyboard Response Here's how to respond with custom keyboard options:
// bot.onText(/\/options/, (msg) => {
//     const chatId = msg.chat.id;
    
//     const keyboard = {
//         reply_markup: {
//             keyboard: [
//                 ['Option 1', 'Option 2'],
//                 ['Option 3', 'Option 4']
//             ],
//             resize_keyboard: true,
//             one_time_keyboard: true
//         }
//     };
    
//     bot.sendMessage(chatId, 'Please choose an option:', keyboard);
// });






// //Handle Specific Keywords Here's how to respond to specific keywords in messages:
// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text ? msg.text.toLowerCase() : '';

//     // Handle different keywords
//     switch(text) {
//         case 'hello':
//             bot.sendMessage(chatId, 'Hi there! 👋');
//             break;
//         case 'help':
//             bot.sendMessage(chatId, 'How can I assist you?');
//             break;
//         case 'bye':
//             bot.sendMessage(chatId, 'Goodbye! 👋');
//             break;
//         default:
//             // Handle other messages
//             if (msg.text) {
//                 bot.sendMessage(chatId, `You said: ${msg.text}`);
//             }


//     }
// });





// bot.launch().then(() => {
//     const botUsername = bot.botInfo.username;
//     console.log(`🤖 ${botUsername}_bot is running...`);
// });