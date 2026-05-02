import { parseStoredHHMM } from "./clock-time";
import { SETTINGS_STORAGE_KEY } from "./constants";
import { defaultUserSettings, type UserSettings } from "./types";

function mergeSettings(raw: unknown): UserSettings {
  if (!raw || typeof raw !== "object") return { ...defaultUserSettings };
  const o = raw as Record<string, unknown>;
  return {
    ...defaultUserSettings,
    email: typeof o.email === "string" ? o.email : defaultUserSettings.email,
    displayName:
      typeof o.displayName === "string"
        ? o.displayName
        : defaultUserSettings.displayName,
    bio: typeof o.bio === "string" ? o.bio : defaultUserSettings.bio,
    campusId:
      typeof o.campusId === "string" ? o.campusId : defaultUserSettings.campusId,
    avatarDataUrl:
      typeof o.avatarDataUrl === "string" || o.avatarDataUrl === null
        ? (o.avatarDataUrl as string | null)
        : defaultUserSettings.avatarDataUrl,
    bannerDataUrl:
      typeof o.bannerDataUrl === "string" || o.bannerDataUrl === null
        ? (o.bannerDataUrl as string | null)
        : defaultUserSettings.bannerDataUrl,
    theme:
      o.theme === "light" || o.theme === "dark" || o.theme === "system"
        ? o.theme
        : defaultUserSettings.theme,
    studyMode:
      o.studyMode === "focus" ||
      o.studyMode === "group" ||
      o.studyMode === "review"
        ? o.studyMode
        : defaultUserSettings.studyMode,
    notifyStudyReminders:
      typeof o.notifyStudyReminders === "boolean"
        ? o.notifyStudyReminders
        : defaultUserSettings.notifyStudyReminders,
    notifyGroupActivity:
      typeof o.notifyGroupActivity === "boolean"
        ? o.notifyGroupActivity
        : defaultUserSettings.notifyGroupActivity,
    notifyCampusAnnouncements:
      typeof o.notifyCampusAnnouncements === "boolean"
        ? o.notifyCampusAnnouncements
        : defaultUserSettings.notifyCampusAnnouncements,
    quietHoursEnabled:
      typeof o.quietHoursEnabled === "boolean"
        ? o.quietHoursEnabled
        : defaultUserSettings.quietHoursEnabled,
    quietHoursStart: parseStoredHHMM(
      o.quietHoursStart,
      defaultUserSettings.quietHoursStart,
    ),
    quietHoursEnd: parseStoredHHMM(
      o.quietHoursEnd,
      defaultUserSettings.quietHoursEnd,
    ),
  };
}

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return { ...defaultUserSettings };
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...defaultUserSettings };
    return mergeSettings(JSON.parse(raw) as unknown);
  } catch {
    return { ...defaultUserSettings };
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
