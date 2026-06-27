'use client';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import type { ClientRegistry } from '@/lib/api';

interface SubscriptionAppProps {
  client: ClientRegistry;
}

const getPlans = (t: (k: string) => string) => [
  {
    id: 'free',
    name: 'Free Starter',
    price: 'Rp 0',
    features: ['5 Auto Responders', 'No File Uploads', 'Limited Features', '1 Active Group'],
    icon: 'spa',
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 'Rp 2.000',
    features: ['5 Auto Responders', '500KB Max Upload', '50MB Total Storage', '1 Active Group', 'Basic Support'],
    icon: 'grade',
  },
  {
    id: 'standard',
    name: 'Standard Pro',
    price: 'Rp 5.000',
    features: ['25 Auto Responders', '5MB Max Upload', '500MB Total Storage', '2 Active Groups', '24/7 Priority Support'],
    icon: 'stars',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium Ultra',
    price: 'Rp 20.000',
    features: ['100 Auto Responders', '15MB Max Upload', '1000MB Total Storage', '5 Active Groups', '24/7 Priority Support'],
    icon: 'workspace_premium',
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
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      
      {/* Current Status Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b]">
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-4">
          Current Subscription Status
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-zinc-950 bg-white shadow-[2px_2px_0px_#09090b] flex items-center justify-between">
            <div>
              <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Package Tier</div>
              <div className="text-sm font-black text-zinc-950 mt-0.5">{client.Package_Tier}</div>
            </div>
            <span className="material-symbols-outlined text-zinc-400 text-[20px]">layers</span>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-950 bg-white shadow-[2px_2px_0px_#09090b] flex items-center justify-between">
            <div>
              <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Days Left</div>
              <div className="text-sm font-black text-zinc-950 mt-0.5">{client.Days_Left} Days</div>
            </div>
            <span className="material-symbols-outlined text-zinc-400 text-[20px]">calendar_today</span>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-950 bg-white shadow-[2px_2px_0px_#09090b] flex items-center justify-between">
            <div>
              <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Account Status</div>
              <div className="text-sm font-black text-zinc-955 mt-0.5">{client.Account_Status}</div>
            </div>
            <span className="material-symbols-outlined text-zinc-400 text-[20px]">verified_user</span>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div>
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-4">
          Choose Your Plan
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getPlans(t).map((plan) => (
            <div
              key={plan.id}
              className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] flex flex-col justify-between min-h-[22rem] relative"
            >
              {plan.popular && (
                <div className="absolute -top-3 right-6 px-3 py-1 bg-zinc-950 text-zinc-55 border border-zinc-950 rounded-full text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000000]">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 border border-zinc-200/50 text-zinc-800 shrink-0">
                      <span className="material-symbols-outlined text-[20px] font-medium">{plan.icon}</span>
                    </div>
                    <div className="text-base font-black text-zinc-950">{plan.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-zinc-955">{plan.price}</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">/ month</div>
                  </div>
                </div>
                
                <ul className="space-y-2 mt-4 text-left">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center text-xs text-zinc-700 font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-zinc-950 mr-2 font-black shrink-0">check</span>
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={`https://wa.me/62882008677172?text=Halo admin, saya mau berlangganan paket ${plan.name}.`}
                target="_blank"
                className="w-full py-2.5 mt-6 rounded-full text-xs font-black text-center bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-[3px_3px_0px_#000000] border border-zinc-950 block cursor-pointer"
              >
                Order Package
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Budget Calculator */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-4">
        {!showCalc ? (
          <div className="text-center py-2">
            <p className="text-xs font-bold text-zinc-900">Need a custom plan tailored to your needs?</p>
            <button 
              onClick={() => setShowCalc(true)}
              className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-full text-xs font-black bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-[3px_3px_0px_#000000] border border-zinc-955 cursor-pointer"
            >
              ⚙ Custom Calculator
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/50">
              <h3 className="font-black text-zinc-955 text-sm">Adjust Custom Package</h3>
              <button 
                onClick={() => setShowCalc(false)} 
                className="w-6 h-6 rounded-full border border-zinc-200 flex items-center justify-center font-bold text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold">
                  <span className="text-zinc-500">Auto Responder Slots</span>
                  <span className="text-zinc-955">{responSlots} Slots</span>
                </div>
                <input 
                  type="range" 
                  min="25" 
                  max="100" 
                  step="25" 
                  value={responSlots} 
                  onChange={(e) => setResponSlots(Number(e.target.value))} 
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-950" 
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold mt-1">
                  <span>25</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold">
                  <span className="text-zinc-500">WhatsApp Group Slots</span>
                  <span className="text-zinc-955">{groupSlots} Groups</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1" 
                  value={groupSlots} 
                  onChange={(e) => setGroupSlots(Number(e.target.value))} 
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-950" 
                />
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold mt-1">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-xs font-bold block mb-1.5">Support & SLA Service</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setServiceType('basic')}
                    className={`py-2 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                      serviceType === 'basic' 
                        ? 'bg-zinc-950 border-zinc-800 text-white shadow-[2px_2px_0px_#000000]' 
                        : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    Basic Support
                  </button>
                  <button 
                    onClick={() => setServiceType('24/7')}
                    className={`py-2 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                      serviceType === '24/7' 
                        ? 'bg-zinc-950 border-zinc-800 text-white shadow-[2px_2px_0px_#000000]' 
                        : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    24/7 Priority Support
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200/50 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Estimated Price</div>
                  <div className="text-lg font-black text-zinc-955">
                    Rp {totalPrice.toLocaleString('id-ID')}{' '}
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">/ Month</span>
                  </div>
                </div>
                
                <a 
                  href={`https://wa.me/62882008677172?text=Halo admin, saya mau pesan custom plan: ${responSlots} Respon, ${groupSlots} Grup, ${serviceType === '24/7' ? '24/7 Support' : 'Basic Support'}. Estimasi Rp ${totalPrice.toLocaleString('id-ID')}/bln.`}
                  target="_blank"
                  className="px-5 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-[3px_3px_0px_#000000] border border-zinc-950 cursor-pointer animate-island-in"
                >
                  Order via WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
