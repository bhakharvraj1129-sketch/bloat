import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { at, call, exact, NY, onboarded, onboardingBody, newUser, asUser, anon, logDay } from "./helpers";

const D = "2026-11-10"; // a Tuesday in winter time for America/New_York
const now = at(D, "15:00", NY);

describe("Slice A: episodes (plan A08)", () => {
  it("Q01 start, reply lost, retry with the same key: exactly one episode and the original result", async () => {
    const u = await onboarded();
    const key = randomUUID();
    const body = { strength: 6, started: { mode: "now" } };
    const a = await call(u, "POST", "/v1/episodes", body, { key, now });
    const b = await call(u, "POST", "/v1/episodes", body, { key, now });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(b.body).toEqual(a.body);
    const { data } = await asUser(u).from("episodes").select("id");
    expect(data).toHaveLength(1);
    const reuse = await call(u, "POST", "/v1/episodes", { strength: 2, started: { mode: "now" } }, { key, now });
    expect(reuse.status).toBe(409);
    expect(reuse.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
  });

  it("Q02 second start while one is open: 409 offers the existing episode, no second open record", async () => {
    const u = await onboarded();
    const a = await call(u, "POST", "/v1/episodes", { strength: 4, started: { mode: "now" } }, { now });
    const b = await call(u, "POST", "/v1/episodes", { strength: 7, started: { mode: "now" } }, { now });
    expect(b.status).toBe(409);
    expect(b.body.error.code).toBe("EPISODE_OPEN");
    expect(b.body.error.details.episode_id).toBe(a.body.episode.id);
    const { data } = await asUser(u).from("episodes").select("id").eq("state", "OPEN");
    expect(data).toHaveLength(1);
  });

  it("Q03 end before start or in the future is rejected and the record is unchanged", async () => {
    const u = await onboarded();
    const a = await call(u, "POST", "/v1/episodes", { strength: 5, started: exact(D, "14:00") }, { now });
    const id = a.body.episode.id;
    const before = await call(u, "POST", `/v1/episodes/${id}/end`, { ended: exact(D, "13:00") }, { now });
    expect(before.status).toBe(422);
    expect(before.body.error.code).toBe("END_BEFORE_START");
    const future = await call(u, "POST", `/v1/episodes/${id}/end`, { ended: exact(D, "18:00") }, { now });
    expect(future.status).toBe(422);
    expect(future.body.error.code).toBe("FUTURE_TIME");
    const { data } = await asUser(u).from("episodes").select("state,ended_at,revision").eq("id", id).single();
    expect(data).toEqual({ state: "OPEN", ended_at: null, revision: 1 });
  });

  it("Q86 strength 0, 11 or 3.5 is a validation error; nothing saved", async () => {
    const u = await onboarded();
    for (const strength of [0, 11, 3.5]) {
      const r = await call(u, "POST", "/v1/episodes", { strength, started: { mode: "now" } }, { now });
      expect(r.status).toBe(422);
    }
    const { data } = await asUser(u).from("episodes").select("id");
    expect(data).toHaveLength(0);
  });

  it("update appends a reading and never overwrites; end stores the reported time", async () => {
    const u = await onboarded();
    const a = await call(u, "POST", "/v1/episodes", { strength: 3, started: exact(D, "13:00") }, { now });
    const id = a.body.episode.id;
    await call(u, "POST", `/v1/episodes/${id}/samples`, { strength: 7 }, { now });
    const end = await call(u, "POST", `/v1/episodes/${id}/end`, { ended: { mode: "now" } }, { now: at(D, "15:30", NY) });
    expect(end.status).toBe(200);
    expect(end.body.episode.state).toBe("CLOSED_REPORTED_TIME");
    expect(end.body.summary).toEqual({ lasted: "2 h 30 min", strongest: 7 });
    const { data } = await asUser(u).from("strength_samples").select("strength").order("observed_at");
    expect(data!.map((s) => s.strength)).toEqual([3, 7]);
  });

  it("Q07 'I don't know' gives END_UNKNOWN: no made-up end and no duration", async () => {
    const u = await onboarded();
    const a = await call(u, "POST", "/v1/episodes", { strength: 5, started: exact(D, "09:00") }, { now });
    const end = await call(u, "POST", `/v1/episodes/${a.body.episode.id}/end`, { ended: { mode: "unknown" } }, { now });
    expect(end.body.episode.state).toBe("END_UNKNOWN");
    expect(end.body.episode.ended_at).toBeNull();
    expect(end.body.summary.lasted).toBeNull();
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now });
    expect(day.body.duration_partial).toBe(true);
    expect(day.body.duration_ms).toBe(0);
  });

  it("Q08 an episode open for 25 hours is never closed automatically; the app asks", async () => {
    const u = await onboarded();
    await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now });
    const later = at("2026-11-11", "16:00", NY);
    const state = await call(u, "GET", "/v1/me/state", undefined, { now: later });
    expect(state.body.open_episode.ask_still_happening).toBe(true);
    const id = state.body.open_episode.id;
    const notSure = await call(u, "POST", `/v1/episodes/${id}/still-happening`, { answer: "not_sure" }, { now: later });
    expect(notSure.body).toMatchObject({ state: "OPEN", next: "stay_open" });
    const no = await call(u, "POST", `/v1/episodes/${id}/still-happening`, { answer: "no" }, { now: later });
    expect(no.body.next).toBe("ask_end_time");
    const { data } = await asUser(u).from("episodes").select("state,ended_at").eq("id", id).single();
    expect(data).toEqual({ state: "OPEN", ended_at: null });
  });

  it("Q04 a 23:00–02:00 episode is one episode, split 1 h and 2 h across the two dates", async () => {
    const u = await onboarded();
    const n2 = at("2026-11-11", "09:00", NY);
    const a = await call(u, "POST", "/v1/episodes", { strength: 6, started: exact(D, "23:00") }, { now: n2 });
    await call(u, "POST", `/v1/episodes/${a.body.episode.id}/end`, { ended: exact("2026-11-11", "02:00") }, { now: n2 });
    const d1 = await call(u, "GET", `/v1/days/${D}`, undefined, { now: n2 });
    const d2 = await call(u, "GET", "/v1/days/2026-11-11", undefined, { now: n2 });
    expect(d1.body.duration_ms).toBe(3600_000);
    expect(d2.body.duration_ms).toBe(2 * 3600_000);
    expect(d1.body.episodes[0].id).toBe(d2.body.episodes[0].id);
  });

  it("Q05 and Q66: daylight-saving times. Ambiguous needs an offset choice, missing times are refused, elapsed time is real UTC time", async () => {
    const u = await onboarded();
    // 1 Nov 2026: clocks go back in New York; 01:30 happens twice.
    const n = at("2026-11-01", "12:00", NY);
    const amb = await call(u, "POST", "/v1/episodes", { strength: 4, started: exact("2026-11-01", "01:30") }, { now: n });
    expect(amb.status).toBe(422);
    expect(amb.body.error.code).toBe("AMBIGUOUS_TIME");
    expect(amb.body.error.details.choices.map((c: any) => c.offset_min).sort((a: number, b: number) => a - b)).toEqual([-300, -240]);
    const ok = await call(u, "POST", "/v1/episodes", { strength: 4, started: { ...exact("2026-11-01", "01:30"), offset_min: -240 } }, { now: n });
    expect(ok.status).toBe(201);
    const end = await call(u, "POST", `/v1/episodes/${ok.body.episode.id}/end`, { ended: exact("2026-11-01", "03:30") }, { now: n });
    // 01:30 EDT to 03:30 EST is 3 hours of real time, not 2.
    expect(end.body.summary.lasted).toBe("3 h");
    // 8 Mar 2026: clocks go forward; 02:30 does not exist.
    const u2 = await onboarded();
    const missing = await call(u2, "POST", "/v1/episodes", { strength: 4, started: exact("2026-03-08", "02:30") }, { now: at("2026-03-08", "12:00", "-04:00") });
    expect(missing.status).toBe(422);
    expect(missing.body.error.code).toBe("NONEXISTENT_TIME");
  });

  it("Q66 half-hour zone: India days are bucketed by Asia/Kolkata", async () => {
    const u = await onboarded("IN");
    const n = "2026-11-10T20:00:00.000Z"; // 01:30 on 11 Nov in India
    await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now", zone: "Asia/Kolkata" } }, { now: n });
    const state = await call(u, "GET", "/v1/me/state", undefined, { now: n });
    expect(state.body.today.date).toBe("2026-11-11");
    expect(state.body.today.episodes).toBe(1);
  });

  it("Q88 stale If-Match is 409 REVISION_CONFLICT; an edit that creates an overlap is 422 OVERLAP; record unchanged", async () => {
    const u = await onboarded();
    const mk = async (s: string, e: string) => {
      const a = await call(u, "POST", "/v1/episodes", { strength: 5, started: exact(D, s) }, { now });
      await call(u, "POST", `/v1/episodes/${a.body.episode.id}/end`, { ended: exact(D, e) }, { now });
      return a.body.episode.id as string;
    };
    const first = await mk("08:00", "09:00");
    const second = await mk("10:00", "11:00");
    const stale = await call(u, "PATCH", `/v1/episodes/${second}`, { ended: exact(D, "11:30") }, { now, ifMatch: 1 });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe("REVISION_CONFLICT");
    const overlap = await call(u, "PATCH", `/v1/episodes/${second}`, { started: exact(D, "08:30") }, { now, ifMatch: 2 });
    expect(overlap.status).toBe(422);
    expect(overlap.body.error.code).toBe("OVERLAP");
    const { data } = await asUser(u).from("episodes").select("started_at,revision").eq("id", second).single();
    expect(data!.revision).toBe(2);
    expect(new Date(data!.started_at).toISOString()).toBe(at(D, "10:00", NY));
    // adjacent episodes are allowed
    const adjacent = await call(u, "PATCH", `/v1/episodes/${second}`, { started: exact(D, "09:00") }, { now, ifMatch: 2 });
    expect(adjacent.status).toBe(200);
    expect(first).toBeTruthy();
    const missing = await call(u, "PATCH", `/v1/episodes/${second}`, { started: exact(D, "09:10") }, { now });
    expect(missing.status).toBe(422);
    expect(missing.body.error.code).toBe("IF_MATCH_REQUIRED");
  });

  it("Q114 and Q160: every warning sign shows the NHS sentence for its level, for Free users, and nothing is paused", async () => {
    const u = await onboarded("US");
    const signs: Record<string, RegExp> = {
      sudden_severe_stomach_ache_with_a_swollen_tummy: /^Call 911 now\.$/, vomiting_blood_or_vomit_that_looks_like_ground_coffee: /^Call 911 now\.$/,
      severe_difficulty_breathing: /^Call 911 now\.$/, vomiting: /doctor today or go to urgent care/, fever_or_feeling_hot_cold_or_shivery: /doctor today or go to urgent care/,
      swelling_or_lump_in_my_tummy: /doctor today or go to urgent care/, can_t_pee_poo_or_pass_gas: /doctor today or go to urgent care/,
      blood_in_poo: /^Book an appointment with a doctor\.$/, weight_loss_without_trying: /^Book an appointment with a doctor\.$/,
    };
    const a = await call(u, "POST", "/v1/episodes", { strength: 10, started: { mode: "now" }, warning_signs: Object.keys(signs) }, { now });
    expect(a.status).toBe(201);
    expect(a.body.advice).toHaveLength(9);
    for (const adv of a.body.advice) {
      expect(adv.sentence).toMatch(signs[adv.code]!);
      expect(adv.source).toBe("Adapted from NHS, Bloating");
    }
    // Q163: blood in poo is at the "see a doctor" level, not an emergency.
    expect(a.body.advice.find((x: any) => x.code === "blood_in_poo").level).toBe("see_doctor");
    // Q94: saved, nothing paused: logging still works.
    const more = await call(u, "POST", `/v1/episodes/${a.body.episode.id}/samples`, { strength: 9 }, { now });
    expect(more.status).toBe(201);
    const india = await onboarded("IN");
    const b = await call(india, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" }, warning_signs: ["severe_difficulty_breathing"] }, { now });
    expect(b.body.advice[0].sentence).toBe("Call 112 now.");
  });

  it("Q85 an exclusive option combined with another is a validation error and nothing is saved", async () => {
    const u = await onboarded();
    const r = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" }, warning_signs: ["none", "vomiting"] }, { now });
    expect(r.status).toBe(422);
    const { data } = await asUser(u).from("episodes").select("id");
    expect(data).toHaveLength(0);
    const fresh = await newUser();
    const ob = await call(fresh, "POST", "/v1/onboarding/commit", onboardingBody("US", { answers: [{ question_id: "ON-11", value: ["none", "gas"], answered_at: new Date().toISOString() }] }));
    expect(ob.status).toBe(422);
    const { data: p } = await asUser(fresh).from("profiles").select("user_id");
    expect(p).toHaveLength(0);
  });

  it("Q97 and Q115: Free accounts cannot save Pro episode detail (403, nothing saved); warning chips stay free", async () => {
    const u = await onboarded();
    const r = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" }, symptoms: ["gas"] }, { now });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("PLAN_REQUIRED");
    const { data } = await asUser(u).from("episodes").select("id");
    expect(data).toHaveLength(0);
    const ok = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" }, warning_signs: ["vomiting"] }, { now });
    expect(ok.status).toBe(201);
    for (const path of ["symptoms", "suspicions"]) {
      const x = await call(u, "POST", `/v1/episodes/${ok.body.episode.id}/${path}`, path === "symptoms" ? { symptoms: ["gas"] } : { kind: "not_sure" }, { now });
      expect(x.status).toBe(403);
    }
    const eased = await call(u, "POST", `/v1/episodes/${ok.body.episode.id}/end`, { ended: { mode: "now" }, eased: "yes" }, { now });
    expect(eased.status).toBe(403);
  });

  it("unauthenticated requests are 401; another user's episode ID is 404", async () => {
    const u = await onboarded();
    const other = await onboarded();
    const a = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now });
    expect((await call(null, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } })).status).toBe(401);
    expect((await call(other, "POST", `/v1/episodes/${a.body.episode.id}/samples`, { strength: 5 }, { now })).status).toBe(404);
    expect((await call(other, "DELETE", `/v1/episodes/${a.body.episode.id}`, undefined, { now })).status).toBe(404);
    void anon; void logDay;
  });
});
