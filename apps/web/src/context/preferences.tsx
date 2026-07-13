import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@blog/shared';
import { locales } from '../i18n';
import { themes, type ThemeName } from '../theme';

type PreferencesContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const localeStorageKey = 'blog-locale';
const themeStorageKey = 'blog-theme';

function readStoredValue<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  const stored = window.localStorage.getItem(key);
  return stored && allowed.includes(stored as T) ? (stored as T) : fallback;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    readStoredValue(
      localeStorageKey,
      'zh-CN',
      locales.map((item) => item.id),
    ),
  );
  const [theme, setTheme] = useState<ThemeName>(() =>
    readStoredValue(
      themeStorageKey,
      'paper',
      themes.map((item) => item.id),
    ),
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
    }),
    [locale, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }

  return context;
}
