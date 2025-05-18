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









// require('dotenv').config();
// const { Telegraf } = require('telegraf');
// const { getAIResponse } = require('./deepseek-api');
// const { solvingEquation, Calculator } = require('./solvingEquation');
// const fs = require('fs').promises;
// const path = require('path');
// const { measureMemory } = require('vm');

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
//     one_time_keyboard: false
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
//     chatStates.set(chatId, 'chatting_with_ai');
    
//     await ctx.reply('You are now chatting with the AI. Send a question or a file to analyze, or select another option to return to the main menu:', {
//         reply_markup: keyboardMarkup
//     });
// }

// function calculator(ctx){
//     const chatID = ctx.chat.id;
//     const messageText = ctx.message.text;
//     chatStates.set(chatID,  'calculator');
//     console.log(messageText);
//     const calculator = new Calculator();
//     const result = calculator.calculate(messageText);
//     ctx.reply(`The result is: ${result}`);
// }


// bot.on('message', async (ctx) => {
//     const chatId = ctx.chat.id;
//     const messageText = ctx.message.text || '';
//     const file = ctx.message.document || ctx.message.photo?.[ctx.message.photo.length - 1]; // Get document or highest-res photo


//     try {
//         // Check if user is in AI chat mode
//         if (chatStates.get(chatId) === 'chatting_with_ai') {
//             // Check if user selected a keyboard option
//             if (['សមីការដឺក្រេទី', 'ដោះស្រាយអនុគមន៍', 'គណនាលេខ', 'Asking AI'].includes(messageText)) {
//                 chatStates.delete(chatId);
//                 switch (messageText) {
//                     case 'Asking AI':
//                         await handleAIOption(ctx);
//                         break;
//                     case 'សមីការដឺក្រេទី':
//                         await ctx.reply('You selected: សមីការដឺក្រេទី', {
//                             reply_markup: keyboardMarkup
//                         });
//                         break;
//                     case 'ដោះស្រាយអនុគមន៍':
//                         await ctx.reply('You selected: ដោះស្រាយអនុគមន៍', {
//                             reply_markup: keyboardMarkup
//                         });
//                         break;
//                     case 'គណនាលេខ':
//                         await ctx.reply('Please Send me the number \n***Example: 2 + 2 ', {
//                             reply_markup: keyboardMarkup
//                             // calculator(chatID, ctx.text);
//                             // calculator(ctx);

//                         });
//                         break;
//                 }
//                 return;
//             }

//             // Handle AI chat (text or file)
//             await ctx.sendChatAction('typing');
//             let input;

//             // Handle file input
//             if (file) {
//                 const fileId = file.file_id;
//                 const fileInfo = await ctx.telegram.getFile(fileId);
//                 const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
//                 const fileName = file.file_name || `file_${fileId}${file.mime_type ? '.' + file.mime_type.split('/')[1] : '.jpg'}`;
//                 ctx.reply('This AI can analyze only File name Including extention only and probably take long time to respone \n\n***Please try to send as the text***');
                
//                 // Download file
//                 const response = await require('node-fetch')(fileUrl);
//                 const buffer = await response.buffer();
//                 const filePath = path.join(__dirname, 'Uploads', fileName);
//                 await fs.mkdir(path.dirname(filePath), { recursive: true });
//                 await fs.writeFile(filePath, buffer);

//                 // Prepare input based on file type
//                 input = {
//                     type: file.mime_type?.startsWith('image') ? 'image' : file.mime_type?.startsWith('text') || fileName.endsWith('.txt') ? 'text_file' : 'other',
//                     content: '',
//                     fileName,
//                     filePath
//                 };

//                 if (input.type === 'text_file') {
//                     input.content = await fs.readFile(filePath, 'utf8');
//                 } else if (input.type === 'image') {
//                     input.content = `User-uploaded image named ${fileName}.`; // Placeholder
//                     // Optional OCR (uncomment and install node-tesseract-ocr):
//                     /*
//                     const tesseract = require('node-tesseract-ocr');
//                     const ocrText = await tesseract.recognize(filePath, { lang: 'eng' });
//                     input.content += ` Extracted text: ${ocrText}`;
//                     */
//                 } else {
//                     input.content = `User-uploaded file named ${fileName} (type: ${file.mime_type || 'unknown'}).`;
//                 }

//                 // Clean up
//                 await fs.unlink(filePath).catch(() => {});
//             } else {
//                 // Handle text input
//                 input = {
//                     type: 'text',
//                     content: messageText,
//                     fileName: null,
//                     filePath: null
//                 };
//             }

//             // Get AI response
//             const aiResponse = await getAIResponse(input, chatId);

//             // Always send response as text
//             await ctx.reply(aiResponse, {
//                 reply_markup: keyboardMarkup
//             });
//             return;
//         }

//         // Handle initial keyboard selections
//         switch (messageText) {
//             case 'Asking AI':
//                 await handleAIOption(ctx);
//                 break;
//             case 'សមីការដឺក្រេទី':
//                 await ctx.reply('You selected: សមីការដឺក្រេទី', {
//                     reply_markup: keyboardMarkup

//                 });
//                 break;
//             case 'ដោះស្រាយអនុគមន៍':
//                 await ctx.reply('You selected: ដោះស្រាយអនុគមន៍', {
//                     reply_markup: keyboardMarkup
//                 });
//                 break;
//             case 'គណនាលេខ':
//                 ctx.reply('Please input the number \n***example: 2+2')
//                 // const result = calculator(messageText);
//                 calculator(ctx);
//                 break;
//             default:
//                 await ctx.reply('Please select an option from the keyboard:', {
//                     reply_markup: keyboardMarkup
//                 });
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         chatStates.delete(chatId);
//         await ctx.reply('⚠️ An error occurred. Please try again.', {
//             reply_markup: keyboardmarkup
//         });
//     }

// });

// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));

// bot.launch()
//   .then(async () => {
//     const botInfo = await bot.telegram.getMe();
//     console.log(`🤖 Bot ${botInfo.username} is running...`);
//   })
//   .catch((err) => {
//     console.error('Bot launch failed:', err);
//   });

// bot.launch().then(() => {
//     bot.telegram.getMe().then(botInfo => {
//         console.log(`🤖 Bot ${botInfo.username} is running...`);
//     });
// });













// grok generate for AI can analyze the file
// require('dotenv').config();
// const { Telegraf } = require('telegraf');
// const { getAIResponse } = require('./deepseek-api');
// const fs = require('fs').promises;
// const path = require('path');

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
//     one_time_keyboard: false
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
//     chatStates.set(chatId, 'chatting_with_ai');
    
//     await ctx.reply('You are now chatting with the AI. Send a question or a file to analyze, or select another option to return to the main menu:', {
//         reply_markup: keyboardMarkup
//     });
// }

// bot.on('message', async (ctx) => {
//     const chatId = ctx.chat.id;
//     const messageText = ctx.message.text || '';
//     const file = ctx.message.document || ctx.message.photo?.[ctx.message.photo.length - 1]; // Get document or highest-res photo

//     try {
//         // Check if user is in AI chat mode
//         if (chatStates.get(chatId) === 'chatting_with_ai') {
//             // Check if user selected a keyboard option
//             if (['សមីការដឺក្រេទី', 'ដោះស្រាយអនុគមន៍', 'គណនាលេខ', 'Asking AI'].includes(messageText)) {
//                 chatStates.delete(chatId);
//                 switch (messageText) {
//                     case 'Asking AI':
//                         await handleAIOption(ctx);
//                         break;
//                     case 'សមីការដឺក្រេទី':
//                         await ctx.reply('You selected: សមីការដឺក្រេទី', {
//                             reply_markup: keyboardMarkup
//                         });
//                         break;
//                     case 'ដោះស្រាយអនុគមន៍':
//                         await ctx.reply('You selected: ដោះស្រាយអនុគមន៍', {
//                             reply_markup: keyboardMarkup
//                         });
//                         break;
//                     case 'គណនាលេខ':
//                         await ctx.reply('You selected: គណនាលេខ', {
//                             reply_markup: keyboardMarkup
//                         });
//                         break;
//                 }
//                 return;
//             }

//             // Handle AI chat (text or file)
//             await ctx.sendChatAction('typing');
//             let input;

//             // Handle file input
//             if (file) {
//                 const fileId = file.file_id;
//                 const fileInfo = await ctx.telegram.getFile(fileId);
//                 const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
//                 const fileName = file.file_name || `file_${fileId}${file.mime_type ? '.' + file.mime_type.split('/')[1] : '.jpg'}`;
                
//                 // Download file
//                 const response = await require('node-fetch')(fileUrl);
//                 const buffer = await response.buffer();
//                 const filePath = path.join(__dirname, 'Uploads', fileName);
//                 await fs.mkdir(path.dirname(filePath), { recursive: true });
//                 await fs.writeFile(filePath, buffer);

//                 // Prepare input based on file type
//                 input = {
//                     type: file.mime_type?.startsWith('image') ? 'image' : file.mime_type?.startsWith('text') || fileName.endsWith('.txt') ? 'text_file' : 'other',
//                     content: '',
//                     fileName,
//                     filePath
//                 };

//                 if (input.type === 'text_file') {
//                     input.content = await fs.readFile(filePath, 'utf8');
//                 } else if (input.type === 'image') {
//                     input.content = `User-uploaded image named ${fileName}.`; // Placeholder
//                     // Optional OCR (uncomment and install node-tesseract-ocr):
//                     /*
//                     const tesseract = require('node-tesseract-ocr');
//                     const ocrText = await tesseract.recognize(filePath, { lang: 'eng' });
//                     input.content += ` Extracted text: ${ocrText}`;
//                     */
//                 } else {
//                     input.content = `User-uploaded file named ${fileName} (type: ${file.mime_type || 'unknown'}).`;
//                 }

//                 // Clean up
//                 await fs.unlink(filePath).catch(() => {});
//             } else {
//                 // Handle text input
//                 input = {
//                     type: 'text',
//                     content: messageText,
//                     fileName: null,
//                     filePath: null
//                 };
//             }

//             // Get AI response
//             const aiResponse = await getAIResponse(input, chatId);

//             // Always send response as text
//             await ctx.reply(aiResponse, {
//                 reply_markup: keyboardMarkup
//             });
//             return;
//         }

//         // Handle initial keyboard selections
//         switch (messageText) {
//             case 'Asking AI':
//                 await handleAIOption(ctx);
//                 break;
//             case 'សមីការដឺក្រេទី':
//                 await ctx.reply('You selected: សមីការដឺក្រេទី', {
//                     reply_markup: keyboardMarkup
//                 });
//                 break;
//             case 'ដោះស្រាយអនុគមន៍':
//                 await ctx.reply('You selected: ដោះស្រាយអនុគមន៍', {
//                     reply_markup: keyboardMarkup
//                 });
//                 break;
//             case 'គណនាលេខ':
//                 await ctx.reply('You selected: គណនាលេខ', {
//                     reply_markup: keyboardMarkup
//                 });
//                 break;
//             default:
//                 await ctx.reply('Please select an option from the keyboard:', {
//                     reply_markup: keyboardMarkup
//                 });
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         chatStates.delete(chatId);
//         await ctx.reply('⚠️ An error occurred. Please try again.', {
//             reply_markup: keyboardmarkup
//         });
//     }
// });

// bot.launch().then(() => {
//     console.log('🤖 Bot is running...');
// });

// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));











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





require('dotenv').config();
const { Telegraf } = require('telegraf');
const { getAIResponse } = require('./deepseek-api');
const { solvingEquation, Calculator } = require('./solvingEquation');
const fs = require('fs').promises;
const path = require('path');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// ==============================================
// 1. CONVERSATION STATES & CONFIGURATION
// ==============================================
const CHAT_STATES = {
    AI_CHAT: 'chatting_with_ai',
    CALCULATOR: 'waiting_calculation',
    EQUATION: 'waiting_equation',
    FUNCTION: 'waiting_function'
};

const chatStates = new Map();
const calculator = new Calculator();

// Keyboard configuration
const options = [
    ['សមីការដឺក្រេទី 2', 'ដោះស្រាយអនុគមន៍'],
    ['គណនាលេខ', 'Asking AI']
];

const keyboardMarkup = {
    keyboard: options,
    resize_keyboard: true,
    one_time_keyboard: false
};

// ==============================================
// 2. CORE FUNCTIONALITY
// ==============================================

// Start command
bot.start((ctx) => {
    ctx.reply('Hello! Welcome to my bot! 👋\nSelect an option:', {
        reply_markup: keyboardMarkup
    });
});

// ==============================================
// 3. CALCULATOR HANDLERS
// ==============================================
async function handleCalculator(ctx) {
    try {
        const messageText = ctx.message.text;
        const result = calculator.calculate(messageText);
        chatStates.delete(ctx.chat.id);
        await ctx.reply(`✅ Result: ${result}`, {
            reply_markup: keyboardMarkup
        });
    } catch (error) {
        await ctx.reply(`❌ Error: ${error.message}\nPlease enter a valid expression (e.g., 2 + 2):`, {
            reply_markup: keyboardMarkup
        });
    }
}

// ==============================================
// 4. AI CHAT HANDLERS
// ==============================================
async function handleAIOption(ctx) {
    const chatId = ctx.chat.id;
    chatStates.set(chatId, CHAT_STATES.AI_CHAT);
    
    await ctx.reply('You are now chatting with the AI. Send a question or a file to analyze:', {
        reply_markup: keyboardMarkup
    });
}

async function handleAIChat(ctx) {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text || '';
    const file = ctx.message.document || ctx.message.photo?.[ctx.message.photo.length - 1];

    try {
        await ctx.sendChatAction('typing');
        let input;

        // File handling
        if (file) {
            const fileId = file.file_id;
            const fileInfo = await ctx.telegram.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
            const fileName = file.file_name || `file_${fileId}${file.mime_type ? '.' + file.mime_type.split('/')[1] : '.jpg'}`;

            // Download and process file
            const response = await fetch(fileUrl);
            const buffer = await response.buffer();
            const filePath = path.join(__dirname, 'Uploads', fileName);
            
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, buffer);
            
            input = {
                type: 'file',
                content: await fs.readFile(filePath, 'utf8').catch(() => ''),
                fileName,
                filePath
            };

            await fs.unlink(filePath).catch(() => {});
        } else {
            input = {
                type: 'text',
                content: messageText
            };
        }

        // Get AI response
        const aiResponse = await getAIResponse(input, chatId);
        await ctx.reply(aiResponse, { reply_markup: keyboardMarkup });

    } catch (error) {
        console.error('AI Error:', error);
        await ctx.reply('⚠️ AI service unavailable. Please try again later.', {
            reply_markup: keyboardMarkup
        });
    }
}

// ==============================================
// 5. MAIN MESSAGE HANDLER
// ==============================================
bot.on('message', async (ctx) => {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text || '';
    const currentState = chatStates.get(chatId);

    // Handle current conversation state first
    if (currentState) {
        switch (currentState) {
            case CHAT_STATES.CALCULATOR:
                return handleCalculator(ctx);
            case CHAT_STATES.AI_CHAT:
                return handleAIChat(ctx);
            case CHAT_STATES.EQUATION:
                // Add equation solving logic here
                return ctx.reply('Equation solving feature coming soon!');
            case CHAT_STATES.FUNCTION:
                // Add function solving logic here
                return ctx.reply('Function solving feature coming soon!');
        }
    }

    // Handle new commands
    try {
        switch (messageText) {
            case 'Asking AI':
                return handleAIOption(ctx);
            case 'សមីការដឺក្រេទី':
                chatStates.set(chatId, CHAT_STATES.EQUATION);
                return ctx.reply('Please enter your equation:', {
                    reply_markup: keyboardMarkup
                });
            case 'ដោះស្រាយអនុគមន៍':
                chatStates.set(chatId, CHAT_STATES.FUNCTION);
                return ctx.reply('Please enter your function:', {
                    reply_markup: keyboardMarkup
                });
            case 'គណនាលេខ':
                chatStates.set(chatId, CHAT_STATES.CALCULATOR);
                return ctx.reply('Please enter your calculation (e.g., 2 + 2):', {
                    reply_markup: keyboardMarkup
                });
            default:
                return ctx.reply('Please select an option from the keyboard:', {
                    reply_markup: keyboardMarkup
                });
        }
    } catch (error) {
        console.error('Handler Error:', error);
        chatStates.delete(chatId);
        return ctx.reply('⚠️ An error occurred. Please try again.', {
            reply_markup: keyboardMarkup
        });
    }
});

// ==============================================
// 6. SYSTEM MANAGEMENT
// ==============================================
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch()
  .then(async () => {
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 ${botInfo.first_name} [@${botInfo.username}] is operational`);
  })
  .catch((err) => {
    console.error('Launch failure:', err);
    process.exit(1);
  });