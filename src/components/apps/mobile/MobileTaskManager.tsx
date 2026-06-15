'use client';

interface TaskInfo {
  id: string;
  title: string;
  icon: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface TaskManagerProps {
  tasks: TaskInfo[];
  onFocusTask: (taskId: string) => void;
  onCloseTask: (taskId: string) => void;
  botStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'SCAN_QR';
  uptime: number;
}

export default function MobileTaskManager({ botStatus, uptime }: TaskManagerProps) {
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const systemProcesses = [
    { name: 'wazle-kernel.sys', cpu: '0.2%', mem: '12 MB', status: 'Running', icon: 'memory' },
    { name: 'window-manager.exe', cpu: '1.1%', mem: '24 MB', status: 'Running', icon: 'grid_view' },
    { name: 'gas-bridge.svc', cpu: '0.5%', mem: '18 MB', status: 'Running', icon: 'cloud_sync' },
    { name: 'baileys-engine.exe', cpu: botStatus === 'ONLINE' ? '3.4%' : '0.0%', mem: botStatus === 'ONLINE' ? '86 MB' : '4 MB', status: botStatus === 'ONLINE' ? 'Running' : 'Idle', icon: 'smart_toy' },
    { name: 'cache-daemon.sys', cpu: '0.1%', mem: '32 MB', status: 'Running', icon: 'storage' },
    { name: 'cron-scheduler.svc', cpu: '0.0%', mem: '8 MB', status: 'Waiting', icon: 'schedule' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111113]">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4 px-4 mt-2 mb-6">
        <div className="p-4 rounded-3xl border border-white/5 bg-[#1a1a1c] shadow-lg text-center">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Bot Engine</div>
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl" style={{ color: botStatus === 'ONLINE' ? '#22c55e' : botStatus === 'CONNECTING' ? '#f59e0b' : '#ef4444' }}>
              robot_2
            </span>
            <span className="text-xl font-bold text-white">{botStatus}</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl border border-white/5 bg-[#1a1a1c] shadow-lg text-center">
          <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Uptime</div>
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-blue-400">timer</span>
            <span className="text-xl font-bold font-mono text-white">{formatUptime(uptime)}</span>
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="flex-1 px-4 overflow-y-auto pb-32">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">System Processes</h3>
        
        <div className="space-y-3">
          {systemProcesses.map((proc, i) => (
            <div key={i} className="p-4 rounded-2xl border border-white/5 bg-[#1a1a1c] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                <span className="material-symbols-outlined text-2xl">{proc.icon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white truncate">{proc.name}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">speed</span> {proc.cpu}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">memory</span> {proc.mem}</span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                  proc.status === 'Running' ? 'bg-green-500/20 text-green-500' :
                  proc.status === 'Idle' ? 'bg-white/10 text-white/50' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {proc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
