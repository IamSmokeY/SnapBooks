'use client';

import React, { useState } from 'react';
import {
  ProcessingMessage,
  ConfirmationMessage,
  SuccessMessage,
} from '@/components/telegram/MessageCard';

/**
 * SnapBooks Demo Page - Glassmorphic Dark Theme
 * Apple-inspired invoice generation system
 */

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'telegram' | 'invoice'>('telegram');
  const [messageState, setMessageState] = useState<'processing' | 'confirmation' | 'success'>('confirmation');

  // Sample invoice data for Telegram messages
  const sampleInvoiceData = {
    customerName: 'Skyline Retail Private Limited',
    items: [
      { name: 'Plastic Chair (Premium) प्लास्टिक कुर्सी', quantity: 100, rate: 450 },
      { name: 'LED Bulb 9W एलईडी बल्ब', quantity: 200, rate: 120 },
    ],
    total: 69300, // Including GST
    date: '14-Feb-26',
  };

  const handleConfirm = () => {
    setMessageState('processing');
    setTimeout(() => {
      setMessageState('success');
    }, 2000);
  };

  const handleEdit = () => {
    alert('Edit functionality would open a form to modify invoice details');
  };

  const handleGeneratePDF = () => {
    alert('PDF generation will be implemented with Puppeteer API');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-heading font-black tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                SnapBooks
              </h1>
              <p className="text-sm text-foreground/60 mt-2 font-medium">
                Telegram Bot Invoice Generator for Indian SMBs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="pill-success">
                Live Demo
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="glass-card mb-8 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex-1 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'telegram'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-foreground/60 hover:bg-white/5'
              }`}
            >
              💬 Telegram Bot Messages
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`flex-1 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeTab === 'invoice'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-foreground/60 hover:bg-white/5'
              }`}
            >
              📄 Invoice Template
            </button>
          </div>
        </div>

        {/* Telegram Messages Tab */}
        {activeTab === 'telegram' && (
          <div className="space-y-8">
            <div className="glass-card p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-heading font-bold tracking-tight mb-2">
                    Telegram Bot Message Flow
                  </h2>
                  <p className="text-sm text-foreground/60">
                    See how users interact with SnapBooks bot to generate invoices
                  </p>
                </div>
              </div>

              {/* Message State Selector */}
              <div className="flex gap-3 mb-12 p-4 rounded-2xl bg-white/5 border border-white/5">
                <button
                  onClick={() => setMessageState('processing')}
                  className={`flex-1 px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
                    messageState === 'processing'
                      ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/50'
                      : 'bg-white/5 text-foreground/70 hover:bg-white/10'
                  }`}
                >
                  1️⃣ Processing
                </button>
                <button
                  onClick={() => setMessageState('confirmation')}
                  className={`flex-1 px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
                    messageState === 'confirmation'
                      ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/50'
                      : 'bg-white/5 text-foreground/70 hover:bg-white/10'
                  }`}
                >
                  2️⃣ Confirmation
                </button>
                <button
                  onClick={() => setMessageState('success')}
                  className={`flex-1 px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 ${
                    messageState === 'success'
                      ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/50'
                      : 'bg-white/5 text-foreground/70 hover:bg-white/10'
                  }`}
                >
                  3️⃣ Success
                </button>
              </div>

              {/* Message Display Area */}
              <div className="flex justify-center py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-3xl min-h-[500px] items-center border border-white/5">
                {messageState === 'processing' && (
                  <ProcessingMessage message="Processing your invoice... Extracting data from image" />
                )}

                {messageState === 'confirmation' && (
                  <ConfirmationMessage
                    data={sampleInvoiceData}
                    onConfirm={handleConfirm}
                    onEdit={handleEdit}
                  />
                )}

                {messageState === 'success' && (
                  <SuccessMessage
                    invoiceNo="INV/2026/001"
                    pdfUrl="/sample-invoice.pdf"
                    excelUrl="/sample-invoice.xlsx"
                  />
                )}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-panel p-8 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
                <h3 className="font-heading font-bold text-lg mb-3">AI Extraction</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Extract invoice data from photos of handwritten kata parchi or typed bills
                </p>
              </div>
              <div className="glass-panel p-8 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="font-heading font-bold text-lg mb-3">GST Compliant</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Automatic CGST/SGST for intrastate, IGST for interstate transactions
                </p>
              </div>
              <div className="glass-panel p-8 group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🇮🇳</div>
                <h3 className="font-heading font-bold text-lg mb-3">Hindi Support</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Bilingual invoices with Devanagari script for product names
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Template Tab */}
        {activeTab === 'invoice' && (
          <div className="space-y-8">
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-heading font-bold tracking-tight mb-2">
                    Invoice Template Preview
                  </h2>
                  <p className="text-sm text-foreground/60">
                    Based on E-INV-576.pdf reference • A4 Print Ready
                  </p>
                </div>
                <button
                  onClick={handleGeneratePDF}
                  className="btn-glass-primary"
                >
                  📄 Generate PDF
                </button>
              </div>

              {/* Template Type Selector */}
              <div className="flex gap-3 mb-8">
                <button className="px-6 py-3 bg-primary/20 text-primary text-sm font-bold rounded-full border border-primary/30">
                  Tax Invoice
                </button>
                <button className="px-6 py-3 bg-white/5 text-foreground/70 text-sm font-bold rounded-full border border-white/5 hover:bg-white/10">
                  Purchase Order
                </button>
                <button className="px-6 py-3 bg-white/5 text-foreground/70 text-sm font-bold rounded-full border border-white/5 hover:bg-white/10">
                  Delivery Challan
                </button>
              </div>

              {/* Invoice Preview */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
                <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-xl">
                  <span className="text-sm font-mono font-semibold text-foreground/80">
                    templates/invoice.html
                  </span>
                  <span className="label-text">A4 • Print Ready</span>
                </div>
                <div className="bg-white p-12 overflow-auto" style={{ maxHeight: '700px' }}>
                  {/* Simplified Invoice Preview */}
                  <div className="max-w-4xl mx-auto bg-white shadow-2xl border-2 border-gray-300">
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-black">
                        <h1 className="text-3xl font-bold">Tax Invoice</h1>
                        <div className="text-right">
                          <p className="text-sm font-semibold mb-3">e-Invoice</p>
                          <div className="w-20 h-20 bg-gray-200 border-2 border-gray-400"></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="border-2 border-gray-400 p-4">
                          <h2 className="font-bold text-base mb-3">SHREE GANESH ENTERPRISES</h2>
                          <p className="text-xs mb-1">No. 45/2, Hosur Road, Industrial Area</p>
                          <p className="text-xs mb-3">Bengaluru - 560068</p>
                          <p className="text-xs mb-1"><strong>GSTIN:</strong> 29AABCS1234F1Z5</p>
                          <p className="text-xs"><strong>State:</strong> Karnataka, Code: 29</p>
                        </div>

                        <div className="border-2 border-gray-400 p-4 text-xs space-y-1">
                          <div><strong>Invoice No:</strong> INV/2026/001</div>
                          <div><strong>Dated:</strong> 08-Feb-26</div>
                          <div><strong>Payment:</strong> 30 Days</div>
                          <div><strong>Vehicle No:</strong> KA01AB1234</div>
                        </div>
                      </div>

                      <div className="border-2 border-gray-400 mb-6">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="border border-gray-400 p-3">Sl</th>
                              <th className="border border-gray-400 p-3 text-left">Description</th>
                              <th className="border border-gray-400 p-3">HSN</th>
                              <th className="border border-gray-400 p-3">Qty</th>
                              <th className="border border-gray-400 p-3">Rate</th>
                              <th className="border border-gray-400 p-3">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-400 p-3 text-center">1</td>
                              <td className="border border-gray-400 p-3">
                                Plastic Chair (Premium)<br/>
                                <span className="hindi-text">प्लास्टिक कुर्सी</span>
                              </td>
                              <td className="border border-gray-400 p-3 text-center">94036090</td>
                              <td className="border border-gray-400 p-3 text-right">100 PCS</td>
                              <td className="border border-gray-400 p-3 text-right">450.00</td>
                              <td className="border border-gray-400 p-3 text-right font-semibold">45,000.00</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-400 p-3 text-center">2</td>
                              <td className="border border-gray-400 p-3">
                                LED Bulb 9W<br/>
                                <span className="hindi-text">एलईडी बल्ब</span>
                              </td>
                              <td className="border border-gray-400 p-3 text-center">85395000</td>
                              <td className="border border-gray-400 p-3 text-right">200 PCS</td>
                              <td className="border border-gray-400 p-3 text-right">120.00</td>
                              <td className="border border-gray-400 p-3 text-right font-semibold">24,000.00</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td colSpan={5} className="border border-gray-400 p-3 text-right font-bold">Subtotal:</td>
                              <td className="border border-gray-400 p-3 text-right font-bold">₹ 69,000.00</td>
                            </tr>
                            <tr>
                              <td colSpan={5} className="border border-gray-400 p-3 text-right italic text-gray-600">
                                CGST @ 9% + SGST @ 9%
                              </td>
                              <td className="border border-gray-400 p-3 text-right font-semibold">₹ 12,420.00</td>
                            </tr>
                            <tr className="bg-gray-200">
                              <td colSpan={5} className="border border-gray-400 p-3 text-right font-bold text-base">
                                Grand Total:
                              </td>
                              <td className="border border-gray-400 p-3 text-right font-bold text-base">₹ 81,420.00</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="text-xs mb-6 border-2 border-gray-400 p-4 bg-gray-50">
                        <strong>Amount in Words:</strong> Eighty One Thousand Four Hundred Twenty Only
                      </div>

                      <div className="text-right text-xs mt-12">
                        <p className="font-bold">Authorised Signatory</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Features */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold text-primary mb-1">✓ A4 Size</p>
                  <p className="text-xs text-foreground/50">210mm × 297mm</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold text-primary mb-1">✓ Print Ready</p>
                  <p className="text-xs text-foreground/50">8mm margins</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold text-primary mb-1">✓ Hindi Fonts</p>
                  <p className="text-xs text-foreground/50">Noto Sans Devanagari</p>
                </div>
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold text-primary mb-1">✓ GST Ready</p>
                  <p className="text-xs text-foreground/50">CGST/SGST/IGST</p>
                </div>
              </div>
            </div>

            {/* Sample Data Info */}
            <div className="glass-card p-8">
              <h3 className="font-heading font-bold text-xl mb-6 tracking-tight">Sample Data Included</h3>
              <div className="grid md:grid-cols-3 gap-8 text-sm">
                <div>
                  <p className="label-text mb-3">Products</p>
                  <ul className="text-foreground/70 space-y-2 leading-relaxed">
                    <li>• Plastic Chairs (HSN 94036090)</li>
                    <li>• LED Bulbs (HSN 85395000)</li>
                    <li>• Steel Pipes (HSN 73063090)</li>
                    <li>• Cotton Fabric (HSN 52083900)</li>
                    <li>• Wooden Tables (HSN 94036030)</li>
                  </ul>
                </div>
                <div>
                  <p className="label-text mb-3">Customers</p>
                  <ul className="text-foreground/70 space-y-2 leading-relaxed">
                    <li>• Skyline Retail (Karnataka)</li>
                    <li>• Golden Trading (Karnataka)</li>
                    <li>• Maharashtra Suppliers (MH)</li>
                  </ul>
                </div>
                <div>
                  <p className="label-text mb-3">Invoices</p>
                  <ul className="text-foreground/70 space-y-2 leading-relaxed">
                    <li>• 10 sample invoices</li>
                    <li>• Last 7 days data</li>
                    <li>• Mix of intra & interstate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Glassmorphic Footer */}
      <footer className="mt-24 backdrop-blur-2xl bg-black/60 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-foreground/60 font-medium">
            SnapBooks • Invoice Generator for Indian SMBs
          </p>
          <p className="mt-2 text-xs text-foreground/40">
            Built with Next.js 14, TypeScript, Tailwind CSS & Puppeteer
          </p>
        </div>
      </footer>
    </div>
  );
}
