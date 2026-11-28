"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CalendarDays, ChartNoAxesColumn, House, LifeBuoy, Plus, UserRound } from "lucide-react";
import { cx } from "./ui";
import { Logo } from "./logo";
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

/** Opens the bloating log from anywhere: Today reads ?log=1 and opens Log bloating, or Bloating now if one is open. */
export const LOG_HREF = "/today?log=1";

function TabLink({ id, href, label, icon: Icon, on }: (typeof TABS)[number] & { on: boolean }) {
  return (
    <Link href={href} data-press aria-current={on ? "page" : undefined}
      className={cx("flex min-h-12 flex-col items-center justify-center gap-1 text-xs no-underline", on ? "font-bold text-brand-text" : "font-medium text-ink-muted")}
      data-tab={id}>
      {/* The active tab's icon sits in a soft pill that grows in from the middle (250ms). */}
      <span className={cx("flex h-7 w-14 items-center justify-center rounded-pill", on && "tab-pill bg-brand-tint")}>
        <Icon size={22} strokeWidth={on ? 2.2 : 1.75} aria-hidden />
      </span>
      {label}
    </Link>
  );
}

// Phones: Today, History, a raised log button, Patterns, You. Each tab has its word.
export function TabBar() {
  const owner = useOwner();
  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5 items-center px-1.5">
        {left.map((t) => <li key={t.id}><TabLink {...t} on={owner === t.id} /></li>)}
        <li className="flex justify-center">
          <Link href={LOG_HREF} data-press className="group -mt-5 inline-flex h-14 w-14 items-center justify-center rounded-md bg-brand text-on-brand no-underline hover:opacity-90">
            <Plus size={26} strokeWidth={2.4} className="transition-transform duration-150 group-active:rotate-90" aria-hidden />
            <span className="sr-only">Log bloating</span>
          </Link>
        </li>
        {right.map((t) => <li key={t.id}><TabLink {...t} on={owner === t.id} /></li>)}
      </ul>
    </nav>
  );
}

// Tablets and desktops: a sidebar with the log button and the same four destinations.
export function SideNav() {
  const owner = useOwner();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-8 border-r border-line bg-surface px-4 py-8 md:flex lg:px-5">
      <div className="flex flex-col gap-2 px-3">
        <Link href="/today" className="no-underline" aria-label="Bloat Buddy, Today"><Logo size={30} /></Link>
        <span className="t-label">Your bloating diary</span>
      </div>
      <Link href={LOG_HREF} data-press className="group flex min-h-12 items-center gap-3 rounded-sm bg-brand px-3 font-semibold text-on-brand no-underline hover:opacity-90">
        <Plus size={20} strokeWidth={2.2} className="transition-transform duration-150 group-hover:rotate-90" aria-hidden />
        Log bloating
      </Link>
      <nav aria-label="Main" className="-mt-4">
        <ul className="flex flex-col gap-1">
          {TABS.map(({ id, href, label, icon: Icon }) => {
            const on = owner === id;
            return (
              <li key={id}>
                <Link href={href} data-press aria-current={on ? "page" : undefined}
                  className={cx("flex min-h-12 items-center gap-3 rounded-sm px-3 no-underline transition-colors duration-150", on ? "bg-brand-tint font-semibold text-brand-text" : "text-ink-muted hover:bg-subtle hover:text-ink")}>
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
