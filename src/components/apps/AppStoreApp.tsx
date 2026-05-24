'use client';
import { useState, useEffect } from 'react';
import { ClientRegistry } from '@/lib/api';
import { apiGetAppStore, apiInstallApp } from '@/lib/api';
import { toast } from '@/components/DynamicIsland';

interface AppStoreProps {
  client: ClientRegistry;
}

interface StoreApp {
  'Nama App': string;
  'Tanggal Rilis': string;
  'Versi': string;
  'Bio': string;
}

export default function AppStoreApp({ client }: AppStoreProps) {
  const [apps, setApps] = useState<StoreApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchApps = async () => {
      try {
        const json = await apiGetAppStore();
        if (active && json.status === 'success') {
          setApps(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchApps();
    return () => { active = false; };
  }, []);

  const handleInstall = async (appId: string) => {
    setInstalling(appId);
    try {
      const data = await apiInstallApp(client.User_ID, appId);
      if (data.status === 'success') {
        toast('App Installed Successfully! Please refresh the page.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast('Failed to install: ' + data.message, 'error');
      }
    } catch (e) {
      toast('Error installing app.', 'error');
    }
    setInstalling(null);
  };

  const isInstalled = (appId: string) => {
    if (client.Package_Tier === 'God') return true;
    const installed = client.Aplikasi_terpasang ? client.Aplikasi_terpasang.split(',') : [];
    return installed.includes(appId);
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto" style={{ background: 'var(--surface-panel)' }}>
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">⚙️</span> App Store
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Discover and install powerful modules for your NetalsOS.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-tertiary)]">Loading catalog...</div>
      ) : (
        <div className="space-y-4">
          {apps.map((app, i) => {
            const appName = app['Nama App'] || (app as any)['Nama  App'] || 'Unknown App';
            return (
            <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: 'var(--surface-glass)' }}>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {appName}
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                    {app['Versi']}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">{app['Bio']}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-2 opacity-50">Released: {app['Tanggal Rilis'] ? new Date(app['Tanggal Rilis']).toLocaleDateString() : 'Unknown'}</div>
              </div>
              
              <div>
                {isInstalled(appName) ? (
                  <button disabled className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-white/50 cursor-not-allowed border border-white/10">
                    Installed
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInstall(appName)}
                    disabled={installing === appName}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {installing === appName ? 'Installing...' : 'Get / Install'}
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
