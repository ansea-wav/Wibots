'use client';
import { useState, useEffect } from 'react';
import type { UserMasterData, ClientRegistry, BotConfig, AutoResponder, FileEntry } from '@/lib/api';
import { 
  apiGetSessionStatus, apiStartSession, apiStopSession,
  apiUpdateConfig, apiAddResponder, apiDeleteResponder, apiUpdateResponder,
  apiUpdateAccount, apiGetFiles, apiUploadFile, apiDeleteFile, API_BASE
} from '@/lib/api';

import DashboardHome from './apps/DashboardHome';
import ControlCenterApp from './apps/ControlCenterApp';
import ResponderStudioApp from './apps/ResponderStudioApp';
import GroupManagerApp from './apps/GroupManagerApp';
import TaskManagerApp from './apps/TaskManagerApp';
import FileExplorerApp from './apps/FileExplorerApp';
import OnboardingScreen from './OnboardingScreen';

interface DashboardProps {
  userData: UserMasterData;
  userId: string;
}

type Tab = 'dashboard' | 'control' | 'responder' | 'group' | 'task' | 'files';

export default function DashboardLayout({ userData, userId }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // States
  const [clientRegistry, setClientRegistry] = useState<ClientRegistry>(userData.registry || {} as ClientRegistry);
  const [config, setConfig] = useState<BotConfig>(userData.config || {} as BotConfig);
  const [responders, setResponders] = useState<AutoResponder[]>(userData.responders || []);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [botStatus, setBotStatus] = useState<'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SCAN_QR'>('OFFLINE');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [uptime, setUptime] = useState(0);

  // Uptime ticker
  useEffect(() => {
    const interval = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Handlers
  const handleToggleConfig = async (field: keyof BotConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    await apiUpdateConfig(userId, { [field]: value });
  };
  const handleUpdateWelcomeText = async (text: string) => {
    setConfig(prev => ({ ...prev, Custom_Welcome_Text: text }));
    await apiUpdateConfig(userId, { Custom_Welcome_Text: text });
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
    { id: 'control', label: 'Control Center', icon: 'settings' },
    { id: 'responder', label: 'Responder Studio', icon: 'robot_2' },
    { id: 'group', label: 'Group Manager', icon: 'group' },
    { id: 'task', label: 'Task Manager', icon: 'analytics' },
    { id: 'files', label: 'File Explorer', icon: 'folder' },
  ];

  const handleOnboardingComplete = async () => {
    try {
      const { apiGetAccount } = await import('@/lib/api');
      const acc = await apiGetAccount(userId);
      if (acc.status === 'success' && acc.data) {
        setClientRegistry(acc.data);
      } else {
        // Fallback: reload page
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  if (!clientRegistry.Group_1) {
    return <OnboardingScreen userId={userId} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-white overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Pterodactyl Style) */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#111113] border-r border-white/5 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <img src="/icons.png" alt="Wazle" className="h-8 w-8 rounded-lg border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] mr-3 shrink-0" />
          <span className="font-bold text-lg tracking-wide">Wazle Dash</span>
        </div>

        {/* Server Selection / Profile placeholder */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Server</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{clientRegistry.Group_1 ? 'Premium Node' : 'Basic Node'}</span>
            <span className={`w-2 h-2 rounded-full ${botStatus === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Info Bottom */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-3 shrink-0">
          <a href="https://wazle.my.id" className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-semibold transition-colors">
            <span className="material-symbols-outlined text-[18px]">public</span>
            Wazle Home
          </a>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {clientRegistry.WhatsApp_Owner?.toString().slice(-2) || 'WA'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">{clientRegistry.WhatsApp_Owner}</span>
              <span className="text-[10px] text-white/40 truncate">{clientRegistry.Package_Tier} Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#111113]/80 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-semibold tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              API Connected
            </div>
            <button className="text-white/40 hover:text-white transition-colors" onClick={() => {
              localStorage.removeItem('yay_user_phone');
              window.location.reload();
            }}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0a0f]">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'dashboard' && (
              <DashboardHome 
                client={clientRegistry} 
                config={config} 
                responders={responders} 
                botStatus={botStatus} 
              />
            )}
            {activeTab === 'control' && (
              <ControlCenterApp 
                client={clientRegistry} 
                config={config} 
                onToggle={handleToggleConfig}
                onUpdateWelcomeText={handleUpdateWelcomeText}
                botStatus={botStatus}
                qrCode={qrCode}
                onStartBot={async () => { setBotStatus('CONNECTING'); await apiStartSession(userId); }}
                onStopBot={async () => { setBotStatus('OFFLINE'); await apiStopSession(userId); }}
              />
            )}
            {activeTab === 'responder' && (
              <ResponderStudioApp 
                client={clientRegistry}
                responders={responders}
                files={files}
                apiBase={API_BASE}
                onAdd={async (d) => {
                  const res = await apiAddResponder(userId, d);
                  if (res.status === 'success') setResponders(p => [...p, res.data]);
                }}
                onUpdate={async (id, d) => {
                  await apiUpdateResponder(userId, id, d);
                  setResponders(p => p.map(r => r.Response_ID === id ? { ...r, ...d } : r));
                }}
                onDelete={async (id) => {
                  await apiDeleteResponder(userId, id);
                  setResponders(p => p.filter(r => r.Response_ID !== id));
                }}
              />
            )}
            {activeTab === 'group' && (
              <GroupManagerApp 
                client={clientRegistry}
                onUpdate={async (d) => {
                  await apiUpdateAccount(userId, d);
                  setClientRegistry(p => ({ ...p, ...d }));
                }}
              />
            )}
            {activeTab === 'task' && (
              <TaskManagerApp 
                tasks={[]}
                onFocusTask={() => {}}
                onCloseTask={() => {}}
                botStatus={botStatus}
                uptime={uptime}
              />
            )}
            {activeTab === 'files' && (
              <FileExplorerApp 
                files={files}
                client={clientRegistry}
                apiBase={API_BASE}
                onUpload={async (f) => {
                  const res = await apiUploadFile(userId, f);
                  if (res.status === 'success') {
                    setFiles(p => [...p, { filename: res.data.filename, size: res.data.size, modified: new Date().toISOString(), url: res.data.url }]);
                  }
                }}
                onDelete={async (name) => {
                  await apiDeleteFile(userId, name);
                  setFiles(p => p.filter(f => f.filename !== name));
                }}
                onCopyUrl={(url) => navigator.clipboard.writeText(url)}
              />
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
