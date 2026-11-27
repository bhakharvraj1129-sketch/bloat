// Motion tokens for code (Motion, GSAP, Recharts). They mirror --dur-* and --ease-out in
// src/app/globals.css, the one tokens file. Owner's rules (27 Nov 2026): a tap answers within
// 150ms, overlays take 250ms, nothing takes longer than 400ms, no bounce, nothing delays the user.

/** Seconds, for Motion and GSAP. */
export const DUR = { press: 0.12, fast: 0.15, base: 0.25, slow: 0.4 } as const;
/** Milliseconds, for Recharts and AutoAnimate. */
export const DUR_MS = { press: 120, fast: 150, base: 250, slow: 400 } as const;
/** Ease-out with no overshoot (cubic-bezier(0.2, 0, 0, 1)). */
export const EASE_OUT = [0.2, 0, 0, 1] as const;
/** The same curve as GSAP and CSS understand it. */
export const EASE_OUT_CSS = "cubic-bezier(0.2, 0, 0, 1)";

/** True when the person asked their device for less motion: then nothing moves, it just appears. */
export function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
