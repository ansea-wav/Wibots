'use client';
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function PricingPage() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden relative selection:bg-[var(--accent-primary)] selection:text-white pb-20">
      
      {/* BACKGROUND BLOBS / GLOW EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/15 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[80%] h-[30%] bg-[var(--accent-primary)]/10 rounded-full blur-[120px] mix-blend-screen"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>
      </div>

      {/* HEADER NAVIGATION */}
      <header className="relative z-10 pt-16 md:pt-8 pb-4 px-4 md:px-6 max-w-7xl mx-auto flex justify-center items-center">
        <nav className="flex items-center gap-5 md:gap-8 bg-white/5 border border-white/10 px-6 md:px-8 py-3 rounded-full backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <Link href="/" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm font-medium">{t('nav_home')}</Link>
          <Link href="/pricing" className="text-white font-semibold text-xs md:text-sm relative">
            {t('nav_pricing')}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-white rounded-full shadow-[0_0_8px_white]"></span>
          </Link>
          <Link href="/download" className="text-white/60 hover:text-white transition-colors text-xs md:text-sm font-medium">{t('nav_download')}</Link>
        </nav>
        {/* Language Switcher */}
        <div className="absolute top-4 right-4 md:top-8 md:right-6">
          <div className="relative flex items-center bg-white/10 hover:bg-white/20 transition border border-white/20 rounded-full backdrop-blur-md shadow-lg pr-2">
            <span className="material-symbols-outlined text-[14px] text-white pl-3 pointer-events-none absolute">language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="appearance-none bg-transparent text-white text-xs font-bold py-1.5 pl-8 pr-4 outline-none cursor-pointer"
            >
              <option value="en" className="text-black">EN</option>
              <option value="id" className="text-black">ID</option>
              <option value="jv" className="text-black">Basa Jawa</option>
              <option value="su" className="text-black">Basa Sunda</option>
              <option value="th" className="text-black">ภาษาไทย</option>
              <option value="zh" className="text-black">中文</option>
              <option value="ko" className="text-black">한국어</option>
            </select>
            <span className="material-symbols-outlined text-[12px] text-white pointer-events-none absolute right-2">expand_more</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 flex flex-col items-center">
        
        {/* HERO TITLE */}
        <div className="text-center mb-20 relative">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-4 py-2 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/30 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            {t('pricing_title')}
          </h1>
          <p className="text-xl md:text-2xl text-white/50 font-medium max-w-2xl mx-auto">
            {t('pricing_subtitle')}
          </p>
        </div>

        {/* PRICING CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full mb-24 relative">
          
          {/* FREE PLAN */}
          <PricingCard 
            title="Free"
            price={language === 'id' ? 'Gratis' : 'Free'}
            period=""
            description={t('plan_free_desc')}
            features={[
              t('feat_1_resp'),
              t('feat_no_upload'),
              t('feat_few_services'),
              t('feat_1_group')
            ]}
            buttonText={t('btn_choose_free')}
            variant="default"
          />

          {/* BASIC PLAN */}
          <PricingCard 
            title="Basic"
            price={language === 'id' ? 'Rp 2.000' : '2.000 IDR'}
            period={t('per_month')}
            description={t('plan_basic_desc')}
            features={[
              t('feat_5_resp'),
              t('feat_500kb_upload'),
              t('feat_50mb_storage'),
              t('feat_1_group'),
              t('feat_basic_support')
            ]}
            buttonText={t('btn_choose_basic')}
            variant="default"
          />

          {/* STANDARD PLAN */}
          <PricingCard 
            title="Standard"
            price={language === 'id' ? 'Rp 5.000' : '5.000 IDR'}
            period={t('per_month')}
            description={t('plan_standard_desc')}
            features={[
              t('feat_25_resp'),
              t('feat_5mb_upload'),
              t('feat_500mb_storage'),
              t('feat_2_group'),
              t('feat_247_support')
            ]}
            buttonText={t('btn_choose_standard')}
            variant="popular"
          />

          {/* PREMIUM PLAN */}
          <PricingCard 
            title="Premium"
            price={language === 'id' ? 'Rp 20.000' : '20.000 IDR'}
            period={t('per_month')}
            description={t('plan_premium_desc')}
            features={[
              t('feat_100_resp'),
              t('feat_15mb_upload'),
              t('feat_1000mb_storage'),
              t('feat_5_group'),
              t('feat_247_support')
            ]}
            buttonText={t('btn_choose_premium')}
            variant="premium"
          />

        </div>

        {/* CUSTOM BILLING SECTION */}
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-12 rounded-[40px] bg-white/[0.02] border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl relative overflow-hidden mb-16 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50"></div>
          
          <h2 className="text-3xl font-bold text-white mb-4">{t('custom_billing_title')}</h2>
          <p className="text-white/50 mb-8 max-w-xl">
            {t('custom_billing_desc')}
          </p>
          
          {/* WHATSAPP CONTACT */}
          <a 
            href="https://wa.me/62882008677172?text=Halo%20Wazle,%20saya%20tertarik%20dengan%20Custom%20Billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm transition-transform hover:scale-105 hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            {t('btn_contact_wa')}
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 ring-offset-2 ring-offset-black scale-100 group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
          </a>
        </div>

        {/* FOOTER NOTE */}
        <p className="text-white/30 text-xs font-medium tracking-wide mb-10 flex items-center gap-2 text-center max-w-2xl text-balance">
          <span className="material-symbols-outlined text-[14px] flex-shrink-0">info</span>
          {t('footer_storage_note')}
        </p>

      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               PRICING CARD                                 */
/* -------------------------------------------------------------------------- */

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  variant: 'default' | 'popular' | 'premium';
}

function PricingCard({ title, price, period, description, features, buttonText, variant }: PricingCardProps) {
  const isHighlighted = variant === 'popular' || variant === 'premium';
  
  return (
    <div 
      className={`group relative flex flex-col p-8 rounded-[32px] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2
        ${variant === 'default' ? 'bg-[#111115]/80 border border-white/5 shadow-2xl hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]' : ''}
        ${variant === 'popular' ? 'bg-[#111115]/90 border border-[var(--accent-primary)]/50 shadow-[0_20px_50px_rgba(59,130,246,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_30px_60px_rgba(59,130,246,0.3)] hover:border-[var(--accent-primary)]' : ''}
        ${variant === 'premium' ? 'bg-[#111115]/90 border border-blue-400/50 shadow-[0_20px_50px_rgba(96,165,250,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:shadow-[0_30px_60px_rgba(96,165,250,0.3)] hover:border-blue-400' : ''}
      `}
    >
      {/* Decorative Glow for Highlights */}
      {isHighlighted && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-1 rounded-full blur-[2px] ${variant === 'popular' ? 'bg-[var(--accent-primary)]' : 'bg-blue-400'}`}></div>
      )}

      {/* Plan Title */}
      <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
      
      {/* Price */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-4xl font-black text-white tracking-tight">{price}</span>
        {price !== 'Rp 0' && <span className="text-white/50 text-sm font-medium">{period}</span>}
      </div>
      
      {/* Description */}
      <p className="text-white/50 text-sm mb-8 leading-relaxed min-h-[40px]">
        {description}
      </p>

      {/* Features List */}
      <ul className="flex flex-col gap-4 mb-10 flex-grow">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-white/80">
            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isHighlighted ? (variant === 'popular' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-blue-400/20 text-blue-400') : 'bg-white/10 text-white/60'}`}>
              <span className="material-symbols-outlined text-[12px] font-bold">check</span>
            </div>
            <span className="leading-tight">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Action Button */}
      <a 
        href={`https://wa.me/62882008677172?text=Halo%20Wazle,%20saya%20mau%20pesan%20paket%20${title}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center
          ${isHighlighted 
            ? 'bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]' 
            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
          }
        `}
      >
        {buttonText}
      </a>

    </div>
  );
}
