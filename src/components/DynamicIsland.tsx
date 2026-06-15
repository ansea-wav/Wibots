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

  // Toast listener with iOS Sequence Phase logic
  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    let phase2Timeout: NodeJS.Timeout;

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToast = { id: Date.now(), ...customEvent.detail };
      
      setToasts([newToast]); // Replace with the latest toast
      
      // Start Phase 1 (1 Message bubble)
      setPhase(1);
      
      clearTimeout(phase2Timeout);
      clearTimeout(hideTimeout);
      
      // Switch to Phase 2 (Actual message content)
      phase2Timeout = setTimeout(() => {
        setPhase(2);
      }, 700);
      
      // Auto-hide after 3.5 seconds
      hideTimeout = setTimeout(() => {
        // Just clear the toasts to trigger the smooth exit animation of the entire container
        setToasts([]);
      }, 3500);
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
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
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
                  width: phase === 1 ? 160 : 280,
                  height: phase === 2 ? 46 : 36,
                  borderRadius: 32
                }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="bg-black border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] overflow-hidden relative flex flex-col justify-center items-center cursor-grab active:cursor-grabbing backdrop-blur-xl"
              >
                <AnimatePresence mode="wait">
                  {phase === 1 && (
                    <motion.div
                      key="phase1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute flex items-center gap-2 text-white text-[11px] font-semibold tracking-wide uppercase"
                    >
                      <span className="material-symbols-outlined text-[14px] text-blue-400">chat_bubble</span>
                      1 Notification
                    </motion.div>
                  )}
                  
                  {phase === 2 && (
                    <motion.div
                      key="phase2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="absolute inset-0 flex items-center px-5 gap-3"
                    >
                      {currentToast.type === 'success' && <span className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-[var(--neon-green)] animate-pulse shadow-[0_0_8px_var(--neon-green)]"></span>}
                      {currentToast.type === 'error' && <span className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-[var(--neon-red)] animate-pulse shadow-[0_0_8px_var(--neon-red)]"></span>}
                      {currentToast.type === 'info' && <span className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]"></span>}
                      
                      <span className="text-white text-[11px] font-medium tracking-wide truncate">
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
