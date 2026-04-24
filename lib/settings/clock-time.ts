/**
 * 24h clock strings as "HH:MM" (matches `<input type="time" value>` for minute precision).
 */
export const DEFAULT_QUIET_HOURS_START = "22:00";
export const DEFAULT_QUIET_HOURS_END = "08:00";

const HHMM_24 = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseStoredHHMM(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const t = value.trim();
  return HHMM_24.test(t) ? t : fallback;
}

/** Normalizes a browser `type="time"` value to `HH:MM`. */
export function normalizeTimeInputValue(value: string, fallback: string): string {
  const m = value.match(/^(\d{1,2}):(\d{1,2})(?::\d+)?/);
  if (!m) return fallback;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return fallback;
  if (h < 0 || h > 23 || min < 0 || min > 59) return fallback;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
