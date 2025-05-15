const TelegramBot = require('node-telegram-bot-api');
const express = require('express'); // Remove if not needed

// Use environment variable for token
const BOT_TOKEN = '8149726762:AAGdzSpr81r37CG_TFQ26NM-GJ9MZZ0i7yE';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const option1 = 'សមីការដឺក្រេទី';
const option2 = 'ដោះស្រាយអនុគមន៍';
const option3 = 'គណនាលេខ';
const option4 = 'Asking AI';

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        reply_markup: {
            keyboard: [
                [option1 , option2 ],
                [option3 , option4 ]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };
    bot.sendMessage(chatId, 'Hello! Welcome to my bot! 👋\nSelect an option:', keyboard);
    console.log(msg);
});

// Handle option selection
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === 'សមីការដឺក្រេទី') {
        bot.sendMessage(chatId, 'You selected: សមីការដឺក្រេទី');
    } else if (msg.text === 'ដោះស្រាយអនុគមន៍') {
        bot.sendMessage(chatId, 'You selected: ដោះស្រាយអនុគមន៍');
    } else if (msg.text === 'គណនាលេខ') {
        bot.sendMessage(chatId, 'You selected: គណនាលេខ');
    } else if (msg.text === 'Asking AI') {
        bot.sendMessage(chatId, 'You selected: Option 4');
    }else{
        bot.sendMessage(chatId, msg.text);
    }
});

bot.getMe().then((me) => {
    console.log(`Bot ${me.username} is running...`);
});

// Start the server
const app = express();
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
