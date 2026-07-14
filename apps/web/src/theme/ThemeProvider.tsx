import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings, usePutSettings } from '../api/queries.js';
import type { Theme, ThemePreference } from '../api/types.js';

interface ThemeContextValue
{
  preference: ThemePreference;
  resolved: Theme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): Theme
{
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storedPreference(): ThemePreference
{
  const value = localStorage.getItem('dv-theme');
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element
{
  const [preference, setPreferenceState] = useState<ThemePreference>(storedPreference);
  const settings = useSettings();
  const putSettings = usePutSettings();

  // The server's settings are the source of truth once loaded; localStorage
  // only covers the first paint.
  const serverTheme = settings.data?.theme;
  useEffect(() =>
  {
    if (serverTheme && serverTheme !== storedPreference())
    {
      setPreferenceState(serverTheme);
      localStorage.setItem('dv-theme', serverTheme);
    }
  }, [serverTheme]);

  const [system, setSystem] = useState<Theme>(() => systemTheme());
  useEffect(() =>
  {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => setSystem(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolved: Theme = preference === 'system' ? system : preference;

  useEffect(() =>
  {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  const putTheme = putSettings.mutate;
  const setPreference = useCallback(
    (next: ThemePreference) =>
    {
      setPreferenceState(next);
      localStorage.setItem('dv-theme', next);
      putTheme({ theme: next });
    },
    [putTheme]
  );

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue
{
  const context = useContext(ThemeContext);
  if (!context)
  {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
