'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ProcessingMessage,
  ConfirmationMessage,
  SuccessMessage,
  type WeighbridgeData
} from '@/components/telegram/MessageCard';

/**
 * SnapBooks Demo - Telegram Bot Simulation
 * Interactive demo showing the complete bot flow for Weighbridge Slips
 */

type DemoView = 'companies' | 'bot-simulation';

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  vehicleNo: string;
  material: string;
  netWeight: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

interface Company {
  id: string;
  name: string;
  gstin: string;
  location: string;
  totalInvoices: number;
  totalRevenue: number;
  invoices: Invoice[];
}

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export default function DemoPage() {
  const [view, setView] = useState<DemoView>('companies');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'confirmation' | 'success'>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalInvoices: 0, totalRevenue: 0 });

  // Fetch real data from API
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);

      // Fetch invoices from API
      const response = await fetch(`${API_URL}/api/invoices?limit=100`);
      const data = await response.json();

      if (data.success && data.invoices) {
        // Group invoices by customer
        const grouped = groupInvoicesByCustomer(data.invoices);
        setCompanies(grouped);

        // Calculate stats
        const totalRevenue = data.invoices.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
        setStats({
          totalInvoices: data.invoices.length,
          totalRevenue
        });
      } else {
        // Fallback to demo data if API fails
        setCompanies(getDemoCompanies());
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Fallback to demo data
      setCompanies(getDemoCompanies());
    } finally {
      setLoading(false);
    }
  };

  const groupInvoicesByCustomer = (invoices: any[]): Company[] => {
    const grouped: { [key: string]: Company } = {};

    invoices.forEach((invoice) => {
      const customerName = invoice.customer_name || 'Unknown Customer';

      if (!grouped[customerName]) {
        grouped[customerName] = {
          id: customerName.toLowerCase().replace(/\s+/g, '-'),
          name: customerName,
          gstin: invoice.business_gstin || 'N/A',
          location: invoice.customer_state || invoice.business_state || 'Unknown',
          totalInvoices: 0,
          totalRevenue: 0,
          invoices: []
        };
      }

      grouped[customerName].totalInvoices++;
      grouped[customerName].totalRevenue += invoice.grand_total || 0;
      grouped[customerName].invoices.push({
        id: invoice.invoice_number || `inv-${Date.now()}`,
        invoiceNo: invoice.invoice_number || 'N/A',
        date: invoice.date || new Date().toISOString().split('T')[0],
        vehicleNo: invoice.items?.[0]?.name || 'N/A',
        material: invoice.items?.[0]?.name || 'Various Items',
        netWeight: invoice.items?.[0]?.quantity || 0,
        amount: invoice.grand_total || 0,
        status: invoice.grand_total > 0 ? 'paid' : 'pending'
      });
    });

    return Object.values(grouped);
  };

  // Fallback demo companies data
  const getDemoCompanies = (): Company[] => [
    {
      id: 'c1',
      name: 'Rajasthan Minerals Ltd.',
      gstin: '08AABCR1234N1Z5',
      location: 'Jaipur, Rajasthan',
      totalInvoices: 12,
      totalRevenue: 245000,
      invoices: [
        { id: 'inv1', invoiceNo: 'INV-2024-001', date: '2024-02-14', vehicleNo: 'RJ36 GA 8613', material: 'Limestone', netWeight: 28300, amount: 42450, status: 'paid' },
        { id: 'inv2', invoiceNo: 'INV-2024-002', date: '2024-02-14', vehicleNo: 'RJ14 KC 9021', material: 'Dolomite', netWeight: 31200, amount: 46800, status: 'paid' },
        { id: 'inv3', invoiceNo: 'INV-2024-003', date: '2024-02-13', vehicleNo: 'RJ19 GB 4521', material: 'Limestone', netWeight: 25600, amount: 38400, status: 'pending' },
        { id: 'inv4', invoiceNo: 'INV-2024-004', date: '2024-02-13', vehicleNo: 'RJ36 DA 7732', material: 'Marble Blocks', netWeight: 29100, amount: 58200, status: 'paid' },
      ]
    },
    {
      id: 'c2',
      name: 'Shree Ganesh Transport Co.',
      gstin: '24AAHCS2781A1Z3',
      location: 'Udaipur, Rajasthan',
      totalInvoices: 8,
      totalRevenue: 186500,
      invoices: [
        { id: 'inv5', invoiceNo: 'INV-2024-005', date: '2024-02-14', vehicleNo: 'RJ20 MN 1234', material: 'Iron Ore', netWeight: 35400, amount: 70800, status: 'paid' },
        { id: 'inv6', invoiceNo: 'INV-2024-006', date: '2024-02-13', vehicleNo: 'RJ18 PQ 5678', material: 'Coal', netWeight: 28900, amount: 43350, status: 'pending' },
        { id: 'inv7', invoiceNo: 'INV-2024-007', date: '2024-02-12', vehicleNo: 'MP09 HG 4455', material: 'Limestone', netWeight: 26700, amount: 40050, status: 'overdue' },
      ]
    },
    {
      id: 'c3',
      name: 'Aravalli Stone Quarry',
      gstin: '08AAICA3456P1ZA',
      location: 'Alwar, Rajasthan',
      totalInvoices: 15,
      totalRevenue: 312000,
      invoices: [
        { id: 'inv8', invoiceNo: 'INV-2024-008', date: '2024-02-14', vehicleNo: 'RJ27 XY 9988', material: 'Granite', netWeight: 32100, amount: 64200, status: 'paid' },
        { id: 'inv9', invoiceNo: 'INV-2024-009', date: '2024-02-14', vehicleNo: 'RJ31 AB 3344', material: 'Sandstone', netWeight: 27800, amount: 41700, status: 'paid' },
        { id: 'inv10', invoiceNo: 'INV-2024-010', date: '2024-02-13', vehicleNo: 'RJ14 CD 7788', material: 'Marble', netWeight: 30500, amount: 61000, status: 'pending' },
        { id: 'inv11', invoiceNo: 'INV-2024-011', date: '2024-02-13', vehicleNo: 'HR55 EF 2233', material: 'Limestone', netWeight: 28400, amount: 42600, status: 'paid' },
        { id: 'inv12', invoiceNo: 'INV-2024-012', date: '2024-02-12', vehicleNo: 'RJ36 GH 5566', material: 'Granite', netWeight: 33700, amount: 67400, status: 'paid' },
      ]
    },
  ];

  // Sample weighbridge data
  const extractedData: WeighbridgeData = {
    vehicleNo: 'RJ36 GA 8613',
    materialName: 'Limestone Block',
    grossWeight: 42500,
    tareWeight: 14200,
    netWeight: 28300,
    charge: 1500
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setStep('processing');

        // Simulate AI processing
        setTimeout(() => {
          setStep('confirmation');
        }, 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 2000);
  };

  const handleEdit = () => {
    alert('In the real bot, this would open an edit form to modify the extracted data');
  };

  const handleReset = () => {
    setStep('upload');
    setUploadedImage(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0A84FF] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#30D158] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/60 border-b border-[#38383A]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="text-2xl">⚖️</div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                SnapBooks
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#30D158] bg-[#30D158]/10 px-2 py-1 rounded">Interactive Demo</span>
              {view === 'bot-simulation' && (
                <button onClick={handleReset} className="text-sm text-[#86868B] hover:text-white transition-colors">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setView('companies')}
              className={`group relative px-6 py-3 text-sm font-bold transition-all duration-300 rounded-xl ${
                view === 'companies'
                  ? 'text-white'
                  : 'text-[#86868B] hover:text-white'
              }`}
            >
              {view === 'companies' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-xl blur opacity-50"></div>
                </>
              )}
              <span className="relative flex items-center gap-2">
                <span>🏭</span> Companies & Invoices
              </span>
            </button>
            <button
              onClick={() => setView('bot-simulation')}
              className={`group relative px-6 py-3 text-sm font-bold transition-all duration-300 rounded-xl ${
                view === 'bot-simulation'
                  ? 'text-white'
                  : 'text-[#86868B] hover:text-white'
              }`}
            >
              {view === 'bot-simulation' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-xl blur opacity-50"></div>
                </>
              )}
              <span className="relative flex items-center gap-2">
                <span>🤖</span> Bot Simulation
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'companies' ? (
          <CompaniesView 
            companies={companies} 
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
          />
        ) : (
          <BotSimulationView
            step={step}
            setStep={setStep}
            uploadedImage={uploadedImage}
            extractedData={extractedData}
            handleImageUpload={handleImageUpload}
            handleConfirm={handleConfirm}
            handleEdit={handleEdit}
            handleReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

// Companies View Component
function CompaniesView({ 
  companies, 
  selectedCompany, 
  setSelectedCompany 
}: { 
  companies: Company[]; 
  selectedCompany: string | null;
  setSelectedCompany: (id: string | null) => void;
}) {
  const company = selectedCompany ? companies.find(c => c.id === selectedCompany) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {company ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedCompany(null)}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#38383A] hover:border-[#0A84FF] transition-all text-[#86868B] hover:text-white"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back
              </button>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#30D158] flex items-center justify-center text-3xl font-bold shadow-lg shadow-[#0A84FF]/20">
                {company.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-4xl font-bold tracking-tight">
                  {company.name}
                </h2>
                <p className="text-lg text-[#86868B] mt-1">
                  📍 {company.location} • 🔖 {company.gstin}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-5xl font-bold tracking-tight">
                Company <span className="bg-gradient-to-r from-[#0A84FF] to-[#30D158] bg-clip-text text-transparent">Dashboard</span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-[#30D158]/10 border border-[#30D158]/30 rounded-xl">
                  <span className="text-sm text-[#30D158] font-bold">🟢 Live Data</span>
                </div>
                <button
                  onClick={fetchInvoices}
                  disabled={loading}
                  className="px-4 py-2 bg-[#0A84FF]/10 border border-[#0A84FF]/30 rounded-xl text-[#0A84FF] font-bold hover:bg-[#0A84FF]/20 transition-colors disabled:opacity-50"
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-8 mb-4">
              <div>
                <p className="text-sm text-[#86868B] uppercase tracking-wider">Total Invoices</p>
                <p className="text-3xl font-bold text-white">{stats.totalInvoices}</p>
              </div>
              <div>
                <p className="text-sm text-[#86868B] uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-[#30D158] to-[#0A84FF] bg-clip-text text-transparent">
                  ₹{(stats.totalRevenue / 1000).toFixed(1)}K
                </p>
              </div>
            </div>
            <p className="text-xl text-[#86868B] leading-relaxed">
              Manage multiple companies and their weighbridge invoices in one place
            </p>
          </>
        )}
      </div>

      {/* Companies Grid or Single Company View */}
      {!company ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading state
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] rounded-3xl animate-pulse">
                  <div className="h-16 w-16 bg-[#38383A] rounded-2xl mb-6"></div>
                  <div className="h-6 bg-[#38383A] rounded mb-4 w-3/4"></div>
                  <div className="h-4 bg-[#38383A] rounded mb-2 w-1/2"></div>
                  <div className="h-4 bg-[#38383A] rounded mb-6 w-2/3"></div>
                  <div className="h-10 bg-[#38383A] rounded w-full"></div>
                </div>
              ))}
            </>
          ) : companies.length === 0 ? (
            // Empty state
            <div className="col-span-3 text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-white mb-2">No Invoices Yet</h3>
              <p className="text-[#86868B] mb-6">Send a photo to @snapbooks_bot to create your first invoice!</p>
              <button
                onClick={fetchInvoices}
                className="px-6 py-3 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                🔄 Refresh
              </button>
            </div>
          ) : (
            companies.map((comp) => (
                      <div key={comp.id}
              onClick={() => setSelectedCompany(comp.id)}
              className="group relative glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] rounded-3xl hover:border-[#0A84FF] transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full group-hover:scale-110 transition-transform"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                    {comp.name.charAt(0)}
                  </div>
                  <div className="text-xs font-bold text-[#0A84FF] bg-[#0A84FF]/10 px-3 py-1.5 rounded-full border border-[#0A84FF]/30">
                    {comp.totalInvoices} invoices
                  </div>
                </div>
                
                <h3 className="font-bold text-white text-2xl mb-4 group-hover:text-[#0A84FF] transition-colors">
                  {comp.name}
                </h3>
                
                <div className="space-y-2 text-sm text-[#86868B] mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <span>{comp.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔖</span>
                    <span className="font-mono text-xs">{comp.gstin}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#38383A] flex items-end justify-between">
                  <div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#30D158] to-[#0A84FF] bg-clip-text text-transparent">
                      ₹{(comp.totalRevenue / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-[#86868B] uppercase tracking-wider mt-1">Total Revenue</div>
                  </div>
                  <div className="text-[#0A84FF] group-hover:translate-x-2 transition-transform text-2xl">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Company Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-panel p-8 bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 border-2 border-[#38383A] hover:border-[#0A84FF] transition-all rounded-3xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-[#0A84FF]/20 text-3xl group-hover:scale-110 transition-transform">
                  📄
                </div>
              </div>
              <div className="text-5xl font-bold text-[#0A84FF] mb-2">
                {company.invoices.length}
              </div>
              <div className="text-sm text-[#86868B] uppercase tracking-wider">Total Invoices</div>
            </div>
            <div className="glass-panel p-8 bg-gradient-to-br from-[#30D158]/20 to-[#30D158]/5 border-2 border-[#38383A] hover:border-[#30D158] transition-all rounded-3xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-[#30D158]/20 text-3xl group-hover:scale-110 transition-transform">
                  💰
                </div>
              </div>
              <div className="text-5xl font-bold text-[#30D158] mb-2">
                ₹{(company.invoices.reduce((sum, inv) => sum + inv.amount, 0) / 1000).toFixed(1)}K
              </div>
              <div className="text-sm text-[#86868B] uppercase tracking-wider">Total Amount</div>
            </div>
            <div className="glass-panel p-8 bg-gradient-to-br from-[#0A84FF]/20 to-[#30D158]/20 border-2 border-[#38383A] hover:border-[#0A84FF] transition-all rounded-3xl group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-[#30D158]/20 text-3xl group-hover:scale-110 transition-transform">
                  ✓
                </div>
              </div>
              <div className="text-5xl font-bold bg-gradient-to-r from-[#0A84FF] to-[#30D158] bg-clip-text text-transparent mb-2">
                {company.invoices.filter(i => i.status === 'paid').length}
              </div>
              <div className="text-sm text-[#86868B] uppercase tracking-wider">Paid Invoices</div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="glass-panel bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-[#38383A] bg-[#1C1C1E]/50">
              <h3 className="text-2xl font-bold">Invoice History</h3>
              <p className="text-sm text-[#86868B] mt-1">All transactions for this company</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#38383A] bg-[#1C1C1E]/30">
                    <th className="px-8 py-5 text-left text-xs font-bold text-[#86868B] uppercase tracking-wider">Invoice</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-[#86868B] uppercase tracking-wider">Date</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-[#86868B] uppercase tracking-wider">Vehicle</th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-[#86868B] uppercase tracking-wider">Material</th>
                    <th className="px-8 py-5 text-right text-xs font-bold text-[#86868B] uppercase tracking-wider">Net Weight</th>
                    <th className="px-8 py-5 text-right text-xs font-bold text-[#86868B] uppercase tracking-wider">Amount</th>
                    <th className="px-8 py-5 text-center text-xs font-bold text-[#86868B] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#38383A]/50">
                  {company.invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-[#1C1C1E]/30 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-white group-hover:text-[#0A84FF] transition-colors">{invoice.invoiceNo}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm text-[#86868B]">{invoice.date}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-white">{invoice.vehicleNo}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-sm text-[#86868B]">{invoice.material}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-white">{(invoice.netWeight / 1000).toFixed(1)} MT</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="text-base font-bold text-white">₹{invoice.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${
                          invoice.status === 'paid' 
                            ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30' 
                            : invoice.status === 'pending'
                            ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30'
                            : 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Bot Simulation View Component
function BotSimulationView({
  step,
  setStep,
  uploadedImage,
  extractedData,
  handleImageUpload,
  handleConfirm,
  handleEdit,
  handleReset
}: {
  step: 'upload' | 'processing' | 'confirmation' | 'success';
  setStep: (step: 'upload' | 'processing' | 'confirmation' | 'success') => void;
  uploadedImage: string | null;
  extractedData: WeighbridgeData;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConfirm: () => void;
  handleEdit: () => void;
  handleReset: () => void;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-12">
      {/* Left: Instructions & Info */}
      <div className="space-y-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Bot Simulation
          </h2>
          <p className="text-[#86868B] text-lg leading-relaxed">
            See how SnapBooks instantly digitizes weighbridge slips using Gemini Vision AI.
          </p>
        </div>

            {/* Progress Steps */}
            <div className="glass-panel p-8 bg-[#1C1C1E]/50 border border-[#38383A]">
              <h3 className="font-semibold mb-6 text-white">Process Flow</h3>
              <div className="space-y-6 relative">
                 {/* Connecting Line */}
                 <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#38383A] -z-10"></div>
                 
                <div className={`flex items-start gap-4 transition-all ${step === 'upload' ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${step === 'upload' ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-[0_0_15px_rgba(10,132,255,0.3)]' : 'bg-[#1C1C1E] border-[#38383A] text-[#86868B]'}`}>
                    1
                  </div>
                  <div className="pt-2">
                    <div className="font-medium text-white leading-none mb-1">Upload Photo</div>
                    <div className="text-sm text-[#86868B]">Send slip image to bot</div>
                  </div>
                </div>

                <div className={`flex items-start gap-4 transition-all ${step === 'processing' || step === 'confirmation' || step === 'success' ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${step === 'processing' || step === 'confirmation' || step === 'success' ? 'bg-[#0A84FF] border-[#0A84FF] text-white' : 'bg-[#1C1C1E] border-[#38383A] text-[#86868B]'}`}>
                    2
                  </div>
                  <div className="pt-2">
                    <div className="font-medium text-white leading-none mb-1">AI Extraction</div>
                    <div className="text-sm text-[#86868B]">Gemini reads vehicle & weight</div>
                  </div>
                </div>

                <div className={`flex items-start gap-4 transition-all ${step === 'confirmation' || step === 'success' ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${step === 'confirmation' || step === 'success' ? 'bg-[#0A84FF] border-[#0A84FF] text-white' : 'bg-[#1C1C1E] border-[#38383A] text-[#86868B]'}`}>
                    3
                  </div>
                  <div className="pt-2">
                    <div className="font-medium text-white leading-none mb-1">Confirm Data</div>
                    <div className="text-sm text-[#86868B]">Review extracted details</div>
                  </div>
                </div>

                <div className={`flex items-start gap-4 transition-all ${step === 'success' ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${step === 'success' ? 'bg-[#30D158] border-[#30D158] text-white shadow-[0_0_15px_rgba(48,209,88,0.3)]' : 'bg-[#1C1C1E] border-[#38383A] text-[#86868B]'}`}>
                    4
                  </div>
                  <div className="pt-2">
                    <div className="font-medium text-white leading-none mb-1">Get Invoice</div>
                    <div className="text-sm text-[#86868B]">Receive PDF instantly</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-6 bg-[#1C1C1E]/50 border border-[#38383A]">
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-bold text-white mb-1">Fast</div>
                <div className="text-xs text-[#86868B]">Under 30 seconds processing</div>
              </div>
              <div className="glass-panel p-6 bg-[#1C1C1E]/50 border border-[#38383A]">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-bold text-white mb-1">Accurate</div>
                <div className="text-xs text-[#86868B]">Powered by Gemini 3 </div>
              </div>
            </div>

            {/* Sample Images */}
            <div className="glass-panel p-6 bg-[#1C1C1E]/50 border border-[#38383A]">
              <h3 className="font-semibold text-white mb-4">No slip handy?</h3>
              <p className="text-sm text-[#86868B] mb-4">
                Use our sample weighbridge slips:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 text-sm bg-[#2C2C2E] text-white rounded-lg hover:bg-[#3A3A3C] transition-colors text-left flex items-center gap-2 border border-[#38383A]">
                  <span>📄</span> Slip 1 (Clean)
                </button>
                <button className="p-3 text-sm bg-[#2C2C2E] text-white rounded-lg hover:bg-[#3A3A3C] transition-colors text-left flex items-center gap-2 border border-[#38383A]">
                  <span>📄</span> Slip 2 (Handwritten)
                </button>
              </div>
            </div>
          </div>

          {/* Right: Telegram Simulation */}
          <div>
            <div className="sticky top-24">
              {/* Telegram Phone Frame */}
              <div className="glass-panel max-w-sm mx-auto bg-black border border-[#38383A] rounded-[40px] overflow-hidden shadow-2xl shadow-black relative">
                {/* Notch/Status Bar Placeholder */}
                <div className="h-7 bg-[#black] w-full flex justify-between items-center px-6 pt-2 pb-1">
                   <div className="text-[10px] font-semibold text-white">9:41</div>
                   <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-[#1C1C1E]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#1C1C1E]"></div>
                   </div>
                </div>

                {/* App Header */}
                <div className="bg-[#1C1C1E]/90 backdrop-blur-md border-b border-[#38383A] px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-tr from-[#0A84FF] to-[#5E5CE6] rounded-full flex items-center justify-center text-sm font-bold text-white">
                    SB
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[15px] text-white leading-snug">SnapBooks Bot</div>
                    <div className="text-[11px] text-[#0A84FF]">bot</div>
                  </div>
                </div>

                {/* Chat Area */}
                <div className="h-[550px] bg-black p-3 space-y-4 overflow-y-auto custom-scrollbar" style={{backgroundImage: 'url("https://web.telegram.org/img/bg_0.png")', backgroundSize: 'cover', backgroundBlendMode: 'soft-light'}}>
                  
                  {/* Upload Step */}
                  {step === 'upload' && (
                    <div className="space-y-4 pt-10">
                      {/* Bot Welcome Message */}
                      <div className="flex gap-2 max-w-[85%]">
                         <div className="p-3 rounded-2xl rounded-tl-none bg-[#2C2C2E] border border-[#38383A]">
                            <p className="text-[14px] text-white leading-relaxed">
                              👋 Hi! Send me a photo of a Weighbridge Slip or "Kata Parchi".
                            </p>
                         </div>
                      </div>

                      {/* Upload Area */}
                      <div className="flex justify-end pt-8 px-4">
                        <label className="cursor-pointer group relative">
                          <div className="animate-pulse absolute -inset-1 bg-gradient-to-r from-[#0A84FF] to-[#0A84FF]/20 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                          <div className="relative bg-[#0A84FF] text-white px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 hover:scale-105 transition-transform">
                             <span>📷</span> Upload Photo
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Processing Step */}
                  {step === 'processing' && (
                    <div className="space-y-4">
                      {/* User's uploaded image */}
                      {uploadedImage && (
                        <div className="flex justify-end">
                          <div className="p-1 bg-[#0A84FF] rounded-2xl rounded-tr-none max-w-[70%]">
                             <img src={uploadedImage} alt="Uploaded bill" className="rounded-xl" />
                          </div>
                        </div>
                      )}

                      {/* Bot processing message */}
                      <div className="flex gap-2">
                         <ProcessingMessage message="Analyzing slip..." />
                      </div>
                    </div>
                  )}

                  {/* Confirmation Step */}
                  {step === 'confirmation' && (
                    <div className="space-y-4">
                      {/* User's uploaded image */}
                      {uploadedImage && (
                        <div className="flex justify-end">
                          <div className="p-1 bg-[#0A84FF] rounded-2xl rounded-tr-none max-w-[70%]">
                             <img src={uploadedImage} alt="Uploaded bill" className="rounded-xl" />
                          </div>
                        </div>
                      )}

                      {/* Bot confirmation message */}
                      <div className="flex gap-2">
                         <ConfirmationMessage
                            data={extractedData}
                            onConfirm={handleConfirm}
                            onEdit={handleEdit}
                          />
                      </div>
                    </div>
                  )}

                  {/* Success Step */}
                  {step === 'success' && (
                    <div className="space-y-4">
                       <div className="flex justify-end">
                          <div className="p-2.5 px-4 bg-[#0A84FF] text-white text-[14px] rounded-2xl rounded-tr-none">
                             Generate Invoice
                          </div>
                       </div>
                      {/* Bot success message */}
                      <div className="flex gap-2">
                       <SuccessMessage invoiceNo="INV-2024-001" />
                      </div>
                    </div>
                  )}
                  
                </div>

                {/* Input Area (Visual Only) */}
                <div className="bg-[#1C1C1E] p-3 border-t border-[#38383A] flex gap-3 items-center">
                   <div className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#86868B]">📎</div>
                   <div className="flex-1 bg-[#000000] rounded-full h-9 border border-[#38383A]"></div>
                   <div className="w-9 h-9 rounded-full bg-[#0A84FF] flex items-center justify-center text-white">➤</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    