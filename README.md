# 📒 SnapBooks - AI-Powered Invoice Generator for Indian SMBs

Transform handwritten bills and receipts into GST-compliant invoices using AI vision and Telegram.

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/IamSmokeY/SnapBooks.git
cd SnapBooks
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your credentials:
# - TELEGRAM_BOT_TOKEN (from @BotFather)
# - GEMINI_API_KEY (from Google AI Studio)
# - FIREBASE_SERVICE_ACCOUNT path
nano .env
```

### 3. Setup Firebase
1. Create project at https://console.firebase.google.com
2. Go to Project Settings > Service Accounts
3. Click "Generate New Private Key"
4. Save as `firebase-service-account.json` in project root
5. Update `.env` with the path

### 4. Start Python Backend
```bash
./start-python-backend.sh
```

Backend runs on: http://localhost:8001

### 5. Start Frontend (Optional)
```bash
cd frontend
npm install
npm run dev
```

Dashboard at: http://localhost:3001/demo

## 📱 How It Works

### Telegram Bot Flow
1. **Send Photo** - User sends picture of handwritten bill/receipt
2. **AI Extraction** - Gemini Vision OCR extracts all details
3. **GST Calculation** - Auto-calculates CGST/SGST/IGST based on state
4. **PDF Generation** - Creates professional GST-compliant invoice
5. **Firebase Storage** - Saves PDF and metadata to cloud
6. **Instant Delivery** - Bot sends PDF + summary back to user

### Features
- ✅ **Multi-language OCR** - Hindi, English, mixed handwriting
- ✅ **Auto GST Calculation** - Intrastate (CGST+SGST) / Interstate (IGST)
- ✅ **Document Types** - Tax Invoice, Purchase Order, Delivery Challan
- ✅ **Firebase Integration** - Cloud storage + Firestore database
- ✅ **REST API** - Access invoices programmatically
- ✅ **Web Dashboard** - View all invoices, statistics, customers
- ✅ **Tally Export** - Generate XML for Tally ERP import (coming soon)

## 🏗️ Architecture

```
┌─────────────┐
│   Telegram  │
│     User    │
└──────┬──────┘
       │ Photo
       ▼
┌─────────────────────┐
│  Python Backend     │
│  (FastAPI)          │
│                     │
│  ┌──────────────┐  │
│  │ Gemini Vision│  │ OCR
│  └──────────────┘  │
│         │          │
│  ┌──────▼──────┐  │
│  │ GST Engine  │  │ Calculate
│  └──────┬──────┘  │
│         │          │
│  ┌──────▼──────┐  │
│  │ PDF Gen     │  │ fpdf2
│  └──────┬──────┘  │
│         │          │
│  ┌──────▼──────┐  │
│  │  Firebase   │  │ Save
│  └─────────────┘  │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Firebase Cloud    │
│  ┌──────────────┐  │
│  │  Firestore   │  │ Metadata
│  └──────────────┘  │
│  ┌──────────────┐  │
│  │   Storage    │  │ PDFs
│  └──────────────┘  │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  Next.js Frontend   │
│   Dashboard         │
│  - Invoice List     │
│  - Statistics       │
│  - Customer View    │
└─────────────────────┘
```

## 🔌 API Endpoints

### Backend (Port 8001)

**List Invoices**
```bash
GET /api/invoices?limit=50&userId=123
```

**Get Single Invoice**
```bash
GET /api/invoices/{invoice_id}
```

**Statistics**
```bash
GET /api/stats
```

**Health Check**
```bash
GET /api/health
```

**Telegram Webhook**
```bash
POST /telegram/webhook
```

## 📂 Project Structure

```
SnapBooks/
├── BackEnd/                 # Python FastAPI Backend
│   ├── src/
│   │   ├── agent/          # Gemini AI Agent
│   │   │   ├── agent.py    # Main agent logic
│   │   │   └── tools/      # Agent tools (invoice gen, contacts)
│   │   ├── server/         # FastAPI server
│   │   │   ├── server.py   # Main server
│   │   │   ├── routes_api.py      # REST API
│   │   │   └── routes_telegram.py # Telegram webhook
│   │   ├── config.py       # Configuration
│   │   ├── firebase.py     # Firebase integration
│   │   ├── models.py       # Pydantic models
│   │   └── logger.py       # Structured logging
│   └── venv/               # Python virtual environment
│
├── frontend/               # Next.js Dashboard
│   ├── app/
│   │   ├── demo/          # Demo page with invoice list
│   │   └── page.tsx       # Landing page
│   └── components/        # React components
│
├── .env                    # Environment variables (not in git)
├── .env.example           # Example environment file
├── firebase-service-account.json  # Firebase credentials (not in git)
├── start-python-backend.sh       # Quick start script
└── README.md              # This file
```

## 🔐 Security

### Protected Files (not in git)
- `.env` - Environment variables
- `firebase-service-account.json` - Firebase credentials
- `venv/` - Python virtual environment
- `node_modules/` - Node dependencies

### Example Files (safe to commit)
- `.env.example` - Template for environment variables
- `frontend/.env.example` - Frontend configuration template

## 🛠️ Technologies

### Backend
- **Python 3.14** - Main language
- **FastAPI** - Web framework
- **Google Gemini** - Vision AI for OCR
- **fpdf2** - PDF generation
- **Firebase Admin SDK** - Cloud storage & database
- **structlog** - Structured logging

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## 📊 Firebase Data Structure

### Firestore: `invoices` collection
```json
{
  "invoice_number": "SB-14-Feb-2026-001",
  "customer_name": "ABC Corp",
  "date": "14-Feb-2026",
  "document_type": "tax_invoice",
  "grand_total": 11800,
  "pdf_url": "https://storage.googleapis.com/.../SB-001.pdf",
  "user_id": "123456789",
  "items": [...],
  "created_at": "2026-02-14T10:30:00Z"
}
```

### Storage: `invoices/pdfs/` directory
```
invoices/
└── pdfs/
    ├── SB-001.pdf
    ├── SB-002.pdf
    └── ...
```

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub Issues.

## 📄 License

All rights reserved. This is proprietary software.

## 🔗 Links

- **Telegram Bot**: @SnapBooksBot (configure in .env)
- **Firebase Console**: https://console.firebase.google.com
- **Google AI Studio**: https://aistudio.google.com/apikey

## 📞 Support

For issues or questions:
1. Check the logs: `tail -f /tmp/backend.log`
2. Verify Firebase setup in console
3. Check API health: `curl http://localhost:8001/api/health`
4. Open an issue on GitHub

---

Built with ❤️ for Indian SMBs
