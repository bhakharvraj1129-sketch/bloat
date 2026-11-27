"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "motion/react";
import { Caption, Card, Label, Segmented } from "./ui";
import { formatDate } from "@/lib/time";
import { DUR_MS } from "@/lib/motion";
import type { DayRow } from "@/app/(app)/history/history";

// Charts (Recharts, owner's toolkit of 27 Nov 2026). Colours are design tokens only. Every chart
// grows in over 400ms and animates again when its data changes; with reduce motion it just appears.
// Each chart keeps a text alternative: its numbers are also printed or listed for screen readers.

const TONE = (n: number) => (n <= 0 ? "var(--surface)" : n <= 3 ? "var(--score-mild)" : n <= 6 ? "var(--score-moderate)" : n <= 8 ? "var(--score-strong)" : "var(--score-severe)");
const TICK = { fontSize: 10, fill: "var(--ink-muted)" };

function useChartMotion() {
  const reduce = useReducedMotion();
  return { isAnimationActive: !reduce, animationDuration: DUR_MS.slow, animationEasing: "ease-out" as const };
}

type DayPoint = { date: string; value: number; status: DayRow["status"]; unknown: boolean; row: DayRow };

/** One day's mark. Solid = confirmed, hollow = late, dashed = provisional (highest logged), "?" = no score. */
function DayMark(props: { x?: number; y?: number; width?: number; height?: number; payload?: DayPoint }) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;
  if (payload.unknown) return <text x={x + width / 2} y={y + height - 4} textAnchor="middle" fontSize={12} fill="var(--ink-muted)">?</text>;
  const h = Math.max(3, height);
  const top = y + height - h;
  const solid = payload.status === "CONFIRMED";
  const v = payload.value;
  return (
    <rect x={x} y={top} width={width} height={h} rx={Math.min(width / 2, 6)}
      fill={solid ? TONE(v) : "var(--surface)"} stroke={v <= 3 ? "var(--control)" : solid ? "none" : TONE(v)}
      strokeWidth={solid ? 1 : 2} strokeDasharray={payload.status === "PROVISIONAL" || payload.status === "CONFLICT" ? "3 3" : undefined}
      style={{ cursor: "pointer" }} />
  );
}

/** Daily Bloat Score for a week, a month or everything, with context shading. */
export function DayChart({ days, dateFormat, context }: { days: DayRow[]; dateFormat: "MM/DD" | "DD/MM"; context: Array<{ from: string; to: string; kind: string }> }) {
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const [picked, setPicked] = useState<DayRow | null>(null);
  const motion = useChartMotion();
  const shown = range === "week" ? days.slice(-7) : range === "month" ? days.slice(-30) : days;
  const data: DayPoint[] = shown.map((d) => {
    const v = d.score ?? d.highest_logged;
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
      <div role="img" aria-label={`Daily Bloat Score for ${shown.length} days. Details are in the list of days below.`} className="h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} accessibilityLayer={false} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke="var(--line)" />
            {areas.map((c, i) => <ReferenceArea key={i} x1={c.a} x2={c.b} fill="var(--brand-tint)" fillOpacity={0.7} ifOverflow="extendDomain" />)}
            <XAxis dataKey="date" tickLine={false} axisLine={false} interval={labelEvery - 1} tick={TICK} tickFormatter={(d: string) => formatDate(d, dateFormat, false)} />
            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tickLine={false} axisLine={false} width={26} tick={{ ...TICK, fontSize: 11 }} />
            <Bar dataKey="value" maxBarSize={22} shape={<DayMark />} onClick={(_, i) => setPicked(shown[i] ?? null)} {...motion} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Caption>Solid: confirmed. Hollow: late review. Dashed: highest logged, not yet confirmed. ?: no score.{context.length ? " Shaded: context you logged, such as a period or a medicine change." : ""}</Caption>
      {picked && <p role="status" className="t-caption text-ink">{formatDate(picked.date, dateFormat)}: {picked.score !== null ? `Bloat Score ${picked.score}` : picked.highest_logged !== null ? `highest logged ${picked.highest_logged}, not confirmed` : "no score"}</p>}
    </Card>
  );
}

/** A plain two-bar comparison with the numbers printed. Bars are the brand colour: a food never gets a colour of its own. */
export function CompareBars({ a, b }: { a: { label: string; value: number; days: number }; b: { label: string; value: number; days: number } }) {
  const motion = useChartMotion();
  const data = [a, b].map((x) => ({ ...x, shown: Math.max(0.2, x.value), text: `${x.value.toFixed(1)} · ${x.days} days` }));
  return (
    <div role="img" aria-label={`${a.label}: average ${a.value.toFixed(1)} on ${a.days} days. ${b.label}: average ${b.value.toFixed(1)} on ${b.days} days.`} className="h-[84px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 92, left: 0, bottom: 4 }} accessibilityLayer={false} barCategoryGap={12}>
          <XAxis type="number" domain={[0, 10]} hide />
          <YAxis type="category" dataKey="label" width={96} tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: "var(--ink-muted)" }} />
          <Bar dataKey="shown" fill="var(--brand)" radius={999} background={{ fill: "var(--line)", radius: 999 }} barSize={12} {...motion}>
            <LabelList dataKey="text" position="right" offset={0} content={(p) => {
              const { y = 0, height = 0, value } = p as { y?: number; height?: number; value?: string };
              return <text x="100%" dx={-4} y={Number(y) + Number(height) / 2 + 4} textAnchor="end" fontSize={13} fill="var(--ink)">{value}</text>;
            }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Hour-of-day pattern (after 10 ended episodes with a known start). */
export function HourChart({ hours }: { hours: number[] }) {
  const motion = useChartMotion();
  const max = Math.max(1, ...hours);
  const data = hours.map((n, h) => ({ h, n }));
  return (
    <div role="img" aria-label={`Bloating starts by hour of day. Most starts: ${hours.indexOf(max)}:00.`} className="h-[100px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} accessibilityLayer={false} barCategoryGap="20%">
          <XAxis dataKey="h" tickLine={false} axisLine={false} ticks={[0, 6, 12, 18, 23]} interval={0} tick={TICK} tickFormatter={(h: number) => `${h}:00`} />
          <Bar dataKey="n" radius={3} {...motion}>
            {data.map((d) => <Cell key={d.h} fill="var(--brand)" fillOpacity={d.n ? 1 : 0.2} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A small trend line of weekly averages. */
export function TrendLine({ points }: { points: Array<{ label: string; value: number | null }> }) {
  const motion = useChartMotion();
  const known = points.filter((p) => p.value !== null);
  if (known.length < 2) return <Caption>A trend line appears once two weeks have scored days.</Caption>;
  const data = points.map((p, i) => ({ i, value: p.value }));
  return (
    <div role="img" aria-label={`Weekly average Bloat Score: ${known.map((p) => `${p.label} ${p.value!.toFixed(1)}`).join(", ")}.`} className="h-[90px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: 10, bottom: 0 }} accessibilityLayer={false}>
          <YAxis domain={[0, 10]} hide />
          <XAxis dataKey="i" tickLine={false} axisLine={false} interval={0} tick={TICK} tickFormatter={(i: number) => (data[i]?.value != null ? data[i]!.value!.toFixed(1) : "")} />
          <Line type="linear" dataKey="value" stroke="var(--brand)" strokeWidth={2} connectNulls dot={{ r: 3.5, fill: "var(--brand)", stroke: "none" }} activeDot={false} {...motion} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
