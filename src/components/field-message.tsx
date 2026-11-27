"use client";
import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import { CircleAlert } from "lucide-react";
import { DUR, EASE_OUT } from "@/lib/motion";

/**
 * A form error that appears gently under its field (fade and a 4px slide, 150ms). Ink with an icon,
 * not red: red is kept for the NHS warning signs and for actions that delete things.
 */
export function FieldMessage({ id, error }: { id: string; error?: string }) {
  return (
    <div id={id} aria-live="polite">
      <LazyMotion features={domAnimation}>
        <AnimatePresence initial={false}>
          {error && (
            <m.p key={error} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: DUR.fast, ease: EASE_OUT }}
              className="flex items-start gap-1.5 t-caption text-ink">
              <CircleAlert size={15} strokeWidth={2.2} aria-hidden className="mt-0.5 shrink-0" />{error}
            </m.p>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
