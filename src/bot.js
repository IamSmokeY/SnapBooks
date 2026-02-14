import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { extractDataFromImage } from './geminiClient.js';
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
  • Inventory updates

*Available Commands:*
/help - Show detailed instructions
/inventory - View current stock levels
/ledger <name> - Check customer outstanding
/analytics - Today's sales summary

*Ready to get started?*
Send me a photo of your first bill! 📄
    `;

    await ctx.replyWithMarkdown(welcomeMessage);
  } catch (error) {
    console.error('Error in /start handler:', error);
    ctx.reply('Failed to show welcome message. Please try /start again.');
  }
});

// /help command handler
bot.command('help', async (ctx) => {
  try {
    const helpMessage = `
📚 *SnapBooks Help Guide*

*Photo Upload Instructions:*
1. Hold your phone steady over the bill
2. Ensure good lighting (no shadows)
3. Capture the full page clearly
4. Avoid blurry or angled shots

*What I can read:*
✅ Hindi and English text
✅ Handwritten numbers
✅ Common abbreviations (pcs, kg, dz, ctn)
✅ Mixed Hindi-English notes

*Commands:*
/start - Welcome message
/help - This help guide
/inventory - Current stock levels
/ledger <customer_name> - Outstanding amount
/analytics - Today's summary

*Example usage:*
Just photograph a kata saying "Ravi ko 100 kursi @ 500" and send it to me!

*Need support?*
Contact your team administrator.
    `;

    await ctx.replyWithMarkdown(helpMessage);
  } catch (error) {
    console.error('Error in /help handler:', error);
    ctx.reply('Failed to show help message. Please try /help again.');
  }
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
      '🤖 Reading handwritten text with AI...'
    );

    const extractedData = await extractDataFromImage(imageBuffer);

    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

    // Delete processing message
    await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);

    // Format extracted data for user confirmation
    const confirmationMessage = formatExtractedData(extractedData);

    // Store data in session for callback handler
    const userId = ctx.from.id;
    userSessions.set(userId, {
      imageBuffer,
      extractedData,
      timestamp: Date.now()
    });

    // Send confirmation with inline keyboard
    await ctx.replyWithMarkdown(confirmationMessage, {
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
            { text: '✏️ Edit Data', callback_data: `edit` },
            { text: '❌ Cancel', callback_data: `cancel` }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Error in photo handler:', error);

    // User-friendly error messages based on error type
    let errorMessage = '😕 *Couldn\'t process this image.*\n\n';

    if (error.message.includes('confidence')) {
      errorMessage += `*Issue:* The handwriting is unclear.\n\n*Tips:*\n• Hold phone steady\n• Ensure good lighting\n• Avoid shadows and blur\n• Capture the full page\n\nPlease try again with a clearer photo.`;
    } else if (error.message.includes('timeout') || error.message.includes('API')) {
      errorMessage += `⏳ *Processing is taking longer than usual.*\n\nOur AI is working on it. Please wait 10 seconds and try again if this persists.`;
    } else {
      errorMessage += `*Error:* ${error.message}\n\nPlease try again or contact support if the issue continues.`;
    }

    ctx.replyWithMarkdown(errorMessage);
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

    if (callbackData === 'confirm_sales') {
      await ctx.answerCbQuery('Creating Sales Invoice...');
      await ctx.reply('⚡ Generating Sales Invoice...');

      // Run pipeline
      const result = await processInvoicePipeline(session.imageBuffer, 'sales_invoice');
      await sendResultsToTelegram(ctx, result);

      // Clear session
      userSessions.delete(userId);

    } else if (callbackData === 'confirm_purchase') {
      await ctx.answerCbQuery('Creating Purchase Order...');
      await ctx.reply('⚡ Generating Purchase Order...');

      // Run pipeline
      const result = await processInvoicePipeline(session.imageBuffer, 'purchase_order');
      await sendResultsToTelegram(ctx, result);

      // Clear session
      userSessions.delete(userId);

    } else if (callbackData === 'confirm_challan') {
      await ctx.answerCbQuery('Creating Delivery Challan...');
      await ctx.reply('⚡ Generating Delivery Challan...');

      // Run pipeline
      const result = await processInvoicePipeline(session.imageBuffer, 'delivery_challan');
      await sendResultsToTelegram(ctx, result);

      // Clear session
      userSessions.delete(userId);

    } else if (callbackData === 'edit') {
      await ctx.answerCbQuery('Edit feature coming soon...');
      await ctx.reply('✏️ Edit feature will be available soon. For now, please send a clearer photo.');

    } else if (callbackData === 'cancel') {
      await ctx.answerCbQuery('Cancelled');
      await ctx.reply('❌ Operation cancelled. Send a new photo when ready.');

      // Clear session
      userSessions.delete(userId);
    }

  } catch (error) {
    console.error('Error in callback handler:', error);
    await ctx.answerCbQuery('Error processing your request');
    await ctx.reply(`❌ Error: ${error.message}\n\nPlease try again.`);
  }
});

// Text message handler (catch-all for unknown commands)
bot.on('text', async (ctx) => {
  try {
    // Skip if it's a command (handled by other handlers)
    if (ctx.message.text.startsWith('/')) {
      await ctx.reply('❓ Unknown command. Type /help to see available commands.');
      return;
    }

    // Suggest sending a photo
    await ctx.reply('📸 Please send me a *photo* of your handwritten bill.\n\nIf you need help, type /help', {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in text handler:', error);
  }
});

// Helper function to format extracted data
function formatExtractedData(data) {
  const confidenceEmoji = data.confidence >= 0.85 ? '🎯' : data.confidence >= 0.60 ? '⚠️' : '❗';
  const confidenceWarning = data.confidence < 0.85
    ? '\n\n⚠️ *Please verify the data carefully*'
    : '';

  let message = `📋 *Extracted Data*\n\n`;
  message += `👤 ${data.supplier_or_customer || 'Unknown'}\n`;
  message += `📅 ${data.date || 'Not specified'}\n\n`;

  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      message += `┌─────────────────────────────\n`;
      message += `│ *Item ${index + 1}:* ${item.name}\n`;
      message += `│ *Qty:* ${item.quantity} ${item.unit}\n`;
      if (item.rate > 0) {
        message += `│ *Rate:* ₹${item.rate}/${item.unit}\n`;
      }
      if (item.amount > 0) {
        message += `│ *Amount:* ₹${item.amount.toLocaleString('en-IN')}\n`;
      }
      message += `└─────────────────────────────\n\n`;
    });
  }

  if (data.notes) {
    message += `📝 *Notes:* ${data.notes}\n\n`;
  }

  message += `${confidenceEmoji} *Confidence:* ${Math.round(data.confidence * 100)}%`;
  message += confidenceWarning;
  message += `\n\n*Select document type and confirm:*`;

  return message;
}

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
