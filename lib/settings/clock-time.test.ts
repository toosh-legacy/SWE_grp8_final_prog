/**
 * clock-time.test.ts
 * Framework: Vitest
 * Module:    lib/settings/clock-time.ts
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUIET_HOURS_END,
  DEFAULT_QUIET_HOURS_START,
  normalizeTimeInputValue,
  parseStoredHHMM,
} from "./clock-time";

describe("parseStoredHHMM()", () => {
  it("CT1 | valid string -> same value", () => {
    expect(parseStoredHHMM("23:30", "00:00")).toBe("23:30");
  });
  it("CT2 | invalid or non-string -> fallback", () => {
    expect(parseStoredHHMM("25:00", DEFAULT_QUIET_HOURS_START)).toBe(
      DEFAULT_QUIET_HOURS_START,
    );
    expect(parseStoredHHMM("12:60", DEFAULT_QUIET_HOURS_END)).toBe(
      DEFAULT_QUIET_HOURS_END,
    );
    expect(parseStoredHHMM(123, "09:00")).toBe("09:00");
  });
});

describe("normalizeTimeInputValue()", () => {
  it("CT3 | typical time input -> padded HH:MM", () => {
    expect(normalizeTimeInputValue("9:5", "00:00")).toBe("09:05");
  });
  it("CT4 | out of range -> fallback", () => {
    expect(normalizeTimeInputValue("24:00", "10:00")).toBe("10:00");
  });
});
