"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reducedMotion } from "@/lib/motion";

/**
 * The start page's scroll behaviour (owner, 28 Nov 2026), all in one place:
 *  - [data-reveal] sections and the children of [data-reveal-group] fade and rise once as they come
 *    into view (the children 70ms apart); [data-animate] feature cards play their short picture.
 *    These only set data-inview; the motion itself is CSS in globals.css.
 *  - The promise's words light up one by one, and the steps' line fills, scrubbed by scroll (GSAP
 *    ScrollTrigger), so they move exactly as fast as the person scrolls and never on their own.
 * With reduce motion everything is shown in its final state at once.
 */
export function LandingMotion() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group], [data-animate]"));
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((g) => {
      Array.from(g.children).forEach((c, i) => { if (!(c as HTMLElement).style.getPropertyValue("--i")) (c as HTMLElement).style.setProperty("--i", String(i)); });
    });
    if (reducedMotion()) {
      targets.forEach((t) => t.setAttribute("data-inview", ""));
      document.querySelectorAll("[data-promise] .promise-word").forEach((w) => w.setAttribute("data-lit", ""));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.setAttribute("data-inview", ""); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    targets.forEach((t) => io.observe(t));

    gsap.registerPlugin(ScrollTrigger);
    const triggers: ScrollTrigger[] = [];
    for (const promise of document.querySelectorAll<HTMLElement>("[data-promise]")) {
      const words = Array.from(promise.querySelectorAll<HTMLElement>(".promise-word"));
      let lit = -1;
      triggers.push(ScrollTrigger.create({
        trigger: promise, start: "top 78%", end: "bottom 42%", scrub: true,
        onUpdate: (self) => {
          const n = Math.round(self.progress * words.length);
          if (n === lit) return;
          lit = n;
          words.forEach((w, i) => w.toggleAttribute("data-lit", i < n));
        },
      }));
    }
    for (const steps of document.querySelectorAll<HTMLElement>("[data-steps]")) {
      triggers.push(ScrollTrigger.create({
        trigger: steps, start: "top 80%", end: "bottom 55%", scrub: true,
        onUpdate: (self) => steps.style.setProperty("--fill", self.progress.toFixed(3)),
      }));
    }
    return () => { io.disconnect(); triggers.forEach((t) => t.kill()); };
  }, []);
  return null;
}
