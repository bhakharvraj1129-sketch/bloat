"use client";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { clearUnsaved, goBack, hasUnsaved, previousScreen, recordVisit } from "@/lib/client/nav";
import { installRadioKeys } from "@/lib/client/radio-keys";

const ICON = { size: 20, strokeWidth: 1.75 } as const;
const plainClick = (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** Records each screen visited in this tab, so Back knows where the person came from. */
export function NavTracker() {
  useEffect(() => { installRadioKeys(); }, []);
  const path = usePathname();
  const search = useSearchParams().toString();
  const first = useRef(true);
  useEffect(() => {
    let fresh = false;
    if (first.current) {
      first.current = false;
      const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
      // A typed address, a bookmark or a link from another site starts a new trail. A reload, the
      // browser's Back and Forward, or a full page load from another Bloat Buddy page (such as Try again
      // on the offline page) keeps it.
      let fromBloat = false;
      try { fromBloat = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { fromBloat = false; }
      fresh = !nav || (nav.type !== "reload" && nav.type !== "back_forward" && !fromBloat);
    }
    recordVisit(fresh);
  }, [path, search]);
  return null;
}

/**
 * Back: returns to the previous Bloat Buddy screen in this tab, or to `fallback` (the screen's parent)
 * when there is none. It is a real link to `fallback`, so it also works before the page is ready
 * and opens in a new tab like any link.
 */
export function BackLink({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      data-back={fallback}
      onClick={(e) => {
        if (e.defaultPrevented || !plainClick(e)) return;
        if (previousScreen()) { e.preventDefault(); router.back(); }
      }}
      className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-sm px-2 font-semibold no-underline"
    >
      <ChevronLeft {...ICON} aria-hidden /> Back
    </Link>
  );
}

/**
 * While a screen has unsaved changes, any in-app link (Back, the tab bar, a card) asks first.
 * Runs before the link's own handler, so nothing navigates until the person chooses.
 */
export function LeaveGuard() {
  const router = useRouter();
  const [pending, setPending] = useState<null | { href: string; back: string | null }>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!hasUnsaved() || e.defaultPrevented || !plainClick(e)) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname + url.search === location.pathname + location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPending({ href: url.pathname + url.search + url.hash, back: a.dataset.back ?? null });
    };
    addEventListener("click", onClick, true);
    return () => removeEventListener("click", onClick, true);
  }, []);

  function leave() {
    const p = pending;
    setPending(null);
    clearUnsaved();
    if (!p) return;
    if (p.back !== null) goBack(router, p.back);
    else router.push(p.href);
  }

  return (
    <Dialog.Root open={!!pending} onOpenChange={(o) => { if (!o) setPending(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-[60] bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <Dialog.Title className="t-title">Leave without saving?</Dialog.Title>
          <Dialog.Description className="t-caption">What you entered on this screen hasn&apos;t been saved yet.</Dialog.Description>
          <div className="flex flex-col gap-2">
            <Dialog.Close className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-brand px-5 font-semibold text-on-brand">Stay and keep editing</Dialog.Close>
            <button type="button" onClick={leave} className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-line bg-surface px-5 font-semibold text-alert">Leave without saving</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
