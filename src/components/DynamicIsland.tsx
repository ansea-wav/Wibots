'use client';
import { useState, useEffect } from 'react';

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

  if (toasts.length === 0) return null;

  return (
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
  );
}
