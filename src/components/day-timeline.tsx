"use client";
import { useState, type ReactNode } from "react";
import { dayBoundsUtc, formatClockNoted, formatDate, localDate, zonedToUtc } from "@/lib/time";
import { Key, TableView, scoreFill, scoreOutline } from "./chart-kit";

// One day as a picture from its midnight to the next (owner, 28 Nov 2026: charts and pattern diagrams;
// DECISIONS.md choice 36). Rows for bloating, meals, exercise and bowel movements. Every mark sits at
// the real instant it happened, between the day's actual first instant and the next day's, in the
// account's time zone: a day with a clock change is 23 or 25 hours long and is drawn that way, so a
// record never runs backwards (review of 28 Nov 2026, finding 4). A clock time in the hour that
// happened twice says whether it was before or after the change; a time on another day says the day.
// Bloating is a bar coloured by its strongest reading, with each reading as a dot; an end that isn't
// known fades out instead of being made up. Pro only (charts are a Pro feature), and hidden with the
// "Hide charts" setting. The table twin lists every entry with its time. Saved times are not changed.

type Ep = { started_at: string; ended_at: string | null; samples: Array<{ strength: number; observed_at: string }> };
type Props = {
  date: string; today: string; zone: string; units: "us" | "metric"; dateFormat?: "MM/DD" | "DD/MM";
  episodes: Ep[]; meals: Array<{ eaten_at: string; dish_text: string }>; exercise: Array<{ started_at: string; type: string; minutes: number }>;
  bowel: Array<{ occurred_at: string }>;
};

const HOUR = 3_600_000;

export function DayTimeline({ date, today, zone, units, dateFormat = "MM/DD", episodes, meals, exercise, bowel }: Props) {
  // The day's real bounds: its first instant and the next day's first instant (23, 24 or 25 hours apart).
  const [dayStart, dayEnd] = dayBoundsUtc(date, zone);
  const span = dayEnd - dayStart;
  const clip = (ms: number) => Math.min(dayEnd, Math.max(dayStart, ms));
  const pct = (ms: number) => `${((clip(ms) - dayStart) / span) * 100}%`;
  const hours = Math.round(span / HOUR);
  const changed = hours === 25 ? "back" : hours === 23 ? "forward" : null;
  /** The clock time; in a repeated hour, which one; on another day, which day. */
  const clock = (iso: string) => {
    const ms = Date.parse(iso);
    const d = localDate(ms, zone);
    const base = formatClockNoted(ms, zone, units);
    return d === date ? base : `${formatDate(d, dateFormat)}, ${base}`;
  };
  const isToday = date === today;
  // The time the screen opened (read once; a day screen is short-lived).
  const [openedAt] = useState(() => Date.now());
  const now = isToday ? clip(openedAt) : null;
  // Axis and grid: the day's own 00:00, 06:00, 12:00 and 18:00 (where that clock time exists) and its end.
  const ticks = [0, 6, 12, 18].flatMap((h) => {
    const ms = h === 0 ? dayStart : zonedToUtc(`${date}T${String(h).padStart(2, "0")}:00`, zone)[0];
    return ms === undefined ? [] : [{ ms, label: units === "us" ? ["12 am", "6 am", "12 pm", "6 pm"][h / 6]! : `${String(h).padStart(2, "0")}:00` }];
  });
  ticks.push({ ms: dayEnd, label: units === "us" ? "12 am" : "24:00" });

  const rows: Array<{ name: string; marks: ReactNode[] }> = [];
  if (episodes.length) {
    rows.push({
      name: "Bloating",
      marks: episodes.map((e, i) => {
        const start = Date.parse(e.started_at);
        const open = e.ended_at === null;
        const end = open ? (isToday ? (now ?? dayEnd) : dayEnd) : Date.parse(e.ended_at!);
        const top = e.samples.length ? Math.max(...e.samples.map((s) => s.strength)) : null;
        const fill = scoreFill(top);
        return (
          <span key={`ep-${i}`}>
            <span className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[4px] border" title={`Bloating from ${clock(e.started_at)}${open ? ", end not logged" : ` to ${clock(e.ended_at!)}`}${top !== null ? `, strongest ${top}` : ""}`}
              style={{ left: pct(start), width: `max(6px, calc(${pct(end)} - ${pct(start)}))`, background: fill, borderColor: scoreOutline(top) === "none" ? fill : scoreOutline(top),
                maskImage: open && !isToday ? "linear-gradient(90deg, #000 70%, transparent)" : undefined }} />
            {e.samples.map((s, j) => (
              <span key={j} title={`Strength ${s.strength} at ${clock(s.observed_at)}`} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink outline-2 outline-surface" style={{ left: pct(Date.parse(s.observed_at)) }} />
            ))}
          </span>
        );
      }),
    });
  }
  if (meals.length) rows.push({ name: "Meals", marks: meals.map((m, i) => <span key={`m-${i}`} title={`${m.dish_text} at ${clock(m.eaten_at)}`} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand outline-2 outline-surface" style={{ left: pct(Date.parse(m.eaten_at)) }} />) });
  if (exercise.length) {
    rows.push({
      name: "Exercise",
      marks: exercise.map((x, i) => {
        const s = Date.parse(x.started_at);
        return <span key={`x-${i}`} title={`${x.type} for ${x.minutes} minutes at ${clock(x.started_at)}`} className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[4px] bg-ink-muted" style={{ left: pct(s), width: `max(6px, calc(${pct(s + x.minutes * 60_000)} - ${pct(s)}))` }} />;
      }),
    });
  }
  if (bowel.length) rows.push({ name: "Bowel", marks: bowel.map((b, i) => <span key={`b-${i}`} title={`Bowel movement at ${clock(b.occurred_at)}`} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-control" style={{ left: pct(Date.parse(b.occurred_at)) }} />) });
  if (!rows.length) return null;

  const table: Array<[number, string, string, string]> = [
    ...episodes.flatMap((e) => [
      [Date.parse(e.started_at), clock(e.started_at), "Bloating started", e.ended_at ? `ended ${clock(e.ended_at)}` : "end not logged"] as [number, string, string, string],
      ...e.samples.map((s) => [Date.parse(s.observed_at), clock(s.observed_at), "Strength", String(s.strength)] as [number, string, string, string]),
    ]),
    ...meals.map((m) => [Date.parse(m.eaten_at), clock(m.eaten_at), "Meal", m.dish_text] as [number, string, string, string]),
    ...exercise.map((x) => [Date.parse(x.started_at), clock(x.started_at), "Exercise", `${x.type}, ${x.minutes} min`] as [number, string, string, string]),
    ...bowel.map((b) => [Date.parse(b.occurred_at), clock(b.occurred_at), "Bowel movement", ""] as [number, string, string, string]),
  ].sort((a, b) => a[0] - b[0]);

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="flex flex-col gap-2" role="img" aria-label={`The day from midnight to midnight${changed ? `, ${hours} hours long` : ""}: ${rows.map((r) => `${r.name} ${r.marks.length}`).join(", ")}. Every entry is in the table.`}>
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
            <span className="text-xs text-ink-muted">{r.name}</span>
            <span className="relative h-6 rounded-sm bg-subtle">
              {ticks.slice(1, -1).map((t) => <span key={t.ms} aria-hidden className="absolute inset-y-0 w-px bg-line" style={{ left: pct(t.ms) }} />)}
              {now !== null && <span aria-hidden className="absolute inset-y-[-4px] w-0.5 bg-ink" style={{ left: pct(now) }} />}
              {r.marks}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[4.5rem_1fr] gap-2" aria-hidden>
          <span />
          <span className="relative h-4 text-[0.6875rem] text-ink-muted">
            {ticks.map((t, i) => <span key={t.ms} className={`absolute whitespace-nowrap ${i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: pct(t.ms) }}>{t.label}</span>)}
          </span>
        </div>
      </div>
      {changed && (
        <p className="t-caption m-0">
          {changed === "back"
            ? "The clocks went back this day, so it had 25 hours and one hour happened twice. The picture is drawn to real time, and times in that hour say whether they were before or after the change."
            : "The clocks went forward this day, so it had 23 hours and one hour was skipped. The picture is drawn to real time."}
        </p>
      )}
      <Key items={[
        ...(episodes.length ? [{ label: "Bloating, coloured by its strongest reading", color: "", kind: "ramp" as const }, { label: "A strength reading", color: "var(--ink)", kind: "dot" as const }] : []),
        ...(meals.length ? [{ label: "Meal", color: "var(--brand)", kind: "dot" as const }] : []),
        ...(exercise.length ? [{ label: "Exercise", color: "var(--ink-muted)" }] : []),
        ...(bowel.length ? [{ label: "Bowel movement", color: "var(--control)", kind: "diamond" as const }] : []),
        ...(isToday ? [{ label: "Now", color: "var(--ink)", kind: "line" as const }] : []),
      ]} />
      <TableView caption="This day's entries in time order" head={["Time", "Entry", "Detail"]} rows={table.map(([, t, what, detail]) => [t, what, detail])} />
    </figure>
  );
}
