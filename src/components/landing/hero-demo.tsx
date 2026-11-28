"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import { reducedMotion } from "@/lib/motion";
import { CountUp } from "@/components/count-up";
import { useBrowserValue } from "@/lib/client/browser-value";

// The start page's sample phone (owner, 28 Nov 2026): a drawing of the Today screen that logs
// bloating by itself, the way a person would: tap "I feel bloated", the sheet slides up, 4 is
// picked, Save, then the tick message and today's day filling in. Sample entries only, nothing is
// sent. Every step is 400ms or less; the loop pauses when it is off screen, when the page's motion
// is paused, and never plays with reduce motion (the finished state is shown instead).

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0 idle · 1 tap "I feel bloated" · 2 sheet open · 3 tap 4 · 4 tap Save · 5 saved, message shown · 6 message gone
const TIMELINE: Array<[Step, number]> = [[1, 1300], [2, 1650], [3, 2600], [4, 3500], [5, 3800], [6, 6700]];
const LOOP_MS = 8800;
const PAUSE_EVENT = "bb-motion-pause";

export function motionPaused() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-motion-paused");
}

export function HeroDemo() {
  const box = useRef<HTMLDivElement>(null);
  const [playing, setStep] = useState<Step>(0);
  const [running, setRunning] = useState(false);
  const reduce = useBrowserValue(reducedMotion, false);
  const label = useBrowserValue(() => new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), "");
  const index = useBrowserValue(() => (new Date().getDay() + 6) % 7, 4);
  const day = { label, index };
  // With reduce motion the finished state is shown and nothing plays.
  const step: Step = reduce ? 6 : playing;

  useEffect(() => {
    if (reducedMotion()) return;
    let visible = false;
    const sync = () => setRunning(visible && !motionPaused() && !document.hidden);
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; sync(); }, { threshold: 0.25 });
    if (box.current) io.observe(box.current);
    addEventListener(PAUSE_EVENT, sync);
    document.addEventListener("visibilitychange", sync);
    return () => { io.disconnect(); removeEventListener(PAUSE_EVENT, sync); document.removeEventListener("visibilitychange", sync); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      setStep(0);
      for (const [s, at] of TIMELINE) timers.push(setTimeout(() => setStep(s), at));
      timers.push(setTimeout(play, LOOP_MS));
    };
    play();
    return () => timers.forEach(clearTimeout);
  }, [running]);

  const saved = step >= 5;
  const sheetOpen = step === 2 || step === 3;
  const week = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div ref={box} className="w-[18.75rem] rounded-[2.75rem] bg-ink p-3" aria-hidden>
      <div className="relative flex h-[30rem] flex-col gap-3.5 overflow-hidden rounded-[2.125rem] bg-ground px-4 pb-4 pt-5">
        <div className="flex flex-col gap-0.5">
          <span className="t-label min-h-4 text-[0.6875rem]">{day.label}</span>
          <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">Today</span>
        </div>

        <div className="grid">
          <div className="demo-swap flex flex-col gap-2.5 rounded-md border border-line bg-surface p-3.5 [grid-area:1/1]" data-hidden={saved || undefined}>
            <span className="font-display text-[0.9375rem] font-bold text-ink">How are you feeling?</span>
            <span className="text-[0.8125rem] text-ink-muted">Nothing logged yet today.</span>
            <span className="relative flex min-h-9 items-center justify-center rounded-sm bg-brand text-[0.8125rem] font-semibold text-on-brand transition-[scale] duration-150" style={{ scale: step === 1 ? 0.96 : 1 }} data-tapping={step === 1 || undefined}>
              I feel bloated<span className="demo-tap" />
            </span>
            <span className="flex min-h-9 items-center justify-center rounded-sm border border-line text-[0.8125rem] font-semibold text-ink">No bloating so far today</span>
          </div>
          <div className="demo-swap flex flex-col gap-2.5 rounded-md border border-line bg-surface p-3.5 [grid-area:1/1]" data-hidden={!saved || undefined}>
            <span className="text-[0.8125rem] text-ink-muted">Bloating now</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-[2.125rem] font-extrabold tabular leading-none text-ink">{saved ? <CountUp value={4} /> : "0"}</span>
              <span className="text-sm text-ink-muted">of 10 · since 2:14 pm</span>
            </span>
            <span className="grid grid-cols-2 gap-2">
              <span className="flex min-h-9 items-center justify-center rounded-sm border border-line text-[0.8125rem] font-semibold text-ink">Update</span>
              <span className="flex min-h-9 items-center justify-center rounded-sm bg-brand text-[0.8125rem] font-semibold text-on-brand">It&apos;s gone</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface px-3 py-2.5">
          <span className="text-[0.75rem] font-semibold text-ink">This week</span>
          <div className="grid grid-cols-7 gap-1 text-center">
            {week.map((l, i) => {
              const today = i === day.index;
              const done = i < day.index && i !== day.index - 2;
              const fill = done || (today && saved);
              return (
                <span key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[0.625rem] text-ink-muted">{l}</span>
                  <span className={`h-6 w-6 rounded-full transition-colors duration-250 ${fill ? "bg-brand" : today ? "border-2 border-brand" : i > day.index ? "border border-dashed border-line" : "border border-line"}`} />
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["Meal", "Activity", "Bowel"].map((x) => <span key={x} className="flex justify-center rounded-sm border border-line bg-surface px-1 py-2.5 text-xs font-semibold text-ink">{x}</span>)}
        </div>

        {/* The bottom sheet, sliding up over a dimmed screen. */}
        <div className={`absolute inset-0 bg-ink/30 transition-opacity duration-250 ${sheetOpen ? "opacity-100" : "opacity-0"}`} />
        <div className="demo-sheet absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-[1.5rem] border-t border-line bg-surface px-4 pb-5 pt-2.5" data-open={sheetOpen || step === 4 ? "" : undefined}>
          <span className="mx-auto h-1 w-8 rounded-pill bg-line" />
          <span className="font-display text-base font-bold text-ink">Log bloating</span>
          <span className="text-[0.75rem] text-ink-muted">How strong is it right now?</span>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const on = n === 4 && step >= 3;
              return (
                <span key={n} className={`relative flex min-h-8 items-center justify-center rounded-[0.5rem] border text-[0.8125rem] font-semibold tabular transition-colors duration-150 ${on ? "border-brand bg-brand text-on-brand" : "border-control bg-surface text-ink"}`} data-tapping={(n === 4 && step === 3) || undefined}>
                  {n}<span className="demo-tap" />
                </span>
              );
            })}
          </div>
          <span className="relative flex min-h-9 items-center justify-center rounded-sm bg-brand text-[0.8125rem] font-semibold text-on-brand transition-[scale] duration-150" style={{ scale: step === 4 ? 0.96 : 1 }} data-tapping={step === 4 || undefined}>
            Save<span className="demo-tap" />
          </span>
        </div>

        {/* The save message: a tick and three words, then it goes. */}
        <div className="demo-toast absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md bg-ink px-3 py-2.5 text-[0.8125rem] font-semibold text-ground" data-open={step === 5 ? "" : undefined}>
          <Check size={15} strokeWidth={2.6} className="text-inverse-accent" />Bloating saved.
        </div>
      </div>
    </div>
  );
}

/** Pauses every moving part of the start page (the phone, the ticker, the dot pattern). */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);
  const reduce = useBrowserValue(reducedMotion, true);
  if (reduce) return null;
  const toggle = () => {
    const next = !paused;
    setPaused(next);
    document.documentElement.toggleAttribute("data-motion-paused", next);
    dispatchEvent(new Event(PAUSE_EVENT));
  };
  return (
    <button type="button" onClick={toggle} className="inline-flex min-h-11 items-center gap-2 rounded-pill px-3 text-sm font-semibold text-ink-muted hover:text-ink">
      {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
      {paused ? "Play animation" : "Pause animation"}
    </button>
  );
}
