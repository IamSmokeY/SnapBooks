'use client';

import React from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('profile');

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0A84FF] selection:text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#5E5CE6] rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0A84FF] rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
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
          <NavItem icon="📈" label="Reports" href="/reports" />
        </nav>

        <div className="p-4 border-t border-[#38383A]">
          <NavItem active icon="⚙️" label="Settings" href="/settings" />
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
          <div className="px-6 md:px-8 py-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Settings <span className="text-[#86868B] text-lg">& Preferences</span></h2>
              <p className="text-sm text-[#86868B] mt-1">Manage your account and application settings</p>
            </div>
          </div>
        </header>

        <div className="px-6 md:px-8 py-8 space-y-8">
          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'company', label: 'Company', icon: '🏢' },
              { id: 'billing', label: 'Billing', icon: '💳' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'integrations', label: 'Integrations', icon: '🔗' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30'
                    : 'bg-[#1C1C1E] text-[#86868B] hover:text-white hover:bg-[#2C2C2E]'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A]">
                <div className="flex items-start gap-6 mb-8">
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-[#0A84FF] to-[#5E5CE6] border-4 border-[#1C1C1E] flex items-center justify-center text-5xl shrink-0">
                    👤
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-2">Raj Kumar Sharma</h3>
                    <p className="text-sm text-[#86868B] mb-4">raj.sharma@snapbooks.com</p>
                    <button className="px-6 py-2.5 bg-[#0A84FF] hover:bg-[#0A84FF]/80 rounded-xl text-sm font-semibold transition-all">
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[#86868B]">Full Name</label>
                    <input type="text" defaultValue="Raj Kumar Sharma" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[#86868B]">Email Address</label>
                    <input type="email" defaultValue="raj.sharma@snapbooks.com" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[#86868B]">Phone Number</label>
                    <input type="tel" defaultValue="+91 98765 43210" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[#86868B]">Role</label>
                    <input type="text" defaultValue="Administrator" disabled className="w-full px-4 py-3 bg-[#1C1C1E]/50 border border-[#38383A] rounded-xl text-[#86868B] cursor-not-allowed" />
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-[#38383A]">
                  <button className="px-8 py-3 bg-[#0A84FF] hover:bg-[#0A84FF]/80 rounded-xl font-semibold transition-all">
                    Save Changes
                  </button>
                  <button className="px-8 py-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] rounded-xl font-semibold border border-[#38383A] transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A]">
              <h3 className="font-bold text-2xl mb-6">Company Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#86868B]">Company Name</label>
                  <input type="text" defaultValue="SnapBooks Logistics Pvt. Ltd." className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#86868B]">GST Number</label>
                  <input type="text" defaultValue="29ABCDE1234F1Z5" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-[#86868B]">Address</label>
                  <textarea rows={3} defaultValue="123 Industrial Area, Sector 15, Jaipur, Rajasthan - 302015" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#86868B]">Contact Email</label>
                  <input type="email" defaultValue="info@snapbooks.com" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[#86868B]">Contact Phone</label>
                  <input type="tel" defaultValue="+91 141 2345678" className="w-full px-4 py-3 bg-[#1C1C1E] border border-[#38383A] rounded-xl focus:border-[#0A84FF] outline-none transition-all" />
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-[#38383A]">
                <button className="px-8 py-3 bg-[#0A84FF] hover:bg-[#0A84FF]/80 rounded-xl font-semibold transition-all">
                  Update Company
                </button>
                <button className="px-8 py-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] rounded-xl font-semibold border border-[#38383A] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="glass-panel p-8 bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 border-2 border-[#0A84FF]/30">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-3xl mb-2 text-[#0A84FF]">Pro Plan</h3>
                    <p className="text-[#86868B]">Unlimited weighbridge stations and automated invoicing</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold mb-1">₹4,999<span className="text-lg text-[#86868B]">/mo</span></div>
                    <p className="text-xs text-[#86868B]">Billed monthly</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white text-black hover:bg-white/90 rounded-xl font-semibold transition-all">
                    Upgrade Plan
                  </button>
                  <button className="px-6 py-3 bg-[#1C1C1E] hover:bg-[#2C2C2E] rounded-xl font-semibold border border-[#38383A] transition-all">
                    Cancel Subscription
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="glass-panel p-8 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A]">
                <h3 className="font-bold text-2xl mb-6">Payment Method</h3>
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-[#30D158]/10 to-transparent border border-[#30D158]/30 rounded-2xl">
                  <div className="text-5xl">💳</div>
                  <div className="flex-1">
                    <p className="font-bold text-lg">Visa ending in 4242</p>
                    <p className="text-sm text-[#86868B]">Expires 12/2026</p>
                  </div>
                  <button className="px-6 py-2.5 bg-[#0A84FF] hover:bg-[#0A84FF]/80 rounded-xl text-sm font-semibold transition-all">
                    Update Card
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs can be implemented similarly */}
          {activeTab !== 'profile' && activeTab !== 'company' && activeTab !== 'billing' && (
            <div className="glass-panel p-12 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border-2 border-[#38383A] text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="font-bold text-2xl mb-2">Coming Soon</h3>
              <p className="text-[#86868B]">This section is under development</p>
            </div>
          )}
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
