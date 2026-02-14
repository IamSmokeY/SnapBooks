'use client';

import React from 'react';
import Link from 'next/link';

/**
 * SnapBooks Dashboard
 * Apple-inspired Dark Mode Dashboard for Logistics Management
 */

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = React.useState('daily');
  
  const stats = [
    { label: 'Total Weight', value: '4,250.5', unit: 'MT', change: '+12.5%', icon: '⚖️', color: 'text-[#0A84FF]', bgColor: 'from-[#0A84FF]/20 to-[#0A84FF]/5' },
    { label: 'Total Revenue', value: '₹12.4', unit: 'Lakh', change: '+8.2%', icon: '💰', color: 'text-[#30D158]', bgColor: 'from-[#30D158]/20 to-[#30D158]/5' },
    { label: 'Trucks Cleared', value: '142', unit: 'Today', change: '+5', icon: '🚛', color: 'text-[#BF5AF2]', bgColor: 'from-[#BF5AF2]/20 to-[#BF5AF2]/5' },
    { label: 'Avg. Time', value: '45', unit: 'seconds', change: '-10%', icon: '⚡', color: 'text-[#FFD60A]', bgColor: 'from-[#FFD60A]/20 to-[#FFD60A]/5' },
  ];

  const recentSlips = [
    { id: 'INV-2024-001', vehicle: 'RJ36 GA 8613', material: 'Limestone', weight: '42.5 MT', time: '10:42 AM', status: 'Completed', amount: '₹85,000' },
    { id: 'INV-2024-002', vehicle: 'RJ14 KC 9021', material: 'Marble Blocks', weight: '38.2 MT', time: '11:15 AM', status: 'Processing', amount: '₹1,14,600' },
    { id: 'INV-2024-003', vehicle: 'MP09 HG 4455', material: 'Coal', weight: '45.0 MT', time: '11:30 AM', status: 'Completed', amount: '₹67,500' },
    { id: 'INV-2024-004', vehicle: 'GJ01 DY 2288', material: 'Sand', weight: '28.5 MT', time: '12:05 PM', status: 'Failed', amount: '-' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#0A84FF] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#30D158] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#BF5AF2] rounded-full blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
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
            <h2 className="text-2xl font-bold tracking-tight">Good Afternoon, <span className="bg-gradient-to-r from-[#0A84FF] to-[#30D158] bg-clip-text text-transparent">Raj</span></h2>
            <p className="text-sm text-[#86868B] mt-1">Friday, 14 February 2026 • <span className="text-[#30D158]">●</span> All Systems Operational</p>
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
              <h3 className="text-4xl font-bold mb-2 tracking-tight">Dashboard <span className="text-[#86868B] text-2xl">●</span></h3>
              <p className="text-lg text-[#86868B]">Real-time operational intelligence</p>
            </div>
            <button className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative btn-primary flex items-center gap-2 px-8 py-3 text-base font-semibold">
                <span className="text-xl">+</span> New Weigh-in
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>

          {/* Stats Grid - Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className={`relative glass-panel p-8 bg-gradient-to-br ${stat.bgColor} border-2 border-[#38383A] hover:border-[#0A84FF] transition-all duration-500 group cursor-pointer overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full"></div>
                <div className="relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl bg-[#1C1C1E]/50 backdrop-blur-xl border border-[#38383A] group-hover:scale-110 transition-transform ${stat.color} text-3xl`}>
                      {stat.icon}
                    </div>
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${stat.change.startsWith('+') ? 'bg-[#30D158]/20 text-[#30D158]' : 'bg-[#FF3B30]/20 text-[#FF3B30]'}`}>
                      {stat.change} <span className="text-xs">↗</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-5xl font-bold tracking-tight ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-[#86868B] font-medium">{stat.unit}</div>
                    <div className="text-xs text-[#86868B] uppercase tracking-wider pt-2 border-t border-[#38383A]/50">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Activity Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Chart Placeholder */}
            <div className="lg:col-span-2 glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] hover:border-[#0A84FF]/50 transition-all">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-2xl mb-1">Weight Trends</h3>
                  <p className="text-sm text-[#86868B]">Real-time processing metrics</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedPeriod('daily')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      selectedPeriod === 'daily' 
                        ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30' 
                        : 'bg-[#2C2C2E] text-[#86868B] hover:text-white'
                    }`}
                  >
                    Daily
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('weekly')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      selectedPeriod === 'weekly' 
                        ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30' 
                        : 'bg-[#2C2C2E] text-[#86868B] hover:text-white'
                    }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>
              
              {/* Premium Chart */}
              <div className="h-72 flex items-end justify-between gap-3 pt-6 px-2 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A84FF]/5 to-transparent pointer-events-none rounded-xl"></div>
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                   <div key={i} className="relative w-full group">
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0A84FF] to-[#30D158] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap z-10">
                       {h*10} MT
                     </div>
                     <div className="w-full bg-gradient-to-t from-[#0A84FF] to-[#30D158] rounded-t-xl relative overflow-hidden group-hover:shadow-lg group-hover:shadow-[#0A84FF]/50 transition-all duration-300" style={{ height: `${h}%` }}>
                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
            <div className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A]">
              <div className="mb-6">
                <h3 className="font-bold text-2xl mb-1">Live Activity</h3>
                <p className="text-sm text-[#86868B]">Recent weighbridge slips</p>
              </div>
              <div className="space-y-3">
                {recentSlips.map((slip, i) => (
                  <div key={i} className="relative flex items-center gap-4 p-4 rounded-2xl bg-[#1C1C1E]/50 hover:bg-gradient-to-r hover:from-[#0A84FF]/10 hover:to-[#30D158]/10 transition-all duration-300 cursor-pointer group border border-[#38383A] hover:border-[#0A84FF]/50">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0A84FF]/20 to-[#30D158]/20 flex items-center justify-center text-2xl border border-[#38383A] group-hover:scale-110 transition-transform shrink-0">
                      🚛
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="font-bold text-sm text-white truncate">{slip.vehicle}</p>
                        <span className="text-xs text-[#86868B] ml-2 font-mono">{slip.time}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                         <span className="text-[#86868B] truncate">{slip.material} • <span className="font-semibold text-white">{slip.weight}</span></span>
                         <span className={`font-bold ml-2 ${
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
              <button className="w-full mt-6 py-4 text-sm text-[#0A84FF] font-bold hover:bg-[#0A84FF]/10 rounded-xl transition-all border border-[#38383A] hover:border-[#0A84FF]/50 flex items-center justify-center gap-2 group">
                View All Activity
                <span className="group-hover:translate-x-1 transition-transform">→</span>
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
