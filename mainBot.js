// // bot.js
// require('dotenv').config();
// const { Telegraf } = require('telegraf');
// const { getAIResponse } = require('./deepseek-api');

// const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const bot = new Telegraf(BOT_TOKEN);

// // Keyboard configuration
// const options = [
//     ['សមីការដឺក្រេទី', 'ដោះស្រាយអនុគមន៍'],
//     ['គណនាលេខ', 'Asking AI']
// ];

// const keyboardMarkup = {
//     keyboard: options,
//     resize_keyboard: true,
//     one_time_keyboard: true
// };

// // Conversation states
// const chatStates = new Map();

// bot.start((ctx) => {
//     ctx.reply('Hello! Welcome to my bot! 👋\nSelect an option:', {
//         reply_markup: keyboardMarkup
//     });
// });

// async function handleAIOption(ctx) {
//     const chatId = ctx.chat.id;
//     chatStates.set(chatId, 'awaiting_ai_input');
    
//     await ctx.reply('Please enter your question for AI:', {
//         reply_markup: { remove_keyboard: true }
//     });
// }

// bot.on('message', async (ctx) => {
//     const chatId = ctx.chat.id;
//     const messageText = ctx.message.text;

//     try {
//         if (chatStates.get(chatId) === 'awaiting_ai_input') {
//             chatStates.delete(chatId);
//             await ctx.sendChatAction('typing');
            
//             // Call the separated API function
//             const aiResponse = await getAIResponse(messageText);
            
//             await ctx.reply(aiResponse, {
//                 reply_markup: keyboardMarkup
//             });
//             return;
//         }

//         switch(messageText) {
//             case 'Asking AI':
//                 await handleAIOption(ctx);
//                 break;
//             case 'សមីការដឺក្រេទី':
//                 await ctx.reply('You selected: សមីការដឺក្រេទី');
//                 break;
//             case 'ដោះស្រាយអនុគមន៍':
//                 await ctx.reply('You selected: ដោះស្រាយអនុគមន៍');
//                 break;
//             case 'គណនាលេខ':
//                 await ctx.reply('You selected: គណនាលេខ');
//                 break;
//             default:
//                 await ctx.reply(messageText);
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         chatStates.delete(chatId);
//         await ctx.reply('⚠️ An error occurred. Please try again.', {
//             reply_markup: keyboardMarkup
//         });
//     }
// });

// bot.launch().then(() => {
//     console.log('🤖 Bot MongDekBot is running...');
// });


// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));

























// for grok generate
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { getAIResponse } = require('./deepseek-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// Keyboard configuration
const options = [
    ['សមីការដឺក្រេទី', 'ដោះស្រាយអនុគមន៍'],
    ['គណនាលេខ', 'Asking AI']
];

const keyboardMarkup = {
    keyboard: options,
    resize_keyboard: true,
    one_time_keyboard: false // Changed to false to keep keyboard persistent
};

// Conversation states
const chatStates = new Map();

bot.start((ctx) => {
    ctx.reply('Hello! Welcome to my bot! 👋\nSelect an option:', {
        reply_markup: keyboardMarkup
    });
});

async function handleAIOption(ctx) {
    const chatId = ctx.chat.id;
    chatStates.set(chatId, 'chatting_with_ai');
    
    await ctx.reply('You are now chatting with the AI. Ask your question, or select another option from the keyboard to return to the main menu:', {
        reply_markup: keyboardMarkup // Keep keyboard visible
    });
}

bot.on('message', async (ctx) => {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text;
    const massageDocument = ctx.message.document;

    try {
        // Check if user is in AI chat mode
        if (chatStates.get(chatId) === 'chatting_with_ai') {
            // Check if user selected a keyboard option
            if (['សមីការដឺក្រេទី', 'ដោះស្រាយអនុគមន៍', 'គណនាលេខ', 'Asking AI'].includes(messageText)) {
                // Handle the new option and exit AI mode
                chatStates.delete(chatId);
                switch (messageText) {
                    case 'Asking AI':
                        await handleAIOption(ctx);
                        break;
                    case 'សមីការដឺក្រេទី':
                        await ctx.reply('You selected: សមីការដឺក្រេទី', {
                            reply_markup: keyboardMarkup
                        });
                        break;
                    case 'ដោះស្រាយអនុគមន៍':
                        await ctx.reply('You selected: ដោះស្រាយអនុគមន៍', {
                            reply_markup: keyboardMarkup
                        });
                        break;
                    case 'គណនាលេខ':
                        await ctx.reply('You selected: គណនាលេខ', {
                            reply_markup: keyboardMarkup
                        });
                        break;
                }
                return;
            }

            if (massageDocument) {
                await ctx.sendChatAction('sending_document');
                // const file = await ctx.getFile(massageDocument.file_id);
                // const fileData = await file.download();
                // const fileExtension = file.name.split('.').pop().toLowerCase();
                const aiResponse = await getAIResponse(massageDocument, chatId);
                await ctx.reply(aiResponse, {
                    reply_markup: keyboardMarkup
                });
                return;
            }
            // Handle AI chat
            await ctx.sendChatAction('typing');
            const aiResponse = await getAIResponse(messageText, chatId);
            await ctx.reply(aiResponse, {
                reply_markup: keyboardMarkup
            });
            return;
        }

        // Handle initial keyboard selections
        switch (messageText) {
            case 'Asking AI':
                await handleAIOption(ctx);
                break;
            case 'សមីការដឺក្រេទី':
                await ctx.reply('You selected: សមីការដឺក្រេទី', {
                    reply_markup: keyboardMarkup
                });
                break;
            case 'ដោះស្រាយអនុគមន៍':
                await ctx.reply('You selected: ដោះស្រាយអនុគមន៍', {
                    reply_markup: keyboardMarkup
                });
                break;
            case 'គណនាលេខ':
                await ctx.reply('You selected: គណនាលេខ', {
                    reply_markup: keyboardMarkup
                });
                break;
            default:
                await ctx.reply('Please select an option from the keyboard:', {
                    reply_markup: keyboardMarkup
                });
        }
    } catch (error) {
        console.error('Error:', error);
        chatStates.delete(chatId);
        await ctx.reply('⚠️ An error occurred/can not read any file. Please try send as the text again.', {
            reply_markup: keyboardMarkup
        });
    }
});

bot.launch().then(() => {
    console.log('🤖 Bot is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));















// // generate for extract image
// const axios = require('axios');
// require('dotenv').config();

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// const conversationHistory = new Map(); // Store history per chat

// async function getAIResponse(message, chatId) {
//     try {
//         // Retrieve or initialize conversation history
//         if (!conversationHistory.has(chatId)) {
//             conversationHistory.set(chatId, []);
//         }
//         const history = conversationHistory.get(chatId);

//         // Add user message to history
//         history.push({ role: 'user', content: message });

//         // Generate a unique cache key for this chat
//         const cacheKey = `chat_${chatId}`;

//         // Prepare request payload
//         const payload = {
//             model: 'deepseek-chat',
//             messages: [
//                 { role: 'system', content: 'You are a helpful assistant capable of analyzing text and describing files.' },
//                 ...history // Include conversation history
//             ]
//         };

//         // Make API request with caching
//         const response = await axios.post(API_URL, payload, {
//             headers: {
//                 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//                 'Content-Type': 'application/json',
//                 'X-Cache-Key': cacheKey // Enable context caching
//             }
//         });

//         // Extract AI response
//         const aiResponse = response.data.choices[0].message.content;

//         // Add AI response to history
//         history.push({ role: 'assistant', content: aiResponse });

//         // Limit history to avoid excessive token usage
//         if (history.length > 10) {
//             history.splice(0, history.length - 10); // Keep last 10 messages
//         }

//         return aiResponse;
//     } catch (error) {
//         console.error('DeepSeek API Error:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// module.exports = { getAIResponse };