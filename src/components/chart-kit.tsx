"use client";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Table2 } from "lucide-react";
import { api } from "@/lib/client/api";

// The chart kit (owner, 28 Nov 2026: "master my app in charts and graphs"). Shared by every chart so
// they read as one system, following the data-visualisation method in DECISIONS.md choice 36:
//  - colour: Bloat Score uses the score ramp (one hue, light to dark); a single measure uses the brand
//    colour; gridlines and axes are the line token, hairline and solid. Design tokens only.
//  - the ramp's light end is too pale to see on its own (checked: 1.18:1 on white, 1.23:1 on the dark
//    surface), so a light mark always carries a thin control-coloured outline and its number;
//  - every chart has a table twin ("Show as a table"), so no value depends on colour or on hovering;
//  - the person's "Hide charts" setting hides every chart; the numbers stay as text.

/** CSS colour for a Bloat Score or strength (the same steps as scoreTone in ui.tsx). */
export const scoreFill = (n: number | null) =>
  n === null || n <= 0 ? "var(--surface)" : n <= 3 ? "var(--score-mild)" : n <= 6 ? "var(--score-moderate)" : n <= 8 ? "var(--score-strong)" : "var(--score-severe)";
/** Text colour that reads on scoreFill(n). */
export const scoreInk = (n: number | null) =>
  n === null || n <= 6 ? "var(--on-score)" : n <= 8 ? "var(--on-score-strong)" : "var(--on-score-severe)";
/** Light steps need an outline to be seen at all (the ramp's light end fails contrast on the surface). */
export const scoreOutline = (n: number | null) => (n === null || n <= 3 ? "var(--control)" : "none");

export const AXIS_TICK = { fontSize: 11, fill: "var(--ink-muted)" } as const;

// ---------- "Hide charts" (You, Settings) ----------
let hidden: boolean | null = null;
const listeners = new Set<() => void>();
let asked = false;

/** Called by You when the setting changes, so open screens follow at once. */
export function setChartsHidden(value: boolean) {
  hidden = value;
  listeners.forEach((l) => l());
}

/** True when the person chose Hide charts; null until known (nothing is drawn meanwhile). */
export function useChartsHidden(): boolean | null {
  const [value, setValue] = useState<boolean | null>(hidden);
  useEffect(() => {
    const l = () => setValue(hidden);
    listeners.add(l);
    if (hidden === null && !asked) {
      asked = true;
      // If the setting can't be read, charts stay hidden: the person may have asked for that.
      api<{ profile?: { hide_charts?: boolean } }>("GET", "/v1/me/state")
        .then((r) => setChartsHidden(!!r.profile?.hide_charts))
        .catch(() => { asked = false; setChartsHidden(true); });
    } else if (hidden !== null) {
      queueMicrotask(l);
    }
    return () => { listeners.delete(l); };
  }, []);
  return value;
}

/** Draws its chart only when charts are not hidden. The numbers beside a chart stay either way. */
export function ChartGate({ children, hide }: { children: ReactNode; hide?: boolean }) {
  const h = useChartsHidden();
  if (hide ?? h ?? true) return null;
  return <>{children}</>;
}

// ---------- Tooltip ----------
/** The tap/hover card: the value leads, its label follows. Same look on every chart. */
export function TipCard({ title, rows }: { title: string; rows: Array<{ value: string; label?: string; mark?: string }> }) {
  return (
    <div className="pointer-events-none flex min-w-36 flex-col gap-1 rounded-sm border border-line bg-surface px-3 py-2 text-left">
      <span className="t-caption">{title}</span>
      {rows.map((r, i) => (
        <span key={i} className="flex items-center gap-2">
          {r.mark && <span aria-hidden className="h-0.5 w-3 rounded-pill" style={{ background: r.mark }} />}
          <span className="font-display text-base font-bold tabular text-ink">{r.value}</span>
          {r.label && <span className="text-sm text-ink-muted">{r.label}</span>}
        </span>
      ))}
    </div>
  );
}

// ---------- Table twin ----------
/** Every chart's plain-table twin: closed by default, one tap away, read by screen readers as a table. */
export function TableView({ caption, head, rows }: { caption: string; head: string[]; rows: Array<Array<string | number>> }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!rows.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-sm px-1 text-sm font-semibold text-brand-text hover:bg-subtle">
        <Table2 size={16} aria-hidden />{open ? "Hide the table" : "Show as a table"}
      </button>
      {open && (
        <div id={id} className="rise-in overflow-x-auto rounded-sm border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead><tr className="bg-subtle">{head.map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold text-ink">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {r.map((c, j) => j === 0 ? <th key={j} scope="row" className="px-3 py-2 font-normal text-ink">{c}</th> : <td key={j} className="px-3 py-2 tabular text-ink">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Legends ----------
/** The Bloat Score colour key: the number is always printed on the chart, the colour only supports it. */
export function ScoreLegend({ unknown = true }: { unknown?: boolean }) {
  const steps: Array<[string, number]> = [["1–3", 2], ["4–6", 5], ["7–8", 7], ["9–10", 9]];
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0 text-xs text-ink-muted" aria-label="Colour key">
      {steps.map(([label, n]) => (
        <li key={label} className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-[3px] border" style={{ background: scoreFill(n), borderColor: scoreOutline(n) === "none" ? scoreFill(n) : scoreOutline(n) }} />{label}
        </li>
      ))}
      {unknown && <li className="flex items-center gap-1.5"><span aria-hidden className="inline-flex h-3 w-3 items-center justify-center rounded-[3px] border border-dashed border-control text-[8px]">?</span>no score</li>}
    </ul>
  );
}

/** A short key for a line or a mark: a stroke or a swatch of the series colour, then its name in text colour. */
export function Key({ items }: { items: Array<{ label: string; color: string; kind?: "line" | "box" | "ring" | "dot" | "diamond" | "ramp" }> }) {
  return (
    <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-xs text-ink-muted" aria-label="Key">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          {it.kind === "line" ? <span aria-hidden className="h-0.5 w-4 rounded-pill" style={{ background: it.color }} />
            : it.kind === "ring" ? <span aria-hidden className="h-2.5 w-2.5 rounded-full border-2 bg-surface" style={{ borderColor: it.color }} />
            : it.kind === "dot" ? <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
            : it.kind === "diamond" ? <span aria-hidden className="h-2 w-2 rotate-45 rounded-[1px]" style={{ background: it.color }} />
            : it.kind === "ramp" ? <span aria-hidden className="flex gap-px">{[2, 5, 7, 9].map((n) => <span key={n} className="h-3 w-2 rounded-[2px] border" style={{ background: scoreFill(n), borderColor: scoreOutline(n) === "none" ? scoreFill(n) : scoreOutline(n) }} />)}</span>
            : <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ background: it.color }} />}
          {it.label}
        </li>
      ))}
    </ul>
  );
}
