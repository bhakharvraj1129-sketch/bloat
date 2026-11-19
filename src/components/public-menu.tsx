"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export type PublicLink = { href: string; label: string };

/** Phones: one Menu button that opens every public page. Escape or a link closes it; focus goes back to the button. */
export function PublicMenu({ links, signIn }: { links: PublicLink[]; signIn: PublicLink }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const [shownOn, setShownOn] = useState(path);
  if (shownOn !== path) { setShownOn(path); setOpen(false); } // a link was followed: close

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button ref={button} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line bg-surface px-3 font-semibold">
        {open ? <X size={20} strokeWidth={1.75} aria-hidden /> : <Menu size={20} strokeWidth={1.75} aria-hidden />}
        Menu
      </button>
      {open && (
        <nav id={id} aria-label="Site" className="menu-in absolute inset-x-0 top-full z-40 border-b border-line bg-surface px-5 pb-5 pt-2">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={path === l.href ? "page" : undefined} className="flex min-h-12 items-center border-b border-line text-ink no-underline">{l.label}</Link>
              </li>
            ))}
          </ul>
          <Link href={signIn.href} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-brand bg-brand px-5 font-semibold text-on-brand no-underline">{signIn.label}</Link>
        </nav>
      )}
    </div>
  );
}
