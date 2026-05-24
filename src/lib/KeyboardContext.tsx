'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface KeyboardContextType {
  isActive: boolean;
  activeInput: HTMLInputElement | HTMLTextAreaElement | null;
  useNativeKeyboard: boolean;
  isMobile: boolean;
  setUseNativeKeyboard: (val: boolean) => void;
  closeKeyboard: () => void;
  insertText: (text: string) => void;
  handleBackspace: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [useNativeKeyboard, setUseNativeKeyboard] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = (navigator.userAgent || navigator.vendor || (window as any).opera).toLowerCase();
      
      let isPhoneOrTablet = false;
      let forceNative = false;

      if (/iphone|ipod|ipad|android/.test(userAgent)) {
        isPhoneOrTablet = true;
      } else if (/macintosh|mac os x/.test(userAgent) && navigator.maxTouchPoints > 1) {
        // iPad OS 13+ requests desktop site by default and masquerades as Mac
        isPhoneOrTablet = true;
      } else if (/windows|macintosh|linux/.test(userAgent)) {
        isPhoneOrTablet = false; // PC
      } else {
        // Unknown device
        if (window.innerWidth < 768) {
          isPhoneOrTablet = true;
          forceNative = true; // "ga kedetek tapi dia layarnya kecil, berarti munculin aja keyboard dari bawaannya mereka"
        } else {
          isPhoneOrTablet = false;
        }
      }

      setIsMobile(isPhoneOrTablet);
      if (forceNative) {
        setUseNativeKeyboard(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global focus listener and proactive inputmode injection
  useEffect(() => {
    if (!isMobile) return;

    const updateInputModes = () => {
      const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="file"]), textarea');
      inputs.forEach(el => {
        if (!useNativeKeyboard) {
          el.setAttribute('inputmode', 'none');
        } else {
          el.removeAttribute('inputmode');
        }
      });
    };

    updateInputModes();

    const observer = new MutationObserver(() => {
      updateInputModes();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        (target.tagName === 'INPUT' && !['checkbox', 'radio', 'submit', 'button', 'color', 'file', 'image', 'reset'].includes((target as HTMLInputElement).type)) ||
        target.tagName === 'TEXTAREA'
      ) {
        setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
      }
    };

    const handleBlur = (e: Event) => {
      setTimeout(() => {
        if (!document.activeElement || (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
          setActiveInput(null);
        }
      }, 50);
    };

    // Use capture phase for focus/blur to ensure we catch it early
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, [isMobile, useNativeKeyboard]);

  // Insert text safely into the active input
  const insertText = useCallback((text: string) => {
    if (!activeInput) return;
    
    // Fallback if browser doesn't support execCommand
    const startPos = activeInput.selectionStart || 0;
    const endPos = activeInput.selectionEnd || 0;
    const currentValue = activeInput.value;
    
    const newValue = currentValue.substring(0, startPos) + text + currentValue.substring(endPos);
    
    // Set native value setter to bypass React's tracking, allowing us to trigger a proper 'input' event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    const setter = activeInput.tagName === 'INPUT' ? nativeInputValueSetter : nativeTextAreaValueSetter;
    
    if (setter) {
      setter.call(activeInput, newValue);
    } else {
      activeInput.value = newValue;
    }
    
    // Dispatch input event for React
    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);
    
    // Reset selection
    const newPos = startPos + text.length;
    activeInput.setSelectionRange(newPos, newPos);
  }, [activeInput]);

  // Handle backspace safely
  const handleBackspace = useCallback(() => {
    if (!activeInput) return;
    
    const startPos = activeInput.selectionStart || 0;
    const endPos = activeInput.selectionEnd || 0;
    
    if (startPos === 0 && endPos === 0) return; // Nothing to delete
    
    const currentValue = activeInput.value;
    let newValue;
    let newPos;
    
    if (startPos === endPos) {
      // Delete one char behind
      newValue = currentValue.substring(0, startPos - 1) + currentValue.substring(endPos);
      newPos = startPos - 1;
    } else {
      // Delete selection
      newValue = currentValue.substring(0, startPos) + currentValue.substring(endPos);
      newPos = startPos;
    }

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    const setter = activeInput.tagName === 'INPUT' ? nativeInputValueSetter : nativeTextAreaValueSetter;
    
    if (setter) {
      setter.call(activeInput, newValue);
    } else {
      activeInput.value = newValue;
    }
    
    const event = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(event);
    
    activeInput.setSelectionRange(newPos, newPos);
  }, [activeInput]);

  const closeKeyboard = useCallback(() => {
    if (activeInput) {
      activeInput.blur();
    }
    setActiveInput(null);
  }, [activeInput]);

  const value = {
    isActive: activeInput !== null && !useNativeKeyboard,
    activeInput,
    useNativeKeyboard,
    isMobile,
    setUseNativeKeyboard,
    closeKeyboard,
    insertText,
    handleBackspace
  };

  return (
    <KeyboardContext.Provider value={value}>
      {children}
      {/* DEBUG OVERLAY - Remove later */}
      <div className="fixed top-2 right-2 z-[99999] flex flex-col gap-2">
        <div className="bg-black/80 text-[var(--neon-cyan)] text-[10px] p-2 rounded pointer-events-none border border-[var(--neon-cyan)]/30 font-mono">
          <div>Device: {isMobile ? 'MOBILE/TABLET' : 'PC/UNKNOWN'}</div>
          <div>Active: {isActive ? 'YES' : 'NO'}</div>
          <div>Fallback: {useNativeKeyboard ? 'YES' : 'NO'}</div>
        </div>
        <button 
          className="bg-[var(--accent-primary)] text-white text-[10px] px-3 py-2 rounded shadow-lg border border-white/20 active:scale-95 transition-transform"
          onClick={() => {
            if (activeInput) {
              closeKeyboard();
            } else {
              // Force fake input focus
              const inputs = document.querySelectorAll('input');
              if (inputs.length > 0) {
                inputs[0].focus();
              }
            }
          }}
          onTouchStart={(e) => { e.stopPropagation(); }}
        >
          {activeInput ? 'Tutup Keyboard' : 'Paksa Buka Keyboard'}
        </button>
      </div>
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
