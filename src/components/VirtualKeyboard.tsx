'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboard } from '@/lib/KeyboardContext';

const KEYBOARD_ROWS_LOWER = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '{backspace}'],
  ['{symbols}', ',', '{space}', '.', '{enter}']
];

const KEYBOARD_ROWS_UPPER = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['{shift}', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '{backspace}'],
  ['{symbols}', ',', '{space}', '.', '{enter}']
];

const KEYBOARD_ROWS_SYMBOLS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '-', '+', '(', ')'],
  ['{symbols}', '*', '"', "'", ':', ';', '!', '?', '{backspace}'],
  ['{abc}', ',', '{space}', '.', '{enter}']
];

export default function VirtualKeyboard() {
  const { isActive, activeInput, closeKeyboard, insertText, handleBackspace, setUseNativeKeyboard, useNativeKeyboard } = useKeyboard();
  
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);

  // Prevent keyboard from closing when clicking inside it
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleKeyPress = (key: string) => {
    // Optional: Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

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
        // Trigger Enter key down event
        if (activeInput) {
          const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
          activeInput.dispatchEvent(event);
          if (activeInput.tagName === 'INPUT') {
            closeKeyboard(); // Close on enter for single line inputs typically, or keep open if preferred
          } else {
            insertText('\n');
          }
        }
        break;
      case '{space}':
        insertText(' ');
        break;
      case '{symbols}':
        setIsSymbols(!isSymbols);
        setIsShift(false);
        setIsCaps(false);
        break;
      case '{abc}':
        setIsSymbols(false);
        setIsShift(false);
        setIsCaps(false);
        break;
      default:
        insertText(key);
        if (isShift && !isCaps) {
          setIsShift(false);
        }
        break;
    }
  };

  const renderKey = (key: string, index: number) => {
    let display = key;
    let extraClass = 'flex-1';
    
    if (key === '{shift}') {
      display = isCaps ? '⇪' : isShift ? '⇧' : '⇧';
      extraClass = `w-[15%] ${isShift || isCaps ? 'bg-white/20' : 'bg-black/40'}`;
    } else if (key === '{backspace}') {
      display = '⌫';
      extraClass = 'w-[15%] bg-black/40';
    } else if (key === '{enter}') {
      display = '↵';
      extraClass = 'w-[20%] bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30';
    } else if (key === '{space}') {
      display = 'Space';
      extraClass = 'w-[40%]';
    } else if (key === '{symbols}') {
      display = '?123';
      extraClass = 'w-[15%] bg-black/40 text-[10px]';
    } else if (key === '{abc}') {
      display = 'ABC';
      extraClass = 'w-[15%] bg-black/40 text-[10px]';
    } else if (key === ',' || key === '.') {
      extraClass = 'w-[10%]';
    }

    return (
      <motion.button
        key={`${key}-${index}`}
        whileTap={{ scale: 0.9, backgroundColor: 'rgba(255,255,255,0.2)' }}
        className={`h-11 rounded-lg flex items-center justify-center text-[15px] font-medium text-white border border-white/5 bg-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.2)] backdrop-blur-md transition-colors select-none ${extraClass}`}
        onClick={(e) => {
          e.preventDefault();
          handleKeyPress(key);
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => e.preventDefault()}
      >
        {display}
      </motion.button>
    );
  };

  let currentRows = KEYBOARD_ROWS_LOWER;
  if (isSymbols) {
    currentRows = KEYBOARD_ROWS_SYMBOLS;
  } else if (isShift || isCaps) {
    currentRows = KEYBOARD_ROWS_UPPER;
  }

  const handleUseNativeKeyboard = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeInput) {
      setUseNativeKeyboard(true);
      activeInput.removeAttribute('inputmode');
      activeInput.blur();
      setTimeout(() => {
        activeInput.focus();
      }, 10);
    }
  };

  return (
    <AnimatePresence>
      {isActive && !useNativeKeyboard && (
        <motion.div
          key="virtual-keyboard"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] px-2 pb-6 pt-2 select-none"
          style={{
            background: 'linear-gradient(180deg, rgba(15,15,25,0.85) 0%, rgba(10,10,15,0.95) 100%)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
            touchAction: 'none' // Prevent scrolling while touching keyboard
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => {
            // e.preventDefault(); // Might block button clicks in some browsers, so we handle it on the buttons if needed
          }}
        >
          {/* Header Action */}
          <div className="flex justify-between items-center mb-3 px-1">
            <button
              onClick={handleUseNativeKeyboard}
              onMouseDown={handleMouseDown}
              onTouchStart={(e) => e.preventDefault()}
              className="text-[10px] uppercase tracking-widest text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 px-3 py-1.5 rounded-full border border-[var(--neon-cyan)]/20 hover:bg-[var(--neon-cyan)]/20 transition-colors"
            >
              ⌨️ Gunakan Keyboard Bawaan
            </button>
            <button
              onClick={closeKeyboard}
              onMouseDown={handleMouseDown}
              onTouchStart={(e) => e.preventDefault()}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[var(--text-tertiary)] hover:text-white transition-colors"
            >
              ▼
            </button>
          </div>

          {/* Keyboard Layout */}
          <div className="flex flex-col gap-2 max-w-[600px] mx-auto">
            {currentRows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className={`flex gap-1.5 w-full ${rowIndex === 1 ? 'px-[5%]' : ''}`}
              >
                {row.map((key, keyIndex) => renderKey(key, keyIndex))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
