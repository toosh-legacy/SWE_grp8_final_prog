"use client";

import { useSettings } from "@/components/settings/settings-provider";
import { normalizeTimeInputValue } from "@/lib/settings/clock-time";
import type { ReactNode } from "react";

type RowProps = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
};

function ToggleRow({ id, title, description, checked, onChange, children }: RowProps) {
  const titleId = `${id}-title`;
  return (
    <div className="border-b border-zinc-100 py-4 last:border-0 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id={titleId} className="font-medium text-zinc-900 dark:text-zinc-100">
            {title}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>
        <button
          id={id}
          type="button"
          role="switch"
          aria-labelledby={titleId}
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            checked ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {children}
    </div>
  );
}

export default function NotificationsPage() {
  const { settings, update } = useSettings();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Notifications
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Controls are stored locally. Connect push or email in production.
      </p>

      <div className="mt-2 divide-y-0">
        <ToggleRow
          id="notify-study"
          title="Study reminders"
          description="Nudges before planned focus blocks."
          checked={settings.notifyStudyReminders}
          onChange={(v) => update({ notifyStudyReminders: v })}
        />
        <ToggleRow
          id="notify-group"
          title="Group activity"
          description="Messages and invites from study groups."
          checked={settings.notifyGroupActivity}
          onChange={(v) => update({ notifyGroupActivity: v })}
        />
        <ToggleRow
          id="notify-campus"
          title="Campus announcements"
          description="Events and updates for your home campus."
          checked={settings.notifyCampusAnnouncements}
          onChange={(v) => update({ notifyCampusAnnouncements: v })}
        />
        <ToggleRow
          id="quiet-hours"
          title="Quiet hours"
          description="Pause non-urgent alerts during this window. Times follow your device clock."
          checked={settings.quietHoursEnabled}
          onChange={(v) => update({ quietHoursEnabled: v })}
        >
          {settings.quietHoursEnabled ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
              <label className="flex flex-col gap-1.5 text-sm" htmlFor="quiet-from">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">From</span>
                <input
                  id="quiet-from"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) =>
                    update({
                      quietHoursStart: normalizeTimeInputValue(
                        e.target.value,
                        settings.quietHoursStart,
                      ),
                    })
                  }
                  className="w-full min-w-[8rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm" htmlFor="quiet-to">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">To</span>
                <input
                  id="quiet-to"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) =>
                    update({
                      quietHoursEnd: normalizeTimeInputValue(
                        e.target.value,
                        settings.quietHoursEnd,
                      ),
                    })
                  }
                  className="w-full min-w-[8rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto"
                />
              </label>
            </div>
          ) : null}
          {settings.quietHoursEnabled ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              If “To” is earlier than “From”, the window spans overnight (for example 10:00 PM–8:00
              AM).
            </p>
          ) : null}
        </ToggleRow>
      </div>
    </div>
  );
}
