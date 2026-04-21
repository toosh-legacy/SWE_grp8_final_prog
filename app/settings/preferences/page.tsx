"use client";

import { useSettings } from "@/components/settings/settings-provider";
import type { StudyMode, ThemePreference } from "@/lib/settings/types";

const themes: { value: ThemePreference; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Bright UI" },
  { value: "dark", label: "Dark", hint: "Easier at night" },
  { value: "system", label: "System", hint: "Match device" },
];

const studyModes: { value: StudyMode; label: string; hint: string }[] = [
  { value: "focus", label: "Focus", hint: "Solo deep work" },
  { value: "group", label: "Group", hint: "Study rooms & peers" },
  { value: "review", label: "Review", hint: "Flashcards & recap" },
];

export default function PreferencesPage() {
  const { settings, update } = useSettings();

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Theme is saved with your settings and applied on load.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {themes.map((t) => {
            const selected = settings.theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ theme: t.value })}
                className={`flex min-w-[7rem] flex-col rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
                }`}
              >
                <span className="font-semibold">{t.label}</span>
                <span
                  className={
                    selected
                      ? "text-zinc-300 dark:text-zinc-600"
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {t.hint}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Default study mode</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Used when you open a new session (placeholder until sessions ship).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {studyModes.map((m) => {
            const selected = settings.studyMode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => update({ studyMode: m.value })}
                className={`flex min-w-[7rem] flex-col rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "border-violet-600 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-600"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
                }`}
              >
                <span className="font-semibold">{m.label}</span>
                <span
                  className={
                    selected
                      ? "text-violet-100"
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {m.hint}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
