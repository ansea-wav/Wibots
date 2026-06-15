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
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-panel)' }}>
      {/* Header Stats */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
        <h2 className="text-lg font-bold text-white mb-3">Task Manager</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--surface-glass)' }}>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Active Windows</div>
            <div className="text-xl font-bold text-white mt-0.5">{tasks.length}</div>
          </div>
          <div className="p-2.5 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--surface-glass)' }}>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Bot Engine</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-[6px] h-[6px] rounded-full" style={{
                background: botStatus === 'ONLINE' ? 'var(--neon-green)' : botStatus === 'CONNECTING' ? 'var(--neon-amber)' : 'var(--neon-red)',
                boxShadow: botStatus === 'ONLINE' ? '0 0 6px var(--neon-green)' : 'none',
              }} />
              <span className="text-xs font-semibold text-white">{botStatus}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--surface-glass)' }}>
            <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">Uptime</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">{formatUptime(uptime)}</div>
          </div>
        </div>
      </div>

      {/* Active Windows */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-2">
          Active Windows ({tasks.length})
        </div>
        {tasks.length === 0 ? (
          <div className="text-xs text-[var(--text-tertiary)] py-4 text-center">No windows open</div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div key={task.id}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors group">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-sm flex items-center justify-center w-5 h-5 text-white">
                    {task.icon.startsWith('fi ') ? (
                      <i className={`${task.icon} text-sm`}></i>
                    ) : (
                      task.icon
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{task.title}</div>
                    <div className="text-[9px] text-[var(--text-tertiary)]">
                      {task.isMinimized ? 'Minimized' : task.isMaximized ? 'Maximized' : 'Windowed'}
                      <span className="mx-1">•</span>
                      Z: {task.zIndex}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onFocusTask(task.id)}
                    className="px-2 py-1 rounded text-[9px] text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 cursor-pointer transition-colors"
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => onCloseTask(task.id)}
                    className="px-2 py-1 rounded text-[9px] text-[var(--neon-red)] hover:bg-[var(--neon-red)]/10 cursor-pointer transition-colors"
                  >
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Processes */}
      <div className="flex-1 overflow-auto p-4">
        <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-2">
          System Processes
        </div>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
              <th className="text-left py-1.5 px-2">Process</th>
              <th className="text-right py-1.5 px-2">CPU</th>
              <th className="text-right py-1.5 px-2">Memory</th>
              <th className="text-right py-1.5 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {systemProcesses.map((proc, i) => (
              <tr key={i} className="border-t border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors">
                <td className="py-2 px-2 text-white font-mono">{proc.name}</td>
                <td className="py-2 px-2 text-right text-[var(--text-secondary)]">{proc.cpu}</td>
                <td className="py-2 px-2 text-right text-[var(--text-secondary)]">{proc.mem}</td>
                <td className="py-2 px-2 text-right">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    proc.status === 'Running' ? 'text-[var(--neon-green)] bg-[var(--neon-green)]/10' :
                    proc.status === 'Waiting' ? 'text-[var(--neon-amber)] bg-[var(--neon-amber)]/10' :
                    'text-[var(--text-tertiary)] bg-white/5'
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
  );
}
