'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserMasterData } from '@/lib/api';
import { setSharedCookie } from '@/lib/cookies';

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
          setSharedCookie('yay_user_phone', masterData.registry.WhatsApp_Owner);
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
          setSharedCookie('yay_user_phone', brioche);
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

  // Height measurement hook to animates height smoothly without scaling/distortion
  const [cardHeight, setCardHeight] = useState<number | 'auto'>('auto');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setCardHeight(containerRef.current.offsetHeight);

      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setCardHeight(entry.target.clientHeight);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const jellyTransition = {
    type: "spring" as const,
    stiffness: 180,
    damping: 10,
    mass: 0.8
  };

  const slideTransition = {
    type: "spring" as const,
    stiffness: 180,
    damping: 15
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0d0d11] flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden font-sans">
      
      {/* Viewport inner white panel matching landing page sheet shape */}
      <div className="w-full h-full max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)] max-w-7xl rounded-[2.5rem] bg-[#fdfcf7] border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden relative">
        
        {/* Background Ambience / Blur (subtle soft gray glow) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-zinc-350/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-300/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Floating Black Login Card - height is animated smoothly via CSS height property */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0, height: cardHeight }}
          transition={{ 
            default: { type: "spring", stiffness: 180, damping: 15 },
            height: jellyTransition
          }}
          className={`relative z-10 w-full max-w-sm auth-card backdrop-blur-2xl rounded-3xl border shadow-2xl overflow-hidden ${shake ? 'animate-shake' : ''}`}
        >
          {/* Inner container wrapper holding padding and ref to measure true natural height */}
          <div ref={containerRef} className="flex flex-col gap-5 p-6">
            {isMobile && <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-1"></div>}

            <div className="text-center">
              <h1 className="text-2xl font-black auth-title tracking-tight mb-1.5 drop-shadow-lg">Wazle Dash</h1>
              <p className="auth-subtitle text-xs font-medium">Register & Control Panel</p>
            </div>

            {/* Mode Slider */}
            <div className="relative flex w-full auth-slider p-1 rounded-2xl border">
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] auth-slider-indicator rounded-xl transition-all duration-300 ease-in-out shadow-md border"
                style={{ left: mode === 'login' ? '4px' : 'calc(50%)' }}
              />
              <button 
                onClick={() => switchMode('login')}
                className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-300 auth-slider-btn ${mode === 'login' ? 'active' : ''}`}
              >
                Login
              </button>
              <button 
                onClick={() => switchMode('register')}
                className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-300 auth-slider-btn ${mode === 'register' ? 'active' : ''}`}
              >
                Register
              </button>
            </div>

            {/* Form Container with relative positioning to host absolute exiting slides */}
            <div className="relative flex flex-col overflow-hidden">
              <AnimatePresence initial={false}>
                {/* LOGIN MODE */}
                {mode === 'login' && (
                  <motion.div 
                    key="login-view"
                    initial={{ opacity: 0, x: -80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 80 }}
                    transition={slideTransition}
                    style={{ 
                      position: mode === 'login' ? 'relative' : 'absolute', 
                      width: '100%'
                    }}
                    className="flex flex-col gap-3.5"
                  >
                    <div>
                      <label className="text-[10px] auth-label uppercase tracking-widest font-bold mb-1 block ml-1">Username</label>
                      <input 
                        type="text"
                        placeholder="e.g. John Doe"
                        value={croissant}
                        onChange={e => setCroissant(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && bakeCroissant()}
                        className="w-full auth-input border rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] auth-label uppercase tracking-widest font-bold mb-1 block ml-1">Password</label>
                      <div className="relative">
                        <input 
                          type={showBaguette ? "text" : "password"}
                          placeholder="••••••••"
                          value={baguette}
                          onChange={e => setBaguette(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && bakeCroissant()}
                          className="w-full auth-input border rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/20"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowBaguette(!showBaguette)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {showBaguette ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                    
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-medium">
                        {error}
                      </motion.div>
                    )}

                    <button
                      onClick={bakeCroissant}
                      disabled={!croissant || !baguette || loading}
                      className="w-full auth-btn-primary font-bold text-xs py-3 rounded-full mt-1.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
                    >
                      {loading ? 'Authenticating...' : 'Login'}
                    </button>
                  </motion.div>
                )}

                {/* REGISTER MODE - STEP 1 */}
                {mode === 'register' && step === 1 && (
                  <motion.div 
                    key="reg-step1"
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={slideTransition}
                    style={{ 
                      position: (mode === 'register' && step === 1) ? 'relative' : 'absolute', 
                      width: '100%',
                      top: 0
                    }}
                    className="flex flex-col gap-3.5"
                  >
                    <div>
                      <label className="text-[10px] auth-label uppercase tracking-widest font-bold mb-1 block ml-1">WhatsApp Number</label>
                      <input 
                        type="tel"
                        placeholder="e.g. 6281234..."
                        value={brioche}
                        onChange={e => setBrioche(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNextStep1()}
                        className="w-full auth-input border rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                    
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-medium">
                        {error}
                      </motion.div>
                    )}

                    <button
                      onClick={handleNextStep1}
                      disabled={!brioche}
                      className="w-full auth-btn-primary font-bold text-xs py-3 rounded-full mt-1.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
                    >
                      Next Step
                    </button>
                  </motion.div>
                )}

                {/* REGISTER MODE - STEP 2 */}
                {mode === 'register' && step === 2 && (
                  <motion.div 
                    key="reg-step2"
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={slideTransition}
                    style={{ 
                      position: (mode === 'register' && step === 2) ? 'relative' : 'absolute', 
                      width: '100%',
                      top: 0
                    }}
                    className="flex flex-col gap-3.5"
                  >
                    <div>
                      <label className="text-[10px] auth-label uppercase tracking-widest font-bold mb-1 block ml-1">Registration Token</label>
                      <input 
                        type="text"
                        placeholder="NETALS-XXXXX-XXXXX"
                        value={sourdough}
                        onChange={e => setSourdough(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNextStep2()}
                        className="w-full auth-input border rounded-2xl px-4 py-3 text-center text-sm tracking-widest font-mono outline-none transition-all placeholder:text-white/10"
                      />
                    </div>

                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-medium">
                        {error}
                      </motion.div>
                    )}

                    <div className="flex gap-2.5 mt-1.5">
                      <button
                        onClick={() => { setStep(1); setError(''); }}
                        className="px-5 py-3 rounded-full auth-btn-secondary border text-xs font-bold transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep2}
                        disabled={!sourdough}
                        className="flex-1 auth-btn-primary font-bold text-xs py-3 rounded-full active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
                      >
                        Next Step
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* REGISTER MODE - STEP 3 */}
                {mode === 'register' && step === 3 && (
                  <motion.div 
                    key="reg-step3"
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={slideTransition}
                    style={{ 
                      position: (mode === 'register' && step === 3) ? 'relative' : 'absolute', 
                      width: '100%',
                      top: 0
                    }}
                    className="flex flex-col gap-3.5"
                  >
                    <div className="flex gap-2.5 flex-col sm:flex-row">
                      <div className="flex-1">
                        <label className="text-[10px] auth-label uppercase tracking-widest font-bold mb-1 block ml-1">Username</label>
                        <input 
                          type="text"
                          placeholder="John Doe"
                          value={croissant}
                          onChange={e => setCroissant(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && prepareDough()}
                          className="w-full auth-input border rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/20"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] auth-label uppercase tracking-widest font-bold mb-1 block ml-1">Password</label>
                        <div className="relative">
                          <input 
                            type={showBaguette ? "text" : "password"}
                            placeholder="••••••••"
                            value={baguette}
                            onChange={e => setBaguette(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && prepareDough()}
                            className="w-full auth-input border rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-white/20"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowBaguette(!showBaguette)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {showBaguette ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-medium">
                        {error}
                      </motion.div>
                    )}

                    <div className="flex gap-2.5 mt-1.5">
                      <button
                        onClick={() => { setStep(2); setError(''); }}
                        disabled={loading}
                        className="px-5 py-3 rounded-full auth-btn-secondary border text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={prepareDough}
                        disabled={loading || !croissant || !baguette}
                        className="flex-1 auth-btn-primary font-bold text-xs py-3 rounded-full active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md"
                      >
                        {loading ? 'Processing...' : 'Register'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <p className="text-white/30 text-[10px] text-center leading-relaxed px-4">
                Protected by Wazle Secure Auth.<br/>By continuing you agree to our Terms.
              </p>

              <a 
                href="https://wa.me/62882008677172" 
                target="_blank" 
                rel="noopener noreferrer"
                className="auth-link text-[10px] text-center mt-1 font-medium flex items-center justify-center gap-1 transition-colors block"
              >
                <span className="material-symbols-outlined text-[12px]">support_agent</span>
                Hubungi Wazle Support Service
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Local style overrides to protect colors from global theme variables */}
      <style dangerouslySetInnerHTML={{__html: `
        .auth-card {
          background-color: #111113 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .auth-title {
          color: #ffffff !important;
        }
        .auth-subtitle {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .auth-label {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .auth-input {
          background-color: rgba(0, 0, 0, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }
        .auth-input:focus {
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .auth-btn-primary {
          background-color: #ffffff !important;
          color: #0d0d11 !important;
        }
        .auth-btn-primary:hover {
          background-color: #f4f4f5 !important;
        }
        .auth-btn-primary:disabled {
          opacity: 0.5 !important;
          background-color: #ffffff !important;
        }
        .auth-btn-secondary {
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        .auth-btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .auth-link {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .auth-link:hover {
          color: #ffffff !important;
        }
        .auth-slider {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
        }
        .auth-slider-indicator {
          background-color: #0d0d11 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .auth-slider-btn {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .auth-slider-btn.active {
          color: #ffffff !important;
        }
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
