import Link from "next/link";
import { INTENDED_USE } from "@/lib/wording";

export function PublicFooter() {
  return (
    <footer className="mt-4 flex flex-col gap-3 border-t border-line pt-6">
      <p className="t-caption">{INTENDED_USE}</p>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 t-caption">
        <Link href="/help">When to get medical help</Link>
        <Link href="/how-bloat-works">How Bloat works</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

export function Wordmark() {
  return <span className="font-display text-2xl font-semibold text-brand">Bloat</span>;
}
