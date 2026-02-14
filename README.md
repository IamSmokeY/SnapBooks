# SnapBooks - Telegram AI Accountant

> Convert handwritten bills to GST-compliant invoices in 30 seconds

A Telegram bot that uses Gemini Vision AI to extract data from handwritten "kata parchi" (bill notes) and generates professional invoices, Tally XML, and manages inventory.

## 🎯 Project Status

**Built for Gemini Hackathon**

### ✅ Completed (Hour 1)
- [x] Telegraf.js bot scaffold
- [x] `/start` and `/help` commands
- [x] Photo upload handler
- [x] Gemini Vision API client
- [x] Image-to-JSON extraction
- [x] Error handling with try/catch
- [x] Confirmation flow with inline keyboards

### 🚧 In Progress
- [ ] PDF generation with Puppeteer
- [ ] GST calculation engine
- [ ] Tally XML builder
- [ ] Inventory management
- [ ] Full pipeline integration

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Telegram Bot Token (from @BotFather)
- Gemini API Key

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
# Edit .env with your tokens (already configured)

# Start the bot
npm start

# Or for development with auto-reload
npm run dev
```

### Testing the Bot

1. Open Telegram and search for `@snapbooks_bot`
2. Send `/start` to initialize
3. Take a photo of a handwritten bill
4. Send it to the bot
5. Bot will extract data and show confirmation

## 📋 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and quick start guide |
| `/help` | Detailed usage instructions |
| `/inventory` | View current stock levels (coming soon) |
| `/ledger <name>` | Check customer outstanding (coming soon) |
| `/analytics` | Today's sales summary (coming soon) |

## 🏗️ Architecture

```
User sends photo
    ↓
Telegraf Bot receives image
    ↓
Gemini Vision API extracts data
    ↓
User confirms with inline keyboard
    ↓
Generate PDF + Tally XML
    ↓
Update Firestore inventory
    ↓
Send documents back to user
```

## 📦 Tech Stack

- **Bot Framework:** Telegraf.js
- **AI/OCR:** Gemini 2.0 Flash (Vision API)
- **PDF Generation:** Puppeteer + HTML templates
- **Database:** Firestore
- **XML Builder:** xmlbuilder2
- **Server:** Railway/Render (persistent Node.js)

## 👥 Team

- **Chetas:** AI & Prompt Engineering + Demo Lead
- **Bck (You):** Fullstack - Bot Core & Document Generation
- **SmokeY JokeR:** Database & DevOps
- **popsause:** Frontend/UI - Templates & Pitch

## 📁 Project Structure

```
snapbooks/
├── src/
│   ├── bot.js                 ✅ Main bot entry point
│   ├── geminiClient.js        ✅ Gemini Vision API wrapper
│   ├── confirmationFlow.js    🚧 Inline keyboard handling
│   ├── pipeline.js            🚧 End-to-end orchestration
│   ├── pdfGenerator.js        🚧 Puppeteer PDF renderer
│   ├── gstEngine.js           🚧 Tax calculation
│   ├── tallyXml.js            🚧 XML builder
│   ├── inventory.js           🚧 Stock management
│   ├── db.js                  🚧 Firestore client
│   └── commands/
│       ├── ledger.js          🚧 Customer ledger query
│       └── analytics.js       🚧 Daily analytics
├── templates/                 📄 HTML templates for PDFs
├── data/                      📊 Seed data & HSN codes
├── scripts/                   🔧 Utility scripts
├── .env                       ⚙️ Configuration
└── package.json
```

## 🔑 Environment Variables

See `.env` file (already configured with tokens)

## 🧪 Testing

```bash
# Test Gemini API connection
node -e "import('./src/geminiClient.js').then(m => m.testGeminiConnection())"

# Start bot in development mode
npm run dev
```

## 📝 Sample Data Format

**Expected Gemini Output:**
```json
{
  "supplier_or_customer": "Ravi Transport",
  "items": [
    {
      "name": "Plastic Chairs (कुर्सी)",
      "quantity": 100,
      "unit": "pcs",
      "rate": 500,
      "amount": 50000
    }
  ],
  "date": "14/02/2026",
  "notes": "Deliver to warehouse",
  "confidence": 0.95
}
```

## 🎯 Next Steps (Hour 2-5)

1. **Hour 2:** PDF generation + GST engine + confirmation flow
2. **Hour 3:** Tally XML + inventory + ledger/analytics commands
3. **Hour 4:** Integration testing + bug fixes
4. **Hour 5:** Demo polish + rehearsal

## 📞 Support

For issues or questions, contact the team lead.

## 📄 License

MIT License - Built for Gemini Hackathon 2026