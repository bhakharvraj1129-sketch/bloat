import Link from "next/link";
import type { ReactNode } from "react";
import { INTENDED_USE } from "@/lib/wording";
import { BackLink } from "./nav";
import { PublicMenu, type PublicLink } from "./public-menu";
import { Logo } from "./logo";
import { Glide } from "./glide";

const HEADER_LINKS: PublicLink[] = [
  { href: "/how-bloat-works", label: "How it works" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];
const ALL_LINKS: PublicLink[] = [
  ...HEADER_LINKS,
  { href: "/help", label: "When to get medical help" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];
const SIGN_IN: PublicLink = { href: "/sign-in", label: "Sign in" };

export function Wordmark({ className = "" }: { className?: string }) {
  return <Logo className={className} />;
}

/** The public header: name, the main public pages and Sign in. On phones they move into a menu. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ground/95 backdrop-blur">
      <div className="mx-auto flex max-w-[76rem] items-center gap-6 px-5 py-4 md:px-8 lg:px-12">
        <Link href="/" className="no-underline" aria-label="Bloat Buddy, home"><Wordmark /></Link>
        <nav aria-label="Site" className="ml-auto hidden items-center gap-7 text-[0.9375rem] md:flex">
          {HEADER_LINKS.map((l) => <Link key={l.href} href={l.href} className="no-underline hover:underline">{l.label}</Link>)}
          <Link href={SIGN_IN.href} className="inline-flex min-h-11 items-center rounded-sm bg-brand px-5 font-semibold text-on-brand no-underline hover:opacity-90">{SIGN_IN.label}</Link>
        </nav>
        <div className="ml-auto md:hidden"><PublicMenu links={ALL_LINKS} signIn={SIGN_IN} /></div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[76rem] flex-col gap-5 px-5 py-10 md:px-8 lg:px-12">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Wordmark className="mr-4" />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
            <Link href="/about">About</Link>
            <Link href="/how-bloat-works">How Bloat Buddy works</Link>
            <Link href="/help">When to get medical help</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
        <p className="t-caption max-w-3xl">{INTENDED_USE}</p>
      </div>
    </footer>
  );
}

/** A public reading page: header, a 720px column with Back, label and title, then the footer. */
export function PublicPage({ title, eyebrow, back = "/", children }: { title: string; eyebrow?: string; back?: string | null; children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <Glide>
        <main className="mx-auto flex w-full max-w-[49rem] flex-col gap-6 px-5 pb-16 pt-8 md:px-8 md:pt-14">
          {back && <BackLink fallback={back} />}
          <div className="flex flex-col gap-3">
            {eyebrow && <p className="t-label">{eyebrow}</p>}
            <h1 className="t-headline">{title}</h1>
          </div>
          {children}
        </main>
      </Glide>
      <PublicFooter />
    </>
  );
}

/** A centred card for sign-in, country and similar single-task screens. */
export function AuthPage({ title, eyebrow, back, children }: { title: string; eyebrow?: string; back?: string; children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-[34rem] flex-col justify-center gap-4 px-5 py-10 md:py-16">
        {back && <BackLink fallback={back} />}
        <section className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6 md:p-9">
          {eyebrow && <p className="t-label">{eyebrow}</p>}
          <h1 className="t-headline">{title}</h1>
          {children}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
