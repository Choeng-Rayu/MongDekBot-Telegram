require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/telegram_bot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User schema with array of alarms
const userSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  alarms: [{
    time: String, // HH:MM format
    jobName: String,
    pending: { type: Boolean, default: false }
  }],
  streak: { type: Number, default: 0 },
  lastActive: Date
});

const User = mongoose.model('User', userSchema);

// Initialize bot and server
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);
const app = express();
app.use(bodyParser.json());

// Store active jobs
const activeJobs = {};

// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start server and set webhook
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const webhookUrl = 'https://your-railway-app.railway.app/webhook'; // Replace with your Railway URL
  bot.setWebHook(webhookUrl).then(() => {
    console.log('Webhook set successfully');
  }).catch(err => {
    console.error('Error setting webhook:', err);
  });
});

// Schedule all alarms for a user
async function scheduleUserAlarms(chatId) {
  const user = await User.findOne({ chatId });
  if (!user) return;

  // Cancel existing jobs
  user.alarms.forEach(alarm => {
    if (alarm.jobName && activeJobs[alarm.jobName]) {
      activeJobs[alarm.jobName].cancel();
      delete activeJobs[alarm.jobName];
    }
  });

  // Schedule new jobs
  user.alarms.forEach((alarm, index) => {
    const [hour, minute] = alarm.time.split(':').map(Number);
    const jobName = `alarm_${chatId}_${index}`;
    activeJobs[jobName] = schedule.scheduleJob(
      { hour, minute, tz: 'Asia/Phnom_Penh' },
      async () => {
        await sendAlarmMessage(chatId, index);
      }
    );
    alarm.jobName = jobName;
  });

  await user.save();
}

// Send alarm message with 1-hour timeout
async function sendAlarmMessage(chatId, alarmIndex) {
  const user = await User.findOne({ chatId });
  if (!user || alarmIndex >= user.alarms.length) return;

  const alarm = user.alarms[alarmIndex];
  const message = `🔔 Alarm at ${alarm.time}! Reply "OK" when done.`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "I did it!", callback_data: `ack_${alarmIndex}` }],
        [{ text: "Skip", callback_data: `skip_${alarmIndex}` }]
      ]
    }
  };

  await bot.sendMessage(chatId, message, options);
  alarm.pending = true;
  await user.save();

  // 1-hour timeout
  setTimeout(async () => {
    const updatedUser = await User.findOne({ chatId });
    if (!updatedUser || alarmIndex >= updatedUser.alarms.length) return;
    
    const updatedAlarm = updatedUser.alarms[alarmIndex];
    if (updatedAlarm.pending) {
      await bot.sendMessage(chatId, `⚠️ You missed your alarm at ${updatedAlarm.time}. Streak reset!`);
      updatedUser.streak = 0;
      updatedAlarm.pending = false;
      await updatedUser.save();
    }
  }, 60 * 60 * 1000); // 1 hour
}

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  let user = await User.findOne({ chatId });

  if (!user) {
    user = new User({ chatId, alarms: [] });
    await user.save();
  }

  const options = {
    reply_markup: {
      keyboard: [
        [{ text: "⏰ Add Alarm" }, { text: "📋 List Alarms" }],
        [{ text: "📊 My Stats" }, { text: "❌ Unsubscribe" }]
      ],
      resize_keyboard: true
    }
  };

  await bot.sendMessage(chatId, 
    `Welcome! Use /addalarm HH:MM to set exactly 10 alarms.\n` +
    `Current alarms: ${user.alarms.length}/10`, 
    options
  );
});

// Handle /addalarm command
bot.onText(/\/addalarm (\d{2}:\d{2})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const time = match[1];
  const user = await User.findOne({ chatId });

  if (!user) {
    await bot.sendMessage(chatId, "Please use /start first.");
    return;
  }

  if (user.alarms.length >= 10) {
    await bot.sendMessage(chatId, "You already have 10 alarms set!");
    return;
  }

  user.alarms.push({ time, pending: false });
  await user.save();
  await scheduleUserAlarms(chatId);
  
  const remaining = 10 - user.alarms.length;
  await bot.sendMessage(chatId, 
    `Alarm set for ${time}. ${remaining} more alarms needed ` +
    `to reach 10.`
  );
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const user = await User.findOne({ chatId });
  
  if (!user) return;
  
  if (data.startsWith('ack_')) {
    const alarmIndex = parseInt(data.split('_')[1]);
    if (alarmIndex < user.alarms.length) {
      user.alarms[alarmIndex].pending = false;
      user.streak += 1;
      user.lastActive = new Date();
      await user.save();
      
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: `Great job! ${user.streak} day streak!` 
      });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: callbackQuery.message.message_id }
      );
    }
  } else if (data.startsWith('skip_')) {
    const alarmIndex = parseInt(data.split('_')[1]);
    if (alarmIndex < user.alarms.length) {
      user.alarms[alarmIndex].pending = false;
      await user.save();
      
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: "Okay, skipped for today." 
      });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [] },
        { chat_id: chatId, message_id: callbackQuery.message.message_id }
      );
    }
  }
});

// Handle "List Alarms" command
bot.onText(/List Alarms/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId });
  
  if (!user || user.alarms.length === 0) {
    await bot.sendMessage(chatId, "You have no alarms set.");
    return;
  }

  const alarmList = user.alarms.map((alarm, index) => 
    `${index + 1}. ${alarm.time}`
  ).join('\n');
  await bot.sendMessage(chatId, `Your alarms:\n${alarmList}`);
});

// Handle "My Stats" command
bot.onText(/My Stats/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId });
  
  if (!user) return;
  
  const statsMessage = `
📊 Your Stats:
- Current Streak: ${user.streak} days
- Alarms Set: ${user.alarms.length}/10
- Last Active: ${user.lastActive ? user.lastActive.toLocaleString() : 'Never'}
  `;
  
  await bot.sendMessage(chatId, statsMessage);
});

// Handle "Unsubscribe" command
bot.onText(/Unsubscribe/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ chatId });
  
  if (!user) return;
  
  user.alarms.forEach(alarm => {
    if (alarm.jobName && activeJobs[alarm.jobName]) {
      activeJobs[alarm.jobName].cancel();
      delete activeJobs[alarm.jobName];
    }
  });
  
  await User.deleteOne({ chatId });
  await bot.sendMessage(chatId, 
    "You've been unsubscribed. Use /start to subscribe again."
  );
});

bot.getMe().then((me)=>{
  console.log(`Bot ${me.username} is running`);
});








// require('dotenv').config();
// const TelegramBot = require('node-telegram-bot-api');
// const schedule = require('node-schedule');
// const mongoose = require('mongoose');

// // Connect to MongoDB (replace with your connection string)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/telegram_bot', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// // User schema
// const userSchema = new mongoose.Schema({
//   chatId: { type: Number, required: true, unique: true },
//   morningTime: { type: String, default: '11:30' },
//   eveningTime: { type: String, default: '20:00' },
//   morningJobName: String,
//   eveningJobName: String,
//   pendingMorning: { type: Boolean, default: false },
//   pendingEvening: { type: Boolean, default: false },
//   streak: { type: Number, default: 0 },
//   lastActive: Date
// });

// const User = mongoose.model('User', userSchema);

// // Load token from .env file
// const token = process.env.TELEGRAM_BOT_TOKEN;
// const bot = new TelegramBot(token, { polling: true });

// // Store active jobs
// const activeJobs = {};

// // Log bot info
// bot.getMe().then((me) => {
//   console.log(`Bot ${me.username} is running...`);
// });

// // Cancel and reschedule jobs for a user
// async function scheduleUserJobs(chatId) {
//   const user = await User.findOne({ chatId });
//   if (!user) return;

//   // Cancel existing jobs
//   if (user.morningJobName && activeJobs[user.morningJobName]) {
//     activeJobs[user.morningJobName].cancel();
//     delete activeJobs[user.morningJobName];
//   }
//   if (user.eveningJobName && activeJobs[user.eveningJobName]) {
//     activeJobs[user.eveningJobName].cancel();
//     delete activeJobs[user.eveningJobName];
//   }

//   // Schedule morning message
//   const [morningHour, morningMinute] = user.morningTime.split(':').map(Number);
//   const morningJobName = `morning_${chatId}`;
//   activeJobs[morningJobName] = schedule.scheduleJob(
//     { hour: morningHour, minute: morningMinute, tz: 'Asia/Phnom_Penh' },
//     async () => {
//       await sendScheduledMessage(chatId, 'morning');
//     }
//   );

//   // Schedule evening message
//   const [eveningHour, eveningMinute] = user.eveningTime.split(':').map(Number);
//   const eveningJobName = `evening_${chatId}`;
//   activeJobs[eveningJobName] = schedule.scheduleJob(
//     { hour: eveningHour, minute: eveningMinute, tz: 'Asia/Phnom_Penh' },
//     async () => {
//       await sendScheduledMessage(chatId, 'evening');
//     }
//   );

//   // Update user with job names
//   user.morningJobName = morningJobName;
//   user.eveningJobName = eveningJobName;
//   await user.save();
// }

// async function sendScheduledMessage(chatId, timeOfDay) {
//   const user = await User.findOne({ chatId });
//   if (!user) return;

//   const message = timeOfDay === 'morning' 
//     ? `🌞 Good morning! It's time for your morning routine! Reply "OK" when done.` 
//     : `🌙 Good evening! Time for your evening reflection. Reply "OK" when done.`;

//   const options = {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: "I did it!", callback_data: `ack_${timeOfDay}` }],
//         [{ text: "Skip today", callback_data: `skip_${timeOfDay}` }]
//       ]
//     }
//   };

//   await bot.sendMessage(chatId, message, options);
  
//   // Mark as pending
//   if (timeOfDay === 'morning') {
//     user.pendingMorning = true;
//   } else {
//     user.pendingEvening = true;
//   }
//   await user.save();

//   // Set timeout to check if user responded (e.g., 6 hours)
//   setTimeout(async () => {
//     const updatedUser = await User.findOne({ chatId });
//     if (!updatedUser) return;

//     if ((timeOfDay === 'morning' && updatedUser.pendingMorning) || 
//         (timeOfDay === 'evening' && updatedUser.pendingEvening)) {
//       await bot.sendMessage(chatId, `⚠️ You missed your ${timeOfDay} activity. Your streak has been reset.`);
//       updatedUser.streak = 0;
//       if (timeOfDay === 'morning') {
//         updatedUser.pendingMorning = false;
//       } else {
//         updatedUser.pendingEvening = false;
//       }
//       await updatedUser.save();
//     }
//   }, 6 * 60 * 60 * 1000); // 6 hours
// }

// // Handle /start command
// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;
//   let user = await User.findOne({ chatId });

//   if (!user) {
//     user = new User({ chatId });
//     await user.save();
//     await scheduleUserJobs(chatId);
//   }

//   const options = {
//     reply_markup: {
//       keyboard: [
//         [{ text: "⏰ Set Morning Time" }, { text: "🌙 Set Evening Time" }],
//         [{ text: "📊 My Stats" }, { text: "❌ Unsubscribe" }]
//       ],
//       resize_keyboard: true
//     }
//   };

//   await bot.sendMessage(chatId, `Welcome back! Here are your options:`, options);
// });

// // Handle time setting
// bot.onText(/Set (Morning|Evening) Time/, async (msg, match) => {
//   const chatId = msg.chat.id;
//   const timeOfDay = match[1].toLowerCase();
  
//   await bot.sendMessage(chatId, `Please enter your ${timeOfDay} time in 24-hour format (HH:MM), Cambodia timezone.\nExample: ${timeOfDay === 'morning' ? '07:30' : '20:00'}`);
  
//   // Store that we're expecting a time input
//   // In a real implementation, you'd use conversation handlers or state management
// });

// // Handle time input
// bot.on('message', async (msg) => {
//   if (!msg.text) return;
  
//   const chatId = msg.chat.id;
//   const text = msg.text;
  
//   // Check if it's a time input (HH:MM format)
//   if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
//     const user = await User.findOne({ chatId });
//     if (!user) return;
    
//     // Determine if we're setting morning or evening time based on previous message
//     // In a real app, you'd track this state properly
//     const isMorning = text.split(':')[0] < 12;
    
//     if (isMorning) {
//       user.morningTime = text;
//     } else {
//       user.eveningTime = text;
//     }
    
//     await user.save();
//     await scheduleUserJobs(chatId);
//     await bot.sendMessage(chatId, `${isMorning ? 'Morning' : 'Evening'} time set to ${text}!`);
//   }
// });

// // Handle callback queries (button presses)
// bot.on('callback_query', async (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;
//   const user = await User.findOne({ chatId });
  
//   if (!user) return;
  
//   if (data.startsWith('ack_')) {
//     const timeOfDay = data.split('_')[1];
    
//     if (timeOfDay === 'morning') {
//       user.pendingMorning = false;
//     } else {
//       user.pendingEvening = false;
//     }
    
//     user.streak += 1;
//     user.lastActive = new Date();
//     await user.save();
    
//     await bot.answerCallbackQuery(callbackQuery.id, { text: `Great job! ${user.streak} day streak!` });
//     await bot.editMessageReplyMarkup(
//       { inline_keyboard: [] },
//       { chat_id: chatId, message_id: callbackQuery.message.message_id }
//     );
//   } else if (data.startsWith('skip_')) {
//     const timeOfDay = data.split('_')[1];
    
//     if (timeOfDay === 'morning') {
//       user.pendingMorning = false;
//     } else {
//       user.pendingEvening = false;
//     }
    
//     await user.save();
    
//     await bot.answerCallbackQuery(callbackQuery.id, { text: "Okay, skipped for today." });
//     await bot.editMessageReplyMarkup(
//       { inline_keyboard: [] },
//       { chat_id: chatId, message_id: callbackQuery.message.message_id }
//     );
//   }
// });

// // Handle stats command
// bot.onText(/My Stats/, async (msg) => {
//   const chatId = msg.chat.id;
//   const user = await User.findOne({ chatId });
  
//   if (!user) return;
  
//   const statsMessage = `
// 📊 Your Stats:
// - Current Streak: ${user.streak} days
// - Morning Time: ${user.morningTime}
// - Evening Time: ${user.eveningTime}
// - Last Active: ${user.lastActive ? user.lastActive.toLocaleString() : 'Never'}
//   `;
  
//   await bot.sendMessage(chatId, statsMessage);
// });

// // Handle unsubscribe
// bot.onText(/Unsubscribe/, async (msg) => {
//   const chatId = msg.chat.id;
//   const user = await User.findOne({ chatId });
  
//   if (!user) return;
  
//   // Cancel jobs
//   if (user.morningJobName && activeJobs[user.morningJobName]) {
//     activeJobs[user.morningJobName].cancel();
//     delete activeJobs[user.morningJobName];
//   }
//   if (user.eveningJobName && activeJobs[user.eveningJobName]) {
//     activeJobs[user.eveningJobName].cancel();
//     delete activeJobs[user.eveningJobName];
//   }
  
//   await User.deleteOne({ chatId });
//   await bot.sendMessage(chatId, "You've been unsubscribed from all messages. Use /start to subscribe again.");
// });

// // Error handling
// bot.on('polling_error', (error) => {
//   console.log(error);
// });

// console.log('Bot is running...');