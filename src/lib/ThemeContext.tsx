'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Theme Definitions
// ---------------------------------------------------------------------------

export type ThemeId = 'glass' | 'liquid-glass' | 'mono' | 'oled';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  icon: string;
}

export const themes: ThemeDefinition[] = [
  {
    id: 'glass',
    name: 'Glassmorphism',
    description: 'Classic frosted glass panels',
    icon: '🪟',
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    description: 'Apple-style vivid transparency',
    icon: '💧',
  },
  {
    id: 'mono',
    name: 'Monochrome',
    description: 'Clean black & white minimal',
    icon: '◻️',
  },
  {
    id: 'oled',
    name: 'OLED Dark',
    description: 'True black, vivid neon accents',
    icon: '🖤',
  },
] as const;

const STORAGE_KEY = 'yay-theme';
const DEFAULT_THEME: ThemeId = 'glass';
const THEME_CLASS_PREFIX = 'theme-';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidTheme(value: unknown): value is ThemeId {
  return typeof value === 'string' && themes.some((t) => t.id === value);
}

function getSavedTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyThemeClass(id: ThemeId) {
  const root = document.documentElement;
  // Remove any existing theme-* class
  root.classList.forEach((cls) => {
    if (cls.startsWith(THEME_CLASS_PREFIX)) {
      root.classList.remove(cls);
    }
  });
  // 'glass' is the default (:root styles) — only add a class for non-default
  if (id !== DEFAULT_THEME) {
    root.classList.add(`${THEME_CLASS_PREFIX}${id}`);
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = getSavedTheme();
    setThemeState(saved);
    applyThemeClass(saved);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    if (!isValidTheme(id)) return;
    setThemeState(id);
    applyThemeClass(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
