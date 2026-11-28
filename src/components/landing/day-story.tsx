"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Moon, Sunrise, Utensils, Waves } from "lucide-react";
import { reducedMotion } from "@/lib/motion";
import { useBrowserValue } from "@/lib/client/browser-value";

// "A day with Bloat Buddy" (owner, 28 Nov 2026): a scroll story. The screen holds still while you
// scroll through one day; the light changes from morning to night, a sun (then the moon) crosses the
// sky and a timeline fills. Every sentence describes something the app really does. Scroll drives
// it, so nothing plays by itself; with reduce motion, or before scripts run, the
// four moments are simply listed one after another.

type Scene = { time: string; title: string; text: string; icon: typeof Sunrise; card: string; tick?: boolean; night?: boolean; bg: string };
const SCENES: Scene[] = [
  { time: "8:30 am", title: "Morning review.", text: "A few quick questions about yesterday give it its Bloat Score.", icon: Sunrise, card: "Yesterday · Bloat Score 3", bg: "var(--brand-tint)" },
  { time: "1:15 pm", title: "Lunch, typed in.", text: "Type what you ate, how much and how fast. It always saves.", icon: Utensils, card: "Rice with dal · Saved", tick: true, bg: "var(--surface)" },
  { time: "4:40 pm", title: "Bloating starts.", text: "Two taps: when it started and how strong it feels. Tap again when it's gone.", icon: Waves, card: "Bloating now · 6 of 10", bg: "var(--subtle)" },
  { time: "9:30 pm", title: "Day done.", text: "Nothing to prepare. Tomorrow morning, a short review confirms today's score.", icon: Moon, card: "Today · 3 entries · review tomorrow", night: true, bg: "var(--night)" },
];

function SceneCard({ s }: { s: Scene }) {
  const Icon = s.icon;
  return (
    <div className={`flex items-center gap-3 rounded-md border px-4 py-3.5 ${s.night ? "border-on-night/20 bg-on-night/10" : "border-line bg-surface"}`}>
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${s.night ? "bg-on-night/15 text-night-accent" : "bg-brand-tint text-brand-text"}`}><Icon size={20} aria-hidden /></span>
      <span className="flex items-center gap-2 font-semibold">{s.card}{s.tick && <Check size={16} strokeWidth={2.6} className={s.night ? "text-night-accent" : "text-brand-text"} aria-hidden />}</span>
    </div>
  );
}

export function DayStory() {
  const section = useRef<HTMLElement>(null);
  const sun = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const [scene, setScene] = useState(0);

  // The held screen needs room: on very short or zoomed-in screens the moments are listed instead,
  // so no text is ever cut off.
  const mode = useBrowserValue<"list" | "scroll">(() => (!reducedMotion() && innerHeight >= 600 && innerWidth >= 340 ? "scroll" : "list"), "list");

  useEffect(() => {
    if (mode !== "scroll" || !section.current) return;
    const el = section.current;
    let raf = 0;
    // Where the story is, worked out from its real position on every scroll, so a change in the
    // height of anything above it (a label, a button, a font) can never leave it stuck mid-day.
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setScene(Math.min(SCENES.length - 1, Math.floor(p * SCENES.length)));
      // The sun rises on the left, peaks at midday and sets on the right; the moon takes over at night.
      // It stays in a band above the words (12 to 26% of the screen), so it never covers text.
      if (sun.current) {
        const x = 6 + p * 74;
        const y = 26 - Math.sin(Math.min(1, p / 0.75) * Math.PI) * 14;
        sun.current.style.transform = `translate(${x}vw, ${y}vh)`;
      }
      if (line.current) line.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [mode]);

  if (mode === "list") {
    return (
      <section aria-labelledby="day-title" className="border-y border-line">
        <h2 id="day-title" className="sr-only">A day with Bloat Buddy</h2>
        {SCENES.map((s) => (
          <div key={s.time} style={{ background: s.bg }} className={s.night ? "text-on-night" : ""}>
            <div className="mx-auto flex max-w-[76rem] flex-col gap-4 px-5 py-14 md:px-8 lg:px-12">
              <p className={`t-label ${s.night ? "text-night-accent" : ""}`}>A day with Bloat Buddy · {s.time}</p>
              <h3 className="t-headline">{s.title}</h3>
              <p className={`max-w-xl text-lg leading-8 ${s.night ? "" : "text-ink-muted"}`}>{s.text}</p>
              <div className="max-w-sm"><SceneCard s={s} /></div>
            </div>
          </div>
        ))}
      </section>
    );
  }

  const night = SCENES[scene]!.night;
  return (
    <section ref={section} aria-labelledby="day-title" className="relative" style={{ height: `${SCENES.length * 90}dvh` }}>
      <div className={`sticky top-0 flex h-dvh flex-col overflow-hidden transition-colors duration-[400ms] ${night ? "text-on-night" : "text-ink"}`} style={{ background: SCENES[scene]!.bg }}>
        {/* The sky: a sun by day; at night, the moon and a few stars. Clipped in its own frame. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span ref={sun} className={`absolute left-0 top-0 h-12 w-12 rounded-full transition-colors duration-[400ms] md:h-20 md:w-20 ${night ? "bg-on-night" : "bg-score-moderate"}`} style={{ transform: "translate(6vw, 26vh)" }} />
          {night && Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="fade-in absolute h-1 w-1 rounded-full bg-on-night/70" style={{ left: `${(i * 37) % 97}%`, top: `${6 + ((i * 53) % 24)}%` }} />
          ))}
        </div>

        <div className="relative mx-auto flex w-full max-w-[76rem] flex-1 flex-col justify-center gap-5 px-5 pt-24 md:px-8 lg:px-12">
          <h2 id="day-title" className={`t-label ${night ? "text-night-accent" : ""}`}>A day with Bloat Buddy</h2>
          <div className="grid">
            {SCENES.map((s, i) => (
              <div key={s.time} className="flex flex-col gap-4 transition-[opacity,transform] duration-[400ms] [grid-area:1/1]"
                style={{ opacity: i === scene ? 1 : 0, transform: `translateY(${i === scene ? 0 : i < scene ? -16 : 16}px)` }}>
                <p className={`font-display text-xl font-bold ${s.night ? "text-night-accent" : "text-brand-text"}`}>{s.time}</p>
                <h3 className="t-hero">{s.title}</h3>
                <p className={`max-w-xl text-lg leading-8 ${s.night ? "" : "text-ink-muted"}`}>{s.text}</p>
                <div className="max-w-sm"><SceneCard s={s} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* The day's timeline fills as you scroll. */}
        <div className="relative mx-auto w-full max-w-[76rem] px-5 pb-10 md:px-8 lg:px-12" aria-hidden>
          <div className={`relative h-0.5 ${night ? "bg-on-night/25" : "bg-line"}`}>
            <span ref={line} className={`absolute inset-0 origin-left ${night ? "bg-on-night" : "bg-ink"}`} style={{ transform: "scaleX(0)" }} />
          </div>
          <div className="mt-2 flex justify-between text-xs tabular">
            {SCENES.map((s, i) => <span key={s.time} className={i === scene ? "font-bold" : "opacity-60"}>{s.time}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}
