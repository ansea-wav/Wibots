'use client';
import { useMemo } from 'react';
import type { ClientRegistry } from '@/lib/api';

interface AccountAppProps {
  client: ClientRegistry;
}

export default function AccountApp({ client }: AccountAppProps) {
  const isUnlimited = String(client.Days_Left) === 'Unlimited' || client.Package_Tier === 'God';
  const totalDays = useMemo(() => {
    if (isUnlimited) return 365; // Arbitrary for math
    const reg = new Date(client.Registration_Date);
    const exp = new Date(client.Expiry_Date);
    if (isNaN(reg.getTime()) || isNaN(exp.getTime())) return 30; // fallback
    return Math.max(1, Math.ceil((exp.getTime() - reg.getTime()) / (1000 * 60 * 60 * 24)));
  }, [client.Registration_Date, client.Expiry_Date, isUnlimited]);

  const daysLeftNum = isUnlimited ? totalDays : Number(client.Days_Left) || 0;
  const usedDays = isUnlimited ? 0 : totalDays - daysLeftNum;
  const percentRemaining = isUnlimited ? 100 : Math.max(0, (daysLeftNum / totalDays) * 100);

  // Donut chart SVG values
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = Number.isNaN(percentRemaining) ? 0 : circumference - (percentRemaining / 100) * circumference;

  const ringColor = isUnlimited ? 'var(--neon-green)' :
                    daysLeftNum <= 3 ? 'var(--neon-red)' :
                    daysLeftNum <= 7 ? 'var(--neon-amber)' :
                    'var(--neon-green)';

  const tierConfig = {
    Basic:    { color: '#6b7280', gradient: 'from-gray-500 to-gray-600', features: ['5 Auto Responders', 'Group Response', 'Private Response'] },
    Standard: { color: '#3b82f6', gradient: 'from-blue-500 to-cyan-500', features: ['25 Auto Responders', 'Anti-Link Protection', 'Welcome Message', 'File Upload (5MB)'] },
    Premium:  { color: '#a855f7', gradient: 'from-purple-500 to-pink-500', features: ['Unlimited Responders', 'All Features', 'Priority Support', 'File Upload (10MB)', 'Custom Branding'] },
    God:      { color: '#fbbf24', gradient: 'from-yellow-400 to-yellow-600', features: ['God Mode', 'Unlimited Everything', 'Server Control'] },
  };

  const normalizedTier = client.Package_Tier === 'Standart' ? 'Standard' : client.Package_Tier;
  const tier = tierConfig[normalizedTier as keyof typeof tierConfig] || tierConfig.Basic;

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto" style={{ background: 'var(--surface-panel)' }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Account Overview</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Billing & subscription information</p>
        </div>
        <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
          style={{
            background: `linear-gradient(135deg, ${tier.color}, ${tier.color}88)`,
            boxShadow: `0 0 12px ${tier.color}40`,
          }}>
          {client.Package_Tier}
        </div>
      </div>

      {/* Donut Chart + Days Left */}
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Background ring */}
            <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            {/* Progress ring */}
            <circle
              cx="90" cy="90" r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 90 90)"
              style={{
                transition: 'stroke-dashoffset 1.5s var(--ease-smooth)',
                filter: `drop-shadow(0 0 8px ${ringColor})`,
              }}
            />
          </svg>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-white">{isUnlimited ? '∞' : client.Days_Left}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">{isUnlimited ? 'LIFETIME' : 'Days Left'}</div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'User ID', value: client.User_ID, icon: '🆔' },
          { label: 'WhatsApp', value: `+${client.WhatsApp_Owner}`, icon: '📱' },
          { label: 'Registered', value: isUnlimited ? 'Lifetime' : new Date(client.Registration_Date).toLocaleDateString('id-ID'), icon: '📅' },
          { label: 'Expires', value: isUnlimited ? 'Never' : new Date(client.Expiry_Date).toLocaleDateString('id-ID'), icon: '⏰' },
          { label: 'Status', value: client.Account_Status, icon: client.Account_Status === 'Active' ? '✅' : '🚫' },
          { label: 'Used', value: isUnlimited ? '∞ of ∞' : `${usedDays} of ${totalDays} days`, icon: '📊' },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-xl border border-[var(--border-subtle)]"
            style={{ background: 'var(--surface-glass)' }}>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              {item.icon} {item.label}
            </div>
            <div className="text-sm font-semibold text-white truncate">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Package Features */}
      <div className="rounded-xl border border-[var(--border-subtle)] p-4" style={{ background: 'var(--surface-glass)' }}>
        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-3 font-semibold">
          Package Features
        </div>
        <div className="space-y-2">
          {tier.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--neon-green)] text-xs">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Renew Button */}
      <button
        className="w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer hover:brightness-110"
        style={{
          background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`,
          boxShadow: `0 4px 20px ${tier.color}30`,
          color: 'white',
        }}
      >
        🔄 Perpanjang Langganan (via QRIS)
      </button>
    </div>
  );
}
