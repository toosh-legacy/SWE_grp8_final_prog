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
};
