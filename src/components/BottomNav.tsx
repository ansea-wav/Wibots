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

  const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><defs><linearGradient id="r" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="red"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="blue"/></linearGradient></defs><rect width="100%" height="100%" fill="#000"/><rect width="100%" height="100%" fill="url(#r)"/><rect width="100%" height="100%" fill="url(#b)" style="mix-blend-mode:screen"/></svg>`;
  const mapUri = `data:image/svg+xml;utf8,${encodeURIComponent(mapSvg)}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[9999]">
      <svg className="hidden absolute pointer-events-none" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id="liquid-glass-filter" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feImage href={mapUri} x="0" y="0" width="100%" height="100%" result="map" preserveAspectRatio="none" />
            
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="15" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="22" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="30" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="rgbOut" />
            
            <feGaussianBlur in="rgbOut" stdDeviation="6" result="blur" />
            <feComponentTransfer in="blur">
              <feFuncA type="linear" slope="1.2" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <div 
        className="bg-white/5 border border-white/20 rounded-[2rem] p-2 px-4 flex justify-between items-center relative overflow-hidden"
        style={{ 
          backdropFilter: 'url(#liquid-glass-filter) saturate(150%) brightness(1.1)',
          WebkitBackdropFilter: 'url(#liquid-glass-filter) saturate(150%) brightness(1.1)',
          boxShadow: '0 0 2px 1px rgba(255,255,255,0.1) inset, 0 0 10px 4px rgba(255,255,255,0.05) inset, 0px 16px 56px rgba(0,0,0,0.5)'
        }}
      >
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
