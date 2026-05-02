import {
  DEFAULT_QUIET_HOURS_END,
  DEFAULT_QUIET_HOURS_START,
} from "./clock-time";

export type StudyMode = "focus" | "group" | "review";

export type ThemePreference = "light" | "dark" | "system";

export interface UserSettings {
  email: string;
  displayName: string;
  bio: string;
  campusId: string;
  avatarDataUrl: string | null;
  bannerDataUrl: string | null;
  theme: ThemePreference;
  studyMode: StudyMode;
  notifyStudyReminders: boolean;
  notifyGroupActivity: boolean;
  notifyCampusAnnouncements: boolean;
  quietHoursEnabled: boolean;
  /** Local time `HH:MM` (24h) when quiet hours begin. */
  quietHoursStart: string;
  /** Local time `HH:MM` (24h) when quiet hours end. May be “before” start (overnight window). */
  quietHoursEnd: string;
}

export const defaultUserSettings: UserSettings = {
  email: "",
  displayName: "",
  bio: "",
  campusId: "",
  avatarDataUrl: null,
  bannerDataUrl: null,
  theme: "system",
  studyMode: "focus",
  notifyStudyReminders: true,
  notifyGroupActivity: true,
  notifyCampusAnnouncements: true,
  quietHoursEnabled: false,
  quietHoursStart: DEFAULT_QUIET_HOURS_START,
  quietHoursEnd: DEFAULT_QUIET_HOURS_END,
};
