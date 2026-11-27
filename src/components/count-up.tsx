"use client";
import { useLayoutEffect, useRef } from "react";
import { animate } from "motion/react";
import { DUR, EASE_OUT, reducedMotion } from "@/lib/motion";

/**
 * A number that counts up to its value (400ms, ease-out) when it first shows and whenever it changes.
 * The final value is in the markup from the start, so nothing is missing without JavaScript, and
 * with reduce motion it simply appears.
 */
export function CountUp({ value, decimals = 0, as = "span", className }: { value: number; decimals?: number; as?: "span" | "tspan"; className?: string }) {
  const ref = useRef<HTMLSpanElement & SVGTSpanElement>(null);
  const shown = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = shown.current ?? 0;
    shown.current = value;
    const write = (v: number) => { el.textContent = v.toFixed(decimals); };
    if (from === value || reducedMotion()) { write(value); return; }
    write(from);
    const controls = animate(from, value, { duration: DUR.slow, ease: EASE_OUT, onUpdate: write });
    return () => { controls.stop(); write(value); };
  }, [value, decimals]);
  const Tag = as;
  return <Tag ref={ref} className={className}>{value.toFixed(decimals)}</Tag>;
}
