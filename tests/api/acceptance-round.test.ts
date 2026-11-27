import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { addDays, asUser, at, call, exact, logDay, NY, onboarded, makePro, srvRpc, type Res, type User } from "./helpers";

// First invited acceptance round (owner's decision, 27 Nov 2026): experiments are switched off with the
// existing feature switch (BLOAT_OFF_FEATURES=...,experiments_habit,experiments_swap); every other non-AI
// Pro feature stays on, and experiment records already made are kept.
//
// These checks need a SECOND local server started with the round's settings, at BLOAT_OFF_BASE_URL:
//   BLOAT_AI_PROVIDER=off BLOAT_OFF_FEATURES=learn_library,daily_cards,experiments_habit,experiments_swap \
//     pnpm exec next start -p 3200
//   BLOAT_OFF_BASE_URL=http://127.0.0.1:3200 pnpm test:api tests/api/acceptance-round.test.ts
// Both servers use the same local database, so the same synthetic account is seen by both: the normal
// server (BASE, nothing switched off) is the control. The publishing workflow runs one normal server
// only, so there these checks are skipped; the deployed build is checked by tests/hosted/beta-candidate.spec.ts.

const OFF = process.env.BLOAT_OFF_BASE_URL;
const START = "2026-09-01";
const day = (i: number) => addDays(START, i);
const NOW = at(day(10), "10:00", NY);
const NOT_AVAILABLE = "NOT_AVAILABLE";

/** The same request as helpers.call, sent to the server with experiments switched off. */
async function off<T = any>(u: User, method: string, path: string, body?: unknown, now: string | null = NOW): Promise<Res<T>> {
  const headers: Record<string, string> = { Authorization: `Bearer ${u.token}` };
  if (now) headers["x-bloat-test-now"] = now; // null: the real clock (links expire against it)
  if (method !== "GET") headers["Idempotency-Key"] = randomUUID();
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${OFF}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed as T, headers: res.headers };
}
const on = <T = any>(u: User, method: string, path: string, body?: unknown) => call<T>(u, method, path, body, { now: NOW });
const offers = (t: any) => [...t.worth_watching, ...t.no_clear_difference, ...t.not_enough_data, ...t.daily_food].filter((i: any) => i.experiment);

describe.skipIf(!OFF)("first acceptance round: experiments switched off, other Pro features on, AI off", () => {
  let a: User; // has a running experiment, made before the switch
  let b: User; // has habit records an experiment could be offered for
  let expId: string;

  beforeAll(async () => {
    a = await onboarded();
    await makePro(a);
    for (let i = 0; i < 9; i++) await logDay(a, day(i), { score: i % 2 ? 6 : 2, episode: { start: "13:00", end: "15:00", strength: i % 2 ? 6 : 2 }, meals: [{ time: "12:30", text: "typed soup" }] });
    // An experiment started before experiments were switched off (written as the server would).
    await srvRpc("srv_tx", { p_user: a.id, p_ops: [{ op: "insert", table: "experiments", row: { type: "habit", key: "no_straws", phase: "RUNNING", started_on: day(8) } }] });
    const { data } = await asUser(a).from("experiments").select("id");
    expId = data![0]!.id;
    await srvRpc("srv_tx", { p_user: a.id, p_ops: [{ op: "insert", table: "experiment_days", row: { experiment_id: expId, date: day(8), answer: "yes" } }] });

    b = await onboarded("US", { followed: ["ACT-01"] });
    await makePro(b);
    for (let i = 0; i < 14; i++) await logDay(b, day(i - 4), { score: i % 2 ? 7 : 2, habits: { "ACT-01": i % 2 ? "yes" : "no" } });
  }, 240_000);

  it("the second server really has the round's settings; the normal server has nothing off", async () => {
    const s = await off(a, "GET", "/v1/me/state");
    expect(s.status).toBe(200);
    expect(s.body.unavailable).toEqual(expect.arrayContaining(["experiments_habit", "experiments_swap", "learn_library", "daily_cards", "ai_ingredient_check"]));
    expect((await on(a, "GET", "/v1/me/state")).body.unavailable).toEqual([]);
  });

  it("Today shows no running experiment and no Experiments shortcut (the normal server still does)", async () => {
    const control = (await on(a, "GET", "/v1/me/state")).body.pro;
    expect(control.experiment?.id).toBe(expId);
    expect(control.shortcuts.map((s: any) => s.href)).toContain("/experiments");
    const s = (await off(a, "GET", "/v1/me/state")).body.pro;
    expect(s.experiment).toBeNull();
    expect(s.shortcuts.map((x: any) => x.href)).not.toContain("/experiments");
  });

  it("every experiment route answers 'not available' and writes nothing", async () => {
    const calls: Array<[string, string, unknown?]> = [
      ["GET", "/v1/experiments"],
      ["POST", "/v1/experiments", { key: "eat_more_slowly" }],
      ["POST", `/v1/experiments/${expId}/days`, { answer: "yes", date: day(9) }],
      ["POST", `/v1/experiments/${expId}/end`, { reason: "other" }],
      ["GET", `/v1/experiments/${expId}/result`],
      ["POST", "/v1/experiments/checks", { fx01: "no", fx02: "no", fx03: "no", fx04: "no" }],
      ["POST", `/v1/experiments/${expId}/wellbeing`, { wb01: "no", wb02: "no" }],
      ["POST", `/v1/experiments/${expId}/add-back`],
      ["POST", `/v1/experiments/${expId}/resume`],
    ];
    for (const [m, p, body] of calls) {
      const r = await off(a, m, p, body);
      expect(r.status, `${m} ${p}`).toBe(404);
      expect(r.body.error.code, `${m} ${p}`).toBe(NOT_AVAILABLE);
    }
    expect((await on(a, "GET", "/v1/experiments")).status).toBe(200); // control
  });

  it("the morning review saves, but refuses an experiment answer sent directly", async () => {
    const refused = await off(a, "PUT", `/v1/days/${day(9)}/review`, { worst: 4, whole_day: "yes", food_coverage: "all", experiment_answer: "yes" });
    expect(refused.status).toBe(404);
    expect(refused.body.error.code).toBe(NOT_AVAILABLE);
    const saved = await off(a, "PUT", `/v1/days/${day(9)}/review`, { worst: 4, whole_day: "yes", food_coverage: "all" });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    const { data: days } = await asUser(a).from("experiment_days").select("date,answer");
    expect(days).toEqual([{ date: day(8), answer: "yes" }]); // nothing added
  });

  it("Possible triggers works and offers no experiment (the normal server offers one)", async () => {
    const control = await call(b, "GET", "/v1/insights/triggers", undefined, { now: NOW });
    expect(control.status).toBe(200);
    expect(offers(control.body).length).toBeGreaterThan(0);
    const t = await off(b, "GET", "/v1/insights/triggers");
    expect(t.status).toBe(200);
    expect(t.body.examined).toBeGreaterThan(0);
    expect(offers(t.body).map((i: any) => i.experiment.name)).toEqual([]);
    expect(t.body.experiments_offered).toBe(false);
    for (const i of t.body.daily_food) expect(i.message).not.toContain("experiment");
  });

  it("Your journey keeps the earlier experiment, without pointing to experiments", async () => {
    const control = (await on(a, "GET", "/v1/journey")).body;
    expect(control.phase.next).toBe("A short experiment can test one pattern at a time.");
    const j = await off(a, "GET", "/v1/journey");
    expect(j.status).toBe(200);
    expect(j.body.phase.next).toBeNull();
    expect(j.body.tried.map((e: any) => e.id)).toEqual([expId]); // the record is kept and listed
    expect(j.body.experiments_offered).toBe(false);
  });

  it("the weekly report does not report the experiment as running; History does not link to experiments", async () => {
    const w = await off(a, "POST", "/v1/reports", { kind: "pattern", week_of: day(0) });
    expect([200, 201], JSON.stringify(w.body)).toContain(w.status);
    expect(w.body.snapshot.experiment).toBeNull();
    const h = await off(a, "GET", "/v1/history");
    expect(h.status).toBe(200);
    expect(JSON.stringify(h.body)).toContain('"experiments_offered":false');
  });

  it("every other non-AI Pro feature still works", async () => {
    const ok = async (m: string, p: string, body: unknown, want: number[]) => {
      const r = await off(a, m, p, body);
      expect(want, `${m} ${p}: ${JSON.stringify(r.body).slice(0, 200)}`).toContain(r.status);
      return r;
    };
    await ok("GET", "/v1/insights/triggers", undefined, [200]);
    await ok("GET", "/v1/insights/summary", undefined, [200]);
    await ok("GET", "/v1/history", undefined, [200]);
    await ok("GET", "/v1/journey", undefined, [200]);
    const doc = await ok("POST", "/v1/reports", { kind: "doctor", from: day(0), to: day(9) }, [201]);
    expect(doc.body.snapshot).toBeTruthy();
    await ok("POST", `/v1/reports/${doc.body.id}/shares`, { recipient: "GP", purpose: "appointment", expires_in_days: 7, consent: true }, [201]);
    await ok("POST", "/v1/bowel", { occurred: exact(day(9), "08:00"), stool_type: "watery_no_solid_pieces", strain: "no", complete: "yes" }, [201]);
    await ok("POST", "/v1/exercise", { type: "walking", started: exact(day(9), "18:00"), minutes: 20 }, [201]);
    await ok("GET", "/v1/health/conditions", undefined, [200]);
    await ok("GET", "/v1/medicines", undefined, [200]);
    await ok("GET", "/v1/dishes", undefined, [200]);
    await ok("PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: ["TAG-01"] }, [200]);
    await ok("PUT", "/v1/me/logging-mode", { mode: "full" }, [200]);
    expect((await off(a, "GET", "/v1/billing/entitlement")).body.plan).toBe("pro");
  });

  it("with AI off, Today does not suggest saving dishes, which cannot be saved without the ingredient step", async () => {
    // 9 days of typed meals without an ingredient check: the normal server suggests saving usual dishes.
    expect((await on(a, "GET", "/v1/insights/suggestions")).body.next_best_log?.id).toBe("save_dishes");
    const s = await off(a, "GET", "/v1/insights/suggestions");
    expect(s.status).toBe(200);
    expect(s.body.next_best_log?.id ?? null).not.toBe("save_dishes");
    expect((await off(a, "GET", "/v1/me/state")).body.pro.next_best_log?.id ?? null).not.toBe("save_dishes");
  });

  it("experiment records made before the switch are kept, and are in the export", async () => {
    const { data: rows } = await asUser(a).from("experiments").select("id,key,phase,started_on");
    expect(rows).toEqual([{ id: expId, key: "no_straws", phase: "RUNNING", started_on: day(8) }]);
    const job = await off(a, "POST", "/v1/export", { format: "json" }, null);
    expect([200, 201], JSON.stringify(job.body)).toContain(job.status);
    const file = await (await fetch(`${OFF}${job.body.download_url}`, { headers: { Authorization: `Bearer ${a.token}` } })).json();
    expect(file.tables.experiments.map((e: { id: string }) => e.id)).toEqual([expId]);
    expect(file.tables.experiment_days.map((d: { date: string }) => d.date)).toEqual([day(8)]);
  });
});

