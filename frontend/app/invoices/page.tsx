'use client';

import React from 'react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [filter, setFilter] = React.useState('all');

  const invoices = [
    { id: 'INV-2024-156', customer: 'Rajasthan Mining Ltd.', date: '14 Feb 2026', amount: '₹2,45,000', status: 'Paid', vehicle: 'RJ36 GA 8613', material: 'Limestone', weight: '42.5 MT' },
    { id: 'INV-2024-155', customer: 'Marble Traders Inc.', date: '14 Feb 2026', amount: '₹1,14,600', status: 'Pending', vehicle: 'RJ14 KC 9021', material: 'Marble', weight: '38.2 MT' },
    { id: 'INV-2024-154', customer: 'Coal Transport Co.', date: '13 Feb 2026', amount: '₹67,500', status: 'Paid', vehicle: 'MP09 HG 4455', material: 'Coal', weight: '45.0 MT' },
    { id: 'INV-2024-153', customer: 'Sand Suppliers Pvt.', date: '13 Feb 2026', amount: '₹38,200', status: 'Overdue', vehicle: 'GJ01 DY 2288', material: 'Sand', weight: '28.5 MT' },
    { id: 'INV-2024-152', customer: 'Granite Exporters', date: '12 Feb 2026', amount: '₹1,85,000', status: 'Paid', vehicle: 'RJ28 MN 3344', material: 'Granite', weight: '52.3 MT' },
    { id: 'INV-2024-151', customer: 'Building Materials Co.', date: '12 Feb 2026', amount: '₹92,400', status: 'Pending', vehicle: 'HR55 TY 7788', material: 'Cement', weight: '35.8 MT' },
  ];

  const stats = [
    { label: 'Total Invoices', value: '1,247', change: '+12%', icon: '📄', color: 'text-[#0A84FF]', bgColor: 'from-[#0A84FF]/20 to-[#0A84FF]/5' },
    { label: 'Total Revenue', value: '₹42.8L', change: '+8.5%', icon: '💰', color: 'text-[#30D158]', bgColor: 'from-[#30D158]/20 to-[#30D158]/5' },
    { label: 'Pending', value: '23', change: '-5%', icon: '⏳', color: 'text-[#FFD60A]', bgColor: 'from-[#FFD60A]/20 to-[#FFD60A]/5' },
    { label: 'Overdue', value: '4', change: '-2', icon: '⚠️', color: 'text-[#FF3B30]', bgColor: 'from-[#FF3B30]/20 to-[#FF3B30]/5' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0A84FF] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#30D158] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Sidebar Navigation */}
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
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 border border-[#0A84FF]/20">
            <p className="text-xs font-semibold text-[#0A84FF] mb-1">Pro Plan Active</p>
            <p className="text-[10px] text-[#86868B]">Next billing: Mar 1, 2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen relative">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-[#38383A]">
          <div className="px-6 md:px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Invoices <span className="text-[#86868B] text-lg">& Bills</span></h2>
              <p className="text-sm text-[#86868B] mt-1">{invoices.length} invoices • Last updated just now</p>
            </div>
            <button className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-black rounded-xl">
                <span className="text-xl">+</span> Create Invoice
              </div>
            </button>
          </div>
        </header>

        <div className="px-6 md:px-8 py-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className={`relative glass-panel p-6 bg-gradient-to-br ${stat.bgColor} border-2 border-[#38383A] hover:border-[#0A84FF] transition-all duration-500 group cursor-pointer`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-[#1C1C1E]/50 border border-[#38383A] group-hover:scale-110 transition-transform ${stat.color} text-2xl`}>
                    {stat.icon}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-[#30D158]/20 text-[#30D158]' : 'bg-[#FF3B30]/20 text-[#FF3B30]'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className={`text-4xl font-bold tracking-tight mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-[#86868B] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'all' ? 'bg-[#0A84FF] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'paid' ? 'bg-[#30D158] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
            >
              Paid
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'pending' ? 'bg-[#FFD60A] text-black' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'overdue' ? 'bg-[#FF3B30] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
            >
              Overdue
            </button>
          </div>

          {/* Invoices Table */}
          <div className="glass-panel bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#38383A] text-left">
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Material</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#86868B] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, i) => (
                    <tr key={i} className="border-b border-[#38383A] hover:bg-gradient-to-r hover:from-[#0A84FF]/10 hover:to-transparent transition-all group">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-[#0A84FF]">{invoice.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{invoice.customer}</div>
                        <div className="text-xs text-[#86868B] font-mono">{invoice.vehicle}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#86868B]">{invoice.material}</td>
                      <td className="px-6 py-4 text-sm font-bold">{invoice.weight}</td>
                      <td className="px-6 py-4 text-sm text-[#86868B]">{invoice.date}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#30D158]">{invoice.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          invoice.status === 'Paid' ? 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/30' :
                          invoice.status === 'Pending' ? 'bg-[#FFD60A]/20 text-[#FFD60A] border-[#FFD60A]/30' :
                          'bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]/30'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-[#1C1C1E] hover:bg-[#0A84FF] rounded-lg transition-colors text-sm">👁️</button>
                          <button className="p-2 bg-[#1C1C1E] hover:bg-[#0A84FF] rounded-lg transition-colors text-sm">📥</button>
                          <button className="p-2 bg-[#1C1C1E] hover:bg-[#FF3B30] rounded-lg transition-colors text-sm">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
