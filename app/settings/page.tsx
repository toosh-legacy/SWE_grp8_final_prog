"use client";

import Link from "next/link";
import { useSettings } from "@/components/settings/settings-provider";
import { campusLabel } from "@/lib/settings/campuses";

const cards = [
  {
    href: "/settings/account",
    title: "Account",
    description: "Password and email with verification",
  },
  {
    href: "/settings/profile",
    title: "Profile",
    description: "Name, bio, campus, photo and banner",
  },
  {
    href: "/settings/preferences",
    title: "Preferences",
    description: "Theme and default study mode",
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    description: "Reminders and campus updates",
  },
] as const;

export default function SettingsHomePage() {
  const { settings, ready, reset, accountEmail } = useSettings();
  function handleReset() {
    if (!window.confirm("Reset all settings on this browser back to defaults?")) {
      return;
    }
    reset();
  }

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Current snapshot
        </h2>
        {!ready ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        ) : (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Display name</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {settings.displayName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Campus</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {settings.campusId ? campusLabel(settings.campusId) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {accountEmail.trim() ? accountEmail : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Study mode</dt>
              <dd className="font-medium capitalize text-zinc-900 dark:text-zinc-100">
                {settings.studyMode}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-50">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {card.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/70 p-6 dark:border-red-900/70 dark:bg-red-950/20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-red-800/90 dark:text-red-200/90">
          Reset clears all saved settings from this browser and returns defaults.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 rounded-full border border-red-600 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-400 dark:text-red-200 dark:hover:bg-red-900/40"
        >
          Reset all settings
        </button>
      </section>
    </>
  );
}
