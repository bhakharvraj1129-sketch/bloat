"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Caption, Card, Label } from "@/components/ui";
import { HalvesCheck, ValueBars } from "@/components/charts";
import { ChartGate } from "@/components/chart-kit";
import { ProScreen, signed } from "@/components/pro";
import { useLoad } from "@/lib/client/hooks";
import { formatDate, formatRange } from "@/lib/time";
import { SmoothList } from "@/components/glide";
import { m, useReducedMotion } from "motion/react";
import { CountUp } from "@/components/count-up";
import { DUR, EASE_OUT } from "@/lib/motion";

type Item = {
  target: { label: string; kind: string; id: string }; state: string; with_days: number; without_days: number; mean_with: number | null; mean_without: number | null;
  difference: number | null; first_half: number | null; second_half: number | null; needed_with: number; needed_without: number; mostly_days: number;
  recalled_days: number; confounding_note: string | null; your_suspicion: boolean; experiment: { key: string; name: string } | null; message?: string;
};
type Data = {
  from: string; to: string; examined: number; header: string; date_format: "MM/DD" | "DD/MM"; worth_watching: Item[]; no_clear_difference: Item[];
  not_enough_data: Item[]; daily_food: Item[]; needs_correction: string[]; recalled_days: number; mostly_days: number;
  co_occurrence: Array<{ note: string }>; followed_note: string; footer: string; comparison_line: string; experiments_offered?: boolean;
  progress?: { confirmed_days: number; confirmed_needed: number };
};

/** Before anything can be compared: real progress towards the fewest confirmed days a comparison needs. */
function OnTheirWay({ confirmed, needed }: { confirmed: number; needed: number }) {
  const reduce = useReducedMotion();
  const r = 36, c = 2 * Math.PI * r, done = Math.min(confirmed, needed);
  const each = needed / 2;
  return (
    <Card className="flex items-center gap-5">
      <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${done} of ${needed} confirmed days`} className="shrink-0">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--brand-tint)" strokeWidth="9" />
        {done > 0 && <m.circle cx="44" cy="44" r={r} fill="none" stroke="var(--brand)" strokeWidth="9" strokeLinecap="round" transform="rotate(-90 44 44)"
          initial={reduce ? false : { strokeDasharray: `0 ${c}` }} animate={{ strokeDasharray: `${(done / needed) * c} ${c}` }} transition={{ duration: DUR.slow, ease: EASE_OUT }} />}
        <text x="44" y="43" textAnchor="middle" className="font-display" fontWeight="800" fontSize="22" fill="var(--ink)"><CountUp value={done} as="tspan" /></text>
        <text x="44" y="59" textAnchor="middle" fontSize="11" fill="var(--ink-muted)">of {needed} days</text>
      </svg>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="t-title">Your patterns are on their way</h2>
        <p className="text-[0.9375rem] leading-6 text-ink-muted">A comparison needs at least {each} confirmed days with something and {each} without it. Log during the day and answer the short review each morning.</p>
      </div>
    </Card>
  );
}

function needText(i: Item): string {
  if (i.state === "NEEDS_CORRECTION") return "Waiting for a day to be corrected.";
  if (i.state === "NO_ELIGIBLE_DATA") return "No usable days yet. A usable day has a confirmed score and a clear yes or no for this.";
  if (i.state === "ONE_GROUP_ONLY") return i.with_days ? `${i.with_days} days with it, none without. Your records can't compare it yet.` : `${i.without_days} days without it, none with.`;
  const parts = [];
  if (i.needed_with) parts.push(`${i.needed_with} more ${i.needed_with === 1 ? "day" : "days"} with it`);
  if (i.needed_without) parts.push(`${i.needed_without} more ${i.needed_without === 1 ? "day" : "days"} without it`);
  return `${parts.join(" and ")} needed. So far: ${i.with_days} with, ${i.without_days} without.`;
}

function Result({ i, line }: { i: Item; line: string }) {
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="t-title">{i.target.label}</p>
        {i.your_suspicion && <span className="t-caption">Your suspicion</span>}
      </div>
      <ChartGate>
        <ValueBars label={`Average Bloat Score with and without ${i.target.label}`} rows={[{ label: "Days with", value: i.mean_with!, days: i.with_days }, { label: "Days without", value: i.mean_without!, days: i.without_days }]} />
      </ChartGate>
      <p>Average {i.mean_with!.toFixed(1)} on {i.with_days} days with, {i.mean_without!.toFixed(1)} on {i.without_days} days without. Difference {signed(i.difference)}.</p>
      <ChartGate><HalvesCheck first={i.first_half} second={i.second_half} /></ChartGate>
      <Caption>First half {signed(i.first_half)} · second half {signed(i.second_half)}{i.mostly_days ? ` · includes ${i.mostly_days} "mostly" days` : ""}{i.recalled_days ? ` · includes ${i.recalled_days} days with ingredients added afterwards` : ""}</Caption>
      {i.confounding_note && <Caption>{i.confounding_note}</Caption>}
      <Caption>{line}</Caption>
      {i.experiment && <Link href={`/experiments?start=${i.experiment.key}`} className="font-semibold">Try an experiment: {i.experiment.name}</Link>}
    </Card>
  );
}

// Screen 30. Three sections, alphabetical inside each, never sorted by the size of the difference.
export function Triggers() {
  const load = useLoad<Data>("/v1/insights/triggers");
  return (
    <ProScreen title="Possible triggers" eyebrow="Patterns" load={load}>
      {(d) => {
        const waiting = !!d.progress && d.worth_watching.length === 0 && d.no_clear_difference.length === 0;
        return (
        <>
          <Caption>{d.header} {formatRange(d.from, d.to, d.date_format) ?? "No finished days yet"}.{d.recalled_days ? ` Includes ${d.recalled_days} days with ingredients added afterwards.` : ""}{d.mostly_days ? ` Includes ${d.mostly_days} "mostly" days.` : ""}</Caption>

          {/* Before anything is compared, one progress card replaces the two empty result sections. */}
          {waiting && <OnTheirWay confirmed={d.progress!.confirmed_days} needed={d.progress!.confirmed_needed} />}

          {d.needs_correction.length > 0 && (
            <Card className="flex flex-col gap-2">
              <p className="t-body-strong">Check {d.needs_correction.length === 1 ? "this day" : "these days"} first</p>
              <Caption>A review and a logged strength disagree. Comparisons wait until that is corrected.</Caption>
              <ul className="flex flex-wrap gap-2">{d.needs_correction.map((date) => <li key={date}><Link className="font-semibold" href={`/day/${date}`}>{formatDate(date, d.date_format, false)}</Link></li>)}</ul>
            </Card>
          )}

          {!waiting && (
            <>
          <section aria-labelledby="ww" className="flex flex-col gap-2">
            <Label id="ww">Worth watching</Label>
            {d.worth_watching.length ? <SmoothList className="flex flex-col gap-3">{d.worth_watching.map((i) => <Result key={i.target.id} i={i} line={d.comparison_line} />)}</SmoothList>
              : <Card><Caption>Nothing here yet. An item appears when its average differs by 1 point or more and points the same way in both halves of the period.</Caption></Card>}
          </section>

          <section aria-labelledby="ncd" className="flex flex-col gap-2">
            <Label id="ncd">No clear difference</Label>
            {d.no_clear_difference.length ? <SmoothList className="flex flex-col gap-3">{d.no_clear_difference.map((i) => <Result key={i.target.id} i={i} line={d.comparison_line} />)}</SmoothList>
              : <Card><Caption>Nothing compared yet.</Caption></Card>}
          </section>
            </>
          )}

          {d.daily_food.length > 0 && (
            <section aria-labelledby="daily" className="flex flex-col gap-2">
              <Label id="daily">Eaten almost every day</Label>
              <ul className="flex flex-col gap-3">
                {d.daily_food.map((i) => (
                  <Card as="li" key={i.target.id} className="flex flex-col gap-2">
                    <p className="t-title">{i.target.label}</p>
                    <p>{i.message}</p>
                    <Caption>On {i.with_days} of {i.with_days + i.without_days} usable days.</Caption>
                    {i.experiment && <Link href={`/experiments?start=${i.experiment.key}`} className="font-semibold">{i.experiment.name}</Link>}
                  </Card>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="ned" className="flex flex-col gap-2">
            <Label id="ned">Not enough data yet</Label>
            {/* Folded, so a long list of items waiting for days does not fill the screen. */}
            <details className="group rounded-lg border border-line bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-semibold [&::-webkit-details-marker]:hidden">
                <span>{d.not_enough_data.length} {d.not_enough_data.length === 1 ? "item waits" : "items wait"} for more days</span>
                <ChevronDown size={20} strokeWidth={2} aria-hidden className="shrink-0 transition-transform duration-150 group-open:rotate-180" />
              </summary>
              <ul className="border-t border-line px-5">
                {d.not_enough_data.map((i) => (
                  <li key={i.target.id} className="border-b border-line py-3 last:border-0">
                    <p className="font-semibold">{i.target.label}</p>
                    <Caption>{needText(i)}</Caption>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          {d.co_occurrence.map((c) => <Card key={c.note}><Caption>{c.note}</Caption></Card>)}
          <Caption>{d.followed_note} <Link href="/me">Change habits in You</Link></Caption>
          <p className="t-caption text-ink">{d.footer}</p>
          <nav aria-label="More" className="grid grid-cols-2 gap-2">
            {d.experiments_offered !== false && <Link href="/experiments" className="flex min-h-12 items-center justify-center rounded-sm border border-line bg-surface px-3 font-semibold text-ink no-underline">Experiments</Link>}
            <Link href="/journey" className="flex min-h-12 items-center justify-center rounded-sm border border-line bg-surface px-3 font-semibold text-ink no-underline">Your journey</Link>
          </nav>
        </>
        );
      }}
    </ProScreen>
  );
}
