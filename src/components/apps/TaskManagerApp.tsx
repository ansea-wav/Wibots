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

export default function TaskManagerApp({ tasks, onFocusTask, onCloseTask, botStatus, uptime }: TaskManagerProps) {
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulated system processes
  const systemProcesses = [
    { name: 'yay-kernel.sys', cpu: '0.2%', mem: '12 MB', status: 'Running' },
    { name: 'window-manager.exe', cpu: '1.1%', mem: '24 MB', status: 'Running' },
    { name: 'server-bridge.svc', cpu: '0.5%', mem: '18 MB', status: 'Running' },
    { name: 'baileys-engine.exe', cpu: botStatus === 'ONLINE' ? '3.4%' : '0.0%', mem: botStatus === 'ONLINE' ? '86 MB' : '4 MB', status: botStatus === 'ONLINE' ? 'Running' : 'Idle' },
    { name: 'cache-daemon.sys', cpu: '0.1%', mem: '32 MB', status: 'Running' },
    { name: 'cron-scheduler.svc', cpu: '0.0%', mem: '8 MB', status: 'Waiting' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      
      {/* Header Stats Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-4">
        <div className="text-xs text-zinc-400 uppercase tracking-widest font-black">
          Engine Overview
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-zinc-950 bg-white shadow-[2px_2px_0px_#09090b]">
            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Active Windows</div>
            <div className="text-xl font-black text-zinc-950 mt-0.5">{tasks.length}</div>
          </div>
          
          <div className="p-4 rounded-2xl border border-zinc-950 bg-white shadow-[2px_2px_0px_#09090b]">
            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Bot Engine</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${botStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{botStatus}</span>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl border border-zinc-950 bg-white shadow-[2px_2px_0px_#09090b]">
            <div className="text-[9px] text-zinc-400 uppercase tracking-widest font-black">Uptime</div>
            <div className="text-sm font-mono font-black text-zinc-950 mt-1">{formatUptime(uptime)}</div>
          </div>
        </div>
      </div>

      {/* Active Windows Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-4">
        <div className="text-xs text-zinc-400 uppercase tracking-widest font-black">
          Active Windows ({tasks.length})
        </div>
        {tasks.length === 0 ? (
          <div className="text-xs font-bold text-zinc-400 py-4 text-center">No windows open</div>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div key={task.id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-300 transition-all group">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-sm flex items-center justify-center w-5 h-5">
                    {task.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-950 truncate">{task.title}</div>
                    <div className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                      {task.isMinimized ? 'Minimized' : task.isMaximized ? 'Maximized' : 'Windowed'}
                      <span className="mx-1">•</span>
                      Z-Index: {task.zIndex}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onFocusTask(task.id)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 transition-colors cursor-pointer"
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => onCloseTask(task.id)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-300 transition-colors cursor-pointer"
                  >
                    End Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Processes Card */}
      <div className="bg-[#fdfcf7] border border-zinc-950 rounded-[2.2rem] p-6 shadow-[4px_4px_0px_#09090b] space-y-4">
        <div className="text-xs text-zinc-400 uppercase tracking-widest font-black">
          System Processes
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/60 text-[9px] text-zinc-400 uppercase tracking-widest font-black bg-zinc-50/50">
                <th className="py-2.5 px-3">Process</th>
                <th className="py-2.5 px-3 text-right">CPU</th>
                <th className="py-2.5 px-3 text-right">Memory</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {systemProcesses.map((proc, i) => (
                <tr key={i} className="border-b border-zinc-200/30 hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3 px-3 text-zinc-950 font-bold text-xs">{proc.name}</td>
                  <td className="py-3 px-3 text-right text-zinc-500 font-semibold">{proc.cpu}</td>
                  <td className="py-3 px-3 text-right text-zinc-500 font-semibold">{proc.mem}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      proc.status === 'Running' ? 'text-emerald-700 bg-emerald-50 border-emerald-200/50' :
                      proc.status === 'Waiting' ? 'text-amber-700 bg-amber-50 border-amber-200/50' :
                      'text-zinc-500 bg-zinc-100 border-zinc-200'
                    }`}>
                      {proc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
