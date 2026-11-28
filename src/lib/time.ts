// Time rules (plan A03). Instants are UTC milliseconds; days are "YYYY-MM-DD" in a pinned IANA zone.
// No device clock is trusted for meaning: the server derives every analysis date here.

export type LocalParts = { y: number; m: number; d: number; h: number; mi: number; s: number };

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(zone: string): Intl.DateTimeFormat {
  let f = fmtCache.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    fmtCache.set(zone, f);
  }
  return f;
}

export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone.includes("/") || zone === "UTC";
  } catch {
    return false;
  }
}

export function localParts(ms: number, zone: string): LocalParts {
  const out: Record<string, number> = {};
  for (const p of fmt(zone).formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { y: out.year!, m: out.month!, d: out.day!, h: out.hour!, mi: out.minute!, s: out.second! };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export function localDate(ms: number, zone: string): string {
  const p = localParts(ms, zone);
  return `${pad(p.y, 4)}-${pad(p.m)}-${pad(p.d)}`;
}

export function localTime(ms: number, zone: string): string {
  const p = localParts(ms, zone);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

/** Minutes east of UTC for this instant in this zone (India = 330, Toronto in winter = -300). */
export function offsetMinutes(ms: number, zone: string): number {
  const p = localParts(ms, zone);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/**
 * Turn a wall-clock time into UTC instants. Returns 0 candidates for a time that does not
 * exist (clocks went forward), 2 for an ambiguous time (clocks went back), otherwise 1.
 */
export function zonedToUtc(local: string, zone: string): number[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local);
  if (!m) return [];
  const [y, mo, d, h, mi, s] = [1, 2, 3, 4, 5, 6].map((i) => Number(m[i] ?? 0)) as [number, number, number, number, number, number];
  const wall = Date.UTC(y, mo - 1, d, h, mi, s);
  const found = new Set<number>();
  for (const probe of [wall - 36 * 3600_000, wall - 3600_000, wall, wall + 3600_000, wall + 36 * 3600_000]) {
    const candidate = wall - offsetMinutes(probe, zone) * 60000;
    const p = localParts(candidate, zone);
    if (p.y === y && p.m === mo && p.d === d && p.h === h && p.mi === mi) found.add(candidate);
  }
  return [...found].sort((a, b) => a - b);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${pad(t.getUTCFullYear(), 4)}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function diffDays(a: string, b: string): number {
  const p = (x: string) => {
    const [y, m, d] = x.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(a) - p(b)) / 86400000);
}

export function isDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
}

/** Day of week, 0 = Sunday. */
export function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Monday of the week containing this date. */
export function weekStart(date: string): string {
  return addDays(date, -((weekday(date) + 6) % 7));
}

/** First instant of a local day. If midnight does not exist that day, the first valid minute is used. */
export function dayStartUtc(date: string, zone: string): number {
  for (let minutes = 0; minutes < 180; minutes += 15) {
    const c = zonedToUtc(`${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`, zone);
    if (c.length) return c[0]!;
  }
  throw new Error("NO_DAY_START");
}

export function dayBoundsUtc(date: string, zone: string): [number, number] {
  return [dayStartUtc(date, zone), dayStartUtc(addDays(date, 1), zone)];
}

export type ZonePeriod = { effective_from: string; zone: string };

/**
 * The analysis date of an instant. A zone change takes effect from a stated date and never moves
 * earlier days (plan A03): each period owns the instants from the start of its first day.
 */
export function analysisDate(ms: number, periods: ZonePeriod[]): string {
  const sorted = [...periods].sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  for (const p of sorted) {
    if (ms >= dayStartUtc(p.effective_from, p.zone)) return localDate(ms, p.zone);
  }
  const first = sorted[sorted.length - 1];
  if (!first) throw new Error("NO_ZONE");
  return localDate(ms, first.zone);
}

export function zoneForDate(date: string, periods: ZonePeriod[]): string {
  const sorted = [...periods].sort((a, b) => (a.effective_from < b.effective_from ? 1 : -1));
  for (const p of sorted) if (date >= p.effective_from) return p.zone;
  const first = sorted[sorted.length - 1];
  if (!first) throw new Error("NO_ZONE");
  return first.zone;
}

/** Split an interval over local dates using real elapsed UTC time (23:00–02:00 = 1 h + 2 h). */
export function splitByDate(startMs: number, endMs: number, periods: ZonePeriod[]): Record<string, number> {
  const out: Record<string, number> = {};
  let cursor = startMs;
  let guard = 0;
  while (cursor < endMs && guard++ < 4000) {
    const date = analysisDate(cursor, periods);
    const zone = zoneForDate(date, periods);
    const nextStart = dayStartUtc(addDays(date, 1), zone);
    const sliceEnd = Math.min(endMs, nextStart > cursor ? nextStart : cursor + 86400000);
    out[date] = (out[date] ?? 0) + (sliceEnd - cursor);
    cursor = sliceEnd;
  }
  return out;
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Unambiguous display: the month is always a word, so 03/04 can never flip meaning. */
export function formatDate(date: string, dateFormat: "MM/DD" | "DD/MM", withWeekday = true): string {
  const [, m, d] = date.split("-").map(Number) as [number, number, number];
  const body = dateFormat === "MM/DD" ? `${MONTHS[m - 1]} ${d}` : `${d} ${MONTHS[m - 1]}`;
  return withWeekday ? `${DAYS[weekday(date)]} ${body}` : body;
}

/** "Nov 1 to Nov 22", or null when the range has no finished day yet (it would start after it ends). */
export function formatRange(from: string, to: string, dateFormat: "MM/DD" | "DD/MM"): string | null {
  return from > to ? null : `${formatDate(from, dateFormat, false)} to ${formatDate(to, dateFormat, false)}`;
}

export function formatClock(ms: number, zone: string, units: "us" | "metric"): string {
  const p = localParts(ms, zone);
  if (units === "metric") return `${p.h}:${pad(p.mi)}`;
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${pad(p.mi)} ${p.h < 12 ? "am" : "pm"}`;
}

/**
 * A clock time that says which one it was when that clock time happened twice (the clocks went back):
 * "1:50 am (before the clocks went back)", "1:10 am (after the clocks went back)". Otherwise the same
 * as formatClock. Compares clock offsets, so seconds do not matter.
 */
export function formatClockNoted(ms: number, zone: string, units: "us" | "metric"): string {
  const base = formatClock(ms, zone, units);
  const twins = zonedToUtc(`${localDate(ms, zone)}T${localTime(ms, zone)}`, zone);
  if (twins.length !== 2) return base;
  return `${base} (${offsetMinutes(ms, zone) === offsetMinutes(twins[0]!, zone) ? "before" : "after"} the clocks went back)`;
}
