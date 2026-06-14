'use client';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientRegistry } from '@/lib/api';

interface SubscriptionAppProps {
  client: ClientRegistry;
}

const getPlans = (t: (k: string) => string) => [
  {
    id: 'free',
    name: t('plan_free_name'),
    price: 'Rp 0',
    features: [t('feat_1_resp'), t('feat_no_upload'), t('feat_few_services'), t('feat_1_group')],
    color: '#9ca3af',
    icon: 'eco',
  },
  {
    id: 'basic',
    name: t('plan_basic_name'),
    price: 'Rp 2.000',
    features: [t('feat_5_resp'), t('feat_500kb_upload'), t('feat_50mb_storage'), t('feat_1_group'), t('feat_basic_support')],
    color: '#6b7280',
    icon: 'star',
  },
  {
    id: 'standard',
    name: t('plan_standard_name'),
    price: 'Rp 5.000',
    features: [t('feat_25_resp'), t('feat_5mb_upload'), t('feat_500mb_storage'), t('feat_2_group'), t('feat_247_support')],
    color: '#3b82f6',
    icon: 'stars',
    popular: true,
  },
  {
    id: 'premium',
    name: t('plan_premium_name'),
    price: 'Rp 20.000',
    features: [t('feat_100_resp'), t('feat_15mb_upload'), t('feat_1000mb_storage'), t('feat_5_group'), t('feat_247_support')],
    color: '#a855f7',
    icon: 'diamond',
  },
];

export default function MobileSubscriptionApp({ client }: SubscriptionAppProps) {
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
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-center relative overflow-hidden">
          <span className="material-symbols-outlined text-6xl text-blue-400 mb-2">diamond</span>
          <h2 className="text-xl font-bold text-white">{t('services_pricing')}</h2>
          <p className="text-sm text-white/70 mt-2">{t('subscription_desc')}</p>
        </div>

        {/* Current Status */}
        <div className="bg-[#1a1a1c] p-5 rounded-3xl border border-white/5 shadow-lg mb-6">
          <h3 className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-4">{t('current_subscription')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{t('plan')}</div>
              <div className="font-bold text-white text-sm">{t(client.Package_Tier) || client.Package_Tier}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{t('days_left')}</div>
              <div className={`font-bold text-sm ${client.Days_Left <= 3 ? 'text-red-500' : client.Days_Left <= 7 ? 'text-yellow-500' : 'text-green-500'}`}>
                {client.Days_Left} {t('days')}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">{t('status')}</div>
              <div className={`font-bold text-sm flex items-center gap-1 ${client.Account_Status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                {t(client.Account_Status) || client.Account_Status}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">{t('available_plans')}</h3>
        <div className="space-y-4">
          {getPlans(t).map((plan) => (
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
                  {t('popular')}
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
                      <span className="text-xs text-white/40 mb-1">{t('per_month')}</span>
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
        
        {/* Footer Contact -> Budget Adjustment */}
        <div className="mt-8 mb-4 p-5 rounded-3xl border border-white/5 bg-[#1a1a1c]">
          <AnimatePresence mode="wait">
            {!showCalc ? (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <span className="material-symbols-outlined text-3xl text-white/40 mb-2 block">tune</span>
                <p className="text-sm font-medium text-white mb-4">{t('budget_adjustment_title')}</p>
                <button 
                  onClick={() => setShowCalc(true)}
                  className="w-full py-4 rounded-full bg-blue-500 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
                >
                  <span className="material-symbols-outlined">calculate</span>
                  {t('budget_adjustment_btn')}
                </button>
              </motion.div>
            ) : (
              <motion.div key="calc" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-white text-lg">{t('adjust_package')}</h3>
                  <button onClick={() => setShowCalc(false)} className="text-white/40"><span className="material-symbols-outlined">close</span></button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">{t('response_slot')}</span>
                      <span className="font-bold text-blue-400">{responSlots}</span>
                    </div>
                    <input type="range" min="25" max="100" step="25" value={responSlots} onChange={(e) => setResponSlots(Number(e.target.value))} className="w-full accent-blue-500" />
                    <div className="flex justify-between text-[10px] text-white/30 mt-1"><span>25</span><span>100</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">{t('whatsapp_group')}</span>
                      <span className="font-bold text-blue-400">{groupSlots}</span>
                    </div>
                    <input type="range" min="1" max="5" step="1" value={groupSlots} onChange={(e) => setGroupSlots(Number(e.target.value))} className="w-full accent-blue-500" />
                    <div className="flex justify-between text-[10px] text-white/30 mt-1"><span>1</span><span>5</span></div>
                  </div>

                  <div>
                    <span className="text-white/70 text-sm block mb-2">{t('support_service')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setServiceType('basic')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${serviceType === 'basic' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}
                      >
                        {t('basic_service')}
                      </button>
                      <button 
                        onClick={() => setServiceType('24/7')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${serviceType === '24/7' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50 border border-white/10'}`}
                      >
                        {t('service_247')}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="text-center mb-4">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">{t('total_estimation')}</div>
                      <div className="text-3xl font-bold text-white">Rp {totalPrice.toLocaleString('id-ID')} <span className="text-sm font-normal text-white/40">{t('per_month')}</span></div>
                    </div>
                    <a 
                      href={`https://wa.me/62882008677172?text=Halo admin, saya mau pesan custom plan: ${responSlots} Respon, ${groupSlots} Grup, ${serviceType === '24/7' ? '24/7 Support' : 'Basic Support'}. Estimasi Rp ${totalPrice.toLocaleString('id-ID')}/bln.`}
                      target="_blank"
                      className="w-full py-4 rounded-full bg-green-500 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-green-500/20 block text-center"
                    >
                      <span className="material-symbols-outlined">chat</span>
                      {t('order_via_wa')}
                    </a>
                    <p className="text-[10px] text-white/30 text-center mt-3 leading-relaxed max-w-[200px] mx-auto">
                      {t('storage_note')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
