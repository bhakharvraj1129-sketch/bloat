import { beforeAll, describe, expect, it } from "vitest";
import { addDays, asUser, at, BASE, call, exact, logDay, NY, proUser, type User } from "./helpers";

// Defect R1 (History and editing review, 26 Nov 2026). The plan (B05: "Record deleted or corrected:
// recompute; flag dependent reports; revoke shares"; doctor PDF: "Record deleted after the report:
// stored report flagged for regeneration; share revoked") applied only to meals. Deleting or
// correcting a bloating record, a bowel or exercise record, a habit answer or a review left a shared
// doctor report live, still showing what the person had removed.

const START = "2026-09-01";
const day = (i: number) => addDays(START, i);
const NOW = at(day(10), "10:00", NY);

async function share(u: User, from: string, to: string) {
  const r = await call(u, "POST", "/v1/reports", { kind: "doctor", from, to }, { now: NOW });
  expect(r.status, JSON.stringify(r.body)).toBe(201);
  // The link is made on the real clock (its expiry is checked against it when the page opens).
  const s = await call(u, "POST", `/v1/reports/${r.body.id}/shares`, { recipient: "GP", purpose: "appointment", expires_in_days: 7, consent: true });
  expect(s.status, JSON.stringify(s.body)).toBe(201);
  // It opens before the change under test, so a "no longer works" afterwards comes from that change.
  expect(await page(s.body.url)).toContain("Bloating diary summary");
  return { id: r.body.id as string, url: s.body.url as string };
}
const page = async (url: string) => (await fetch(`${BASE}${url}`)).text();
async function expectRevoked(u: User, rep: { id: string; url: string }, what: string) {
  const { data } = await asUser(u).from("reports").select("stale").eq("id", rep.id).single();
  expect(data!.stale, `${what}: report flagged`).toBe(true);
  expect(await page(rep.url), `${what}: share link`).toContain("This link no longer works");
}
async function expectLive(u: User, rep: { id: string; url: string }, what: string) {
  const { data } = await asUser(u).from("reports").select("stale").eq("id", rep.id).single();
  expect(data!.stale, `${what}: report not flagged`).toBe(false);
  expect(await page(rep.url), `${what}: share link`).toContain("Bloating diary summary");
}

describe("R1: deleting or correcting any record flags the stored reports that used it and revokes their share links", () => {
  let u: User;
  const dayData = async (d: string) => (await call(u, "GET", `/v1/days/${d}`, undefined, { now: NOW })).body;
  beforeAll(async () => {
    u = await proUser();
    for (let i = 0; i < 6; i++) {
      await logDay(u, day(i), { score: 4, episode: { start: "09:00", end: "10:00", strength: 4 }, meals: [{ time: "12:30", text: `meal ${i}` }], taps: ["ACT-01"] });
    }
    const evening = (d: string) => ({ now: at(d, "23:00", NY) });
    const bowel = await call(u, "POST", "/v1/bowel", { occurred: exact(day(2), "08:00") }, evening(day(2)));
    expect(bowel.status, JSON.stringify(bowel.body)).toBe(201);
    const exercise = await call(u, "POST", "/v1/exercise", { type: "walking", started: exact(day(3), "18:00"), minutes: 20 }, evening(day(3)));
    expect(exercise.status, JSON.stringify(exercise.body)).toBe(201);
  });

  it("control: a change on a day outside a report leaves it and its link alone", async () => {
    const rep = await share(u, day(4), day(5));
    const ep0 = (await dayData(day(0))).episodes[0];
    expect((await call(u, "DELETE", `/v1/episodes/${ep0.id}`, undefined, { now: NOW, ifMatch: ep0.revision })).status).toBe(204);
    await expectLive(u, rep, "deleting bloating on a day outside the report");
  });

  it("a bloating record's time corrected", async () => {
    const rep = await share(u, day(0), day(5));
    const ep1 = (await dayData(day(1))).episodes[0];
    const patch = await call(u, "PATCH", `/v1/episodes/${ep1.id}`, { started: exact(day(1), "08:30") }, { now: NOW, ifMatch: ep1.revision });
    expect(patch.status, JSON.stringify(patch.body)).toBe(200);
    await expectRevoked(u, rep, "bloating time corrected");
  });

  it("a bloating record deleted", async () => {
    const rep = await share(u, day(0), day(5));
    const ep4 = (await dayData(day(4))).episodes[0];
    expect((await call(u, "DELETE", `/v1/episodes/${ep4.id}`, undefined, { now: NOW, ifMatch: ep4.revision })).status).toBe(204);
    await expectRevoked(u, rep, "bloating deleted");
  });

  it("a bowel record deleted", async () => {
    const rep = await share(u, day(0), day(5));
    expect((await call(u, "DELETE", `/v1/bowel/${(await dayData(day(2))).bowel[0].id}`, undefined, { now: NOW })).status).toBe(204);
    await expectRevoked(u, rep, "bowel record deleted");
  });

  it("an exercise record deleted", async () => {
    const rep = await share(u, day(0), day(5));
    expect((await call(u, "DELETE", `/v1/exercise/${(await dayData(day(3))).exercise[0].id}`, undefined, { now: NOW })).status).toBe(204);
    await expectRevoked(u, rep, "exercise record deleted");
  });

  it("a habit answer removed from a day (it becomes unknown)", async () => {
    const rep = await share(u, day(0), day(5));
    const removed = await call(u, "PUT", `/v1/days/${day(5)}/activities`, { remove: ["ACT-01"] }, { now: NOW });
    expect(removed.status, JSON.stringify(removed.body)).toBe(200);
    expect((await dayData(day(5))).activities.find((a: { activity_id: string }) => a.activity_id === "ACT-01")).toBeUndefined();
    await expectRevoked(u, rep, "habit answer removed");
  });

  it("a review changed afterwards", async () => {
    const rep = await share(u, day(0), day(5));
    const review = await call(u, "PUT", `/v1/days/${day(3)}/review`, { worst: 7, whole_day: "yes", food_coverage: "all" }, { now: NOW });
    expect(review.status, JSON.stringify(review.body)).toBe(200);
    await expectRevoked(u, rep, "review changed");
  });

  it("a meal moved onto a day a report covers (only the new day is in the report)", async () => {
    const rep = await share(u, day(5), day(5));
    const meal = (await dayData(day(1))).meals[0];
    const moved = await call(u, "PATCH", `/v1/meals/${meal.id}`, { dish_text: meal.dish_text, eaten: exact(day(5), "13:00") }, { now: NOW, ifMatch: meal.revision });
    expect(moved.status, JSON.stringify(moved.body)).toBe(200);
    await expectRevoked(u, rep, "meal moved onto a reported day");
  });
});

// Defect R2 (26 Nov 2026): the same rule for records without a date that the doctor report shows.
// Deleting a medicine or a test, or correcting health background, lactose details, family history or
// the optional context answers (ON-10, ON-14, ON-15), left a shared doctor report live with the old
// record. Every stored doctor report is now flagged and its links revoked. Adding information is not
// a correction and flags nothing.
describe("R2: correcting or deleting an undated record the doctor report shows flags stored doctor reports and revokes their links", () => {
  let u: User;
  beforeAll(async () => {
    u = await proUser();
    for (let i = 0; i < 3; i++) await logDay(u, day(i), { score: 3, episode: { start: "09:00", end: "10:00", strength: 3 } });
    const setup = [
      await call(u, "POST", "/v1/medicines", { name: "Test iron", type: "supplement", med_group: "iron", started_precision: "not_sure" }, { now: NOW }),
      await call(u, "POST", "/v1/health/tests", { test: "full_blood_count", date_precision: "not_sure" }, { now: NOW }),
      await call(u, "PUT", "/v1/health/conditions", { conditions: [{ condition: "ibs" }, { condition: "lactose_intolerance" }] }, { now: NOW }),
      await call(u, "PUT", "/v1/health/lactose", { breath_test: "positive", after_dairy: ["gas"] }, { now: NOW }),
      await call(u, "PUT", "/v1/health/family", { value: ["coeliac_disease"] }, { now: NOW }),
      await call(u, "PATCH", "/v1/me/profile", { answers: { "ON-14": "30_39" } }, { now: NOW }),
    ];
    for (const r of setup) expect(r.status, JSON.stringify(r.body)).toBeLessThan(300);
  });

  it("control: adding a medicine is new information and leaves the report and its link alone", async () => {
    const rep = await share(u, day(0), day(2));
    expect((await call(u, "POST", "/v1/medicines", { name: "Test fibre", type: "supplement", started_precision: "not_sure" }, { now: NOW })).status).toBe(201);
    await expectLive(u, rep, "medicine added");
  });

  it("a medicine deleted", async () => {
    const rep = await share(u, day(0), day(2));
    const med = (await call(u, "GET", "/v1/medicines", undefined, { now: NOW })).body.medicines.find((m: { name: string }) => m.name === "Test iron");
    expect((await call(u, "DELETE", `/v1/medicines/${med.id}`, undefined, { now: NOW })).status).toBe(204);
    await expectRevoked(u, rep, "medicine deleted");
  });

  it("a test deleted", async () => {
    const rep = await share(u, day(0), day(2));
    const test = (await call(u, "GET", "/v1/health/conditions", undefined, { now: NOW })).body.tests[0];
    expect((await call(u, "DELETE", `/v1/health/tests?id=${test.id}`, undefined, { now: NOW })).status).toBe(204);
    await expectRevoked(u, rep, "test deleted");
  });

  it("lactose details changed", async () => {
    const rep = await share(u, day(0), day(2));
    expect((await call(u, "PUT", "/v1/health/lactose", { breath_test: "negative", after_dairy: ["gas"] }, { now: NOW })).status).toBe(200);
    await expectRevoked(u, rep, "lactose details changed");
  });

  it("a health condition removed", async () => {
    const rep = await share(u, day(0), day(2));
    expect((await call(u, "PUT", "/v1/health/conditions", { conditions: [{ condition: "lactose_intolerance" }] }, { now: NOW })).status).toBe(200);
    await expectRevoked(u, rep, "condition removed");
  });

  it("family history changed", async () => {
    const rep = await share(u, day(0), day(2));
    expect((await call(u, "PUT", "/v1/health/family", { value: null }, { now: NOW })).status).toBe(200);
    await expectRevoked(u, rep, "family history changed");
  });

  it("an optional context answer changed (age range)", async () => {
    const rep = await share(u, day(0), day(2));
    expect((await call(u, "PATCH", "/v1/me/profile", { answers: { "ON-14": "40_49" } }, { now: NOW })).status).toBe(200);
    await expectRevoked(u, rep, "age range changed");
  });
});
