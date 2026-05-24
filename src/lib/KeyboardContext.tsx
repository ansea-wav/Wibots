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
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) || window.innerWidth < 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global focus listener
  useEffect(() => {
    if (!isMobile) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // We only care about inputs and textareas that are editable
      if (
        (target.tagName === 'INPUT' && !['checkbox', 'radio', 'submit', 'button', 'color', 'file', 'image', 'reset'].includes((target as HTMLInputElement).type)) ||
        target.tagName === 'TEXTAREA'
      ) {
        const el = target as HTMLInputElement | HTMLTextAreaElement;
        
        // If we shouldn't use native keyboard, prevent it from popping up
        if (!useNativeKeyboard) {
          el.setAttribute('inputmode', 'none');
        } else {
          el.removeAttribute('inputmode');
        }
        
        setActiveInput(el);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // Don't close immediately if clicking inside the virtual keyboard
      // The Virtual Keyboard component handles preventing blur via onMouseDown.
      setTimeout(() => {
        if (!document.activeElement || (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
          setActiveInput(null);
        }
      }, 50);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
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
