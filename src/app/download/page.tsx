'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function DownloadPage() {
  const { t, language, setLanguage } = useLanguage();
  const [cooldown, setCooldown] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const apkUrl = "https://github.com/ansea-wav/Wazle/releases/download/v0.2/Wazle-beta-v0.2.apk";

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

      {/* HEADER NAVIGATION */}
      <header className="absolute top-0 left-0 w-full z-20 pt-16 md:pt-8 pb-4 px-4 md:px-6 flex justify-center items-center pointer-events-none">
        <nav className="flex items-center gap-5 md:gap-8 bg-white/5 border border-white/10 px-6 md:px-8 py-3 rounded-full backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-auto">
          <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm font-medium">{t('nav_home')}</Link>
          <Link href="/pricing" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm font-medium">{t('nav_pricing')}</Link>
          <Link href="/download" className="text-white font-semibold text-xs md:text-sm relative">
            {t('nav_download')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-white rounded-full shadow-[0_0_8px_white]"></span>
          </Link>
        </nav>
        {/* Language Switcher */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 pointer-events-auto">
          <button 
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold text-white shadow-lg"
          >
            <span className="material-symbols-outlined text-[14px]">language</span>
            {language === 'id' ? 'ID' : 'EN'}
          </button>
        </div>
      </header>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 w-[90%] max-w-[400px] bg-[#111113] rounded-3xl p-8 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(59,130,246,0.4)]">
          <span className="material-symbols-outlined text-4xl text-white">android</span>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-2">{t('download_title')}</h1>
        <p className="text-white/60 text-sm mb-8 leading-relaxed">
          {t('download_subtitle')}
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
              {t('download_preparing')} {cooldown}s
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl">download</span>
              {t('download_btn')}
            </>
          )}
        </button>

        <p className="text-white/40 text-xs mt-6 flex flex-col gap-1.5">
          <span>{t('download_version')}</span>
          <span className="text-[10px] text-[var(--neon-blue)]/80">{t('download_note')}</span>
        </p>
      </motion.div>
    </div>
  );
}
