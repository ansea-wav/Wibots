'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { UserMasterData, AutoResponder, BotConfig, FileEntry } from '@/lib/api';
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
import FileManagerApp from './apps/FileManagerApp';
import UserManagerApp from './apps/UserManagerApp';
import AppStoreApp from './apps/AppStoreApp';
import TaskManagerApp from './apps/TaskManagerApp';
import SubscriptionApp from './apps/SubscriptionApp';
import GroupManagerApp from './apps/GroupManagerApp';
import YAYApp from './apps/YAYApp';
import OnboardingScreen from './OnboardingScreen';

interface DesktopProps {
  userData: UserMasterData;
  userId: string;
}

type AppId = 'account' | 'controlcenter' | 'responderstudio' | 'fileexplorer' | 'taskmanager' | 'subscription' | 'groupmanager' | 'user-manager' | 'appstore' | 'yayapp';

const APP_DEFINITIONS: Record<AppId, { title: string; icon: string; defaultWidth: number; defaultHeight: number; minWidth: number; minHeight: number }> = {
  account:         { title: 'Account.exe',            icon: '💳', defaultWidth: 440, defaultHeight: 620, minWidth: 380, minHeight: 500 },
  controlcenter:   { title: 'ControlCenter.app',      icon: '⚙️', defaultWidth: 480, defaultHeight: 600, minWidth: 400, minHeight: 460 },
  responderstudio: { title: 'ResponderStudio.lnk',    icon: '🤖', defaultWidth: 700, defaultHeight: 520, minWidth: 550, minHeight: 380 },
  fileexplorer:    { title: 'FileExplorer.sys',        icon: '📁', defaultWidth: 620, defaultHeight: 480, minWidth: 480, minHeight: 360 },
  taskmanager:     { title: 'TaskManager.exe',         icon: '📊', defaultWidth: 500, defaultHeight: 550, minWidth: 420, minHeight: 400 },
  subscription:    { title: 'Subscription.app',        icon: '💎', defaultWidth: 520, defaultHeight: 620, minWidth: 440, minHeight: 500 },
  groupmanager:    { title: 'GroupManager.app',        icon: '👥', defaultWidth: 480, defaultHeight: 580, minWidth: 400, minHeight: 450 },
  'user-manager':  { title: 'UserManager.exe',         icon: '👥', defaultWidth: 600, defaultHeight: 500, minWidth: 400, minHeight: 300 },
  'appstore':      { title: 'AppStore.exe',          icon: '⚙️', defaultWidth: 500, defaultHeight: 400, minWidth: 300, minHeight: 200 },
  'yayapp':        { title: 'YAY.app',                 icon: '✨', defaultWidth: 520, defaultHeight: 640, minWidth: 440, minHeight: 500 },
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
    { id: 'appstore', name: 'AppStore.exe', icon: '⚙️' },
    { id: 'fileexplorer', name: 'FileExplorer.sys', icon: '📁' },
    { id: 'account', name: 'Account.exe', icon: '💳' },
    { id: 'controlcenter', name: 'ControlCenter.app', icon: '⚙️' },
    { id: 'yayapp', name: 'YAY.app', icon: '✨' },
    { id: 'responderstudio', name: 'ResponderStudio.lnk', icon: '🤖' },
    { id: 'groupmanager', name: 'GroupManager.app', icon: '👥' },
    { id: 'taskmanager', name: 'TaskManager.exe', icon: '📊' },
    { id: 'subscription', name: 'Subscription.app', icon: '💎' },
    { id: 'user-manager', name: 'UserManager.exe', icon: '👥' },
  ];

  const availableApps = ALL_APPS.filter(app => {
    // God tier gets everything
    if (clientRegistry.Package_Tier === 'God') return true;
    
    // Normal users always get File Explorer, App Store, and YAY.app
    if (app.id === 'appstore' || app.id === 'fileexplorer' || app.id === 'yayapp') return true;
    
    // UserManager is ONLY for God
    if (app.id === 'user-manager') return false;

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
              setClientRegistry(prev => ({ ...prev, ...data }));
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
      {/* Dock */}
      <DockMenu
        apps={dockApps}
        onAppClick={(id) => openApp(id as AppId, true)}
        onStartMenuToggle={() => setStartMenuOpen(prev => !prev)}
        isStartMenuOpen={startMenuOpen}
      />

      {/* Lock Screen Overlay */}
      {isExpired && <LockScreen onUnlock={() => {}} />}
    </div>
  );
}
