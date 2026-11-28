import { describe, expect, it } from "vitest";
import { at, call, exact, NY, onboarded, type User } from "./helpers";

// A day's record list must hold every bloating record the day's summary counts (review of 28 Nov
// 2026, finding 1). The established rule (episodeDates in src/lib/domain/day.ts): a finished record
// touches every local date from its start to its end, as a half-open span, so one that ends exactly
// at midnight does not touch the next day; an open or unknown-end record touches only its start date,
// and no end time is made up for it. History's row, the day's summary (duration) and the day's list
// (which also feeds the day picture) must agree.

const EDT = "-04:00";
const hours = (n: number) => n * 3_600_000;

async function finished(u: User, from: [string, string], to: [string, string], fromOffset = NY, toOffset = NY) {
  const s = await call(u, "POST", "/v1/episodes", { strength: 5, started: exact(...from) }, { now: at(from[0], from[1], fromOffset) });
  expect(s.status, JSON.stringify(s.body)).toBe(201);
  const e = await call(u, "POST", `/v1/episodes/${s.body.episode.id}/end`, { ended: exact(...to) }, { now: at(to[0], to[1], toOffset) });
  expect(e.status, JSON.stringify(e.body)).toBe(200);
  return s.body.episode.id as string;
}

async function day(u: User, date: string, now: string) {
  const d = await call(u, "GET", `/v1/days/${date}`, undefined, { now });
  expect(d.status, JSON.stringify(d.body)).toBe(200);
  return { ids: (d.body.episodes as Array<{ id: string }>).map((e) => e.id), duration: d.body.duration_ms as number };
}

async function historyRow(u: User, date: string, now: string) {
  const h = await call(u, "GET", "/v1/history", undefined, { now });
  expect(h.status).toBe(200);
  return (h.body.days as Array<{ date: string; episodes: number; duration_ms: number }>).find((r) => r.date === date)!;
}

describe("day detail lists every record that touches the day", () => {
  it("a record from Monday night to Wednesday morning is in Tuesday's list, with Tuesday's full 24 hours", async () => {
    const u = await onboarded();
    const id = await finished(u, ["2026-11-09", "22:00"], ["2026-11-11", "02:00"]);
    const now = at("2026-11-12", "09:00", NY);
    for (const [date, ms] of [["2026-11-09", hours(2)], ["2026-11-10", hours(24)], ["2026-11-11", hours(2)]] as const) {
      const d = await day(u, date, now);
      expect(d.ids, date).toEqual([id]);
      expect(d.duration, date).toBe(ms);
      const row = await historyRow(u, date, now);
      expect(row.episodes, date).toBe(1);
      expect(row.duration_ms, date).toBe(ms);
    }
  });

  it("across the autumn clock change: the 25-hour day in the middle lists the record with all 25 hours", async () => {
    const u = await onboarded();
    const id = await finished(u, ["2026-10-31", "22:00"], ["2026-11-02", "02:00"], EDT, NY);
    const now = at("2026-11-03", "09:00", NY);
    expect(await day(u, "2026-10-31", now)).toEqual({ ids: [id], duration: hours(2) });
    expect(await day(u, "2026-11-01", now)).toEqual({ ids: [id], duration: hours(25) });
    expect(await day(u, "2026-11-02", now)).toEqual({ ids: [id], duration: hours(2) });
  });

  it("midnight boundaries: ending exactly at midnight stays on the earlier day; starting exactly at midnight belongs to the later day", async () => {
    const u = await onboarded();
    const ends = await finished(u, ["2026-11-10", "23:00"], ["2026-11-11", "00:00"]);
    const starts = await finished(u, ["2026-11-12", "00:00"], ["2026-11-12", "01:00"]);
    const now = at("2026-11-13", "09:00", NY);
    expect(await day(u, "2026-11-10", now)).toEqual({ ids: [ends], duration: hours(1) });
    expect(await day(u, "2026-11-11", now)).toEqual({ ids: [], duration: 0 });
    expect((await historyRow(u, "2026-11-11", now)).episodes).toBe(0);
    expect(await day(u, "2026-11-12", now)).toEqual({ ids: [starts], duration: hours(1) });
  });

  it("an open record and an unknown-end record stay on their start date only; no end is made up", async () => {
    const open = await onboarded();
    const o = await call(open, "POST", "/v1/episodes", { strength: 4, started: exact("2026-11-09", "20:00") }, { now: at("2026-11-09", "20:05", NY) });
    expect(o.status).toBe(201);
    const unknown = await onboarded();
    const k = await call(unknown, "POST", "/v1/episodes", { strength: 4, started: exact("2026-11-09", "21:00") }, { now: at("2026-11-09", "21:05", NY) });
    expect((await call(unknown, "POST", `/v1/episodes/${k.body.episode.id}/end`, { ended: { mode: "unknown" } }, { now: at("2026-11-10", "08:00", NY) })).status).toBe(200);
    const now = at("2026-11-11", "10:00", NY);
    for (const [u, id] of [[open, o.body.episode.id], [unknown, k.body.episode.id]] as const) {
      const mon = await call(u, "GET", "/v1/days/2026-11-09", undefined, { now });
      expect(mon.body.episodes.map((e: { id: string }) => e.id)).toEqual([id]);
      expect(mon.body.episodes[0].ended_at).toBeNull();
      expect(await day(u, "2026-11-10", now)).toEqual({ ids: [], duration: 0 });
      expect((await historyRow(u, "2026-11-10", now)).episodes).toBe(0);
    }
  });
});
