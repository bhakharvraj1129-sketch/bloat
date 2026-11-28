"use client";
import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { DUR, EASE_OUT } from "@/lib/motion";

// Questions on the start page (owner, 28 Nov 2026). Each answer opens smoothly (250ms, height and
// fade) and the plus turns into a cross. Answers state only what is already true of the product
// (About, Privacy, How it works); medical help is linked, never rewritten.

export type Question = { q: string; a: ReactNode };

export function Faq({ items }: { items: Question[] }) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <ul className="flex list-none flex-col gap-3 p-0" data-reveal-group>
        {items.map((it, i) => {
          const on = open === i;
          return (
            <li key={it.q} className="rounded-md border border-line bg-surface" style={{ ["--i" as string]: i }}>
              <h3 className="m-0">
                <button type="button" id={`${id}-q${i}`} aria-expanded={on} aria-controls={`${id}-a${i}`} onClick={() => setOpen(on ? null : i)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 rounded-md px-5 py-3 text-left font-display text-[1.0625rem] font-bold text-ink hover:bg-subtle">
                  {it.q}
                  <span className={`faq-icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${on ? "bg-brand text-on-brand" : "bg-brand-tint text-brand-text"}`} aria-hidden><Plus size={18} strokeWidth={2.4} /></span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {on && (
                  <m.div id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} className="overflow-hidden"
                    initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: DUR.base, ease: EASE_OUT }}>
                    <div className="px-5 pb-5 leading-7 text-ink-muted">{it.a}</div>
                  </m.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </LazyMotion>
  );
}
