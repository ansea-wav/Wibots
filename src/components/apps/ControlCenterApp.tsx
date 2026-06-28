'use client';
import { useState } from 'react';
import type { BotConfig, ClientRegistry } from '@/lib/api';
import { toast } from '@/components/DynamicIsland';
import { useLanguage } from '@/lib/LanguageContext';

interface ControlCenterProps {
  client: ClientRegistry;
  config: BotConfig;
  onToggle: (field: keyof BotConfig, value: boolean) => void;
  onUpdateWelcomeText: (text: string) => void;
  botStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SCAN_QR';
  qrCode: string | null;
  onStartBot: () => void;
  onStopBot: () => void;
}

export default function ControlCenterApp({
  client,
  config,
  onToggle,
  onUpdateWelcomeText,
  botStatus,
  qrCode,
  onStartBot,
  onStopBot,
}: ControlCenterProps) {
  const safeConfig = config || {} as BotConfig;
  const [welcomeText, setWelcomeText] = useState(safeConfig.Custom_Welcome_Text || '');
  const [savedWelcome, setSavedWelcome] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const toggleItems = [
    {
      key: 'Anti_Link_Group',
      label: t('anti_link'),
      desc: t('anti_link_desc'),
      icon: 'shield',
      accentColor: 'border-zinc-950 shadow-[4px_4px_0px_#09090b]',
    },
    {
      key: 'Welcome_Message_Status',
      label: t('welcome_msg'),
      desc: t('welcome_msg_desc'),
      icon: 'chat_bubble',
      accentColor: 'border-zinc-950 shadow-[4px_4px_0px_#09090b]',
    },
    {
      key: 'Cmd_SetDel_Status',
      label: t('cmd_setdel'),
      desc: t('cmd_setdel_desc'),
      icon: 'tune',
      accentColor: 'border-zinc-950 shadow-[4px_4px_0px_#09090b]',
    },
    {
      key: 'Cmd_Hidetag_Status',
      label: t('cmd_hidetag'),
      desc: t('cmd_hidetag_desc'),
      icon: 'campaign',
      accentColor: 'border-zinc-950 shadow-[4px_4px_0px_#09090b]',
    },
    {
      key: 'Cmd_Stiker_Status',
      label: t('cmd_stiker'),
      desc: t('cmd_stiker_desc'),
      icon: 'image',
      accentColor: 'border-zinc-950 shadow-[4px_4px_0px_#09090b]',
    },
  ];

  const gameToggleItems = [
    {
      key: 'Game_Tebak_Kata_Status',
      label: 'Tebak Kata',
      desc: 'Tebak kata rahasia berdasarkan petunjuk kata.',
      icon: 'extension',
      accentColor: 'border-emerald-600 shadow-[4px_4px_0px_#059669]',
    },
    {
      key: 'Game_Tebak_Boom_Status',
      label: 'Tebak Boom',
      desc: 'Game tebak posisi bom koordinat rahasia.',
      icon: 'target',
      accentColor: 'border-rose-600 shadow-[4px_4px_0px_#e11d48]',
    },
    {
      key: 'Game_Tebak_Bendera_Status',
      label: 'Tebak Bendera',
      desc: 'Tebak nama negara dari gambar bendera.',
      icon: 'flag',
      accentColor: 'border-sky-600 shadow-[4px_4px_0px_#0284c7]',
    },
    {
      key: 'Game_Tebak_Negara_Status',
      label: 'Tebak Negara',
      desc: 'Tebak nama ibu kota atau letak negara.',
      icon: 'map',
      accentColor: 'border-amber-600 shadow-[4px_4px_0px_#d97706]',
    },
    {
      key: 'Game_Tebak_Landmark_Status',
      label: 'Tebak Landmark',
      desc: 'Tebak nama tempat bersejarah atau ikon dunia.',
      icon: 'account_balance',
      accentColor: 'border-purple-600 shadow-[4px_4px_0px_#9333ea]',
    },
    {
      key: 'Game_Tebak_Kucing_Status',
      label: 'Tebak Kucing',
      desc: 'Tebak nama ras kucing dari gambar yang muncul.',
      icon: 'pets',
      accentColor: 'border-pink-600 shadow-[4px_4px_0px_#db2777]',
    },
    {
      key: 'Game_Tebak_Anjing_Status',
      label: 'Tebak Anjing',
      desc: 'Tebak nama ras anjing berdasarkan foto.',
      icon: 'yard',
      accentColor: 'border-orange-600 shadow-[4px_4px_0px_#ea580c]',
    },
    {
      key: 'Game_Tebak_Game_Status',
      label: 'Tebak Game',
      desc: 'Tebak judul game populer dari potongan gambar.',
      icon: 'sports_esports',
      accentColor: 'border-indigo-600 shadow-[4px_4px_0px_#4f46e5]',
    },
    {
      key: 'Game_Tebak_Logo_Status',
      label: 'Tebak Logo',
      desc: 'Tebak merek atau instansi dari logo gambar.',
      icon: 'branding_watermark',
      accentColor: 'border-teal-600 shadow-[4px_4px_0px_#0d9488]',
    },
  ];

  const handleSaveWelcome = () => {
    setIsSaving(true);
    onUpdateWelcomeText(welcomeText);
    setTimeout(() => {
      setIsSaving(false);
      toast(t('toast_welcome_saved'), 'success');
    }, 1500);
    setSavedWelcome(true);
    setTimeout(() => setSavedWelcome(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      
      {/* Title */}
      <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-3">
        Feature Switches
      </div>

      {/* Grid of small cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {toggleItems.map((item) => {
          const isActive = Boolean(safeConfig[item.key as keyof BotConfig]);
          return (
            <div
              key={item.key}
              className={`bg-[#fdfcf7] border-2 rounded-[1.8rem] p-5 flex flex-col justify-between h-40 ${item.accentColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 border border-zinc-200/50 text-zinc-800">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
                
                <div
                  className={`custom-toggle-track ${isActive ? 'active' : ''} shrink-0`}
                  onClick={() => {
                    onToggle(item.key as keyof BotConfig, !isActive);
                    toast(t('toast_settings_updated').replace('{label}', t(item.label) || item.label), 'success');
                  }}
                >
                  <div className="custom-toggle-thumb" />
                </div>
              </div>
              
              <div className="mt-2">
                <div className="text-sm font-black text-zinc-950 line-clamp-1">{item.label}</div>
                <div className="text-[10px] text-zinc-500 font-semibold line-clamp-2 mt-1 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Welcome Text Card */}
      {safeConfig.Welcome_Message_Status && (
        <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-4">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-black">
            Welcome Message Template
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
            Gunakan kode <code className="bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900 font-bold text-[9px]">{'{member}'}</code> untuk nama member dan <code className="bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900 font-bold text-[9px]">{'{group}'}</code> untuk nama grup.
          </p>
          <textarea
            value={welcomeText}
            onChange={e => setWelcomeText(e.target.value)}
            rows={3}
            className="w-full bg-zinc-50 border border-zinc-300 rounded-2xl px-4 py-3 text-zinc-950 text-sm outline-none focus:border-zinc-950 transition-all resize-none placeholder:text-zinc-400"
            placeholder="Selamat datang {member} di {group}! 🎉"
          />
          <button
            onClick={handleSaveWelcome}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-zinc-950 hover:bg-zinc-900 text-white transition-all shadow-sm cursor-pointer"
          >
            {savedWelcome ? '✓ Saved!' : 'Save Template'}
          </button>
        </div>
      )}

      {/* Game Control Section */}
      <div className="pt-4">
        <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-3">
          Game Configuration Panel
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gameToggleItems.map((item) => {
            const isActive = Boolean(safeConfig[item.key as keyof BotConfig]);
            return (
              <div
                key={item.key}
                className={`bg-[#fdfcf7] border-2 rounded-[1.8rem] p-5 flex flex-col justify-between h-40 ${item.accentColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 border border-zinc-200/50 text-zinc-800">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  
                  <div
                    className={`custom-toggle-track ${isActive ? 'active' : ''} shrink-0`}
                    onClick={() => {
                      onToggle(item.key as keyof BotConfig, !isActive);
                      toast(`${item.label} ${isActive ? 'dinonaktifkan' : 'diaktifkan'}!`, 'success');
                    }}
                  >
                    <div className="custom-toggle-thumb" />
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="text-sm font-black text-zinc-950 line-clamp-1">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 font-semibold line-clamp-2 mt-1 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local style overrides for monochrome switches */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-toggle-track {
          width: 44px;
          height: 24px;
          background-color: #e4e4e7;
          border-radius: 9999px;
          padding: 2px;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }
        .custom-toggle-track.active {
          background-color: #09090b;
        }
        .custom-toggle-thumb {
          width: 20px;
          height: 20px;
          background-color: #ffffff;
          border-radius: 9999px;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .custom-toggle-track.active .custom-toggle-thumb {
          transform: translateX(20px);
        }
      `}} />
    </div>
  );
}
