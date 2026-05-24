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
    icon: '🌱',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'Rp 2.000',
    features: ['5 Respon', '500kb per file upload', '50MB Storage Maks', '1 Group', 'Basic Support'],
    color: '#6b7280',
    icon: '⭐',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'Rp 5.000',
    features: ['25 Respon', '5MB per file upload', '500MB Storage Maks', '2 Group', '24/7 Support'],
    color: '#3b82f6',
    icon: '🌟',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Rp 20.000',
    features: ['100 Respon', '15MB per file upload', '1000MB Storage Maks', '5 Group', '24/7 Support'],
    color: '#a855f7',
    icon: '💎',
  },
];

export default function SubscriptionApp({ client }: SubscriptionAppProps) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-panel)' }}>
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <h2 className="text-lg font-bold text-white">💎 Layanan & Pricing</h2>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">YAY Subscription Plans</p>

        {/* Current Status */}
        <div className="mt-3 p-3 rounded-xl border border-[var(--border-subtle)] flex items-center justify-between"
          style={{ background: 'var(--surface-glass)' }}>
          <div>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Current Plan</div>
            <div className="text-sm font-semibold text-white">{client.Package_Tier}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Days Remaining</div>
            <div className={`text-sm font-bold ${client.Days_Left <= 3 ? 'text-[var(--neon-red)]' : client.Days_Left <= 7 ? 'text-[var(--neon-amber)]' : 'text-[var(--neon-green)]'}`}>
              {client.Days_Left} days
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Status</div>
            <div className={`text-sm font-semibold ${client.Account_Status === 'Active' ? 'text-[var(--neon-green)]' : 'text-[var(--neon-red)]'}`}>
              {client.Account_Status}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {/* Plan Features */}
        <div className="space-y-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-xl border transition-all"
              style={{
                background: 'var(--surface-glass)',
                borderColor: `${plan.color}30`,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-white"
                  style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }}>
                  Popular
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{plan.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{plan.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{plan.price}</div>
                    <div className="text-[9px] text-[var(--text-tertiary)]">/bulan</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.features.map((f, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: `${plan.color}20`,
                        color: `${plan.color}`,
                        background: `${plan.color}08`,
                      }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer Contact */}
        <div className="mt-8 mb-4 p-4 rounded-xl border border-[var(--border-subtle)] text-center" style={{ background: 'var(--surface-glass)' }}>
          <p className="text-xs font-semibold text-white">Hubungi staff YAY untuk mengupgrade / menurunkan layanan kamu</p>
          <a href="#" className="inline-block mt-2 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white transition-all cursor-pointer">
            Hubungi Staff
          </a>
        </div>
      </div>
    </div>
  );
}
