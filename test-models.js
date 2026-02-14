import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelVariations = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-pro-vision',
  'gemini-flash',
  'models/gemini-1.5-flash',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-002'
];

console.log('Testing different Gemini model names...\n');

for (const modelName of modelVariations) {
  try {
    console.log(`Testing: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    console.log(`  ✅ SUCCESS! Response: ${response.text().substring(0, 30)}...`);
    console.log(`\n✨ Working model found: ${modelName}\n`);
    break;
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message.substring(0, 80)}...`);
  }
}
