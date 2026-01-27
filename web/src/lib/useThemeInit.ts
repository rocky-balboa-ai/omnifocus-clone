'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';

export function useThemeInit() {
  const { setTheme, themeMode } = useAppStore();

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedMode = localStorage.getItem('omnifocus-theme-mode') as 'light' | 'dark' | 'auto' | null;
    const savedTheme = localStorage.getItem('omnifocus-theme') as 'light' | 'dark' | null;

    if (savedMode === 'auto' || (!savedMode && !savedTheme)) {
      // Auto mode - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  // Listen for system preference changes when in auto mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const savedMode = localStorage.getItem('omnifocus-theme-mode');
      if (savedMode === 'auto' || !savedMode) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme, themeMode]);
}
