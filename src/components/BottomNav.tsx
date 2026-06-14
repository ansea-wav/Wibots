"use client";

import { motion } from 'framer-motion';

export type MobileTab = 'dashboard' | 'protocols' | 'responder' | 'earn' | 'settings';

interface BottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'protocols', icon: 'apps', label: 'Protocols' },
    { id: 'responder', icon: 'swap_horiz', label: 'Swap' },
    { id: 'earn', icon: 'diamond', label: 'Earn', badge: 'NEW' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-2 px-4 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex justify-between items-center relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-[2rem]"></div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as MobileTab)}
              className="relative flex flex-col items-center justify-center p-2 min-w-[56px]"
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-2xl transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#6b6b70]'}`}>
                  {item.icon}
                </span>
                
                {/* Badge "NEW" */}
                {item.badge && (
                  <div className="absolute -top-3 -right-5">
                    <div className="relative">
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-sm opacity-60"></div>
                      <div className="relative px-1.5 py-0.5 bg-gradient-to-r from-pink-400 to-purple-500 text-white text-[8px] font-black tracking-wider rounded-full shadow-lg border border-white/20 whitespace-nowrap">
                        {item.badge}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <span className={`text-[9px] mt-1 font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#6b6b70]'}`}>
                {item.label}
              </span>

              {/* Active Indicator (subtle glow behind icon) */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
