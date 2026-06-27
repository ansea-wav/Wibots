'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { apiMe, type UserMasterData } from '@/lib/api';
import { getSharedCookie, setSharedCookie, eraseSharedCookie } from '@/lib/cookies';

const BootScreen = dynamic(() => import('@/components/BootScreen'));
const LoginGate = dynamic(() => import('@/components/LoginGate'));
const DashboardLayout = dynamic(() => import('@/components/DashboardLayout'));

type AppPhase = 'boot' | 'login' | 'dashboard' | 'waiting_api';

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('waiting_api');
  const [userData, setUserData] = useState<UserMasterData | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [apiDone, setApiDone] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [curtainOpacity, setCurtainOpacity] = useState(1);
  const [curtainRendered, setCurtainRendered] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsMobile(/mobi|android|iphone|ipad|ipod/.test(ua));
  }, []);

  // Drop Curtain
  useEffect(() => {
    if (phase !== 'waiting_api') {
      const dropTimer = setTimeout(() => {
        setCurtainOpacity(0);
        setTimeout(() => setCurtainRendered(false), 1000);
      }, 50);
      return () => clearTimeout(dropTimer);
    }
  }, [phase]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authPhone = params.get('authPhone');
    
    if (authPhone) {
      localStorage.setItem('yay_user_phone', authPhone);
      setSharedCookie('yay_user_phone', authPhone);
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    let savedUserPhone = localStorage.getItem('yay_user_phone');
    
    // Sync with shared cookie if localStorage is empty
    if (!savedUserPhone) {
      const cookiePhone = getSharedCookie('yay_user_phone');
      if (cookiePhone) {
        localStorage.setItem('yay_user_phone', cookiePhone);
        savedUserPhone = cookiePhone;
      }
    }

    if (savedUserPhone) {
      apiMe(savedUserPhone).then(res => {
        if (res.status === 'success' && res.data) {
          setUserData(res.data);
          const uid = res.data.registry?.User_ID || savedUserPhone;
          setUserId(uid);
          setApiSuccess(true);
        } else {
          localStorage.removeItem('yay_user_phone');
          eraseSharedCookie('yay_user_phone');
        }
        setApiDone(true);
      }).catch(() => {
        setApiDone(true);
      });
    } else {
      setApiDone(true);
    }
  }, []);

  useEffect(() => {
    if (phase === 'waiting_api' && apiDone) {
      setPhase(apiSuccess ? 'dashboard' : 'login');
    }
  }, [phase, apiDone, apiSuccess]);

  const handleBootComplete = () => {
    if (apiDone) {
      setPhase(apiSuccess ? 'dashboard' : 'login');
    } else {
      setPhase('waiting_api');
    }
  };

  const handleLoginSuccess = (data: UserMasterData, uid: string) => {
    setUserData(data);
    setUserId(uid);
    setPhase('dashboard');
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[var(--surface-dark)] relative">
      {curtainRendered && (
        <div 
          className="absolute inset-0 z-[9999] bg-[#000000] transition-opacity duration-1000 pointer-events-none"
          style={{ opacity: curtainOpacity }}
        />
      )}

      {phase === 'boot' && <BootScreen onBootComplete={handleBootComplete} />}

      {phase === 'login' && <LoginGate onLoginSuccess={handleLoginSuccess} isMobile={isMobile} />}

      {phase === 'dashboard' && userData && (
        <div className="absolute inset-0 z-10 w-full h-full bg-[#0d0d11] text-zinc-100 flex items-center justify-center p-3 sm:p-6 md:p-8 relative">
          {/* Background Ambience / Blur */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-zinc-800/30 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-700/20 rounded-full blur-[120px]"></div>
          </div>

          {/* Floating Dashboard Card with Spring Entry */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 15,
              mass: 0.8
            }}
            className="relative z-10 w-full h-full max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] md:max-h-[calc(100vh-4rem)] max-w-7xl rounded-[2.5rem] bg-[#131317] border border-white/10 shadow-2xl flex overflow-hidden"
          >
            <DashboardLayout userData={userData} userId={userId} />
          </motion.div>
        </div>
      )}
    </main>
  );
}
