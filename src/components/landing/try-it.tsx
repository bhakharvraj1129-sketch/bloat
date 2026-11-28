"use client";
import { useId, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button, Chip, ChipGroup, StrengthScale } from "@/components/ui";
import { CountUp } from "@/components/count-up";

// "Try it" on the start page (owner, 28 Nov 2026): the real strength scale and choices from Log
// bloating, on a sample card that fills in as you tap. It stays on this page: nothing is saved or
// sent, and the page says so before and after.

const TONE = (n: number) => (n <= 3 ? "bg-score-mild" : n <= 6 ? "bg-score-moderate" : n <= 8 ? "bg-score-strong" : "bg-score-severe");
const WHEN = { now: "since just now", earlier: "since earlier today" } as const;

export function TryIt() {
  const id = useId();
  const [strength, setStrength] = useState<number | null>(null);
  const [when, setWhen] = useState<keyof typeof WHEN>("now");
  const [saved, setSaved] = useState<{ strength: number; when: keyof typeof WHEN } | null>(null);
  const shown = saved?.strength ?? strength;

  const reset = () => { setStrength(null); setWhen("now"); setSaved(null); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      <div className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-5 md:p-7">
        <div className="flex flex-col gap-3">
          <p id={`${id}-s`} className="t-label">1 · How strong is it right now?</p>
          <StrengthScale name="How strong is it right now? (sample)" value={strength} onChange={(n) => { setStrength(n); setSaved(null); }} />
        </div>
        <div className="flex flex-col gap-3">
          <p id={`${id}-w`} className="t-label">2 · When did it start?</p>
          <ChipGroup labelledBy={`${id}-w`}>
            <Chip role="radio" selected={when === "now"} onClick={() => { setWhen("now"); setSaved(null); }}>Just now</Chip>
            <Chip role="radio" selected={when === "earlier"} onClick={() => { setWhen("earlier"); setSaved(null); }}>Earlier today</Chip>
          </ChipGroup>
        </div>
        <Button disabled={strength === null} onClick={() => strength !== null && setSaved({ strength, when })}>{strength === null ? "Pick a number first" : "Save the sample"}</Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 md:p-7" aria-live="polite">
          <p className="text-ink-muted">Bloating now</p>
          <p className="flex items-baseline gap-2">
            {shown === null ? <span className="inline-block h-12 w-12 rounded-sm border-2 border-dashed border-line" aria-hidden /> : <span className="t-score leading-none"><CountUp value={shown} /></span>}
            <span className="text-ink-muted">{shown === null ? "Pick how strong it feels" : `of 10 · ${WHEN[saved?.when ?? when]}`}</span>
          </p>
          <div className="grid grid-cols-10 gap-1" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-2.5 rounded-pill transition-colors duration-250 ${shown !== null && i < shown ? TONE(shown) : "bg-subtle"}`} style={{ transitionDelay: `${i * 25}ms` }} />
            ))}
          </div>
          {saved ? (
            <p className="rise-in flex items-center gap-2 font-semibold text-brand-text"><Check size={18} strokeWidth={2.6} aria-hidden />Saved in this sample only. Nothing was sent.</p>
          ) : (
            <p className="t-caption">This sample stays on this page. Nothing you tap here is saved or sent.</p>
          )}
        </div>
        {saved && (
          <button type="button" onClick={reset} className="rise-in inline-flex min-h-11 items-center gap-2 self-start rounded-sm px-2 font-semibold text-ink hover:bg-subtle">
            <RotateCcw size={16} aria-hidden />Start again
          </button>
        )}
      </div>
    </div>
  );
}
