'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isClosing: boolean;
}

interface WindowFrameProps {
  windowState: WindowState;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  children: React.ReactNode;
}

export default function WindowFrame({
  windowState,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  children,
}: WindowFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [prevBounds, setPrevBounds] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      onFocus(windowState.id);
    },
    [onFocus, windowState.id]
  );

  // --- Drag ---
  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      if (windowState.isMaximized) return;
      e.preventDefault();
      isDragging.current = true;
      dragOffset.current = {
        x: e.clientX - windowState.x,
        y: e.clientY - windowState.y,
      };
      onFocus(windowState.id);

      const handleMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        
        let newX = ev.clientX - dragOffset.current.x;
        let newY = ev.clientY - dragOffset.current.y;

        // Cegah window ditarik melewati top bar (misal tingginya 28px)
        if (newY < 28) newY = 28;

        // Cegah window ditarik terlalu jauh keluar layar
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 100;
        if (newX > maxX) newX = maxX;
        if (newX < -windowState.width + 100) newX = -windowState.width + 100;
        if (newY > maxY) newY = maxY;

        onMove(windowState.id, newX, newY);
      };
      const handleUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [windowState.id, windowState.x, windowState.y, windowState.isMaximized, onFocus, onMove]
  );

  // --- Resize ---
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      if (windowState.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = windowState.width;
      const startH = windowState.height;

      const handleMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const newW = Math.max(windowState.minWidth, startW + (ev.clientX - startX));
        const newH = Math.max(windowState.minHeight, startH + (ev.clientY - startY));
        onResize(windowState.id, newW, newH);
      };
      const handleUp = () => {
        isResizing.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [windowState, onResize]
  );

  // Toggle maximize
  const toggleMaximize = useCallback(() => {
    if (windowState.isMaximized) {
      onMove(windowState.id, prevBounds.x, prevBounds.y);
      onResize(windowState.id, prevBounds.w, prevBounds.h);
    } else {
      setPrevBounds({
        x: windowState.x,
        y: windowState.y,
        w: windowState.width,
        h: windowState.height,
      });
    }
    onMaximize(windowState.id);
  }, [windowState, prevBounds, onMaximize, onMove, onResize]);

  // Double-click title bar to maximize
  const handleTitleDoubleClick = useCallback(() => {
    toggleMaximize();
  }, [toggleMaximize]);

  if (windowState.isMinimized) return null;

  const style: React.CSSProperties = windowState.isMaximized
    ? {
        top: 28,
        left: 0,
        width: '100%',
        height: 'calc(100% - 28px - 64px)',
        zIndex: windowState.zIndex,
        borderRadius: 0,
      }
    : {
        top: windowState.y,
        left: windowState.x,
        width: windowState.width,
        height: windowState.height,
        zIndex: windowState.zIndex,
      };

  return (
    <div
      ref={frameRef}
      className={`window-frame ${windowState.isClosing ? 'closing' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar"
        onMouseDown={startDrag}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div className="window-titlebar-title">
          <span className="text-sm flex items-center justify-center text-white">
            {windowState.icon.startsWith('fi ') ? (
              <i className={`${windowState.icon} text-[12px]`}></i>
            ) : (
              windowState.icon
            )}
          </span>
          <span>{windowState.title}</span>
        </div>
        <div className="window-controls">
          <button
            className="window-control-btn window-control-minimize"
            onClick={(e) => { e.stopPropagation(); onMinimize(windowState.id); }}
            title="Minimize"
          />
          <button
            className="window-control-btn window-control-maximize"
            onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
            title="Maximize"
          />
          <button
            id={`window-control-close-${windowState.id}`}
            className="window-control-btn window-control-close"
            onClick={(e) => { e.stopPropagation(); onClose(windowState.id); }}
            title="Close"
          />
        </div>
      </div>

      {/* Body */}
      <div className="window-body">{children}</div>

      {/* Resize Handle */}
      {!windowState.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize"
          onMouseDown={startResize}
          style={{ zIndex: 10 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" className="absolute bottom-1 right-1 opacity-20">
            <path d="M11 1L1 11M11 5L5 11M11 9L9 11" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
}
