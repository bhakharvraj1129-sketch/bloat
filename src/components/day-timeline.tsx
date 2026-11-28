"use client";
import { useState, type ReactNode } from "react";
import { localParts, formatClock } from "@/lib/time";
import { Key, TableView, scoreFill, scoreOutline } from "./chart-kit";

// One day as a 24-hour picture (owner, 28 Nov 2026: charts and pattern diagrams; DECISIONS.md choice 36).
// Rows for bloating, meals, exercise and bowel movements, placed by the time they happened in the
// account's time zone. Bloating is a bar coloured by its strongest reading, with each reading as a dot;
// an end that isn't known fades out instead of being made up. Pro only (charts are a Pro feature), and
// hidden with the "Hide charts" setting. The table twin lists every entry with its time.

type Ep = { started_at: string; ended_at: string | null; samples: Array<{ strength: number; observed_at: string }> };
type Props = {
  date: string; today: string; zone: string; units: "us" | "metric";
  episodes: Ep[]; meals: Array<{ eaten_at: string; dish_text: string }>; exercise: Array<{ started_at: string; type: string; minutes: number }>;
  bowel: Array<{ occurred_at: string }>;
};

const DAY = 24 * 60;

export function DayTimeline({ date, today, zone, units, episodes, meals, exercise, bowel }: Props) {
  const mins = (iso: string | number, edge: "start" | "end" = "start") => {
    const ms = typeof iso === "number" ? iso : Date.parse(iso);
    const p = localParts(ms, zone);
    const d = `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
    if (d < date) return 0;
    if (d > date) return edge === "end" ? DAY : DAY;
    return p.h * 60 + p.mi;
  };
  const pct = (m: number) => `${(Math.min(DAY, Math.max(0, m)) / DAY) * 100}%`;
  const clock = (iso: string) => formatClock(Date.parse(iso), zone, units);
  const isToday = date === today;
  // The time the screen opened (read once; a day screen is short-lived).
  const [openedAt] = useState(() => Date.now());
  const now = isToday ? mins(openedAt) : null;
  const axis = units === "us" ? ["12 am", "6 am", "12 pm", "6 pm", "12 am"] : ["00:00", "06:00", "12:00", "18:00", "24:00"];

  const rows: Array<{ name: string; marks: ReactNode[] }> = [];
  if (episodes.length) {
    rows.push({
      name: "Bloating",
      marks: episodes.map((e, i) => {
        const start = mins(e.started_at);
        const open = e.ended_at === null;
        const end = open ? (isToday ? (now ?? DAY) : DAY) : mins(e.ended_at!, "end");
        const top = e.samples.length ? Math.max(...e.samples.map((s) => s.strength)) : null;
        const fill = scoreFill(top);
        return (
          <span key={`ep-${i}`}>
            <span className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[4px] border" title={`Bloating from ${clock(e.started_at)}${open ? ", end not logged" : ` to ${clock(e.ended_at!)}`}${top !== null ? `, strongest ${top}` : ""}`}
              style={{ left: pct(start), width: `max(6px, calc(${pct(end)} - ${pct(start)}))`, background: fill, borderColor: scoreOutline(top) === "none" ? fill : scoreOutline(top),
                maskImage: open && !isToday ? "linear-gradient(90deg, #000 70%, transparent)" : undefined }} />
            {e.samples.map((s, j) => (
              <span key={j} title={`Strength ${s.strength} at ${clock(s.observed_at)}`} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink outline-2 outline-surface" style={{ left: pct(mins(s.observed_at)) }} />
            ))}
          </span>
        );
      }),
    });
  }
  if (meals.length) rows.push({ name: "Meals", marks: meals.map((m, i) => <span key={`m-${i}`} title={`${m.dish_text} at ${clock(m.eaten_at)}`} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand outline-2 outline-surface" style={{ left: pct(mins(m.eaten_at)) }} />) });
  if (exercise.length) {
    rows.push({
      name: "Exercise",
      marks: exercise.map((x, i) => {
        const s = mins(x.started_at);
        return <span key={`x-${i}`} title={`${x.type} for ${x.minutes} minutes at ${clock(x.started_at)}`} className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[4px] bg-score-moderate" style={{ left: pct(s), width: `max(6px, calc(${pct(s + x.minutes)} - ${pct(s)}))` }} />;
      }),
    });
  }
  if (bowel.length) rows.push({ name: "Bowel", marks: bowel.map((b, i) => <span key={`b-${i}`} title={`Bowel movement at ${clock(b.occurred_at)}`} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-control" style={{ left: pct(mins(b.occurred_at)) }} />) });
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
      <div className="flex flex-col gap-2" role="img" aria-label={`The day from midnight to midnight: ${rows.map((r) => `${r.name} ${r.marks.length}`).join(", ")}. Every entry is in the table.`}>
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
            <span className="text-xs text-ink-muted">{r.name}</span>
            <span className="relative h-6 rounded-sm bg-subtle">
              {[25, 50, 75].map((g) => <span key={g} aria-hidden className="absolute inset-y-0 w-px bg-line" style={{ left: `${g}%` }} />)}
              {now !== null && <span aria-hidden className="absolute inset-y-[-4px] w-0.5 bg-ink" style={{ left: pct(now) }} />}
              {r.marks}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[4.5rem_1fr] gap-2" aria-hidden>
          <span />
          <span className="relative h-4 text-[0.6875rem] text-ink-muted">
            {axis.map((a, i) => <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full" style={{ left: `${i * 25}%` }}>{a}</span>)}
          </span>
        </div>
      </div>
      <Key items={[
        ...(episodes.length ? [{ label: "Bloating, coloured by strongest reading", color: "var(--score-moderate)" }, { label: "A strength reading", color: "var(--ink)" }] : []),
        ...(meals.length ? [{ label: "Meal", color: "var(--brand)" }] : []),
        ...(isToday ? [{ label: "Now", color: "var(--ink)", kind: "line" as const }] : []),
      ]} />
      <TableView caption="This day's entries in time order" head={["Time", "Entry", "Detail"]} rows={table.map(([, t, what, detail]) => [t, what, detail])} />
    </figure>
  );
}
