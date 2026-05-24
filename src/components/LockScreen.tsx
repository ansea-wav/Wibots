'use client';
import { useState } from 'react';

interface LockScreenProps {
  onUnlock: (newLicense: string) => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [licenseInput, setLicenseInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!licenseInput.trim()) {
      setError('Masukkan lisensi baru Anda.');
      return;
    }
    setLoading(true);
    setError('');

    // Simulate check
    await new Promise(r => setTimeout(r, 1500));
    setError('Lisensi tidak valid. Hubungi admin untuk mendapatkan lisensi baru.');
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 'var(--z-lockscreen)',
        background: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(30px)',
        animation: 'lockScreenBlur 0.8s ease-out forwards',
      }}
    >
      {/* Lock Modal — can't be dragged or closed */}
      <div
        className="w-full max-w-[460px] mx-4 rounded-2xl overflow-hidden border border-[var(--neon-red)]/20 shadow-2xl"
        style={{ background: 'rgba(15, 10, 15, 0.95)' }}
      >
        {/* Red Header Bar */}
        <div className="h-10 flex items-center px-4 gap-2"
          style={{ background: 'linear-gradient(135deg, rgba(255,59,92,0.2), rgba(255,59,92,0.05))' }}>
          <div className="w-3 h-3 rounded-full bg-[var(--neon-red)]"
            style={{ animation: 'glowPulse 1.5s infinite', boxShadow: '0 0 8px var(--neon-red)' }} />
          <span className="text-[11px] font-mono font-semibold text-[var(--neon-red)] tracking-wider">
            SYSTEM LOCKDOWN — ACCESS SUSPENDED
          </span>
        </div>

        <div className="p-8 text-center">
          {/* Lock Icon */}
          <div className="text-6xl mb-4" style={{ animation: 'floatSlow 3s ease-in-out infinite' }}>🔒</div>

          <h2 className="text-xl font-bold text-white mb-2">Akses Ditangguhkan</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed max-w-sm mx-auto">
            Masa sewa YAY Anda telah habis. Silakan hubungi admin atau masukkan lisensi baru
            untuk mengaktifkan kembali sistem Virtual Machine Anda.
          </p>

          {/* License Input */}
          <div className="max-w-sm mx-auto space-y-3">
            <input
              type="text"
              placeholder="Masukkan License Key baru..."
              value={licenseInput}
              onChange={e => setLicenseInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-[var(--surface-input)] border border-[var(--border-medium)] rounded-lg px-4 py-3 text-white text-sm text-center outline-none focus:border-[var(--neon-green)] transition-all font-mono placeholder:text-[var(--text-tertiary)]"
            />
            {error && (
              <div className="text-xs text-[var(--neon-red)] bg-[var(--neon-red)]/10 rounded-lg px-4 py-2 border border-[var(--neon-red)]/20">
                {error}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-white/10 hover:bg-white/15 text-white rounded-lg py-3 font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer border border-white/10"
            >
              {loading ? 'Memvalidasi...' : 'AKTIVASI ULANG'}
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 text-[10px] text-[var(--text-tertiary)]">
            Hubungi admin: <span className="text-[var(--neon-green)]">wa.me/628123456789</span>
          </div>
        </div>
      </div>
    </div>
  );
}
