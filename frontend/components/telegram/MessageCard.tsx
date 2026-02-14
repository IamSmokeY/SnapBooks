'use client';

import React from 'react';

/**
 * Telegram Message Card Components
 * Glassmorphic Dark Theme with Apple-inspired design
 */

// Types for message components
interface ProcessingMessageProps {
  message: string;
}

interface InvoiceData {
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    rate: number;
  }>;
  total: number;
  date: string;
}

interface ConfirmationMessageProps {
  data: InvoiceData;
  onConfirm: () => void;
  onEdit: () => void;
}

interface SuccessMessageProps {
  invoiceNo: string;
  pdfUrl: string;
  excelUrl?: string;
}

// Processing Message Component
export function ProcessingMessage({ message }: ProcessingMessageProps) {
  return (
    <div className="glass-panel p-6 max-w-md">
      <div className="flex items-center gap-4">
        {/* Animated Spinner */}
        <div className="flex-shrink-0">
          <svg
            className="animate-spin h-6 w-6 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground/90">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Confirmation Message Component
export function ConfirmationMessage({
  data,
  onConfirm,
  onEdit,
}: ConfirmationMessageProps) {
  return (
    <div className="glass-card max-w-md overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <h3 className="font-heading font-bold text-base text-foreground">
            Invoice Ready for Confirmation
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Customer */}
        <div>
          <p className="label-text mb-2">Customer</p>
          <p className="text-sm font-semibold text-foreground">{data.customerName}</p>
        </div>

        {/* Items */}
        <div>
          <p className="label-text mb-3">Items</p>
          <div className="space-y-3">
            {data.items.map((item, index) => (
              <div
                key={index}
                className="group flex justify-between items-start rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-all"
              >
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-foreground/50 font-mono">
                    {item.quantity} × ₹{item.rate.toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="font-mono font-bold text-sm text-primary">
                  ₹{(item.quantity * item.rate).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-foreground/70">Total Amount</p>
            <p className="text-2xl font-mono font-bold text-primary">
              ₹{data.total.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs text-foreground/40 font-mono">Date: {data.date}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-white/10 grid grid-cols-2 divide-x divide-white/10">
        <button
          onClick={onEdit}
          className="py-4 text-center text-sm font-semibold text-foreground/70 hover:bg-white/5 active:bg-white/10 transition-all"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onConfirm}
          className="py-4 text-center text-sm font-bold text-primary hover:bg-primary/10 active:bg-primary/20 transition-all"
        >
          ✓ Confirm & Generate
        </button>
      </div>
    </div>
  );
}

// Success Message Component
export function SuccessMessage({
  invoiceNo,
  pdfUrl,
  excelUrl,
}: SuccessMessageProps) {
  return (
    <div className="glass-card max-w-md overflow-hidden">
      {/* Success Header */}
      <div className="bg-success/10 border-b border-success/20 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <h3 className="font-heading font-bold text-base text-foreground">
            Invoice Generated Successfully
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Invoice Number */}
        <div className="text-center py-4">
          <p className="label-text mb-2">Invoice Number</p>
          <p className="text-2xl font-mono font-bold text-foreground">{invoiceNo}</p>
        </div>

        {/* Files */}
        <div className="space-y-3">
          {/* PDF File */}
          <a
            href={pdfUrl}
            download
            className="group flex items-center gap-4 p-4 rounded-2xl border border-error/20 bg-error/10 hover:bg-error/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-error/30 rounded-xl flex items-center justify-center border border-error/40">
              <span className="text-error text-2xl">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate font-mono">
                {invoiceNo}.pdf
              </p>
              <p className="text-xs text-foreground/50">Tax Invoice • PDF</p>
            </div>
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-foreground/40 group-hover:text-error transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </a>

          {/* Excel File (Optional) */}
          {excelUrl && (
            <a
              href={excelUrl}
              download
              className="group flex items-center gap-4 p-4 rounded-2xl border border-success/20 bg-success/10 hover:bg-success/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-success/30 rounded-xl flex items-center justify-center border border-success/40">
                <span className="text-success text-2xl">📊</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate font-mono">
                  {invoiceNo}.xlsx
                </p>
                <p className="text-xs text-foreground/50">Invoice Data • Excel</p>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-foreground/40 group-hover:text-success transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </a>
          )}
        </div>

        {/* Help Text */}
        <div className="pt-4 text-center border-t border-white/5">
          <p className="text-xs text-foreground/40 font-mono">
            Send another invoice or type /help for options
          </p>
        </div>
      </div>
    </div>
  );
}

// Export all components as default
export default {
  ProcessingMessage,
  ConfirmationMessage,
  SuccessMessage,
};
