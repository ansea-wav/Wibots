'use client';
import { useState, useEffect } from 'react';
import BootScreen from '@/components/BootScreen';
import LoginGate from '@/components/LoginGate';
import DesktopEnvironment from '@/components/DesktopEnvironment';
import MobileEnvironment from '@/components/MobileEnvironment';
import { apiLogin, apiInstallApp, type UserMasterData } from '@/lib/api';

type AppPhase = 'boot' | 'login' | 'desktop' | 'waiting_api';

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('waiting_api');
  const [userData, setUserData] = useState<UserMasterData | null>(null);
  const [userId, setUserId] = useState<string>('');

  const [apiDone, setApiDone] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsMobile(/mobi|android|iphone|ipad|ipod/.test(ua));
  }, []);

  // Auto-install logic for mobile users (runs in background)
  const fireAutoInstall = (uid: string, currentInstalled: string) => {
    const appsToInstall = ['Responder Studio', 'Control Center', 'Group Manager', 'File Explorer', 'Task Manager'];
    const installedArr = currentInstalled ? currentInstalled.split(',') : [];
    appsToInstall.forEach(app => {
      if (!installedArr.includes(app)) {
        apiInstallApp(uid, app).catch(() => {});
      }
    });
  };

  useEffect(() => {
    const savedUserPhone = localStorage.getItem('yay_user_phone');
    const savedLicense = localStorage.getItem('yay_license_key');
    if (savedUserPhone && savedLicense) {
      apiLogin(savedUserPhone, savedLicense).then(res => {
        if (res.status === 'success' && res.data) {
          setUserData(res.data);
          const uid = res.data.registry?.User_ID || savedUserPhone;
          setUserId(uid);
          
          if (/mobi|android|iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
            fireAutoInstall(uid, res.data.registry?.Aplikasi_terpasang || '');
          }

          setApiSuccess(true);
        }
        setApiDone(true);
      }).catch(() => setApiDone(true));
    } else {
      setApiDone(true);
    }
  }, []);

  useEffect(() => {
    if (phase === 'waiting_api' && apiDone) {
      setPhase(apiSuccess ? 'desktop' : 'login');
    }
  }, [phase, apiDone, apiSuccess]);

  useEffect(() => {
    if (phase === 'desktop' && userId) {
      const t = setTimeout(() => {
        const event = new CustomEvent('yay-toast', { detail: { message: `Welcome back ${userId}`, type: 'info' } });
        window.dispatchEvent(event);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, userId]);

  const handleBootComplete = () => {
    if (apiDone) {
      setPhase(apiSuccess ? 'desktop' : 'login');
    } else {
      setPhase('waiting_api');
    }
  };

  const handleLoginSuccess = (data: UserMasterData, uid: string) => {
    setUserData(data);
    setUserId(uid);
    if (isMobile) {
      fireAutoInstall(uid, data.registry?.Aplikasi_terpasang || '');
    }
    setPhase('desktop');
  };

  return (
    <main className="h-screen w-screen overflow-hidden bg-[var(--surface-dark)]">
      {/* Boot Sequence */}
      {phase === 'boot' && (
        <BootScreen onBootComplete={handleBootComplete} />
      )}

      {/* Login Gate */}
      {phase === 'login' && (
        <LoginGate onLoginSuccess={handleLoginSuccess} isMobile={isMobile} />
      )}

      {/* Desktop/Mobile Environment */}
      {phase === 'desktop' && userData && (
        isMobile ? (
          <MobileEnvironment userData={userData} userId={userId} />
        ) : (
          <DesktopEnvironment userData={userData} userId={userId} />
        )
      )}
    </main>
  );
}
