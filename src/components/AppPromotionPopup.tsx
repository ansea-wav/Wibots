"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppPromotionPopup() {
  const [stage, setStage] = useState<'initial' | 'visible' | 'blinking' | 'closing' | 'closed'>('initial');
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    // Detect if Android but NOT inside our WebView (Antarac)
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    // Common indicator for Android WebView is 'wv'
    const isWebView = ua.includes('wv') || ua.includes('antarac');
    
    // Test logic: if we want to test on desktop, comment the line below
    if (isAndroid && !isWebView) {
      setIsEligible(true);
    }
  }, []);

  useEffect(() => {
    if (!isEligible) return;

    // Timeline
    // 0s: initial
    // 10s: visible
    // 23s: blinking (starts blinking for the last 2s of the 15s duration)
    // 25s: closing (slide out over 1s)
    // 26s: closed
    
    const timers = [
      setTimeout(() => setStage('visible'), 10000),
      setTimeout(() => setStage('blinking'), 23000),
      setTimeout(() => setStage('closing'), 25000),
      setTimeout(() => setStage('closed'), 26000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [isEligible]);

  if (!isEligible || stage === 'initial' || stage === 'closed') return null;

  return (
    <AnimatePresence>
      {stage !== 'closing' && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
          className={`fixed top-4 left-4 z-[9999] p-4 bg-black/80 backdrop-blur-xl border border-[var(--neon-blue)]/50 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.2)] flex flex-col gap-3 w-[280px] ${
            stage === 'blinking' ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--neon-blue)]/20 flex items-center justify-center border border-[var(--neon-blue)]/50 shrink-0">
              <i className="fi fi-rr-mobile text-[var(--neon-blue)] text-lg mt-1"></i>
            </div>
            <div>
              <h3 className="text-white text-sm font-bold leading-tight">Wazle Mobile App</h3>
              <p className="text-[var(--text-secondary)] text-[10px] mt-0.5">Native Android Experience</p>
            </div>
          </div>
          
          <p className="text-[11px] text-white/90 font-medium leading-relaxed">
            Still on the web version? If you're on Android, please use our native app!
          </p>

          <a 
            href="https://github.com/ansea-wav/Antarac/releases/download/Antarac/Antrac-beta-v0.1.apk"
            className="mt-1 w-full py-2 bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/90 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,255,0.4)]"
            onClick={() => setStage('closing')}
          >
            <i className="fi fi-rr-download mt-0.5"></i>
            Download App
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
