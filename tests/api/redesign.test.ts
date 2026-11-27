import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { call, newUser, onboarded, onboardingBody, proUser } from "./helpers";

function sql(query: string): string {
  return execFileSync("docker", ["exec", "supabase_db_bloat", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tAc", query], { encoding: "utf8" }).trim();
}

// Design v2 (owner, 27 Nov 2026): the two small additions the new screens read. LOCAL stack,
// synthetic accounts only, real clock.

const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

describe("Design v2: Today's week strip and the Patterns progress counts", () => {
  it("state.week is this week, Monday first: a day fills in once anything is logged, later days are future, and no score is sent", async () => {
    const u = await onboarded();
    const before = await call(u, "GET", "/v1/me/state");
    expect(before.status).toBe(200);
    const today = before.body.today.date as string;
    const week = before.body.week as Array<{ date: string; logged: boolean; future: boolean }>;
    expect(week).toHaveLength(7);
    expect(weekdayOf(week[0]!.date)).toBe(1); // Monday
    expect(week.map((d) => d.date)).toContain(today);
    for (const d of week) {
      expect(Object.keys(d).sort()).toEqual(["date", "future", "logged"]); // no score, no strength
      expect(d.future).toBe(d.date > today);
      expect(d.logged).toBe(false);
    }

    expect((await call(u, "POST", "/v1/episodes", { strength: 3, started: { mode: "now" } })).status).toBe(201);
    const after = (await call(u, "GET", "/v1/me/state")).body.week as Array<{ date: string; logged: boolean }>;
    expect(after.filter((d) => d.logged).map((d) => d.date)).toEqual([today]);
  });

  it("No bloating so far today also fills in today (unknown is not turned into anything)", async () => {
    const u = await onboarded();
    const today = (await call(u, "GET", "/v1/me/state")).body.today.date as string;
    expect((await call(u, "POST", `/v1/days/${today}/no-bloating-so-far`)).status).toBeLessThan(300);
    const week = (await call(u, "GET", "/v1/me/state")).body.week as Array<{ date: string; logged: boolean }>;
    expect(week.filter((d) => d.logged).map((d) => d.date)).toEqual([today]);
  });

  it("Possible triggers sends real confirmed-day counts for the 'on their way' card; a Free account still gets 403 with nothing in it", async () => {
    const pro = await proUser();
    const t = await call(pro, "GET", "/v1/insights/triggers");
    expect(t.status).toBe(200);
    expect(t.body.progress).toEqual({ confirmed_days: 0, confirmed_needed: 14 });

    const free = await onboarded();
    const f = await call(free, "GET", "/v1/insights/triggers");
    expect(f.status).toBe(403);
    expect(JSON.stringify(f.body)).not.toContain("confirmed_days");
  });
});

// 27 Nov 2026, the owner's answers: D33 (consent sentences say Bloat Buddy, confirmed again once) and
// the state field (chosen from the country's list, saved as listed).
describe("Owner's answers of 27 Nov: renamed consent sentences and the state list", () => {
  it("D33: an account that agreed to the old wording is asked once for the two renamed sentences; Terms is not asked again", async () => {
    const u = await onboarded();
    expect((await call(u, "GET", "/v1/me/state")).body.consents_due).toEqual([]); // new accounts agree to the new wording
    sql(`update public.consents set version = '2026-11-16' where user_id = '${u.id}'`); // as if set up before the rename
    expect((await call(u, "GET", "/v1/me/state")).body.consents_due).toEqual(["health_data", "wellness_ack"]);

    expect((await call(u, "POST", "/v1/consents/reconfirm", { types: ["terms_privacy"] })).status).toBe(422);
    const ok = await call(u, "POST", "/v1/consents/reconfirm", { types: ["health_data", "wellness_ack"] });
    expect(ok.status).toBe(201);
    expect((await call(u, "GET", "/v1/me/state")).body.consents_due).toEqual([]);
    // Append-only: the earlier agreement stays in the record next to the new one.
    expect(sql(`select string_agg(type || ':' || version, ',' order by type, version) from public.consents where user_id = '${u.id}' and type in ('health_data','wellness_ack')`))
      .toBe("health_data:2026-11-16,health_data:2026-11-27,wellness_ack:2026-11-16,wellness_ack:2026-11-27");
  });

  it("the state or province is one from the country's list, saved as listed; anything else is refused; You can change or clear it", async () => {
    const u = await newUser();
    const bad = await call(u, "POST", "/v1/onboarding/commit", onboardingBody("US", { region: "Ontario" }));
    expect(bad.status).toBe(422);
    const good = await call(u, "POST", "/v1/onboarding/commit", onboardingBody("US", { region: "  new york " }));
    expect(good.status).toBe(201);
    expect((await call(u, "GET", "/v1/me/state")).body.profile.region).toBe("New York");

    expect((await call(u, "PATCH", "/v1/me/profile", { region: "Narnia" })).status).toBe(422);
    expect((await call(u, "PATCH", "/v1/me/profile", { region: "Texas" })).status).toBeLessThan(300);
    expect((await call(u, "GET", "/v1/me/state")).body.profile.region).toBe("Texas");
    expect((await call(u, "PATCH", "/v1/me/profile", { region: null })).status).toBeLessThan(300);
    expect((await call(u, "GET", "/v1/me/state")).body.profile.region).toBeNull();
  });
});
