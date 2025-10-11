'use client';

/**
 * Theme Provider
 * Applies theme settings from settings store to the app
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.app.theme);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Apply selected theme
      root.classList.add(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
