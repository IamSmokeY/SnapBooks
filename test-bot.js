// Quick test script to verify bot connectivity
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { testGeminiConnection } from './src/geminiClient.js';

dotenv.config();

console.log('🧪 Testing SnapBooks Bot Setup...\n');

// Test 1: Environment variables
console.log('1️⃣ Checking environment variables...');
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY'];
let envOk = true;

for (const varName of requiredEnvVars) {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: configured`);
  } else {
    console.log(`   ❌ ${varName}: MISSING`);
    envOk = false;
  }
}

if (!envOk) {
  console.log('\n❌ Environment configuration incomplete. Check .env file.');
  process.exit(1);
}

// Test 2: Telegram Bot connection
console.log('\n2️⃣ Testing Telegram Bot connection...');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

try {
  const botInfo = await bot.telegram.getMe();
  console.log(`   ✅ Connected to: @${botInfo.username}`);
  console.log(`   📝 Bot ID: ${botInfo.id}`);
  console.log(`   👤 Bot Name: ${botInfo.first_name}`);
} catch (error) {
  console.log(`   ❌ Telegram connection failed: ${error.message}`);
  process.exit(1);
}

// Test 3: Gemini API connection
console.log('\n3️⃣ Testing Gemini Vision API connection...');
const geminiOk = await testGeminiConnection();

if (geminiOk) {
  console.log('   ✅ Gemini API connected successfully');
} else {
  console.log('   ❌ Gemini API connection failed');
  process.exit(1);
}

// Summary
console.log('\n✅ All systems operational!');
console.log('\n🚀 Ready to start bot with: npm start');
console.log('📱 Test bot at: https://t.me/snapbooks_bot\n');

process.exit(0);
