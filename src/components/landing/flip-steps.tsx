"use client";
import { useState } from "react";
import { RotateCw } from "lucide-react";

// How it works as cards that flip (owner, 28 Nov 2026; the flip-card idea seen on metavixtechno.com,
// made our own). The front has the step's number and name; tap, or press Enter or Space, to turn it
// over to the details. Both sides are always in the page, so a screen reader reads them without
// flipping. 400ms, no bounce; with reduce motion it turns over at once.

export type Step = { n: string; title: string; text: string };

export function FlipSteps({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <ol data-reveal-group className="relative m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
      {steps.map((s) => {
        const on = !!open[s.n];
        return (
          <li key={s.n} className="flip-card">
            <button type="button" aria-expanded={on} onClick={() => setOpen((o) => ({ ...o, [s.n]: !on }))}
              className="block w-full rounded-lg text-left">
              <span className="flip-inner">
                <span className="flip-front flex min-h-44 flex-col gap-3 rounded-lg border border-line bg-surface p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand font-bold tabular text-on-brand" aria-hidden>{s.n}</span>
                  <span className="t-title text-ink">{s.title}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text" aria-hidden><RotateCw size={15} />Tap to see how</span>
                </span>
                <span className="flip-back flex min-h-44 flex-col gap-3 rounded-lg border border-brand bg-brand-tint p-6">
                  <span className="t-label text-brand-text">Step {s.n}</span>
                  <span className="leading-6 text-ink">{s.text}</span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text" aria-hidden><RotateCw size={15} />Tap to turn back</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
