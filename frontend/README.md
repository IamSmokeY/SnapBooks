  # 📱 SnapBooks

  **Telegram Bot Invoice Generator for Indian SMBs**

  SnapBooks is a modern invoice generation system designed for Indian small and medium businesses. It transforms photos of handwritten bills (kata parchi) or typed invoices into professional, GST-compliant PDF invoices.

  ## ✨ Features

  - 🤖 **AI-Powered Extraction**: Extract invoice data from photos of handwritten or typed bills
  - 📄 **GST Compliant**: Automatic CGST/SGST calculation for intrastate, IGST for interstate transactions
  - 🇮🇳 **Hindi Support**: Bilingual invoices with Devanagari script using Noto Sans font
  - 📱 **Telegram Bot UI**: Beautiful Apple-design inspired chat interface
  - 🖨️ **Print Ready**: A4-sized PDFs with proper margins (8mm) and professional layout
  - 📊 **Multiple Formats**: Tax Invoice, Purchase Order, and Delivery Challan templates
  - 🎨 **Apple Design System**: Clean, modern UI with Tailwind CSS

  ## 🛠️ Tech Stack

  - **Frontend**: Next.js 14, TypeScript, Tailwind CSS
  - **PDF Generation**: Puppeteer
  - **Design**: Apple Design System (SF Pro fonts, 8px spacing grid)
  - **Templates**: Standalone HTML templates with Handlebars-style placeholders

  ## 📁 Project Structure

  ```
  SnapBooks/
  ├── app/
  │   ├── demo/
  │   │   └── page.tsx          # Demo page with previews
  │   ├── layout.tsx             # Root layout
  │   ├── page.tsx               # Home page (redirects to demo)
  │   └── globals.css            # Global styles
  ├── components/
  │   └── telegram/
  │       └── MessageCard.tsx    # Telegram bot UI components
  ├── templates/
  │   ├── invoice.html           # Tax invoice template
  │   ├── purchase-order.html    # Purchase order template
  │   └── delivery-challan.html  # Delivery challan template
  ├── types/
  │   └── invoice.ts             # TypeScript interfaces
  ├── data/
  │   └── sample-data.json       # Sample Indian SMB data
  ├── tailwind.config.ts         # Tailwind with Apple design
  ├── next.config.js             # Next.js configuration
  ├── tsconfig.json              # TypeScript configuration
  └── package.json               # Dependencies
  ```

  ## 🚀 Getting Started

  ### Prerequisites

  - Node.js 18.17 or later
  - npm or yarn

  ### Installation

  ```bash
  # Clone the repository
  git clone <repository-url>
  cd SnapBooks

  # Install dependencies
  npm install

  # Run development server
  npm run dev
  ```

  Open [http://localhost:3000](http://localhost:3000) to see the demo.

  ### Build for Production

  ```bash
  npm run build
  npm start
  ```

  ## 📄 Templates

  ### Invoice Template (`templates/invoice.html`)

  Professional GST-compliant tax invoice matching the E-INV-576.pdf reference layout:

  - **Header**: Company letterhead with GSTIN, Udyam Registration, CIN
  - **E-Invoice Details**: IRN, Acknowledgement Number, QR Code
  - **Customer Details**: Consignee (Ship to) and Buyer (Bill to)
  - **Items Table**: Description, HSN/SAC codes, Quantity, Rate, Amount
  - **GST Summary**: Automatic CGST/SGST or IGST calculation
  - **Footer**: Bank details, declaration, authorized signatory
  - **Print Ready**: A4 size (210mm × 297mm) with 8mm margins

  ### Variable Placeholders

  Templates use `{{variable}}` placeholders:

  ```html
  <div>{{company.name}}</div>
  <div>{{invoiceNo}}</div>
  {{#each items}}
    <tr>
      <td>{{description}}</td>
      <td>{{quantity}}</td>
    </tr>
  {{/each}}
  ```

  ## 📊 Sample Data

  The project includes realistic sample data in `data/sample-data.json`:

  ### Company
  - **Shree Ganesh Enterprises** (Karnataka-based)
  - GSTIN: 29AABCS1234F1Z5
  - Udyam Registration, CIN, PAN included

  ### Customers (3)
  1. **Skyline Retail Private Limited** (Karnataka) - Intrastate
  2. **Golden Trading Company** (Karnataka) - Intrastate
  3. **Maharashtra Suppliers & Distributors** (Maharashtra) - Interstate

  ### Products (5)
  1. Plastic Chairs - HSN 94036090, 18% GST
  2. LED Bulbs - HSN 85395000, 18% GST
  3. Steel Pipes - HSN 73063090, 18% GST
  4. Cotton Fabric - HSN 52083900, 5% GST
  5. Wooden Tables - HSN 94036030, 18% GST

  ### Invoices (10)
  - Date range: Last 7 days
  - Mix of intrastate (CGST + SGST) and interstate (IGST) transactions

  ## 🎨 Design System

  ### Apple Color Palette
  - **Primary Blue**: `#007AFF`
  - **Success Green**: `#34C759`
  - **Error Red**: `#FF3B30`
  - **Warning Orange**: `#FF9500`
  - **Gray Scale**: 50-900

  ### Typography
  - **Sans**: SF Pro Display, SF Pro Text, Inter
  - **Mono**: SF Mono, Fira Code
  - **Hindi**: Noto Sans Devanagari

  ### Spacing
  8px grid system (0.5, 1, 1.5, 2, 2.5, 3... units)

  ### Border Radius
  - `sm`: 4px
  - `md`: 12px
  - `lg`: 16px
  - `xl`: 20px
  - `2xl`: 24px

  ## 💬 Telegram Bot Components

  ### ProcessingMessage
  Shows loading state while extracting data from images.

  ```tsx
  <ProcessingMessage message="Processing your invoice..." />
  ```

  ### ConfirmationMessage
  Displays extracted data with inline buttons for user confirmation.

  ```tsx
  <ConfirmationMessage
    data={invoiceData}
    onConfirm={handleConfirm}
    onEdit={handleEdit}
  />
  ```

  ### SuccessMessage
  Shows generated invoice with download links.

  ```tsx
  <SuccessMessage
    invoiceNo="INV/2026/001"
    pdfUrl="/invoice.pdf"
    excelUrl="/invoice.xlsx"
  />
  ```

  ## 📝 TypeScript Interfaces

  All invoice types are defined in `types/invoice.ts`:

  ```typescript
  interface Invoice {
    invoiceNo: string;
    dated: string;
    company: Company;
    consignee: Customer;
    billTo: Customer;
    items: InvoiceItem[];
    gstSummary: GSTSummaryRow[];
    grandTotal: number;
    // ... more fields
  }
  ```

  Helper functions included:
  - `getGSTType()` - Determine intrastate vs interstate
  - `calculateGST()` - Automatic GST calculation
  - `numberToWords()` - Indian numbering system converter

  ## 🔧 Future Enhancements

  - [ ] Puppeteer PDF generation API endpoint
  - [ ] Telegram Bot integration
  - [ ] OCR/AI extraction from images
  - [ ] Excel export functionality
  - [ ] Invoice history and management
  - [ ] Customer database
  - [ ] Multi-language support (more Indian languages)
  - [ ] E-way bill generation
  - [ ] Analytics dashboard

  ## 📜 License

  This project is licensed under the MIT License.

  ## 🙏 Acknowledgments

  - Invoice layout based on E-INV-576.pdf reference
  - Apple Design System for UI inspiration
  - Indian GST Council for tax guidelines

  ## 📧 Contact

  For questions or support, please reach out to the development team.

  ---

  **Built with ❤️ for Indian SMBs**