import Link from "next/link";
import { headers } from "next/headers";
import { Check, Minus } from "lucide-react";
import { Card, Caption, Label, LinkButton } from "@/components/ui";
import { PublicFooter, Wordmark } from "@/components/public";
import { TAGLINE } from "@/lib/wording";
import { COUNTRIES, formatMoney, prices, type CountryCode } from "@/lib/registry";

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

export default async function Landing() {
  // Price by visitor country, US dollars by default. Only the country code is read; nothing is stored.
  const seen = (await headers()).get("x-vercel-ip-country") ?? "";
  const code = (COUNTRIES.includes(seen as CountryCode) ? seen : "US") as CountryCode;
  const p = prices(code);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 pb-12 pt-6">
      <header className="flex items-center justify-between">
        <Wordmark />
        <Link href="/sign-in" className="inline-flex min-h-11 items-center font-semibold">Sign in</Link>
      </header>

      <section className="flex flex-col gap-4 pt-4">
        <h1 className="t-headline">{TAGLINE}</h1>
        <p className="text-ink-muted">A calm diary for bloating. For adults 18 and older.</p>
        <LinkButton href="/start">Get started</LinkButton>
      </section>

      <section aria-labelledby="steps" className="flex flex-col gap-3">
        <Label id="steps">How it works</Label>
        {[
          ["1", "Tap when it starts and ends", "Two taps to log bloating and how strong it feels."],
          ["2", "Add meals", "Type what you had. It always saves."],
          ["3", "See your patterns", "Your own records, with day counts. Never a diagnosis."],
        ].map(([n, title, text]) => (
          <Card key={n} className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-tint font-display text-lg font-semibold">{n}</span>
            <div>
              <p className="t-body-strong">{title}</p>
              <Caption>{text}</Caption>
            </div>
          </Card>
        ))}
      </section>

      <section aria-labelledby="plans" className="flex flex-col gap-3">
        <Label id="plans">Free and Pro</Label>
        <Card className="p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="p-4 font-semibold">What you get</th>
                <th scope="col" className="w-14 py-4 text-center font-semibold">Free</th>
                <th scope="col" className="w-14 py-4 pr-2 text-center font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([name, free]) => (
                <tr key={name} className="border-b border-line last:border-0">
                  <th scope="row" className="p-4 font-normal">{name}</th>
                  <td className="py-4 text-center">{free ? <Check size={20} strokeWidth={1.75} className="mx-auto text-brand" aria-label="Included" /> : <Minus size={20} strokeWidth={1.75} className="mx-auto text-ink-muted" aria-label="Not included" />}</td>
                  <td className="py-4 pr-2 text-center"><Check size={20} strokeWidth={1.75} className="mx-auto text-brand" aria-label="Included" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <p className="t-body-strong">Pro: {formatMoney(p.annual_minor, p.currency)} a year</p>
          <Caption>
            Or {formatMoney(p.three_month_minor, p.currency)} for 3 months, or {formatMoney(p.monthly_minor, p.currency)} a month.{" "}
            {p.tax === "added at checkout" ? "Tax is added at checkout." : "Includes 18% GST."} No free trial: the Free plan never expires.
          </Caption>
        </Card>
        <Link href="/how-bloat-works" className="font-semibold">How scores and comparisons are calculated</Link>
      </section>

      <section aria-labelledby="privacy">
        <Card>
          <p id="privacy" className="t-body-strong">Your records stay yours</p>
          <Caption>No ads. No selling your data. Download or delete everything at any time.</Caption>
        </Card>
      </section>

      <LinkButton href="/start">Get started</LinkButton>
      <PublicFooter />
    </main>
  );
}
