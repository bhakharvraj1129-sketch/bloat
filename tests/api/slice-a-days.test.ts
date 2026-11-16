import { describe, expect, it } from "vitest";
import { addDays, asUser, at, call, exact, logDay, NY, onboarded } from "./helpers";

const D = "2026-11-10";
const morning = at("2026-11-11", "08:00", NY);

async function episode(u: any, date: string, start: string, end: string, strength: number, now: string) {
  const a = await call(u, "POST", "/v1/episodes", { strength, started: exact(date, start) }, { now });
  await call(u, "POST", `/v1/episodes/${a.body.episode.id}/end`, { ended: exact(date, end) }, { now });
  return a.body.episode.id as string;
}

describe("Slice A: Bloat Score and morning review (plan A09)", () => {
  it("Q44 today shows 'highest logged so far', never a confirmed score", async () => {
    const u = await onboarded();
    const now = at(D, "15:00", NY);
    await episode(u, D, "13:00", "14:00", 6, now);
    const state = await call(u, "GET", "/v1/me/state", undefined, { now });
    expect(state.body.today.highest_logged).toBe(6);
    expect(JSON.stringify(state.body.today)).not.toContain("score");
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now });
    expect(day.body.status).toBe("PROVISIONAL");
    expect(day.body.score).toBeNull();
  });

  it("confirmed score needs a number AND 'whole day: yes' by the end of the next day", async () => {
    const u = await onboarded();
    await episode(u, D, "13:00", "14:00", 6, at(D, "15:00", NY));
    const r = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 7, whole_day: "yes", food_coverage: "mostly" }, { now: morning });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: "CONFIRMED", score: 7 });
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now: morning });
    expect(day.body).toMatchObject({ status: "CONFIRMED", score: 7 });
  });

  it("Q42 all episodes closed but the whole-day answer missing: 422, nothing saved", async () => {
    const u = await onboarded();
    await episode(u, D, "13:00", "14:00", 6, at(D, "15:00", NY));
    const r = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 6 }, { now: morning });
    expect(r.status).toBe(422);
    const { data } = await asUser(u).from("day_reviews").select("date");
    expect(data).toHaveLength(0);
  });

  it("Q43 part of the day or 'I cannot remember' stays provisional and has no score", async () => {
    const u = await onboarded();
    const a = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 4, whole_day: "only_part_of_the_day" }, { now: morning });
    expect(a.body).toMatchObject({ status: "PROVISIONAL", score: null });
    const u2 = await onboarded();
    const b = await call(u2, "PUT", `/v1/days/${D}/review`, { worst: "i_cannot_remember", whole_day: "yes" }, { now: morning });
    expect(b.body).toMatchObject({ status: "PROVISIONAL", score: null });
    const c = await call(u2, "PUT", `/v1/days/${D}/review`, { worst: 3, whole_day: "not_sure" }, { now: morning });
    expect(c.body.status).toBe("PROVISIONAL");
  });

  it("Q10 a review of zero, or lower than a logged reading, is a CONFLICT and has no score", async () => {
    const u = await onboarded();
    await episode(u, D, "13:00", "14:00", 6, at(D, "15:00", NY));
    const zero = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 0, whole_day: "yes" }, { now: morning });
    expect(zero.body).toMatchObject({ status: "CONFLICT", score: null });
    const lower = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 4, whole_day: "yes" }, { now: morning });
    expect(lower.body).toMatchObject({ status: "CONFLICT", conflict_reason: "review_below_logged" });
    const fixed = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 6, whole_day: "yes" }, { now: morning });
    expect(fixed.body.status).toBe("CONFIRMED");
  });

  it("Q86 DY-01: 11 and 3.5 are refused; 0 is accepted as a real zero", async () => {
    const u = await onboarded();
    for (const worst of [11, 3.5, -1]) {
      expect((await call(u, "PUT", `/v1/days/${D}/review`, { worst, whole_day: "yes" }, { now: morning })).status).toBe(422);
    }
    const zero = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 0, whole_day: "yes" }, { now: morning });
    expect(zero.body).toMatchObject({ status: "CONFIRMED", score: 0 });
  });

  it("Q16 a review after the deadline is LATE: kept in history, not a confirmed day", async () => {
    const u = await onboarded();
    const late = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 5, whole_day: "yes" }, { now: at("2026-11-12", "00:30", NY) });
    expect(late.body).toMatchObject({ status: "LATE", score: 5 });
    const onTime = await call(u, "PUT", "/v1/days/2026-11-11/review", { worst: 5, whole_day: "yes" }, { now: at("2026-11-12", "23:59", NY) });
    expect(onTime.body.status).toBe("CONFIRMED");
  });

  it("Q09 'no bloating so far' is a provisional zero that a later episode supersedes; the review still decides", async () => {
    const u = await onboarded();
    const now = at(D, "10:00", NY);
    const none = await call(u, "POST", `/v1/days/${D}/no-bloating-so-far`, undefined, { now });
    expect(none.body).toMatchObject({ status: "PROVISIONAL", provisional_zero: true });
    let state = await call(u, "GET", "/v1/me/state", undefined, { now });
    expect(state.body.today.provisional_zero).toBe(true);
    await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now: at(D, "12:00", NY) });
    state = await call(u, "GET", "/v1/me/state", undefined, { now: at(D, "12:30", NY) });
    expect(state.body.today).toMatchObject({ provisional_zero: false, highest_logged: 5 });
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now: morning });
    expect(day.body.status).toBe("PROVISIONAL");
    expect(day.body.score).toBeNull();
  });

  it("a day cannot be reviewed before it has finished", async () => {
    const u = await onboarded();
    const r = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 5, whole_day: "yes" }, { now: at(D, "20:00", NY) });
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("DAY_NOT_FINISHED");
  });

  it("a skipped field never erases an earlier answer", async () => {
    const u = await onboarded();
    await call(u, "PUT", `/v1/days/${D}/review`, { worst: 5, whole_day: "yes", food_coverage: "all" }, { now: morning });
    await call(u, "PUT", `/v1/days/${D}/review`, { worst: 6, whole_day: "yes" }, { now: morning });
    const { data } = await asUser(u).from("day_reviews").select("worst,food_coverage,revision").single();
    expect(data).toEqual({ worst: 6, food_coverage: "all", revision: 2 });
  });

  it("Q15 a habit that was not tapped is unknown, never No; only followed habits get an explicit No", async () => {
    const u = await onboarded("US", { followed: ["ACT-01"] });
    const now = at(D, "18:00", NY);
    await call(u, "PUT", `/v1/days/${D}/activities`, { taps: [{ activity_id: "ACT-03" }] }, { now });
    const r = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 2, whole_day: "yes", habits: { "ACT-01": "no" } }, { now: morning });
    expect(r.status).toBe(200);
    const { data } = await asUser(u).from("activity_observations").select("activity_id,answer,source").order("activity_id");
    expect(data).toEqual([{ activity_id: "ACT-01", answer: "no", source: "review" }, { activity_id: "ACT-03", answer: "yes", source: "tap" }]);
    const notFollowed = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 2, whole_day: "yes", habits: { "ACT-04": "no" } }, { now: morning });
    expect(notFollowed.status).toBe(422);
    const skipped = await call(u, "PUT", `/v1/days/${D}/review`, { worst: 2, whole_day: "yes", habits: { "ACT-01": "skip" } }, { now: morning });
    expect(skipped.status).toBe(200);
    const { data: after } = await asUser(u).from("activity_observations").select("answer").eq("activity_id", "ACT-01").single();
    expect(after!.answer).toBe("no"); // a skip does not erase
  });

  it("Q115 Free accounts cannot tap Pro habits (sleep, stress, travel, illness, ate out)", async () => {
    const u = await onboarded();
    for (const id of ["ACT-11", "ACT-12", "ACT-14", "ACT-15", "ACT-18", "ACT-20", "ACT-21"]) {
      const r = await call(u, "PUT", `/v1/days/${D}/activities`, { taps: [{ activity_id: id }] }, { now: at(D, "18:00", NY) });
      expect(r.status).toBe(403);
      expect(r.body.error.code).toBe("PLAN_REQUIRED");
    }
    const { data } = await asUser(u).from("activity_observations").select("id");
    expect(data).toHaveLength(0);
  });

  it("Q164 period logging is refused without the ON-10 cycle-context opt-in, and works with it", async () => {
    const off = await onboarded();
    const r = await call(off, "PUT", `/v1/days/${D}/activities`, { cycle: [{ kind: "start", date: D, precision: "exact" }] }, { now: at(D, "18:00", NY) });
    expect(r.status).toBe(403);
    const state = await call(off, "GET", "/v1/me/state", undefined, { now: at(D, "18:00", NY) });
    expect(state.body.cycle_context).toBe(false);
    const on = await onboarded("US", { answers: [{ question_id: "ON-10", value: ["cycle_context"], answered_at: new Date().toISOString() }] });
    const ok = await call(on, "PUT", `/v1/days/${D}/activities`, { cycle: [{ kind: "start", date: D, precision: "exact" }] }, { now: at(D, "18:00", NY) });
    expect(ok.status).toBe(200);
    expect((await call(on, "GET", "/v1/me/state", undefined, { now: at(D, "18:00", NY) })).body.cycle_context).toBe(true);
  });

  it("Q170 weekly impact answered on Monday is saved for the previous week and not asked again that week", async () => {
    const u = await onboarded();
    const monday = at("2026-11-09", "08:00", NY);
    let state = await call(u, "GET", "/v1/me/state", undefined, { now: monday });
    expect(state.body.weekly_impact_due).toBe(true);
    await call(u, "PUT", "/v1/days/2026-11-08/review", { worst: 3, whole_day: "yes", weekly_impact: "a_little" }, { now: monday });
    const { data } = await asUser(u).from("weekly_impacts").select("week_start,answer").single();
    expect(data).toEqual({ week_start: "2026-11-02", answer: "a_little" });
    state = await call(u, "GET", "/v1/me/state", undefined, { now: at("2026-11-09", "20:00", NY) });
    expect(state.body.weekly_impact_due).toBe(false);
  });

  it("Q139 the Free progress counter shows exactly the real counts", async () => {
    const u = await onboarded();
    // 14 days logged, 9 of them confirmed.
    for (let i = 0; i < 14; i++) {
      const date = addDays("2026-10-20", i);
      if (i < 9) await logDay(u, date, { score: 2, meals: [{ time: "12:00", text: "rice" }] });
      else await call(u, "POST", "/v1/meals", { save_key: `progress-key-${i}`, dish_text: "rice", eaten: exact(date, "12:00") }, { now: at(date, "13:00", NY) });
    }
    const state = await call(u, "GET", "/v1/me/state", undefined, { now: at("2026-11-03", "09:00", NY) });
    expect(state.body.progress).toEqual({ days_logged: 14, confirmed_days: 9, confirmed_needed: 14 });
    expect(state.body.pro).toBeNull();
  });

  it("Q155, Q156, Q116: the doctor line appears above 12 of 30 days, in History only, and DN-01 shortens it for 90 days", async () => {
    const u = await onboarded();
    const start = "2026-10-12";
    for (let i = 0; i < 12; i++) await episode(u, addDays(start, i), "10:00", "11:00", 4, at(addDays(start, i), "12:00", NY));
    const now12 = at("2026-11-08", "09:00", NY);
    let h = await call(u, "GET", "/v1/history", undefined, { now: now12 });
    expect(h.body.doctor_line).toBeNull(); // exactly 12: no line
    await episode(u, "2026-10-24", "10:00", "11:00", 4, at("2026-10-24", "12:00", NY));
    h = await call(u, "GET", "/v1/history", undefined, { now: now12 });
    expect(h.body.doctor_line).toMatchObject({
      show: true, days: 13, shortened: false, ovarianSentence: null,
      sentence: "The NHS suggests seeing a doctor if you feel bloated regularly or keep feeling bloated after changing your diet.",
    });
    // Never on Today.
    const state = await call(u, "GET", "/v1/me/state", undefined, { now: now12 });
    expect(JSON.stringify(state.body)).not.toMatch(/doctor/i);
    const dn = await call(u, "POST", "/v1/nudges/doctor/response", { response: "i_ve_spoken_to_a_doctor_about_this" }, { now: now12 });
    expect(dn.body.shortened_until).toBe("2027-02-06");
    h = await call(u, "GET", "/v1/history", undefined, { now: now12 });
    expect(h.body.doctor_line.shortened).toBe(true);
  });

  it("Q157 and Q158: the ovarian sentence is added only for 50+ with ovaries", async () => {
    const mk = async (answers: any[]) => {
      const u = await onboarded("US", { answers: answers.map((a) => ({ ...a, answered_at: new Date().toISOString() })) });
      for (let i = 0; i < 13; i++) await episode(u, addDays("2026-10-12", i), "10:00", "11:00", 4, at(addDays("2026-10-12", i), "12:00", NY));
      return (await call(u, "GET", "/v1/history", undefined, { now: at("2026-11-08", "09:00", NY) })).body.doctor_line;
    };
    const yes = await mk([{ question_id: "ON-14", value: "50_59" }, { question_id: "ON-15", value: "yes" }]);
    expect(yes.ovarianSentence).toBe("Sometimes, bloating that does not go away can be a sign of something more serious such as ovarian cancer.");
    expect((await mk([{ question_id: "ON-14", value: "40_49" }, { question_id: "ON-15", value: "yes" }])).ovarianSentence).toBeNull();
    expect((await mk([{ question_id: "ON-14", value: "60" }, { question_id: "ON-15", value: "prefer_not_to_say" }])).ovarianSentence).toBeNull();
    expect((await mk([{ question_id: "ON-14", skipped: true }, { question_id: "ON-15", value: "yes" }])).ovarianSentence).toBeNull();
  });

  it("Q95 fourteen days of scores 8–10: numbers only, no high or abnormal label, and no alert", async () => {
    const u = await onboarded();
    for (let i = 0; i < 14; i++) await logDay(u, addDays("2026-10-20", i), { score: 8 + (i % 3) });
    const now = at("2026-11-03", "09:00", NY);
    for (const path of ["/v1/history", "/v1/me/state", "/v1/days/2026-10-25"]) {
      const text = JSON.stringify((await call(u, "GET", path, undefined, { now })).body).toLowerCase();
      for (const word of ["abnormal", "high risk", "severe", "alert", "see a doctor", "urgent"]) expect(text).not.toContain(word);
    }
  });

  it("history range is limited to 92 days", async () => {
    const u = await onboarded();
    const r = await call(u, "GET", "/v1/history?from=2026-01-01&to=2026-11-01", undefined, { now: morning });
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("RANGE_TOO_LONG");
  });
});
