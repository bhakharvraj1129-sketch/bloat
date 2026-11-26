import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { addDays, asUser, at, BASE, call, exact, logDay, makePro, NY, onboarded, proUser, srvRpc, webhook, type User } from "./helpers";

const START = "2026-09-01";
const day = (i: number) => addDays(START, i);

async function consent(u: User) { await call(u, "POST", "/v1/consents", { type: "ai_meal" }); }

/** 14 finished days: fizzy drinks on even days (score 6), a home-made meal without them on odd days (score 3). */
async function fizzyFortnight(u: User, days = 14) {
  await consent(u);
  for (let i = 0; i < days; i++) {
    const withIt = i % 2 === 0;
    await logDay(u, day(i), {
      score: withIt ? 6 : 3,
      meals: [withIt
        ? { time: "12:30", text: "cola", origin: "home", mode: "marked", ingredients: [{ name: "cola", answer: "had", kind: "listed" }] }
        : { time: "12:30", text: "bread with butter", origin: "home", mode: "marked", ingredients: [{ name: "bread", answer: "had", kind: "listed" }, { name: "butter", answer: "had", kind: "listed" }] }],
    });
  }
  return at(day(days), "10:00", NY);
}

const PRO_GETS = ["/v1/insights/summary", "/v1/insights/coverage", "/v1/insights/triggers", "/v1/insights/rhythm", "/v1/insights/suggestions", "/v1/journey", "/v1/experiments", "/v1/cards/today", "/v1/library", "/v1/health/conditions", "/v1/dishes", "/v1/reports", "/v1/meals/recalled-check"];

describe("Slice B: plan entitlement and Pro locking", () => {
  it("Q57 and Q97: a Free account gets 403 PLAN_REQUIRED on every Pro endpoint, with no Pro values in the answer and nothing saved", async () => {
    const u = await onboarded();
    await fizzyFortnight(u, 0);
    for (const path of PRO_GETS) {
      const r = await call(u, "GET", path);
      expect(r.status, path).toBe(403);
      expect(r.body.error.code, path).toBe("PLAN_REQUIRED");
      expect(Object.keys(r.body).sort()).toEqual(["error", "request_id"]);
    }
    const posts: Array<[string, string, unknown]> = [
      ["POST", "/v1/exercise", { type: "walking", started: { mode: "now" }, minutes: 20 }],
      ["POST", "/v1/bowel", { occurred: { mode: "now" } }],
      ["PUT", "/v1/health/conditions", { conditions: [{ condition: "ibs" }] }],
      ["PUT", "/v1/health/family", { value: ["none"] }],
      ["POST", "/v1/experiments", { key: "no_straws" }],
      ["POST", "/v1/experiments/checks", { fx01: "no", fx02: "no", fx03: "no", fx04: "no" }],
      ["POST", "/v1/reports", { kind: "pattern" }],
      ["POST", "/v1/reports", { kind: "doctor", from: "2026-09-01", to: "2026-09-10" }],
      ["POST", "/v1/dishes", { name: "x", ingredients: [] }],
      ["PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: ["TAG-01"] }],
      ["POST", "/v1/cards/walk/feedback", { tried: "tried" }],
      ["POST", "/v1/billing/pause", { months: 1 }],
      ["PATCH", "/v1/me/profile", { keep_meal_photos: true }],
    ];
    for (const [m, path, body] of posts) {
      const r = await call(u, m, path, body);
      expect([403, 409], `${m} ${path}`).toContain(r.status);
    }
    const db = asUser(u);
    for (const t of ["exercise_records", "bowel_movements", "health_conditions", "experiments", "experiment_checks", "reports", "saved_dishes", "food_suggestions"]) {
      const { data } = await db.from(t).select("*");
      expect(data, t).toEqual([]);
    }
    const state = await call(u, "GET", "/v1/me/state");
    expect(state.body.pro).toBeNull();
  });

  it("an unreadable or odd entitlement fails closed to Free; a paused or failed plan is Free", async () => {
    const u = await proUser();
    expect((await call(u, "GET", "/v1/library")).status).toBe(200);
    for (const type of ["payment_failed", "refunded", "chargeback"]) {
      const v = await proUser();
      await webhook({ provider: "mock", event_id: randomUUID(), user_id: v.id, type, occurred_at: new Date(Date.now() + 1000).toISOString() });
      expect((await call(v, "GET", "/v1/library")).status, type).toBe(403);
    }
  });

  it("Q105 stool type 'watery' logged three times: counted, never labelled, no alert", async () => {
    const u = await proUser();
    const now = at(day(0), "20:00", NY);
    for (const t of ["08:00", "12:00", "18:00"]) {
      const r = await call(u, "POST", "/v1/bowel", { occurred: exact(day(0), t), stool_type: "watery_no_solid_pieces", strain: "no", complete: "yes" }, { now });
      expect(r.status).toBe(201);
      expect(JSON.stringify(r.body).toLowerCase()).not.toMatch(/diarrh|abnormal|alert|warning|see a doctor/);
    }
    const d = await call(u, "GET", `/v1/days/${day(0)}`, undefined, { now });
    expect(d.body.bowel).toHaveLength(3);
    expect(JSON.stringify(d.body).toLowerCase()).not.toMatch(/diarrh|abnormal|alert/);
  });

  it("exercise: minutes from the last meal are calculated by the server", async () => {
    const u = await proUser();
    const now = at(day(0), "20:00", NY);
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "lunch", eaten: exact(day(0), "12:00") }, { now });
    const r = await call(u, "POST", "/v1/exercise", { type: "walking", started: exact(day(0), "12:45"), minutes: 20, intensity: "light", meal_relation: "after_a_meal" }, { now });
    expect(r.status).toBe(201);
    expect(r.body.exercise.minutes_from_last_meal).toBe(45);
    expect(r.body.exercise.minutes_to_next_meal).toBeNull();
  });

  it("Q162 the NHS sentence for a common symptom shows the first time only that day; Q171 'clothes felt tighter' is saved as a feel", async () => {
    const u = await proUser();
    const now = at(day(0), "10:00", NY);
    const a = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" }, symptoms: ["abdominal_pain", "gas"], feel: ["clothes_felt_tighter"] }, { now });
    expect(a.status).toBe(201);
    expect(a.body.advice).toHaveLength(1);
    expect(a.body.advice[0].sentence).toBe("Contact a doctor today or go to urgent care if you have bloating and: stomach pain.");
    await call(u, "POST", `/v1/episodes/${a.body.episode.id}/end`, { ended: { mode: "now" } }, { now: at(day(0), "11:00", NY) });
    const b = await call(u, "POST", "/v1/episodes", { strength: 4, started: { mode: "now" }, symptoms: ["abdominal_pain"] }, { now: at(day(0), "15:00", NY) });
    expect(b.body.advice).toEqual([]); // not shown again the same day
    const { data } = await asUser(u).from("episodes").select("feel").eq("id", a.body.episode.id).single();
    expect(data!.feel).toEqual(["clothes_felt_tighter"]);
    // Bloat never asks for waist or weight: no such question exists in the registry.
    const reg = JSON.stringify((await import("../../docs/data/Bloat_Questions_v4.3.json")).default.questions.map((q: any) => q.prompt)).toLowerCase();
    expect(reg).not.toMatch(/waist|how much do you weigh|enter your weight|what is your weight/);
  });

  it("Q87 constipation on 3 days in 14: saved per episode; Personal Focus offers bowel tracking only, with no alert or condition wording", async () => {
    const u = await proUser();
    for (let i = 0; i < 3; i++) {
      const now = at(day(i), "12:00", NY);
      const a = await call(u, "POST", "/v1/episodes", { strength: 4, started: exact(day(i), "09:00"), symptoms: ["constipation"] }, { now });
      await call(u, "POST", `/v1/episodes/${a.body.episode.id}/end`, { ended: exact(day(i), "10:00") }, { now });
    }
    const s = await call(u, "GET", "/v1/insights/suggestions", undefined, { now: at(day(4), "09:00", NY) });
    const p2 = s.body.focus.find((c: any) => c.rule === "P2");
    expect(p2.title).toBe("Track bowel movements");
    expect(p2.why).toBe("You logged constipation, diarrhoea or no bowel movement on 3 of the last 14 days.");
    expect(JSON.stringify(s.body).toLowerCase()).not.toMatch(/ibs|alert|you may have|condition|see a doctor/);
    // Q51: dismissing hides it for 30 days.
    await call(u, "POST", "/v1/insights/suggestions/dismiss", { id: "P2", kind: "focus" }, { now: at(day(4), "09:00", NY) });
    const after = await call(u, "GET", "/v1/insights/suggestions", undefined, { now: at(day(5), "09:00", NY) });
    expect(after.body.focus.find((c: any) => c.rule === "P2")).toBeUndefined();
  });
});

describe("Slice D: insights, reports and the doctor PDF, end to end", () => {
  it("possible triggers from real logged days: 7 with and 7 without, the fixed wording, and the group count (Q124, Q175)", async () => {
    const u = await proUser();
    const now = await fizzyFortnight(u);
    const t = await call(u, "GET", "/v1/insights/triggers", undefined, { now });
    expect(t.status).toBe(200);
    const fizzy = t.body.worth_watching.find((c: any) => c.target.id === "TAG-09");
    expect(fizzy).toMatchObject({ with_days: 7, without_days: 7, mean_with: 6, mean_without: 3, difference: 3, first_half: 3, second_half: 3, state: "DESCRIPTIVE_COMPARISON" });
    expect(fizzy.fixed_line).toBe("This is a difference in your records, not a medical measure.");
    expect(t.body.header).toBe("13 groups examined; differences can appear by chance.");
    expect(t.body.footer).toBe("These are patterns in your own records, not proof of a cause.");
    expect(t.body.followed_note).toBe("You can compare the 3 habits you follow. Follow a habit to start comparing it.");
    // Wheat (in the toast) is the mirror image and is listed alphabetically, not by size.
    const labels = t.body.worth_watching.map((c: any) => c.target.label);
    expect(labels).toEqual([...labels].sort((a: string, b: string) => a.localeCompare(b)));
    // The fizzy drinks habit experiment is offered on the result.
    expect(fizzy.experiment).toEqual({ key: "fewer_fizzy_drinks", name: "Fewer fizzy drinks" });
    // Q98/Q96: no condition names anywhere in the answer.
    expect(JSON.stringify(t.body).toLowerCase()).not.toMatch(/ibs|intoleran|coeliac|you may have|trigger confirmed|safe food|bad food/);
  }, 120000);

  it("Q202, Q203, Q204, Q205, Q206: Your journey", async () => {
    const u = await proUser("US", { answers: [{ question_id: "ON-16", value: ["getting_ready_for_a_doctor_visit"], answered_at: new Date().toISOString() }] });
    const now = await fizzyFortnight(u);
    const j = await call(u, "GET", "/v1/journey", undefined, { now });
    expect(j.status).toBe(200);
    for (const k of ["since", "your_usual", "records", "tried", "phase", "missing", "monthly", "doctor_report"]) expect(j.body, k).toHaveProperty(k);
    expect(j.body.since).toMatchObject({ days_tracked: 14, confirmed_days: 14, completeness: 100 });
    expect(j.body.your_usual.available).toBe(true);
    expect(j.body.records.worth_watching.find((p: any) => p.label === "Fizzy drinks")).toMatchObject({ with_days: 7, without_days: 7 });
    // Q204: the doctor-report summary comes first, and Today's first shortcut is the doctor report.
    expect(j.body.section_order[0]).toBe("doctor");
    const state = await call(u, "GET", "/v1/me/state", undefined, { now });
    expect(state.body.pro.shortcuts[0]).toEqual({ href: "/doctor", label: "Doctor report" });
    // Q205: the report opens with the journey's date range.
    expect(j.body.doctor_report).toEqual({ from: j.body.from, to: j.body.to });
    // Q206: changing the goal changes the order at once, and no result changes.
    await call(u, "PATCH", "/v1/me/profile", { goals: ["how_my_bloating_changes_over_time"] }, { now });
    const j2 = await call(u, "GET", "/v1/journey", undefined, { now });
    expect(j2.body.section_order.slice(0, 2)).toEqual(["since", "usual"]);
    expect(j2.body.records).toEqual(j.body.records);
    expect(j2.body.since).toEqual(j.body.since);
    // Q203: a Free account gets 403 and no preview.
    const free = await onboarded();
    const f = await call(free, "GET", "/v1/journey", undefined, { now });
    expect(f.status).toBe(403);
    expect(JSON.stringify(f.body)).not.toMatch(/worth_watching|since|usual/);
  }, 120000);

  it("Q176 phase label: Understand after the first possible trigger, Maintain in Keep an eye on it mode, Discover at the start", async () => {
    const fresh = await proUser();
    const s0 = await call(fresh, "GET", "/v1/me/state");
    expect(s0.body.pro.phase.label).toBe("Discover");
    const u = await proUser();
    const now = await fizzyFortnight(u);
    expect((await call(u, "GET", "/v1/me/state", undefined, { now })).body.pro.phase.label).toBe("Understand");
    await call(u, "PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: ["TAG-01", "TAG-09"] }, { now });
    expect((await call(u, "GET", "/v1/me/state", undefined, { now })).body.pro.phase.label).toBe("Maintain");
  }, 120000);

  it("Q141 Keep an eye on it: an explicit No makes a 'without' day with no meals; one tap returns to full logging", async () => {
    const u = await proUser();
    const mode = await call(u, "PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: ["TAG-01"] });
    expect(mode.status).toBe(200);
    for (let i = 0; i < 14; i++) {
      const r = await call(u, "PUT", `/v1/days/${day(i)}/review`, { worst: i < 7 ? 6 : 2, whole_day: "yes", watched: { "TAG-01": i < 7 ? "yes" : "no" } }, { now: at(day(i + 1), "08:00", NY) });
      expect(r.status).toBe(200);
    }
    const now = at(day(14), "10:00", NY);
    const t = await call(u, "GET", "/v1/insights/triggers", undefined, { now });
    const dairy = [...t.body.worth_watching, ...t.body.no_clear_difference].find((c: any) => c.target.id === "TAG-01");
    expect(dairy).toMatchObject({ with_days: 7, without_days: 7, mean_with: 6, mean_without: 2 });
    const bad = await call(u, "PUT", `/v1/days/${day(13)}/review`, { worst: 2, whole_day: "yes", watched: { "TAG-09": "no" } }, { now });
    expect(bad.status).toBe(422); // only groups being watched
    const tooMany = await call(u, "PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: ["TAG-01", "TAG-02", "TAG-03", "TAG-04", "TAG-05", "TAG-06"] });
    expect(tooMany.status).toBe(422);
    expect((await call(u, "PUT", "/v1/me/logging-mode", { mode: "full" })).body.logging_mode).toBe("full");
    // charts, the report and the doctor report still work
    expect((await call(u, "GET", "/v1/insights/summary", undefined, { now })).status).toBe(200);
    expect((await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13) }, { now })).status).toBe(201);
  }, 120000);

  it("Q45, Q207: the 7-day average needs 4 usable days and shows its count; baseline markers appear after 14 confirmed days", async () => {
    const u = await proUser();
    for (let i = 0; i < 3; i++) await logDay(u, day(i), { score: 4 });
    let h = await call(u, "GET", `/v1/history?from=${day(0)}&to=${day(3)}`, undefined, { now: at(day(3), "10:00", NY) });
    expect(h.body.pro.seven_day_average).toEqual({ available: false, days: 3, needed: 1 });
    expect(h.body.days.every((d: any) => d.baseline === null)).toBe(true);
    await logDay(u, day(3), { score: 6, reviewAt: at(day(6), "08:00", NY) }); // late
    h = await call(u, "GET", `/v1/history?from=${day(0)}&to=${day(6)}`, undefined, { now: at(day(6), "10:00", NY) });
    expect(h.body.pro.seven_day_average).toMatchObject({ available: true, value: 4.5, days: 4, late: 1, label: "Average of 4 days (1 late)" });
    for (let i = 4; i < 16; i++) await logDay(u, day(i), { score: i === 15 ? 8 : 4 });
    h = await call(u, "GET", `/v1/history?from=${day(0)}&to=${day(16)}`, undefined, { now: at(day(16), "10:00", NY) });
    const by = Object.fromEntries(h.body.days.map((d: any) => [d.date, d.baseline]));
    expect(by[day(15)]).toBe("above");
    expect(by[day(10)]).toBe("around");
    expect(JSON.stringify(h.body).toLowerCase()).not.toMatch(/better|worse/);
  }, 120000);

  it("Q179, Q180, Q181: the doctor report has the page 1 summary and fixed sections, and renders as a PDF", async () => {
    const u = await proUser("US", { answers: [{ question_id: "ON-08", value: "3_12_months", answered_at: new Date().toISOString() }], medicines: [{ name: "Iron tablets", type: "supplement", med_group: "iron" }] });
    const now = await fizzyFortnight(u);
    await call(u, "PUT", "/v1/health/conditions", { conditions: [{ condition: "reflux", status: "diagnosed_by_a_doctor", year: 2020 }] }, { now });
    await call(u, "PUT", "/v1/health/family", { value: ["coeliac_disease"] }, { now });
    await call(u, "POST", "/v1/health/tests", { test: "anaemia_found", date: "2026-08-01", result_text: "Mild, iron started" }, { now });
    const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13), questions: "Could this be linked to my iron tablets?" }, { now });
    expect(r.status).toBe(201);
    const s = r.body.snapshot;
    expect(s.summary).toMatchObject({ tracking_days: 14, confirmed_days: 14, completeness: 100, how_long: "3-12 months", questions: "Could this be linked to my iron tablets?" });
    expect(s.summary.patterns.find((p: any) => p.label === "Fizzy drinks")).toMatchObject({ with_days: 7, without_days: 7 });
    expect(s.summary.medicines[0]).toMatchObject({ name: "Iron tablets", group: "Iron" });
    for (const k of ["symptoms", "meals", "bowel", "habits", "medicines", "health", "family", "tests", "experiments", "missing"]) expect(s.sections, k).toHaveProperty(k);
    expect(s.sections.family).toEqual(["Coeliac disease"]);
    expect(s.sections.tests[0]).toMatchObject({ result: "Mild, iron started" });
    expect(s.sections.health.conditions[0]).toMatchObject({ label: "Reflux", year: 2020 });
    // The screen sends only the sections that are switched off (often none). Both shapes must be accepted.
    expect((await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13), sections: {} }, { now })).status).toBe(201);
    const fewer = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13), sections: { family: false } }, { now });
    expect(fewer.status).toBe(201);
    expect(fewer.body.snapshot.sections.family).toBeNull();
    expect(fewer.body.snapshot.sections.symptoms).not.toBeNull();
    expect(s.notice).toContain("self-reported");
    expect(s.versions).toMatchObject({ metric: "daily_worst_v1", insights: "insights_v1" });
    // Q180: family history appears nowhere else.
    for (const path of ["/v1/journey", "/v1/insights/triggers", "/v1/me/state", "/v1/cards/today"]) {
      expect(JSON.stringify((await call(u, "GET", path, undefined, { now })).body).toLowerCase(), path).not.toContain("coeliac");
    }
    const pdf = await fetch(`${BASE}${r.body.pdf_url}`, { headers: { Authorization: `Bearer ${u.token}` } });
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(3000);
    // another user cannot fetch it, with or without a session
    const other = await proUser();
    expect((await fetch(`${BASE}${r.body.pdf_url}`, { headers: { Authorization: `Bearer ${other.token}` } })).status).toBe(404);
    expect((await fetch(`${BASE}${r.body.pdf_url}`)).status).toBe(401);
    expect((await call(other, "GET", `/v1/reports/${r.body.id}`)).status).toBe(404);
  }, 120000);

  it("Q34, Q54, Q89: a share link needs consent, expires, can be revoked, and is revoked when a meal in the report is deleted", async () => {
    const u = await proUser();
    const now = await fizzyFortnight(u);
    const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13) }, { now });
    const noConsent = await call(u, "POST", `/v1/reports/${r.body.id}/shares`, { recipient: "GP", purpose: "appointment", expires_in_days: 7 }, { now });
    expect(noConsent.status).toBe(422);
    const share = await call(u, "POST", `/v1/reports/${r.body.id}/shares`, { recipient: "GP", purpose: "appointment", expires_in_days: 7, consent: true });
    expect(share.status).toBe(201);
    expect(share.body.note).toBe("Downloaded copies can't be recalled.");
    const open = async (url: string) => { const res = await fetch(`${BASE}${url}`); return { status: res.status, text: await res.text() }; };
    let page = await open(share.body.url);
    expect(page.text).toContain("Bloating diary summary");
    expect(page.text).toContain("Fizzy drinks");
    // the stored value is a hash, never the link itself
    const { data: rows } = await asUser(u).from("report_shares").select("token_hash");
    expect(share.body.url).not.toContain(rows![0]!.token_hash);
    // revoke
    const rev = await call(u, "DELETE", `/v1/reports/${r.body.id}/shares?share=${share.body.share_id}`);
    expect(rev.status).toBe(200);
    page = await open(share.body.url);
    expect(page.text).toContain("This link no longer works");
    expect(page.text).not.toContain("Fizzy drinks");
    // expiry
    const s2 = await call(u, "POST", `/v1/reports/${r.body.id}/shares`, { recipient: "GP", purpose: "appointment", expires_in_days: 1, consent: true });
    await srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "update", table: "report_shares", match: { id: s2.body.share_id }, set: { expires_at: "2020-01-01T00:00:00Z" } }] });
    expect((await open(s2.body.url)).text).toContain("This link no longer works");
    expect((await open("/share/not-a-real-token")).text).toContain("This link no longer works");
    // deleting a meal the report used: 204, report flagged for regeneration, live share revoked
    const s3 = await call(u, "POST", `/v1/reports/${r.body.id}/shares`, { recipient: "GP", purpose: "appointment", expires_in_days: 7, consent: true });
    const { data: meals } = await asUser(u).from("meals").select("id").limit(1);
    const del = await call(u, "DELETE", `/v1/meals/${meals![0]!.id}`, undefined, { now });
    expect(del.status).toBe(204);
    const { data: rep } = await asUser(u).from("reports").select("stale").eq("id", r.body.id).single();
    expect(rep!.stale).toBe(true);
    expect((await open(s3.body.url)).text).toContain("This link no longer works");
    const again = await call(u, "POST", `/v1/reports/${r.body.id}/shares`, { recipient: "GP", purpose: "x", expires_in_days: 7, consent: true });
    expect(again.status).toBe(409);
    // the meal is gone from calculations
    const t = await call(u, "GET", "/v1/insights/triggers", undefined, { now });
    const fizzy = [...t.body.worth_watching, ...t.body.no_clear_difference, ...t.body.not_enough_data].find((c: any) => c.target.id === "TAG-09");
    expect(fizzy.with_days + fizzy.without_days).toBe(13);
  }, 120000);

  it("weekly Pattern Report: a stored snapshot of a finished week that never changes afterwards; a later correction flags it and the next one is new (Q40)", async () => {
    const u = await proUser();
    const now = await fizzyFortnight(u); // 1–14 Sep 2026; 7 Sep is a Monday
    const r = await call(u, "POST", "/v1/reports", { kind: "pattern", week_of: "2026-09-07" }, { now });
    expect(r.status).toBe(201);
    expect(r.body.snapshot).toMatchObject({ from: "2026-09-07", to: "2026-09-13", counts: { confirmed: 7, late: 0, missing: 0 } });
    expect(r.body.snapshot.seven_day_average.label).toBe("Average of 7 days (0 late)");
    expect(r.body.snapshot.footer).toBe("These are patterns in your own records, not proof of a cause. Bloat doesn't diagnose.");
    // Asked for again with nothing changed: the same stored snapshot, unchanged.
    const same = await call(u, "POST", "/v1/reports", { kind: "pattern", week_of: "2026-09-07" }, { now });
    expect(same.body.reused).toBe(true);
    expect(same.body.snapshot).toEqual(r.body.snapshot);
    // A review in that week is corrected afterwards (plan B05, R1 of 26 Nov): the stored snapshot is
    // kept exactly as it was (no silent rewrite) but flagged, and the next request makes a new one.
    await call(u, "PUT", `/v1/days/2026-09-08/review`, { worst: 9, whole_day: "yes" }, { now });
    const { data: old } = await asUser(u).from("reports").select("snapshot,stale").eq("id", r.body.id).single();
    expect(old!.stale).toBe(true);
    expect(old!.snapshot).toEqual(r.body.snapshot);
    const again = await call(u, "POST", "/v1/reports", { kind: "pattern", week_of: "2026-09-07" }, { now });
    expect(again.status).toBe(201);
    expect(again.body.reused).toBe(false);
    expect(again.body.id).not.toBe(r.body.id);
    const unfinished = await call(u, "POST", "/v1/reports", { kind: "pattern", week_of: day(14) }, { now });
    expect(unfinished.status).toBe(422);
  }, 120000);

  it("Q53 after a downgrade, past reports stay readable and new Pro generation stops; Q177 a quarterly snapshot is created after 90 days of Pro", async () => {
    const u = await proUser();
    const now = await fizzyFortnight(u);
    const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13) }, { now });
    await call(u, "GET", "/v1/journey", undefined, { now: new Date(Date.now() + 91 * 86400000).toISOString() });
    const { data: q } = await asUser(u).from("reports").select("kind").eq("kind", "quarterly");
    expect(q).toHaveLength(1);
    await webhook({ provider: "mock", event_id: randomUUID(), user_id: u.id, type: "expired", occurred_at: new Date(Date.now() + 5000).toISOString() });
    expect((await call(u, "GET", `/v1/reports/${r.body.id}`)).status).toBe(200);
    expect((await call(u, "POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(13) }, { now })).status).toBe(403);
    expect((await call(u, "GET", "/v1/journey", undefined, { now })).status).toBe(403);
    // diary data is untouched and free logging works
    const { data: meals } = await asUser(u).from("meals").select("id");
    expect(meals!.length).toBe(14);
    expect((await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "free again", eaten: { mode: "now" } })).status).toBe(201);
  }, 120000);

  it("Q140 after upgrading, the recalled check is offered once and answers are saved as recalled", async () => {
    const u = await onboarded();
    const base = new Date();
    const d = (n: number) => new Date(base.getTime() - n * 86400000).toISOString().slice(0, 10);
    for (let i = 1; i <= 3; i++) await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "pizza", eaten: exact(d(i), "12:00") });
    await makePro(u);
    await consent(u);
    const list = await call(u, "GET", "/v1/meals/recalled-check");
    expect(list.body.offered).toBe(false);
    expect(list.body.meals).toHaveLength(3);
    const meal = list.body.meals[0];
    const s = await call(u, "POST", "/v1/food-suggestions", { save_key: meal.save_key, dish_text: meal.dish_text });
    const put = await call(u, "PUT", `/v1/meals/${meal.id}/ingredients`, { mode: "marked", recalled: true, ingredients: s.body.items.map((i: any) => ({ name: i.name, answer: "had", kind: "listed" })) });
    expect(put.status).toBe(200);
    expect(put.body.ai_check_status).toBe("recalled");
    expect(put.body.ingredients.every((i: any) => i.source === "recalled")).toBe(true);
    expect((await call(u, "POST", "/v1/meals/recalled-check", { answer: "yes_go_through_them" })).status).toBe(200);
    expect((await call(u, "POST", "/v1/meals/recalled-check", { answer: "not_now" })).status).toBe(409); // offered once
    expect((await call(u, "GET", "/v1/meals/recalled-check")).body.offered).toBe(true);
  });

  it("Q209 Add meal shortcuts: saved dishes and the 5 most frequent dishes of the last 30 days come first", async () => {
    const u = await proUser();
    await consent(u);
    const now = at(day(10), "20:00", NY);
    const counts: Record<string, number> = { dal: 4, toast: 3, pizza: 2, salad: 2, soup: 1, cake: 1 };
    let n = 0;
    for (const [dish, c] of Object.entries(counts)) for (let i = 0; i < c; i++) await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: dish, eaten: exact(day(n++ % 10), "12:00") }, { now });
    await call(u, "POST", "/v1/dishes", { name: "Burrito", place: "Chipotle", ingredients: [{ name: "beans", answer: "had" }] }, { now });
    const s = await call(u, "GET", "/v1/me/state", undefined, { now });
    expect(s.body.pro.frequent_dishes.slice(0, 4)).toEqual(["dal", "toast", "pizza", "salad"]);
    expect(s.body.pro.frequent_dishes).toHaveLength(5);
    expect(s.body.pro.saved_dishes[0]).toMatchObject({ name: "Burrito", place: "Chipotle" });
  });

  it("Q208 after 14 days of use, habits and symptoms unused for 30 days move under More; warning chips are never part of that list", async () => {
    const u = await onboarded();
    const early = await call(u, "GET", "/v1/me/state");
    expect(early.body.adaptive).toEqual({ more_activities: [], more_symptoms: [] });
    await call(u, "PUT", `/v1/days/${day(0)}/activities`, { taps: [{ activity_id: "ACT-03" }] }, { now: at(day(0), "12:00", NY) });
    const later = await call(u, "GET", "/v1/me/state", undefined, { now: at(day(20), "12:00", NY) });
    expect(later.body.adaptive.more_activities).toContain("ACT-21"); // Ate out
    expect(later.body.adaptive.more_activities).toContain("ACT-14"); // Constipated
    expect(later.body.adaptive.more_activities).not.toContain("ACT-03");
    expect(later.body.adaptive.more_symptoms).toContain("constipation");
    const warning = ["vomiting", "blood_in_poo", "severe_difficulty_breathing", "weight_loss_without_trying"];
    for (const w of warning) expect(JSON.stringify(later.body.adaptive)).not.toContain(w);
  });
});
