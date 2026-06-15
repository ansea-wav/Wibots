'use client';
import { useState, useEffect } from 'react';
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

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t, index) => {
          // Hanya tampilkan maksimal 3 toast terbaru
          if (index < toasts.length - 3) return null;
          
          return (
            <motion.div 
              layout
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-xl border border-white/10"
              style={{ 
                background: 'rgba(20, 20, 20, 0.85)',
                zIndex: 99999 - index
              }}
            >
              {t.type === 'success' && <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse"></span>}
              {t.type === 'error' && <span className="w-2 h-2 rounded-full bg-[var(--neon-red)] animate-pulse"></span>}
              {t.type === 'info' && <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>}
              <span className="text-sm font-semibold text-white tracking-wide">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
