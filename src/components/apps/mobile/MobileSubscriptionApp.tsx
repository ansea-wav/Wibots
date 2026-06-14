'use client';
import { useState } from 'react';
import type { ClientRegistry } from '@/lib/api';

interface SubscriptionAppProps {
  client: ClientRegistry;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rp 0',
    features: ['1 Respon', 'No File Upload/Media', 'Few Services', '1 Group'],
    color: '#9ca3af',
    icon: 'eco',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'Rp 2.000',
    features: ['5 Respon', '500kb per file upload', '50MB Storage Maks', '1 Group', 'Basic Support'],
    color: '#6b7280',
    icon: 'star',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'Rp 5.000',
    features: ['25 Respon', '5MB per file upload', '500MB Storage Maks', '2 Group', '24/7 Support'],
    color: '#3b82f6',
    icon: 'stars',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Rp 20.000',
    features: ['100 Respon', '15MB per file upload', '1000MB Storage Maks', '5 Group', '24/7 Support'],
    color: '#a855f7',
    icon: 'diamond',
  },
];

export default function MobileSubscriptionApp({ client }: SubscriptionAppProps) {
  return (
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-center relative overflow-hidden">
          <span className="material-symbols-outlined text-6xl text-blue-400 mb-2">diamond</span>
          <h2 className="text-xl font-bold text-white">Layanan & Pricing</h2>
          <p className="text-sm text-white/70 mt-2">Wazle Subscription Plans</p>
        </div>

        {/* Current Status */}
        <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg mb-6">
          <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4">Current Subscription</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Plan</div>
              <div className="font-bold text-white text-sm">{client.Package_Tier}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Days Left</div>
              <div className={`font-bold text-sm ${client.Days_Left <= 3 ? 'text-red-500' : client.Days_Left <= 7 ? 'text-yellow-500' : 'text-green-500'}`}>
                {client.Days_Left} days
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Status</div>
              <div className={`font-bold text-sm flex items-center gap-1 ${client.Account_Status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                {client.Account_Status}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Available Plans</h3>
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-3xl border transition-all bg-[#1a1a1c] overflow-hidden"
              style={{
                borderColor: `${plan.color}30`,
              }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }}>
                  Popular
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${plan.color}20`, color: plan.color }}>
                    <span className="material-symbols-outlined text-2xl">{plan.icon}</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{plan.name}</div>
                    <div className="flex items-end gap-1">
                      <span className="text-xl font-bold" style={{ color: plan.color }}>{plan.price}</span>
                      <span className="text-xs text-white/40 mb-1">/bulan</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: plan.color }}>check_circle</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer Contact */}
        <div className="mt-8 mb-4 p-5 rounded-3xl border border-white/5 bg-[#1a1a1c] text-center">
          <span className="material-symbols-outlined text-3xl text-white/40 mb-2 block">support_agent</span>
          <p className="text-sm font-medium text-white mb-4">Hubungi staff Wazle untuk mengupgrade / menurunkan layanan kamu</p>
          <button className="w-full py-4 rounded-full bg-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined">chat</span>
            Hubungi Staff
          </button>
        </div>
      </div>
    </div>
  );
}
