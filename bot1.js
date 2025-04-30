process.removeAllListeners('warning');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');
const mongoose = require('mongoose');

// Improved MongoDB connection with error handling
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/telegram_bot');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// User schema definition
const userSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  morningTime: { type: String, default: '11:30' },
  eveningTime: { type: String, default: '20:00' },
  morningJobName: String,
  eveningJobName: String,
  pendingMorning: { type: Boolean, default: false },
  pendingEvening: { type: Boolean, default: false },
  streak: { type: Number, default: 0 },
  lastActive: Date
});

const User = mongoose.model('User', userSchema);

