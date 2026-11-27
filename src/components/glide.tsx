"use client";
import { useEffect, useState, type ReactNode } from "react";
import { LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { DUR, DUR_MS, EASE_OUT } from "@/lib/motion";

// True once the first screen has shown: the very first page load never animates (no blank flash
// before the app starts); every move between screens after that glides in.
let settled = false;

/** A screen glides in (fade and a short rise, 250ms) instead of snapping. Nothing moves with reduce motion. */
export function Glide({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [animate] = useState(() => settled);
  useEffect(() => { settled = true; }, []);
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div initial={animate && !reduce ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.base, ease: EASE_OUT }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}

/** A list whose items slide into place when they are added, removed or reordered (AutoAnimate, 250ms). */
export function useSmoothList<T extends HTMLElement>() {
  return useAutoAnimate<T>({ duration: DUR_MS.base, easing: "ease-out" })[0];
}

/** A <ul> that animates its items in, out and into new places. */
export function SmoothList({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useSmoothList<HTMLUListElement>();
  return <ul ref={ref} className={className}>{children}</ul>;
}
