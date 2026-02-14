import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for OCR data extraction
const EXTRACTION_PROMPT = `You are an OCR system for Indian manufacturing businesses. Extract structured data from photos of handwritten "kata parchi" (bill notes).

RULES:
1. Handle Hindi, English, and mixed Hindi-English text
2. Recognize common abbreviations: pcs (pieces), kg (kilograms), dz (dozen), ctn (carton), mtr (meter), ltr (liter)
3. Numbers may be handwritten — interpret carefully
4. If unsure about a value, include it but set confidence lower
5. Always extract: customer/supplier name, items with quantities and rates
6. Return ONLY valid JSON, no markdown, no explanation, no code blocks

OUTPUT SCHEMA:
{
  "supplier_or_customer": "string (the person/company name on the bill)",
  "items": [
    {
      "name": "string (item name, translate Hindi to English in parentheses if needed)",
      "quantity": number,
      "unit": "string (pcs/kg/dz/ctn/mtr/ltr)",
      "rate": number (per unit price, 0 if not written),
      "amount": number (total for this line, 0 if not written)
    }
  ],
  "date": "string (DD/MM/YYYY if visible, otherwise null)",
  "notes": "string (any additional text on the bill)",
  "confidence": number (0.0 to 1.0, overall extraction confidence)
}

EXAMPLES OF HANDWRITTEN TEXT YOU MAY SEE:
- "Sharma ji ko 100 kursi bhejo @ 500" → Sharma, 100 pcs chairs at ₹500
- "50 kg sariya aayi godown mein" → 50 kg steel bars received
- "LED bulb 200 pcs @ 150/pc" → 200 LED bulbs at ₹150 each
- "Ravi Transport - 25 carton, rate 1200" → Ravi Transport, 25 cartons at ₹1200

Extract the data from the image and return ONLY the JSON object.`;

/**
 * Extract structured data from a handwritten bill image using Gemini Vision API
 * @param {Buffer} imageBuffer - Image buffer from Telegram
 * @returns {Promise<Object>} Extracted data in structured format
 */
export async function extractDataFromImage(imageBuffer) {
  try {
    console.log('Calling Gemini Vision API...');

    // Use Gemini Pro Vision for vision + structured output
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro-vision',
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent extraction
        maxOutputTokens: 2048,
      }
    });

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Create the request with image and prompt
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };

    const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);

    const response = await result.response;
    const text = response.text();

    console.log('Gemini raw response:', text);

    // Parse JSON from response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text:', text);
      throw new Error('Failed to parse AI response. The image may be unclear.');
    }

    // Validate extracted data structure
    if (!extractedData.supplier_or_customer && !extractedData.items) {
      throw new Error('No data could be extracted from the image. Please ensure the bill is clearly visible.');
    }

    if (!extractedData.items || extractedData.items.length === 0) {
      throw new Error('No items found in the bill. Please ensure item details are visible.');
    }

    // Set default confidence if not provided
    if (typeof extractedData.confidence !== 'number') {
      extractedData.confidence = 0.75;
    }

    // Validate confidence threshold
    if (extractedData.confidence < 0.40) {
      throw new Error('Low confidence extraction. Please provide a clearer image with better lighting.');
    }

    // Calculate amounts if not provided
    extractedData.items = extractedData.items.map(item => {
      if (item.amount === 0 && item.rate > 0 && item.quantity > 0) {
        item.amount = item.rate * item.quantity;
      }
      return item;
    });

    console.log('Successfully extracted data with confidence:', extractedData.confidence);

    return extractedData;

  } catch (error) {
    console.error('Gemini API error:', error);

    // Handle specific API errors
    if (error.message.includes('API key')) {
      throw new Error('API configuration error. Please contact support.');
    }

    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      throw new Error('Service temporarily busy. Please try again in a few seconds.');
    }

    if (error.message.includes('timeout')) {
      throw new Error('Request timeout. Please try again.');
    }

    // Re-throw custom errors
    if (error.message.includes('confidence') ||
        error.message.includes('No data') ||
        error.message.includes('No items') ||
        error.message.includes('parse')) {
      throw error;
    }

    // Generic error
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

  // Validate and sanitize items
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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, test connection');
    const response = await result.response;
    console.log('Gemini API test successful:', response.text().substring(0, 50));
    return true;
  } catch (error) {
    console.error('Gemini API test failed:', error);
    return false;
  }
}
