# 📱 SnapBooks

**AI-Powered Invoice Generator for Indian SMBs**

SnapBooks is a modern invoice generation system designed for Indian small and medium businesses. It transforms photos of handwritten bills (kata parchi) or typed invoices into professional, GST-compliant PDF invoices through a Telegram bot interface.

## 🏗️ Project Structure

```
SnapBooks/
├── frontend/          # Next.js 14 web application (Glassmorphic UI)
│   ├── app/          # Next.js app directory
│   ├── components/   # React components (Telegram UI, etc.)
│   ├── templates/    # HTML templates for PDF generation
│   ├── types/        # TypeScript type definitions
│   └── data/         # Sample data for demo
│
└── backend/          # (Coming Soon) API & Telegram Bot
    ├── api/          # Invoice generation endpoints
    ├── bot/          # Telegram bot integration
    └── ocr/          # OCR/AI extraction service
```

## ✨ Key Features

- 🤖 **AI-Powered Extraction**: Extract invoice data from photos
- 📄 **GST Compliant**: Automatic CGST/SGST/IGST calculations
- 🇮🇳 **Hindi Support**: Bilingual invoices with Devanagari script
- 💬 **Telegram Bot**: Conversational invoice generation
- 🖨️ **Print Ready**: Professional A4 PDFs with 8mm margins
- 🎨 **Glassmorphic UI**: Apple-inspired dark theme design

## 🚀 Quick Start

### Frontend (Next.js Web UI)

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the demo.

### Backend (Coming Soon)

The backend will include:
- Puppeteer PDF generation API
- Telegram Bot webhook handler
- OCR/AI extraction service
- Invoice data management

## 📦 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Glassmorphism theme)
- **Fonts**: Inter, Outfit, JetBrains Mono
- **PDF Templates**: Standalone HTML + Puppeteer

### Backend (Planned)
- **Runtime**: Node.js / Bun
- **Bot**: node-telegram-bot-api
- **PDF**: Puppeteer
- **OCR**: Tesseract.js / Google Vision API
- **AI**: OpenAI GPT-4 Vision

## 🎨 Design System

**Glassmorphic Dark Theme**
- Background: `#050505` with gradient overlays
- Glass Effects: `backdrop-blur-2xl` + `bg-black/60`
- Primary: `#0071e3` (Apple Blue)
- Accent: `#8b5cf6` (Purple)
- Typography: Inter + Outfit + JetBrains Mono

## 📄 Documentation

- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [Templates Guide](./frontend/templates/) - Invoice template customization
- [Type Definitions](./frontend/types/invoice.ts) - TypeScript interfaces

## 🛣️ Roadmap

- [x] Frontend UI with glassmorphic theme
- [x] Invoice HTML templates (Tax Invoice, PO, Challan)
- [x] Sample data generation
- [ ] Puppeteer PDF generation API
- [ ] Telegram Bot integration
- [ ] OCR/AI extraction service
- [ ] User authentication
- [ ] Invoice history & management
- [ ] Excel export functionality
- [ ] E-way bill generation

## 📜 License

This project is licensed under the MIT License.

## 🙏 Credits

- Invoice layout based on real Indian GST invoices
- Apple Design System for UI inspiration
- Indian GST Council for tax compliance guidelines

---

**Built with ❤️ for Indian SMBs**
