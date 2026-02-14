# SnapBooks — Telegram AI Accountant

> Convert handwritten bills to GST-compliant invoices in 30 seconds

A Telegram bot that uses Gemini Vision AI to extract data from handwritten "kata parchi" (bill notes) and generates professional invoices, Tally XML, and manages inventory.

## Features

- **📸 Photo OCR** — Send a photo of any handwritten bill, weighbridge slip, or invoice
- **🤖 Gemini Vision AI** — Reads Hindi, English, and mixed handwriting with per-field confidence
- **📄 PDF Generation** — Professional invoices, purchase orders, and delivery challans via Puppeteer
- **📊 Tally XML** — Import-ready XML for Tally ERP (Sales/Purchase vouchers with inventory entries)
- **💰 GST Calculation** — Auto HSN lookup, CGST/SGST/IGST split, intrastate/interstate detection
- **📑 Multi-document** — Detects multiple documents in one photo, identifies their relationship
- **☁️ Firebase** — Optional Firestore storage + Firebase Storage for PDF/XML archival
- **🌐 REST API** — Express API for dashboard integration (`/api/invoices`, `/api/stats`)

## Quick Start

```bash
# Clone
git clone https://github.com/IamSmokeY/SnapBooks.git
cd SnapBooks

# Install
npm install

# Configure
cp .env.example .env
# Fill in TELEGRAM_BOT_TOKEN and GEMINI_API_KEY

# Run
npm start        # Start Telegram bot
npm run api      # Start REST API (port 3004)
npm run dev      # Start bot with file watching
```

## Architecture

```
Photo → Telegraf Bot → Gemini Vision OCR → Schema Adapter → GST Engine → PDF + XML → Telegram
                                                                      ↘ Firebase (optional)
```

### Core Files

| File | Purpose |
|------|---------|
| `src/bot.js` | Telegraf bot — photo handler, commands, inline keyboards |
| `src/geminiClient.js` | Gemini Vision API wrapper with retry/timeout |
| `src/schemaAdapter.js` | Bridges v2 OCR output to pipeline flat format |
| `src/gstEngine.js` | HSN lookup, GST calculation, invoice validation |
| `src/pdfGenerator.js` | Puppeteer HTML→PDF with template system |
| `src/tallyXml.js` | Tally-compatible XML voucher generation |
| `src/pipeline.js` | End-to-end orchestration with parallel generation |
| `src/firebaseClient.js` | Firebase Admin SDK — Firestore + Storage |
| `src/api.js` | Express REST API for frontend dashboard |

### Templates

| Template | Use |
|----------|-----|
| `templates/invoice.html` | Sales invoice (blue theme) |
| `templates/purchase-order.html` | Purchase order (purple theme) |
| `templates/delivery-challan.html` | Delivery challan (orange theme) |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + usage guide |
| `/help` | Photo tips + supported formats |
| `/inventory` | Stock levels (coming soon) |
| `/ledger` | Customer outstanding (coming soon) |
| `/analytics` | Daily summary (coming soon) |

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=       # From @BotFather
GEMINI_API_KEY=           # From Google AI Studio
GEMINI_MODEL=gemini-2.5-flash

BUSINESS_NAME=ABC Manufacturing Pvt Ltd
BUSINESS_ADDRESS=Plot 45, MIDC, Pune 411001
BUSINESS_GSTIN=27AABCU9603R1ZM
BUSINESS_STATE=Maharashtra

# Optional — Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-key.json
API_PORT=3004
```

## Testing

```bash
node test-adapter.js       # Schema adapter + GST integration (no API needed)
node test-bot.js           # Bot + Gemini connectivity check
node test-e2e.js           # End-to-end with real image
node test-firebase.js      # Firebase connectivity
```

## Tech Stack

Telegraf.js · Gemini 2.5 Flash · Puppeteer · Firebase · Express · xmlbuilder2

## Team

Built for the Gemini Hackathon by Chetas, Bck, SmokeY JokeR, and popsause.

## License

MIT
