import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseGeminiResponse } from './schemaAdapter.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load system prompt from file (our tested v2 prompt)
let SYSTEM_PROMPT;
try {
  SYSTEM_PROMPT = readFileSync(join(__dirname, '../system_prompt.txt'), 'utf-8').trim();
  console.log('✅ Loaded system prompt from system_prompt.txt');
} catch (err) {
  console.error('❌ Could not load system_prompt.txt, using fallback');
  SYSTEM_PROMPT = 'Extract all structured data from this document image. Return only valid JSON.';
}

// Model name — configurable via env, defaults to gemini-2.5-flash
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Extract structured data from a business document image using Gemini Vision API
 * @param {Buffer} imageBuffer - Image buffer from Telegram
 * @param {Object} options - Options for extraction
 * @param {number} options.timeout - Timeout in milliseconds (default: 25000)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 2)
 * @returns {Promise<Object>} Parsed + flattened data ready for pipeline
 */
export async function extractDataFromImage(imageBuffer, options = {}) {
  const { timeout = 25000, maxRetries = 2 } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Calling Gemini Vision API [${GEMINI_MODEL}] (attempt ${attempt}/${maxRetries})...`);

      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        }
      });

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      };

      // Call API with timeout
      const result = await Promise.race([
        model.generateContent(['Extract all data from this document', imagePart]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API timeout after ${timeout}ms`)), timeout)
        )
      ]);

      const response = await result.response;
      const text = response.text();

      console.log('Gemini raw response length:', text.length, 'chars');

      // Parse JSON from response
      let rawData;
      try {
        let cleanedText = text.trim();
        // Strip markdown fences if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }
        rawData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        console.error('Raw text (first 500 chars):', text.substring(0, 500));
        throw new Error('Failed to parse AI response. The image may be unclear.');
      }

      // Handle error response from Gemini
      if (rawData.error) {
        throw new Error(rawData.suggestion || `AI could not read the document: ${rawData.error}`);
      }

      // Use schema adapter to handle both v2 and legacy formats
      const parsed = parseGeminiResponse(rawData);
      const primary = parsed.primary;

      // Validate minimum data
      if (!primary.supplier_or_customer && (!primary.items || primary.items.length === 0)) {
        throw new Error('No data could be extracted from the image. Please ensure the bill is clearly visible.');
      }

      if (!primary.items || primary.items.length === 0) {
        throw new Error('No items found in the bill. Please ensure item details are visible.');
      }

      // Validate confidence threshold
      if (primary.confidence < 0.40) {
        throw new Error('Low confidence extraction. Please provide a clearer image with better lighting.');
      }

      console.log(`✅ Extracted ${primary.items.length} items, confidence: ${primary.confidence}`);
      if (parsed.multiDocument.count > 1) {
        console.log(`📑 Multi-document: ${parsed.multiDocument.count} docs (${parsed.multiDocument.relationship})`);
      }

      // Return flat format for pipeline + preserve parsed extras
      primary._parsed = parsed;
      return primary;

    } catch (error) {
      console.error(`Gemini API error (attempt ${attempt}):`, error.message);
      lastError = error;

      // Don't retry on certain errors
      if (error.message.includes('API key') ||
          error.message.includes('quota') ||
          error.message.includes('parse') ||
          error.message.includes('No data') ||
          error.message.includes('No items')) {
        break;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  const error = lastError;
  if (error) {
    if (error.message.includes('API key')) {
      throw new Error('API configuration error. Please contact support.');
    }
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      throw new Error('Service temporarily busy. Please try again in a few seconds.');
    }
    if (error.message.includes('timeout')) {
      throw new Error('Request timeout. Please try again.');
    }
    // Re-throw custom errors as-is
    if (error.message.includes('confidence') ||
        error.message.includes('No data') ||
        error.message.includes('No items') ||
        error.message.includes('parse') ||
        error.message.includes('AI could not')) {
      throw error;
    }
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

/**
 * Validate and sanitize extracted data
 * @param {Object} data - Extracted data to validate
 * @returns {Object} Sanitized data
 */
export function validateExtractedData(data) {
  const sanitized = {
    supplier_or_customer: (data.supplier_or_customer || '').trim(),
    items: [],
    date: data.date || null,
    notes: (data.notes || '').trim(),
    confidence: data.confidence || 0.75
  };

  if (Array.isArray(data.items)) {
    sanitized.items = data.items
      .filter(item => item.name && item.quantity > 0)
      .map(item => ({
        name: item.name.trim(),
        quantity: parseFloat(item.quantity) || 0,
        unit: (item.unit || 'pcs').toLowerCase(),
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0
      }));
  }

  return sanitized;
}

/**
 * Test function to verify Gemini API connectivity
 * @returns {Promise<boolean>} True if API is working
 */
export async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent('Respond with: {"status": "ok"}');
    const response = await result.response;
    console.log(`Gemini API test [${GEMINI_MODEL}] successful:`, response.text().substring(0, 50));
    return true;
  } catch (error) {
    console.error(`Gemini API test [${GEMINI_MODEL}] failed:`, error.message);
    return false;
  }
}
