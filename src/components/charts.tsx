"use client";
import { useState } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Caption, Card, Label, Segmented, cx } from "./ui";
import { AXIS_TICK, Key, ScoreLegend, TableView, TipCard, scoreFill, scoreInk, scoreOutline } from "./chart-kit";
import { formatDate } from "@/lib/time";
import { DUR, DUR_MS, EASE_OUT } from "@/lib/motion";
import type { DayRow } from "@/app/(app)/history/history";

// Charts (Recharts and plain SVG/CSS; owner's toolkit of 27 Nov, chart system of 28 Nov 2026, DECISIONS.md
// choice 36). Every chart shows only figures the app already works out on the server; nothing new is
// calculated here except where a value sits on the page. Marks are thin, bars have a 4px rounded end and a
// square base, gridlines are hairlines, colours are tokens. Each chart has its numbers in text or a table
// twin, and grows in over 400ms (once, and again when its data changes); with reduce motion it just appears.

function useChartMotion() {
  const reduce = useReducedMotion();
  return { isAnimationActive: !reduce, animationDuration: DUR_MS.slow, animationEasing: "ease-out" as const };
}

const STATUS: Record<DayRow["status"], string> = { CONFIRMED: "Confirmed", LATE: "Late review", PROVISIONAL: "Not yet confirmed", CONFLICT: "Check this day", UNKNOWN: "No score" };
const dayValue = (d: DayRow) => d.score ?? d.highest_logged;
const dayText = (d: DayRow) => {
  const v = dayValue(d);
  if (d.score !== null) return `Bloat Score ${d.score}`;
  if (v !== null) return `Highest logged ${v}, not confirmed`;
  return "No score";
};

/** A bar path with a 4px rounded top and a square base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.max(0, Math.min(4, w / 2, h));
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
}

// ===================================================================================== Daily Bloat Score

type DayPoint = { date: string; value: number; status: DayRow["status"]; unknown: boolean; row: DayRow };

/** One day's mark. Solid = confirmed, hollow = late, dashed = not yet confirmed (highest logged), "?" = no score. */
function DayMark(props: { x?: number; y?: number; width?: number; height?: number; payload?: DayPoint; picked?: string | null }) {
  const { x = 0, y = 0, width = 0, height = 0, payload, picked } = props;
  if (!payload) return null;
  const on = picked === payload.date;
  if (payload.unknown) {
    return <text x={x + width / 2} y={y + height - 4} textAnchor="middle" fontSize={12} fontWeight={on ? 800 : 400} fill="var(--ink-muted)">?</text>;
  }
  const h = Math.max(3, height);
  const top = y + height - h;
  const solid = payload.status === "CONFIRMED";
  const v = payload.value;
  return (
    <g>
      <path d={barPath(x, top, width, h)} fill={solid ? scoreFill(v) : "var(--surface)"}
        stroke={solid ? scoreOutline(v) : scoreFill(v) === "var(--score-mild)" ? "var(--control)" : scoreFill(v)}
        strokeWidth={solid ? 1 : 2} strokeDasharray={payload.status === "PROVISIONAL" || payload.status === "CONFLICT" ? "3 3" : undefined} style={{ cursor: "pointer" }} />
      {on && <path d={barPath(x - 3, top - 3, width + 6, h + 3)} fill="none" stroke="var(--ink)" strokeWidth={2} />}
    </g>
  );
}

function DayTip({ active, payload, dateFormat }: { active?: boolean; payload?: Array<{ payload: DayPoint }>; dateFormat: "MM/DD" | "DD/MM" }) {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  const v = dayValue(p.row);
  return <TipCard title={formatDate(p.date, dateFormat)} rows={[{ value: v === null ? "?" : String(v), label: p.row.score !== null ? `${STATUS[p.status]}` : v !== null ? "highest logged, not confirmed" : "no score" }]} />;
}

/** Daily Bloat Score for a week, a month or everything, with context shading. Tap or point at a day for its details. */
export function DayChart({ days, dateFormat, context }: { days: DayRow[]; dateFormat: "MM/DD" | "DD/MM"; context: Array<{ from: string; to: string; kind: string }> }) {
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const [picked, setPicked] = useState<DayRow | null>(null);
  const motion = useChartMotion();
  const shown = range === "week" ? days.slice(-7) : range === "month" ? days.slice(-30) : days;
  const data: DayPoint[] = shown.map((d) => {
    const v = dayValue(d);
    const unknown = d.status === "UNKNOWN" || v === null;
    return { date: d.date, value: unknown ? 0 : v!, status: d.status, unknown, row: d };
  });
  const labelEvery = Math.max(1, Math.ceil(shown.length / 6));
  const areas = context.map((c) => {
    const a = shown.find((d) => d.date >= c.from)?.date;
    const b = [...shown].reverse().find((d) => d.date <= c.to)?.date;
    return a && b && a <= b ? { ...c, a, b } : null;
  }).filter((c): c is NonNullable<typeof c> => c !== null);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label>Daily Bloat Score</Label>
        <Segmented label="Range" value={range} onChange={setRange} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "all", label: "All" }]} />
      </div>
      <div role="img" aria-label={`Daily Bloat Score for ${shown.length} days. Details are in the table and in the list of days below.`} className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }} accessibilityLayer={false} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke="var(--line)" />
            {areas.map((c, i) => <ReferenceArea key={i} x1={c.a} x2={c.b} fill="var(--brand-tint)" fillOpacity={0.7} ifOverflow="extendDomain" />)}
            <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "var(--line)" }} interval={labelEvery - 1} tick={AXIS_TICK} tickFormatter={(d: string) => formatDate(d, dateFormat, false)} />
            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tickLine={false} axisLine={false} width={26} tick={AXIS_TICK} />
            <Tooltip cursor={{ fill: "var(--subtle)" }} content={<DayTip dateFormat={dateFormat} />} isAnimationActive={false} />
            <Bar dataKey="value" maxBarSize={22} shape={<DayMark picked={picked?.date ?? null} />} onClick={(_, i) => setPicked(shown[i] ?? null)} {...motion} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ScoreLegend />
      <Caption>Solid: confirmed. Hollow: late review. Dashed: highest logged, not yet confirmed. ?: no score.{context.length ? " Shaded: context you logged, such as a period or a medicine change." : ""}</Caption>
      {picked && (
        <p role="status" className="t-caption text-ink">
          {formatDate(picked.date, dateFormat)}: {dayText(picked)}. <Link href={`/day/${picked.date}`} className="font-semibold">Open this day</Link>
        </p>
      )}
      <TableView caption="Daily Bloat Score" head={["Day", "Score", "Status"]}
        rows={[...shown].reverse().map((d) => [formatDate(d.date, dateFormat), dayValue(d) ?? "?", STATUS[d.status]])} />
    </Card>
  );
}

// ===================================================================================== Month calendar

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** A month at a glance: each day coloured by its Bloat Score, with the number printed. Tap a day to open it. */
export function MonthCalendar({ days, today, dateFormat, context }: { days: DayRow[]; today: string; dateFormat: "MM/DD" | "DD/MM"; context: Array<{ from: string; to: string; kind: string }> }) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))].sort();
  if (!months.includes(today.slice(0, 7))) months.push(today.slice(0, 7));
  const [at, setAt] = useState(months.length - 1);
  const ym = months[Math.min(at, months.length - 1)]!;
  const [y, mo] = ym.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const title = first.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const inContext = (date: string) => context.some((c) => date >= c.from && date <= c.to);
  const cells = Array.from({ length: count }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
  const logged = cells.filter((d) => byDate.has(d) && d <= today);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Month at a glance</Label>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous month" disabled={at === 0} onClick={() => setAt((a) => Math.max(0, a - 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-subtle disabled:opacity-40"><ChevronLeft size={20} aria-hidden /></button>
          <span className="min-w-32 text-center font-semibold" aria-live="polite">{title}</span>
          <button type="button" aria-label="Next month" disabled={at >= months.length - 1} onClick={() => setAt((a) => Math.min(months.length - 1, a + 1))}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-subtle disabled:opacity-40"><ChevronRight size={20} aria-hidden /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center" aria-hidden>
        {WEEKDAYS.map((w, i) => <span key={i} className="text-xs text-ink-muted">{w}</span>)}
      </div>
      <ol className="m-0 grid list-none grid-cols-7 gap-1.5 p-0" aria-label={`Days in ${title}`}>
        {Array.from({ length: lead }, (_, i) => <li key={`lead-${i}`} aria-hidden />)}
        {cells.map((date) => {
          const n = Number(date.slice(8));
          const d = byDate.get(date);
          if (date > today || !d) {
            return <li key={date} aria-hidden className="flex aspect-square items-start justify-start rounded-sm p-1 text-[0.625rem] text-ink-muted/60">{n}</li>;
          }
          const v = dayValue(d);
          const solid = d.status === "CONFIRMED";
          const unknown = d.status === "UNKNOWN" || v === null;
          const style = unknown ? { background: "var(--surface)", borderColor: "var(--control)", borderStyle: "dashed" as const, color: "var(--ink-muted)" }
            : solid ? { background: scoreFill(v), borderColor: scoreOutline(v) === "none" ? scoreFill(v) : scoreOutline(v), color: scoreInk(v) }
            : { background: "var(--surface)", borderColor: scoreFill(v) === "var(--score-mild)" ? "var(--control)" : scoreFill(v), borderStyle: d.status === "LATE" ? "solid" as const : "dashed" as const, color: "var(--ink)" };
          return (
            <li key={date}>
              <Link href={`/day/${date}`} data-press title={`${formatDate(date, dateFormat)}: ${dayText(d)}`} aria-label={`${formatDate(date, dateFormat)}: ${dayText(d)}${d.status !== "CONFIRMED" && d.status !== "PROVISIONAL" && !unknown ? `, ${STATUS[d.status].toLowerCase()}` : ""}${inContext(date) ? ", context logged" : ""}`}
                className={cx("relative flex aspect-square flex-col items-center justify-center rounded-sm border-2 no-underline transition-[outline-color] hover:outline-2 hover:outline-offset-1 hover:outline-ink", date === today && "outline-2 outline-offset-1 outline-brand")}
                style={style}>
                <span className="absolute left-1 top-0.5 text-[0.625rem] leading-none opacity-80">{n}</span>
                <span className="font-display text-sm font-bold tabular leading-none">{unknown ? "?" : v}</span>
                {d.status === "LATE" && <Clock aria-hidden size={10} strokeWidth={2.4} className="absolute right-1 top-1 opacity-80" />}
                {inContext(date) && <span aria-hidden className="absolute bottom-1 h-1 w-3 rounded-pill bg-ink-muted/70" />}
              </Link>
            </li>
          );
        })}
      </ol>
      <ScoreLegend />
      <Caption>Filled: confirmed. Outlined with a small clock: late review. Dashed: not confirmed yet, or no score (?).{context.length ? " A short bar: context you logged that day." : ""} Today has a teal ring.</Caption>
      <TableView caption={`Bloat Scores in ${title}`} head={["Day", "Score", "Status"]} rows={logged.map((date) => { const d = byDate.get(date)!; return [formatDate(date, dateFormat), dayValue(d) ?? "?", STATUS[d.status]]; })} />
    </Card>
  );
}

// ===================================================================================== Comparisons

/** Labelled bars on the 0 to 10 Bloat Score scale, for comparing averages. One measure, so one colour;
 *  each bar is named in text and its average and day count are printed at its end. */
export function ValueBars({ rows, label, emphasis }: { rows: Array<{ label: string; value: number; days: number }>; label: string; emphasis?: number }) {
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col gap-1.5">
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label={label}>
          {rows.map((r, i) => (
            <li key={r.label} className="grid grid-cols-[6.5rem_1fr_6.5rem] items-center gap-3">
              <span className="text-sm text-ink">{r.label}</span>
              <span className="relative h-3 rounded-r-sm bg-subtle" aria-hidden>
                <span className="absolute inset-y-0 left-1/2 w-px bg-line" />
                <m.span className="absolute inset-y-0 left-0 origin-left rounded-r-[4px]" style={{ width: `${Math.max(1.5, (Math.min(10, r.value) / 10) * 100)}%`, background: emphasis === undefined || emphasis === i ? "var(--brand)" : "var(--control)" }}
                  initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: DUR.slow, ease: EASE_OUT, delay: i * 0.06 }} />
              </span>
              <span className="text-sm tabular text-ink"><strong className="font-display">{r.value.toFixed(1)}</strong> <span className="text-ink-muted">· {r.days} {r.days === 1 ? "day" : "days"}</span></span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-[6.5rem_1fr_6.5rem] gap-3" aria-hidden>
          <span />
          <span className="relative h-4 text-[0.6875rem] text-ink-muted"><span className="absolute left-0">0</span><span className="absolute left-1/2 -translate-x-1/2">5</span><span className="absolute right-0">10</span></span>
          <span />
        </div>
      </div>
    </LazyMotion>
  );
}

/** "Points the same way in both halves": the difference in each half of the period, either side of zero. */
export function HalvesCheck({ first, second }: { first: number | null; second: number | null }) {
  const reduce = useReducedMotion();
  const vals = [first, second];
  const max = Math.max(2, ...vals.map((v) => Math.ceil(Math.abs(v ?? 0))));
  const same = first !== null && second !== null && first !== 0 && second !== 0 && Math.sign(first) === Math.sign(second);
  const fmt = (v: number | null) => (v === null ? "–" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`);
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex flex-col gap-1.5 rounded-sm border border-line p-3">
        <p className="t-caption text-ink">Difference in each half of the period</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {[["First half", first], ["Second half", second]].map(([name, v], i) => {
            const val = v as number | null;
            const w = val === null ? 0 : (Math.abs(val) / max) * 50;
            return (
              <li key={name as string} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2">
                <span className="text-sm text-ink">{name as string}</span>
                <span className="relative h-3" aria-hidden>
                  <span className="absolute inset-y-[-3px] left-1/2 w-0.5 -translate-x-1/2 bg-ink" />
                  {val !== null && val !== 0 && (
                    <m.span className={cx("absolute inset-y-0", val > 0 ? "left-1/2 origin-left rounded-r-[4px]" : "right-1/2 origin-right rounded-l-[4px]")} style={{ width: `${w}%`, background: "var(--ink-muted)" }}
                      initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: DUR.slow, ease: EASE_OUT, delay: i * 0.06 }} />
                  )}
                </span>
                <span className="text-right text-sm font-semibold tabular text-ink">{fmt(val)}</span>
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-[5.5rem_1fr_3rem] gap-2 text-[0.6875rem] text-ink-muted" aria-hidden>
          <span /><span className="flex justify-between"><span>lower with it</span><span>higher with it</span></span><span />
        </div>
        <p className="t-caption">{first === null || second === null ? "Not enough days in one of the halves." : same ? "Both halves point the same way." : "The halves point different ways."}</p>
      </div>
    </LazyMotion>
  );
}

/** Before and after on the 0 to 10 scale: a ring for the earlier value, a dot for the later one. */
export function Dumbbell({ rows, fromLabel, toLabel }: { rows: Array<{ label: string; from: number | null; to: number | null; note?: string }>; fromLabel: string; toLabel: string }) {
  const pos = (v: number) => `${(Math.min(10, Math.max(0, v)) / 10) * 100}%`;
  return (
    <div className="flex flex-col gap-2">
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-2 text-sm"><span className="text-ink">{r.label}</span>
              <span className="tabular text-ink">{r.from === null ? "–" : r.from.toFixed(1)} <span className="text-ink-muted">→</span> <strong className="font-display">{r.to === null ? "–" : r.to.toFixed(1)}</strong></span></span>
            <span className="relative mx-1.5 h-4" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
              {r.from !== null && r.to !== null && <span className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-brand" style={{ left: pos(Math.min(r.from, r.to)), width: `calc(${pos(Math.max(r.from, r.to))} - ${pos(Math.min(r.from, r.to))})` }} />}
              {r.from !== null && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-surface" style={{ left: pos(r.from) }} />}
              {r.to !== null && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand outline-2 outline-surface" style={{ left: pos(r.to) }} />}
            </span>
            {r.note && <span className="t-caption">{r.note}</span>}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <Key items={[{ label: fromLabel, color: "var(--brand)", kind: "ring" }, { label: toLabel, color: "var(--brand)" }]} />
        <span className="text-[0.6875rem] text-ink-muted" aria-hidden>scale 0 to 10</span>
      </div>
    </div>
  );
}

// ===================================================================================== Parts and counts

/** One whole split into parts (for example confirmed, late and unscored days), with a legend of counts. */
export function SegmentedBar({ parts, label }: { parts: Array<{ label: string; value: number; color: string; ink: string }>; label: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  if (!total) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-7 w-full gap-0.5" role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
        {parts.filter((p) => p.value > 0).map((p) => {
          const share = p.value / total;
          return (
            <span key={p.label} className="flex items-center overflow-visible rounded-[4px] px-2 text-xs font-semibold tabular" style={{ flexGrow: p.value, flexBasis: 0, background: p.color, color: p.ink }}>
              {share >= 0.18 ? `${Math.round(share * 100)}%` : ""}
            </span>
          );
        })}
      </div>
      <Key items={parts.map((p) => ({ label: `${p.label} ${p.value}`, color: p.color }))} />
    </div>
  );
}

/** Rows of a name, a thin meter and a figure (for example "4 of 7 days"). */
export function MeterList({ rows, max, unit, label }: { rows: Array<{ label: string; value: number }>; max: number; unit: (v: number) => string; label: string }) {
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label={label}>
        {rows.map((r, i) => (
          <li key={r.label} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-3 text-sm"><span className="text-ink">{r.label}</span><span className="tabular text-ink-muted">{unit(r.value)}</span></span>
            <span className="relative h-2 rounded-pill bg-brand-tint" aria-hidden>
              <m.span className="absolute inset-y-0 left-0 origin-left rounded-pill bg-brand" style={{ width: `${Math.min(100, (r.value / max) * 100)}%` }}
                initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: DUR.slow, ease: EASE_OUT, delay: i * 0.05 }} />
            </span>
          </li>
        ))}
      </ul>
    </LazyMotion>
  );
}

// ===================================================================================== Time

/** Hour-of-day pattern (after 10 ended episodes with a known start). The busiest hour stands out. */
export function HourChart({ hours }: { hours: number[] }) {
  const motion = useChartMotion();
  const max = Math.max(1, ...hours);
  const data = hours.map((n, h) => ({ h, n }));
  const label = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const peaks = hours.map((n, h) => (n === max ? h : -1)).filter((h) => h >= 0);
  const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
  const sentence = peaks.length === 1 ? `Most often between ${label(peaks[0]!)} and ${label((peaks[0]! + 1) % 24)}.` : `Equally often in the hours starting ${list(peaks.map(label))}.`;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink">{sentence}</p>
      <div role="img" aria-label={`Bloating starts by hour of day. ${sentence}`} className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 18, left: 18, bottom: 0 }} accessibilityLayer={false} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="h" tickLine={false} axisLine={{ stroke: "var(--line)" }} ticks={[0, 6, 12, 18, 23]} interval={0} tick={AXIS_TICK} tickFormatter={(h: number) => label(h)} />
            <YAxis hide domain={[0, max]} />
            <Tooltip cursor={{ fill: "var(--subtle)" }} isAnimationActive={false}
              content={({ active, payload }) => { const p = active ? (payload?.[0]?.payload as { h: number; n: number } | undefined) : undefined; return p ? <TipCard title={`${label(p.h)} to ${label((p.h + 1) % 24)}`} rows={[{ value: String(p.n), label: p.n === 1 ? "start" : "starts" }]} /> : null; }} />
            <Bar dataKey="n" maxBarSize={12} radius={[4, 4, 0, 0]} {...motion}>
              {data.map((d) => <Cell key={d.h} fill={d.n === max ? "var(--brand)" : "var(--control)"} fillOpacity={d.n ? 1 : 0.25} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableView caption="Bloating starts by hour" head={["Hour", "Starts"]} rows={data.filter((d) => d.n > 0).map((d) => [`${label(d.h)} to ${label((d.h + 1) % 24)}`, d.n])} />
    </div>
  );
}

/** Weekly average Bloat Score as a line with a soft area. Weeks without scores are gaps, never zeros. */
export function TrendLine({ points }: { points: Array<{ label: string; value: number | null; days?: number }> }) {
  const motion = useChartMotion();
  const known = points.filter((p) => p.value !== null);
  if (known.length < 2) return <Caption>A trend line appears once two weeks have scored days.</Caption>;
  const data = points.map((p, i) => ({ i, value: p.value, label: p.label, days: p.days ?? null }));
  const last = [...data].reverse().find((d) => d.value !== null)!;
  return (
    <div className="flex flex-col gap-2">
      <div role="img" aria-label={`Weekly average Bloat Score: ${known.map((p) => `${p.label} ${p.value!.toFixed(1)}`).join(", ")}.`} className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 28, left: 0, bottom: 0 }} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tickLine={false} axisLine={false} width={26} tick={AXIS_TICK} />
            <XAxis dataKey="i" tickLine={false} axisLine={{ stroke: "var(--line)" }} interval="preserveStartEnd" minTickGap={24} tick={AXIS_TICK} tickFormatter={(i: number) => data[i]?.label ?? ""} />
            <Tooltip cursor={{ stroke: "var(--control)", strokeWidth: 1 }} isAnimationActive={false}
              content={({ active, payload }) => { const p = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined; return p ? <TipCard title={`Week of ${p.label}`} rows={[{ value: p.value === null ? "–" : p.value.toFixed(1), label: p.value === null ? "no scored days" : `average${p.days ? ` · ${p.days} ${p.days === 1 ? "day" : "days"}` : ""}`, mark: "var(--brand)" }]} /> : null; }} />
            <Area type="linear" dataKey="value" stroke="var(--brand)" strokeWidth={2} fill="var(--brand)" fillOpacity={0.1} connectNulls={false}
              dot={{ r: 4, fill: "var(--brand)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 5, fill: "var(--brand)", stroke: "var(--surface)", strokeWidth: 2 }}
              label={(p: { x?: number | string; y?: number | string; index?: number }) => p.index === last.i ? <text x={Number(p.x ?? 0) + 8} y={Number(p.y ?? 0) + 4} fontSize={12} fontWeight={700} fill="var(--ink)">{last.value!.toFixed(1)}</text> : <g />} {...motion} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TableView caption="Weekly average Bloat Score" head={["Week of", "Average", "Days"]} rows={data.map((d) => [d.label, d.value === null ? "–" : d.value.toFixed(1), d.days ?? "–"])} />
    </div>
  );
}
