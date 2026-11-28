"use client";
import { useId, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

// "From scattered notes to one clear record" (owner, 28 Nov 2026; the drag-to-compare idea seen on
// metavixtechno.com, made our own). Drag the handle, or use the arrow keys, to compare a phone's
// scattered notes with the same days as a Bloat Buddy record. Both sides are samples. The control is
// a real range input laid over the picture, so it works with touch, mouse, keyboard and screen readers.

const NOTES = [
  { t: "tue lunch – bloated again?? maybe 7", strike: false },
  { t: "ate rajma… or was that monday", strike: false },
  { t: "felt fine thurs (i think)", strike: true },
  { t: "doctor: \"how often?\"  no idea", strike: false },
  { t: "screenshot_2231.jpg", strike: false },
];

const DAYS = [
  { d: "Mon", s: 3 }, { d: "Tue", s: 7 }, { d: "Wed", s: 4 }, { d: "Thu", s: 1 }, { d: "Fri", s: 5 },
];
const TONE = (n: number) => (n <= 3 ? "bg-score-mild text-on-score" : n <= 6 ? "bg-score-moderate text-on-score" : "bg-score-strong text-on-score-strong");

export function BeforeAfter() {
  const id = useId();
  const [pos, setPos] = useState(55);
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="compare relative isolate grid overflow-hidden rounded-lg border border-line bg-surface select-none" style={{ ["--pos" as string]: `${pos}%` }}>
        {/* Before: scattered notes. */}
        <div className="flex min-h-[22rem] flex-col gap-3 bg-subtle p-6 [grid-area:1/1] md:p-8" aria-hidden>
          <span className="t-label">Before · phone notes</span>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 font-mono text-[0.9375rem] text-ink-muted">
            {NOTES.map((n) => <li key={n.t} className={n.strike ? "line-through" : ""}>{n.t}</li>)}
          </ul>
          <span className="mt-auto self-start rounded-sm border border-dashed border-control px-3 py-1.5 text-sm text-ink-muted">No dates, no scores, nothing to show</span>
        </div>
        {/* After: the same days as a record, revealed from the handle to the right. */}
        <div className="flex flex-col gap-3 bg-surface p-6 [grid-area:1/1] md:p-8" style={{ clipPath: "inset(0 0 0 var(--pos))" }} aria-hidden>
          <span className="t-label self-end">After · Bloat Buddy</span>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {DAYS.map((x) => (
              <li key={x.d} className="flex items-center justify-end gap-3 rounded-sm border border-line px-3 py-2">
                <span className="font-semibold text-ink">{x.d}</span>
                <span className="flex items-center gap-2 text-sm text-ink-muted">Bloat Score<span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-pill px-2 text-sm font-bold tabular ${TONE(x.s)}`}>{x.s}</span></span>
              </li>
            ))}
          </ul>
          <span className="mt-auto self-end rounded-sm bg-brand-tint px-3 py-1.5 text-sm font-semibold text-brand-text">Ready to show at an appointment</span>
        </div>
        {/* The handle. */}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-brand" style={{ left: "var(--pos)" }} aria-hidden>
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-on-brand"><ChevronsLeftRight size={20} /></span>
        </div>
        <label htmlFor={id} className="sr-only">Compare scattered notes with a Bloat Buddy record: move left to see more of the record</label>
        <input id={id} type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
          aria-valuetext={`${100 - pos}% record shown`}
          className="compare-range absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </div>
      <figcaption className="t-caption">Drag the handle to compare. Sample notes and a sample record.</figcaption>
    </figure>
  );
}
