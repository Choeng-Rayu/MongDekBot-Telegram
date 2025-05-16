// // deepseek-api.js
// require('dotenv').config();
// const axios = require('axios');

// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';

// async function getAIResponse(prompt) {
//     try {
//         const response = await axios.post(
//             DEEPSEEK_API_URL,
//             {
//                 model: 'deepseek-chat',
//                 messages: [{ role: 'user', content: prompt }],
//                 temperature: 0.7
//             },
//             {
//                 headers: {
//                     'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );
        
//         return response.data.choices[0].message.content;
//     } catch (error) {
//         console.error('DeepSeek API Error:', error.response?.data || error.message);
//         throw new Error('Failed to get AI response');
//     }
// }

// module.exports = { getAIResponse };








//generate by grok
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { getAIResponse } = require('./deepseek-api');
const fs = require('fs').promises;
const path = require('path');

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
    one_time_keyboard: false
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
    
    await ctx.reply('You are now chatting with the AI. Send a question or a file to analyze, or select another option to return to the main menu:', {
        reply_markup: keyboardMarkup
    });
}

bot.on('message', async (ctx) => {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text || '';
    const file = ctx.message.document || ctx.message.photo?.[ctx.message.photo.length - 1]; // Get document or highest-res photo

    try {
        // Check if user is in AI chat mode
        if (chatStates.get(chatId) === 'chatting_with_ai') {
            // Check if user selected a keyboard option
            if (['សមីការដឺក្រេទី', 'ដោះស្រាយអនុគមន៍', 'គណនាលេខ', 'Asking AI'].includes(messageText)) {
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

            // Handle AI chat (text or file)
            await ctx.sendChatAction('typing');
            let inputContent = messageText;
            let isFileResponseRequested = messageText.toLowerCase().includes('send as file') || !!file;

            // Handle file input
            if (file) {
                const fileId = file.file_id;
                const fileInfo = await ctx.telegram.getFile(fileId);
                const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
                const fileName = file.file_name || `file_${fileId}${file.mime_type ? '.' + file.mime_type.split('/')[1] : '.jpg'}`;
                
                // Download file
                const response = await require('node-fetch')(fileUrl);
                const buffer = await response.buffer();
                const filePath = path.join(__dirname, 'uploads', fileName);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, buffer);

                // Process file based on type
                if (file.mime_type?.startsWith('text') || fileName.endsWith('.txt')) {
                    inputContent = await fs.readFile(filePath, 'utf8');
                    inputContent = `Analyze this text file content: ${inputContent}`;
                } else if (file.mime_type?.startsWith('image')) {
                    inputContent = `Analyze this image: A user-uploaded image named ${fileName}. Please provide a general analysis or description.`;
                    // Note: DeepSeek doesn't process images directly; consider OCR for actual content
                } else {
                    inputContent = `Analyze this file: A user-uploaded file named ${fileName}. Provide a general analysis based on the file type.`;
                }

                // Clean up
                await fs.unlink(filePath).catch(() => {});
            }

            // Get AI response
            const aiResponse = await getAIResponse(inputContent, chatId);

            // Send response as file if requested or input was a file
            if (isFileResponseRequested) {
                const responseFilePath = path.join(__dirname, 'uploads', `response_${chatId}.txt`);
                await fs.writeFile(responseFilePath, aiResponse);
                await ctx.replyWithDocument({
                    source: responseFilePath,
                    filename: `ai_response_${chatId}.txt`
                }, {
                    reply_markup: keyboardMarkup
                });
                await fs.unlink(responseFilePath).catch(() => {});
            } else {
                await ctx.reply(aiResponse, {
                    reply_markup: keyboardMarkup
                });
            }
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
        await ctx.reply('⚠️ An error occurred. Please try again.', {
            reply_markup: keyboardMarkup
        });
    }
});

bot.launch().then(() => {
    console.log('🤖 Bot is running...');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));





























// //Grok generate for OPEN_AI
// const { OpenAI } = require('openai');
// require('dotenv').config();

// const client = new OpenAI({
//     apiKey: process.env.DEEPSEEK_API_KEY,
//     baseUrl: 'https://api.deepseek.com'
// });

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

//         // Call DeepSeek API with caching
//         const response = await client.chat.completions.create({
//             model: 'deepseek-chat',
//             messages: [
//                 { role: 'system', content: 'You are a helpful assistant.' },
//                 ...history // Include conversation history
//             ],
//             extra_headers: {
//                 'X-Cache-Key': cacheKey // Enable caching
//             }
//         });

//         // Add AI response to history
//         const aiResponse = response.choices[0].message.content;
//         history.push({ role: 'assistant', content: aiResponse });

//         // Limit history to avoid excessive token usage
//         if (history.length > 10) {
//             history.splice(0, history.length - 10); // Keep last 10 messages
//         }

//         return aiResponse;
//     } catch (error) {
//         console.error('DeepSeek API Error:', error);
//         throw error;
//     }
// }

// module.exports = { getAIResponse };