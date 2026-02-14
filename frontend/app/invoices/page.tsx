'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Invoice {
  id: string;
  invoice_number?: string;
  customer_name?: string;
  date?: string;
  grand_total?: number;
  subtotal?: number;
  total_tax_amount?: number;
  document_type?: string;
  pdf_url?: string;
  customer_gstin?: string;
  tax_type?: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    hsn_code?: string;
  }>;
  created_at?: string;
}

export default function InvoicesPage() {
  const [filter, setFilter] = useState('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/invoices?limit=100`);
      const data = await res.json();
      if (data.success && data.invoices) {
        setInvoices(data.invoices);
        const revenue = data.invoices.reduce((sum: number, inv: Invoice) => sum + (inv.grand_total || 0), 0);
        setTotalRevenue(revenue);
      }
      setError(null);
    } catch {
      setError('Could not connect to API');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 15000);
    return () => clearInterval(interval);
  }, [fetchInvoices]);

  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const stats = [
    { label: 'Total Invoices', value: invoices.length.toString(), icon: '📄', color: 'text-[#0A84FF]', bgColor: 'from-[#0A84FF]/20 to-[#0A84FF]/5' },
    { label: 'Total Revenue', value: formatAmount(totalRevenue), icon: '💰', color: 'text-[#30D158]', bgColor: 'from-[#30D158]/20 to-[#30D158]/5' },
    { label: 'Tax Invoices', value: invoices.filter(i => i.document_type === 'tax_invoice').length.toString(), icon: '🧾', color: 'text-[#FFD60A]', bgColor: 'from-[#FFD60A]/20 to-[#FFD60A]/5' },
    { label: 'With PDF', value: invoices.filter(i => i.pdf_url).length.toString(), icon: '📎', color: 'text-[#BF5AF2]', bgColor: 'from-[#BF5AF2]/20 to-[#BF5AF2]/5' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0A84FF] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#30D158] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-[#38383A] bg-[#1C1C1E]/50 backdrop-blur-xl hidden md:flex flex-col z-50">
        <div className="p-6 border-b border-[#38383A]">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl">⚖️</div>
            <h1 className="text-lg font-semibold tracking-tight">SnapBooks</h1>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon="📊" label="Dashboard" href="/dashboard" />
          <NavItem active icon="📄" label="Invoices" href="/invoices" />
          <NavItem icon="🚛" label="Vehicles" href="/vehicles" />
          <NavItem icon="👥" label="Customers" href="/customers" />
          <NavItem icon="📈" label="Reports" href="/reports" />
        </nav>
        <div className="p-4 border-t border-[#38383A]">
          <NavItem icon="⚙️" label="Settings" href="/settings" />
        </div>
      </aside>

      <main className="md:ml-64 min-h-screen relative">
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-[#38383A]">
          <div className="px-6 md:px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Invoices <span className="text-[#86868B] text-lg">& Bills</span></h2>
              <p className="text-sm text-[#86868B] mt-1">
                {loading ? 'Loading...' : `${invoices.length} invoices • Auto-refreshing`}
                {error && <span className="text-[#FF3B30] ml-2">{error}</span>}
              </p>
            </div>
            <button onClick={fetchInvoices} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold">
              🔄 Refresh
            </button>
          </div>
        </header>

        <div className="px-6 md:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className={`relative glass-panel p-6 bg-gradient-to-br ${stat.bgColor} border-2 border-[#38383A] hover:border-[#0A84FF] transition-all duration-500 group cursor-pointer`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-[#1C1C1E]/50 border border-[#38383A] group-hover:scale-110 transition-transform ${stat.color} text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
                <div className={`text-4xl font-bold tracking-tight mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-[#86868B] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {['all', 'tax_invoice', 'purchase_order', 'delivery_challan'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === f ? 'bg-[#0A84FF] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>

          <div className="glass-panel bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-4xl mb-4 animate-bounce">📄</div>
                  <div className="text-[#86868B]">Loading invoices...</div>
                </div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-6xl mb-4">📸</div>
                  <div className="text-xl font-bold mb-2">No invoices yet</div>
                  <div className="text-[#86868B] max-w-md">Send a photo of a handwritten bill to the Telegram bot and it will appear here automatically.</div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#38383A] text-left">
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Items</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Subtotal</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Tax</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Total</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices
                      .filter(inv => filter === 'all' || inv.document_type === filter)
                      .map((invoice, i) => (
                      <tr key={invoice.id || i} className="border-b border-[#38383A] hover:bg-gradient-to-r hover:from-[#0A84FF]/10 hover:to-transparent transition-all group">
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm font-bold text-[#0A84FF]">{invoice.invoice_number || invoice.id}</div>
                          <div className="text-xs text-[#86868B] mt-0.5">{invoice.document_type?.replace(/_/g, ' ') || 'invoice'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm">{invoice.customer_name || 'Unknown'}</div>
                          {invoice.customer_gstin && <div className="text-xs text-[#86868B] font-mono mt-0.5">{invoice.customer_gstin}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {invoice.items?.map((item, j) => (
                            <div key={j} className="text-xs text-[#86868B]">
                              {item.name} — {item.quantity} {item.unit}
                            </div>
                          )) || <span className="text-[#86868B]">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#86868B]">{invoice.date || '—'}</td>
                        <td className="px-6 py-4 text-sm font-medium">₹{(invoice.subtotal || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-sm text-[#FFD60A]">
                          ₹{(invoice.total_tax_amount || 0).toLocaleString('en-IN')}
                          <div className="text-xs text-[#86868B]">{invoice.tax_type === 'igst' ? 'IGST' : 'CGST+SGST'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#30D158]">₹{(invoice.grand_total || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          {invoice.pdf_url ? (
                            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 hover:bg-[#0A84FF]/40 transition-colors">
                              📥 Download
                            </a>
                          ) : (
                            <span className="text-xs text-[#86868B]">Local only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link href={href} className={`
      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer mb-1
      ${active
        ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20'
        : 'text-[#86868B] hover:text-white hover:bg-[#2C2C2E]'
      }
    `}>
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
