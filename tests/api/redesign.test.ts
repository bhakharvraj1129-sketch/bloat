import { describe, expect, it } from "vitest";
import { call, onboarded, proUser } from "./helpers";

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
