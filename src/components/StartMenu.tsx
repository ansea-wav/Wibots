'use client';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  onOpenThemeSettings: () => void;
  onOpenTaskManager: () => void;
  onOpenSubscription: () => void;
  pinnedApps: { id: string; name: string; icon: string }[];
  currentTheme: string;
  themes: { id: string; name: string; icon: string; description: string }[];
  onThemeChange: (themeId: string) => void;
}

export default function StartMenu({
  isOpen,
  onClose,
  onOpenApp,
  onOpenTaskManager,
  onOpenSubscription,
  pinnedApps,
  currentTheme,
  themes,
  onThemeChange,
}: StartMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showThemes, setShowThemes] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'es', name: 'Español' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ms', name: 'Bahasa Malaysia' },
    { code: 'fil', name: 'Filipino' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
  ];

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  // Close themes when menu closes
  useEffect(() => {
    if (!isOpen) {
      setShowThemes(false);
      setShowLanguages(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bottom-[72px] right-3 w-[320px] max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl flex flex-col"
      style={{
        zIndex: 9500,
        background: 'var(--surface-panel)',
        backdropFilter: 'blur(40px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.6)',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 16px 64px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)',
        animation: 'startMenuOpen 0.25s var(--ease-spring) forwards',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-black tracking-tight text-white">YAY</span>
          <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-[0.15em] font-medium mt-1">{t('menu')}</span>
        </div>
      </div>

      {/* Pinned Apps */}
      <div className="px-4 pb-3">
        <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-[0.2em] font-semibold mb-2 px-1">
          {t('pinned_apps')}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {pinnedApps.map((app) => (
            <button
              key={app.id}
              onClick={() => { onOpenApp(app.id); onClose(); }}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer active:scale-95"
            >
              <span className="text-xl h-6 flex items-center justify-center text-white">
                {app.icon.startsWith('fi ') ? (
                  <i className={`${app.icon} text-[16px]`}></i>
                ) : (
                  app.icon
                )}
              </span>
              <span className="text-[9px] text-[var(--text-secondary)] truncate w-full text-center">{app.name.split('.')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border-subtle)] mx-4" />

      {/* Quick Actions */}
      <div className="p-2">
        {/* Theme Selector */}
        <button
          onClick={() => { setShowThemes(!showThemes); setShowLanguages(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer text-left"
        >
          <span className="text-base flex items-center justify-center text-[var(--neon-green)] w-5 h-5"><i className="fi fi-rr-palette text-sm"></i></span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white">{t('appearance')}</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              {t('theme')}: {themes.find(t => t.id === currentTheme)?.name || 'Glass'}
            </div>
          </div>
          <svg className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform ${showThemes ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5L6 8L9 5" />
          </svg>
        </button>

        {/* Theme Options (Expandable) */}
        {showThemes && (
          <div className="px-2 pb-1 space-y-0.5"
            style={{ animation: 'bootFadeIn 0.2s ease-out' }}>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => { onThemeChange(t.id); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  currentTheme === t.id
                    ? 'bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span className="text-sm h-5 w-5 flex items-center justify-center text-white">
                  {t.icon.startsWith('fi ') ? (
                    <i className={`${t.icon} text-xs`}></i>
                  ) : (
                    t.icon
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium ${currentTheme === t.id ? 'text-[var(--neon-green)]' : 'text-white'}`}>
                    {t.name}
                  </div>
                  <div className="text-[9px] text-[var(--text-tertiary)]">{t.description}</div>
                </div>
                {currentTheme === t.id && (
                  <span className="text-[var(--neon-green)] text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Language Selector */}
        <button
          onClick={() => { setShowLanguages(!showLanguages); setShowThemes(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer text-left"
        >
          <span className="text-base flex items-center justify-center text-[var(--neon-blue)] w-5 h-5"><i className="fi fi-rr-globe text-sm"></i></span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white">Language</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">
              {LANGUAGES.find(l => l.code === language)?.name}
            </div>
          </div>
          <svg className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform ${showLanguages ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 5L6 8L9 5" />
          </svg>
        </button>

        {/* Language Options */}
        {showLanguages && (
          <div className="px-2 pb-1 space-y-0.5" style={{ animation: 'bootFadeIn 0.2s ease-out' }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  language === l.code
                    ? 'bg-[var(--neon-blue)]/10 border border-[var(--neon-blue)]/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium ${language === l.code ? 'text-[var(--neon-blue)]' : 'text-white'}`}>
                    {l.name}
                  </div>
                </div>
                {language === l.code && <span className="text-[var(--neon-blue)] text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-[var(--border-subtle)] mx-2 my-1" />

        {/* Task Manager */}
        <button
          onClick={() => { onOpenTaskManager(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer text-left"
        >
          <span className="text-base flex items-center justify-center text-[var(--neon-cyan)] w-5 h-5"><i className="fi fi-rr-chart-histogram text-sm"></i></span>
          <div className="flex-1">
            <div className="text-xs font-medium text-white">{t('task_manager')}</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">{t('monitor_processes')}</div>
          </div>
        </button>

        {/* Subscription */}
        <button
          onClick={() => { onOpenSubscription(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer text-left"
        >
          <span className="text-base flex items-center justify-center text-[var(--neon-purple)] w-5 h-5"><i className="fi fi-rr-gem text-sm"></i></span>
          <div className="flex-1">
            <div className="text-xs font-medium text-white">{t('subscription')}</div>
            <div className="text-[10px] text-[var(--text-tertiary)]">{t('extend_plan')}</div>
          </div>
        </button>

        {/* Log out */}
        <button
          onClick={() => {
            localStorage.removeItem('yay_user_phone');
            localStorage.removeItem('yay_license_key');
            window.location.reload();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--neon-red)]/10 transition-all cursor-pointer text-left group mt-2 border border-transparent hover:border-[var(--neon-red)]/30"
        >
          <span className="text-base flex items-center justify-center text-[var(--neon-red)] w-5 h-5"><i className="fi fi-rr-exit text-sm"></i></span>
          <div className="flex-1">
            <div className="text-xs font-medium text-[var(--neon-red)]">{t('log_out')}</div>
            <div className="text-[10px] text-[var(--neon-red)]/50">{t('sign_out')}</div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="h-px bg-[var(--border-subtle)]" />
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white tracking-tight">YAY</span>
          <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider">by netals</span>
        </div>
        <span className="text-[9px] text-[var(--text-tertiary)] font-mono">v2.0</span>
      </div>
    </div>
  );
}
