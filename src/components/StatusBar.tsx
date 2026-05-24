'use client';
import { useState, useEffect } from 'react';

interface StatusBarProps {
  botStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
  packageTier: string;
  userId: string;
}

export default function StatusBar({ botStatus, packageTier, userId }: StatusBarProps) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [cpuUsage, setCpuUsage] = useState('--');
  const [ramUsage, setRamUsage] = useState('--');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated system stats (in production, poll /api/system-stats)
  useEffect(() => {
    const updateStats = () => {
      setCpuUsage((Math.random() * 30 + 5).toFixed(0));
      setRamUsage((Math.random() * 20 + 40).toFixed(0));
    };
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor =
    botStatus === 'ONLINE' ? 'var(--neon-green)' :
    botStatus === 'CONNECTING' ? 'var(--neon-amber)' :
    'var(--neon-red)';

  return (
    <div
      className="fixed top-0 left-0 right-0 h-7 flex items-center justify-between px-4 text-[11px] font-mono select-none"
      style={{
        zIndex: 'var(--z-statusbar)',
        background: 'rgba(8, 8, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        animation: 'statusBarSlideDown 0.5s var(--ease-smooth) 0.2s both',
      }}
    >
      {/* Left: System Info */}
      <div className="flex items-center gap-4">
        <span className="font-black text-white tracking-tight text-[11px]">
          YAY
        </span>
        <span className="text-[8px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
          by netals
        </span>
        <span className="text-[var(--text-tertiary)]">|</span>
        <span className="text-[var(--text-secondary)] text-[10px]">
          {userId}
        </span>
        <span className="text-[var(--text-tertiary)]">•</span>
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-white font-semibold"
          style={{
            background: packageTier === 'Premium' ? 'linear-gradient(135deg, #a855f7, #6366f1)' :
                         packageTier === 'Standard' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' :
                         'linear-gradient(135deg, #6b7280, #4b5563)',
            fontSize: '9px'
          }}>
          {packageTier}
        </span>
      </div>

      {/* Center: Server Stats */}
      <div className="flex items-center gap-4 text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--neon-cyan)]">
            <rect x="1" y="11" width="3" height="5" rx="0.5"/>
            <rect x="5" y="8" width="3" height="8" rx="0.5"/>
            <rect x="9" y="4" width="3" height="12" rx="0.5"/>
            <rect x="13" y="1" width="3" height="15" rx="0.5" opacity="0.3"/>
          </svg>
          <span className="text-[10px]">CPU {cpuUsage}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--neon-purple)]">
            <rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="4" y="5" width={(isNaN(parseFloat(ramUsage)) ? 0 : parseFloat(ramUsage) / 100 * 8).toString()} height="6" rx="1"/>
          </svg>
          <span className="text-[10px]">RAM {ramUsage}%</span>
        </div>
      </div>

      {/* Right: Status + Clock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full" style={{
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: botStatus === 'ONLINE' ? 'glowPulse 2s infinite' : 'none'
          }} />
          <span className="text-[10px] font-semibold" style={{ color: statusColor }}>
            {botStatus}
          </span>
        </div>
        <span className="text-[var(--text-tertiary)]">|</span>
        <div className="text-right">
          <div className="text-[var(--text-secondary)] text-[10px]">{time}</div>
        </div>
        <span className="text-[var(--text-tertiary)] text-[10px]">{date}</span>
      </div>
    </div>
  );
}
