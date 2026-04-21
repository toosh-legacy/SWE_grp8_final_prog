"use client";

import { useSettings } from "@/components/settings/settings-provider";

type RowProps = {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

function ToggleRow({ id, title, description, checked, onChange }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-4 last:border-0 dark:border-zinc-800">
      <div>
        <label htmlFor={id} className="font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </label>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
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
  );
}

export default function NotificationsPage() {
  const { settings, update } = useSettings();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">Notifications</h2>
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
          description="Pause non-urgent alerts overnight (timing TBD)."
          checked={settings.quietHoursEnabled}
          onChange={(v) => update({ quietHoursEnabled: v })}
        />
      </div>
    </div>
  );
}
