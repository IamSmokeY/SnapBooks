import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('Fetching available Gemini models...\n');

try {
  const models = await genAI.listModels();

  console.log('Available models:');
  for await (const model of models) {
    console.log(`\n📦 ${model.name}`);
    console.log(`   Display Name: ${model.displayName}`);
    console.log(`   Description: ${model.description}`);
    if (model.supportedGenerationMethods) {
      console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
    }
  }
} catch (error) {
  console.error('Error listing models:', error.message);
}
