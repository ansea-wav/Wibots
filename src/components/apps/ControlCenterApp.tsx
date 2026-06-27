'use client';
import { useState } from 'react';
import type { BotConfig, ClientRegistry } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
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

  const toggleItems: { key: keyof BotConfig | string; label: string; desc: string; icon: string }[] = [
    {
      key: 'Anti_Link_Group',
      label: t('anti_link'),
      desc: t('anti_link_desc'),
      icon: '🛡️',
    },
    {
      key: 'Welcome_Message_Status',
      label: t('welcome_msg'),
      desc: t('welcome_msg_desc'),
      icon: '👋',
    },
    {
      key: 'Cmd_SetDel_Status',
      label: t('cmd_setdel'),
      desc: t('cmd_setdel_desc'),
      icon: '⚙️',
    },
    {
      key: 'Cmd_Hidetag_Status',
      label: t('cmd_hidetag'),
      desc: t('cmd_hidetag_desc'),
      icon: '📢',
    },
    {
      key: 'Cmd_Stiker_Status',
      label: t('cmd_stiker'),
      desc: t('cmd_stiker_desc'),
      icon: '🖼️',
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
      
      {/* Bot Power Section - Admin Only */}
      {client.Package_Tier === 'God' ? (
        <div className="bg-[#fdfcf7] border border-zinc-200/60 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-zinc-100 border border-zinc-200/50">
                {botStatus === 'ONLINE' ? '⚡' : '🔌'}
              </div>
              <div>
                <div className="text-sm font-black text-zinc-950">Master Bot Engine</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${botStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{botStatus}</span>
                </div>
              </div>
            </div>
            <button
              onClick={botStatus === 'ONLINE' ? onStopBot : onStartBot}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                botStatus === 'ONLINE' 
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' 
                  : 'bg-zinc-950 hover:bg-zinc-900 text-white border-zinc-800'
              }`}
            >
              {botStatus === 'ONLINE' ? '■ Stop' : '▶ Start'}
            </button>
          </div>
          
          {/* Master QR Code Scanner */}
          {botStatus === 'SCAN_QR' && qrCode && (
            <div className="flex flex-col items-center justify-center py-4 border-t border-zinc-200/40">
              <div className="bg-white p-4 rounded-2xl border border-zinc-200/50 shadow-sm mb-3">
                <QRCodeSVG value={qrCode} size={180} />
              </div>
              <p className="text-xs text-zinc-800 font-bold">Scan QR Code dengan WhatsApp Anda</p>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Bot akan terhubung secara otomatis setelah di-scan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#fdfcf7] border border-zinc-200/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-zinc-100 border border-zinc-200/50">
              {botStatus === 'ONLINE' ? '⚡' : '🔌'}
            </div>
            <div>
              <div className="text-sm font-black text-zinc-950">Bot Induk (Server)</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${botStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  {botStatus === 'ONLINE' ? 'ACTIVE & RUNNING' : 'SYSTEM OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Toggles Card */}
      <div className="bg-[#fdfcf7] border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="text-xs text-zinc-400 uppercase tracking-widest font-black mb-1">
          Feature Switches
        </div>
        <div className="divide-y divide-zinc-200/40">
          {toggleItems.map((item) => {
            const isActive = Boolean(safeConfig[item.key as keyof BotConfig]);
            return (
              <div
                key={item.key}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-950">{item.label}</div>
                    <div className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">{item.desc}</div>
                  </div>
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
            );
          })}
        </div>
      </div>

      {/* Custom Welcome Text Card */}
      {safeConfig.Welcome_Message_Status && (
        <div className="bg-[#fdfcf7] border border-zinc-200/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-black">
            Welcome Message Template
          </div>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
            Gunakan kode <code className="bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900 font-bold text-[9px]">{'{member}'}</code> untuk nama member dan <code className="bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900 font-bold text-[9px]">{'{group}'}</code> untuk nama grup.
          </p>
          <textarea
            value={welcomeText}
            onChange={e => setWelcomeText(e.target.value)}
            rows={3}
            className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-zinc-900 text-sm outline-none focus:border-zinc-500 transition-all resize-none placeholder:text-zinc-400"
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
