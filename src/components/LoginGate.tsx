'use client';
import { useState } from 'react';
import type { UserMasterData } from '@/lib/api';

interface LoginGateProps {
  onLoginSuccess: (data: UserMasterData, userId: string) => void;
}

export default function LoginGate({ onLoginSuccess }: LoginGateProps) {
  const [phone, setPhone] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleLogin = async () => {
    if (!phone || !licenseKey) {
      setError('Semua field wajib diisi.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { apiLogin } = await import('@/lib/api');
      const result = await apiLogin(phone, licenseKey);
      
      if (result.status === 'error') {
        setError(result.message || 'Login gagal. Periksa kembali kredensial Anda.');
        triggerShake();
      } else {
        // Backend returns `{ status: 'success', data: { registry, config, responders } }`
        // or just the master data directly depending on the API structure.
        const masterData = result.data || result;
        
        if (masterData && masterData.registry) {
          localStorage.setItem('yay_user_phone', phone);
          localStorage.setItem('yay_license_key', licenseKey);
          onLoginSuccess(masterData as UserMasterData, masterData.registry.User_ID);
        } else {
          setError('Data user tidak valid dari server.');
          triggerShake();
        }
      }
    } catch (err: any) {
      setError('Gagal menghubungi server API. Pastikan server nyala.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center"
      style={{ zIndex: 'var(--z-boot)', animation: 'desktopFadeIn 0.5s ease-out' }}>
      
      {/* Ambient background glow (subtle aurora for liquid glass effect) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: 'rgba(6,182,212,0.02)' }} />
      </div>

      <div
        className={`relative w-full max-w-[420px] mx-4 ${shake ? '' : ''}`}
        style={{ animation: shake ? 'shakeX 0.4s ease-out' : 'bootFadeIn 0.6s ease-out' }}
      >
        {/* Liquid Glass macOS 26 Card */}
        <div className="relative rounded-[2.5rem] p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,1)] overflow-hidden isolate border border-white/[0.08] bg-white/[0.02] backdrop-blur-[80px]">
          {/* Inner highlights for liquid depth */}
          <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] -z-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.04] to-transparent -z-10 pointer-events-none"></div>
          {/* Header */}
          <div className="text-center mb-8 flex flex-col items-center justify-center">
            <img src="/logo-white.png" alt="Logo" className="h-16 w-auto mb-4 opacity-95" />
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-[0.2em] font-medium mt-1">
              YAY by Netals
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.2em] font-semibold mb-2 block">
                WhatsApp Number
              </label>
              <input
                id="login-whatsapp"
                type="text"
                placeholder="628xxxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder:text-white/20 backdrop-blur-md shadow-inner"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.2em] font-semibold mb-2 block">
                License Key
              </label>
              <input
                id="login-license"
                type="password"
                placeholder="NTLS-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder:text-white/20 font-mono backdrop-blur-md shadow-inner"
              />
            </div>

            {error && (
              <div className="text-xs text-[var(--neon-red)] bg-[var(--neon-red)]/10 rounded-lg px-4 py-2.5 border border-[var(--neon-red)]/20">
                ⚠ {error}
              </div>
            )}

            <button
              id="login-submit"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white/90 hover:bg-white text-black rounded-xl py-4 font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              style={{ transform: loading ? 'scale(0.98)' : 'scale(1)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                    style={{ animation: 'spinSlow 0.6s linear infinite' }} />
                  Authenticating...
                </span>
              ) : (
                'LOGIN TO SYSTEM'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[10px] text-[var(--text-tertiary)] flex items-center justify-center gap-1.5 opacity-60">
          <img src="/logo-white.png" alt="Logo" className="h-3.5 w-auto" />
          <span>© 2026 — All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
