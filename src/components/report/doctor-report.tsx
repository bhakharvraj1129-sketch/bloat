import { Card, Caption, Label } from "@/components/ui";
import { DOCTOR_SECTION_NAMES, includedSections, privateDoctorSnapshot } from "@/lib/domain/report-privacy";
import type { DoctorSnapshot } from "@/server/reports";
import { zoneLabel } from "@/lib/regions";

// The doctor report as a web page. The in-app preview and the shared link both use this, so the
// person sees exactly what the person they share it with will see. The PDF follows the same
// rules (src/server/pdf/doctor.tsx). Switched-off sections never appear.
const mins = (m: number | null) => (m === null ? "not recorded" : m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const or = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "not recorded" : String(v));

function Rows({ rows }: { rows: Array<[string, string | number | null | undefined]> }) {
  return (
    <dl className="mt-2 flex flex-col">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line py-1 last:border-0">
          <dt className="text-ink-muted">{k}</dt>
          <dd className="text-right">{or(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DoctorReportView({ snapshot }: { snapshot: DoctorSnapshot }) {
  const d = privateDoctorSnapshot(snapshot);
  const inc = new Set(includedSections(d));
  const s = d.summary, sec = d.sections;
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="t-title">Bloating diary summary</p>
        <Caption>{d.from} to {d.to} · time zone: {zoneLabel(d.time_zone)}</Caption>
        <Caption>{d.notice}</Caption>
        <Caption>Sections included: {[...inc].map((k) => DOCTOR_SECTION_NAMES[k]).join(", ") || "none"}.</Caption>
      </header>

      <Card as="section">
        <Label>At a glance</Label>
        <Rows rows={[
          ["Tracking period", `${s.tracking_days} days, ${s.confirmed_days} with a confirmed daily score (${s.completeness ?? 0}%)`],
          ...(inc.has("symptoms") ? ([
            ["Days with bloating, last 30 days", s.bloating_days_30],
            ["Typical strength when bloated (1–10)", s.typical_strength],
            ["Average confirmed daily score (0–10)", s.average_daily_score],
            ["Typical episode length", mins(s.typical_episode_minutes)],
            ["How long it has been happening", s.how_long],
            ["How often (own description)", s.how_often],
            ["How much it got in the way last week", s.weekly_impact],
          ] as Array<[string, string | number | null]>) : []),
        ]} />
      </Card>

      {(inc.has("meals") || inc.has("habits")) && (
        <Card as="section">
          <Label>Main patterns in the records</Label>
          {s.patterns.length ? (
            <ul className="mt-2 list-disc pl-5">{s.patterns.map((p) => <li key={p.label}>{p.label}: average {p.mean_with} on {p.with_days} days with, {p.mean_without} on {p.without_days} days without.{p.confounding_note ? ` ${p.confounding_note}` : ""}</li>)}</ul>
          ) : <p className="mt-2">No pattern has enough days to report yet.</p>}
          <Caption className="mt-2">{d.comparison_line} {d.footer}</Caption>
        </Card>
      )}

      {inc.has("medicines") && (
        <Card as="section">
          <Label>Medicines and supplements</Label>
          {s.medicines.length ? (
            <ul className="mt-2 list-disc pl-5">{s.medicines.map((m) => <li key={m.name}>{m.name}{m.group ? ` (${m.group})` : ""}{m.started_on ? `, started ${m.started_on}` : ""}{m.changes.map((c) => `; ${c.change}${c.date ? ` ${c.date}` : ""}`).join("")}</li>)}</ul>
          ) : <p className="mt-2">None recorded.</p>}
        </Card>
      )}

      {inc.has("health") && s.context.length > 0 && (
        <Card as="section"><Label>Context</Label><p className="mt-2">{s.context.join(" · ")}</p></Card>
      )}

      {inc.has("symptoms") && (
        <Card as="section">
          <Label>Warning signs logged</Label>
          <p className="mt-2">{s.warning_signs.length ? s.warning_signs.map((w) => `${w.label} (${w.times})`).join(", ") : "None logged."}</p>
        </Card>
      )}

      {s.doctor_line && (
        <Card as="section" className="bg-brand-tint">
          <p>{s.doctor_line.sentence}</p>
          {s.doctor_line.ovarian && <p>{s.doctor_line.ovarian}</p>}
          <Caption>{s.doctor_line.source}. Bloating was logged on {s.doctor_line.days} of the last 30 days.</Caption>
        </Card>
      )}

      <Card as="section" className="border border-ink">
        <Label>Questions for the appointment</Label>
        <p className="mt-2 whitespace-pre-wrap">{s.questions ?? "None written."}</p>
      </Card>

      {sec.symptoms && (
        <Card as="section">
          <Label>Symptoms</Label>
          <Rows rows={[
            ["Bloating records", `${sec.symptoms.episodes} on ${sec.symptoms.days_with_bloating} days`],
            ["What it feels like", sec.symptoms.feel.map((f) => `${f.label} (${f.times})`).join(", ")],
            ["Other symptoms logged with it", sec.symptoms.other.map((f) => `${f.label} (${f.times})`).join(", ")],
            ["Usually worst (own description)", sec.symptoms.usually_worst?.join(", ")],
            ...(sec.symptoms.eased ? ([["Eased after passing stool or gas", `Yes ${sec.symptoms.eased.yes}, No ${sec.symptoms.eased.no}`]] as Array<[string, string]>) : []),
          ]} />
        </Card>
      )}
      {sec.meals && (
        <Card as="section">
          <Label>Meals and food groups</Label>
          <Rows rows={[["Meals logged", sec.meals.meals], ...sec.meals.groups.map((g) => [g.label, `had on ${g.days} days`] as [string, string])]} />
          <Caption className="mt-2">{sec.meals.triggers.examined} groups and habits were compared. {sec.meals.triggers.no_clear_difference.length} showed no clear difference; {sec.meals.triggers.not_enough_data} did not have enough days.</Caption>
        </Card>
      )}
      {sec.bowel && (
        <Card as="section">
          <Label>Bowel record</Label>
          <Rows rows={[
            ["Bowel movements logged", sec.bowel.entries], ["With straining", sec.bowel.strained], ["Felt incomplete", sec.bowel.incomplete], ["Days reported with none", sec.bowel.days_without],
            ...sec.bowel.descriptions.map((x) => [x.label, `${x.times} times`] as [string, string]),
          ]} />
        </Card>
      )}
      {sec.habits && (
        <Card as="section">
          <Label>Habits and exercise</Label>
          <Rows rows={[...sec.habits.logged.map((h) => [h.label, `${h.days} days`] as [string, string]), ["Exercise", `${sec.habits.exercise.sessions} sessions, ${sec.habits.exercise.minutes} minutes`]]} />
        </Card>
      )}
      {sec.medicines && sec.medicines.length > 0 && (
        <Card as="section">
          <Label>Medicine before and after</Label>
          <ul className="mt-2 list-disc pl-5">{sec.medicines.map((m, i) => <li key={i}>{m.medicine}, {m.event.replace(/_/g, " ")} {m.date}: {m.state === "ready" ? `average ${m.before_mean} in the 14 days before (${m.before_days} days), ${m.after_mean} after (${m.after_days} days).` : "not enough scored days on both sides yet."}</li>)}</ul>
          {d.medicine_line && <Caption className="mt-2">{d.medicine_line}</Caption>}
        </Card>
      )}
      {sec.health && (
        <Card as="section">
          <Label>Health background (entered by the person)</Label>
          {sec.health.conditions.length ? <Rows rows={sec.health.conditions.map((c) => [c.label, [c.status, c.year].filter(Boolean).join(", ")] as [string, string])} /> : <p className="mt-2">None recorded.</p>}
        </Card>
      )}
      {sec.family && (
        <Card as="section"><Label>Family history (parent, brother or sister)</Label><p className="mt-2">{sec.family.join(", ")}</p></Card>
      )}
      {sec.tests && (
        <Card as="section">
          <Label>Tests (as written by the person)</Label>
          {sec.tests.length ? <Rows rows={sec.tests.map((t) => [`${t.label}${t.date ? `, ${t.date}` : ""}`, t.result] as [string, string | null])} /> : <p className="mt-2">None recorded.</p>}
        </Card>
      )}
      {sec.experiments && (
        <Card as="section">
          <Label>Experiments</Label>
          {sec.experiments.length ? <ul className="mt-2 list-disc pl-5">{sec.experiments.map((e) => <li key={e.id}>{e.name}, started {e.started_on}: {e.result ?? "in progress"}</li>)}</ul> : <p className="mt-2">None.</p>}
        </Card>
      )}
      {sec.missing && (
        <Card as="section"><Label>What is missing, and limits</Label><ul className="mt-2 list-disc pl-5">{sec.missing.map((m) => <li key={m}>{m}</li>)}</ul></Card>
      )}
      <Caption>{d.intended_use}</Caption>
    </div>
  );
}
