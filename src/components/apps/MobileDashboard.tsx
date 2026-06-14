"use client";

import { motion } from 'framer-motion';
import type { UserMasterData } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function MobileDashboard({ userData }: { userData: UserMasterData }) {
  const { t } = useLanguage();
  const { registry } = userData;
  const maxDays = 30; // Standard month for the circle gauge
  const daysLeft = registry.Days_Left || 0;
  const percentage = Math.min(Math.max((daysLeft / maxDays) * 100, 0), 100);
  
  // Format dates
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateOptions: Intl.DateTimeFormatOptions = { month: '2-digit', day: '2-digit', weekday: 'short' };
  const dateString = now.toLocaleDateString('en-US', dateOptions).replace(',', '');
  
  // Animate the circle stroke
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="absolute inset-0 h-full flex flex-col items-center min-h-[100vh] bg-[#111113] p-6 pt-12 pb-32 overflow-y-auto">
      
      {/* Top Pill (Speed up charging equivalent -> Account Status) */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/20 px-6 py-2.5 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(255,100,0,0.15)] mb-12"
      >
        <span className="material-symbols-outlined text-green-500 text-lg">bolt</span>
        <span className="text-white text-sm font-medium">{t('status')}: {t(registry.Account_Status) || registry.Account_Status}</span>
      </motion.div>

      {/* Main Circular Gauge */}
      <div className="relative shrink-0 w-[280px] h-[280px] flex items-center justify-center mb-10">
        {/* Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-red-600/5 rounded-full blur-2xl"></div>

        {/* SVG Progress Circle */}
        <svg width="280" height="280" className="absolute inset-0 rotate-[-90deg]">
          {/* Background Track */}
          <circle 
            cx="140" cy="140" r={radius} 
            stroke="#222" strokeWidth="8" fill="none" 
          />
          {/* Progress Track */}
          <motion.circle 
            cx="140" cy="140" r={radius} 
            stroke="url(#gradient)" strokeWidth="8" fill="none" 
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4b2b" />
              <stop offset="100%" stopColor="#ff416c" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Content */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-green-500 text-3xl mb-1 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">bolt</span>
          <div className="flex items-baseline">
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-7xl font-bold text-white tracking-tighter"
            >
              {daysLeft}
            </motion.span>
          </div>
          <span className="text-white/70 text-lg mt-1 font-medium tracking-widest">{t('days').toUpperCase()}</span>
        </div>

        {/* Bottom Liquid Effect (Stylized as a glowing semi-circle at the bottom) */}
        <div className="absolute bottom-0 w-[200px] h-[80px] overflow-hidden rounded-b-[100px] z-0">
          <div className="w-[200px] h-[200px] bg-gradient-to-t from-red-500/40 to-orange-500/0 rounded-full blur-md"></div>
        </div>
      </div>

      {/* Greeting Text */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center shrink-0 mb-10 mt-2 z-10 relative"
      >
        <span className="text-white text-xl font-bold tracking-wide">{t('hi')} ... {registry.WhatsApp_Owner || 'User'}</span>
      </motion.div>

      {/* Date & Sub Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-[300px] grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center mb-12"
      >
        <div className="flex flex-col items-end pr-2">
          <span className="text-white text-2xl font-bold tracking-wider">{timeString}</span>
          <span className="text-white/50 text-xs">{dateString}</span>
        </div>
        
        <div className="w-px h-10 bg-white/10"></div>
        
        <div className="flex flex-col items-start pl-2">
          <span className="text-white text-xl font-medium">{t(registry.Package_Tier) || registry.Package_Tier}</span>
          <span className="text-white/50 text-xs">{t('plan_active')}</span>
        </div>
      </motion.div>

      {/* Profile Details Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-[320px] bg-[#1a1a1c] border border-white/5 rounded-3xl p-5 shadow-2xl"
      >
        <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">{t('profile_information')}</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
            <div>
              <div className="text-white text-sm font-medium">{registry.User_ID}</div>
              <div className="text-white/40 text-[10px] mt-0.5">{t('user_id')}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
              <span className="material-symbols-outlined text-xl">call</span>
            </div>
            <div>
              <div className="text-white text-sm font-medium">+{registry.WhatsApp_Owner}</div>
              <div className="text-white/40 text-[10px] mt-0.5">{t('connected_whatsapp')}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 border border-white/10">
              <span className="material-symbols-outlined text-xl">calendar_month</span>
            </div>
            <div>
              <div className="text-white text-sm font-medium">{registry.Expiry_Date}</div>
              <div className="text-white/40 text-[10px] mt-0.5">{t('valid_until')}</div>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
