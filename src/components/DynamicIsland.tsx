'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('yay-toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
};

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function DynamicIsland() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toast listener
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToast = { id: Date.now(), ...customEvent.detail };
      setToasts(prev => [...prev, newToast]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000); // Hide after 4 seconds
    };

    window.addEventListener('yay-toast', handleToast);
    return () => window.removeEventListener('yay-toast', handleToast);
  }, []);

  // iOS Sequence listener
  useEffect(() => {
    // Disabled auto-play. The island will remain completely hidden (diem) 
    // unless triggered by an actual music detection event in the future.
  }, []);

  return (
    <>
      {/* 1. Original Toast System */}
      {toasts.length > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center space-y-2 pointer-events-none">
          {toasts.map((t, index) => (
            <div 
              key={t.id}
              className="flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-xl border border-white/10 transition-all duration-500 ease-out animate-island-in"
              style={{ 
                background: 'rgba(20, 20, 20, 0.85)',
                transform: `scale(${1 - (toasts.length - 1 - index) * 0.05}) translateY(${(toasts.length - 1 - index) * 10}px)`,
                opacity: index < toasts.length - 3 ? 0 : 1, // Only show top 3
                zIndex: 99999 - index
              }}
            >
              {t.type === 'success' && <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse"></span>}
              {t.type === 'error' && <span className="w-2 h-2 rounded-full bg-[var(--neon-red)] animate-pulse"></span>}
              {t.type === 'info' && <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>}
              <span className="text-sm font-semibold text-white tracking-wide">{t.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 2. New Draggable iOS Island */}
      {phase > 0 && (
        <div ref={containerRef} className="fixed top-4 left-4 right-4 z-[99998] pointer-events-none flex justify-end">
          <motion.div 
            drag="x"
            dragConstraints={containerRef}
            dragElastic={0.2}
            className="pointer-events-auto"
            whileDrag={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                width: phase === 0 ? 80 : phase === 1 ? 160 : 240,
                height: phase === 2 ? 64 : 36,
                borderRadius: 32
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-black border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] overflow-hidden relative flex flex-col justify-center items-center cursor-grab active:cursor-grabbing backdrop-blur-xl"
            >
              <AnimatePresence mode="wait">
                {phase === 1 && (
                  <motion.div
                    key="phase1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute flex items-center gap-2 text-white text-xs font-semibold tracking-wide"
                  >
                    <span className="material-symbols-outlined text-[16px] text-blue-400">chat_bubble</span>
                    1 Message
                  </motion.div>
                )}
                
                {phase === 2 && (
                  <motion.div
                    key="phase2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, staggerChildren: 0.1 }}
                    className="absolute inset-0 flex flex-col justify-center px-4 py-1"
                  >
                    {/* Top Row: Now Playing */}
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[12px] text-black">music_note</span>
                        </div>
                        <span className="text-white text-xs font-bold tracking-wide truncate max-w-[120px]">
                          Now Playing
                        </span>
                      </div>
                      {/* Equalizer animation */}
                      <div className="flex items-end gap-[2px] h-3">
                        <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="w-[3px] bg-green-400 rounded-full" />
                        <motion.div animate={{ height: ["70%", "30%", "70%"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2, ease: "easeInOut" }} className="w-[3px] bg-green-400 rounded-full" />
                        <motion.div animate={{ height: ["100%", "50%", "100%"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4, ease: "easeInOut" }} className="w-[3px] bg-green-400 rounded-full" />
                      </div>
                    </div>

                    {/* Bottom Row: 1 Message (scaled down) */}
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="material-symbols-outlined text-[10px] text-blue-400">chat_bubble</span>
                      <span className="text-white text-[10px] font-medium tracking-wider">1 Message</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      )}
    </>
  );
}
