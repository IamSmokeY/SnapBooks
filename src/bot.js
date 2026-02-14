import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { extractDataFromImage } from './geminiClient.js';
import { formatForTelegram } from './schemaAdapter.js';
import { processInvoicePipeline, sendResultsToTelegram } from './pipeline.js';

dotenv.config();

// Session storage for user data (in production, use Redis or database)
const userSessions = new Map();

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Error handling middleware
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Sorry, something went wrong. Please try again or contact support.');
});

// /start command handler
bot.command('start', async (ctx) => {
  try {
    const welcomeMessage = `
👋 *Welcome to SnapBooks!*

I'm your AI Accountant assistant. I can convert handwritten bills into professional GST-compliant invoices in seconds.

*How to use:*
📸 Just send me a photo of your handwritten kata parchi (bill note)
⚡ I'll extract the data and generate:
  • Professional Invoice PDF
  • Tally XML (ready to import)

<b>Commands:</b>
/help - Show detailed instructions

<b>Ready to get started?</b>
Send me a photo of your first bill! 📄
    `;

    await ctx.replyWithHTML(welcomeMessage);
  } catch (error) {
    console.error('Error in /start handler:', error);
    ctx.reply('Failed to show welcome message. Please try /start again.');
  }
});

// /help command handler
bot.command('help', async (ctx) => {
  try {
    const helpMessage = `
📚 <b>SnapBooks Help Guide</b>

<b>Photo Upload Instructions:</b>
1. Hold your phone steady over the bill
2. Ensure good lighting (no shadows)
3. Capture the full page clearly
4. Avoid blurry or angled shots

<b>What I can read:</b>
✅ Hindi and English text
✅ Handwritten numbers & printed forms
✅ Weighbridge slips, katas, invoices
✅ Multiple documents in one photo
✅ Common abbreviations (pcs, kg, dz, ctn, MT)

<b>Example usage:</b>
Just photograph a kata saying "Ravi ko 100 kursi @ 500" and send it to me!

<b>Need support?</b>
Contact your team administrator.
    `;

    await ctx.replyWithHTML(helpMessage);
  } catch (error) {
    console.error('Error in /help handler:', error);
    ctx.reply('Failed to show help message. Please try /help again.');
  }
});

// Stub commands — graceful responses for unbuilt features
bot.command('inventory', async (ctx) => {
  await ctx.replyWithHTML('📦 <b>Inventory tracking coming soon!</b>\n\nFor now, send a photo of your bill to generate an invoice.');
});

bot.command('ledger', async (ctx) => {
  await ctx.replyWithHTML('📒 <b>Ledger feature coming soon!</b>\n\nFor now, send a photo of your bill to generate an invoice.');
});

bot.command('analytics', async (ctx) => {
  await ctx.replyWithHTML('📊 <b>Analytics feature coming soon!</b>\n\nFor now, send a photo of your bill to generate an invoice.');
});

// Photo handler - main OCR pipeline entry point
bot.on('photo', async (ctx) => {
  try {
    // Send processing message
    const processingMsg = await ctx.reply('📸 Photo received! Processing...');

    // Get the highest resolution photo
    const photos = ctx.message.photo;
    const photo = photos[photos.length - 1];

    console.log(`Processing photo from user ${ctx.from.id}: ${photo.file_id}`);

    // Get file from Telegram
    const file = await ctx.telegram.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    console.log('Downloading image from:', fileUrl);

    // Download image buffer
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    console.log(`Image downloaded: ${imageBuffer.length} bytes`);

    // Extract data using Gemini Vision API
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMsg.message_id,
      null,
      '🤖 Reading document with AI...'
    );

    const extractedData = await extractDataFromImage(imageBuffer);

    // Log safely without circular references
    console.log('✅ Extracted', extractedData.items?.length || 0, 'items, confidence:', extractedData.confidence || 'N/A');

    // Delete processing message
    await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);

    // Format extracted data for user confirmation using schema adapter
    const parsed = extractedData._parsed || {
      primary: extractedData,
      all: [extractedData],
      multiDocument: { count: 1, relationship: 'single', link_note: null }
    };
    const confirmationMessage = formatForTelegram(parsed);

    // Store data in session for callback handler
    const userId = ctx.from.id;
    userSessions.set(userId, {
      imageBuffer,
      extractedData,
      timestamp: Date.now()
    });

    // Send confirmation with inline keyboard
    await ctx.replyWithHTML(confirmationMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📄 Sales Invoice', callback_data: `confirm_sales` },
            { text: '📦 Purchase Order', callback_data: `confirm_purchase` }
          ],
          [
            { text: '🚚 Delivery Challan', callback_data: `confirm_challan` }
          ],
          [
            { text: '❌ Cancel', callback_data: `cancel` }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Error in photo handler:', error);

    // Try to delete processing message
    try {
      // Can't reliably get processingMsg here if error was early
    } catch (_) {}

    // User-friendly error messages based on error type
    let errorMessage = '😕 *Couldn\'t process this image.*\n\n';

    if (error.message.includes('confidence') || error.message.includes('unclear')) {
      errorMessage += `*Issue:* The handwriting is unclear.\n\n*Tips:*\n• Hold phone steady\n• Ensure good lighting\n• Avoid shadows and blur\n• Capture the full page\n\nPlease try again with a clearer photo.`;
    } else if (error.message.includes('timeout') || error.message.includes('API')) {
      errorMessage += `⏳ *Processing is taking longer than usual.*\n\nPlease wait 10 seconds and try again.`;
    } else if (error.message.includes('No data') || error.message.includes('No items')) {
      errorMessage += `*Issue:* Could not find bill data in this image.\n\nMake sure the photo shows a handwritten bill, weighbridge slip, or invoice.`;
    } else {
      // Don't expose raw error details to users - sanitize for security
      errorMessage += `*Issue:* An unexpected error occurred while processing.\n\nPlease try again or contact support.`;
      // Log full error for debugging
      console.error('Full error details:', error);
    }

    // Send without Markdown to avoid parsing issues
    ctx.reply(errorMessage.replace(/\*/g, ''));
  }
});

// Callback query handler for inline buttons
bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.from.id;

    console.log('Callback received:', callbackData, 'from user:', userId);

    // Get user session data
    const session = userSessions.get(userId);
    if (!session) {
      await ctx.answerCbQuery('Session expired. Please send a new photo.');
      await ctx.reply('⏱️ Session expired. Please send a new photo to start over.');
      return;
    }

    if (callbackData === 'cancel') {
      await ctx.answerCbQuery('Cancelled');
      await ctx.reply('❌ Operation cancelled. Send a new photo when ready.');
      userSessions.delete(userId);
      return;
    }

    // Map callback to document type
    const docTypeMap = {
      'confirm_sales': { type: 'sales_invoice', label: 'Sales Invoice' },
      'confirm_purchase': { type: 'purchase_order', label: 'Purchase Order' },
      'confirm_challan': { type: 'delivery_challan', label: 'Delivery Challan' }
    };

    const docConfig = docTypeMap[callbackData];
    if (!docConfig) {
      await ctx.answerCbQuery('Unknown action');
      return;
    }

    await ctx.answerCbQuery(`Creating ${docConfig.label}...`);
    await ctx.reply(`⚡ Generating ${docConfig.label}...`);

    // Run pipeline with the extracted data (skip re-OCR)
    const result = await processInvoicePipeline(session.imageBuffer, docConfig.type);
    await sendResultsToTelegram(ctx, result);

    // Clear session
    userSessions.delete(userId);

  } catch (error) {
    console.error('Error in callback handler:', error);
    await ctx.answerCbQuery('Error processing your request');
    await ctx.reply(`❌ Error: ${error.message}\n\nPlease try again.`);
  }
});

// Document handler — for PDFs sent directly
bot.on('document', async (ctx) => {
  try {
    const doc = ctx.message.document;
    if (doc.mime_type === 'application/pdf' || doc.file_name?.endsWith('.pdf')) {
      await ctx.reply('📄 PDF received! Currently I work best with <b>photos</b> of documents.\n\nPlease send a photo (camera or gallery) instead.', {
        parse_mode: 'HTML'
      });
    } else {
      await ctx.reply('📸 Please send me a <b>photo</b> of your handwritten bill.\n\nIf you need help, type /help', {
        parse_mode: 'HTML'
      });
    }
  } catch (error) {
    console.error('Error in document handler:', error);
  }
});

// Text message handler (catch-all for unknown commands)
bot.on('text', async (ctx) => {
  try {
    if (ctx.message.text.startsWith('/')) {
      await ctx.reply('❓ Unknown command. Type /help to see available commands.');
      return;
    }

    await ctx.reply('📸 Please send me a <b>photo</b> of your handwritten bill.\n\nIf you need help, type /help', {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error in text handler:', error);
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('Bot stopping (SIGINT)...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('Bot stopping (SIGTERM)...');
  bot.stop('SIGTERM');
});

// Start bot
console.log('🚀 SnapBooks Bot starting...');
bot.launch()
  .then(() => {
    console.log('✅ Bot is running!');
    console.log(`Bot username: @${bot.botInfo.username}`);
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });
