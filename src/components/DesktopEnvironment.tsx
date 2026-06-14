'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { UserMasterData, AutoResponder, BotConfig, FileEntry, ClientRegistry } from '@/lib/api';
import { API_BASE } from '@/lib/api';
import { useTheme, type ThemeId } from '@/lib/ThemeContext';
import WindowFrame, { type WindowState } from './WindowFrame';
import StatusBar from './StatusBar';
import DockMenu, { type DockApp } from './DockMenu';
import StartMenu from './StartMenu';
import LockScreen from './LockScreen';
import AccountApp from './apps/AccountApp';
import ControlCenterApp from './apps/ControlCenterApp';
import ResponderStudioApp from './apps/ResponderStudioApp';
import FileExplorerApp from './apps/FileExplorerApp';

import AppStoreApp from './apps/AppStoreApp';
import TaskManagerApp from './apps/TaskManagerApp';
import SubscriptionApp from './apps/SubscriptionApp';
import GroupManagerApp from './apps/GroupManagerApp';
import YAYApp from './apps/YAYApp';
import OnboardingScreen from './OnboardingScreen';
import AssistantBubble from './AssistantBubble';
import AppPromotionPopup from './AppPromotionPopup';

interface DesktopProps {
  userData: UserMasterData;
  userId: string;
}

type AppId = 'account' | 'controlcenter' | 'responderstudio' | 'fileexplorer' | 'taskmanager' | 'subscription' | 'groupmanager' | 'appstore' | 'yayapp';

const APP_DEFINITIONS: Record<AppId, { title: string; icon: string; defaultWidth: number; defaultHeight: number; minWidth: number; minHeight: number }> = {
  account:         { title: 'Account.exe',            icon: 'fi fi-rr-credit-card', defaultWidth: 440, defaultHeight: 620, minWidth: 380, minHeight: 500 },
  controlcenter:   { title: 'ControlCenter.app',      icon: 'fi fi-rr-settings', defaultWidth: 480, defaultHeight: 600, minWidth: 400, minHeight: 460 },
  responderstudio: { title: 'ResponderStudio.lnk',    icon: 'fi fi-rr-robot', defaultWidth: 700, defaultHeight: 520, minWidth: 550, minHeight: 380 },
  fileexplorer:    { title: 'FileExplorer.sys',        icon: 'fi fi-rr-folder', defaultWidth: 620, defaultHeight: 480, minWidth: 480, minHeight: 360 },
  taskmanager:     { title: 'TaskManager.exe',         icon: 'fi fi-rr-chart-histogram', defaultWidth: 500, defaultHeight: 550, minWidth: 420, minHeight: 400 },
  subscription:    { title: 'Subscription.app',        icon: 'fi fi-rr-gem', defaultWidth: 520, defaultHeight: 620, minWidth: 440, minHeight: 500 },
  groupmanager:    { title: 'GroupManager.app',        icon: 'fi fi-rr-users', defaultWidth: 480, defaultHeight: 580, minWidth: 400, minHeight: 450 },

  'appstore':      { title: 'AppStore.exe',          icon: 'fi fi-rr-apps', defaultWidth: 500, defaultHeight: 400, minWidth: 300, minHeight: 200 },
  'yayapp':        { title: 'YAY.app',                 icon: 'fi fi-rr-sparkles', defaultWidth: 520, defaultHeight: 640, minWidth: 440, minHeight: 500 },
};

export default function DesktopEnvironment({ userData, userId }: DesktopProps) {
  const { theme, setTheme, themes } = useTheme();
  const [windows, setWindows] = useState<Map<AppId, WindowState>>(new Map());
  const [botStatus, setBotStatus] = useState<'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SCAN_QR'>('OFFLINE');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [clientRegistry, setClientRegistry] = useState<ClientRegistry>(userData.registry || {} as ClientRegistry);
  const [config, setConfig] = useState<BotConfig>(userData.config || {} as BotConfig);
  const [responders, setResponders] = useState<AutoResponder[]>(userData.responders || []);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [uptime, setUptime] = useState(0);
  const zIndexCounter = useRef(100);
  const isExpired = clientRegistry.Account_Status === 'Expired';
  const isNewMember = !clientRegistry.Group_1 && !clientRegistry.Group_2 && !clientRegistry.Group_3 && !clientRegistry.Group_4 && !clientRegistry.Group_5;

  // --- Onboarding Tutorial States & Handlers ---
  const isResponderStudioInstalled = clientRegistry.Aplikasi_terpasang?.split(',').includes('responderstudio') || false;
  const tutorialActive = !clientRegistry.Tutorial && !isNewMember;
  
  const [tutorialStep, setTutorialStep] = useState(() => {
    if (isResponderStudioInstalled) return 5; // Skip to step 5 (Grand Welcome Splash)
    return 1; // Start at step 1
  });

  const getTutorialTargetSelector = () => {
    switch (tutorialStep) {
      case 2:
        return '#start-menu-button';
      case 3:
        return '#start-menu-app-appstore';
      case 4:
        return '#appstore-install-responderstudio';
      default:
        return null;
    }
  };

  const tutorialTargetSelector = getTutorialTargetSelector();

  // Auto-advance tutorial steps based on DOM events
  useEffect(() => {
    if (!tutorialActive) return;

    if (tutorialStep === 2 && startMenuOpen) {
      setTutorialStep(3);
    }
    if (tutorialStep === 3 && windows.has('appstore')) {
      setTutorialStep(4);
    }
  }, [tutorialActive, tutorialStep, startMenuOpen, windows]);

  // Spotlight effect
  useEffect(() => {
    const clearSpotlights = () => {
      document.querySelectorAll('.tutorial-spotlight').forEach(el => {
        el.classList.remove('tutorial-spotlight');
      });
    };

    clearSpotlights();

    if (!tutorialActive || !tutorialTargetSelector) return;

    const target = document.querySelector(tutorialTargetSelector);
    if (target) {
      target.classList.add('tutorial-spotlight');
    }

    return () => clearSpotlights();
  }, [tutorialActive, tutorialStep, tutorialTargetSelector, windows, startMenuOpen]);

  const handleCompleteTutorial = async () => {
    try {
      const { apiUpdateAccount } = await import('@/lib/api');
      const { toast } = await import('@/components/DynamicIsland');
      
      toast('Menyimpan sesi tutorial...', 'success');
      const res = await apiUpdateAccount(userId, { Tutorial: 'Completed' });
      
      if (res.status === 'success') {
        setClientRegistry(prev => ({ ...prev, Tutorial: 'Completed' }));
        toast('Selamat datang di YAY!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast('Gagal menyimpan tutorial: ' + res.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    let active = true;
    const loadFiles = async () => {
      try {
        const { apiGetFiles } = await import('@/lib/api');
        const res = await apiGetFiles(userId);
        if (active && res.status === 'success' && res.data) {
          const mappedFiles = res.data.map((f: any) => ({
            filename: f.filename,
            size: Number(f.size),
            modified: f.modified || new Date().toISOString(),
            url: f.url,
            id: f.id
          }));
          setFiles(mappedFiles);
        }
      } catch (e) {}
    };
    loadFiles();
    return () => { active = false; };
  }, [userId]);
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const { apiGetSessionStatus } = await import('@/lib/api');
        const res = await apiGetSessionStatus(userId);
        if (active && res.status === 'success') {
          setBotStatus(res.data.state);
          setQrCode(res.data.qr || null);
        }
      } catch (e) {
      }
    };
    fetchStatus();
    const poll = setInterval(fetchStatus, 3000);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [userId]);

  const getNextZIndex = () => {
    zIndexCounter.current += 1;
    return zIndexCounter.current;
  };

  const openApp = useCallback((appId: AppId, toggleFromDock = false) => {
    setWindows(prev => {
      const next = new Map(prev);
      if (next.has(appId)) {
        const win = next.get(appId)!;
        if (toggleFromDock && !win.isMinimized) {
          const isTopmost = Array.from(next.values()).every(w => w.isMinimized || w.zIndex <= win.zIndex);
          if (isTopmost) {
            next.set(appId, { ...win, isMinimized: true });
            return next;
          }
        }
        next.set(appId, { ...win, isMinimized: false, zIndex: getNextZIndex() });
      } else {
        const def = APP_DEFINITIONS[appId];
        const offset = next.size * 30;
        next.set(appId, {
          id: appId,
          title: def.title,
          icon: def.icon,
          x: 120 + offset,
          y: 60 + offset,
          width: def.defaultWidth,
          height: def.defaultHeight,
          minWidth: def.minWidth,
          minHeight: def.minHeight,
          zIndex: getNextZIndex(),
          isMinimized: false,
          isMaximized: window.innerWidth < 640, // Auto maximize on mobile
          isClosing: false,
        });
      }
      return next;
    });
  }, []);

  const closeApp = useCallback((appId: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      const win = next.get(appId as AppId);
      if (win) {
        next.set(appId as AppId, { ...win, isClosing: true });
      }
      return next;
    });
    setTimeout(() => {
      setWindows(prev => {
        const next = new Map(prev);
        next.delete(appId as AppId);
        return next;
      });
    }, 250);
  }, []);

  const focusApp = useCallback((appId: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      const win = next.get(appId as AppId);
      if (win) {
        next.set(appId as AppId, { ...win, zIndex: getNextZIndex(), isMinimized: false });
      }
      return next;
    });
  }, []);

  const minimizeApp = useCallback((appId: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      const win = next.get(appId as AppId);
      if (win) {
        next.set(appId as AppId, { ...win, isMinimized: true });
      }
      return next;
    });
  }, []);

  const maximizeApp = useCallback((appId: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      const win = next.get(appId as AppId);
      if (win) {
        next.set(appId as AppId, { ...win, isMaximized: !win.isMaximized });
      }
      return next;
    });
  }, []);

  const moveApp = useCallback((appId: string, x: number, y: number) => {
    setWindows(prev => {
      const next = new Map(prev);
      const win = next.get(appId as AppId);
      if (win) {
        next.set(appId as AppId, { ...win, x, y });
      }
      return next;
    });
  }, []);

  const resizeApp = useCallback((appId: string, w: number, h: number) => {
    setWindows(prev => {
      const next = new Map(prev);
      const win = next.get(appId as AppId);
      if (win) {
        next.set(appId as AppId, { ...win, width: w, height: h });
      }
      return next;
    });
  }, []);

  const handleToggle = useCallback(async (field: keyof BotConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    const { apiUpdateConfig } = await import('@/lib/api');
    const { toast } = await import('@/components/DynamicIsland');
    
    await apiUpdateConfig(userId, { [field]: value });
    
    if (value) {
      toast(`${field} Diaktifkan!`, 'success');
    } else {
      toast(`${field} Dimatikan!`, 'error');
    }

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, [userId]);

  const handleUpdateWelcomeText = useCallback(async (text: string) => {
    setConfig(prev => ({ ...prev, Custom_Welcome_Text: text }));
    const { apiUpdateConfig } = await import('@/lib/api');
    const { toast } = await import('@/components/DynamicIsland');
    
    await apiUpdateConfig(userId, { Custom_Welcome_Text: text });
    toast(`Welcome Message Disimpan!`, 'success');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, [userId]);

  const handleAddResponder = useCallback(async (data: Partial<AutoResponder>) => {
    const { apiAddResponder } = await import('@/lib/api');
    const res = await apiAddResponder(userId, data);
    if (res.status === 'success') {
      setResponders(prev => [...prev, res.data]);
    }
  }, [userId]);

  const handleDeleteResponder = useCallback(async (responseId: string) => {
    const { apiDeleteResponder } = await import('@/lib/api');
    await apiDeleteResponder(userId, responseId);
    setResponders(prev => prev.filter(r => r.Response_ID !== responseId));
  }, [userId]);

  const handleUpdateResponder = useCallback(async (responseId: string, data: Partial<AutoResponder>) => {
    const { apiUpdateResponder } = await import('@/lib/api');
    await apiUpdateResponder(userId, responseId, data);
    setResponders(prev => prev.map(r => r.Response_ID === responseId ? { ...r, ...data } : r));
  }, [userId]);

  const handleFileUpload = useCallback(async (file: File) => {
    const { apiUploadFile } = await import('@/lib/api');
    const res = await apiUploadFile(userId, file);
    if (res.status === 'success') {
      const newFile: FileEntry = {
        filename: res.data.filename,
        size: res.data.size,
        modified: new Date().toISOString(),
        url: res.data.url,
      };
      setFiles(prev => [...prev, newFile]);
    }
  }, [userId]);

  const handleFileDelete = useCallback(async (filename: string) => {
    const { apiDeleteFile } = await import('@/lib/api');
    await apiDeleteFile(userId, filename);
    setFiles(prev => prev.filter(f => f.filename !== filename));
  }, [userId]);

  const dockApps: DockApp[] = Array.from(windows.entries())
    .filter(([_, win]) => !win.isClosing)
    .map(([appId]) => {
    const def = APP_DEFINITIONS[appId];
    return {
      id: appId,
      name: def?.title || appId,
      icon: def?.icon || '📦',
      isOpen: true,
    };
  });

  const ALL_APPS = [
    { id: 'appstore', name: 'AppStore.exe', icon: 'fi fi-rr-apps' },
    { id: 'fileexplorer', name: 'FileExplorer.sys', icon: 'fi fi-rr-folder' },
    { id: 'account', name: 'Account.exe', icon: 'fi fi-rr-credit-card' },
    { id: 'controlcenter', name: 'ControlCenter.app', icon: 'fi fi-rr-settings' },
    { id: 'yayapp', name: 'YAY.app', icon: 'fi fi-rr-sparkles' },
    { id: 'responderstudio', name: 'ResponderStudio.lnk', icon: 'fi fi-rr-robot' },
    { id: 'groupmanager', name: 'GroupManager.app', icon: 'fi fi-rr-users' },
    { id: 'taskmanager', name: 'TaskManager.exe', icon: 'fi fi-rr-chart-histogram' },
    { id: 'subscription', name: 'Subscription.app', icon: 'fi fi-rr-gem' },

  ];

  const availableApps = ALL_APPS.filter(app => {
    // God tier gets everything
    if (clientRegistry.Package_Tier === 'God') return true;
    
    // Normal users always get File Explorer, App Store, and YAY.app
    if (app.id === 'appstore' || app.id === 'fileexplorer' || app.id === 'yayapp') return true;
    
    // Check if installed
    const installed = clientRegistry.Aplikasi_terpasang ? clientRegistry.Aplikasi_terpasang.split(',') : [];
    return installed.includes(app.id);
  });

  const taskList = Array.from(windows.entries()).map(([appId, win]) => ({
    id: appId,
    title: win.title,
    icon: win.icon,
    isMinimized: win.isMinimized,
    isMaximized: win.isMaximized,
    zIndex: win.zIndex,
  }));

  const renderAppContent = (appId: AppId) => {
    switch (appId) {
      case 'appstore':
        return <AppStoreApp client={clientRegistry} />;
      case 'account':
        return <AccountApp client={clientRegistry} />;
      case 'groupmanager':
        return (
          <GroupManagerApp 
            client={clientRegistry} 
            onUpdate={async (data) => {
              setClientRegistry((prev: ClientRegistry) => ({ ...prev, ...data }));
              const { apiUpdateAccount } = await import('@/lib/api');
              await apiUpdateAccount(userId, data);
            }}
          />
        );
      case 'yayapp':
        return (
          <YAYApp
            config={config}
            onToggle={handleToggle}
          />
        );
      case 'controlcenter':
        return (
          <ControlCenterApp
            client={clientRegistry}
            config={config}
            onToggle={handleToggle}
            onUpdateWelcomeText={handleUpdateWelcomeText}
            botStatus={botStatus}
            qrCode={qrCode}
            onStartBot={async () => {
              setBotStatus('CONNECTING');
              const { apiStartSession } = await import('@/lib/api');
              await apiStartSession(userId);
            }}
            onStopBot={async () => {
              setBotStatus('OFFLINE');
              const { apiStopSession } = await import('@/lib/api');
              await apiStopSession(userId);
            }}
          />
        );
      case 'responderstudio':
        return (
          <ResponderStudioApp
            client={clientRegistry}
            responders={responders}
            onAdd={handleAddResponder}
            onDelete={handleDeleteResponder}
            onUpdate={handleUpdateResponder}
          />
        );
      case 'fileexplorer':
        return (
          <FileExplorerApp
            client={clientRegistry}
            files={files}
            onUpload={async (file) => {
              const { apiUploadFile } = await import('@/lib/api');
              const res = await apiUploadFile(userId, file);
              if (res.status === 'success') {
                const newFile: FileEntry = {
                  filename: res.data.Filename,
                  size: res.data.Size,
                  modified: new Date().toISOString(),
                  url: res.data.Drive_URL,
                };
                setFiles(prev => [...prev, newFile]);
              } else {
                throw new Error(res.message || 'Upload failed');
              }
            }}
            onDelete={async (filename) => {
              const { apiDeleteFile } = await import('@/lib/api');
              const res = await apiDeleteFile(userId, filename);
              if (res.status === 'success') {
                setFiles(prev => prev.filter(f => f.filename !== filename));
              } else {
                throw new Error(res.message || 'Delete failed');
              }
            }}
            onCopyUrl={() => {}}
            apiBase=""
          />
        );
      case 'taskmanager':
        return (
          <TaskManagerApp
            tasks={taskList}
            onFocusTask={(id) => focusApp(id)}
            onCloseTask={(id) => closeApp(id)}
            botStatus={botStatus}
            uptime={uptime}
          />
        );
      case 'subscription':
        return <SubscriptionApp client={clientRegistry} />;
    }
  };

  return (
    <div className="fixed inset-0" style={{ animation: 'desktopFadeIn 0.8s ease-out' }}>
      {/* Wallpaper */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(57, 255, 20, 0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
          var(--surface-dark)
        `,
      }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Status Bar */}
      <StatusBar
        botStatus={botStatus}
        packageTier={clientRegistry.Package_Tier}
        userId={userId}
      />

      {/* Windows */}
      {Array.from(windows.entries()).map(([appId, winState]) => (
        <WindowFrame
          key={appId}
          windowState={winState}
          onFocus={focusApp}
          onClose={closeApp}
          onMinimize={minimizeApp}
          onMaximize={maximizeApp}
          onMove={moveApp}
          onResize={resizeApp}
        >
          {renderAppContent(appId)}
        </WindowFrame>
      ))}

      {/* Start Menu */}
      <StartMenu
        isOpen={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        onOpenApp={(id) => openApp(id as AppId)}
        onOpenThemeSettings={() => {}}
        onOpenTaskManager={() => openApp('taskmanager')}
        onOpenSubscription={() => openApp('subscription')}
        pinnedApps={availableApps}
        currentTheme={theme}
        themes={themes}
        onThemeChange={(id) => setTheme(id as ThemeId)}
      />

      {/* Onboarding Overlay */}
      {isNewMember && (
        <OnboardingScreen userId={userId} onComplete={() => window.location.reload()} />
      )}

      {/* Onboarding Dim Backdrop (Centered Steps) */}
      {tutorialActive && !tutorialTargetSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-[9400] transition-opacity duration-500" />
      )}

      {/* Dock */}
      <DockMenu
        apps={dockApps}
        onAppClick={(id) => openApp(id as AppId, true)}
        onStartMenuToggle={() => setStartMenuOpen(prev => !prev)}
        isStartMenuOpen={startMenuOpen}
      />

      {/* AI Assistant Bubble */}
      <AssistantBubble
        userId={userId}
        tutorialActive={tutorialActive}
        tutorialStep={tutorialStep}
        onNextTutorialStep={() => setTutorialStep(prev => prev + 1)}
        onCompleteTutorial={handleCompleteTutorial}
        targetSelector={tutorialTargetSelector}
      />

      {/* Masterpiece Welcome Splash (Step 5) */}
      {tutorialActive && tutorialStep === 5 && (
        <div className="fixed inset-0 z-[9990] flex flex-col items-center justify-center bg-black overflow-hidden select-text">
          {/* Ambient background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20"
              style={{ background: 'radial-gradient(circle, var(--neon-green) 0%, transparent 80%)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10"
              style={{ background: 'radial-gradient(circle, var(--neon-blue) 0%, transparent 80%)' }} />
          </div>

          <div className="relative text-center max-w-lg px-6 z-10 space-y-6"
            style={{ animation: 'bootFadeIn 1s var(--ease-spring) both' }}>
            <img src="/logo-white.png" alt="Logo" className="h-24 w-auto mx-auto mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.25)] animate-pulse" />
            
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
              Selamat datang
            </h1>
            
            <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Sistem operasi virtual Anda telah siap. Semua modul telah terpasang dan asisten AI Anda telah diaktifkan di grup WhatsApp Anda.
            </p>

            <div className="pt-6">
              <button
                onClick={handleCompleteTutorial}
                className="px-8 py-4 bg-white text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-98 transition-all cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
              >
                Mulai Operasional
              </button>
            </div>
          </div>
        </div>
      )}
      {/* App Promotion Popup */}
      {!isExpired && <AppPromotionPopup />}

      {/* Lock Screen Overlay */}
      {isExpired && <LockScreen onUnlock={() => {}} />}
    </div>
  );
}
