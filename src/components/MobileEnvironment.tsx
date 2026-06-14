"use client";

import { useState, useEffect } from 'react';
import type { UserMasterData, AutoResponder, BotConfig, FileEntry, ClientRegistry } from '@/lib/api';
import { 
  apiAddResponder, apiDeleteResponder, apiUpdateResponder, apiUpdateConfig, 
  apiGetSessionStatus, apiStartSession, apiStopSession,
  apiGetFiles, apiUploadFile, apiDeleteFile, apiUpdateAccount, API_BASE
} from '@/lib/api';
import BottomNav, { type MobileTab } from './BottomNav';
import MobileDashboard from './apps/MobileDashboard';
import MobileSettings from './apps/MobileSettings';
import MobileProtocols, { type ProtocolAppId } from './apps/MobileProtocols';
import DynamicIsland from './DynamicIsland';

// Mobile-specific Apps
import MobileControlCenter from './apps/mobile/MobileControlCenter';
import MobileFileExplorer from './apps/mobile/MobileFileExplorer';
import MobileTaskManager from './apps/mobile/MobileTaskManager';
import MobileGroupManager from './apps/mobile/MobileGroupManager';
import MobileUserManager from './apps/mobile/MobileUserManager';
import MobileResponderStudio from './apps/mobile/MobileResponderStudio';
import MobileSubscriptionApp from './apps/mobile/MobileSubscriptionApp';
import MobileSetupScreen from './MobileSetupScreen';

interface MobileProps {
  userData: UserMasterData;
  userId: string;
}

export default function MobileEnvironment({ userData, userId }: MobileProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('dashboard');
  const [openedProtocolApp, setOpenedProtocolApp] = useState<ProtocolAppId | null>(null);

  const [clientRegistry, setClientRegistry] = useState<ClientRegistry>(userData.registry || {} as ClientRegistry);
  const [responders, setResponders] = useState<AutoResponder[]>(userData.responders || []);
  const [config, setConfig] = useState<BotConfig>(userData.config || {} as BotConfig);
  const [botStatus, setBotStatus] = useState<'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SCAN_QR'>('OFFLINE');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uptime, setUptime] = useState(0);

  // Uptime ticker
  useEffect(() => {
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Files
  useEffect(() => {
    let active = true;
    apiGetFiles(userId).then(res => {
      if (active && res.status === 'success' && res.data) {
        setFiles(res.data);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [userId]);

  // Poll Bot Status
  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      try {
        const res = await apiGetSessionStatus(userId);
        if (active && res.status === 'success' && res.data) {
          setBotStatus(res.data.state);
          setQrCode(res.data.qr || null);
        }
      } catch (e) {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [userId]);

  // Responder Handlers
  const handleAddResponder = async (data: Partial<AutoResponder>) => {
    const res = await apiAddResponder(userId, data);
    if (res.status === 'success') {
      setResponders(prev => [...prev, res.data]);
    }
  };
  const handleDeleteResponder = async (id: string) => {
    await apiDeleteResponder(userId, id);
    setResponders(prev => prev.filter(r => r.Response_ID !== id));
  };
  const handleUpdateResponder = async (id: string, data: Partial<AutoResponder>) => {
    await apiUpdateResponder(userId, id, data);
    setResponders(prev => prev.map(r => r.Response_ID === id ? { ...r, ...data } : r));
  };

  // Config Handlers
  const handleToggleConfig = async (field: keyof BotConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    await apiUpdateConfig(userId, { [field]: value });
  };
  const handleUpdateWelcomeText = async (text: string) => {
    setConfig(prev => ({ ...prev, Custom_Welcome_Text: text }));
    await apiUpdateConfig(userId, { Custom_Welcome_Text: text });
  };

  const handleStartBot = async () => {
    setBotStatus('CONNECTING');
    await apiStartSession(userId);
  };
  const handleStopBot = async () => {
    setBotStatus('OFFLINE');
    await apiStopSession(userId);
  };

  // GroupManager & Account Handlers
  const handleUpdateAccount = async (data: Partial<ClientRegistry>) => {
    await apiUpdateAccount(userId, data);
    setClientRegistry(prev => ({ ...prev, ...data }));
  };

  // FileExplorer Handlers
  const handleFileUpload = async (file: File) => {
    const res = await apiUploadFile(userId, file);
    if (res.status === 'success') {
      setFiles(prev => [...prev, {
        filename: res.data.filename,
        size: res.data.size,
        modified: new Date().toISOString(),
        url: res.data.url,
      }]);
    }
  };
  const handleFileDelete = async (filename: string) => {
    await apiDeleteFile(userId, filename);
    setFiles(prev => prev.filter(f => f.filename !== filename));
  };
  const handleCopyUrl = (url: string) => {}; // Just for callback

  // Helper to wrap apps in a mobile-friendly container
  const renderAppWrapper = (children: React.ReactNode, title?: string, onBack?: () => void) => (
    <div className="absolute inset-0 flex flex-col bg-[#111113]">
      {onBack && (
        <div className="px-4 pb-4 pt-6 flex items-center gap-3 shrink-0 border-b border-white/5">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-colors active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          {title && <span className="font-bold text-xl text-white">{title}</span>}
        </div>
      )}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    if (tab !== 'protocols') {
      setOpenedProtocolApp(null);
    }
  };

  const renderProtocolContent = () => {
    if (!openedProtocolApp) {
      return <MobileProtocols onOpenApp={setOpenedProtocolApp} />;
    }
    
    const backFn = () => setOpenedProtocolApp(null);
    switch (openedProtocolApp) {
      case 'controlcenter': 
        return renderAppWrapper(
          <MobileControlCenter client={clientRegistry} config={config} onToggle={handleToggleConfig} onUpdateWelcomeText={handleUpdateWelcomeText} botStatus={botStatus} qrCode={qrCode} onStartBot={handleStartBot} onStopBot={handleStopBot} />, 
          'Control Center', backFn
        );
      case 'fileexplorer': 
        return renderAppWrapper(
          <MobileFileExplorer client={clientRegistry} files={files} onUpload={handleFileUpload} onDelete={handleFileDelete} onCopyUrl={handleCopyUrl} apiBase={API_BASE} />, 
          'File Explorer', backFn
        );
      case 'taskmanager': 
        return renderAppWrapper(
          <MobileTaskManager tasks={[]} onFocusTask={() => {}} onCloseTask={() => {}} botStatus={botStatus} uptime={uptime} />, 
          'Task Manager', backFn
        );
      case 'groupmanager': 
        return renderAppWrapper(
          <MobileGroupManager client={clientRegistry} onUpdate={handleUpdateAccount} />, 
          'Group Manager', backFn
        );
      case 'user-manager': 
        return renderAppWrapper(
          <MobileUserManager apiBase={API_BASE} />, 
          'User Manager', backFn
        );
      default: return null;
    }
  };

  const isNewMember = !clientRegistry.Group_1 && !clientRegistry.Group_2 && !clientRegistry.Group_3 && !clientRegistry.Group_4 && !clientRegistry.Group_5;

  if (isNewMember) {
    return (
      <MobileSetupScreen 
        client={clientRegistry} 
        onUpdate={handleUpdateAccount} 
        onComplete={() => window.location.reload()} 
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-[#111113] overflow-hidden text-white flex flex-col">
      <DynamicIsland />
      {/* Content Area */}
      <div className="flex-1 relative w-full h-full">
        {activeTab === 'dashboard' && <MobileDashboard userData={{...userData, registry: clientRegistry}} />}
        {activeTab === 'protocols' && renderProtocolContent()}
        {activeTab === 'responder' && renderAppWrapper(
          <MobileResponderStudio client={clientRegistry} responders={responders} onAdd={handleAddResponder} onDelete={handleDeleteResponder} onUpdate={handleUpdateResponder} />,
          'Responder Studio'
        )}
        {activeTab === 'earn' && renderAppWrapper(
          <MobileSubscriptionApp client={clientRegistry} />,
          'Subscription'
        )}
        {activeTab === 'settings' && <MobileSettings />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
