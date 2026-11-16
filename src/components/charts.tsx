"use client";
import { useState } from "react";
import { Caption, Card, Label, Segmented } from "./ui";
import { formatDate } from "@/lib/time";
import type { DayRow } from "@/app/(app)/history/history";

const TONE = (n: number) => (n <= 0 ? "var(--surface)" : n <= 3 ? "var(--score-mild)" : n <= 6 ? "var(--score-moderate)" : n <= 8 ? "var(--score-strong)" : "var(--score-severe)");

/**
 * Daily chart, hand-built SVG (no chart library). Solid = confirmed, hollow = late, dashed =
 * provisional (highest logged), "?" = unknown. Every mark is also listed as text for screen readers.
 */
export function DayChart({ days, dateFormat, context }: { days: DayRow[]; dateFormat: "MM/DD" | "DD/MM"; context: Array<{ from: string; to: string; kind: string }> }) {
  const [range, setRange] = useState<"week" | "month" | "all">("month");
  const shown = range === "week" ? days.slice(-7) : range === "month" ? days.slice(-30) : days;
  const W = 328, H = 150, left = 22, bottom = 22, top = 8;
  const plotW = W - left - 4, plotH = H - top - bottom;
  const step = plotW / Math.max(shown.length, 1);
  const bar = Math.max(3, Math.min(22, step - 3));
  const y = (v: number) => top + plotH - (v / 10) * plotH;
  const labelEvery = Math.max(1, Math.ceil(shown.length / 6));
  const [picked, setPicked] = useState<DayRow | null>(null);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Daily Bloat Score</Label>
        <Segmented label="Range" value={range} onChange={setRange} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "all", label: "All" }]} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily Bloat Score for ${shown.length} days. Details are in the list of days below.`} className="w-full">
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={left} x2={W - 4} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={left - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--ink-muted)">{v}</text>
          </g>
        ))}
        {context.map((c, i) => {
          const a = shown.findIndex((d) => d.date >= c.from);
          const b = shown.findLastIndex((d) => d.date <= c.to);
          if (a < 0 || b < a) return null;
          return <rect key={i} x={left + a * step} y={top} width={(b - a + 1) * step} height={plotH} fill="var(--brand-tint)" opacity={0.7}><title>{c.kind}</title></rect>;
        })}
        {shown.map((d, i) => {
          const cx = left + i * step + step / 2;
          const value = d.score ?? d.highest_logged;
          const common = { onClick: () => setPicked(d), style: { cursor: "pointer" } };
          const label = i % labelEvery === 0 ? <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">{formatDate(d.date, dateFormat, false)}</text> : null;
          if (d.status === "UNKNOWN" || value === null) {
            return <g key={d.date} {...common}><text x={cx} y={y(0) - 4} textAnchor="middle" fontSize={12} fill="var(--ink-muted)">?</text>{label}</g>;
          }
          const h = Math.max(3, y(0) - y(value));
          const x = cx - bar / 2;
          const solid = d.status === "CONFIRMED";
          return (
            <g key={d.date} {...common}>
              <rect x={x} y={y(0) - h} width={bar} height={h} rx={Math.min(bar / 2, 6)}
                fill={solid ? TONE(value) : "var(--surface)"} stroke={solid ? (value === 0 ? "var(--line)" : "none") : TONE(Math.max(value, 1))}
                strokeWidth={solid ? 1 : 2} strokeDasharray={d.status === "PROVISIONAL" || d.status === "CONFLICT" ? "3 3" : undefined} />
              {label}
            </g>
          );
        })}
      </svg>
      <Caption>Solid: confirmed. Hollow: late review. Dashed: highest logged, not yet confirmed. ?: no score.{context.length ? " Shaded: context you logged, such as a period or a medicine change." : ""}</Caption>
      {picked && <p role="status" className="t-caption text-ink">{formatDate(picked.date, dateFormat)}: {picked.score !== null ? `Bloat Score ${picked.score}` : picked.highest_logged !== null ? `highest logged ${picked.highest_logged}, not confirmed` : "no score"}</p>}
    </Card>
  );
}

/** A plain two-bar comparison with the numbers printed. Bars are the brand colour: a food never gets a colour of its own. */
export function CompareBars({ a, b }: { a: { label: string; value: number; days: number }; b: { label: string; value: number; days: number } }) {
  return (
    <div className="flex flex-col gap-2" role="img" aria-label={`${a.label}: average ${a.value.toFixed(1)} on ${a.days} days. ${b.label}: average ${b.value.toFixed(1)} on ${b.days} days.`}>
      {[a, b].map((x) => (
        <div key={x.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 t-caption">{x.label}</span>
          <span className="h-3 grow overflow-hidden rounded-pill bg-line"><span className="block h-full rounded-pill bg-brand" style={{ width: `${Math.max(2, (x.value / 10) * 100)}%` }} /></span>
          <span className="w-24 shrink-0 text-right tabular"><strong>{x.value.toFixed(1)}</strong> <span className="t-caption">· {x.days} days</span></span>
        </div>
      ))}
    </div>
  );
}

/** Hour-of-day pattern (after 10 ended episodes with a known start). */
export function HourChart({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  const W = 328, H = 90;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bloating starts by hour of day. Most starts: ${hours.indexOf(max)}:00.`} className="w-full">
      {hours.map((n, h) => (
        <rect key={h} x={4 + h * 13.4} y={H - 18 - (n / max) * (H - 26)} width={10} height={Math.max(1, (n / max) * (H - 26))} rx={3} fill="var(--brand)" opacity={n ? 1 : 0.2} />
      ))}
      {[0, 6, 12, 18, 23].map((h) => <text key={h} x={9 + h * 13.4} y={H - 4} fontSize={10} textAnchor="middle" fill="var(--ink-muted)">{h}:00</text>)}
    </svg>
  );
}

/** A small trend line of weekly averages. */
export function TrendLine({ points }: { points: Array<{ label: string; value: number | null }> }) {
  const W = 328, H = 80;
  const known = points.map((p, i) => ({ ...p, i })).filter((p) => p.value !== null);
  if (known.length < 2) return <Caption>A trend line appears once two weeks have scored days.</Caption>;
  const x = (i: number) => 10 + (i / Math.max(points.length - 1, 1)) * (W - 20);
  const y = (v: number) => 8 + (1 - v / 10) * (H - 24);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Weekly average Bloat Score: ${known.map((p) => `${p.label} ${p.value!.toFixed(1)}`).join(", ")}.`} className="w-full">
      <polyline fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={known.map((p) => `${x(p.i)},${y(p.value!)}`).join(" ")} />
      {known.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.value!)} r={3.5} fill="var(--brand)" />)}
      {known.map((p) => <text key={`t${p.i}`} x={x(p.i)} y={H - 2} fontSize={10} textAnchor="middle" fill="var(--ink-muted)">{p.value!.toFixed(1)}</text>)}
    </svg>
  );
}
