'use client';
import { useState } from 'react';
import type { BotConfig } from '@/lib/api';

interface YAYAppProps {
  config: BotConfig;
  onToggle: (field: keyof BotConfig, value: boolean) => void;
}

export default function YAYApp({ config, onToggle }: YAYAppProps) {
  const safeConfig = config || {} as any;
  
  const modules = [
    {
      id: 'Module_Moderation',
      name: 'Group Moderation',
      desc: 'Fitur keamanan grup (!kick, !warn, !mute, !tagall)',
      icon: '🛡️',
      color: 'var(--neon-red)'
    },
    {
      id: 'Module_Utility',
      name: 'Fun & Utility',
      desc: 'Fitur sehari-hari (!say, !ai, !tts, !sticker)',
      icon: '🪄',
      color: 'var(--neon-cyan)'
    },
    {
      id: 'Module_Gamification',
      name: 'Gamification (Coming Soon)',
      desc: 'Sistem Leveling, XP, Daily Rewards, dan Giveaway',
      icon: '🎯',
      color: 'var(--neon-amber)'
    },
    {
      id: 'Module_Minigames',
      name: 'Minigames Hub (Coming Soon)',
      desc: 'Tebak Gambar, Werewolf, TicTacToe, RPG',
      icon: '🎮',
      color: 'var(--neon-purple)'
    }
  ];

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto" style={{ background: 'var(--surface-panel)' }}>
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>✨</span> YAY Core Engine
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Kelola modul-modul built-in dari YAY. Aktifkan modul yang grup Anda butuhkan.</p>
      </div>

      <div className="space-y-3">
        {modules.map((mod) => {
          // Hanya Moderation & Utility yang bisa di toggle untuk sekarang
          const isComingSoon = mod.id.includes('Gamification') || mod.id.includes('Minigames');
          const isActive = safeConfig[mod.id as keyof BotConfig] === true || safeConfig[mod.id as keyof BotConfig] === 'TRUE';
          
          return (
            <div key={mod.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] transition-all hover:border-[var(--border-medium)]"
              style={{ background: 'var(--surface-glass)', opacity: isComingSoon ? 0.6 : 1 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner" style={{ background: 'var(--surface-input)' }}>
                  {mod.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    {mod.name}
                    {isComingSoon && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold bg-white/10 text-white/70">
                        Dev
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{mod.desc}</div>
                </div>
              </div>
              
              {!isComingSoon && (
                <div
                  className={`toggle-track ${isActive ? 'active' : ''}`}
                  onClick={() => onToggle(mod.id as keyof BotConfig, !isActive)}
                  style={{ '--toggle-color': mod.color } as any}
                >
                  <div className="toggle-thumb" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 rounded-xl border border-[var(--neon-green)]/20 bg-[var(--neon-green)]/5 mt-4">
        <h3 className="text-xs font-bold text-[var(--neon-green)] mb-1">💡 Info AI terintegrasi!</h3>
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
          Modul <b>Fun & Utility</b> telah dilengkapi dengan <i>Gemini AI</i>! Member grup dapat memanggil bot dengan <code>!ai [tanya]</code> atau sekadar <i>me-reply</i> pesan bot untuk ngobrol pintar. Limit 50 chat/hari/grup.
        </p>
      </div>
    </div>
  );
}
