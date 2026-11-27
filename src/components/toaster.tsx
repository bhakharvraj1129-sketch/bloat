"use client";
import { Toaster } from "sonner";

/**
 * Save confirmations (Sonner). Inverse colours from the tokens, no shadow, a tick, above the tab
 * bar on phones. Toasts are announced politely to screen readers and never take focus.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: 104, left: 16, right: 16 }}
      duration={3000}
      visibleToasts={3}
      containerAriaLabel="Confirmations"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "flex w-full items-center gap-2.5 rounded-md bg-ink px-4 py-3.5 text-[0.9375rem] font-semibold text-ground md:w-[22rem]",
          icon: "flex shrink-0 text-inverse-accent",
          title: "leading-5",
        },
      }}
    />
  );
}
