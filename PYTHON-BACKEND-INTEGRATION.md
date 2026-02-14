# Python Backend - Firebase & API Integration

## ✅ Features Added

### 1. Firebase Integration (`BackEnd/src/firebase.py`)
- ✅ **Firestore** - Save invoice metadata to database
- ✅ **Storage** - Upload PDFs to Firebase Storage
- ✅ **Public URLs** - Generate public URLs for uploaded files
- ✅ **Server Timestamps** - Automatic created_at/updated_at tracking

### 2. REST API Endpoints (`BackEnd/src/server/routes_api.py`)
- ✅ `GET /api/invoices` - List all invoices (with limit & userId filtering)
- ✅ `GET /api/invoices/{id}` - Get single invoice by ID
- ✅ `GET /api/stats` - Get statistics (total revenue, document types, count)
- ✅ `GET /api/health` - Health check endpoint
- ✅ **CORS enabled** - Frontend can access from different port

### 3. Invoice Generation Updates (`BackEnd/src/agent/tools/generate_invoice.py`)
- ✅ **Firebase upload** - Automatically upload generated PDFs to Storage
- ✅ **Firestore save** - Save invoice metadata with all details
- ✅ **User tracking** - Associate invoices with Telegram user_id
- ✅ **Error handling** - Graceful fallback if Firebase upload fails
- ✅ **Detailed metadata** - Customer name, items, totals, GST details

### 4. Server Configuration (`BackEnd/src/server/server.py`)
- ✅ **CORS middleware** - Allow cross-origin requests
- ✅ **API router** - All API endpoints mounted at /api
- ✅ **Telegram router** - Webhook endpoints at /telegram

### 5. Frontend Integration
- ✅ Updated `.env.local` to point to Python backend (port 8001)
- ✅ All existing frontend code works without changes
- ✅ Real-time data from Firestore instead of hardcoded data

## 📁 Files Modified/Created

```
BackEnd/
├── src/
│   ├── firebase.py                    ✨ UPDATED - Added Storage support
│   ├── server/
│   │   ├── routes_api.py             ✨ NEW - REST API endpoints
│   │   └── server.py                  ✨ UPDATED - Added CORS & API router
│   └── agent/tools/
│       └── generate_invoice.py        ✨ UPDATED - Firebase upload integration
├── venv/                              ✨ NEW - Python virtual environment
├── .env                               ✨ COPIED - Environment variables
└── firebase-service-account.json     ✨ COPIED - Firebase credentials

frontend/
└── .env.local                         ✨ UPDATED - API URL to port 8001

Root/
├── start-python-backend.sh            ✨ NEW - Easy startup script
├── .env                               ✨ UPDATED - Added FIREBASE_SERVICE_ACCOUNT
└── PYTHON-BACKEND-INTEGRATION.md      ✨ NEW - This file
```

## 🚀 How to Run

### Start Python Backend:
```bash
# Easy way (recommended)
./start-python-backend.sh

# Manual way
cd BackEnd
source venv/bin/activate
PORT=8001 python -m src.server.server
```

### Start Frontend:
```bash
cd frontend
npm run dev
```

The frontend will automatically connect to the Python backend at `http://localhost:8001`

## 📊 API Endpoints

### List Invoices
```bash
curl 'http://localhost:8001/api/invoices?limit=50&userId=123'
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "invoices": [
    {
      "id": "SB-001",
      "invoice_number": "SB-001",
      "customer_name": "ABC Corp",
      "date": "14-Feb-2026",
      "grand_total": 11800,
      "pdf_url": "https://storage.googleapis.com/...",
      "items": [...]
    }
  ]
}
```

### Get Single Invoice
```bash
curl 'http://localhost:8001/api/invoices/SB-001'
```

### Get Statistics
```bash
curl 'http://localhost:8001/api/stats'
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalInvoices": 5,
    "totalRevenue": 250000,
    "documentTypes": {
      "tax_invoice": 3,
      "purchase_order": 2
    }
  }
}
```

### Health Check
```bash
curl 'http://localhost:8001/api/health'
```

## 🔥 Firebase Data Structure

### Firestore Collection: `invoices`

```json
{
  "invoice_number": "SB-14-Feb-2026_001",
  "customer_name": "ABC Manufacturing Ltd",
  "date": "14-Feb-2026",
  "document_type": "tax_invoice",
  "subtotal": 10000,
  "tax_type": "cgst_sgst",
  "total_tax_amount": 1800,
  "grand_total": 11800,
  "pdf_url": "https://storage.googleapis.com/.../SB-001.pdf",
  "user_id": "7596330184",
  "business_gstin": "27AABCU9603R1ZM",
  "customer_gstin": "29AABCU9603R1ZM",
  "business_state": "Maharashtra",
  "customer_state": "Karnataka",
  "items": [
    {
      "name": "Product A",
      "quantity": 100,
      "unit": "Kg",
      "rate": 100,
      "amount": 10000,
      "gst_rate": 18,
      "hsn_code": "1234"
    }
  ],
  "created_at": "2026-02-14T10:30:00Z",
  "updated_at": "2026-02-14T10:30:00Z"
}
```

### Firebase Storage Structure
```
snapbooks-e7160.appspot.com/
└── invoices/
    └── pdfs/
        ├── SB-001.pdf
        ├── SB-002.pdf
        └── ...
```

## 🎯 Integration with Telegram Bot

When a user sends an invoice photo to the Telegram bot:

1. **Gemini Vision OCR** extracts data from image
2. **GST Engine** calculates taxes
3. **PDF Generator** creates invoice PDF
4. **Firebase Integration**:
   - Uploads PDF to Storage
   - Saves metadata to Firestore
   - Associates with user_id
5. **Bot sends**:
   - Summary message
   - PDF file
   - Links to view online

## 📱 Frontend Dashboard

The Next.js frontend at `http://localhost:3001/demo` now shows:
- Real-time invoice list from Firestore
- Total invoices and revenue
- Grouped by customer
- Refresh button to fetch latest data
- Loading states and empty states

## 🔐 Environment Variables

Required in `.env`:
```bash
GEMINI_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json
```

## ✨ What's Different from Node.js Backend

| Feature | Node.js (Old) | Python (New) |
|---------|--------------|--------------|
| Language | JavaScript | Python 3.14 |
| Framework | Telegraf + Express | FastAPI |
| PDF Generation | Puppeteer (HTML→PDF) | fpdf2 (Native PDF) |
| OCR | Gemini via REST | Gemini via google-genai SDK |
| Firebase | firebase-admin | firebase-admin (Python) |
| Port | 3004 | 8001 |
| Async | Promises/async-await | asyncio/async-await |

## 🎉 All Features Working

✅ Firebase Firestore - Save invoice metadata
✅ Firebase Storage - Upload PDFs
✅ REST API - All endpoints functional
✅ CORS - Frontend can access API
✅ User tracking - Associate with Telegram users
✅ Error handling - Graceful failures
✅ Logging - Structured logs with structlog
✅ Frontend integration - Live data display

## 🚦 Next Steps

The Python backend is now fully functional with all the features from the Node.js version plus improvements:
- Better PDF generation (no browser needed)
- Async/await throughout
- Type hints with Pydantic
- Better error handling
- Structured logging

You can now test by:
1. Starting the backend: `./start-python-backend.sh`
2. Sending photos to the Telegram bot
3. Viewing invoices at http://localhost:3001/demo
