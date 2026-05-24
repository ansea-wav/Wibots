import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error';

export function useToast() {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<ToastType>('success');

  const playSound = (type: ToastType) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'success') {
        // Success "Ping"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Error "Buzzer"
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Ignore if AudioContext is not supported
    }
  };

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    playSound(type);
    setTimeout(() => {
      setToastVisible(false);
    }, 5000);
  }, []);

  const colorClass = toastType === 'success' ? 'bg-[var(--neon-green)]' : 'bg-[var(--neon-red)]';

  const toastElement = (
    <div 
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-[99999] transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] flex items-center justify-center overflow-hidden shadow-2xl ${
        toastVisible 
          ? 'w-[340px] h-[48px] bg-black/90 backdrop-blur-xl border border-white/20 rounded-full opacity-100 scale-100 translate-y-0' 
          : 'w-[120px] h-[32px] bg-black/50 border border-transparent rounded-full opacity-0 scale-90 -translate-y-8 pointer-events-none'
      }`}
    >
      <div 
        className={`flex items-center gap-3 px-4 w-full transition-opacity duration-300 delay-100 ${
          toastVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${colorClass}`} />
        <span className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
          {toastMessage}
        </span>
      </div>
    </div>
  );

  return { showToast, toastElement };
}
