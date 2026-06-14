'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DownloadPage() {
  const [cooldown, setCooldown] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const apkUrl = "https://github.com/ansea-wav/Antarac/releases/download/Antarac/Antrac-beta-v0.1.apk";

  const handleDownload = () => {
    if (cooldown > 0 || isDownloading) return;
    
    setIsDownloading(true);
    setCooldown(2);
    
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Trigger download
          window.location.href = apkUrl;
          setTimeout(() => setIsDownloading(false), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center overflow-hidden z-[9999]">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] bg-blue-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[60%] bg-purple-500/20 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 w-[90%] max-w-[400px] bg-[#111113] rounded-3xl p-8 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(59,130,246,0.4)]">
          <span className="material-symbols-outlined text-4xl text-white">android</span>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Wazle App</h1>
        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          Dapatkan pengalaman terbaik dan fitur terlengkap dengan aplikasi native Android kami.
        </p>

        <button
          onClick={handleDownload}
          disabled={cooldown > 0 || isDownloading}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            cooldown > 0 
            ? 'bg-white/10 text-white/50 cursor-not-allowed'
            : 'bg-white text-black active:scale-95 shadow-[0_10px_25px_rgba(255,255,255,0.2)]'
          }`}
        >
          {cooldown > 0 ? (
            <>
              <span className="material-symbols-outlined animate-spin text-xl">hourglass_empty</span>
              Menyiapkan... {cooldown}s
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">download</span>
              Download APK
            </>
          )}
        </button>

        <p className="text-white/30 text-xs mt-6">
          Versi: Beta v0.1 • Ukuran: ~30MB
        </p>
      </motion.div>
    </div>
  );
}
