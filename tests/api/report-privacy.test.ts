import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { addDays, at, BASE, call, logDay, NY, proUser, srvRpc, type User } from "./helpers";

// Doctor report privacy: a section the person switches off must not appear in ANY output, page 1
// summary included. Distinctive synthetic details make a leak easy to spot.
const START = "2026-09-01";
const day = (i: number) => addDays(START, i);
const MED = "Zorvatrin-7Q";
const CONDITION = "Reflux"; // label of HC-01 "reflux"
const TEST_RESULT = "Ferritin XQ4471 low";
const QUESTION = "Synthetic question QZ-88 for the appointment";
const HEALTH_CONTEXT = ["Pregnancy", "Periods logged", "Age range"];

async function person(): Promise<{ u: User; now: string }> {
  const answered_at = new Date().toISOString();
  const u = await proUser("US", {
    answers: [
      { question_id: "ON-10", value: ["pregnancy", "cycle_context"], answered_at },
      { question_id: "ON-14", value: "30_39", answered_at },
      { question_id: "ON-08", value: "3_12_months", answered_at },
    ],
    medicines: [{ name: MED, type: "supplement", med_group: "iron" }],
  });
  await call(u, "POST", "/v1/consents", { type: "ai_meal" });
  for (let i = 0; i < 8; i++) {
    await logDay(u, day(i), { score: 4, episode: { start: "13:00", end: "15:00", strength: 5 }, meals: [{ time: "12:30", text: "toast", origin: "home" }] });
  }
  const now = at(day(8), "10:00", NY);
  await call(u, "PUT", "/v1/health/conditions", { conditions: [{ condition: "reflux", status: "diagnosed_by_a_doctor", year: 2019 }] }, { now });
  await call(u, "PUT", "/v1/health/family", { value: ["coeliac_disease"] }, { now });
  await call(u, "POST", "/v1/health/tests", { test: "anaemia_found", date: "2026-08-01", result_text: TEST_RESULT }, { now });
  return { u, now };
}

function pdfText(bytes: Buffer): string {
  const dir = mkdtempSync(path.join(tmpdir(), "bloat-pdf-"));
  const file = path.join(dir, "report.pdf");
  writeFileSync(file, bytes);
  return execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" }).replace(/\s+/g, " ");
}

/** Every output of one stored report: the API read, the PDF and the shared page. */
async function outputs(u: User, id: string, now: string) {
  const get = await call(u, "GET", `/v1/reports/${id}`, undefined, { now });
  expect(get.status).toBe(200);
  const pdf = await fetch(`${BASE}/v1/reports/${id}/pdf`, { headers: { Authorization: `Bearer ${u.token}` } });
  expect(pdf.status).toBe(200);
  const share = await call(u, "POST", `/v1/reports/${id}/shares`, { recipient: "Test GP", purpose: "privacy test", expires_in_days: 1, consent: true });
  expect(share.status).toBe(201);
  const page = await fetch(`${BASE}${share.body.url}`);
  expect(page.status).toBe(200);
  const html = await page.text();
  expect(html).toContain("Bloating diary summary");
  return { get: JSON.stringify(get.body.snapshot), pdf: pdfText(Buffer.from(await pdf.arrayBuffer())), share: html };
}

describe("Doctor report privacy: switched-off sections appear nowhere", () => {
  it("Medicines and Health background off: no medicine name, condition or pregnancy context in the answer, the stored report, the PDF or the shared page; other sections still appear", async () => {
    const { u, now } = await person();
    const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(7), questions: QUESTION, sections: { medicines: false, health: false } }, { now });
    expect(r.status).toBe(201);
    expect(r.body.snapshot.included).toEqual(["symptoms", "meals", "bowel", "habits", "family", "tests", "experiments", "missing"]);
    expect(r.body.snapshot.summary.medicines).toEqual([]);
    expect(r.body.snapshot.summary.context).toEqual([]);
    const out = { answer: JSON.stringify(r.body.snapshot), ...(await outputs(u, r.body.id, now)) };
    for (const [where, text] of Object.entries(out)) {
      expect(text, where).not.toContain(MED);
      expect(text, where).not.toContain(CONDITION);
      for (const c of HEALTH_CONTEXT) expect(text, `${where}: ${c}`).not.toContain(c);
      // Included sections still appear.
      expect(text, where).toContain(TEST_RESULT);
      expect(text, where).toContain("Coeliac disease");
      expect(text, where).toContain("QZ-88");
    }
  }, 180000);

  it("everything on: the same details do appear in every output", async () => {
    const { u, now } = await person();
    const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(7), questions: QUESTION }, { now });
    expect(r.status).toBe(201);
    const out = { answer: JSON.stringify(r.body.snapshot), ...(await outputs(u, r.body.id, now)) };
    for (const [where, text] of Object.entries(out)) {
      expect(text, where).toContain(MED);
      expect(text, where).toContain(CONDITION);
      expect(text, where).toContain("Pregnancy");
      expect(text, where).toContain(TEST_RESULT);
    }
  }, 180000);

  it("Symptoms off: symptom figures, warning signs and the doctor line are left out of page 1", async () => {
    const { u, now } = await person();
    const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(7), sections: { symptoms: false } }, { now });
    const s = r.body.snapshot.summary;
    expect([s.bloating_days_30, s.typical_strength, s.typical_episode_minutes, s.how_long, s.doctor_line]).toEqual([null, null, null, null, null]);
    expect(s.warning_signs).toEqual([]);
    const { pdf, share } = await outputs(u, r.body.id, now);
    for (const text of [pdf, share]) {
      expect(text).not.toContain("Typical strength");
      expect(text).not.toContain("3-12 months");
      expect(text).toContain(MED);
    }
  }, 180000);

  it("a report stored before the fix (summary still holding switched-off details) is filtered on every read, and its share link shows nothing from those sections", async () => {
    const { u, now } = await person();
    const full = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(7), questions: QUESTION }, { now });
    // Rebuild the old, leaky shape: no "included" list, sections switched off, summary untouched.
    const old = structuredClone(full.body.snapshot);
    delete old.included;
    old.sections.medicines = null;
    old.sections.health = null;
    expect(JSON.stringify(old.summary)).toContain(MED);
    const made = await srvRpc<Array<{ row: { id: string } }>>("srv_tx", { p_user: u.id, p_ops: [{ op: "insert", table: "reports", row: { kind: "doctor", range_from: day(0), range_to: day(7), snapshot: old, versions: full.body.snapshot.versions } }] });
    const out = await outputs(u, made[0]!.row.id, now);
    for (const [where, text] of Object.entries(out)) {
      expect(text, where).not.toContain(MED);
      expect(text, where).not.toContain("Pregnancy");
      expect(text, where).toContain(TEST_RESULT);
    }
  }, 180000);
});
