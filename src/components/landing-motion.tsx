"use client";
import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DUR, reducedMotion } from "@/lib/motion";

/**
 * The start page's one scroll effect (GSAP ScrollTrigger): each section marked data-reveal fades
 * and rises 16px as it comes into view, once, in 400ms; cards in a data-reveal-group follow each
 * other by 50ms. Nothing moves with reduce motion, and nothing waits for the animation.
 */
export function LandingMotion() {
  useLayoutEffect(() => {
    if (reducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      for (const el of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
        const items = el.hasAttribute("data-reveal-group") ? Array.from(el.children) : [el];
        gsap.from(items, {
          opacity: 0, y: 16, duration: DUR.slow, ease: "power2.out", stagger: 0.05, clearProps: "opacity,transform",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      }
    });
    return () => ctx.revert();
  }, []);
  return null;
}
