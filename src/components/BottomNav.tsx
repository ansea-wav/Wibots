"use client";

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/lib/ThemeContext';

export type MobileTab = 'dashboard' | 'protocols' | 'responder' | 'earn' | 'settings';

interface BottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { theme } = useTheme();
  
  const navItems = [
    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
    { id: 'protocols', icon: 'apps', label: 'Protocols' },
    { id: 'responder', icon: 'swap_horiz', label: 'Swap' },
    { id: 'earn', icon: 'diamond', label: 'Earn', badge: 'NEW' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  const wrapperRef = useRef<HTMLDivElement>(null);
  const displacementSvgRef = useRef<SVGSVGElement>(null);
  
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [mapUri, setMapUri] = useState<string>('');
  const [isSvgFilterSupported, setIsSvgFilterSupported] = useState(true);

  useEffect(() => {
    // Feature detection for SVG backdrop-filter support
    const supportsSvgFilter = typeof CSS !== 'undefined' && CSS.supports && (
      CSS.supports('backdrop-filter', 'url(#test)') || 
      CSS.supports('-webkit-backdrop-filter', 'url(#test)')
    );
    setIsSvgFilterSupported(!!supportsSvgFilter);

    if (!wrapperRef.current) return;

    let rafId: number;
    const updateDims = () => {
      if (wrapperRef.current) {
        // High-precision measurement matching Jhey's ResizeObserver usage
        const rect = wrapperRef.current.getBoundingClientRect();
        setDims(prev => {
          if (Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1) return prev;
          return { width: rect.width, height: rect.height };
        });
      }
    };

    updateDims();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDims);
    });
    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Serialize the hidden SVG DOM node EXACTLY like the reference HTML does
  useEffect(() => {
    if (displacementSvgRef.current && dims.width > 0 && dims.height > 0) {
      try {
        const serialized = new XMLSerializer().serializeToString(displacementSvgRef.current);
        setMapUri(`data:image/svg+xml,${encodeURIComponent(serialized)}`);
      } catch (e) {
        console.error('Failed to serialize SVG', e);
      }
    }
  }, [dims]);

  const radius = 32;
  const border = Math.min(dims.width || 360, dims.height || 72) * (0.07 * 0.5);

  return (
    <div 
      ref={wrapperRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-[72px] z-[9999]"
    >
      {dims.width > 0 && dims.height > 0 && (
        <>
          {/* 1. The exact DOM-based Displacement Image Generator (Hidden) */}
          <svg 
            ref={displacementSvgRef}
            style={{ display: 'none' }} 
            viewBox={`0 0 ${dims.width} ${dims.height}`} 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="redChannelGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#000"/>
                <stop offset="100%" stopColor="red"/>
              </linearGradient>
              <linearGradient id="blueChannelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000"/>
                <stop offset="100%" stopColor="blue"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={dims.width} height={dims.height} fill="black"></rect>
            <rect x="0" y="0" width={dims.width} height={dims.height} rx={radius} fill="url(#redChannelGradient)" />
            <rect x="0" y="0" width={dims.width} height={dims.height} rx={radius} fill="url(#blueChannelGradient)" style={{ mixBlendMode: 'difference' }} />
            <rect 
              x={border} 
              y={border} 
              width={dims.width - border * 2} 
              height={dims.height - border * 2} 
              rx={radius} 
              fill="hsl(0, 0%, 50%)" 
              fillOpacity={0.93} 
              style={{ filter: 'blur(11px)' }} 
            />
          </svg>

          {/* 2. The exact '.effect' container mirroring Jhey's architecture */}
          <div 
            className="w-full h-full relative"
            style={{ 
              borderRadius: radius,
              background: theme === 'oled' ? '#000000' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: theme === 'oled' ? 'none' : (isSvgFilterSupported && mapUri ? 'url(#liquid-glass-filter) saturate(1)' : 'blur(24px) saturate(1.5)'),
              WebkitBackdropFilter: theme === 'oled' ? 'none' : (isSvgFilterSupported && mapUri ? 'url(#liquid-glass-filter) saturate(1)' : 'blur(24px) saturate(1.5)'),
              boxShadow: theme === 'oled' ? 'none' : `
                0 0 2px 1px rgba(255, 255, 255, 0.1) inset,
                0 0 10px 4px rgba(255, 255, 255, 0.05) inset,
                0px 4px 16px rgba(0, 0, 0, 0.15),
                0px 8px 24px rgba(0, 0, 0, 0.2),
                0px 16px 56px rgba(0, 0, 0, 0.25),
                0px 4px 16px rgba(0, 0, 0, 0.1) inset,
                0px 8px 24px rgba(0, 0, 0, 0.05) inset
              `,
              border: theme === 'oled' ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}
          >
            {/* 3. The precise SVG Filter injected directly inside the container */}
            {isSvgFilterSupported && mapUri && theme !== 'oled' && (
              <svg className="absolute inset-0 pointer-events-none w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="liquid-glass-filter" colorInterpolationFilters="sRGB">
                    <feImage href={mapUri} x="0" y="0" width="100%" height="100%" result="map" preserveAspectRatio="none" />
                    
                    <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-180" result="dispRed" />
                    <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                    
                    <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-170" result="dispGreen" />
                    <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                    
                    <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" scale="-160" result="dispBlue" />
                    <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                    
                    <feBlend in="red" in2="green" mode="screen" result="rg" />
                    <feBlend in="rg" in2="blue" mode="screen" result="output" />
                    
                    <feGaussianBlur in="output" stdDeviation="0.2" />
                  </filter>
                </defs>
              </svg>
            )}

            {/* Nav content wrapped with overflow hidden exactly like .nav-wrap */}
            <div className="w-full h-full overflow-hidden flex justify-between items-center p-2 px-4 relative z-10" style={{ borderRadius: 'inherit' }}>
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
        </>
      )}
    </div>
  );
}
