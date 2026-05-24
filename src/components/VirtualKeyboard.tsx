'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKeyboard } from '@/lib/KeyboardContext';

// --- KEYBOARD LAYOUTS ---

// Page 0: Alphabet
const ALPHABET_LOWER = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '{backspace}'],
  ['{123}', ',', '{space}', '.', '{enter}']
];

const ALPHABET_UPPER = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['{shift}', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '{backspace}'],
  ['{123}', ',', '{space}', '.', '{enter}']
];

// Page 1: Numbers & Symbols
const NUMBERS_NORMAL = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '-', '+', '(', ')'],
  ['{shift}', '*', '"', "'", ':', ';', '!', '?', '{backspace}'],
  ['{abc}', ',', '{space}', '.', '{enter}']
];

const NUMBERS_UPPERSCAPE = [
  ['¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '⁰'],
  ['∞', '≈', '≠', '∑', '∆', 'π', 'Ω', 'µ', '§'],
  ['{shift}', '[', ']', '{', '}', '<', '>', '\\', '{backspace}'],
  ['{abc}', ',', '{space}', '.', '{enter}']
];

// Page 2: YAY Signature Symbols
const YAY_SYMBOLS_NORMAL = [
  ['𐀔', '🦋', '🧸', '✧', '💸', '♡', '⋆', '☾', '✦', '☼'],
  ['♔', '♕', '♖', '♗', '♘', '♙', '♠', '♡', '♢'],
  ['{shift}', '★', '☆', '✮', '✯', '✵', '✶', '✷', '{backspace}'],
  ['{abc}', ',', '{space}', '.', '{enter}']
];

const YAY_SYMBOLS_UPPERSCAPE = [
  ['♪', '♫', '♬', '♭', '♮', '♯', '✓', '✗', '✘', '♡'],
  ['▲', '▼', '◄', '►', '◆', '◇', '○', '◎', '●'],
  ['{shift}', '■', '□', '▣', '▤', '▥', '▦', '▧', '{backspace}'],
  ['{abc}', ',', '{space}', '.', '{enter}']
];

export default function VirtualKeyboard() {
  const { isActive, activeInput, closeKeyboard, insertText, handleBackspace, setUseNativeKeyboard, useNativeKeyboard } = useKeyboard();
  
  // States
  const [page, setPage] = useState<number>(0); // 0 = Alphabet, 1 = Numbers, 2 = YAY Symbols
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Swipe mechanics
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Entrance animation logic
  useEffect(() => {
    if (isActive && !useNativeKeyboard) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isActive, useNativeKeyboard]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    
    const SWIPE_THRESHOLD = 50;
    
    if (diff > SWIPE_THRESHOLD) {
      // Swipe Left -> Next Page
      setPage((prev) => (prev < 2 ? prev + 1 : prev));
      setIsShift(false); // reset shift on page change
    } else if (diff < -SWIPE_THRESHOLD) {
      // Swipe Right -> Prev Page
      setPage((prev) => (prev > 0 ? prev - 1 : prev));
      setIsShift(false);
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

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
          else insertText('\n');
        }
        break;
      case '{space}':
        insertText(' ');
        break;
      case '{123}':
        setPage(1);
        setIsShift(false);
        setIsCaps(false);
        break;
      case '{abc}':
        setPage(0);
        setIsShift(false);
        setIsCaps(false);
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

  // Determine current layout based on page and shift state
  let currentRows: string[][] = [];
  if (page === 0) {
    currentRows = isShift || isCaps ? ALPHABET_UPPER : ALPHABET_LOWER;
  } else if (page === 1) {
    currentRows = isShift || isCaps ? NUMBERS_UPPERSCAPE : NUMBERS_NORMAL;
  } else if (page === 2) {
    currentRows = isShift || isCaps ? YAY_SYMBOLS_UPPERSCAPE : YAY_SYMBOLS_NORMAL;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[10000] px-2 pb-6 pt-3 select-none flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(15,15,22,0.95) 0%, rgba(5,5,10,0.98) 100%)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 -15px 40px rgba(0,0,0,0.4)',
        touchAction: 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      // Prevent blur when touching anywhere in the keyboard area
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        // e.preventDefault() here breaks swipe! We handle touch-action: none via CSS
      }}
    >
      {/* HEADER: Native Keyboard Fallback & Close */}
      <div className="flex justify-between items-center mb-3 px-1" onTouchStart={(e) => e.preventDefault()}>
        <button
          onClick={handleUseNativeKeyboard}
          onTouchEnd={handleUseNativeKeyboard}
          className="text-[9px] uppercase tracking-widest text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 px-3 py-1.5 rounded-full border border-[var(--neon-cyan)]/20 active:bg-[var(--neon-cyan)]/20 transition-colors font-medium whitespace-nowrap"
        >
          ⌨️ K. BAWAAN
        </button>
        
        {/* Navigation Indicator Bars (Moved to center nicely without absolute) */}
        <div className="flex gap-1.5 items-center justify-center flex-1 mx-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: page === idx ? '20px' : '8px',
                backgroundColor: page === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                boxShadow: page === idx ? '0 0 8px rgba(255,255,255,0.4)' : 'none'
              }}
            />
          ))}
        </div>

        <button
          onClick={closeKeyboard}
          onTouchEnd={(e) => { e.preventDefault(); closeKeyboard(); }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[var(--text-tertiary)] active:text-white active:bg-white/20 transition-colors flex-shrink-0"
        >
          ▼
        </button>
      </div>

      {/* KEYBOARD AREA (Swipeable) */}
      <div 
        className="flex flex-col gap-2 max-w-[600px] mx-auto w-full relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {[0, 1, 2].map((pageIndex) => {
            // Render all 3 pages side by side for smooth swiping
            let pageRows: string[][] = [];
            if (pageIndex === 0) pageRows = isShift || isCaps ? ALPHABET_UPPER : ALPHABET_LOWER;
            if (pageIndex === 1) pageRows = isShift || isCaps ? NUMBERS_UPPERSCAPE : NUMBERS_NORMAL;
            if (pageIndex === 2) pageRows = isShift || isCaps ? YAY_SYMBOLS_UPPERSCAPE : YAY_SYMBOLS_NORMAL;

            return (
              <div key={pageIndex} className="min-w-full flex flex-col gap-2.5 px-1">
                {pageRows.map((row, rowIndex) => (
                  <div 
                    key={rowIndex} 
                    className={`flex gap-1.5 w-full justify-center ${rowIndex === 1 ? 'px-[5%]' : ''}`}
                  >
                    {row.map((key: string, keyIndex: number) => {
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
                        flexBasis = 'flex-[2] max-w-[20%]';
                        isSpecial = true;
                      } else if (key === '{space}') {
                        display = 'Space';
                        flexBasis = 'flex-[4] max-w-[45%]';
                      } else if (key === '{123}') {
                        display = '?123';
                        flexBasis = 'flex-[1.5] max-w-[15%]';
                        isSpecial = true;
                      } else if (key === '{abc}') {
                        display = 'ABC';
                        flexBasis = 'flex-[1.5] max-w-[15%]';
                        isSpecial = true;
                      }

                      return (
                        <button
                          key={`${key}-${keyIndex}`}
                          onTouchStart={(e) => {
                            e.preventDefault(); // SUPER IMPORTANT: Prevents focus stealing instantly!
                            handleKeyPress(key);
                            // Add active styling manually since preventDefault stops :active pseudo-class
                            e.currentTarget.classList.add('bg-white/30', 'scale-95');
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-white/30', 'scale-95');
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleKeyPress(key);
                          }}
                          className={`
                            h-12 rounded-xl flex items-center justify-center text-[18px] font-medium 
                            transition-all duration-75 select-none touch-none
                            ${flexBasis}
                            ${isSpecial 
                              ? key === '{enter}' 
                                ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30' 
                                : isShift && key === '{shift}' 
                                  ? 'bg-white/30 text-white'
                                  : 'bg-white/10 text-[var(--text-secondary)] text-[12px] uppercase tracking-wider' 
                              : 'bg-white/5 text-white border border-white/5 shadow-sm'
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
