// bot.js
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
    one_time_keyboard: true
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
    chatStates.set(chatId, 'awaiting_ai_input');
    
    await ctx.reply('Please enter your question for AI:', {
        reply_markup: { remove_keyboard: true }
    });
}

bot.on('message', async (ctx) => {
    const chatId = ctx.chat.id;
    const messageText = ctx.message.text;

    try {
        if (chatStates.get(chatId) === 'awaiting_ai_input') {
            chatStates.delete(chatId);
            await ctx.sendChatAction('typing');
            
            // Call the separated API function
            const aiResponse = await getAIResponse(messageText);
            
            await ctx.reply(aiResponse, {
                reply_markup: keyboardMarkup
            });
            return;
        }

        switch(messageText) {
            case 'Asking AI':
                await handleAIOption(ctx);
                break;
            case 'សមីការដឺក្រេទី':
                await ctx.reply('You selected: សមីការដឺក្រេទី');
                break;
            case 'ដោះស្រាយអនុគមន៍':
                await ctx.reply('You selected: ដោះស្រាយអនុគមន៍');
                break;
            case 'គណនាលេខ':
                await ctx.reply('You selected: គណនាលេខ');
                break;
            default:
                await ctx.reply(messageText);
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