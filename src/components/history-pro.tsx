"use client";
import Link from "next/link";
import { Caption, Card, Label } from "./ui";
import { DayChart } from "./charts";
import type { DayRow } from "@/app/(app)/history/history";

export type ProHistoryData = {
  seven_day_average: { available: true; value: number; label: string } | { available: false; days: number; needed: number };
  hide_charts?: boolean;
  context?: Array<{ from: string; to: string; kind: string }>;
};

// Pro additions at the top of History: the 7-day average, the daily chart and the report links.
export function ProHistory({ data, days, dateFormat }: { data: ProHistoryData; days: DayRow[]; dateFormat: "MM/DD" | "DD/MM" }) {
  const avg = data.seven_day_average;
  return (
    <>
      <Card className="flex items-center justify-between gap-4">
        <div>
          <Label>7-day average</Label>
          {avg.available ? <Caption>{avg.label}</Caption> : <Caption>Needs 4 scored days in the last 7. You have {avg.days}.</Caption>}
        </div>
        <span className="t-score text-[2.5rem] leading-10">{avg.available ? avg.value.toFixed(1) : "–"}</span>
      </Card>
      {!data.hide_charts && <DayChart days={[...days].reverse()} dateFormat={dateFormat} context={data.context ?? []} />}
      <nav aria-label="Reports" className="grid grid-cols-2 gap-2">
        {[["/insights", "Possible triggers"], ["/journey", "Your journey"], ["/report", "Weekly report"], ["/experiments", "Experiments"]].map(([href, label]) => (
          <Link key={href} href={href!} className="flex min-h-12 items-center justify-center rounded-pill border border-line bg-surface px-3 text-center font-semibold text-ink no-underline">{label}</Link>
        ))}
      </nav>
    </>
  );
}
