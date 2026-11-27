import Link from "next/link";
import { Card, Caption } from "@/components/ui";
import { PublicPage } from "@/components/public";
import { HOW_BLOAT_WORKS, INTENDED_USE, TAGLINE } from "@/lib/wording";

export const metadata = { title: "About" };

// About Bloat Buddy: only facts that are already true of the product. Company and team details are
// added by the owner before launch (DECISIONS.md); nothing here is invented.
export default function About() {
  return (
    <PublicPage title="About Bloat Buddy" eyebrow="About">
      <p className="text-lg leading-7">{TAGLINE}</p>
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
      <section className="flex flex-col gap-3">
        <h2 className="t-title">Your records</h2>
        <p>No ads. No selling your data. Download or delete everything at any time.</p>
        <Link href="/privacy" className="font-semibold">Privacy</Link>
      </section>
      <Card className="flex flex-col gap-2">
        <p className="t-body-strong">Preview build</p>
        <Caption>Bloat Buddy is not open to the public yet. Company and contact details will be listed here before launch.</Caption>
      </Card>
      <p className="t-caption">For anything worrying about your health, see <Link href="/help">When to get medical help</Link>. Bloat Buddy is not for emergencies.</p>
    </PublicPage>
  );
}
