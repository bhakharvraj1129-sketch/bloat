"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Caption, Card, Label, LinkButton } from "@/components/ui";
import { HourChart, TrendLine } from "@/components/charts";
import { DoctorLineBox, type DoctorLineData } from "@/components/doctorline";
import { ProScreen, signed } from "@/components/pro";
import { useLoad } from "@/lib/client/hooks";
import { formatDate, formatDuration } from "@/lib/time";

type Figures = { days: number; confirmed_days: number; typical_score: number | null; episodes_per_week: number | null; typical_episode_minutes: number | null; completeness: number | null };
type Pattern = { label: string; with_days: number; without_days: number; mean_with: number | null; mean_without: number | null; first_half: number | null; second_half: number | null };
type Cycle = { state: string; cycles?: number; needed_cycles?: number; windows?: Record<string, number>; before?: { mean: number; days: number }; period?: { mean: number; days: number }; other?: { mean: number; days: number }; before_vs_other?: { difference: number; first_half: number | null; second_half: number | null } };
type Med = { medicine: string; event: string; date: string; state: string; before_days: number; after_days: number; before_mean: number | null; after_mean: number | null; needed_before: number; needed_after: number };
type Data = {
  from: string; to: string; section_order: string[]; date_format: "MM/DD" | "DD/MM";
  since: { days_tracked: number; days: number; confirmed_days: number; completeness: number | null; bloating_days_30: number; typical_strength: number | null; strength_readings: number; typical_episode_minutes: number | null; episodes_with_length: number; trend: Array<{ week_start: string; value: number | null; days: number }> };
  your_usual: { available: true; usual: number; recent: Figures; first_30: Figures | null; bloating_days_30: number; weekly_impact: string | null } | { available: false; confirmed_days: number; needed: number };
  records: { worth_watching: Pattern[]; examined: number; header: string; cycle: Cycle; medicines: Med[] };
  tried: Array<{ id: string; name: string; phase: string; started_on: string; result: string | null }>;
  phase: { label: string; next: string }; missing: string[];
  monthly: { hours: { available: boolean; episodes: number; hours: number[] }; coverage: { confirmed: number; late: number; days: number } };
  doctor_line: DoctorLineData | null; comparison_line: string; medicine_line: string; footer: string; doctor_report: { from: string; to: string };
};
const IMPACT: Record<string, string> = { not_at_all: "Not at all", a_little: "A little", a_lot: "A lot" };
const mins = (m: number | null) => (m === null ? "–" : formatDuration(m * 60000));

function Fig({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="flex flex-col"><span className="t-caption">{label}</span><span className="t-title tabular">{value}</span><span className="t-caption">{note}</span></div>;
}

// Screen 29. The whole story on one screen; sections follow the user's goal. Every figure has its day count.
export function Journey() {
  const load = useLoad<Data>("/v1/journey");
  return (
    <ProScreen title="Your journey" eyebrow="Patterns" back="/insights" load={load}>
      {(d) => {
        const doctorButton = <LinkButton href={`/doctor?from=${d.doctor_report.from}&to=${d.doctor_report.to}`}>Make doctor report</LinkButton>;
        const sections: Record<string, ReactNode> = {
          doctor: (
            <section key="doctor" className="flex flex-col gap-2" aria-labelledby="j-doc">
              <Label id="j-doc">For your doctor visit</Label>
              <Card className="flex flex-col gap-3">
                <p>{d.since.confirmed_days} confirmed days from {formatDate(d.from, d.date_format, false)} to {formatDate(d.to, d.date_format, false)}. Bloating on {d.since.bloating_days_30} of the last 30 days.</p>
                {doctorButton}
              </Card>
            </section>
          ),
          since: (
            <section key="since" className="flex flex-col gap-2" aria-labelledby="j-since">
              <Label id="j-since">Since you started</Label>
              <Card className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Fig label="Days tracked" value={String(d.since.days_tracked)} note={`of ${d.since.days} days`} />
                  <Fig label="Completeness" value={d.since.completeness === null ? "–" : `${d.since.completeness}%`} note={`${d.since.confirmed_days} confirmed days`} />
                  <Fig label="Bloating days" value={String(d.since.bloating_days_30)} note="in the last 30 days" />
                  <Fig label="Typical strength" value={d.since.typical_strength === null ? "–" : String(d.since.typical_strength)} note={`${d.since.strength_readings} readings`} />
                  <Fig label="Typical episode" value={mins(d.since.typical_episode_minutes)} note={`${d.since.episodes_with_length} with a known end`} />
                </div>
                <div>
                  <p className="t-caption">Weekly average Bloat Score</p>
                  <TrendLine points={d.since.trend.map((w) => ({ label: formatDate(w.week_start, d.date_format, false), value: w.value }))} />
                </div>
              </Card>
            </section>
          ),
          usual: (
            <section key="usual" className="flex flex-col gap-2" aria-labelledby="j-usual">
              <Label id="j-usual">Your usual</Label>
              {d.your_usual.available ? (
                <Card className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Fig label="Typical daily score" value={String(d.your_usual.recent.typical_score ?? "–")} note={`${d.your_usual.recent.confirmed_days} confirmed days`} />
                    <Fig label="Episodes a week" value={String(d.your_usual.recent.episodes_per_week ?? "–")} note={`last ${d.your_usual.recent.days} days`} />
                    <Fig label="Typical episode" value={mins(d.your_usual.recent.typical_episode_minutes)} note="median length" />
                    <Fig label="Got in the way" value={d.your_usual.weekly_impact ? IMPACT[d.your_usual.weekly_impact] ?? "–" : "–"} note="last weekly answer" />
                  </div>
                  {d.your_usual.first_30 && (
                    <div className="rounded-sm border border-line p-3">
                      <p className="t-caption">Your first 30 days, side by side</p>
                      <p>Typical daily score {d.your_usual.first_30.typical_score ?? "–"} ({d.your_usual.first_30.confirmed_days} confirmed days) · {d.your_usual.first_30.episodes_per_week ?? "–"} episodes a week · typical episode {mins(d.your_usual.first_30.typical_episode_minutes)}</p>
                    </div>
                  )}
                  <Caption>{d.comparison_line}</Caption>
                </Card>
              ) : <Card><Caption>Your usual appears after 14 confirmed days. You have {d.your_usual.confirmed_days}; {d.your_usual.needed} more to go.</Caption></Card>}
            </section>
          ),
          records: (
            <section key="records" className="flex flex-col gap-2" aria-labelledby="j-rec">
              <Label id="j-rec">What your records show</Label>
              <Card className="flex flex-col gap-3">
                <p className="t-body-strong">Patterns worth watching</p>
                {d.records.worth_watching.length ? (
                  <ul className="flex flex-col gap-2">
                    {d.records.worth_watching.map((p) => <li key={p.label}>{p.label}: average {p.mean_with?.toFixed(1)} on {p.with_days} days with, {p.mean_without?.toFixed(1)} on {p.without_days} days without. <span className="t-caption">First half {signed(p.first_half)} · second half {signed(p.second_half)}</span></li>)}
                  </ul>
                ) : <Caption>None yet. {d.records.header}</Caption>}
                <Caption>{d.comparison_line}</Caption>
                <Link href="/insights" className="font-semibold">Open possible triggers</Link>
              </Card>
              {d.records.cycle.state !== "off" && (
                <Card className="flex flex-col gap-2">
                  <p className="t-body-strong">Your cycle</p>
                  {d.records.cycle.state === "ready" && (
                    <>
                      <p>5 days before a period: {d.records.cycle.before!.mean.toFixed(1)} ({d.records.cycle.before!.days} days) · period days: {d.records.cycle.period!.mean.toFixed(1)} ({d.records.cycle.period!.days} days) · other days: {d.records.cycle.other!.mean.toFixed(1)} ({d.records.cycle.other!.days} days)</p>
                      <Caption>Before a period compared with other days: first half {signed(d.records.cycle.before_vs_other!.first_half)} · second half {signed(d.records.cycle.before_vs_other!.second_half)}. Based on {d.records.cycle.cycles} complete cycles.</Caption>
                      <Caption>{d.comparison_line}</Caption>
                    </>
                  )}
                  {d.records.cycle.state === "not_enough" && <Caption>Not enough data yet. {d.records.cycle.needed_cycles ? `${d.records.cycle.needed_cycles} more complete ${d.records.cycle.needed_cycles === 1 ? "cycle" : "cycles"} needed (3 in all).` : "Each part of the cycle needs 7 confirmed days."}</Caption>}
                  {d.records.cycle.state === "not_offered" && <Caption>Perimenopause or menopause is shaded on your charts and listed in the doctor report. A cycle comparison is not shown.</Caption>}
                </Card>
              )}
              {d.records.medicines.map((m) => (
                <Card key={`${m.medicine}-${m.event}-${m.date}`} className="flex flex-col gap-2">
                  <p className="t-body-strong">{m.medicine}: {m.event.replace(/_/g, " ")} on {formatDate(m.date, d.date_format, false)}</p>
                  {m.state === "ready" ? <p>14 days before: {m.before_mean?.toFixed(1)} ({m.before_days} days) · 14 days after: {m.after_mean?.toFixed(1)} ({m.after_days} days)</p>
                    : <Caption>Not enough days yet: {m.needed_before ? `${m.needed_before} more before` : ""}{m.needed_before && m.needed_after ? " and " : ""}{m.needed_after ? `${m.needed_after} more after` : ""} needed (7 confirmed days on each side).</Caption>}
                  <Caption>{d.medicine_line}</Caption>
                </Card>
              ))}
            </section>
          ),
          tried: (
            <section key="tried" className="flex flex-col gap-2" aria-labelledby="j-tried">
              <Label id="j-tried">What you have tried</Label>
              {d.tried.length ? d.tried.map((e) => (
                <Card key={e.id} className="flex flex-col gap-1">
                  <p className="t-body-strong">{e.name}</p>
                  <Caption>Started {formatDate(e.started_on, d.date_format, false)}</Caption>
                  <p>{e.result ?? "In progress."}</p>
                  <Link href={`/experiments/${e.id}`} className="font-semibold">Open</Link>
                </Card>
              )) : <Card><Caption>No experiments yet. <Link href="/experiments">See experiments</Link></Caption></Card>}
            </section>
          ),
          phase: (
            <section key="phase" className="flex flex-col gap-2" aria-labelledby="j-phase">
              <Label id="j-phase">Your phase</Label>
              <Card><p className="t-body-strong">{d.phase.label}</p><Caption>{d.phase.next}</Caption></Card>
            </section>
          ),
          missing: (
            <section key="missing" className="flex flex-col gap-2" aria-labelledby="j-miss">
              <Label id="j-miss">What is missing</Label>
              <Card>{d.missing.length ? <ul className="list-disc pl-5">{d.missing.map((m) => <li key={m}>{m}</li>)}</ul> : <Caption>Nothing stands out as missing.</Caption>}</Card>
            </section>
          ),
          monthly: (
            <section key="monthly" className="flex flex-col gap-2" aria-labelledby="j-month">
              <Label id="j-month">When it starts</Label>
              <Card className="flex flex-col gap-2">
                {d.monthly.hours.available ? <><HourChart hours={d.monthly.hours.hours} /><Caption>Start times of {d.monthly.hours.episodes} finished bloating records.</Caption></>
                  : <Caption>A time-of-day chart appears after 10 finished bloating records. You have {d.monthly.hours.episodes}.</Caption>}
              </Card>
            </section>
          ),
        };
        return (
          <>
            <Caption>{formatDate(d.from, d.date_format, false)} to {formatDate(d.to, d.date_format, false)}</Caption>
            {d.section_order.map((k) => sections[k])}
            {d.doctor_line && <DoctorLineBox line={d.doctor_line} />}
            {!d.section_order.includes("doctor") && doctorButton}
            <p className="t-caption text-ink">{d.footer}</p>
          </>
        );
      }}
    </ProScreen>
  );
}
