"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CalendarDays, ChartNoAxesColumn, House, LifeBuoy, UserRound } from "lucide-react";
import { cx } from "./ui";
import { ownerOf, type Owner } from "@/lib/nav-owner";
import { onTrailChange, previousScreen } from "@/lib/client/nav";

const TABS: Array<{ id: Owner; href: string; label: string; icon: typeof House }> = [
  { id: "today", href: "/today", label: "Today", icon: House },
  { id: "history", href: "/history", label: "History", icon: CalendarDays },
  { id: "insights", href: "/insights", label: "Patterns", icon: ChartNoAxesColumn },
  { id: "me", href: "/me", label: "You", icon: UserRound },
];

function useOwner(): Owner | null {
  const path = usePathname();
  // The previous screen only matters for a review opened from History; read after the page is ready.
  const from = useSyncExternalStore(onTrailChange, () => previousScreen(), () => null);
  return ownerOf(path, from);
}

// Phones: four bottom tabs, each icon with its word.
export function TabBar() {
  const owner = useOwner();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map(({ id, href, label, icon: Icon }) => {
          const on = owner === id;
          return (
            <li key={id}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={cx("flex min-h-12 flex-col items-center justify-center gap-1 text-[0.8125rem] no-underline", on ? "font-bold text-ink" : "text-ink-muted")}>
                <Icon size={22} strokeWidth={on ? 2 : 1.5} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Tablets and desktops: a sidebar with the same four destinations.
export function SideNav() {
  const owner = useOwner();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-4 py-8 md:flex lg:px-5">
      <div className="flex flex-col gap-2 px-3">
        <Link href="/today" className="font-display text-[1.6875rem] font-semibold leading-none tracking-[-0.05em] text-ink no-underline">bloat.</Link>
        <span className="t-label">Your daily record</span>
      </div>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {TABS.map(({ id, href, label, icon: Icon }) => {
            const on = owner === id;
            return (
              <li key={id}>
                <Link href={href} aria-current={on ? "page" : undefined}
                  className={cx("flex min-h-12 items-center gap-3 rounded-sm px-3 no-underline transition-colors duration-150", on ? "bg-subtle font-semibold text-ink" : "text-ink-muted hover:bg-subtle hover:text-ink")}>
                  <Icon size={20} strokeWidth={on ? 2 : 1.5} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link href="/help" className="mt-auto flex min-h-12 items-center gap-3 rounded-sm px-3 text-[0.9375rem] text-ink no-underline hover:bg-subtle">
        <LifeBuoy size={20} strokeWidth={1.5} aria-hidden />
        When to get medical help
      </Link>
    </aside>
  );
}
