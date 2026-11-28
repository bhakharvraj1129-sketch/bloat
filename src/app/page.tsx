import Link from "next/link";
import { ArrowRight, Check, ChartNoAxesColumn, FileText, NotebookPen, Plus, ShieldCheck, Sunrise } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { LinkButton } from "@/components/ui";
import { PublicFooter, PublicHeader } from "@/components/public";
import { LandingMotion } from "@/components/landing-motion";
import { HeroDemo, MotionToggle } from "@/components/landing/hero-demo";
import { ScrollProgress } from "@/components/landing/scroll-ui";
import { TryIt } from "@/components/landing/try-it";
import { DayStory } from "@/components/landing/day-story";
import { Faq, type Question } from "@/components/landing/faq";
import { BeforeAfter } from "@/components/landing/before-after";
import { FlipSteps } from "@/components/landing/flip-steps";
import { signInMethod } from "@/server/auth-settings";
import { featureOff } from "@/server/availability";

// The start page, v2 (owner, 28 Nov 2026: "see how animated their website is"; countquill.com as the
// level of life, not something to copy). Built as a story you can play with: a hero whose sample
// phone logs bloating by itself, a ticker, a sample you can tap, a scroll story through one day,
// feature cards that each play a short picture, a promise that lights up as you scroll, steps, and
// questions. Only true facts about the product; features this deployment does not offer are not
// listed; no prices while nothing can be bought. Motion rules: DECISIONS.md choices 34 and 35.

type Feature = { icon: typeof Plus; title: string; text: string; feature?: "possible_triggers" | "doctor_pdf"; stage: ReactNode; wide?: boolean; full?: boolean };

const WEEK_ON = [true, true, false, true, true, true, false];

const FEATURES: Feature[] = [
  {
    icon: Plus, title: "Log in two taps", text: "Tap when bloating starts, pick how strong it feels, and tap again when it is gone.", wide: true,
    stage: (
      <div className="flex w-full flex-col gap-3">
        <span className="text-sm font-semibold text-ink">This week</span>
        <div className="bento-week grid grid-cols-7 gap-2">
          {WEEK_ON.map((on, i) => <span key={i} data-on={on || undefined} style={{ ["--i" as string]: i }} className="aspect-square w-full max-w-10 justify-self-center rounded-full border-2 border-line" />)}
        </div>
      </div>
    ),
  },
  {
    icon: NotebookPen, title: "Meals and habits", text: "Type what you ate and tick the habits you want to follow. It always saves.", wide: true,
    stage: (
      <div className="flex w-full flex-col gap-3">
        <span className="text-sm font-semibold text-ink">What did you have?</span>
        <span className="flex min-h-11 items-center rounded-sm border border-control bg-surface px-3 text-ink"><span className="bento-type">{"Rice with dal".split("").map((c, i) => <span key={i} style={{ ["--i" as string]: i }}>{c}</span>)}</span><span className="ml-0.5 h-5 w-px bg-ink" /></span>
        <span className="bento-tick inline-flex items-center gap-1.5 self-start rounded-pill bg-brand-tint px-3 py-1 text-sm font-semibold text-brand-text"><Check size={15} strokeWidth={2.6} aria-hidden />Meal saved.</span>
      </div>
    ),
  },
  {
    icon: Sunrise, title: "A quick morning review", text: "A few questions the next morning give each day its Bloat Score.",
    stage: (
      <div className="relative flex w-full items-end justify-center">
        <span className="bento-sun absolute bottom-6 h-16 w-16 rounded-full bg-score-moderate" />
        <span className="relative z-10 w-full rounded-sm border border-line bg-surface px-3 py-2 text-center text-sm font-semibold text-ink">Yesterday · Bloat Score 3</span>
      </div>
    ),
  },
  {
    icon: ChartNoAxesColumn, title: "Patterns in your records", text: "See which habits line up with your worse days, with the day counts behind each one.", feature: "possible_triggers",
    stage: (
      <div className="flex w-full items-end justify-center gap-6">
        <div className="bento-bars flex h-24 items-end gap-6">
          <span style={{ ["--i" as string]: 0 }} className="block h-[85%] w-10 rounded-t-sm bg-brand" />
          <span style={{ ["--i" as string]: 1 }} className="block h-[45%] w-10 rounded-t-sm bg-score-moderate" />
        </div>
        <span className="flex flex-col gap-1 text-xs text-ink-muted"><span>With the habit · 6 days</span><span>Without · 9 days</span><span className="italic">Sample numbers</span></span>
      </div>
    ),
  },
  {
    icon: FileText, title: "A report for your doctor", text: "A clear summary of your own records to bring to an appointment, shared only if you choose.", feature: "doctor_pdf",
    stage: (
      <div className="flex w-full justify-center">
        <span className="bento-page flex w-36 flex-col gap-1.5 rounded-sm border border-line bg-surface p-3">
          <span className="text-[0.6875rem] font-bold text-ink">Summary for your appointment</span>
          {[90, 70, 80, 55].map((w, i) => <span key={i} className="h-1.5 rounded-pill bg-line" style={{ width: `${w}%` }} />)}
          <span className="mt-1 flex h-6 items-end gap-1">{[40, 75, 55, 90, 35].map((h, i) => <span key={i} className="w-3 rounded-t-[2px] bg-score-moderate" style={{ height: `${h}%` }} />)}</span>
        </span>
      </div>
    ),
  },
  {
    icon: ShieldCheck, title: "Private by design", text: "Your diary is private to your account. Download it or delete it whenever you want.", full: true,
    stage: (
      <div className="flex w-full items-center justify-center gap-4">
        <svg className="bento-lock text-brand-text" width="44" height="52" viewBox="0 0 44 52" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden>
          <path className="shackle" d="M12 22V15a10 10 0 0 1 20 0v7" />
          <rect x="5" y="22" width="34" height="26" rx="6" />
          <path d="M22 33v5" />
        </svg>
        <span className="flex flex-col gap-2">
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-sm font-semibold text-ink">Download</span>
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-sm font-semibold text-ink">Delete</span>
        </span>
      </div>
    ),
  },
];

const TICKER = ["Log in two taps", "Meals and habits", "A quick morning review", "Patterns from your own days", "A report for your doctor", "Light and dark", "Download or delete any time", "No ads"];

const STEPS = [
  { n: "1", title: "Log as the day goes", text: "Two taps when bloating starts and ends. Add meals and habits when you think of them." },
  { n: "2", title: "Review the next morning", text: "A few quick questions confirm how yesterday went and set its score." },
  { n: "3", title: "See your patterns", text: "After about two weeks, Bloat Buddy compares days with and without each habit, using only your records." },
];

const PROMISE = "Your diary stays yours. Every pattern comes from your own days, with the number of days shown. Bloat Buddy never tells you what caused your bloating.";

const QUESTIONS: Question[] = [
  { q: "Who is Bloat Buddy for?", a: "Adults 18 and older who want a calm, private place to keep track of bloating, meals and daily habits, and to see patterns in their own records." },
  { q: "Is it a medical app?", a: <>No. Bloat Buddy is a general wellness diary. It does not diagnose or treat anything and does not give medical advice. If something worries you, see <Link href="/help">when to get medical help</Link>.</> },
  { q: "Who can see my diary?", a: "Your diary is private to your account. Nothing is sold and there are no ads. You can download everything or delete your account at any time." },
  { q: "How are patterns worked out?", a: <>From fixed rules you can read, using only your own records, with the number of days behind each result. AI never decides your results. <Link href="/how-bloat-works">How scores and comparisons are calculated</Link></> },
  { q: "Does it work on my phone?", a: "Yes. Bloat Buddy runs in your phone's browser, and you can add it to your home screen so it opens like an app." },
];

/** The hero headline, one word at a time (each rises out of its own line, 40ms apart). */
function HeroTitle() {
  const plain = "Understand your bloating,".split(" ");
  const accent = "one day at a time.".split(" ");
  const word = (w: string, i: number, last: boolean) => (
    <Fragment key={i}><span className="hero-word"><span style={{ ["--i" as string]: i }}>{w}</span></span>{last ? "" : " "}</Fragment>
  );
  return (
    <h1 className="t-hero text-balance">
      {plain.map((w, i) => word(w, i, false))}
      <span className="relative inline-block text-brand-text">
        {accent.map((w, k) => word(w, plain.length + k, k === accent.length - 1))}
        <svg className="hero-underline pointer-events-none absolute -bottom-2 left-0 w-full" viewBox="0 0 300 14" preserveAspectRatio="none" fill="none" aria-hidden>
          <path d="M3 9.5C60 4 130 3 200 5.5c34 1.2 66 3 94 5" pathLength={1} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </span>
    </h1>
  );
}

export default async function Landing() {
  // While new accounts can't be created (the testing sign-in), the main action is Sign in.
  const openSignUp = signInMethod() !== "password";
  const cta = openSignUp ? { href: "/start", label: "Get started" } : { href: "/sign-in", label: "Sign in" };
  const features = FEATURES.filter((f) => !f.feature || !featureOff(f.feature));
  const ticker = TICKER.filter((t) => !(t === "Patterns from your own days" && featureOff("possible_triggers")) && !(t === "A report for your doctor" && featureOff("doctor_pdf")));

  return (
    <>
      <ScrollProgress />
      <PublicHeader />
      <main>
        {/* Hero: the headline rises word by word, its accent underlines itself, and the sample phone logs bloating. */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden className="hero-glow absolute inset-0 -z-10" />
          <div aria-hidden className="hero-pattern absolute inset-0 -z-10" />
          <section className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-12 px-5 pb-14 pt-12 md:px-8 md:pt-20 lg:px-12">
            <div className="flex min-w-0 flex-[999_1_28rem] flex-col gap-6">
              {!openSignUp && (
                <span data-hero="1" className="inline-flex items-center gap-2 self-start rounded-pill bg-brand-tint px-3 py-1.5 text-sm font-semibold text-brand-text">
                  <span className="relative flex h-2 w-2" aria-hidden><span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" /><span className="relative h-2 w-2 rounded-full bg-brand" /></span>Invite-only test
                </span>
              )}
              <HeroTitle />
              <p data-hero="2" className="max-w-xl text-lg leading-8 text-ink-muted">Bloat Buddy is a private diary for bloating. Log how you feel in two taps, add meals and habits, and see patterns in your own records.</p>
              <div data-hero="3" className="flex flex-col gap-3 sm:flex-row">
                <LinkButton href={cta.href} className="group sm:w-auto">{cta.label}<ArrowRight size={18} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden /></LinkButton>
                <LinkButton href="#try" variant="secondary" className="sm:w-auto">Try it here</LinkButton>
              </div>
              <p className="t-caption">{openSignUp ? "For adults 18 and older." : "For adults 18 and older. Accounts are set up by invitation during the test."}</p>
            </div>
            <figure data-hero="4" className="m-0 flex flex-[1_1_20rem] flex-col items-center gap-2">
              <HeroDemo />
              <figcaption className="t-caption">The Today screen, shown with sample entries.</figcaption>
              <MotionToggle />
            </figure>
          </section>
        </div>

        {/* Ticker: what it does, gliding past (paused while pointed at; a still list with reduce motion). */}
        <section aria-label="What Bloat Buddy does" className="ticker border-y border-line bg-surface py-4">
          <div className="ticker-track gap-0">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1 || undefined} className="m-0 flex shrink-0 list-none items-center gap-0 p-0">
                {ticker.map((t) => (
                  <li key={t} className="flex items-center gap-3 whitespace-nowrap px-6 font-display text-lg font-bold text-ink md:text-xl">
                    <Check size={20} strokeWidth={2.6} className="text-brand-text" aria-hidden />{t}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        {/* Try it: the real strength scale on a sample that saves nothing. */}
        <section id="try" aria-labelledby="try-title" className="mx-auto flex max-w-[76rem] scroll-mt-24 flex-col gap-7 px-5 py-16 md:px-8 md:py-24 lg:px-12">
          <div data-reveal className="flex flex-col gap-3">
            <p className="t-label">Try it yourself</p>
            <h2 id="try-title" className="t-headline">Two taps. Try them here.</h2>
            <p className="max-w-2xl text-lg leading-8 text-ink-muted">Pick how strong it feels and when it started, and watch the card fill in. This is a sample: nothing is saved or sent.</p>
          </div>
          <div data-reveal><TryIt /></div>
        </section>

        {/* Before and after: drag to compare scattered notes with the same days as a record. */}
        <section aria-labelledby="compare-title" className="border-t border-line bg-subtle">
          <div className="mx-auto grid max-w-[76rem] grid-cols-1 items-center gap-8 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_1.2fr] lg:px-12">
            <div data-reveal className="flex flex-col gap-3">
              <p className="t-label">Before and after</p>
              <h2 id="compare-title" className="t-headline">From scattered notes to one clear record.</h2>
              <p className="text-lg leading-8 text-ink-muted">Notes on your phone, a photo here, a guess there. Drag the handle and see the same days as a record you can read at a glance.</p>
            </div>
            <div data-reveal><BeforeAfter /></div>
          </div>
        </section>

        <DayStory />

        {/* Feature cards: each plays a short picture of what it does as it comes into view. */}
        <section aria-labelledby="features" className="mx-auto flex max-w-[76rem] flex-col gap-7 px-5 py-16 md:px-8 md:py-24 lg:px-12">
          <div data-reveal className="flex flex-col gap-3">
            <p className="t-label">What it does</p>
            <h2 id="features" className="t-headline">Everything in one calm place</h2>
          </div>
          <ul data-reveal-group className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-6">
            {features.map(({ icon: Icon, title, text, stage, wide, full }) => (
              <li key={title} data-animate className={`group flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 transition-colors duration-150 hover:border-brand ${full ? "md:col-span-6 md:flex-row md:items-center md:gap-8" : wide ? "md:col-span-3" : "md:col-span-2"}`}>
                <div className={`flex min-h-36 items-center rounded-md bg-subtle p-5 ${full ? "md:w-1/2 md:shrink-0" : ""}`} aria-hidden>{stage}</div>
                <div className="flex flex-col gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-sm bg-brand-tint text-brand-text transition-transform duration-150 group-hover:-translate-y-0.5"><Icon size={22} strokeWidth={2} aria-hidden /></span>
                  <h3 className="t-title">{title}</h3>
                  <p className="leading-6 text-ink-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* The promise: its words light up one by one as you scroll past. */}
        <section aria-labelledby="promise-title" className="bg-night text-on-night">
          <div className="mx-auto flex max-w-[76rem] flex-col gap-6 px-5 py-24 md:px-8 md:py-32 lg:px-12">
            <h2 id="promise-title" className="t-label text-night-accent">Our promise</h2>
            <p data-promise className="m-0 max-w-4xl font-display text-[2rem] font-extrabold leading-[1.15] tracking-[-0.025em] md:text-[3.25rem]">
              {PROMISE.split(" ").map((w, i) => <span key={i} className="promise-word">{w}{" "}</span>)}
            </p>
          </div>
        </section>

        {/* How it works: the line between the steps fills as you scroll. */}
        <section id="how" aria-labelledby="how-title" className="border-b border-line bg-subtle">
          <div className="mx-auto flex max-w-[76rem] flex-col gap-9 px-5 py-16 md:px-8 md:py-24 lg:px-12">
            <div data-reveal className="flex flex-col gap-3">
              <p className="t-label">Getting started</p>
              <h2 id="how-title" className="t-headline">How it works</h2>
              <p className="max-w-2xl text-lg leading-8 text-ink-muted">Three steps. Tap a card to turn it over.</p>
            </div>
            <div data-steps className="relative">
              <div aria-hidden className="absolute left-5 right-5 top-5 hidden h-0.5 bg-line md:block"><span className="steps-line absolute inset-0 bg-brand" /></div>
              <FlipSteps steps={STEPS} />
            </div>
            <Link href="/how-bloat-works" className="group inline-flex items-center gap-1.5 self-start font-semibold">How scores and comparisons are calculated<ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden /></Link>
          </div>
        </section>

        <section aria-label="Privacy and safety" data-reveal-group className="mx-auto grid max-w-[76rem] grid-cols-1 gap-4 px-5 py-16 md:grid-cols-2 md:px-8 lg:px-12">
          <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-7">
            <h2 className="t-title text-[1.375rem]">Your records stay yours</h2>
            <p className="leading-6 text-ink-muted">Your diary is private to your account. No ads, no selling your data. Download everything or delete your account at any time.</p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-7">
            <h2 className="t-title text-[1.375rem]">A diary, not a doctor</h2>
            <p className="leading-6 text-ink-muted">Bloat Buddy shows differences in your own records. It never diagnoses and never tells you what caused your bloating. If something worries you, see <Link href="/help">when to get medical help</Link>.</p>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto flex max-w-[52rem] flex-col gap-7 px-5 pb-20 md:px-8">
          <div data-reveal className="flex flex-col gap-3">
            <p className="t-label">Straight answers</p>
            <h2 id="faq-title" className="t-headline">Questions people ask</h2>
          </div>
          <Faq items={QUESTIONS} />
        </section>

        <section aria-labelledby="cta" className="bg-brand">
          <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-6 px-5 py-16 md:px-8 lg:px-12">
            <div data-reveal className="flex flex-col gap-1">
              <h2 id="cta" className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-on-brand md:text-[2.25rem]">{openSignUp ? "Ready to start?" : "Invited to the test?"}</h2>
              <p className="text-on-brand">{openSignUp ? "Create your free diary in a minute." : "Sign in with the email address and password you were given."}</p>
            </div>
            <Link href={cta.href} data-press className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-sm bg-surface px-7 py-3.5 font-bold text-ink no-underline hover:opacity-90">{cta.label}<ArrowRight size={18} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden /></Link>
          </div>
        </section>
      </main>
      <PublicFooter />
      <div aria-hidden className="footer-wrap bg-surface px-5 pb-6 md:px-8 lg:px-12"><div className="footer-mark mx-auto max-w-[76rem]">Bloat Buddy</div></div>
      <LandingMotion />
    </>
  );
}
