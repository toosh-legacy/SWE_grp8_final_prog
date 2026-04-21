"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { loadSettings, saveSettings } from "@/lib/settings/storage";
import type { ThemePreference, UserSettings } from "@/lib/settings/types";
import { defaultUserSettings } from "@/lib/settings/types";

type SettingsContextValue = {
  settings: UserSettings;
  ready: boolean;
  update: (patch: Partial<UserSettings>) => void;
  replace: (next: UserSettings) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    startTransition(() => {
      setSettings(loaded);
      setReady(true);
      setTheme(loaded.theme);
    });
  }, [setTheme]);

  const update = useCallback(
    (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(next);
        return next;
      });
      if (patch.theme !== undefined) {
        setTheme(patch.theme as ThemePreference);
      }
    },
    [setTheme],
  );

  const replace = useCallback((next: UserSettings) => {
    saveSettings(next);
    setSettings(next);
    setTheme(next.theme);
  }, [setTheme]);

  const reset = useCallback(() => {
    const next = { ...defaultUserSettings };
    saveSettings(next);
    setSettings(next);
    setTheme(next.theme);
  }, [setTheme]);

  const value = useMemo(
    () => ({ settings, ready, update, replace, reset }),
    [settings, ready, update, replace, reset],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
