"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { supabase } from "@/supabaseClient";
import { loadSettings, saveSettings } from "@/lib/settings/storage";
import type { ThemePreference, UserSettings } from "@/lib/settings/types";
import { defaultUserSettings } from "@/lib/settings/types";

type SettingsContextValue = {
  settings: UserSettings;
  ready: boolean;
  /** Supabase OAuth / email-password sign-in email when signed in */
  authEmail: string | null;
  /** Prefer Supabase auth email (e.g. Google) while signed in */
  accountEmail: string;
  update: (patch: Partial<UserSettings>) => void;
  replace: (next: UserSettings) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [ready, setReady] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setTheme(loaded.theme);
    setReady(true);
  }, [setTheme]);

  useEffect(() => {
    const sync = (session: Session | null) => {
      const email = session?.user?.email?.trim();
      setAuthEmail(email || null);
    };

    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) sync(session);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    setTheme(settings.theme);
  }, [ready, settings.theme, setTheme]);

  const accountEmail =
    authEmail && authEmail.length > 0 ? authEmail : settings.email;

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
    () => ({
      settings,
      ready,
      authEmail,
      accountEmail,
      update,
      replace,
      reset,
    }),
    [settings, ready, authEmail, accountEmail, update, replace, reset],
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
