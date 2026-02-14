'use client';

import React from 'react';
import Link from 'next/link';

export default function CustomersPage() {
  const customers = [
    { 
      name: 'Rajasthan Mining Ltd.', 
      contact: 'Kunal Sharma', 
      email: 'kunal@rajmining.com', 
      phone: '+91 98765 11111', 
      invoices: 156, 
      totalValue: '₹42.5L', 
      outstanding: '₹0',
      status: 'Premium',
      lastOrder: '2 days ago'
    },
    { 
      name: 'Marble Traders Inc.', 
      contact: 'Priya Patel', 
      email: 'priya@marbletraders.com', 
      phone: '+91 98765 22222', 
      invoices: 128, 
      totalValue: '₹38.2L', 
      outstanding: '₹1.2L',
      status: 'Active',
      lastOrder: '1 week ago'
    },
    { 
      name: 'Coal Transport Co.', 
      contact: 'Rajesh Kumar', 
      email: 'rajesh@coaltransport.com', 
      phone: '+91 98765 33333', 
      invoices: 98, 
      totalValue: '₹29.8L', 
      outstanding: '₹0',
      status: 'Active',
      lastOrder: '3 days ago'
    },
    { 
      name: 'Sand Suppliers Pvt.', 
      contact: 'Amit Singh', 
      email: 'amit@sandsuppliers.com', 
      phone: '+91 98765 44444', 
      invoices: 145, 
      totalValue: '₹35.6L', 
      outstanding: '₹2.8L',
      status: 'Warning',
      lastOrder: '5 days ago'
    },
    { 
      name: 'Granite Exporters', 
      contact: 'Sunita Verma', 
      email: 'sunita@graniteexp.com', 
      phone: '+91 98765 55555', 
      invoices: 187, 
      totalValue: '₹52.4L', 
      outstanding: '₹0',
      status: 'Premium',
      lastOrder: '1 day ago'
    },
    { 
      name: 'Building Materials Co.', 
      contact: 'Vikram Joshi', 
      email: 'vikram@buildmat.com', 
      phone: '+91 98765 66666', 
      invoices: 76, 
      totalValue: '₹18.9L', 
      outstanding: '₹1.5L',
      status: 'Active',
      lastOrder: '2 weeks ago'
    },
  ];

  const stats = [
    { label: 'Total Customers', value: '247', change: '+18', icon: '👥', color: 'text-[#0A84FF]', bgColor: 'from-[#0A84FF]/20 to-[#0A84FF]/5' },
    { label: 'Premium', value: '42', change: '+5', icon: '⭐', color: 'text-[#FFD60A]', bgColor: 'from-[#FFD60A]/20 to-[#FFD60A]/5' },
    { label: 'Total Revenue', value: '₹156L', change: '+12%', icon: '💰', color: 'text-[#30D158]', bgColor: 'from-[#30D158]/20 to-[#30D158]/5' },
    { label: 'Outstanding', value: '₹8.4L', change: '-15%', icon: '📊', color: 'text-[#FF3B30]', bgColor: 'from-[#FF3B30]/20 to-[#FF3B30]/5' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#BF5AF2] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-[#0A84FF] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
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
          <NavItem icon="📄" label="Invoices" href="/invoices" />
          <NavItem icon="🚛" label="Vehicles" href="/vehicles" />
          <NavItem active icon="👥" label="Customers" href="/customers" />
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
              <h2 className="text-2xl font-bold tracking-tight">Customers <span className="text-[#86868B] text-lg">Directory</span></h2>
              <p className="text-sm text-[#86868B] mt-1">{customers.length} active customers • ₹156L total revenue</p>
            </div>
            <button className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative btn-primary flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-black rounded-xl">
                <span className="text-xl">+</span> Add Customer
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

          {/* Customers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customers.map((customer, i) => (
              <div key={i} className="glass-panel p-6 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] hover:border-[#0A84FF]/50 transition-all group cursor-pointer">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#0A84FF]/20 to-[#BF5AF2]/20 flex items-center justify-center text-3xl border border-[#38383A] group-hover:scale-110 transition-transform shrink-0">
                    🏢
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold tracking-tight">{customer.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        customer.status === 'Premium' ? 'bg-[#FFD60A]/20 text-[#FFD60A] border-[#FFD60A]/30' :
                        customer.status === 'Active' ? 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/30' :
                        'bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]/30'
                      }`}>
                        {customer.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-white font-semibold">{customer.contact}</p>
                      <p className="text-xs text-[#86868B]">{customer.email}</p>
                      <p className="text-xs text-[#86868B] font-mono">{customer.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-xl bg-[#1C1C1E]/50 border border-[#38383A]">
                  <div>
                    <div className="text-xs text-[#86868B] mb-1">Total Orders</div>
                    <div className="text-2xl font-bold text-[#0A84FF]">{customer.invoices}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#86868B] mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-[#30D158]">{customer.totalValue}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-gradient-to-r from-[#FF3B30]/10 to-transparent border border-[#FF3B30]/20">
                  <div>
                    <div className="text-xs text-[#86868B] mb-1">Outstanding Amount</div>
                    <div className="text-lg font-bold text-[#FF3B30]">{customer.outstanding}</div>
                  </div>
                  <div className="text-xs text-[#86868B]">Last order: {customer.lastOrder}</div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-[#1C1C1E] hover:bg-[#0A84FF] rounded-xl transition-all text-sm font-semibold border border-[#38383A] hover:border-[#0A84FF]">
                    View Profile
                  </button>
                  <button className="flex-1 py-2.5 bg-[#1C1C1E] hover:bg-[#30D158] rounded-xl transition-all text-sm font-semibold border border-[#38383A] hover:border-[#30D158]">
                    New Order
                  </button>
                </div>
              </div>
            ))}
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
