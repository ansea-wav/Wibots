'use client';

import React, { useState, useEffect } from 'react';
import { useKeyboard } from '@/lib/KeyboardContext';

// --- KEYBOARD LAYOUTS ---

const ALPHABET_LOWER = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '{backspace}'],
  ['{space}', ',', '.', '{enter}']
];

const ALPHABET_UPPER = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['{shift}', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '{backspace}'],
  ['{space}', ',', '.', '{enter}']
];

const NUMBERS_NORMAL = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '-', '+', '(', ')'],
  ['{shift}', '*', '"', "'", ':', ';', '!', '?', '{backspace}'],
  ['{space}', ',', '.', '{enter}']
];

const NUMBERS_UPPERSCAPE = [
  ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰'],
  ['∞', '≈', '≠', '∑', '∆', 'π', 'Ω', 'µ', '§'],
  ['{shift}', '[', ']', '{', '}', '<', '>', '\\', '{backspace}'],
  ['{space}', ',', '.', '{enter}']
];

export default function VirtualKeyboard() {
  const { isActive, activeInput, closeKeyboard, insertText, handleBackspace, setUseNativeKeyboard, useNativeKeyboard } = useKeyboard();
  
  // States
  const [mode, setMode] = useState<'abc' | '123'>('abc');
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [translating, setTranslating] = useState(false);

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

  if (!isActive || useNativeKeyboard) return null;

  // Determine current layout based on mode and shift state
  let currentRows: string[][] = [];
  if (mode === 'abc') {
    currentRows = isShift || isCaps ? ALPHABET_UPPER : ALPHABET_LOWER;
  } else {
    currentRows = isShift || isCaps ? NUMBERS_UPPERSCAPE : NUMBERS_NORMAL;
  }

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
            className="text-[9px] uppercase tracking-widest text-[var(--text-secondary)] bg-white/5 px-3 py-1.5 rounded-full border border-white/10 active:bg-white/20 transition-all font-medium whitespace-nowrap shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          >
            ⌨️ Bawaan
          </button>
          <button
            onClick={() => setTranslating(!translating)}
            onTouchEnd={(e) => { e.preventDefault(); setTranslating(!translating); }}
            className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all font-medium whitespace-nowrap flex items-center gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
              translating 
              ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/30' 
              : 'bg-white/5 text-[var(--text-secondary)] border-white/10 active:bg-white/20'
            }`}
          >
            🌐 {translating ? 'ID -> EN' : 'Translate'}
          </button>
        </div>

        <button
          onClick={closeKeyboard}
          onTouchEnd={(e) => { e.preventDefault(); closeKeyboard(); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[var(--text-tertiary)] active:text-white active:bg-white/20 transition-colors flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
        >
          ▼
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

      {/* KEYBOARD AREA (Single Slide) */}
      <div className="flex flex-col gap-2 max-w-[600px] mx-auto w-full relative">
        <div className="flex flex-col gap-2.5 px-1">
          {currentRows.map((row, rowIndex) => (
            <div 
              key={rowIndex} 
              className={`flex gap-1.5 w-full justify-center ${rowIndex === 1 ? 'px-[5%]' : ''}`}
            >
              {row.map((key, keyIndex) => {
                let display = key;
                let isSpecial = false;
                let flexBasis = 'flex-1';
                
                if (key === '{shift}') {
                  display = isCaps ? '⇪' : isShift ? '⇧' : '⇧';
                  flexBasis = 'flex-[1.5] max-w-[15%]';
                  isSpecial = true;
                } else if (key === '{backspace}') {
                  display = '⌫';
                  flexBasis = 'flex-[1.5] max-w-[15%]';
                  isSpecial = true;
                } else if (key === '{enter}') {
                  display = '↵';
                  flexBasis = 'flex-[1.5] max-w-[15%]';
                  isSpecial = true;
                } else if (key === '{space}') {
                  display = 'Space';
                  flexBasis = 'flex-[4] max-w-[50%]';
                }

                return (
                  <button
                    key={`${key}-${keyIndex}`}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleKeyPress(key);
                      e.currentTarget.classList.add('scale-[0.92]', 'bg-white/25');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('scale-[0.92]', 'bg-white/25');
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleKeyPress(key);
                    }}
                    className={`
                      h-12 rounded-full flex items-center justify-center text-[20px] font-medium 
                      transition-all duration-100 select-none touch-none
                      ${flexBasis}
                      ${isSpecial 
                        ? key === '{enter}' 
                          ? 'bg-[var(--accent-primary)]/80 text-white border-[var(--accent-primary)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_2px_8px_rgba(var(--accent-primary-rgb),0.4)]' 
                          : isShift && key === '{shift}' 
                            ? 'bg-white/30 text-white'
                            : 'bg-white/10 text-[var(--text-secondary)] border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_5px_rgba(0,0,0,0.2)]' 
                        : 'bg-gradient-to-b from-white/15 to-white/5 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.2),0_2px_5px_rgba(0,0,0,0.3)]'
                      }
                    `}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER: Static Toggle Bar */}
      <div className="mt-4 flex justify-center gap-3 px-4 max-w-[400px] mx-auto w-full" onTouchStart={(e) => e.preventDefault()}>
        <button
          onTouchStart={(e) => { e.preventDefault(); setMode('abc'); setIsShift(false); }}
          onMouseDown={(e) => { e.preventDefault(); setMode('abc'); setIsShift(false); }}
          className={`flex-1 h-10 rounded-full flex items-center justify-center text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
            mode === 'abc'
            ? 'bg-white/20 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_0_15px_rgba(255,255,255,0.1)] border border-white/20'
            : 'bg-black/20 text-[var(--text-tertiary)] border border-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]'
          }`}
        >
          ABC
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); setMode('123'); setIsShift(false); }}
          onMouseDown={(e) => { e.preventDefault(); setMode('123'); setIsShift(false); }}
          className={`flex-1 h-10 rounded-full flex items-center justify-center text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${
            mode === '123'
            ? 'bg-white/20 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_0_15px_rgba(255,255,255,0.1)] border border-white/20'
            : 'bg-black/20 text-[var(--text-tertiary)] border border-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]'
          }`}
        >
          123
        </button>
      </div>

    </div>
  );
}
