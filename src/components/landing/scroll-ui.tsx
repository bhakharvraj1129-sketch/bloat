"use client";
import { useEffect, useRef } from "react";

/**
 * Public header behaviour: a full-width bar at the top of the page that floats as a rounded pill
 * once the page has scrolled (globals.css, .site-header). Only an attribute changes; nothing moves
 * the layout, and with reduce motion the change is instant.
 */
export function HeaderScroll() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    let raf = 0;
    const update = () => { raf = 0; header.toggleAttribute("data-scrolled", window.scrollY > 24); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return null;
}

/** A thin brand line across the top of the start page that grows as you scroll down it. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={bar} className="scroll-progress" aria-hidden />;
}
