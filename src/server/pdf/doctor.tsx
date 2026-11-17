import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { DoctorSnapshot } from "../reports";
import { DOCTOR_SECTION_NAMES, includedSections, privateDoctorSnapshot } from "@/lib/domain/report-privacy";

// The doctor PDF, made on the server from an immutable snapshot. Plain black on white so it
// prints and photocopies well. Page 1 is a two-minute summary (0.3 fix 25).
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#17211e", lineHeight: 1.4 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
  muted: { color: "#55625c", fontSize: 9 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#dce3de", paddingVertical: 3 },
  k: { width: "45%", color: "#55625c" }, v: { width: "55%" },
  box: { borderWidth: 1, borderColor: "#17211e", borderRadius: 4, padding: 8, marginTop: 8 },
  note: { backgroundColor: "#dcebe5", padding: 8, borderRadius: 4, marginTop: 8 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#55625c" },
  li: { marginBottom: 2 },
});

const Row = ({ k, v }: { k: string; v: string | number | null | undefined }) => (
  <View style={s.row}><Text style={s.k}>{k}</Text><Text style={s.v}>{v === null || v === undefined || v === "" ? "Not recorded" : String(v)}</Text></View>
);
const mins = (m: number | null) => (m === null ? null : m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const pattern = (p: DoctorSnapshot["summary"]["patterns"][number]) =>
  `${p.label}: average ${p.mean_with} on ${p.with_days} days with, ${p.mean_without} on ${p.without_days} days without. First half ${p.first_half ?? "–"}, second half ${p.second_half ?? "–"}.`;

function Report({ d: raw, name }: { d: DoctorSnapshot; name: string }) {
  // Switched-off sections are removed everywhere, including page 1 (see report-privacy.ts).
  const d = privateDoctorSnapshot(raw);
  const inc = new Set(includedSections(d));
  const sm = d.summary, sec = d.sections;
  const footer = <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `Bloat doctor report · ${d.from} to ${d.to} · self-reported · page ${pageNumber} of ${totalPages}`} />;
  return (
    <Document title="Bloat doctor report" author="Bloat" subject="Self-reported bloating diary">
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Bloating diary summary</Text>
        <Text style={s.muted}>{name ? `${name} · ` : ""}{d.from} to {d.to} · time zone {d.time_zone}</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>{d.notice}</Text>
        <Text style={s.muted}>Sections included: {[...inc].map((k) => DOCTOR_SECTION_NAMES[k]).join(", ") || "none"}.</Text>

        <Text style={s.h2}>At a glance</Text>
        <Row k="Tracking period" v={`${sm.tracking_days} days, ${sm.confirmed_days} with a confirmed daily score (${sm.completeness ?? 0}%)`} />
        {inc.has("symptoms") && (<>
          <Row k="Days with bloating, last 30 days" v={sm.bloating_days_30} />
          <Row k="Typical strength when bloated (1–10)" v={sm.typical_strength} />
          <Row k="Average confirmed daily score (0–10)" v={sm.average_daily_score} />
          <Row k="Typical episode length" v={mins(sm.typical_episode_minutes)} />
          <Row k="How long it has been happening" v={sm.how_long} />
          <Row k="How often (own description)" v={sm.how_often} />
          <Row k="How much it got in the way last week" v={sm.weekly_impact} />
        </>)}

        {(inc.has("meals") || inc.has("habits")) && (<>
          <Text style={s.h2}>Main patterns in the records</Text>
          {sm.patterns.length ? sm.patterns.map((p) => <Text key={p.label} style={s.li}>• {pattern(p)}{p.confounding_note ? ` ${p.confounding_note}` : ""}</Text>) : <Text>No pattern has enough days to report yet.</Text>}
          <Text style={s.muted}>{d.comparison_line} {d.footer}</Text>
        </>)}

        {inc.has("medicines") && (<>
          <Text style={s.h2}>Medicines and supplements</Text>
          {sm.medicines.length ? sm.medicines.map((m) => (
            <Text key={m.name} style={s.li}>• {m.name}{m.group ? ` (${m.group})` : ""}{m.started_on ? `, started ${m.started_on}` : ""}{m.changes.map((c) => `; ${c.change}${c.date ? ` ${c.date}` : ""}`).join("")}</Text>
          )) : <Text>None recorded.</Text>}
        </>)}

        {inc.has("health") && sm.context.length > 0 && (<><Text style={s.h2}>Context</Text><Text>{sm.context.join(" · ")}</Text></>)}

        {inc.has("symptoms") && (<>
          <Text style={s.h2}>Warning signs logged</Text>
          {sm.warning_signs.length ? sm.warning_signs.map((w) => <Text key={w.label} style={s.li}>• {w.label}: {w.times} {w.times === 1 ? "time" : "times"}</Text>) : <Text>None logged.</Text>}
        </>)}

        {sm.doctor_line && (
          <View style={s.note}>
            <Text>{sm.doctor_line.sentence}</Text>
            {sm.doctor_line.ovarian && <Text>{sm.doctor_line.ovarian}</Text>}
            <Text style={s.muted}>{sm.doctor_line.source}. Bloating was logged on {sm.doctor_line.days} of the last 30 days.</Text>
          </View>
        )}

        <View style={s.box}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Your questions for the appointment</Text>
          <Text>{sm.questions || " \n \n "}</Text>
        </View>
        {footer}
      </Page>

      <Page size="A4" style={s.page}>
        {sec.symptoms && (<>
          <Text style={s.h2}>Symptoms</Text>
          <Row k="Bloating records" v={`${sec.symptoms.episodes} on ${sec.symptoms.days_with_bloating} days`} />
          <Row k="What it feels like" v={sec.symptoms.feel.map((f) => `${f.label} (${f.times})`).join(", ")} />
          <Row k="Other symptoms logged with it" v={sec.symptoms.other.map((f) => `${f.label} (${f.times})`).join(", ")} />
          <Row k="Usually worst (own description)" v={sec.symptoms.usually_worst?.join(", ")} />
          {sec.symptoms.eased && <Row k="Eased after passing stool or gas" v={`Yes ${sec.symptoms.eased.yes}, No ${sec.symptoms.eased.no}`} />}
        </>)}
        {sec.meals && (<>
          <Text style={s.h2}>Meals and food groups</Text>
          <Row k="Meals logged" v={sec.meals.meals} />
          {sec.meals.groups.map((g) => <Row key={g.label} k={g.label} v={`had on ${g.days} days`} />)}
          <Text style={s.muted}>{sec.meals.triggers.examined} groups and habits were compared. {sec.meals.triggers.no_clear_difference.length} showed no clear difference; {sec.meals.triggers.not_enough_data} did not have enough days.</Text>
        </>)}
        {sec.bowel && (<>
          <Text style={s.h2}>Bowel record</Text>
          <Row k="Bowel movements logged" v={sec.bowel.entries} />
          <Row k="With straining" v={sec.bowel.strained} />
          <Row k="Felt incomplete" v={sec.bowel.incomplete} />
          <Row k="Days reported with none" v={sec.bowel.days_without} />
          {sec.bowel.descriptions.map((x) => <Row key={x.label} k={x.label} v={`${x.times} times`} />)}
        </>)}
        {sec.habits && (<>
          <Text style={s.h2}>Habits and exercise</Text>
          {sec.habits.logged.length ? sec.habits.logged.map((h) => <Row key={h.label} k={h.label} v={`${h.days} days`} />) : <Text>None logged.</Text>}
          <Row k="Exercise" v={`${sec.habits.exercise.sessions} sessions, ${sec.habits.exercise.minutes} minutes`} />
        </>)}
        {sec.medicines && sec.medicines.length > 0 && (<>
          <Text style={s.h2}>Medicine before and after</Text>
          {sec.medicines.map((m, i) => (
            <Text key={i} style={s.li}>• {m.medicine}, {m.event.replace(/_/g, " ")} {m.date}: {m.state === "ready" ? `average ${m.before_mean} in the 14 days before (${m.before_days} days), ${m.after_mean} after (${m.after_days} days).` : `not enough scored days yet (${m.before_days} before, ${m.after_days} after).`}</Text>
          ))}
          {d.medicine_line && <Text style={s.muted}>{d.medicine_line}</Text>}
        </>)}
        {sec.health && (<>
          <Text style={s.h2}>Health background (entered by the person)</Text>
          {sec.health.conditions.length ? sec.health.conditions.map((c) => <Row key={c.label} k={c.label} v={[c.status, c.year].filter(Boolean).join(", ")} />) : <Text>None recorded.</Text>}
        </>)}
        {sec.family && (<><Text style={s.h2}>Family history (parent, brother or sister)</Text><Text>{sec.family.join(", ")}</Text></>)}
        {sec.tests && (<>
          <Text style={s.h2}>Tests (as written by the person)</Text>
          {sec.tests.length ? sec.tests.map((t, i) => <Row key={i} k={`${t.label}${t.date ? `, ${t.date}` : ""}`} v={t.result} />) : <Text>None recorded.</Text>}
        </>)}
        {sec.experiments && (<>
          <Text style={s.h2}>Experiments</Text>
          {sec.experiments.length ? sec.experiments.map((e) => <Text key={e.id} style={s.li}>• {e.name}, started {e.started_on}: {e.result ?? "in progress"}</Text>) : <Text>None.</Text>}
        </>)}
        {sec.missing && (<>
          <Text style={s.h2}>What is missing, and limits</Text>
          {sec.missing.map((m, i) => <Text key={i} style={s.li}>• {m}</Text>)}
        </>)}
        <Text style={[s.muted, { marginTop: 12 }]}>{d.intended_use}</Text>
        <Text style={s.muted}>Generated {d.generated_at.slice(0, 10)} · versions: {Object.entries(d.versions).map(([k, v]) => `${k} ${v}`).join(", ")}</Text>
        {footer}
      </Page>
    </Document>
  );
}

export async function renderDoctorPdf(d: DoctorSnapshot, name = ""): Promise<Buffer> {
  return renderToBuffer(<Report d={d} name={name} />);
}
