"use client";
import { useEffect, useState } from "react";
import { Caption, Card, ErrorState, Label, Loading, ScoreBadge, Screen } from "@/components/ui";
import { DoctorLineBox, type DoctorLineData } from "@/components/doctorline";
import { api, ApiFailure } from "@/lib/client/api";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/time";
import { signed } from "@/components/pro";

type Snap = {
  from: string; to: string; days: Array<{ date: string; status: string; score: number | null; highest_logged: number | null }>;
  counts: { confirmed: number; late: number; missing: number };
  seven_day_average: { available: true; value: number; label: string } | { available: false; days: number; needed: number };
  episodes: { count: number; reported_hours: number; partial: boolean; usual_start_hour: number | null };
  triggers_changed: Array<{ label: string; section: string }>;
  worth_watching: Array<{ label: string; with_days: number; without_days: number; mean_with: number | null; mean_without: number | null; first_half: number | null; second_half: number | null }>;
  experiment: { name: string; phase: string } | null; bowel: { entries: number; strained: number; incomplete: number; no_days: number };
  habits: Array<{ label: string; days: number }>; next_best_log: string | null; doctor_line: DoctorLineData | null; footer: string; comparison_line: string;
};
const SECTION: Record<string, string> = { worth_watching: "Worth watching", no_clear_difference: "No clear difference", not_enough_data: "Not enough data yet", daily_food: "Eaten almost every day" };

// Screen 28: the weekly Personal Pattern Report, stored as a snapshot of the finished week.
export function Report() {
  const router = useRouter();
  const [snap, setSnap] = useState<Snap | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    api<{ snapshot: Snap }>("POST", "/v1/reports", { kind: "pattern" })
      .then((r) => { if (alive) setSnap(r.snapshot); })
      .catch((e) => { if (!alive) return; if (e instanceof ApiFailure && e.code === "PLAN_REQUIRED") router.replace("/upgrade"); else setError(e instanceof ApiFailure ? e : null); });
    return () => { alive = false; };
  }, [tick, router]);

  if (error) return <Screen title="Weekly report" eyebrow="Patterns" back="/insights"><ErrorState error={error} onRetry={() => { setError(null); setTick((t) => t + 1); }} /></Screen>;
  if (!snap) return <Screen title="Weekly report" eyebrow="Patterns" back="/insights"><Loading /></Screen>;
  const fmt = (d: string) => formatDate(d, "DD/MM", false);
  return (
    <Screen title="Weekly report" eyebrow="Patterns" back="/insights">
      <Caption>{fmt(snap.from)} to {fmt(snap.to)} · {snap.counts.confirmed} confirmed, {snap.counts.late} late, {snap.counts.missing} without a score</Caption>
      {snap.doctor_line && <DoctorLineBox line={snap.doctor_line} />}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div><Label>7-day average</Label>{snap.seven_day_average.available ? <Caption>{snap.seven_day_average.label}</Caption> : <Caption>Needs 4 scored days. This week has {snap.seven_day_average.days}.</Caption>}</div>
          <span className="t-score text-[2.5rem] leading-10">{snap.seven_day_average.available ? snap.seven_day_average.value.toFixed(1) : "–"}</span>
        </div>
        <ul className="grid grid-cols-7 gap-1" aria-label="Daily scores this week">
          {snap.days.map((d) => (
            <li key={d.date} className="flex flex-col items-center gap-1">
              <ScoreBadge size="sm" value={d.score ?? d.highest_logged} unknown={d.score === null} label={`${fmt(d.date)}: ${d.score ?? "no confirmed score"}`} />
              <span className="t-caption">{fmt(d.date).split(" ")[0]}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <Label>Bloating</Label>
        <p className="mt-1">{snap.episodes.count} {snap.episodes.count === 1 ? "episode" : "episodes"} · {snap.episodes.reported_hours} reported hours{snap.episodes.partial ? " (partial: an end time is unknown)" : ""}{snap.episodes.usual_start_hour !== null ? ` · usual start around ${snap.episodes.usual_start_hour}:00` : ""}</p>
      </Card>
      <Card className="flex flex-col gap-2">
        <Label>Possible triggers</Label>
        {snap.worth_watching.length ? snap.worth_watching.map((p) => <p key={p.label}>{p.label}: {p.mean_with?.toFixed(1)} on {p.with_days} days with, {p.mean_without?.toFixed(1)} on {p.without_days} days without. <span className="t-caption">First half {signed(p.first_half)} · second half {signed(p.second_half)}</span></p>) : <Caption>Nothing is worth watching yet.</Caption>}
        {snap.triggers_changed.length > 0 && <Caption>Changed since the last report: {snap.triggers_changed.map((c) => `${c.label} is now under "${SECTION[c.section]}"`).join("; ")}.</Caption>}
        <Caption>{snap.comparison_line}</Caption>
      </Card>
      {snap.experiment && <Card><Label>Experiment</Label><p className="mt-1">{snap.experiment.name}: {snap.experiment.phase === "RUNNING" ? "running" : snap.experiment.phase === "ADDING_BACK" ? "adding back" : "paused"}</p></Card>}
      <Card>
        <Label>Bowel and habits</Label>
        <p className="mt-1">{snap.bowel.entries} bowel movements logged ({snap.bowel.strained} with straining, {snap.bowel.incomplete} felt incomplete); {snap.bowel.no_days} days reported with none.</p>
        {snap.habits.length > 0 && <p>{snap.habits.map((h) => `${h.label}: ${h.days} ${h.days === 1 ? "day" : "days"}`).join(" · ")}</p>}
      </Card>
      {snap.next_best_log && <Card><Label>Next best log</Label><p className="mt-1">{snap.next_best_log}</p></Card>}
      <p className="t-caption text-ink">{snap.footer}</p>
    </Screen>
  );
}
