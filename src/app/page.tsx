'use client';
import { useState, useEffect } from 'react';
import BootScreen from '@/components/BootScreen';
import LoginGate from '@/components/LoginGate';
import DesktopEnvironment from '@/components/DesktopEnvironment';
import { apiLogin, type UserMasterData } from '@/lib/api';

type AppPhase = 'boot' | 'login' | 'desktop' | 'waiting_api';

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('boot');
  const [userData, setUserData] = useState<UserMasterData | null>(null);
  const [userId, setUserId] = useState<string>('');

  const [apiDone, setApiDone] = useState(false);
  const [apiSuccess, setApiSuccess] = useState(false);

  useEffect(() => {
    const savedUserPhone = localStorage.getItem('yay_user_phone');
    const savedLicense = localStorage.getItem('yay_license_key');
    if (savedUserPhone && savedLicense) {
      apiLogin(savedUserPhone, savedLicense).then(res => {
        if (res.status === 'success' && res.data) {
          setUserData(res.data);
          setUserId(res.data.registry?.User_ID || savedUserPhone);
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
        <LoginGate onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Desktop Environment */}
      {phase === 'desktop' && userData && (
        <DesktopEnvironment userData={userData} userId={userId} />
      )}
    </main>
  );
}
