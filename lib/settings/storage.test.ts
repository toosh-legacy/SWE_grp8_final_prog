/**
 * storage.test.ts - Campus Connect Settings
 * Test Class: Settings Persistence and Validation (TypeScript)
 *
 * Framework: Vitest
 * Module:    lib/settings/storage.ts
 *
 * ---------------------------------------------------------------------------
 * FIG S1 - INPUT VALUE ANALYSIS
 * ---------------------------------------------------------------------------
 *
 * loadSettings()
 * +----------------------+--------------------------+-------------------------+
 * | Input State          | Valid                    | Invalid/Exceptional     |
 * +----------------------+--------------------------+-------------------------+
 * | localStorage value   | valid JSON object        | malformed JSON string   |
 * | settings fields      | correctly typed fields   | wrong field types       |
 * | runtime env          | browser window available | server/no window        |
 * +----------------------+--------------------------+-------------------------+
 *
 * saveSettings(settings)
 * +----------------------+--------------------------+-------------------------+
 * | Input State          | Valid                    | Invalid/Exceptional     |
 * +----------------------+--------------------------+-------------------------+
 * | runtime env          | browser window available | server/no window        |
 * | settings object      | UserSettings object      | n/a (function serializes)|
 * +----------------------+--------------------------+-------------------------+
 *
 * ---------------------------------------------------------------------------
 * FIG S2 - TEST CASE SCENARIOS
 * ---------------------------------------------------------------------------
 *
 * loadSettings() - 6 scenarios
 * +------+-------------------------------------------------------------------+
 * | TC # | Scenario -> Expected Output                                       |
 * +------+-------------------------------------------------------------------+
 * | LS1  | no window (SSR) -> returns defaultUserSettings                    |
 * | LS2  | no saved storage entry -> returns defaultUserSettings             |
 * | LS3  | valid partial payload -> merges with defaults                     |
 * | LS4  | malformed JSON -> returns defaultUserSettings                     |
 * | LS5  | wrong field types -> ignores invalid fields, keeps valid values   |
 * | LS6  | invalid quiet time strings in JSON -> use defaults for those     |
 * +------+-------------------------------------------------------------------+
 *
 * saveSettings() - 2 scenarios
 * +------+-------------------------------------------------------------------+
 * | TC # | Scenario -> Expected Output                                       |
 * +------+-------------------------------------------------------------------+
 * | SS1  | browser env + valid settings -> localStorage.setItem called       |
 * | SS2  | no window (SSR) -> no throw and no write attempt                  |
 * +------+-------------------------------------------------------------------+
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSettings, saveSettings } from "./storage";
import { SETTINGS_STORAGE_KEY } from "./constants";
import { defaultUserSettings, type UserSettings } from "./types";

type LocalStorageLike = {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
};

function makeWindowMock(storageValue: string | null) {
  const localStorage: LocalStorageLike = {
    getItem: vi.fn().mockReturnValue(storageValue),
    setItem: vi.fn(),
  };

  return { localStorage } as unknown as Window;
}

function setWindow(win: Window | undefined) {
  Object.defineProperty(globalThis, "window", {
    value: win,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadSettings()", () => {
  it("LS1 | no window (SSR) -> returns defaultUserSettings", () => {
    setWindow(undefined);

    const result = loadSettings();

    expect(result).toEqual(defaultUserSettings);
  });

  it("LS2 | no saved storage entry -> returns defaultUserSettings", () => {
    setWindow(makeWindowMock(null));

    const result = loadSettings();

    expect(result).toEqual(defaultUserSettings);
  });

  it("LS3 | valid partial payload -> merges with defaults", () => {
    const partialPayload = {
      email: "student@example.edu",
      theme: "dark",
      quietHoursEnabled: true,
    };
    setWindow(makeWindowMock(JSON.stringify(partialPayload)));

    const result = loadSettings();

    expect(result.email).toBe("student@example.edu");
    expect(result.theme).toBe("dark");
    expect(result.quietHoursEnabled).toBe(true);
    expect(result.studyMode).toBe(defaultUserSettings.studyMode);
    expect(result.notifyGroupActivity).toBe(defaultUserSettings.notifyGroupActivity);
  });

  it("LS4 | malformed JSON -> returns defaultUserSettings", () => {
    setWindow(makeWindowMock("{not-json"));

    const result = loadSettings();

    expect(result).toEqual(defaultUserSettings);
  });

  it("LS5 | wrong field types -> ignores invalid fields, keeps valid values", () => {
    const mixedPayload = {
      email: 999,
      theme: "purple",
      studyMode: "group",
      notifyStudyReminders: "yes",
      displayName: "Alex",
    };
    setWindow(makeWindowMock(JSON.stringify(mixedPayload)));

    const result = loadSettings();

    expect(result.email).toBe(defaultUserSettings.email);
    expect(result.theme).toBe(defaultUserSettings.theme);
    expect(result.notifyStudyReminders).toBe(defaultUserSettings.notifyStudyReminders);
    expect(result.studyMode).toBe("group");
    expect(result.displayName).toBe("Alex");
  });

  it("LS6 | invalid quiet time strings in storage -> fall back to defaults", () => {
    setWindow(
      makeWindowMock(
        JSON.stringify({
          quietHoursStart: "25:00",
          quietHoursEnd: "8:00",
        }),
      ),
    );
    const result = loadSettings();
    expect(result.quietHoursStart).toBe(defaultUserSettings.quietHoursStart);
    expect(result.quietHoursEnd).toBe(defaultUserSettings.quietHoursEnd);
  });
});

describe("saveSettings()", () => {
  it("SS1 | browser env + valid settings -> localStorage.setItem called", () => {
    const windowMock = makeWindowMock(null);
    setWindow(windowMock);

    const nextSettings: UserSettings = {
      ...defaultUserSettings,
      email: "new@email.edu",
      theme: "light",
      notifyCampusAnnouncements: false,
    };

    saveSettings(nextSettings);

    expect(windowMock.localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(windowMock.localStorage.setItem).toHaveBeenCalledWith(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(nextSettings),
    );
  });

  it("SS2 | no window (SSR) -> no throw and no write attempt", () => {
    setWindow(undefined);

    expect(() => saveSettings(defaultUserSettings)).not.toThrow();
  });
});
