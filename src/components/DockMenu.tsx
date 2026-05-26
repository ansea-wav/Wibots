'use client';

export interface DockApp {
  id: string;
  name: string;
  icon: string;
  isOpen: boolean;
}

interface DockMenuProps {
  apps: DockApp[];
  onAppClick: (appId: string) => void;
  onStartMenuToggle: () => void;
  isStartMenuOpen: boolean;
}

export default function DockMenu({ apps, onAppClick, onStartMenuToggle, isStartMenuOpen }: DockMenuProps) {
  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1 px-3 py-2 rounded-2xl"
      style={{
        zIndex: 'var(--z-taskbar)',
        background: 'var(--surface-panel)',
        backdropFilter: 'blur(30px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(30px) saturate(1.5)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: 'dockSlideUp 0.5s var(--ease-spring) 0.3s both',
      }}
    >
      {/* App Icons */}
      {apps.map((app) => (
        <div key={app.id} className="dock-icon-wrap relative group">
          {/* Tooltip */}
          <div className="dock-tooltip">{app.name}</div>

          {/* Icon Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAppClick(app.id);
            }}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-white/[0.06] hover:scale-110 active:scale-95"
            style={{
              transform: app.isOpen ? 'translateY(-2px)' : undefined,
            }}
          >
            {app.icon.startsWith('fi ') ? (
              <i className={`${app.icon} text-[20px] text-white flex items-center justify-center`} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}></i>
            ) : (
              <span className="text-2xl select-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                {app.icon}
              </span>
            )}
          </button>

          {/* Active Indicator Dot */}
          {app.isOpen && (
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[var(--neon-green)]"
              style={{ animation: 'activeIndicatorPulse 2s infinite' }} />
          )}
        </div>
      ))}

      {/* Separator */}
      <div className="w-px h-8 bg-[var(--border-subtle)] mx-1 self-center" />

      {/* Start Menu Button */}
      <div className="dock-icon-wrap relative group">
        <div className="dock-tooltip">Menu</div>
        <button
          id="start-menu-button"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onStartMenuToggle();
          }}
          className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 ${
            isStartMenuOpen ? 'bg-[var(--neon-green)]/10' : 'hover:bg-white/[0.06]'
          }`}
        >
          {/* YAY Logo as grid icon */}
          <div className="flex flex-col items-center justify-center gap-[3px]">
            <div className="flex gap-[3px]">
              <div className="w-[5px] h-[5px] rounded-[2px] bg-[var(--neon-green)] transition-colors" />
              <div className="w-[5px] h-[5px] rounded-[2px] bg-[var(--neon-green)] transition-colors" style={{ opacity: 0.7 }} />
            </div>
            <div className="flex gap-[3px]">
              <div className="w-[5px] h-[5px] rounded-[2px] bg-[var(--neon-green)] transition-colors" style={{ opacity: 0.7 }} />
              <div className="w-[5px] h-[5px] rounded-[2px] bg-[var(--neon-green)] transition-colors" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
