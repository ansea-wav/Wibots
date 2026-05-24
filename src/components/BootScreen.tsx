'use client';
import { useEffect } from 'react';

interface BootScreenProps {
  onBootComplete: () => void;
}

export default function BootScreen({ onBootComplete }: BootScreenProps) {
  useEffect(() => {
    // Selesai boot di detik 4.0
    const t = setTimeout(() => {
      onBootComplete();
    }, 4000);

    return () => clearTimeout(t);
  }, [onBootComplete]);

  return (
    <div
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
      style={{
        zIndex: 'var(--z-boot)',
        animation: 'bootBackground 4s ease-in-out forwards',
      }}
    >
      <div 
        className="text-white font-light text-2xl tracking-[0.4em] ml-[0.4em]"
        style={{
          animation: 'bootText 4s ease-in-out forwards',
          opacity: 0,
        }}
      >
        HI
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bootBackground {
          0% { background-color: #0a0a0a; } /* Hitam sedikit putih */
          20% { background-color: #121212; } /* Detak perlahan naik */
          40% { background-color: #0a0a0a; } /* Detak perlahan turun */
          60% { background-color: #050505; } /* Mulai menggelap */
          85% { background-color: #000000; } /* Hitam OLED penuh (3.4 detik) */
          100% { background-color: #000000; } /* Tahan hitam OLED */
        }

        @keyframes bootText {
          0%, 20% { opacity: 0; transform: scale(0.95); } /* 0s - 0.8s: Hilang */
          35% { opacity: 1; transform: scale(1); } /* 1.4s: Muncul penuh */
          55% { opacity: 1; transform: scale(1.02); } /* 2.2s: Mulai menghilang pelan */
          80%, 100% { opacity: 0; transform: scale(1.05); } /* 3.2s: Hilang sepenuhnya */
        }
      `}} />
    </div>
  );
}
