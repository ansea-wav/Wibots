'use client';
import { useState, useEffect } from 'react';
import type { UserMasterData, ClientRegistry, BotConfig, AutoResponder, FileEntry } from '@/lib/api';
import { 
  apiGetSessionStatus, apiStartSession, apiStopSession,
  apiUpdateConfig, apiAddResponder, apiDeleteResponder, apiUpdateResponder,
  apiUpdateAccount, apiGetFiles, apiUploadFile, apiDeleteFile, API_BASE
} from '@/lib/api';
import { eraseSharedCookie } from '@/lib/cookies';

import DashboardHome from './apps/DashboardHome';
import ControlCenterApp from './apps/ControlCenterApp';
import ResponderStudioApp from './apps/ResponderStudioApp';
import GroupManagerApp from './apps/GroupManagerApp';
import TaskManagerApp from './apps/TaskManagerApp';
import FileExplorerApp from './apps/FileExplorerApp';
import ApiKeyApp from './apps/ApiKeyApp';
import AccountingApp from './apps/AccountingApp';
import SubscriptionApp from './apps/SubscriptionApp';
import OnboardingScreen from './OnboardingScreen';

interface DashboardProps {
  userData: UserMasterData;
  userId: string;
}

type Tab = 'dashboard' | 'control' | 'responder' | 'group' | 'task' | 'files' | 'apikey' | 'accounting' | 'pricing';

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
  const [tvState, setTvState] = useState<'on' | 'off' | 'idle'>('on');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTvState('idle');
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  const handleTvTurnOff = (callback: () => void) => {
    setTvState('off');
    setTimeout(() => {
      callback();
    }, 750);
  };

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
    { id: 'apikey', label: 'API Key', icon: 'vpn_key' },
    { id: 'accounting', label: 'Accounting', icon: 'manage_accounts' },
    { id: 'pricing', label: 'Pricing', icon: 'payments' },
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

  const wrapperClass = tvState === 'on' ? 'crt-screen-on' : tvState === 'off' ? 'crt-screen-off' : '';

  return (
    <div className={`relative flex h-full w-full bg-[var(--surface-dark)] text-[var(--text-primary)] overflow-hidden font-sans ${wrapperClass}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          background-color: #000000 !important;
        }
        @keyframes crt-turn-on {
          0% {
            transform: scaleY(0.005) scaleX(0);
            background-color: #ffffff;
            filter: brightness(3);
          }
          40% {
            transform: scaleY(0.005) scaleX(1.1);
            background-color: #ffffff;
            filter: brightness(2);
          }
          70% {
            transform: scaleY(1.05) scaleX(1);
            background-color: #09090b;
            filter: brightness(1.2);
          }
          100% {
            transform: scaleY(1) scaleX(1);
            background-color: transparent;
            filter: brightness(1);
          }
        }

        @keyframes crt-turn-off {
          0% {
            transform: scaleY(1) scaleX(1);
            background-color: transparent;
            filter: brightness(1);
          }
          30% {
            transform: scaleY(1.05) scaleX(1);
            background-color: #09090b;
            filter: brightness(1.2);
          }
          60% {
            transform: scaleY(0.005) scaleX(1.1);
            background-color: #ffffff;
            filter: brightness(2);
          }
          100% {
            transform: scaleY(0) scaleX(0);
            background-color: #ffffff;
            filter: brightness(5);
          }
        }

        .crt-screen-on {
          animation: crt-turn-on 0.75s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          transform-origin: center;
        }

        .crt-screen-off {
          animation: crt-turn-off 0.75s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          transform-origin: center;
        }

        .crt-scanlines::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          background-size: 100% 4px;
          z-index: 999999;
          pointer-events: none;
        }
      `}} />

      {/* TV Scanlines Overlay during transition */}
      {(tvState === 'on' || tvState === 'off') && (
        <div className="absolute inset-0 z-[999999] pointer-events-none crt-scanlines bg-black/10" />
      )}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Sleek Dark Theme) */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#131317] border-r border-zinc-800/80 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo Area (Cream square logo box on top left as per mock image) */}
        <div className="h-20 flex items-center px-6 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#fbf4e5] flex items-center justify-center mr-3 shrink-0 shadow-sm border border-[#faf3dd]">
            <span className="font-extrabold text-[#1c1917] text-base">W</span>
          </div>
          <span className="font-black text-white text-lg tracking-tight">Wazle Dash</span>
        </div>

        {/* Server Selection / Profile placeholder */}
        <div className="mx-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] mb-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">Server Node</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300">{clientRegistry.Group_1 ? 'Premium Node' : 'Basic Node'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as Tab); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Info Bottom */}
        <div className="p-4 border-t border-zinc-800/80 flex flex-col gap-3 shrink-0">
          <a 
            href="https://wazle.my.id" 
            onClick={(e) => {
              e.preventDefault();
              handleTvTurnOff(() => {
                window.location.href = "https://wazle.my.id";
              });
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all border border-zinc-850"
          >
            <span className="material-symbols-outlined text-[16px]">public</span>
            Wazle Home
          </a>
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-white uppercase">
              {clientRegistry.WhatsApp_Owner?.toString().slice(-2) || 'WA'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">+{clientRegistry.WhatsApp_Owner}</span>
              <span className="text-[10px] text-zinc-500 font-semibold truncate">{clientRegistry.Package_Tier} Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Navbar (Light Mode matching mock) */}
        <header className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg font-black tracking-tight text-zinc-900">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/50 text-[10px] font-bold text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-950"></span>
              API Connected
            </div>
            <button 
              className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer" 
              onClick={() => {
                handleTvTurnOff(() => {
                  localStorage.removeItem('yay_user_phone');
                  eraseSharedCookie('yay_user_phone');
                  window.location.reload();
                });
              }} 
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* Content Viewport (Default Light Surface Dark background) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--surface-dark)]">
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
            {activeTab === 'apikey' && (
              <ApiKeyApp client={clientRegistry} />
            )}
            {activeTab === 'accounting' && (
              <AccountingApp client={clientRegistry} />
            )}
            {activeTab === 'pricing' && (
              <SubscriptionApp client={clientRegistry} />
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
