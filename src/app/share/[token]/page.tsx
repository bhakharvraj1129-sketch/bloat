import { createHash } from "node:crypto";
import { Card, Caption, Label } from "@/components/ui";
import { srv } from "@/server/db";
import type { DoctorSnapshot } from "@/server/reports";

export const metadata = { title: "Shared report", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// A report shared by link. Only a live, unrevoked, unexpired link shows anything at all.
export default async function Shared({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hash = createHash("sha256").update(token).digest("hex");
  const row = await srv<{ snapshot: DoctorSnapshot; expires_at: string } | null>("srv_share_lookup", { p_token_hash: hash }).catch(() => null);
  if (!row) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
        <h1 className="t-headline">This link no longer works</h1>
        <p>It has expired or was withdrawn by the person who shared it. Ask them for a new link.</p>
      </main>
    );
  }
  const d = row.snapshot, s = d.summary;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="t-headline">Bloating diary summary</h1>
        <Caption>{d.from} to {d.to} · time zone {d.time_zone} · shared until {row.expires_at.slice(0, 10)}</Caption>
        <Caption>{d.notice}</Caption>
      </header>
      <Card as="section">
        <Label>At a glance</Label>
        <ul className="mt-2 list-disc pl-5">
          <li>{s.tracking_days} days tracked, {s.confirmed_days} with a confirmed daily score ({s.completeness ?? 0}%)</li>
          <li>Days with bloating in the last 30: {s.bloating_days_30}</li>
          <li>Typical strength when bloated (1–10): {s.typical_strength ?? "not recorded"}</li>
          <li>Typical episode length: {s.typical_episode_minutes === null ? "not recorded" : `${s.typical_episode_minutes} min`}</li>
          <li>How long it has been happening: {s.how_long ?? "not recorded"}</li>
          <li>How much it got in the way last week: {s.weekly_impact ?? "not recorded"}</li>
        </ul>
      </Card>
      <Card as="section">
        <Label>Main patterns in the records</Label>
        {s.patterns.length ? <ul className="mt-2 list-disc pl-5">{s.patterns.map((p) => <li key={p.label}>{p.label}: average {p.mean_with} on {p.with_days} days with, {p.mean_without} on {p.without_days} days without.</li>)}</ul> : <p className="mt-2">No pattern has enough days to report yet.</p>}
        <Caption className="mt-2">{d.comparison_line} {d.footer}</Caption>
      </Card>
      <Card as="section">
        <Label>Medicines, context and warning signs</Label>
        <p className="mt-2">Medicines: {s.medicines.length ? s.medicines.map((m) => `${m.name}${m.group ? ` (${m.group})` : ""}`).join(", ") : "none recorded"}.</p>
        {s.context.length > 0 && <p>{s.context.join(" · ")}</p>}
        <p>Warning signs logged: {s.warning_signs.length ? s.warning_signs.map((w) => `${w.label} (${w.times})`).join(", ") : "none"}.</p>
      </Card>
      {s.doctor_line && <Card as="section" className="bg-brand-tint"><p>{s.doctor_line.sentence}</p>{s.doctor_line.ovarian && <p>{s.doctor_line.ovarian}</p>}<Caption>{s.doctor_line.source}</Caption></Card>}
      <Card as="section"><Label>Questions for the appointment</Label><p className="mt-2 whitespace-pre-wrap">{s.questions ?? "None written."}</p></Card>
      {d.sections.missing && <Card as="section"><Label>What is missing, and limits</Label><ul className="mt-2 list-disc pl-5">{d.sections.missing.map((m) => <li key={m}>{m}</li>)}</ul></Card>}
      <Caption>{d.intended_use}</Caption>
    </main>
  );
}
