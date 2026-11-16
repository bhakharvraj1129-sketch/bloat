"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Caption, Card, Empty, ErrorState, Label, Loading, ProTag, ScoreBadge, Screen } from "@/components/ui";
import { DoctorLineBox, type DoctorLineData } from "@/components/doctorline";
import { ProHistory, type ProHistoryData } from "@/components/history-pro";
import { useLoad } from "@/lib/client/hooks";
import { formatDate } from "@/lib/time";

export type DayRow = {
  date: string; status: "UNKNOWN" | "PROVISIONAL" | "CONFIRMED" | "LATE" | "CONFLICT"; score: number | null; highest_logged: number | null;
  provisional_zero: boolean; episodes: number; meals: number; baseline?: "above" | "around" | "below" | null;
};
type Data = {
  plan: "free" | "pro"; today: string; date_format: "MM/DD" | "DD/MM"; days: DayRow[]; doctor_line: DoctorLineData | null;
  progress: { days_logged: number; confirmed_days: number; confirmed_needed: number }; pro: ProHistoryData | null;
};

export function statusText(d: DayRow): string {
  if (d.status === "CONFIRMED") return "Confirmed";
  if (d.status === "LATE") return "Late review";
  if (d.status === "CONFLICT") return "Check this day";
  if (d.status === "PROVISIONAL") return d.highest_logged !== null ? `Highest logged ${d.highest_logged} · review to confirm` : d.provisional_zero ? "No bloating so far · review to confirm" : "Review to confirm";
  return "Nothing logged";
}

const LOCKED = [
  ["Chart and 7-day average", "Your daily scores as a chart."],
  ["Possible triggers", "Foods and habits compared with your scores, with day counts."],
  ["Weekly report and Your journey", "Your records summed up, and a report for your doctor."],
];

// Screen 26. Free: the day list. Pro: chart, average and links to reports.
export function History() {
  const { data, error, loading, reload } = useLoad<Data>("/v1/history");
  if (loading && !data) return <Screen title="History"><Loading what="Loading history" /></Screen>;
  if (error && !data) return <Screen title="History"><ErrorState error={error} onRetry={reload} /></Screen>;
  if (!data) return null;
  const anything = data.days.some((d) => d.status !== "UNKNOWN" || d.meals > 0);
  return (
    <Screen title="History">
      {data.doctor_line && <DoctorLineBox line={data.doctor_line} onChanged={reload} />}
      {data.pro && <ProHistory data={data.pro} days={data.days} dateFormat={data.date_format} />}
      <section aria-labelledby="days" className="flex flex-col gap-2">
        <Label id="days">Your days</Label>
        {!anything ? (
          <Empty title="No days yet">Log bloating or a meal on Today and your days will appear here.</Empty>
        ) : (
          <Card className="px-4 py-1">
            <ul>
              {data.days.map((d) => (
                <li key={d.date} className="border-b border-line last:border-0">
                  <Link href={`/day/${d.date}`} className="flex min-h-16 items-center gap-3 py-2 text-ink no-underline">
                    <ScoreBadge value={d.score ?? d.highest_logged} unknown={d.score === null} size="md" label={d.score !== null ? `Bloat Score ${d.score}` : "No confirmed score"} />
                    <span className="flex grow flex-col">
                      <span className="font-semibold">{formatDate(d.date, data.date_format)}{d.date === data.today ? " · today" : ""}</span>
                      <span className="t-caption">{statusText(d)}{d.baseline ? ` · ${d.baseline} your usual` : ""}</span>
                    </span>
                    <span className="t-caption text-right tabular">{d.episodes} {d.episodes === 1 ? "episode" : "episodes"}<br />{d.meals} {d.meals === 1 ? "meal" : "meals"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Caption>? means no confirmed score. A score is confirmed by the morning review.</Caption>
      </section>
      {data.plan === "free" && (
        <section aria-labelledby="pro" className="flex flex-col gap-2">
          <Label id="pro">Part of Pro</Label>
          {LOCKED.map(([title, text]) => (
            <Link key={title} href="/upgrade" className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 text-ink no-underline">
              <Lock size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden />
              <span className="flex grow flex-col"><span className="font-semibold">{title}<ProTag /></span><span className="t-caption">{text}</span></span>
            </Link>
          ))}
          <Caption>You have {data.progress.confirmed_days} confirmed {data.progress.confirmed_days === 1 ? "day" : "days"}. Pro compares days once there are enough of them.</Caption>
        </section>
      )}
    </Screen>
  );
}
