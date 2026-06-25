'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserMasterData } from '@/lib/api';

interface LoginGateProps {
  onLoginSuccess: (data: UserMasterData, userId: string) => void;
  isMobile?: boolean;
}

export default function LoginGate({ onLoginSuccess, isMobile }: LoginGateProps) {
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleNextStep1 = async () => {
    if (!phone) {
      setError('Nomor WhatsApp wajib diisi.');
      triggerShake();
      return;
    }
    setError('');

    if (mode === 'login') {
      setLoading(true);
      try {
        const { apiOTPRequest } = await import('@/lib/api');
        const result = await apiOTPRequest(phone);
        if (result.status === 'error') {
          setError(result.message || 'Gagal request OTP.');
          triggerShake();
        } else {
          setStep(2);
        }
      } catch (err) {
        setError('Server API terputus.');
        triggerShake();
      } finally {
        setLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    if (mode === 'register') {
      if (!token) {
        setError('Token wajib diisi.');
        triggerShake();
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handleLogin = async () => {
    if (!otp) {
      setError('OTP wajib diisi.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { apiOTPVerify } = await import('@/lib/api');
      const result = await apiOTPVerify(phone, otp);
      
      if (result.status === 'error') {
        setError(result.message || 'Kode OTP salah.');
        triggerShake();
      } else {
        const masterData = result.data || result;
        if (masterData && masterData.User_ID) {
          localStorage.setItem('yay_user_phone', phone);
          onLoginSuccess(masterData as UserMasterData, masterData.User_ID);
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

  const handleRegister = async () => {
    if (!username) {
      setError('Username wajib diisi.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { apiRegister } = await import('@/lib/api');
      const result = await apiRegister(phone, token, username);
      
      if (result.status === 'error') {
        setError(result.message || 'Registrasi gagal.');
        triggerShake();
      } else {
        const masterData = result.data || result;
        if (masterData && masterData.User_ID) {
          localStorage.setItem('yay_user_phone', phone);
          const { apiMe } = await import('@/lib/api');
          const meResult = await apiMe(phone);
          if (meResult.status === 'success' && meResult.data) {
             onLoginSuccess(meResult.data as UserMasterData, meResult.data.registry.User_ID);
          } else {
             setError('Gagal memuat data dashboard.');
             triggerShake();
          }
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

  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999]">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] bg-emerald-500/10 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`relative z-10 w-full max-w-md ${isMobile ? 'h-full flex flex-col justify-end' : ''}`}
      >
        <div className={`${isMobile ? 'bg-[#111113] min-h-[75vh] rounded-t-[2.5rem] p-8 pb-12 flex flex-col border-t border-white/5' : 'bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] p-8 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'} overflow-hidden`}>
          
          {isMobile && <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8"></div>}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-lg">Wazle Dash</h1>
            <p className="text-white/60 text-sm font-medium">Register & Control Panel</p>
          </div>

          <div className={`flex flex-col gap-5 flex-1 ${shake ? 'animate-shake' : ''}`}>
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">WhatsApp Number</label>
                    <input 
                      type="tel"
                      placeholder="e.g. 6281234..."
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNextStep1()}
                      className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                    />
                  </div>
                  
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium">
                      {error}
                    </motion.div>
                  )}

                  <button
                    onClick={handleNextStep1}
                    disabled={!phone || loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                  >
                    {loading ? 'Processing...' : 'Continue'}
                  </button>
                </motion.div>
              )}

              {step === 2 && mode === 'login' && (
                <motion.div 
                  key="step2-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Verifikasi OTP</label>
                    <input 
                      type="text"
                      placeholder="Masukkan 6 digit OTP"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      maxLength={6}
                      className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                    />
                    <p className="text-[11px] text-white/40 text-center mt-2">Cek WhatsApp dari Master Bot</p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium">
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => { setStep(1); setError(''); }}
                      disabled={loading}
                      className="px-6 py-4 rounded-2xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleLogin}
                      disabled={loading || otp.length < 6}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                    >
                      {loading ? 'Verifying...' : 'Login'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && mode === 'register' && (
                <motion.div 
                  key="step2-register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Registration Token</label>
                    <input 
                      type="text"
                      placeholder="NETALS-XXXXX-XXXXX"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNextStep2()}
                      className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-center text-lg tracking-widest font-mono outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                    />
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium">
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => { setStep(1); setError(''); }}
                      className="px-6 py-4 rounded-2xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNextStep2}
                      disabled={!token}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Username</label>
                    <input 
                      type="text"
                      placeholder="e.g. John Doe"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRegister()}
                      className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-center text-lg font-medium outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                    />
                    <p className="text-[11px] text-white/40 text-center mt-2">Username dapat diganti nanti</p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium">
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => { setStep(2); setError(''); }}
                      disabled={loading}
                      className="px-6 py-4 rounded-2xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleRegister}
                      disabled={loading || !username}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                    >
                      {loading ? 'Processing...' : 'Register'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setStep(1);
                  setError('');
                }}
                className="text-white/50 text-sm hover:text-white transition-colors"
              >
                {mode === 'login' ? "Belum punya akun? Register di sini" : "Sudah punya akun? Login dengan OTP"}
              </button>
            </div>

            <p className="text-white/30 text-xs text-center mt-6 leading-relaxed px-4">
              Protected by Wazle Secure Auth.<br/>By continuing you agree to our Terms.
            </p>

            <a 
              href="https://wa.me/62882008677172" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs text-center mt-2 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">support_agent</span>
              Hubungi Wazle Support Service
            </a>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}} />
    </div>
  );
}
