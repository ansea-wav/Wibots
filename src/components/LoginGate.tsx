'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserMasterData } from '@/lib/api';

interface LoginGateProps {
  onLoginSuccess: (data: UserMasterData, userId: string) => void;
  isMobile?: boolean;
}

export default function LoginGate({ onLoginSuccess, isMobile }: LoginGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Bread-obfuscated State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [brioche, setBrioche] = useState('');     // phone / whatsapp
  const [sourdough, setSourdough] = useState(''); // token
  const [croissant, setCroissant] = useState(''); // username
  const [baguette, setBaguette] = useState('');   // password
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [showBaguette, setShowBaguette] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const bakeCroissant = async () => { // handleLogin
    if (!croissant || !baguette) {
      setError('Username dan Password wajib diisi.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { tasteBread } = await import('@/lib/api');
      const result = await tasteBread(croissant, baguette);
      
      if (result.status === 'error') {
        setError(result.message || 'Kredensial salah.');
        triggerShake();
      } else {
        const masterData = result.data || result;
        if (masterData && masterData.registry) {
          localStorage.setItem('yay_user_phone', masterData.registry.WhatsApp_Owner);
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

  const handleNextStep1 = () => {
    if (!brioche) {
      setError('Nomor WhatsApp wajib diisi.');
      triggerShake();
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!sourdough) {
      setError('Token wajib diisi.');
      triggerShake();
      return;
    }
    setError('');
    setStep(3);
  };

  const prepareDough = async () => { // handleRegister
    if (!croissant || !baguette) {
      setError('Username dan Password wajib diisi.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { mixIngredients, tasteBread } = await import('@/lib/api');
      const result = await mixIngredients(brioche, sourdough, croissant, baguette);
      
      if (result.status === 'error') {
        setError(result.message || 'Registrasi gagal.');
        triggerShake();
      } else {
        // Auto-login after registration
        const loginResult = await tasteBread(croissant, baguette);
        if (loginResult.status === 'success') {
          const masterData = loginResult.data || loginResult;
          localStorage.setItem('yay_user_phone', brioche);
          onLoginSuccess(masterData as UserMasterData, masterData.registry.User_ID);
        } else {
          setError('Registrasi berhasil, tapi gagal otomatis masuk.');
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

  const switchMode = (newMode: 'login' | 'register') => {
    if (newMode === mode) return;
    setMode(newMode);
    setStep(1);
    setError('');
    setBrioche('');
    setSourdough('');
    setCroissant('');
    setBaguette('');
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

          {/* Mode Slider */}
          <div className="relative flex w-full bg-white/5 p-1 rounded-2xl mb-8">
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-xl transition-all duration-300 ease-in-out shadow-[0_2px_10px_rgba(37,99,235,0.3)]"
              style={{ left: mode === 'login' ? '4px' : 'calc(50%)' }}
            />
            <button 
              onClick={() => switchMode('login')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${mode === 'login' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Login
            </button>
            <button 
              onClick={() => switchMode('register')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors duration-300 ${mode === 'register' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              Register
            </button>
          </div>

          <div className={`flex flex-col gap-5 flex-1 ${shake ? 'animate-shake' : ''}`}>
            
            <AnimatePresence mode="wait">
              {/* LOGIN MODE */}
              {mode === 'login' && (
                <motion.div 
                  key="login-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Username</label>
                    <input 
                      type="text"
                      placeholder="e.g. John Doe"
                      value={croissant}
                      onChange={e => setCroissant(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && bakeCroissant()}
                      className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showBaguette ? "text" : "password"}
                        placeholder="••••••••"
                        value={baguette}
                        onChange={e => setBaguette(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && bakeCroissant()}
                        className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowBaguette(!showBaguette)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showBaguette ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center font-medium">
                      {error}
                    </motion.div>
                  )}

                  <button
                    onClick={bakeCroissant}
                    disabled={!croissant || !baguette || loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                  >
                    {loading ? 'Authenticating...' : 'Login'}
                  </button>
                </motion.div>
              )}

              {/* REGISTER MODE */}
              {mode === 'register' && step === 1 && (
                <motion.div 
                  key="reg-step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">WhatsApp Number</label>
                    <input 
                      type="tel"
                      placeholder="e.g. 6281234..."
                      value={brioche}
                      onChange={e => setBrioche(e.target.value)}
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
                    disabled={!brioche}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl mt-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                  >
                    Next Step
                  </button>
                </motion.div>
              )}

              {mode === 'register' && step === 2 && (
                <motion.div 
                  key="reg-step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Registration Token</label>
                    <input 
                      type="text"
                      placeholder="NETALS-XXXXX-XXXXX"
                      value={sourdough}
                      onChange={e => setSourdough(e.target.value)}
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
                      disabled={!sourdough}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                    >
                      Next Step
                    </button>
                  </div>
                </motion.div>
              )}

              {mode === 'register' && step === 3 && (
                <motion.div 
                  key="reg-step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <div className="flex-1">
                      <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Username</label>
                      <input 
                        type="text"
                        placeholder="John Doe"
                        value={croissant}
                        onChange={e => setCroissant(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && prepareDough()}
                        className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] text-white/50 uppercase tracking-widest font-semibold mb-2 block ml-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showBaguette ? "text" : "password"}
                          placeholder="••••••••"
                          value={baguette}
                          onChange={e => setBaguette(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && prepareDough()}
                          className="w-full bg-white/[0.05] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowBaguette(!showBaguette)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showBaguette ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
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
                      onClick={prepareDough}
                      disabled={loading || !croissant || !baguette}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
                    >
                      {loading ? 'Processing...' : 'Register Account'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
