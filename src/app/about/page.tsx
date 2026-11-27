import Link from "next/link";
import { Card, Caption } from "@/components/ui";
import { PublicPage } from "@/components/public";
import { HOW_BLOAT_WORKS, INTENDED_USE, TAGLINE } from "@/lib/wording";

export const metadata = { title: "About" };

// About Bloat Buddy: only facts that are already true of the product. "Who we are" was written on the
// owner's request (27 Nov 2026, DECISIONS.md D34) from those facts alone: no names, places or history are
// invented. Company and contact details are added by the owner before launch (D11).
export default function About() {
  return (
    <PublicPage title="About Bloat Buddy" eyebrow="About">
      <p className="text-lg leading-7">{TAGLINE}</p>
      <section className="flex flex-col gap-3">
        <h2 className="t-title">Who we are</h2>
        <p>Bloat Buddy is an independent project. It is not run by a hospital, a drug company or a food brand, it shows no ads, and it is not paid to recommend any product.</p>
        <p>It exists because bloating is hard to keep track of. It comes and goes, and by the time you see a doctor it is hard to remember how each day went. Bloat Buddy gives you a calm, private place to write it down, see patterns in your own records and take a clear summary to an appointment if you choose.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="t-title">What we promise</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Your diary is private to your account. Nothing is sold, and you can download or delete it at any time.</li>
          <li>Patterns come from fixed rules you can read, with the number of days behind each one. AI never decides your results.</li>
          <li>Bloat Buddy never tells you what caused your bloating. It shows what your own records say.</li>
          <li>Advice on when to get medical help is adapted from the NHS bloating page, and the source is always shown.</li>
        </ul>
        <Link href="/privacy" className="font-semibold">Privacy</Link>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="t-title">What Bloat Buddy is</h2>
        <p>{INTENDED_USE}</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="t-title">How it works</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          {HOW_BLOAT_WORKS.slice(0, 3).map((t) => <li key={t}>{t}</li>)}
        </ol>
        <p>Bloat Buddy shows what your own records say. Every number comes from a fixed rule, not from AI, and every result shows how many days it is based on.</p>
        <Link href="/how-bloat-works" className="font-semibold">How scores and comparisons are calculated</Link>
      </section>
      <Card className="flex flex-col gap-2">
        <p className="t-body-strong">Where things stand</p>
        <Caption>Bloat Buddy is in an invite-only test with a small group of testers and is not open to the public yet. Company and contact details will be listed here before launch.</Caption>
      </Card>
      <p className="t-caption">For anything worrying about your health, see <Link href="/help">When to get medical help</Link>. Bloat Buddy is not for emergencies.</p>
    </PublicPage>
  );
}
