'use client';

import React from 'react';
import Link from 'next/link';

/**
 * SnapBooks Dashboard
 * Apple-inspired Dark Mode Dashboard for Logistics Management
 */

export default function DashboardPage() {
  // Mock Data for Dashboard
  const stats = [
    { label: 'Total Weight', value: '4,250.5 MT', change: '+12.5%', icon: '⚖️', color: 'text-[#0A84FF]' },
    { label: 'Total Revenue', value: '₹12.4 L', change: '+8.2%', icon: '💰', color: 'text-[#30D158]' },
    { label: 'Trucks Clear', value: '142', change: '+5', icon: '🚛', color: 'text-[#BF5AF2]' },
    { label: 'Avg. Time', value: '45s', change: '-10%', icon: '⚡', color: 'text-[#FFD60A]' },
  ];

  const recentSlips = [
    { id: 'INV-2024-001', vehicle: 'RJ36 GA 8613', material: 'Limestone', weight: '42.5 MT', time: '10:42 AM', status: 'Completed', amount: '₹85,000' },
    { id: 'INV-2024-002', vehicle: 'RJ14 KC 9021', material: 'Marble Blocks', weight: '38.2 MT', time: '11:15 AM', status: 'Processing', amount: '₹1,14,600' },
    { id: 'INV-2024-003', vehicle: 'MP09 HG 4455', material: 'Coal', weight: '45.0 MT', time: '11:30 AM', status: 'Completed', amount: '₹67,500' },
    { id: 'INV-2024-004', vehicle: 'GJ01 DY 2288', material: 'Sand', weight: '28.5 MT', time: '12:05 PM', status: 'Failed', amount: '-' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-[#38383A] bg-[#1C1C1E]/50 backdrop-blur-xl hidden md:flex flex-col z-50">
        <div className="p-6 border-b border-[#38383A]">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl">⚖️</div>
            <h1 className="text-lg font-semibold tracking-tight">SnapBooks</h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem active icon="📊" label="Dashboard" />
          <NavItem icon="📄" label="Invoices" />
          <NavItem icon="🚛" label="Vehicles" />
          <NavItem icon="👥" label="Customers" />
          <NavItem icon="📈" label="Reports" />
        </nav>

        <div className="p-4 border-t border-[#38383A]">
          <NavItem icon="⚙️" label="Settings" />
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 border border-[#0A84FF]/20">
            <p className="text-xs font-semibold text-[#0A84FF] mb-1">Pro Plan Active</p>
            <p className="text-[10px] text-[#86868B]">Next billing: Mar 1, 2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen relative">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-[#38383A] px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Good Afternoon, Raj</h2>
            <p className="text-xs text-[#86868B]">Friday, 14 February 2026</p>
          </div>
          <div className="flex items-center gap-4">
             <button className="bg-[#1C1C1E] border border-[#38383A] rounded-full p-2 text-[#86868B] hover:text-white hover:border-[#86868B] transition-all">
               <span className="sr-only">Search</span>
               🔍
             </button>
             <button className="bg-[#1C1C1E] border border-[#38383A] rounded-full p-2 text-[#86868B] hover:text-white hover:border-[#86868B] transition-all relative">
               <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#FF3B30] border-2 border-[#1C1C1E] rounded-full"></span>
               🔔
             </button>
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0A84FF] to-[#5E5CE6] border-2 border-[#1C1C1E]"></div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Quick Actions */}
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-bold mb-1">Overview</h3>
              <p className="text-[#86868B]">Daily operational summary</p>
            </div>
            <button className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#0A84FF]/20">
              <span>+</span> New Weigh-in
            </button>
          </div>

          {/* Stats Grid - Bento Box Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="glass-panel p-6 bg-[#1C1C1E]/60 border border-[#38383A] hover:bg-[#1C1C1E] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg bg-[#2C2C2E] group-hover:bg-[#3A3A3C] transition-colors ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full bg-[#2C2C2E] ${stat.change.startsWith('+') ? 'text-[#30D158]' : 'text-[#FF3B30]'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1 tracking-tight">{stat.value}</div>
                <div className="text-sm text-[#86868B]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Charts & Activity Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Chart Placeholder */}
            <div className="lg:col-span-2 glass-panel p-6 bg-[#1C1C1E]/60 border border-[#38383A]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Weight Trends (MT)</h3>
                <div className="flex gap-2 text-xs">
                  <button className="px-3 py-1 bg-[#2C2C2E] text-white rounded-md">Daily</button>
                  <button className="px-3 py-1 hover:bg-[#2C2C2E] text-[#86868B] rounded-md transition-colors">Weekly</button>
                </div>
              </div>
              
              {/* Simple CSS Chart Graphic */}
              <div className="h-64 flex items-end justify-between gap-2 pt-4 border-t border-[#38383A]/50 px-2">
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                   <div key={i} className="w-full bg-[#2C2C2E] rounded-t-sm relative group hover:bg-[#0A84FF] transition-colors duration-300" style={{ height: `${h}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0A84FF] text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h*10}MT
                      </div>
                   </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-[#86868B] mt-2 px-1 font-mono uppercase">
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span>14:00</span>
                <span>16:00</span>
                <span>18:00</span>
              </div>
            </div>

            {/* Quick Activity Feed */}
            <div className="glass-panel p-6 bg-[#1C1C1E]/60 border border-[#38383A]">
              <h3 className="font-semibold text-lg mb-6">Recent Slips</h3>
              <div className="space-y-4">
                {recentSlips.map((slip, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#2C2C2E] transition-colors cursor-pointer group border border-transparent hover:border-[#38383A]">
                    <div className="h-10 w-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-lg border border-[#38383A] group-hover:border-[#0A84FF]/50 transition-colors">
                      🚛
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-medium text-sm text-white truncate">{slip.vehicle}</p>
                        <span className="text-[10px] text-[#86868B] ml-2 font-mono">{slip.time}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-[#86868B] truncate">{slip.material} • {slip.weight}</span>
                         <span className={`font-medium ${
                           slip.status === 'Completed' ? 'text-[#30D158]' : 
                           slip.status === 'Processing' ? 'text-[#FFD60A]' : 'text-[#FF3B30]'
                         }`}>
                           {slip.amount}
                         </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 text-sm text-[#0A84FF] font-medium hover:bg-[#0A84FF]/10 rounded-xl transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className={`
      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer mb-1
      ${active 
        ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20' 
        : 'text-[#86868B] hover:text-white hover:bg-[#2C2C2E]'
      }
    `}>
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
