'use client';

import React from 'react';

/**
 * Telegram Message Card Components
 * Glassmorphic Dark Theme with Apple-inspired design
 */

// Types for message components
export interface WeighbridgeData {
  vehicleNo: string;
  materialName: string;
  grossWeight: number; // in kg
  tareWeight: number;  // in kg
  netWeight: number;   // in kg
  charge?: number;     // calculated charge
}

interface ProcessingMessageProps {
  message: string;
}

interface ConfirmationMessageProps {
  data: WeighbridgeData;
  onConfirm: () => void;
  onEdit: () => void;
}

interface SuccessMessageProps {
  invoiceNo: string;
  pdfUrl?: string; // made optional
}

// Processing Message Component
export function ProcessingMessage({ message }: ProcessingMessageProps) {
  return (
    <div className="glass-panel p-4 max-w-sm border border-[#38383A] bg-[#1C1C1E]/80 backdrop-blur-md rounded-2xl rounded-tl-none">
      <div className="flex items-center gap-3">
        {/* Animated Spinner */}
        <div className="relative flex h-5 w-5">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0A84FF] opacity-75"></span>
           <span className="relative inline-flex rounded-full h-5 w-5 bg-[#0A84FF] opacity-20"></span>
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-[#0A84FF] rounded-full"></div>
           </div>
        </div>
        <p className="text-[13px] text-[#E0E0E0]">{message}</p>
      </div>
    </div>
  );
}

// Confirmation Message Component
export function ConfirmationMessage({ data, onConfirm, onEdit }: ConfirmationMessageProps) {
  // Format weight helper
  const fmtWeight = (kg: number) => `${(kg/1000).toFixed(2)} MT`;

  return (
    <div className="glass-card max-w-sm overflow-hidden bg-[#1C1C1E] border border-[#38383A] rounded-2xl rounded-tl-none font-sans">
      {/* Header */}
      <div className="bg-[#2C2C2E] border-b border-[#38383A] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚖️</span>
          <span className="text-[13px] font-semibold text-white">Slip Extracted</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Main Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <div className="text-[11px] text-[#86868B] uppercase tracking-wide mb-1">Vehicle No</div>
            <div className="text-[15px] font-medium text-white">{data.vehicleNo}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#86868B] uppercase tracking-wide mb-1">Material</div>
            <div className="text-[15px] font-medium text-white">{data.materialName}</div>
          </div>
        </div>

        {/* Weights Section */}
        <div className="bg-[#000000]/30 rounded-lg p-3 space-y-2 border border-[#38383A]/50">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#86868B]">Gross Weight</span>
            <span className="text-[#E0E0E0] font-mono">{fmtWeight(data.grossWeight)}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-[#86868B]">Tare Weight</span>
            <span className="text-[#E0E0E0] font-mono">{fmtWeight(data.tareWeight)}</span>
          </div>
          <div className="border-t border-[#38383A]/50 my-1 pt-1 flex justify-between items-center">
            <span className="text-[#0A84FF] text-[13px] font-medium">Net Weight</span>
            <span className="text-[#0A84FF] text-[15px] font-mono font-bold">{fmtWeight(data.netWeight)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button 
            onClick={onEdit}
            className="flex-1 py-2 rounded-lg bg-[#2C2C2E] text-white text-[13px] font-medium hover:bg-[#3A3A3C] transition-colors border border-[#38383A]"
          >
            Edit
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-[#0A84FF] text-white text-[13px] font-medium hover:bg-[#007AFF] transition-colors shadow-lg shadow-[#0A84FF]/20"
          >
            Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// Success Message Component
export function SuccessMessage({ invoiceNo }: SuccessMessageProps) {
  return (
    <div className="glass-card max-w-sm bg-[#1C1C1E] border border-[#38383A] rounded-2xl rounded-tl-none overflow-hidden">
      <div className="p-5 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-[#30D158]/20 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-[#30D158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h3 className="text-white font-semibold text-[15px] mb-1">Invoice Generated!</h3>
        <p className="text-[#86868B] text-[13px] mb-4">Invoice #{invoiceNo} ready to share.</p>

        <div className="w-full flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#2C2C2E] border border-[#38383A] hover:bg-[#3A3A3C] transition-colors text-white text-[13px]">
             Download PDF
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 hover:bg-[#30D158]/20 transition-colors text-[13px]">
             Share
          </button>
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
