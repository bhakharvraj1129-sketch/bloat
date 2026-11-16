import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { anon, asUser, at, call, exact, NY, onboarded, newUser, SERVER_SECRET, srvRpc, proUser } from "./helpers";

const D = "2026-11-10";
const now = at(D, "15:00", NY);

// Every table that holds one user's records.
const TABLES = [
  "profiles", "zone_periods", "consents", "entitlements", "question_responses", "help_page_views", "episodes", "strength_samples",
  "episode_symptoms", "warning_signs", "episode_suspicions", "day_reviews", "day_marks", "weekly_impacts", "meals", "meal_ingredients",
  "meal_photos", "saved_dishes", "saved_dish_versions", "food_suggestions", "followed_activities", "activity_observations", "cycle_events",
  "exercise_records", "bowel_movements", "medicines", "medicine_changes", "health_conditions", "lactose_details", "health_tests", "reports",
  "report_shares", "focus_state", "nudge_state", "experiments", "experiment_days", "experiment_checks", "wellbeing_checks", "card_events",
  "hidden_cards", "activity_responses", "command_log", "product_events", "export_jobs",
];
const SERVER_ONLY = ["billing_events", "ai_usage", "review_queue", "audit_log"];

async function seed() {
  const u = await onboarded("US", { followed: ["ACT-01"], medicines: [{ name: "Iron tablets", type: "supplement", med_group: "iron" }] });
  const ep = await call(u, "POST", "/v1/episodes", { strength: 6, started: exact(D, "13:00"), warning_signs: ["vomiting"] }, { now });
  const meal = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "private lunch", eaten: exact(D, "12:00") }, { now });
  await call(u, "PUT", "/v1/days/2026-11-09/review", { worst: 3, whole_day: "yes" }, { now });
  return { u, episodeId: ep.body.episode.id as string, mealId: meal.body.meal.id as string };
}

describe("Privacy: the two-user test (plan B04)", () => {
  it("Q32 user B reads none of user A's rows in any table, directly through the database API", async () => {
    const a = await seed();
    const b = await onboarded();
    const dbB = asUser(b);
    for (const t of TABLES) {
      const { data, error } = await dbB.from(t).select("*").eq("user_id", a.u.id);
      expect(error, `${t} should be readable for own rows`).toBeNull();
      expect(data, `${t} leaked rows`).toEqual([]);
    }
    // Without a user filter B sees only B's own rows.
    for (const t of ["profiles", "episodes", "meals", "question_responses", "medicines"]) {
      const { data } = await dbB.from(t).select("user_id");
      expect((data ?? []).every((r: any) => r.user_id === b.id), t).toBe(true);
    }
    // A does see A's rows, so the empty answers above are the wall and not an empty table.
    const { data: own } = await asUser(a.u).from("episodes").select("id");
    expect(own).toHaveLength(1);
  });

  it("server-only tables cannot be read by any signed-in user, even for their own rows", async () => {
    const a = await seed();
    for (const t of SERVER_ONLY) {
      const { data, error } = await asUser(a.u).from(t).select("*");
      expect(error ?? (data?.length === 0 ? "empty" : null), t).toBeTruthy();
      expect(data ?? []).toEqual([]);
    }
  });

  it("no one can write to any table directly: inserts, updates and deletes are refused", async () => {
    const a = await seed();
    const db = asUser(a.u);
    for (const t of [...TABLES, ...SERVER_ONLY]) {
      const ins = await db.from(t).insert({ user_id: a.u.id });
      expect(ins.error, `${t} insert`).not.toBeNull();
    }
    const upd = await db.from("entitlements").update({ plan: "pro", status: "active" }).eq("user_id", a.u.id).select();
    expect(upd.error).not.toBeNull();
    const { data: ent } = await db.from("entitlements").select("plan").single();
    expect(ent!.plan).toBe("free");
    const del = await db.from("episodes").delete().eq("user_id", a.u.id).select();
    expect(del.error).not.toBeNull();
    const { data: still } = await db.from("episodes").select("id");
    expect(still).toHaveLength(1);
  });

  it("signed-out visitors can read nothing private", async () => {
    await seed();
    for (const t of TABLES) {
      const { data } = await anon().from(t).select("*").limit(1);
      expect(data ?? [], t).toEqual([]);
    }
  });

  it("server functions refuse a missing or wrong secret", async () => {
    const a = await seed();
    for (const secret of ["", "wrong", null]) {
      const { error } = await asUser(a.u).rpc("srv_tx", { p_secret: secret, p_user: a.u.id, p_ops: [{ op: "update", table: "entitlements", match: { user_id: a.u.id }, set: { plan: "pro" } }] });
      expect(error).not.toBeNull();
      const del = await asUser(a.u).rpc("srv_delete_account", { p_secret: secret, p_user: a.u.id });
      expect(del.error).not.toBeNull();
      const adm = await asUser(a.u).rpc("srv_admin_read", { p_secret: secret });
      expect(adm.error).not.toBeNull();
    }
    const { data } = await asUser(a.u).from("entitlements").select("plan").single();
    expect(data!.plan).toBe("free");
    expect(SERVER_SECRET.length).toBeGreaterThan(20);
  });

  it("Q32 and Q60: other users' IDs answer 404 on every route, including related records", async () => {
    const a = await seed();
    const b = await proUser();
    const id = a.episodeId;
    const checks: Array<[string, string, unknown]> = [
      ["POST", `/v1/episodes/${id}/samples`, { strength: 5 }],
      ["POST", `/v1/episodes/${id}/end`, { ended: { mode: "now" } }],
      ["POST", `/v1/episodes/${id}/still-happening`, { answer: "yes" }],
      ["POST", `/v1/episodes/${id}/warning-signs`, { codes: ["vomiting"] }],
      ["POST", `/v1/episodes/${id}/symptoms`, { symptoms: ["gas"] }],
      ["PATCH", `/v1/episodes/${id}`, { ended: { mode: "unknown" } }],
      ["DELETE", `/v1/episodes/${id}`, undefined],
      ["PATCH", `/v1/meals/${a.mealId}`, { dish_text: "mine now" }],
      ["DELETE", `/v1/meals/${a.mealId}`, undefined],
      ["PUT", `/v1/meals/${a.mealId}/ingredients`, { mode: "dont_know" }],
    ];
    for (const [method, path, body] of checks) {
      const r = await call(b, method, path, body, { now, ifMatch: 1 });
      expect(r.status, `${method} ${path}`).toBe(404);
    }
    // B starts an episode and tries to attach A's meal as a suspicion: rejected (cross-user child ID).
    const mine = await call(b, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now });
    const sus = await call(b, "POST", `/v1/episodes/${mine.body.episode.id}/suspicions`, { kind: "meal", meal_id: a.mealId }, { now });
    expect(sus.status).toBe(404);
    const { data } = await asUser(a.u).from("meals").select("dish_text").single();
    expect(data!.dish_text).toBe("private lunch");
  });

  it("the database itself refuses a cross-user parent reference, even from the server", async () => {
    const a = await seed();
    const b = await onboarded();
    await expect(srvRpc("srv_tx", { p_user: b.id, p_ops: [{ op: "insert", table: "strength_samples", row: { episode_id: a.episodeId, strength: 9, observed_at: new Date().toISOString() } }] })).rejects.toThrow();
    const { data } = await asUser(a.u).from("strength_samples").select("strength");
    expect(data!.map((s) => s.strength)).toEqual([6]);
  });

  it("a signed-in account with no profile cannot use private routes", async () => {
    const u = await newUser();
    const r = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe("ONBOARDING_PENDING");
  });

  it("a made-up or tampered token is refused", async () => {
    const r = await call(null, "GET", "/v1/me/state", undefined, { token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.invalid" });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("UNAUTHENTICATED");
  });
});
