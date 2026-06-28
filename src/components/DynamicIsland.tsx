'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('yay-toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
};

const playSound = (type: 'success' | 'error' | 'info') => {
  try {
    // Suppress AudioContext warning if user hasn't interacted yet
    if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
      if (!(navigator as any).userActivation.hasBeenActive) return;
    }
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Premium Double-Chime (iOS / Slack like)
    if (type === 'success' || type === 'info') {
      // First Note: C5 (523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      // Second Note: E5 (659.25 Hz) - slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
      gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.4);
    } else {
      // Soft error buzz: two lower notes descending
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(174.61, ctx.currentTime + 0.08); // F3
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
      gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.13);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    // Ignore
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

  // Toast listener with iOS Sequence Phase logic
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    let phase2Timeout: NodeJS.Timeout;

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToast = { id: Date.now(), ...customEvent.detail };
      
      playSound(customEvent.detail.type);

      setToasts([newToast]); // Replace with the latest toast
      
      // Start Phase 1 (1 Message bubble)
      setPhase(1);
      
      clearTimeout(phase2Timeout);
      clearTimeout(hideTimeout);
      
      // Switch to Phase 2 (Actual message content)
      phase2Timeout = setTimeout(() => {
        setPhase(2);
      }, 600);
      
      // Auto-hide after 4 seconds
      hideTimeout = setTimeout(() => {
        setToasts([]);
      }, 4000);
    };

    window.addEventListener('yay-toast', handleToast);
    return () => {
      window.removeEventListener('yay-toast', handleToast);
      clearTimeout(phase2Timeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const currentToast = toasts[toasts.length - 1];

  return (
    <>
      <AnimatePresence>
        {toasts.length > 0 && currentToast && (
          <motion.div 
            key="island-container"
            initial={{ y: -50, opacity: 0, scale: 0.8 }}
            animate={{ y: [-50, 10, 0], opacity: 1, scale: [0.8, 1.05, 1] }}
            exit={{ y: [0, 10, -50], opacity: [1, 1, 0], scale: [1, 0.95, 0.8] }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            ref={containerRef} 
            className="fixed top-4 left-4 right-4 z-[99998] pointer-events-none flex justify-center"
          >
            <motion.div 
              drag="x"
              dragConstraints={containerRef}
              dragElastic={0.2}
              className="pointer-events-auto"
              whileDrag={{ scale: 0.95 }}
            >
              <motion.div
                animate={{
                  width: phase === 1 ? 160 : 300,
                  height: phase === 2 ? 46 : 36,
                  borderRadius: 16
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="bg-[#fdfcf7] border-2 border-zinc-950 shadow-[4px_4px_0px_#09090b] overflow-hidden relative flex flex-col justify-center items-center cursor-grab active:cursor-grabbing"
              >
                <AnimatePresence mode="wait">
                  {phase === 1 && (
                    <motion.div
                      key="phase1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute flex items-center gap-2 text-zinc-950 text-[11px] font-black uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[14px] text-zinc-950 font-bold">chat_bubble</span>
                      Notification
                    </motion.div>
                  )}
                  
                  {phase === 2 && (
                    <motion.div
                      key="phase2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="absolute inset-0 flex items-center px-4 gap-2.5"
                    >
                      {currentToast.type === 'success' && <span className="w-2 h-2 flex-shrink-0 rounded-full bg-emerald-500 border border-zinc-950"></span>}
                      {currentToast.type === 'error' && <span className="w-2 h-2 flex-shrink-0 rounded-full bg-rose-500 border border-zinc-950"></span>}
                      {currentToast.type === 'info' && <span className="w-2 h-2 flex-shrink-0 rounded-full bg-zinc-950"></span>}
                      
                      <span className="text-zinc-950 text-[11px] font-bold tracking-wide truncate">
                        {currentToast.message}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
