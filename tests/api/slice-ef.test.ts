import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { publishedCards } from "@content/cards";
import { addDays, anon, asUser, BASE, onboardingBody, staffSession, at, call, logDay, makePro, NY, onboarded, proUser, srvRpc, webhook, type User } from "./helpers";

const START = "2026-08-01";
const day = (i: number) => addDays(START, i);
const NO = { fx01: "no", fx02: "no", fx03: "no", fx04: "no" };
const clock = (i: number, t = "10:00") => at(day(i), t, "-04:00"); // New York summer time

/** A Pro user with `n` confirmed days ending the day before day(n). */
async function withDays(n: number, score = 5): Promise<User> {
  const u = await proUser();
  for (let i = 0; i < n; i++) await logDay(u, day(i), { score, reviewAt: at(day(i + 1), "08:00", "-04:00") });
  return u;
}
const review = (u: User, i: number, worst: number, extra: Record<string, unknown> = {}) =>
  call(u, "PUT", `/v1/days/${day(i)}/review`, { worst, whole_day: "yes", ...extra }, { now: at(day(i + 1), "08:00", "-04:00") });

describe("Slice E: experiments (plan A15)", () => {
  it("Q106 with 3 confirmed days in the week before: not started, 'log normally for a few more days'", async () => {
    const u = await withDays(3);
    const r = await call(u, "POST", "/v1/experiments", { key: "no_straws" }, { now: clock(3) });
    expect(r.status).toBe(422);
    expect(r.body.error.code).toBe("NOT_ENOUGH_DAYS");
    expect(r.body.error.message).toContain("Log normally for a few more days");
    const { data } = await asUser(u).from("experiments").select("id");
    expect(data).toHaveLength(0);
  });

  it("Q107 a second experiment while one runs is refused", async () => {
    const u = await withDays(5);
    const a = await call(u, "POST", "/v1/experiments", { key: "no_straws" }, { now: clock(5) });
    expect(a.status).toBe(201);
    const b = await call(u, "POST", "/v1/experiments", { key: "slow_breathing" }, { now: clock(5) });
    expect(b.status).toBe(409);
    expect(b.body.error.code).toBe("EXPERIMENT_RUNNING");
    // the database also allows only one active experiment per user
    await expect(srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "insert", table: "experiments", row: { type: "habit", key: "no_straws", phase: "RUNNING", started_on: day(5) } }] })).rejects.toThrow();
  });

  it("Q108 six and seven confirmed days with five Yes days: the fixed habit template with both averages and day counts", async () => {
    const u = await withDays(7, 6); // days 0..6 scored 6; the week before the experiment
    const s = await call(u, "POST", "/v1/experiments", { key: "walk_after_meals" }, { now: clock(7) });
    const id = s.body.experiment.id;
    for (let i = 7; i < 14; i++) {
      if (i < 12) await call(u, "POST", `/v1/experiments/${id}/days`, { answer: "yes", date: day(i) }, { now: clock(i, "20:00") });
      if (i !== 13) await review(u, i, 4); // 6 confirmed days during the experiment
    }
    const r = await call(u, "GET", `/v1/experiments/${id}/result`, undefined, { now: clock(15) });
    expect(r.body.experiment.phase).toBe("COMPLETED");
    expect(r.body.result.kind).toBe("habit");
    expect(r.body.result.text).toBe("During the experiment your average Bloat Score was 4 (6 days). In the 7 days before it was 6 (7 days). This is a pattern in your own records, not proof that the change caused it.");
  });

  it("Q109 with only three Yes days: 'There aren't enough days to compare yet'", async () => {
    const u = await withDays(7, 6);
    const s = await call(u, "POST", "/v1/experiments", { key: "eat_more_slowly" }, { now: clock(7) });
    const id = s.body.experiment.id;
    for (let i = 7; i < 14; i++) {
      if (i < 10) await call(u, "POST", `/v1/experiments/${id}/days`, { answer: "yes", date: day(i) }, { now: clock(i, "20:00") });
      await review(u, i, 4);
    }
    const r = await call(u, "GET", `/v1/experiments/${id}/result`, undefined, { now: clock(15) });
    expect(r.body.result.text).toBe("There aren't enough days to compare yet. You logged a confirmed score on 7 of 7 days.");
    expect(r.body.result.numbers).toBeNull();
  });

  it("Q110 ended early because 'I felt worse': no numbers, the help link, the reason saved and a founder review entry", async () => {
    const u = await withDays(5);
    const s = await call(u, "POST", "/v1/experiments", { key: "fewer_fizzy_drinks" }, { now: clock(5) });
    const id = s.body.experiment.id;
    const before = (await srvRpc<any>("srv_admin_read", {})).review_queue.filter((q: any) => q.kind === "experiment_felt_worse").length;
    const e = await call(u, "POST", `/v1/experiments/${id}/end`, { reason: "i_felt_worse" }, { now: clock(6) });
    expect(e.body).toMatchObject({ phase: "ENDED_EARLY", reason: "i_felt_worse", help_link: true });
    const r = await call(u, "GET", `/v1/experiments/${id}/result`, undefined, { now: clock(7) });
    expect(r.body.result).toEqual({ kind: "felt_worse", text: "You ended this experiment because you felt worse. If symptoms are severe or worrying, see When to get medical help.", help_link: true, numbers: null });
    expect(r.body.result.text).not.toMatch(/\d/);
    const { data } = await asUser(u).from("experiments").select("end_reason").eq("id", id).single();
    expect(data!.end_reason).toBe("i_felt_worse");
    expect((await srvRpc<any>("srv_admin_read", {})).review_queue.filter((q: any) => q.kind === "experiment_felt_worse").length).toBe(before + 1);
  });

  it("Q29, Q117, Q31: FX answers other than No close swap experiments on the server; the helpline shows for FX-02; habit experiments stay open", async () => {
    for (const answers of [{ ...NO, fx01: "not_sure" }, { ...NO, fx04: "prefer_not_to_say" }, { ...NO, fx02: "yes" }]) {
      const u = await withDays(5);
      const check = await call(u, "POST", "/v1/experiments/checks", answers, { now: clock(5) });
      expect(check.body.passed).toBe(false);
      expect(check.body.habit_experiments_available).toBe(true);
      if (answers.fx02 === "yes") expect(JSON.stringify(check.body.notes)).toContain("National Alliance for Eating Disorders 1-866-662-1235");
      const swap = await call(u, "POST", "/v1/experiments", { key: "swap_lactose_free_dairy" }, { now: clock(5) });
      expect(swap.status).toBe(403);
      expect(swap.body.error.code).toBe("NOT_ELIGIBLE");
      const { data } = await asUser(u).from("experiments").select("id");
      expect(data).toHaveLength(0);
      const list = await call(u, "GET", "/v1/experiments", undefined, { now: clock(5) });
      expect(list.body.swap.every((s: any) => !s.offered)).toBe(true);
      expect(list.body.habit.find((h: any) => h.key === "no_straws").offered).toBe(true);
      expect((await call(u, "POST", "/v1/experiments", { key: "no_straws" }, { now: clock(5) })).status).toBe(201);
    }
    // No safety check at all: a direct API request is still refused.
    const u = await withDays(5);
    const direct = await call(u, "POST", "/v1/experiments", { key: "swap_onion_and_garlic" }, { now: clock(5) });
    expect(direct.status).toBe(403);
    expect(direct.body.error.code).toBe("NOT_ELIGIBLE");
  });

  it("Q144 a request for a wheat, FODMAP or multi-group experiment is 403 NOT_OFFERED and nothing is created", async () => {
    const u = await withDays(5);
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(5) });
    for (const body of [{ key: "swap_wheat_and_grains" }, { key: "low_fodmap_programme" }, { key: "swap_lactose_free_dairy", groups: ["TAG-01", "TAG-03"] }, { key: "swap_x", groups: ["TAG-02"] }, { key: "swap_something_new" }]) {
      const r = await call(u, "POST", "/v1/experiments", body, { now: clock(5) });
      expect(r.status, JSON.stringify(body)).toBe(403);
      expect(r.body.error.code).toBe("NOT_OFFERED");
    }
    const { data } = await asUser(u).from("experiments").select("id");
    expect(data).toHaveLength(0);
    const list = await call(u, "GET", "/v1/experiments", undefined, { now: clock(5) });
    expect(JSON.stringify(list.body.swap).toLowerCase()).not.toMatch(/wheat|fodmap|tag-02/);
    expect(list.body.swap).toHaveLength(5);
    expect(list.body.habit).toHaveLength(7);
  });

  it("Q30, Q128, Q153: coeliac in the health background, or FX-03 not answered No, closes swaps and the kiwifruit experiment", async () => {
    const u = await withDays(5);
    await call(u, "PUT", "/v1/health/conditions", { conditions: [{ condition: "coeliac_disease" }] });
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(5) });
    expect((await call(u, "POST", "/v1/experiments", { key: "swap_lactose_free_dairy" }, { now: clock(5) })).body.error.code).toBe("NOT_ELIGIBLE");
    expect((await call(u, "POST", "/v1/experiments", { key: "kiwifruit_for_regularity" }, { now: clock(5) })).status).toBe(403);
    const list = await call(u, "GET", "/v1/experiments", undefined, { now: clock(5) });
    expect(list.body.swap_check.blocked_by_condition).toBe(true);
    expect(list.body.habit.find((h: any) => h.key === "walk_after_meals").offered).toBe(true);
    expect(JSON.stringify(list.body).toLowerCase()).not.toMatch(/eliminat|avoid gluten|cut out/);
    // Kiwifruit with FX-03 not answered: not offered, and the list says to answer the question first.
    const v = await withDays(5);
    const kiwi = (await call(v, "GET", "/v1/experiments", undefined, { now: clock(5) })).body.habit.find((h: any) => h.key === "kiwifruit_for_regularity");
    expect(kiwi).toMatchObject({ offered: false, reason: "Paused for now while its instructions are reviewed.", warning: "Don't try this if you're allergic to kiwi" });
    expect((await call(v, "POST", "/v1/experiments", { key: "kiwifruit_for_regularity" }, { now: clock(5) })).status).toBe(403);
    await call(v, "POST", "/v1/experiments/checks", { ...NO, fx03: "yes" }, { now: clock(5) });
    expect((await call(v, "POST", "/v1/experiments", { key: "kiwifruit_for_regularity" }, { now: clock(5) })).status).toBe(403);
    expect((await call(v, "POST", "/v1/experiments", { key: "slow_breathing" }, { now: clock(5) })).status).toBe(201);
  });

  it("the kiwifruit experiment is paused for review: refused on the server even when every safety answer allows it", async () => {
    const u = await withDays(5);
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(5) }); // FX-03 No
    const r = await call(u, "POST", "/v1/experiments", { key: "kiwifruit_for_regularity" }, { now: clock(5) });
    expect(r.status).toBe(403);
    expect(r.body.error).toMatchObject({ code: "NOT_ELIGIBLE", message: "Paused for now while its instructions are reviewed." });
    const list = await call(u, "GET", "/v1/experiments", undefined, { now: clock(5) });
    expect(list.body.habit.find((h: any) => h.key === "kiwifruit_for_regularity")).toMatchObject({ offered: false });
    expect((await call(u, "GET", "/v1/experiments", undefined, { now: clock(5) })).body.habit.filter((h: any) => h.offered).length).toBeGreaterThan(0);
  });

  it("Q118, Q119: a wellbeing Yes pauses the swap and shows the helpline; the swap step ends itself after 2 weeks and the add-back week comes before any result", async () => {
    const u = await withDays(5);
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(5) });
    const s = await call(u, "POST", "/v1/experiments", { key: "swap_lactose_free_dairy" }, { now: clock(5) });
    expect(s.status).toBe(201);
    const id = s.body.experiment.id;
    expect(s.body.experiment.swap_ends_on).toBe(day(18)); // 14 days: day 5 to day 18
    const wb = await call(u, "POST", `/v1/experiments/${id}/wellbeing`, { wb01: "yes", wb02: "no" }, { now: clock(12) });
    expect(wb.body).toMatchObject({ phase: "PAUSED", paused: true, helpline: "National Alliance for Eating Disorders 1-866-662-1235" });
    expect((await call(u, "POST", `/v1/experiments/${id}/days`, { answer: "yes" }, { now: clock(12) })).status).toBe(409);
    const resume = await call(u, "POST", `/v1/experiments/${id}/resume`, undefined, { now: clock(13) });
    expect(resume.body.phase).toBe("RUNNING");
    // After the 2 weeks it has moved to adding back by itself.
    const mid = await call(u, "GET", `/v1/experiments/${id}/result`, undefined, { now: clock(20) });
    expect(mid.body.experiment.phase).toBe("ADDING_BACK");
    expect(mid.body.experiment.add_back_ends_on).toBe(day(25));
    expect(mid.body.result).toBeNull(); // no result before the add-back week is over
    const done = await call(u, "GET", `/v1/experiments/${id}/result`, undefined, { now: clock(27) });
    expect(done.body.experiment.phase).toBe("COMPLETED");
    expect(done.body.result.kind).toBe("not_enough");
  });

  it("the food result uses the fixed three-part template", async () => {
    const u = await withDays(7, 6);
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(7) });
    const s = await call(u, "POST", "/v1/experiments", { key: "swap_onion_and_garlic" }, { now: clock(7) });
    const id = s.body.experiment.id;
    for (let i = 7; i < 21; i++) { await call(u, "POST", `/v1/experiments/${id}/days`, { answer: "yes", date: day(i) }, { now: clock(i, "20:00") }); await review(u, i, 3); }
    for (let i = 21; i < 28; i++) await review(u, i, 5);
    const r = await call(u, "GET", `/v1/experiments/${id}/result`, undefined, { now: clock(29) });
    expect(r.body.result.text).toBe("Before: 6 (7 days). While swapping onion and garlic: 3 (14 days). After adding it back: 5 (7 days). This is a pattern in your own records, not proof that the food caused it. Keep eating foods that didn't make a difference.");
  }, 120000);

  it("Q143 a third swap experiment within 180 days is refused; habit experiments stay available", async () => {
    const u = await withDays(5);
    for (const [n, key] of [[0, "swap_lactose_free_dairy"], [1, "swap_beans_and_lentils"]] as const) {
      await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(5 + n) });
      const s = await call(u, "POST", "/v1/experiments", { key }, { now: clock(5) });
      expect(s.status, key).toBe(201);
      await call(u, "POST", `/v1/experiments/${s.body.experiment.id}/end`, { reason: "other" }, { now: clock(5) });
    }
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(7) });
    const third = await call(u, "POST", "/v1/experiments", { key: "swap_onion_and_garlic" }, { now: clock(5) });
    expect(third.status).toBe(409);
    expect(third.body.error.code).toBe("SWAP_LIMIT");
    expect(third.body.error.details.habit_experiments_available).toBe(true);
    expect((await call(u, "POST", "/v1/experiments", { key: "no_straws" }, { now: clock(5) })).status).toBe(201);
  });

  it("the swap safety check is asked again before each swap", async () => {
    const u = await withDays(5);
    await call(u, "POST", "/v1/experiments/checks", NO, { now: clock(5) });
    const s = await call(u, "POST", "/v1/experiments", { key: "swap_lactose_free_dairy" }, { now: clock(5) });
    await call(u, "POST", `/v1/experiments/${s.body.experiment.id}/end`, { reason: "other" }, { now: clock(5) });
    const again = await call(u, "POST", "/v1/experiments", { key: "swap_beans_and_lentils" }, { now: clock(5) });
    expect(again.status).toBe(403); // the earlier check does not carry over
  });
});

describe("Slice E: daily cards and the Learn library", () => {
  it("Q111, Q126: the same card all day, and feedback is saved; Q112 'Worse' hides the card and adds a review entry", async () => {
    const u = await proUser();
    const a = await call(u, "GET", "/v1/cards/today", undefined, { now: clock(0) });
    const b = await call(u, "GET", "/v1/cards/today", undefined, { now: clock(0, "21:00") });
    expect(a.body.card.id).toBe(b.body.card.id);
    expect(a.body.card.kind).toBe("tip");
    expect(a.body.footer).toBe("General wellness information, not medical advice. If you have a diagnosed condition, follow your doctor's advice first.");
    expect(a.body.card.sources[0].url).toMatch(/^https:\/\//);
    const next = await call(u, "GET", "/v1/cards/today", undefined, { now: clock(1) });
    expect(next.body.card.kind).toBe("mind_body");
    expect(next.body.card.id).not.toBe(a.body.card.id);
    const before = (await srvRpc<any>("srv_admin_read", {})).review_queue.filter((q: any) => q.kind === "card_worse").length;
    const fb = await call(u, "POST", `/v1/cards/${next.body.card.id}/feedback`, { tried: "tried", result: "worse" }, { now: clock(1) });
    expect(fb.body.hidden).toBe(true);
    expect((await srvRpc<any>("srv_admin_read", {})).review_queue.filter((q: any) => q.kind === "card_worse").length).toBe(before + 1);
    const lib = await call(u, "GET", "/v1/library");
    expect(lib.body.cards.find((c: any) => c.id === next.body.card.id).hidden).toBe(true);
    for (let i = 2; i < 40; i++) expect((await call(u, "GET", "/v1/cards/today", undefined, { now: clock(i) })).body.card.id).not.toBe(next.body.card.id);
    await call(u, "POST", `/v1/cards/${next.body.card.id}/feedback`, { unhide: true });
    expect((await call(u, "GET", "/v1/library")).body.cards.find((c: any) => c.id === next.body.card.id).hidden).toBe(false);
  }, 120000);

  it("Q189 the library lists every published card and all 15 articles with sources; Q127 'What helps you' needs 3 tries", async () => {
    const u = await proUser();
    const lib = await call(u, "GET", "/v1/library");
    expect(lib.body.articles).toHaveLength(15);
    expect(lib.body.articles.every((a: any) => a.sources.length > 0)).toBe(true);
    // Exactly the published cards: drafts (no source, or a broken one) are never listed.
    expect(lib.body.cards.map((c: any) => c.id).sort()).toEqual(publishedCards().map((c) => c.id).sort());
    expect(lib.body.cards.map((c: any) => c.id)).not.toContain("kiwi");
    expect(lib.body.cards.every((c: any) => c.sources.length > 0)).toBe(true);
    expect(lib.body.what_helps).toEqual([]);
    for (const [i, [b, a]] of [[5, 4], [6, 4], [5, 3]].entries()) {
      await srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "insert", table: "activity_responses", row: { ref_kind: "card", ref_id: "walk", date: day(i), before_score: b, after_score: a } }] });
      const w = (await call(u, "GET", "/v1/library")).body.what_helps;
      expect(w.length).toBe(i < 2 ? 0 : 1);
    }
    expect((await call(u, "GET", "/v1/library")).body.what_helps[0].text).toBe("Gentle walk after a meal: bloating went from 5.3 to 3.7 on average across 3 tries.");
  });

  it("Q125 the next best log never names a condition and 'Not useful' hides it for 30 days", async () => {
    const u = await proUser();
    for (let i = 0; i < 6; i++) await call(u, "PUT", `/v1/days/${day(i)}/activities`, { taps: [{ activity_id: "ACT-03" }] }, { now: clock(i, "20:00") });
    const s = await call(u, "GET", "/v1/insights/suggestions", undefined, { now: clock(7) });
    expect(s.body.next_best_log.text).toBe("You logged chewing gum or hard sweets on 6 days. Follow it to compare it with your bloating.");
    expect(JSON.stringify(s.body).toLowerCase()).not.toMatch(/ibs|sibo|intoleran|disease|syndrome/);
    const d = await call(u, "POST", "/v1/insights/suggestions/dismiss", { id: s.body.next_best_log.id }, { now: clock(7) });
    expect(d.body.dismissed_until).toBe(day(37));
    expect((await call(u, "GET", "/v1/insights/suggestions", undefined, { now: clock(8) })).body.next_best_log).toBeNull();
    // Q146: Personal Focus suggests following the habit that is logged often but not followed.
    expect(s.body.focus.find((c: any) => c.rule === "FOLLOW:ACT-03").why).toBe("You logged it on 6 of the last 14 days. Only followed habits can be compared.");
  });
});

describe("Slice F: subscriptions, pause and safe analytics", () => {
  it("Q211 the 3-month plan gives Pro for 3 months; Q212 the price follows the card's country, saved on the subscription", async () => {
    const u = await onboarded("IN");
    const before = await call(u, "GET", "/v1/billing/entitlement");
    expect(before.body.prices).toMatchObject({ monthly: "₹199", three_month: "₹549", annual: "₹1,999", tax: "includes 18% GST" });
    const buy = await makePro(u, "three_month", "US");
    expect(buy.body.offer).toMatchObject({ country: "US", currency: "USD", amount_minor: 1499, interval: "three_month", trial: null });
    const e = await call(u, "GET", "/v1/billing/entitlement");
    expect(e.body).toMatchObject({ plan: "pro", status: "active", interval: "three_month", billing_country: "US" });
    const months = (Date.parse(e.body.renews_or_ends_at) - Date.now()) / 86400000;
    expect(months).toBeGreaterThan(88);
    expect(months).toBeLessThan(93);
    const { data } = await asUser(u).from("profiles").select("residence_country").single();
    expect(data!.residence_country).toBe("IN"); // the sign-up country is unchanged
  });

  it("Q35 a duplicate webhook applies once and a stale, out-of-order event never reverts a newer state; a bad signature is refused", async () => {
    const u = await onboarded();
    const t0 = Date.now();
    const activated = { provider: "mock", event_id: `evt_${randomUUID()}`, user_id: u.id, type: "activated", occurred_at: new Date(t0).toISOString(), interval: "monthly", ends_at: new Date(t0 + 30 * 86400000).toISOString(), billing_country: "US" };
    expect((await webhook(activated)).body).toMatchObject({ applied: true, duplicate: false });
    expect((await webhook(activated)).body).toMatchObject({ applied: false, duplicate: true });
    const cancelled = { provider: "mock", event_id: `evt_${randomUUID()}`, user_id: u.id, type: "refunded", occurred_at: new Date(t0 + 60000).toISOString() };
    expect((await webhook(cancelled)).body.applied).toBe(true);
    // An older "renewed" event arrives late: it must not bring Pro back.
    const stale = { provider: "mock", event_id: `evt_${randomUUID()}`, user_id: u.id, type: "renewed", occurred_at: new Date(t0 + 30000).toISOString(), ends_at: new Date(t0 + 60 * 86400000).toISOString() };
    expect((await webhook(stale)).body).toMatchObject({ applied: false, stale: true });
    expect((await call(u, "GET", "/v1/billing/entitlement")).body).toMatchObject({ plan: "free", status: "refunded" });
    expect((await webhook({ ...activated, event_id: `evt_${randomUUID()}` }, "wrong-secret")).status).toBe(401);
    expect((await call(u, "GET", "/v1/library")).status).toBe(403);
  });

  it("Q145 pausing Pro for 2 months: no charge, data kept, Pro screens locked, and Resume brings it back", async () => {
    const u = await proUser();
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "kept lunch", eaten: { mode: "now" } });
    const p = await call(u, "POST", "/v1/billing/pause", { months: 2 });
    expect(p.body.status).toBe("paused");
    const days = (Date.parse(p.body.pause_until) - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(58);
    expect(days).toBeLessThan(63);
    expect((await call(u, "GET", "/v1/library")).status).toBe(403);
    expect((await call(u, "GET", "/v1/me/state")).body).toMatchObject({ plan: "free", paused: true });
    const { data } = await asUser(u).from("meals").select("dish_text");
    expect(data).toHaveLength(1);
    expect((await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "free logging still works", eaten: { mode: "now" } })).status).toBe(201);
    expect((await call(u, "POST", "/v1/billing/pause", { months: 4 })).status).toBe(422);
    expect((await call(u, "POST", "/v1/billing/resume")).body.status).toBe("active");
    expect((await call(u, "GET", "/v1/library")).status).toBe(200);
  });

  it("cancelling keeps Pro until the paid period ends and never deletes data", async () => {
    const u = await proUser();
    const c = await call(u, "POST", "/v1/billing/cancel");
    expect(c.body).toMatchObject({ status: "cancelled", data_kept: true });
    expect((await call(u, "GET", "/v1/library")).status).toBe(200);
    expect((await call(u, "GET", "/v1/billing/entitlement")).body.status).toBe("cancelled");
  });

  it("Q58, Q62, Q73: checkout is off. The Upgrade tap is counted, nothing is charged, the diary keeps working, and it cannot be switched on from the founder tools", async () => {
    const u = await onboarded();
    const e = await call(u, "GET", "/v1/billing/entitlement");
    expect(e.body.checkout_enabled).toBe(false);
    const tap = await call(u, "POST", "/v1/billing/checkout", { interval: "annual" });
    expect(tap.body.checkout).toBe("off");
    expect((await call(u, "GET", "/v1/billing/entitlement")).body.plan).toBe("free");
    expect((await call(u, "POST", "/v1/episodes", { strength: 3, started: { mode: "now" } })).status).toBe(201);
    const staff = await staffSession();
    const admin = await fetch(`${BASE}/v1/admin`, { method: "POST", headers: { Authorization: `Bearer ${staff.second}`, "content-type": "application/json" }, body: JSON.stringify({ what: "flag", key: "checkout_enabled", enabled: true }) });
    expect(admin.status).toBe(403);
    expect((await admin.json()).error.code).toBe("CAPABILITY_OFF");
  });

  it("founder tools need a staff account that passed a second sign-in step, expose no health records, and leave an audit trail (Q76, Q184)", async () => {
    const get = (token?: string) => fetch(`${BASE}/v1/admin`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
    expect((await get()).status).toBe(404); // signed out
    expect((await get("not-a-real-token")).status).toBe(404);
    expect((await fetch(`${BASE}/v1/admin`, { headers: { "x-admin-token": "local-admin-token" } })).status).toBe(404); // the old shared token is gone
    const u = await onboarded();
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "secret-dish-name-xyz", eaten: { mode: "now" } });
    expect((await get(u.token)).status).toBe(404); // an ordinary account, even signed in
    const staff = await staffSession();
    // Staff address and password alone are not enough.
    const half = await get(staff.first);
    expect(half.status).toBe(403);
    expect((await half.json()).error.code).toBe("MFA_REQUIRED");
    const change = (token: string) => fetch(`${BASE}/v1/admin`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ what: "flag", key: "ai_enabled", enabled: true }) });
    expect((await change(staff.first)).status).toBe(403);
    expect((await change(u.token)).status).toBe(404);
    // After the authenticator code: in.
    const ok = await get(staff.second);
    expect(ok.status).toBe(200);
    const text = await ok.text();
    expect(text).not.toContain("secret-dish-name-xyz");
    expect(text).not.toContain(u.id);
    expect(Object.keys(JSON.parse(text)).sort()).toEqual(["ai_calls_24h", "ai_failures_24h", "ai_settings", "alerts", "events_7d", "flags", "month_spent_micros", "review_queue", "waitlist_count"]);
    expect((await change(staff.second)).status).toBe(200);
    // Audit: who did what and when, with no health data.
    const log = await srvRpc<any[]>("srv_tx", { p_user: staff.id, p_ops: [{ op: "update", table: "audit_log", match: { action: "admin_read" }, set: { action: "admin_read" } }, { op: "update", table: "audit_log", match: { action: "admin_set_flag" }, set: { action: "admin_set_flag" } }] });
    expect(log[0].n).toBe(1);
    expect(log[1].row.meta).toEqual({ key: "ai_enabled", enabled: true });
  });

  it("Q37, Q80: when a country is paused, new entries and purchases stop with an explanation, and reading, export, corrections and deletion keep working", async () => {
    const u = await onboarded("CA");
    const other = await onboarded("US");
    const meal = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "toast", eaten: { mode: "now" } });
    expect(meal.status).toBe(201);
    const open = await call(u, "POST", "/v1/episodes", { strength: 4, started: { mode: "now" } });
    expect(open.status).toBe(201);
    const staff = await staffSession();
    const set = (feature: string, status: string) => fetch(`${BASE}/v1/admin`, { method: "POST", headers: { Authorization: `Bearer ${staff.second}`, "content-type": "application/json" }, body: JSON.stringify({ what: "capability", country: "CA", feature, status }) });
    expect((await set("recording", "suspended")).status).toBe(200);
    expect((await set("payments", "suspended")).status).toBe(200);
    try {
      // Checked again on each request: the pause applies to the very next save (Q80).
      const refused = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "soup", eaten: { mode: "now" } });
      expect(refused.status).toBe(403);
      expect(refused.body.error.code).toBe("CAPABILITY_OFF");
      expect(refused.body.error.message).toContain("You can still read, export and delete your records.");
      expect((await call(u, "POST", "/v1/episodes", { strength: 3, started: { mode: "now" } })).status).toBe(403);
      expect((await call(u, "POST", "/v1/food-suggestions", { save_key: randomUUID(), dish_text: "soup" })).status).toBe(403);
      const buy = await call(u, "POST", "/v1/billing/mock-purchase", { interval: "monthly" });
      expect(buy.status).toBe(403);
      expect(buy.body.error.code).toBe("CAPABILITY_OFF");
      expect((await call(u, "GET", "/v1/billing/entitlement")).body.plan).toBe("free");
      // Rights are kept: read, finish what is open, correct, export, delete.
      const today = (await call(u, "GET", "/v1/history")).body.today;
      const day = await call(u, "GET", `/v1/days/${today}`);
      expect(day.status).toBe(200);
      expect(day.body.meals.map((m: any) => m.dish_text)).toEqual(["toast"]);
      expect((await call(u, "POST", `/v1/episodes/${open.body.episode.id}/end`, { ended: { mode: "now" } })).status).toBe(200);
      expect((await call(u, "PATCH", `/v1/meals/${meal.body.meal.id}`, { dish_text: "toast and jam" }, { ifMatch: 1 })).status).toBe(200);
      expect((await call(u, "POST", "/v1/export", { format: "json" })).status).toBe(201);
      // Another country is not affected.
      expect((await call(other, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "rice", eaten: { mode: "now" } })).status).toBe(201);
      expect((await call(u, "POST", "/v1/account/delete", { confirm: "DELETE" })).status).toBe(200);
    } finally {
      await set("recording", "not_reviewed");
      await set("payments", "not_reviewed");
    }
    const back = await onboarded("CA");
    expect((await call(back, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "toast", eaten: { mode: "now" } })).status).toBe(201);
  });

  it("Q185, Q159: product events carry no health values, food, symptoms, conditions or free text", async () => {
    const u = await proUser("US", { answers: [{ question_id: "ON-14", value: "50_59", answered_at: new Date().toISOString() }, { question_id: "ON-15", value: "yes", answered_at: new Date().toISOString() }, { question_id: "ON-10", value: ["perimenopause_or_menopause"], answered_at: new Date().toISOString() }] });
    await call(u, "POST", "/v1/episodes", { strength: 9, started: { mode: "now" }, warning_signs: ["blood_in_poo"], symptoms: ["diarrhoea"] });
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "garlic naan special", eaten: { mode: "now" } });
    await call(u, "PUT", "/v1/health/family", { value: ["ovarian_cancer"] });
    await call(u, "PUT", "/v1/days/2026-08-01/review", { worst: 9, whole_day: "yes" });
    const { data } = await asUser(u).from("product_events").select("name,props");
    expect(data!.length).toBeGreaterThanOrEqual(3);
    const text = JSON.stringify(data).toLowerCase();
    for (const leak of ["garlic", "naan", "blood", "diarrh", "50_59", "ovar", "menopause", "\"strength\"", "\"worst\"", "\"score\""]) expect(text, leak).not.toContain(leak);
    const allowed = new Set(["plan", "with_ingredients", "late", "count", "type", "interval", "accepted"]);
    for (const e of data!) for (const k of Object.keys(e.props as object)) expect(allowed.has(k), `${e.name}.${k}`).toBe(true);
  });
});

describe("Designated Pro test accounts (BLOAT_PRO_TEST_EMAILS)", () => {
  it("a listed, confirmed address gets Pro screens without any purchase; an unlisted one stays Free; nothing is written to billing", async () => {
    const email = "pro-tester@bloat.test"; // listed in .env.local for the local server
    const old = await anon().auth.signInWithPassword({ email, password: "synthetic-password-1" });
    if (old.data.user) await srvRpc("srv_delete_account", { p_user: old.data.user.id });
    const made = await anon().auth.signUp({ email, password: "synthetic-password-1" });
    const u = { id: made.data.user!.id, email, token: made.data.session!.access_token };
    expect((await call(u, "POST", "/v1/onboarding/commit", onboardingBody("US"))).status).toBe(201);
    expect((await call(u, "GET", "/v1/journey")).status).toBe(200);
    const ent = await call(u, "GET", "/v1/billing/entitlement");
    expect(ent.body).toMatchObject({ plan: "pro", status: "none" });
    const { data: rows } = await asUser(u).from("entitlements").select("plan,status");
    expect((rows ?? []).filter((r) => r.plan === "pro")).toEqual([]); // Pro comes from the server list, not a purchase
    // A1 (26 Nov): there is no subscription, so there is nothing to pause or cancel, and no billing record is made.
    const pause = await call(u, "POST", "/v1/billing/pause", { months: 1 });
    expect(pause.status).toBe(409);
    expect(pause.body.error.code).toBe("NO_SUBSCRIPTION");
    expect((await call(u, "POST", "/v1/billing/cancel")).status).toBe(409);
    const { data: after } = await asUser(u).from("entitlements").select("plan,status");
    expect(after ?? []).toEqual(rows ?? []); // unchanged: no paused or cancelled record was made
    expect((await call(u, "GET", "/v1/billing/entitlement")).body).toMatchObject({ plan: "pro", status: "none", paused: false });
    const other = await onboarded();
    expect((await call(other, "GET", "/v1/journey")).status).toBe(403);
  });
});
