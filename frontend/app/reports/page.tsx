'use client';

import React from 'react';
import Link from 'next/link';

export default function ReportsPage() {
  const [period, setPeriod] = React.useState('monthly');

  const reports = [
    { name: 'Revenue Report', description: 'Detailed revenue breakdown by customer, vehicle, and material', icon: '💰', color: 'from-[#30D158]/20 to-[#30D158]/5', borderColor: 'border-[#30D158]/30' },
    { name: 'Weight Analytics', description: 'Total weight processed across all weighbridge stations', icon: '⚖️', color: 'from-[#0A84FF]/20 to-[#0A84FF]/5', borderColor: 'border-[#0A84FF]/30' },
    { name: 'Vehicle Performance', description: 'Fleet efficiency metrics and vehicle utilization rates', icon: '🚛', color: 'from-[#BF5AF2]/20 to-[#BF5AF2]/5', borderColor: 'border-[#BF5AF2]/30' },
    { name: 'Customer Insights', description: 'Top customers by revenue, order frequency, and payment status', icon: '👥', color: 'from-[#FFD60A]/20 to-[#FFD60A]/5', borderColor: 'border-[#FFD60A]/30' },
    { name: 'Invoice Summary', description: 'Overview of paid, pending, and overdue invoices', icon: '📄', color: 'from-[#FF3B30]/20 to-[#FF3B30]/5', borderColor: 'border-[#FF3B30]/30' },
    { name: 'Material Analysis', description: 'Material-wise breakdown of quantity and revenue', icon: '📊', color: 'from-[#5E5CE6]/20 to-[#5E5CE6]/5', borderColor: 'border-[#5E5CE6]/30' },
  ];

  const stats = [
    { label: 'Reports Generated', value: '1,458', change: '+124', icon: '📈', color: 'text-[#0A84FF]', bgColor: 'from-[#0A84FF]/20 to-[#0A84FF]/5' },
    { label: 'Data Points', value: '2.4M', change: '+15%', icon: '💾', color: 'text-[#30D158]', bgColor: 'from-[#30D158]/20 to-[#30D158]/5' },
    { label: 'Avg Process Time', value: '2.3s', change: '-18%', icon: '⚡', color: 'text-[#FFD60A]', bgColor: 'from-[#FFD60A]/20 to-[#FFD60A]/5' },
    { label: 'Accuracy', value: '99.7%', change: '+0.2%', icon: '🎯', color: 'text-[#BF5AF2]', bgColor: 'from-[#BF5AF2]/20 to-[#BF5AF2]/5' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#30D158] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-[#BF5AF2] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1.5s'}}></div>
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
          <NavItem icon="👥" label="Customers" href="/customers" />
          <NavItem active icon="📈" label="Reports" href="/reports" />
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
              <h2 className="text-2xl font-bold tracking-tight">Analytics <span className="text-[#86868B] text-lg">& Reports</span></h2>
              <p className="text-sm text-[#86868B] mt-1">AI-powered insights and business intelligence</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setPeriod('daily')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === 'daily' ? 'bg-[#0A84FF] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === 'weekly' ? 'bg-[#0A84FF] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === 'monthly' ? 'bg-[#0A84FF] text-white' : 'bg-[#1C1C1E] text-[#86868B] hover:text-white'}`}
              >
                Monthly
              </button>
            </div>
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

          {/* Quick Stats Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A]">
              <div className="mb-6">
                <h3 className="font-bold text-2xl mb-1">Revenue Trend</h3>
                <p className="text-sm text-[#86868B]">Last 7 days performance</p>
              </div>
              <div className="h-48 flex items-end justify-between gap-2">
                {[65, 78, 85, 72, 90, 95, 88].map((h, i) => (
                  <div key={i} className="w-full bg-gradient-to-t from-[#30D158] to-[#0A84FF] rounded-t-xl relative overflow-hidden group hover:shadow-lg hover:shadow-[#30D158]/50 transition-all" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-[#86868B] mt-2 font-mono">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

            {/* Material Distribution */}
            <div className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A]">
              <div className="mb-6">
                <h3 className="font-bold text-2xl mb-1">Material Distribution</h3>
                <p className="text-sm text-[#86868B]">Top materials by weight</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Limestone', percent: 85, color: 'bg-[#0A84FF]' },
                  { name: 'Coal', percent: 72, color: 'bg-[#30D158]' },
                  { name: 'Marble', percent: 58, color: 'bg-[#BF5AF2]' },
                  { name: 'Sand', percent: 45, color: 'bg-[#FFD60A]' },
                  { name: 'Granite', percent: 35, color: 'bg-[#FF3B30]' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-[#86868B]">{item.percent}%</span>
                    </div>
                    <div className="h-3 bg-[#1C1C1E] rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Report Templates */}
          <div>
            <div className="mb-6">
              <h3 className="font-bold text-2xl mb-2">Available Reports</h3>
              <p className="text-sm text-[#86868B]">Generate comprehensive reports with a single click</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report, i) => (
                <div key={i} className={`glass-panel p-6 bg-gradient-to-br ${report.color} border-2 ${report.borderColor} hover:scale-105 transition-all duration-300 group cursor-pointer`}>
                  <div className={`text-5xl mb-4 group-hover:scale-110 transition-transform`}>{report.icon}</div>
                  <h4 className="font-bold text-xl mb-2">{report.name}</h4>
                  <p className="text-sm text-[#86868B] mb-4 line-clamp-2">{report.description}</p>
                  <button className="w-full py-3 bg-[#1C1C1E] hover:bg-[#0A84FF] rounded-xl transition-all text-sm font-semibold border border-[#38383A] hover:border-[#0A84FF] flex items-center justify-center gap-2 group">
                    Generate Report
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              ))}
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
