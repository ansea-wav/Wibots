'use client';
import { useState } from 'react';
import type { BotConfig, ClientRegistry } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

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

  const toggleItems: { key: keyof BotConfig | string; label: string; desc: string; icon: string }[] = [
    {
      key: 'Anti_Link_Group',
      label: 'Anti-Link Protection',
      desc: 'Otomatis hapus tautan di grup',
      icon: '🛡️',
    },
    {
      key: 'Welcome_Message_Status',
      label: 'Welcome Message',
      desc: 'Kirim sambutan otomatis untuk member baru',
      icon: '👋',
    },
  ];

  const handleSaveWelcome = () => {
    onUpdateWelcomeText(welcomeText);
    setSavedWelcome(true);
    setTimeout(() => setSavedWelcome(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto" style={{ background: 'var(--surface-panel)' }}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Control Center</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Real-time bot configuration switches</p>
      </div>

      {/* Bot Power Section - Admin Only */}
      {client.Package_Tier === 'God' ? (
        <div className="rounded-xl border border-[var(--border-subtle)] p-4 space-y-4" style={{ background: 'var(--surface-glass)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{
                  background: botStatus === 'ONLINE' ? 'rgba(57,255,20,0.1)' : 'rgba(255,59,92,0.1)',
                  border: `1px solid ${botStatus === 'ONLINE' ? 'rgba(57,255,20,0.2)' : 'rgba(255,59,92,0.2)'}`,
                }}>
                {botStatus === 'ONLINE' ? '⚡' : '🔌'}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Master Bot Engine</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-[6px] h-[6px] rounded-full"
                    style={{
                      background: botStatus === 'ONLINE' ? 'var(--neon-green)' :
                                  botStatus === 'CONNECTING' ? 'var(--neon-amber)' : 
                                  botStatus === 'SCAN_QR' ? 'var(--neon-cyan)' : 'var(--neon-red)',
                      boxShadow: botStatus === 'ONLINE' ? '0 0 6px var(--neon-green)' : 'none',
                    }} />
                  <span className="text-[10px] text-[var(--text-secondary)]">{botStatus}</span>
                </div>
              </div>
            </div>
            <button
              onClick={botStatus === 'ONLINE' ? onStopBot : onStartBot}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: botStatus === 'ONLINE' ? 'rgba(255,59,92,0.15)' : 'rgba(57,255,20,0.15)',
                color: botStatus === 'ONLINE' ? 'var(--neon-red)' : 'var(--neon-green)',
                border: `1px solid ${botStatus === 'ONLINE' ? 'rgba(255,59,92,0.2)' : 'rgba(57,255,20,0.2)'}`,
              }}
            >
              {botStatus === 'ONLINE' ? '■ Stop' : '▶ Start'}
            </button>
          </div>
          
          {/* Master QR Code Scanner */}
          {botStatus === 'SCAN_QR' && qrCode && (
            <div className="flex flex-col items-center justify-center py-4 border-t border-[var(--border-subtle)]">
              <div className="bg-white p-4 rounded-xl shadow-lg mb-3">
                <QRCodeSVG value={qrCode} size={180} />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] font-semibold">Scan QR Code dengan WhatsApp Anda</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">Bot akan terhubung secara otomatis setelah di-scan.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)] p-4" style={{ background: 'var(--surface-glass)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: botStatus === 'ONLINE' ? 'rgba(57,255,20,0.1)' : 'rgba(255,59,92,0.1)',
                border: `1px solid ${botStatus === 'ONLINE' ? 'rgba(57,255,20,0.2)' : 'rgba(255,59,92,0.2)'}`,
              }}>
              {botStatus === 'ONLINE' ? '⚡' : '🔌'}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Bot Induk (Server)</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-[6px] h-[6px] rounded-full"
                  style={{
                    background: botStatus === 'ONLINE' ? 'var(--neon-green)' : 'var(--neon-red)',
                    boxShadow: botStatus === 'ONLINE' ? '0 0 6px var(--neon-green)' : 'none',
                  }} />
                <span className="text-[10px] text-[var(--text-secondary)]">{botStatus === 'ONLINE' ? 'ACTIVE & RUNNING' : 'SYSTEM OFFLINE'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="space-y-2">
        <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-3">
          Feature Switches
        </div>
        {toggleItems.map((item) => {
          const isActive = Boolean(safeConfig[item.key as keyof BotConfig]);
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] transition-all hover:border-[var(--border-medium)]"
              style={{ background: 'var(--surface-glass)' }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] truncate">{item.desc}</div>
                </div>
              </div>
              <div
                className={`toggle-track ${isActive ? 'active' : ''}`}
                onClick={() => onToggle(item.key as keyof BotConfig, !isActive)}
              >
                <div className="toggle-thumb" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Welcome Text */}
      {safeConfig.Welcome_Message_Status && (
        <div className="rounded-xl border border-[var(--border-subtle)] p-4 space-y-3"
          style={{ background: 'var(--surface-glass)' }}>
          <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
            Welcome Message Template
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            Gunakan <code className="bg-white/5 px-1 rounded text-[var(--neon-green)]">{'{member}'}</code> untuk nama dan <code className="bg-white/5 px-1 rounded text-[var(--neon-green)]">{'{group}'}</code> untuk grup.
          </p>
          <textarea
            value={welcomeText}
            onChange={e => setWelcomeText(e.target.value)}
            rows={3}
            className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-[var(--neon-green)] transition-all resize-none placeholder:text-[var(--text-tertiary)]"
            placeholder="Selamat datang {member} di {group}! 🎉"
          />
          <button
            onClick={handleSaveWelcome}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--neon-green)]/15 text-[var(--neon-green)] border border-[var(--neon-green)]/20 transition-all cursor-pointer hover:bg-[var(--neon-green)]/25"
          >
            {savedWelcome ? '✓ Saved!' : 'Save Template'}
          </button>
        </div>
      )}
    </div>
  );
}
