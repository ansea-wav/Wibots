"use client";

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 360, height: 72 });
  const [isSvgFilterSupported, setIsSvgFilterSupported] = useState(true); // Default true, detect fallback later

  useEffect(() => {
    // Feature detection for SVG backdrop-filter support
    const supportsSvgFilter = typeof CSS !== 'undefined' && CSS.supports && (
      CSS.supports('backdrop-filter', 'url(#test)') || 
      CSS.supports('-webkit-backdrop-filter', 'url(#test)')
    );
    setIsSvgFilterSupported(!!supportsSvgFilter);

    if (!containerRef.current) return;

    let rafId: number;
    const updateDims = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        setDims(prev => {
          if (prev.width === w && prev.height === h) return prev;
          return { width: w, height: h };
        });
      }
    };

    updateDims();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDims);
    });
    observer.observe(containerRef.current);

    window.addEventListener('resize', updateDims);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDims);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const border = Math.min(dims.width, dims.height) * (0.07 * 0.5);
  const radius = 32;

  // Exact matching SVG from reference
  const mapSvg = `
    <svg width="${dims.width}" height="${dims.height}" viewBox="0 0 ${dims.width} ${dims.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#000"/>
          <stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000"/>
          <stop offset="100%" stop-color="blue"/>
        </linearGradient>
        <filter id="inner-blur">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <rect x="0" y="0" width="${dims.width}" height="${dims.height}" fill="black"></rect>
      <rect x="0" y="0" width="${dims.width}" height="${dims.height}" rx="${radius}" fill="url(#red)" />
      <rect x="0" y="0" width="${dims.width}" height="${dims.height}" rx="${radius}" fill="url(#blue)" style="mix-blend-mode: difference" />
      <rect x="${border}" y="${border}" width="${dims.width - border * 2}" height="${dims.height - border * 2}" rx="${radius}" fill="hsl(0, 0%, 50%)" fill-opacity="0.93" filter="url(#inner-blur)" />
    </svg>
  `.trim();

  // Removed ;utf8 as it breaks data URI SVG parsing in many mobile webviews
  const mapUri = `data:image/svg+xml,${encodeURIComponent(mapSvg)}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[9999]">
      <svg className="hidden absolute pointer-events-none" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id="liquid-glass-filter" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feImage href={mapUri} x="0" y="0" width="100%" height="100%" result="map" preserveAspectRatio="none" />
            
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-180" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-170" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-160" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="rgbOut" />
            
            <feGaussianBlur in="rgbOut" stdDeviation="0.3" />
          </filter>
        </defs>
      </svg>

      <div 
        ref={containerRef}
        className="border border-white/10 rounded-[2rem] p-2 px-4 flex justify-between items-center relative overflow-hidden transition-all duration-300"
        style={{ 
          backdropFilter: isSvgFilterSupported 
            ? 'url(#liquid-glass-filter) saturate(150%) brightness(1.1)' 
            : 'blur(24px) saturate(160%) brightness(1.05)',
          WebkitBackdropFilter: isSvgFilterSupported 
            ? 'url(#liquid-glass-filter) saturate(150%) brightness(1.1)' 
            : 'blur(24px) saturate(160%) brightness(1.05)',
          background: isSvgFilterSupported 
            ? 'rgba(255, 255, 255, 0.015)' 
            : 'rgba(15, 15, 20, 0.55)',
          boxShadow: `
            0 0 2px 1px rgba(255, 255, 255, 0.15) inset,
            0 0 10px 4px rgba(255, 255, 255, 0.05) inset,
            0px 4px 16px rgba(0, 0, 0, 0.25),
            0px 8px 24px rgba(0, 0, 0, 0.3),
            0px 16px 56px rgba(0, 0, 0, 0.45),
            0px 4px 16px rgba(0, 0, 0, 0.25) inset,
            0px 8px 24px rgba(0, 0, 0, 0.2) inset
          `
        }}
      >
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
                
                {item.badge && (
                  <div className="absolute -top-3 -right-5">
                    <div className="relative">
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
