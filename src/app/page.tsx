import Link from "next/link";
import { ChartNoAxesColumn, FileText, NotebookPen, Plus, ShieldCheck, Sunrise } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { PublicFooter, PublicHeader } from "@/components/public";
import { signInMethod } from "@/server/auth-settings";
import { featureOff } from "@/server/availability";

// The start page (design canvas of 27 Nov 2026, "Start page"). Only true facts about the product;
// features this deployment does not offer are not listed. No prices while nothing can be bought.
const FEATURES = [
  { icon: Plus, title: "Log in two taps", text: "Tap when bloating starts, pick how strong it feels, and tap again when it is gone." },
  { icon: NotebookPen, title: "Meals and habits", text: "Type what you ate and tick the habits you want to follow. It always saves." },
  { icon: Sunrise, title: "A quick morning review", text: "A few questions the next morning give each day its Bloat Score." },
  { icon: ChartNoAxesColumn, title: "Patterns in your records", text: "See which habits line up with your worse days, with the day counts behind each one.", feature: "possible_triggers" as const },
  { icon: FileText, title: "A report for your doctor", text: "A clear summary of your own records to bring to an appointment, shared only if you choose.", feature: "doctor_pdf" as const },
  { icon: ShieldCheck, title: "Private by design", text: "Your diary is private to your account. Download it or delete it whenever you want." },
];

const STEPS = [
  { n: "1", title: "Log as the day goes", text: "Two taps when bloating starts and ends. Add meals and habits when you think of them." },
  { n: "2", title: "Review the next morning", text: "A few quick questions confirm how yesterday went and set its score." },
  { n: "3", title: "See your patterns", text: "After about two weeks, Bloat Buddy compares days with and without each habit, using only your records." },
];

const WEEK: Array<{ l: string; state: "done" | "today" | "none" }> = [
  { l: "M", state: "done" }, { l: "T", state: "done" }, { l: "W", state: "none" }, { l: "T", state: "done" },
  { l: "F", state: "today" }, { l: "S", state: "none" }, { l: "S", state: "none" },
];

/** A drawing of the Today screen with sample entries (not a real account). */
function PhonePreview() {
  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <div className="w-[18.75rem] rounded-[2.75rem] bg-ink p-3" aria-hidden>
        <div className="flex flex-col gap-3.5 rounded-[2.125rem] bg-ground px-4 pb-4 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="t-label text-[0.6875rem]">Fri 27 Nov</span>
            <span className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">Today</span>
          </div>
          <div className="flex flex-col gap-2.5 rounded-[1.125rem] border border-line bg-surface p-3.5">
            <span className="text-[0.8125rem] text-ink-muted">Bloating now</span>
            <span className="flex items-baseline gap-1.5"><span className="font-display text-[2.125rem] font-extrabold tabular leading-none text-ink">4</span><span className="text-sm text-ink-muted">of 10 · since 2:14 pm</span></span>
            <span className="grid grid-cols-2 gap-2">
              <span className="flex min-h-9 items-center justify-center rounded-[0.625rem] border border-line text-[0.8125rem] font-semibold text-ink">Update</span>
              <span className="flex min-h-9 items-center justify-center rounded-[0.625rem] bg-brand text-[0.8125rem] font-semibold text-on-brand">It&apos;s gone</span>
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK.map((d, i) => (
              <span key={i} className="flex flex-col items-center gap-1">
                <span className="text-[0.625rem] text-ink-muted">{d.l}</span>
                <span className={d.state === "done" ? "h-6 w-6 rounded-full bg-brand" : d.state === "today" ? "h-6 w-6 rounded-full border-2 border-brand" : "h-6 w-6 rounded-full border border-dashed border-line"} />
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Meal", "Activity", "Bowel"].map((x) => <span key={x} className="flex justify-center rounded-xl border border-line bg-surface px-1 py-2.5 text-xs font-semibold text-ink">{x}</span>)}
          </div>
        </div>
      </div>
      <figcaption className="t-caption">The Today screen, shown with sample entries.</figcaption>
    </figure>
  );
}

export default async function Landing() {
  // While new accounts can't be created (the testing sign-in), the main action is Sign in.
  const openSignUp = signInMethod() !== "password";
  const cta = openSignUp ? { href: "/start", label: "Get started" } : { href: "/sign-in", label: "Sign in" };
  const features = FEATURES.filter((f) => !f.feature || !featureOff(f.feature));

  return (
    <>
      <PublicHeader />
      <main>
        <section className="mx-auto flex max-w-[76rem] flex-wrap items-center gap-12 px-5 pb-14 pt-12 md:px-8 md:pt-20 lg:px-12">
          <div className="flex min-w-0 flex-[999_1_28rem] flex-col gap-6">
            {!openSignUp && (
              <span className="inline-flex items-center gap-2 self-start rounded-pill bg-brand-tint px-3 py-1.5 text-sm font-semibold text-brand-text">
                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />Invite-only test
              </span>
            )}
            <h1 className="t-hero text-balance">Understand your bloating, <span className="text-brand-text">one day at a time.</span></h1>
            <p className="max-w-xl text-lg leading-8 text-ink-muted">Bloat Buddy is a private diary for bloating. Log how you feel in two taps, add meals and habits, and see patterns in your own records.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href={cta.href} className="sm:w-auto">{cta.label}</LinkButton>
              <LinkButton href="#how" variant="secondary" className="sm:w-auto">See how it works</LinkButton>
            </div>
            <p className="t-caption">{openSignUp ? "For adults 18 and older." : "For adults 18 and older. Accounts are set up by invitation during the test."}</p>
          </div>
          <div className="flex flex-[1_1_20rem] justify-center"><PhonePreview /></div>
        </section>

        <section aria-labelledby="features" className="mx-auto flex max-w-[76rem] flex-col gap-7 px-5 pb-16 md:px-8 lg:px-12">
          <h2 id="features" className="t-headline">Everything in one calm place</h2>
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-sm bg-brand-tint text-brand-text"><Icon size={22} strokeWidth={2} aria-hidden /></span>
                <h3 className="t-title">{title}</h3>
                <p className="leading-6 text-ink-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" aria-labelledby="how-title" className="border-y border-line bg-subtle">
          <div className="mx-auto flex max-w-[76rem] flex-col gap-7 px-5 py-16 md:px-8 lg:px-12">
            <h2 id="how-title" className="t-headline">How it works</h2>
            <ol className="grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex flex-col gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-brand font-bold tabular text-on-brand" aria-hidden>{s.n}</span>
                  <h3 className="t-title">{s.title}</h3>
                  <p className="leading-6 text-ink-muted">{s.text}</p>
                </li>
              ))}
            </ol>
            <Link href="/how-bloat-works" className="self-start font-semibold">How scores and comparisons are calculated</Link>
          </div>
        </section>

        <section aria-label="Privacy and safety" className="mx-auto grid max-w-[76rem] grid-cols-1 gap-4 px-5 py-16 md:grid-cols-2 md:px-8 lg:px-12">
          <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-7">
            <h2 className="t-title text-[1.375rem]">Your records stay yours</h2>
            <p className="leading-6 text-ink-muted">Your diary is private to your account. No ads, no selling your data. Download everything or delete your account at any time.</p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-7">
            <h2 className="t-title text-[1.375rem]">A diary, not a doctor</h2>
            <p className="leading-6 text-ink-muted">Bloat Buddy shows differences in your own records. It never diagnoses and never tells you what caused your bloating. If something worries you, see <Link href="/help">when to get medical help</Link>.</p>
          </div>
        </section>

        <section aria-labelledby="cta" className="bg-brand">
          <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-6 px-5 py-14 md:px-8 lg:px-12">
            <div className="flex flex-col gap-1">
              <h2 id="cta" className="font-display text-[1.75rem] font-extrabold tracking-[-0.02em] text-on-brand">{openSignUp ? "Ready to start?" : "Invited to the test?"}</h2>
              <p className="text-on-brand">{openSignUp ? "Create your free diary in a minute." : "Sign in with the email address and password you were given."}</p>
            </div>
            <Link href={cta.href} className="inline-flex min-h-13 items-center justify-center rounded-sm bg-surface px-7 py-3.5 font-bold text-ink no-underline hover:opacity-90">{cta.label}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
