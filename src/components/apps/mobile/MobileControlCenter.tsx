'use client';
import { useState } from 'react';
import type { ClientRegistry, BotConfig } from '@/lib/api';

interface ControlCenterProps {
  client: ClientRegistry;
  config: BotConfig;
  onToggle: (key: keyof BotConfig, value: boolean) => Promise<void>;
  onUpdateWelcomeText: (text: string) => Promise<void>;
  botStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SCAN_QR';
  qrCode: string | null;
  onStartBot: () => Promise<void>;
  onStopBot: () => Promise<void>;
}

export default function MobileControlCenter({
  client,
  config,
  onToggle,
  onUpdateWelcomeText,
  botStatus,
  qrCode,
  onStartBot,
  onStopBot
}: ControlCenterProps) {
  const safeConfig = config || {} as BotConfig;
  const [welcomeText, setWelcomeText] = useState(safeConfig.Custom_Welcome_Text || '');
  const [savingWelcome, setSavingWelcome] = useState(false);

  const handleSaveWelcome = async () => {
    setSavingWelcome(true);
    try {
      await onUpdateWelcomeText(welcomeText);
    } catch (e) {
      console.error(e);
    }
    setSavingWelcome(false);
  };

  const isBasic = client.Package_Tier === 'Basic';

  const TOGGLES = [
    { key: 'Anti_Link_Group', label: 'Anti-Link', desc: 'Otomatis hapus tautan di grup', icon: 'gpp_maybe' },
    { key: 'Welcome_Message_Status', label: 'Welcome Msg', desc: 'Sambut member baru otomatis', icon: 'waving_hand' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {/* Status Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-center mb-6">
          <div className="relative inline-block mb-3">
            <span className="material-symbols-outlined text-6xl text-blue-400">robot_2</span>
            {botStatus === 'ONLINE' && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-[#111113] rounded-full animate-pulse"></span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Engine Status</h2>
          <div className={`text-lg font-bold uppercase tracking-widest ${
            botStatus === 'ONLINE' ? 'text-green-500' :
            botStatus === 'CONNECTING' ? 'text-yellow-500' :
            botStatus === 'SCAN_QR' ? 'text-blue-500' :
            'text-red-500'
          }`}>
            {botStatus}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onStartBot}
              disabled={botStatus === 'ONLINE' || botStatus === 'CONNECTING'}
              className="flex-1 py-3 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">play_arrow</span> Start
            </button>
            <button
              onClick={onStopBot}
              disabled={botStatus === 'OFFLINE'}
              className="flex-1 py-3 rounded-full bg-red-500/20 text-red-500 font-bold border border-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">stop</span> Stop
            </button>
          </div>
        </div>

        {/* QR Code */}
        {botStatus === 'SCAN_QR' && qrCode && (
          <div className="bg-white p-6 rounded-3xl flex flex-col items-center justify-center mb-6">
            <h3 className="text-black font-bold mb-4 text-center">Scan QR Code ini menggunakan<br/>WhatsApp di HP target</h3>
            <img src={qrCode} alt="QR Code" className="w-full max-w-[250px] aspect-square" />
          </div>
        )}

        {/* Configurations */}
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Configurations</h3>
        <div className="space-y-3 mb-6">
          {TOGGLES.map(t => (
            <div key={t.key} className="p-4 rounded-3xl border border-white/5 bg-[#1a1a1c] shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                </div>
                <div>
                  <div className="font-bold text-white text-base">{t.label}</div>
                  <div className="text-xs text-white/50">{t.desc}</div>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!config[t.key as keyof BotConfig]}
                  onChange={(e) => onToggle(t.key as keyof BotConfig, e.target.checked)}
                />
                <div className="w-14 h-8 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/80 after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Welcome Message */}
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Welcome Message</h3>
        <div className="p-5 rounded-3xl border border-white/5 bg-[#1a1a1c] shadow-lg relative">
          {isBasic && (
            <div className="absolute inset-0 bg-[#1a1a1c]/80 backdrop-blur-sm z-10 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-yellow-500 mb-2">lock</span>
              <p className="text-white font-bold">Fitur Premium</p>
              <p className="text-white/50 text-xs mt-1">Upgrade paket untuk kustomisasi pesan welcome.</p>
            </div>
          )}
          <textarea
            value={welcomeText}
            onChange={(e) => setWelcomeText(e.target.value)}
            placeholder="Halo, selamat datang di grup..."
            className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-white resize-none outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSaveWelcome}
            disabled={savingWelcome}
            className="w-full mt-4 py-4 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">save</span>
            {savingWelcome ? 'Saving...' : 'Save Text'}
          </button>
        </div>
      </div>
    </div>
  );
}
