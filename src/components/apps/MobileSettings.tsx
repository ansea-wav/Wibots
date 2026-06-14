"use client";

import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';

export default function MobileSettings() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, themes } = useTheme();

  const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'jv', name: 'Basa Jawa' },
    { code: 'su', name: 'Basa Sunda' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('yay_user_phone');
    localStorage.removeItem('yay_license_key');
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-[#111113] p-6 pb-24 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">{t('settings')}</h2>

      <div className="space-y-6">
        
        {/* Language Section */}
        <div className="bg-[#1a1a1c] border border-white/5 rounded-2xl p-4 shadow-lg">
          <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">{t('language')}</h3>
          <div className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  language === l.code 
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                    : 'bg-white/[0.02] border border-transparent text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">language</span>
                  <span className="text-sm font-medium">{l.name}</span>
                </div>
                {language === l.code && <span className="material-symbols-outlined text-lg">check</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-[#1a1a1c] border border-white/5 rounded-2xl p-4 shadow-lg">
          <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-4">{t('appearance')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {themes.filter(t => t.id === 'liquid-glass' || t.id === 'oled').map((t_item) => (
              <button
                key={t_item.id}
                onClick={() => setTheme(t_item.id as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  theme === t_item.id
                    ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                    : 'bg-white/[0.02] border border-transparent text-white/70 hover:bg-white/[0.05]'
                }`}
              >
                <span className="material-symbols-outlined text-3xl mb-2">
                  {t_item.id === 'glass' ? 'web' : 
                   t_item.id === 'liquid-glass' ? 'water_drop' : 
                   t_item.id === 'mono' ? 'contrast' : 'dark_mode'}
                </span>
                <span className="text-xs font-medium">{t_item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout Section */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold mt-8 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        >
          <span className="material-symbols-outlined">logout</span>
          {t('log_out')}
        </button>

      </div>
    </div>
  );
}
