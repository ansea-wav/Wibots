'use client';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
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
  const { t } = useLanguage();
  const [showCalc, setShowCalc] = useState(false);
  const [responSlots, setResponSlots] = useState(25);
  const [groupSlots, setGroupSlots] = useState(2);
  const [serviceType, setServiceType] = useState<'basic' | '24/7'>('24/7');

  const calculatePrice = () => {
    const responPrice = (responSlots / 25) * 1000;
    const groupPrice = groupSlots * 1100;
    const supportPrice = serviceType === '24/7' ? 1800 : 0;
    return responPrice + groupPrice + supportPrice;
  };

  const totalPrice = calculatePrice();

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-panel)' }}>
      {/* Header */}
      <div className="p-5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <h2 className="text-lg font-bold text-white">💎 {t('services_pricing')}</h2>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{t('subscription_desc')}</p>

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
        
        {/* Footer Contact -> Budget Adjustment */}
        <div className="mt-8 mb-4 p-4 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--surface-glass)' }}>
          {!showCalc ? (
            <div className="text-center">
              <p className="text-xs font-semibold text-white">{t('budget_adjustment_title')}</p>
              <button 
                onClick={() => setShowCalc(true)}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white transition-all cursor-pointer"
              >
                <i className="fi fi-rr-settings-sliders"></i>
                {t('budget_adjustment_btn')}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-subtle)]">
                <h3 className="font-bold text-white text-sm">{t('adjust_package')}</h3>
                <button onClick={() => setShowCalc(false)} className="text-[var(--text-tertiary)] hover:text-white transition-colors">
                  <i className="fi fi-rr-cross-small"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--text-secondary)]">{t('response_slot')}</span>
                    <span className="font-bold text-[var(--accent-primary)]">{responSlots}</span>
                  </div>
                  <input type="range" min="25" max="100" step="25" value={responSlots} onChange={(e) => setResponSlots(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent-primary)' }} />
                  <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] mt-1"><span>25</span><span>100</span></div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--text-secondary)]">{t('whatsapp_group')}</span>
                    <span className="font-bold text-[var(--accent-primary)]">{groupSlots}</span>
                  </div>
                  <input type="range" min="1" max="5" step="1" value={groupSlots} onChange={(e) => setGroupSlots(Number(e.target.value))} className="w-full" style={{ accentColor: 'var(--accent-primary)' }} />
                  <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] mt-1"><span>1</span><span>5</span></div>
                </div>

                <div>
                  <span className="text-[var(--text-secondary)] text-xs block mb-1.5">{t('support_service')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setServiceType('basic')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${serviceType === 'basic' ? 'bg-[var(--accent-primary)] text-white' : 'bg-white/5 text-[var(--text-secondary)] border border-white/10'}`}
                    >
                      {t('basic_service')}
                    </button>
                    <button 
                      onClick={() => setServiceType('24/7')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${serviceType === '24/7' ? 'bg-[var(--accent-primary)] text-white' : 'bg-white/5 text-[var(--text-secondary)] border border-white/10'}`}
                    >
                      {t('service_247')}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-0.5">{t('total_estimation')}</div>
                      <div className="text-xl font-bold text-white">Rp {totalPrice.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-[var(--text-tertiary)]">{t('per_month')}</span></div>
                    </div>
                    <a 
                      href={`https://wa.me/62882008677172?text=Halo admin, saya mau pesan custom plan: ${responSlots} Respon, ${groupSlots} Grup, ${serviceType === '24/7' ? '24/7 Support' : 'Basic Support'}. Estimasi Rp ${totalPrice.toLocaleString('id-ID')}/bln.`}
                      target="_blank"
                      className="px-4 py-2 rounded-lg bg-[var(--neon-green)] text-black font-bold text-xs flex items-center gap-2 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      <i className="fi fi-rr-comment-alt"></i>
                      {t('order_via_wa')}
                    </a>
                  </div>
                  <p className="text-[9px] text-[var(--text-tertiary)] text-center mt-3 pt-3 border-t border-[var(--border-subtle)]/50 leading-relaxed max-w-[250px] mx-auto">
                    {t('storage_note')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
