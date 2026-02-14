<div align="center">

# 📒 SnapBooks

### AI-Powered Telegram Accountant for Indian SMBs

**Handwritten bill → GST invoice in 30 seconds**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5-Vision_AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot_API-26A5E4?logo=telegram&logoColor=white)](https://core.telegram.org/bots)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## The Problem

Indian SMBs handle **200+ handwritten bills daily**. Accountants spend **4+ hours** just on manual data entry. SnapBooks eliminates that.

## How It Works

```
📸 Worker photographs handwritten bill (kata parchi)
   ↓
📱 Sends photo to Telegram bot
   ↓
🤖 Gemini Vision AI extracts structured data (Hindi + English)
   ↓
✅ Bot shows parsed data → User confirms or selects document type
   ↓
📄 Bot generates Invoice PDF + Tally XML in parallel
   ↓
📨 Sends files back to user — done in < 30 seconds
```

## Features

| Feature | Description |
|---------|-------------|
| 📸 **Vision OCR** | Reads handwritten Hindi, English, and mixed-language bills using Gemini 2.5 Flash |
| 📑 **Multi-Document** | Detects multiple documents in one photo, identifies relationships (same transaction, sequential, etc.) |
| 💰 **GST Engine** | Auto HSN code lookup (60+ products), CGST/SGST/IGST split, intrastate/interstate detection |
| 📄 **PDF Generation** | Professional invoices, purchase orders, and delivery challans via Puppeteer with Hindi font support |
| 📊 **Tally XML** | Import-ready XML vouchers with inventory entries, ledger postings, and batch allocations |
| ☁️ **Firebase** | Optional Firestore for invoice storage + Firebase Storage for PDF/XML archival |
| 🌐 **REST API** | Express API (`/api/invoices`, `/api/stats`) for the Next.js dashboard |
| 🎯 **Confidence Scoring** | Per-field confidence (high/medium/low) with user warnings below 85% |

## Quick Start

### Prerequisites

- Node.js 20+
- [Telegram Bot Token](https://t.me/BotFather) — create a bot and get the token
- [Gemini API Key](https://aistudio.google.com/apikey) — free tier works

### Setup

```bash
git clone https://github.com/IamSmokeY/SnapBooks.git
cd SnapBooks
npm install

# Configure environment
cp .env.example .env
# Edit .env → add TELEGRAM_BOT_TOKEN and GEMINI_API_KEY
```

### Run

```bash
npm start          # 🤖 Start Telegram bot
npm run api        # 🌐 Start REST API (port 3004)
npm run dev        # 🔄 Start bot with auto-reload
```

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────────────────┐
│  TELEGRAM    │     │  NODE.JS SERVER                                  │
│  (Worker's   │────▶│                                                  │
│   Phone)     │     │  Telegraf ─▶ Gemini Vision ─▶ Schema Adapter     │
│              │◀────│      │                            │               │
└──────────────┘     │      ▼                            ▼               │
                     │  Confirmation     GST Engine + HSN Lookup         │
                     │  (Inline KB)           │                          │
                     │      │                 ▼                          │
                     │      ▼          ┌──────────────┐                  │
                     │  Pipeline ─────▶│ Puppeteer PDF │ (parallel)      │
                     │      │          │ Tally XML     │                 │
                     │      │          └──────┬───────┘                  │
                     │      ▼                 │                          │
                     │  Firebase (optional) ◀─┘                          │
                     └──────────────────────────────────────────────────┘
```

## Project Structure

```
SnapBooks/
├── src/
│   ├── bot.js              # Telegraf bot — commands, photo handler, inline keyboards
│   ├── geminiClient.js     # Gemini Vision API — retry, timeout, JSON parsing
│   ├── schemaAdapter.js    # v2 schema adapter — nested → flat format bridge
│   ├── gstEngine.js        # GST calc, HSN lookup (60+ items), invoice validation
│   ├── pdfGenerator.js     # Puppeteer HTML → PDF with Hindi font support
│   ├── tallyXml.js         # Tally-compatible XML voucher builder
│   ├── pipeline.js         # End-to-end orchestration with parallel generation
│   ├── firebaseClient.js   # Firebase Admin — Firestore + Storage
│   └── api.js              # Express REST API for dashboard
├── templates/
│   ├── invoice.html        # Sales invoice template (blue)
│   ├── purchase-order.html # Purchase order template (purple)
│   └── delivery-challan.html # Delivery challan template (orange)
├── frontend/               # Next.js dashboard (React + Tailwind)
│   ├── app/                # Pages — dashboard, invoices, customers, demo
│   ├── components/         # Telegram message preview cards
│   ├── templates/          # Handlebars invoice templates (frontend rendering)
│   └── data/               # Sample data for development
├── system_prompt.txt       # Gemini v2 OCR prompt (multi-doc, per-field confidence)
├── test-adapter.js         # Integration tests (schema + GST + formatting)
├── test-e2e.js             # End-to-end pipeline test
├── test-firebase.js        # Firebase connectivity test
└── plan.md                 # Full hackathon build plan (5-hour schedule)
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message with usage guide |
| `/help` | Photo tips, supported document types, examples |
| `/inventory` | Current stock levels *(coming soon)* |
| `/ledger <name>` | Customer outstanding balance *(coming soon)* |
| `/analytics` | Daily invoice summary *(coming soon)* |
| 📸 **Send photo** | Main flow — extracts data, generates PDF + XML |

## GST Engine

The GST engine supports **60+ products** across 7 industries with automatic HSN code lookup:

| Industry | Example Products | GST Rate |
|----------|-----------------|----------|
| Mining & Minerals | Marble powder, granite, limestone, sand, dolomite | 5% |
| Agriculture | Rice, wheat, sugar, dal, oil | 5% |
| Textiles | Cotton fabric | 5% |
| Construction | Bricks (5%), tiles, paint, plywood, pipes | 5–18% |
| Electronics | LED bulbs | 18% |
| Furniture | Plastic chairs, tables | 18% |
| Metals | Steel pipes, bars, iron rods, wire | 18% |
| Cement | Portland cement | 28% |

**Features:** Hindi term matching (strips `(मार्बल पाउडर)` before lookup), fuzzy matching, CGST/SGST split for intrastate, IGST for interstate, amount-in-words with Crore/Lakh/Paise support.

## Environment Variables

```env
# Required
TELEGRAM_BOT_TOKEN=         # From @BotFather
GEMINI_API_KEY=             # From Google AI Studio

# Optional — Model
GEMINI_MODEL=gemini-2.5-flash

# Optional — Business details (for PDF invoices)
BUSINESS_NAME=ABC Manufacturing Pvt Ltd
BUSINESS_ADDRESS=Plot 45, MIDC, Pune 411001
BUSINESS_GSTIN=27AABCU9603R1ZM
BUSINESS_STATE=Maharashtra

# Optional — Firebase (for cloud storage)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-key.json

# Optional — API
API_PORT=3004
```

## Testing

```bash
# Schema adapter + GST integration (no API keys needed)
node test-adapter.js

# Bot + Gemini connectivity
node test-bot.js

# End-to-end with real image
node test-e2e.js

# Firebase connectivity
node test-firebase.js

# Full pipeline with GST + PDF
node test-gst-pdf.js
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bot Framework | [Telegraf.js](https://telegraf.js.org/) v4 |
| AI / OCR | [Gemini 2.5 Flash](https://ai.google.dev/) (Vision API) |
| PDF Generation | [Puppeteer](https://pptr.dev/) + HTML templates + Noto Sans Devanagari |
| XML Generation | [xmlbuilder2](https://oozcitak.github.io/xmlbuilder2/) |
| Database | [Firebase](https://firebase.google.com/) (Firestore + Storage) |
| REST API | [Express.js](https://expressjs.com/) |
| Dashboard | [Next.js](https://nextjs.org/) 14 + React 18 + Tailwind CSS |

## Team

Built for the **Gemini Hackathon** by:

- **Chetas** — AI & Prompt Engineering, Demo Lead
- **Bck** — Fullstack, Bot Core & Document Generation
- **SmokeY JokeR** — Database & DevOps
- **popsause** — Frontend / UI & Templates

## License

MIT
