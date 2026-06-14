'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKeyboard } from '@/lib/KeyboardContext';

// --- KEYBOARD LAYOUTS ---

const ALPHABET_LOWER = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '{backspace}'],
  ['{mode}', ',', '{space}', '.', '{enter}']
];

const ALPHABET_UPPER = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['{shift}', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '{backspace}'],
  ['{mode}', ',', '{space}', '.', '{enter}']
];

const NUMBERS_NORMAL = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '-', '+', '(', ')'],
  ['{shift}', '*', '"', "'", ':', ';', '!', '?', '{backspace}'],
  ['{mode}', ',', '{space}', '.', '{enter}']
];

const NUMBERS_UPPERSCAPE = [
  ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰'],
  ['∞', '≈', '≠', '∑', '∆', 'π', 'Ω', 'µ', '§'],
  ['{shift}', '[', ']', '{', '}', '<', '>', '\\', '{backspace}'],
  ['{mode}', ',', '{space}', '.', '{enter}']
];

export default function VirtualKeyboard() {
  const { isActive, activeInput, closeKeyboard, insertText, handleBackspace, setUseNativeKeyboard, useNativeKeyboard, clearAll } = useKeyboard();
  
  // States
  const [mode, setMode] = useState<'abc' | '123'>('abc');
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [translating, setTranslating] = useState(false);

  // Refs for Spacebar Swipe
  const spaceTouchStartRef = useRef<{ x: number; selectionStart: number } | null>(null);
  const isSpaceDraggingRef = useRef<boolean>(false);

  // Refs for Backspace Long Press
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isBackspaceLongPressRef = useRef<boolean>(false);

  // Handlers for Spacebar Drag
  const handleSpaceTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!activeInput) return;
    const touch = e.touches[0];
    spaceTouchStartRef.current = {
      x: touch.clientX,
      selectionStart: activeInput.selectionStart ?? activeInput.value.length
    };
    isSpaceDraggingRef.current = false;
    e.currentTarget.classList.add('scale-[0.96]', 'bg-white/25');
  };

  const handleSpaceTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!activeInput || !spaceTouchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - spaceTouchStartRef.current.x;
    
    if (!isSpaceDraggingRef.current && Math.abs(deltaX) > 8) {
      isSpaceDraggingRef.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
    }

    if (isSpaceDraggingRef.current) {
      const charOffset = Math.round(deltaX / 12);
      const newPos = Math.max(0, Math.min(activeInput.value.length, spaceTouchStartRef.current.selectionStart + charOffset));
      activeInput.setSelectionRange(newPos, newPos);
    }
  };

  const handleSpaceTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('scale-[0.96]', 'bg-white/25');
    
    if (!isSpaceDraggingRef.current) {
      insertText(' ');
    }
    
    spaceTouchStartRef.current = null;
    isSpaceDraggingRef.current = false;
  };

  const handleSpaceMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    insertText(' ');
  };

  // Handlers for Backspace Long Press
  const handleBackspaceTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('scale-[0.92]', 'bg-white/25');
    isBackspaceLongPressRef.current = false;

    handleBackspace();
    if (navigator.vibrate) navigator.vibrate(15);

    backspaceTimerRef.current = setTimeout(() => {
      isBackspaceLongPressRef.current = true;
      if (clearAll) clearAll();
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    }, 500);
  };

  const handleBackspaceTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('scale-[0.92]', 'bg-white/25');
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  const handleBackspaceTouchCancel = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('scale-[0.92]', 'bg-white/25');
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  const handleBackspaceMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    isBackspaceLongPressRef.current = false;
    handleBackspace();
    if (navigator.vibrate) navigator.vibrate(15);

    backspaceTimerRef.current = setTimeout(() => {
      isBackspaceLongPressRef.current = true;
      if (clearAll) clearAll();
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    }, 500);
  };

  const handleBackspaceMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  const handleBackspaceMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  // Entrance animation logic
  useEffect(() => {
    if (isActive && !useNativeKeyboard) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isActive, useNativeKeyboard]);

  const handleKeyPress = (key: string) => {
    if (navigator.vibrate) navigator.vibrate(15); // Haptic feedback

    switch (key) {
      case '{shift}':
        if (isShift) {
          setIsShift(false);
          setIsCaps(true);
        } else if (isCaps) {
          setIsCaps(false);
          setIsShift(false);
        } else {
          setIsShift(true);
        }
        break;
      case '{backspace}':
        handleBackspace();
        break;
      case '{enter}':
        if (activeInput) {
          const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
          activeInput.dispatchEvent(event);
          if (activeInput.tagName === 'INPUT') closeKeyboard();
          else insertText('\\n');
        }
        break;
      case '{space}':
        insertText(' ');
        break;
      case '{mode}':
        setMode(prev => prev === 'abc' ? '123' : 'abc');
        setIsShift(false);
        break;
      default:
        insertText(key);
        // Auto unshift if not caps lock
        if (isShift && !isCaps) {
          setIsShift(false);
        }
        break;
    }
  };

  const handleUseNativeKeyboard = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (activeInput) {
      setUseNativeKeyboard(true);
      activeInput.removeAttribute('inputmode');
      activeInput.blur();
      setTimeout(() => activeInput.focus(), 50);
    }
  };

  const renderKey = (key: string, uniqueId: string) => {
    let display: React.ReactNode = key;
    let isSpecial = false;
    let flexBasis = 'flex-1';
    
    if (key === '{shift}') {
      display = isCaps ? (
        <i className="fi fi-sr-arrow-up-to-line text-[16px] flex items-center justify-center"></i>
      ) : isShift ? (
        <i className="fi fi-sr-arrow-up text-[16px] flex items-center justify-center"></i>
      ) : (
        <i className="fi fi-rr-arrow-up text-[16px] flex items-center justify-center"></i>
      );
      flexBasis = 'flex-[1.5] max-w-[15%]';
      isSpecial = true;
    } else if (key === '{backspace}') {
      display = <i className="fi fi-rr-backspace text-[16px] flex items-center justify-center"></i>;
      flexBasis = 'flex-[1.5] max-w-[15%]';
      isSpecial = true;
    } else if (key === '{enter}') {
      display = <i className="fi fi-rr-arrow-turn-down-left text-[16px] flex items-center justify-center"></i>;
      flexBasis = 'flex-[1.5] max-w-[15%]';
      isSpecial = true;
    } else if (key === '{mode}') {
      display = <span className="text-[12px] font-bold tracking-widest">{mode === 'abc' ? '?123' : 'ABC'}</span>;
      flexBasis = 'flex-[1.5] max-w-[15%]';
      isSpecial = true;
    } else if (key === '{space}') {
      display = 'Space';
      flexBasis = 'flex-[4] max-w-[40%]';
    }

    // Set custom event handlers based on the key
    let onTouchStartHandler: React.TouchEventHandler<HTMLButtonElement>;
    let onTouchMoveHandler: React.TouchEventHandler<HTMLButtonElement> | undefined = undefined;
    let onTouchEndHandler: React.TouchEventHandler<HTMLButtonElement>;
    let onTouchCancelHandler: React.TouchEventHandler<HTMLButtonElement> | undefined = undefined;

    let onMouseDownHandler: React.MouseEventHandler<HTMLButtonElement>;
    let onMouseUpHandler: React.MouseEventHandler<HTMLButtonElement> | undefined = undefined;
    let onMouseLeaveHandler: React.MouseEventHandler<HTMLButtonElement> | undefined = undefined;

    if (key === '{space}') {
      onTouchStartHandler = handleSpaceTouchStart;
      onTouchMoveHandler = handleSpaceTouchMove;
      onTouchEndHandler = handleSpaceTouchEnd;
      onTouchCancelHandler = handleSpaceTouchEnd;

      onMouseDownHandler = handleSpaceMouseDown;
    } else if (key === '{backspace}') {
      onTouchStartHandler = handleBackspaceTouchStart;
      onTouchEndHandler = handleBackspaceTouchEnd;
      onTouchCancelHandler = handleBackspaceTouchCancel;

      onMouseDownHandler = handleBackspaceMouseDown;
      onMouseUpHandler = handleBackspaceMouseUp;
      onMouseLeaveHandler = handleBackspaceMouseLeave;
    } else {
      // Default key behavior
      onTouchStartHandler = (e) => {
        e.preventDefault();
        handleKeyPress(key);
        e.currentTarget.classList.add('scale-[0.92]', 'bg-white/25');
      };
      onTouchEndHandler = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('scale-[0.92]', 'bg-white/25');
      };
      onTouchCancelHandler = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('scale-[0.92]', 'bg-white/25');
      };
      onMouseDownHandler = (e) => {
        e.preventDefault();
        handleKeyPress(key);
      };
    }

    return (
      <button
        key={uniqueId}
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
        onTouchCancel={onTouchCancelHandler}
        onMouseDown={onMouseDownHandler}
        onMouseUp={onMouseUpHandler}
        onMouseLeave={onMouseLeaveHandler}
        className={`
          h-12 rounded-full flex items-center justify-center text-[20px] font-medium 
          transition-all duration-100 select-none touch-none
          ${flexBasis}
          ${isSpecial 
            ? key === '{enter}' 
              ? 'bg-[var(--accent-primary)]/80 text-white border-[var(--accent-primary)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_2px_8px_rgba(var(--accent-primary-rgb),0.4)]' 
              : (isShift || isCaps) && key === '{shift}' 
                ? 'bg-white/30 text-white'
                : 'bg-white/10 text-[var(--text-secondary)] border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.2)]' 
            : 'bg-gradient-to-b from-white/15 to-white/5 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.2),0_2px_5px_rgba(0,0,0,0.3)]'
          }
        `}
      >
        {display}
      </button>
    );
  };

  if (!isActive || useNativeKeyboard) return null;

  const abcRows = isShift || isCaps ? ALPHABET_UPPER : ALPHABET_LOWER;
  const numberRows = isShift || isCaps ? NUMBERS_UPPERSCAPE : NUMBERS_NORMAL;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[10000] px-2 pb-6 pt-3 select-none flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,30,0.65) 0%, rgba(10,10,15,0.85) 100%)',
        backdropFilter: 'blur(30px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 -15px 40px rgba(0,0,0,0.5)',
        touchAction: 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* HEADER: Native Keyboard, Translate, Close */}
      <div className="flex justify-between items-center mb-4 px-1 gap-2" onTouchStart={(e) => e.preventDefault()}>
        <div className="flex gap-2">
          <button
            onClick={handleUseNativeKeyboard}
            onTouchEnd={handleUseNativeKeyboard}
            className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] bg-white/5 px-3 py-1.5 rounded-full border border-white/10 active:bg-white/20 transition-all font-medium whitespace-nowrap shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center gap-1.5"
          >
            <i className="fi fi-rr-keyboard text-[10px]"></i> Bawaan
          </button>
          <button
            onClick={() => setTranslating(!translating)}
            onTouchEnd={(e) => { e.preventDefault(); setTranslating(!translating); }}
            className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap flex items-center gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
              translating 
              ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/30' 
              : 'bg-white/5 text-[var(--text-secondary)] border-white/10 active:bg-white/20'
            }`}
          >
            <i className="fi fi-rr-globe text-[10px]"></i> {translating ? 'ID -> EN' : 'Translate'}
          </button>
        </div>

        <button
          onClick={closeKeyboard}
          onTouchEnd={(e) => { e.preventDefault(); closeKeyboard(); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[var(--text-tertiary)] active:text-white active:bg-white/20 transition-colors flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
        >
          <i className="fi fi-rr-angle-small-down text-[14px]"></i>
        </button>
      </div>

      {/* TRANSLATE MOCKUP BAR */}
      {translating && (
        <div className="mb-4 px-2" onTouchStart={(e) => e.preventDefault()}>
          <div className="w-full bg-black/40 border border-white/10 rounded-full h-8 px-4 flex items-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Ketik untuk terjemahkan...</span>
          </div>
        </div>
      )}

      {/* KEYBOARD AREA (Transition Slide) */}
      <div className="max-w-[600px] mx-auto w-full relative h-[224px] overflow-hidden">
        {/* ABC Layout */}
        <div 
          className="absolute inset-0 flex flex-col gap-2.5 px-1 transition-all duration-500 ease-in-out"
          style={{
            opacity: mode === 'abc' ? 1 : 0,
            transform: mode === 'abc' ? 'translateX(0) scale(1)' : 'translateX(-30px) scale(0.95)',
            pointerEvents: mode === 'abc' ? 'auto' : 'none',
          }}
        >
          {abcRows.map((row, rowIndex) => (
            <div 
              key={`abc-${rowIndex}`} 
              className={`flex gap-1.5 w-full justify-center ${rowIndex === 1 ? 'px-[5%]' : ''}`}
            >
              {row.map((key, keyIndex) => renderKey(key, `abc-${rowIndex}-${keyIndex}`))}
            </div>
          ))}
        </div>

        {/* 123 Layout */}
        <div 
          className="absolute inset-0 flex flex-col gap-2.5 px-1 transition-all duration-500 ease-in-out"
          style={{
            opacity: mode === '123' ? 1 : 0,
            transform: mode === '123' ? 'translateX(0) scale(1)' : 'translateX(30px) scale(0.95)',
            pointerEvents: mode === '123' ? 'auto' : 'none',
          }}
        >
          {numberRows.map((row, rowIndex) => (
            <div 
              key={`num-${rowIndex}`} 
              className={`flex gap-1.5 w-full justify-center ${rowIndex === 1 ? 'px-[5%]' : ''}`}
            >
              {row.map((key, keyIndex) => renderKey(key, `num-${rowIndex}-${keyIndex}`))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
