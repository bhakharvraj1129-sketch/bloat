"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Sun, UserRound } from "lucide-react";
import { cx } from "./ui";

const TABS = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/me", label: "Me", icon: UserRound },
];

// Bottom tabs: Today · History · Insights (Pro) · Me. Every icon has its word.
export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const on = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={cx("flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.8125rem] no-underline", on ? "font-semibold text-brand" : "text-ink-muted")}>
                <Icon size={24} strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
