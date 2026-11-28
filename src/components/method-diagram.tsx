import { Check } from "lucide-react";

// How a comparison works, drawn (owner, 28 Nov 2026: pattern diagrams; DECISIONS.md choice 36). Sample
// numbers only, chosen so every figure on it is exact: 14 days in date order, 7 with something and 7
// without (the fewest a comparison needs), the two averages, their difference, and the same difference in
// each half of the period. It explains the fixed rules on this page; it is not anyone's result.

const DAYS: Array<{ with: boolean; score: number }> = [
  { with: true, score: 6 }, { with: false, score: 3 }, { with: true, score: 7 }, { with: false, score: 4 }, { with: true, score: 5 }, { with: false, score: 2 }, { with: true, score: 6 },
  { with: false, score: 3 }, { with: true, score: 7 }, { with: false, score: 4 }, { with: true, score: 5 }, { with: false, score: 2 }, { with: true, score: 6 }, { with: false, score: 3 },
];
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function DayDot({ d }: { d: (typeof DAYS)[number] }) {
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold tabular ${d.with ? "bg-brand text-on-brand" : "border-2 border-control bg-surface text-ink"}`}>{d.score}</span>
  );
}

export function MethodDiagram() {
  const withScores = DAYS.filter((d) => d.with).map((d) => d.score);
  const withoutScores = DAYS.filter((d) => !d.with).map((d) => d.score);
  const half = (from: number, to: number) => {
    const part = DAYS.slice(from, to);
    return avg(part.filter((d) => d.with).map((d) => d.score)) - avg(part.filter((d) => !d.with).map((d) => d.score));
  };
  const a = avg(withScores), b = avg(withoutScores), first = half(0, 7), second = half(7, 14);
  const f = (n: number) => n.toFixed(1);
  return (
    <figure className="m-0 flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 md:p-6">
      <figcaption className="flex flex-col gap-1">
        <span className="t-title">How a comparison works</span>
        <span className="t-caption">Sample numbers. Each circle is one confirmed day with its Bloat Score: filled if you had the food or did the habit that day, outlined if you didn&apos;t.</span>
      </figcaption>

      <div className="flex flex-col gap-2">
        <span className="t-label">1 · Your confirmed days, in date order</span>
        <ol className="m-0 grid list-none grid-cols-7 justify-items-center gap-2 p-0" aria-label="14 sample days">
          {DAYS.map((d, i) => <li key={i} aria-label={`Day ${i + 1}: ${d.with ? "with" : "without"}, score ${d.score}`}><DayDot d={d} /></li>)}
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <span className="t-label">2 · Split into days with and days without</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[["Days with", DAYS.filter((d) => d.with), a], ["Days without", DAYS.filter((d) => !d.with), b]].map(([name, list, mean]) => (
            <div key={name as string} className="flex flex-col gap-2 rounded-sm bg-subtle p-3">
              <span className="text-sm font-semibold text-ink">{name as string} · {(list as typeof DAYS).length} days</span>
              <span className="flex flex-wrap gap-1.5">{(list as typeof DAYS).map((d, i) => <DayDot key={i} d={d} />)}</span>
              <span className="text-sm text-ink">Average <strong className="font-display text-base">{f(mean as number)}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="t-label">3 · The difference</span>
          <p className="m-0 text-ink"><strong className="font-display text-lg">{f(a)} − {f(b)} = +{f(a - b)}</strong></p>
          <span className="t-caption">1 point or more is needed.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="t-label">4 · The same way in both halves?</span>
          <p className="m-0 text-ink">First half <strong className="tabular">+{f(first)}</strong> · second half <strong className="tabular">+{f(second)}</strong></p>
          <span className="t-caption">Each half of the period must point the same way.</span>
        </div>
      </div>

      <p className="m-0 flex items-center gap-2 rounded-sm bg-brand-tint px-3 py-2.5 text-sm font-semibold text-brand-text">
        <Check size={18} strokeWidth={2.6} aria-hidden />In this sample, the habit would be listed under &quot;Worth watching&quot;. It is a difference in records, not proof that the habit caused anything.
      </p>
    </figure>
  );
}
