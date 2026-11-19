import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { Check, Minus } from "lucide-react";
import { Caption, LinkButton } from "@/components/ui";
import { PublicFooter, PublicHeader } from "@/components/public";
import { TAGLINE } from "@/lib/wording";
import { COUNTRIES, formatMoney, prices, type CountryCode } from "@/lib/registry";
import { signInMethod } from "@/server/auth-settings";

const ROWS: Array<[string, boolean]> = [
  ["When to get medical help, and warning signs", true],
  ["Log bloating: start, strength, end", true],
  ["Meals, habits and medicines", true],
  ["Morning review and your Bloat Score", true],
  ["History, corrections, download and delete", true],
  ["Ingredient check and saved dishes", false],
  ["Charts and the 7-day average", false],
  ["Possible triggers and experiments", false],
  ["Weekly report, Your journey and the doctor PDF", false],
];

const STEPS: Array<[string, string, string]> = [
  ["01", "Tap when it starts and ends", "Two taps to log bloating and how strong it feels."],
  ["02", "Add meals", "Type what you had. It always saves."],
  ["03", "See your patterns", "Your own records, with day counts. Never a diagnosis."],
];

export default async function Landing() {
  // Price by visitor country, US dollars by default. Only the country code is read; nothing is stored.
  const seen = (await headers()).get("x-vercel-ip-country") ?? "";
  const code = (COUNTRIES.includes(seen as CountryCode) ? seen : "US") as CountryCode;
  const p = prices(code);
  // While new accounts can't be created (the testing sign-in), the main action is Sign in.
  const openSignUp = signInMethod() !== "password";
  const [first, ...rest] = TAGLINE.split(/(?<=\.) /);
  const cta = openSignUp ? { href: "/start", label: "Get started" } : { href: "/sign-in", label: "Sign in" };

  return (
    <>
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-[76rem] items-center gap-10 px-5 pb-14 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-12 lg:pb-20 lg:pt-24">
          <div className="flex flex-col gap-6">
            <p className="t-label">Bloating and gut tracker</p>
            <h1 className="t-hero">
              {first}
              {rest.length > 0 && <span className="block text-ink-muted">{rest.join(" ")}</span>}
            </h1>
            <p className="max-w-md text-lg leading-7 text-ink-muted">A calm diary for bloating. For adults 18 and older.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton href={cta.href} className="sm:w-auto">{cta.label}</LinkButton>
              <LinkButton href="/how-bloat-works" variant="secondary" className="sm:w-auto">How Bloat works</LinkButton>
            </div>
            {!openSignUp && <Caption>This preview is open to test accounts set up by the owner. New accounts can&apos;t be created yet.</Caption>}
          </div>
          <figure className="flex flex-col gap-3">
            <div className="rounded-[2rem] bg-subtle p-5 md:p-8">
              <Image
                src="/screens/today-example.png" width={1170} height={1740} priority
                alt="The Today screen on a phone: the highest strength logged so far, the I feel bloated button, buttons to add a meal or an activity, and today's entries."
                className="mx-auto h-auto w-full max-w-[20rem] rounded-[1.5rem] border border-line"
              />
            </div>
            <figcaption className="t-caption text-center">The Today screen, shown with sample entries.</figcaption>
          </figure>
        </section>

        <section aria-labelledby="steps" className="mx-auto max-w-[76rem] px-5 pb-14 md:px-8 lg:px-12 lg:pb-20">
          <h2 id="steps" className="t-headline mb-6 md:mb-8">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
            {STEPS.map(([n, title, text]) => (
              <li key={n} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-6">
                <span className="t-caption tabular mb-6">{n}</span>
                <h3 className="t-title">{title}</h3>
                <p className="text-ink-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="plans" className="mx-auto grid max-w-[76rem] gap-6 px-5 pb-16 md:px-8 lg:grid-cols-[1.4fr_1fr] lg:px-12 lg:pb-24">
          <div className="flex flex-col gap-4">
            <h2 id="plans" className="t-headline">Free and Pro</h2>
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="p-4 font-semibold md:px-6">What you get</th>
                    <th scope="col" className="w-16 py-4 text-center font-semibold">Free</th>
                    <th scope="col" className="w-16 py-4 pr-2 text-center font-semibold md:pr-4">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(([name, free]) => (
                    <tr key={name} className="border-b border-line last:border-0">
                      <th scope="row" className="p-4 font-normal md:px-6">{name}</th>
                      <td className="py-4 text-center">{free ? <Check size={20} strokeWidth={2} className="mx-auto text-ink" aria-label="Included" /> : <Minus size={20} strokeWidth={1.75} className="mx-auto text-ink-muted" aria-label="Not included" />}</td>
                      <td className="py-4 pr-2 text-center md:pr-4"><Check size={20} strokeWidth={2} className="mx-auto text-ink" aria-label="Included" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:pt-[4.25rem]">
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-6">
              <p className="t-label">Pro</p>
              <p className="t-title">{formatMoney(p.annual_minor, p.currency)} a year</p>
              <Caption>
                Or {formatMoney(p.three_month_minor, p.currency)} for 3 months, or {formatMoney(p.monthly_minor, p.currency)} a month.{" "}
                {p.tax === "added at checkout" ? "Tax is added at checkout." : "Includes 18% GST."} No free trial: the Free plan never expires.
              </Caption>
              <Link href="/how-bloat-works" className="mt-2 font-semibold">How scores and comparisons are calculated</Link>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-6">
              <p className="t-title">Your records stay yours</p>
              <Caption>No ads. No selling your data. Download or delete everything at any time.</Caption>
            </div>
            <LinkButton href={cta.href}>{cta.label}</LinkButton>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
