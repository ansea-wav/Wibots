'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserMasterData } from '@/lib/api';

interface MobileLoginProps {
  onLoginSuccess: (data: UserMasterData, userId: string) => void;
}

export default function MobileLogin({ onLoginSuccess }: MobileLoginProps) {
  const [phone, setPhone] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [showLicense, setShowLicense] = useState(false);
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
        setError(result.message || 'Login gagal. Periksa kredensial.');
        triggerShake();
      } else {
        const masterData = result.data || result;
        if (masterData && masterData.registry) {
          localStorage.setItem('yay_user_phone', phone);
          localStorage.setItem('yay_license_key', licenseKey);
          onLoginSuccess(masterData as UserMasterData, masterData.registry.User_ID);
        } else {
          setError('Data user tidak valid.');
          triggerShake();
        }
      }
    } catch (err: any) {
      setError('Server API terputus.');
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
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col justify-end overflow-hidden z-[9999]">
      
      {/* Top Abstract Art Background */}
      <div className="absolute top-0 left-0 right-0 h-[45%] overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[120%] bg-orange-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute top-[10%] right-[-20%] w-[70%] h-[100%] bg-emerald-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[80%] bg-blue-500/20 rounded-full blur-[80px]"></div>
        
        <div className="absolute inset-0 flex items-center justify-center pt-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-black text-white tracking-tight mb-2 drop-shadow-xl">Log in to Wazle</h1>
            <p className="text-white/70 text-sm font-medium">Welcome to the future of automation</p>
          </motion.div>
        </div>
      </div>

      {/* Main Login Card */}
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 bg-[#111113] w-full min-h-[65%] rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-8 flex flex-col border-t border-white/10"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8"></div>

        <div className={`flex flex-col gap-4 flex-1 ${shake ? 'animate-shake' : ''}`}>
          
          <div className="relative">
            <input 
              type="tel"
              placeholder="Phone Number (e.g. 628...)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-white text-base outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/30"
            />
          </div>

          <div className="relative flex items-center">
            <input 
              type={showLicense ? "text" : "password"}
              placeholder="License Key"
              value={licenseKey}
              onChange={e => setLicenseKey(e.target.value)}
              className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 pr-12 text-white text-base outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/30"
            />
            <button 
              type="button"
              onClick={() => setShowLicense(!showLicense)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white focus:outline-none"
            >
              <span className="material-symbols-outlined">
                {showLicense ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium mt-1">
              {error}
            </motion.div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-bold text-lg py-4 rounded-full mt-4 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Log in'}
          </button>

          <p className="text-white/40 text-xs text-center mt-6 leading-relaxed px-4">
            Logging in to a Wazle account means you agree to the <span className="text-white/60 font-semibold underline decoration-white/30">Privacy Policy</span> and <span className="text-white/60 font-semibold underline decoration-white/30">Terms of Service</span>.
          </p>

          <div className="mt-auto pt-6 text-center text-sm">
            <span className="text-white/50">Need a license? </span>
            <a href="#" className="text-white font-bold underline decoration-white/30">Contact Staff</a>
          </div>

        </div>
      </motion.div>

      {/* Adding animate-shake inline for the component */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}} />
    </div>
  );
}
