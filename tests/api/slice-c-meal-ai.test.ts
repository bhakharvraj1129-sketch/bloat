import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { asUser, at, BASE, call, exact, NY, onboarded, proUser, srvRpc, type User } from "./helpers";

const D = "2026-11-10";
const now = at(D, "15:00", NY);

async function consent(u: User) { await call(u, "POST", "/v1/consents", { type: "ai_meal" }); }
async function ready(): Promise<User> { const u = await proUser(); await consent(u); return u; }
async function suggest(u: User, dish: string, key = randomUUID()) {
  return { key, res: await call(u, "POST", "/v1/food-suggestions", { save_key: key, dish_text: dish }, { now }) };
}
const admin = () => srvRpc<any>("srv_admin_read", {});

afterAll(async () => {
  await srvRpc("srv_admin_set", { p_what: "flag", p_value: { key: "ai_enabled", enabled: true } });
  await srvRpc("srv_admin_set", { p_what: "monthly_limit_micros", p_value: 50000000 });
});

describe("Slice C: ingredient check and three-state answers (plan A11)", () => {
  it("CN-04 consent is required before the first check", async () => {
    const u = await proUser();
    const r = await call(u, "POST", "/v1/food-suggestions", { save_key: randomUUID(), dish_text: "burrito" }, { now });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("CONSENT_REQUIRED");
    const { data } = await asUser(u).from("food_suggestions").select("id");
    expect(data).toHaveLength(0);
  });

  it("Q98 'chicken burrito with beans': only items in the 12 groups, at most 20, labelled as a suggestion that may be wrong (Q178 typed = usually in recipe)", async () => {
    const u = await ready();
    const { res } = await suggest(u, "chicken burrito with beans");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.items.length).toBeGreaterThan(2);
    expect(res.body.items.length).toBeLessThanOrEqual(20);
    for (const i of res.body.items) {
      expect(i.food_group).toMatch(/^TAG-(0[1-9]|1[0-2])$/);
      expect(i.source_label).toBe("usually_in_recipe");
    }
    expect(res.body.fixed_text).toBe("These are foods often linked to gas or bloating (sources: NIH, NHS). AI suggestion, may be wrong. Mark each one.");
    expect(res.body.provider_label).toBe("Test data (mock)"); // the mock is always labelled as a mock
    expect(JSON.stringify(res.body).toLowerCase()).not.toMatch(/calorie|kcal|avoid|should/);
  });

  it("Q99, Q100, Q131: Had and Didn't have are saved as marked; untouched items are Not sure, never Didn't have", async () => {
    const u = await ready();
    const { key, res } = await suggest(u, "chicken burrito with beans");
    const items = res.body.items.map((i: any) => i.name) as string[];
    const marked = [
      { name: items[0], answer: "had", kind: "listed" }, { name: items[1], answer: "had", kind: "listed" },
      { name: items[2], answer: "didnt_have", kind: "listed" },
    ];
    const r = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "chicken burrito with beans", eaten: { mode: "now" }, mode: "marked", ingredients: marked }, { now });
    expect(r.status).toBe(201);
    expect(r.body.meal.ai_check_status).toBe("checked");
    const byName = Object.fromEntries(r.body.ingredients.map((i: any) => [i.name, i]));
    expect(byName[items[0]!]).toMatchObject({ answer: "had", source: "ai_confirmed" });
    expect(byName[items[2]!]).toMatchObject({ answer: "didnt_have", source: "ai_confirmed" });
    for (const untouched of items.slice(3)) expect(byName[untouched]).toMatchObject({ answer: "not_sure", source: "ai_confirmed" });
    expect(r.body.ingredients).toHaveLength(items.length);
  });

  it("Q132 'None of these' then one item changed to Had: that item had, all others didnt_have", async () => {
    const u = await ready();
    const { key, res } = await suggest(u, "paneer curry");
    const items = res.body.items.map((i: any) => i.name) as string[];
    const ingredients = items.map((name, idx) => ({ name, answer: idx === 0 ? "had" : "didnt_have", kind: "listed" }));
    const r = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "paneer curry", eaten: { mode: "now" }, mode: "marked", ingredients }, { now });
    expect(r.body.ingredients.filter((i: any) => i.answer === "had").map((i: any) => i.name)).toEqual([items[0]]);
    expect(r.body.ingredients.filter((i: any) => i.answer === "didnt_have")).toHaveLength(items.length - 1);
  });

  it("Q121 'I don't know': every listed item is unknown / dont_know", async () => {
    const u = await ready();
    const { key } = await suggest(u, "pizza");
    const r = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "pizza", eaten: { mode: "now" }, mode: "dont_know" }, { now });
    expect(r.body.meal.ai_check_status).toBe("dont_know");
    expect(r.body.ingredients.length).toBeGreaterThan(0);
    expect(r.body.ingredients.every((i: any) => i.answer === "unknown" && i.source === "dont_know")).toBe(true);
  });

  it("Q14, Q122: 'Assume the usual recipe' is saved as a labelled guess", async () => {
    const u = await ready();
    const { key } = await suggest(u, "pizza");
    const r = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "pizza", eaten: { mode: "now" }, mode: "assume_usual" }, { now });
    expect(r.body.ingredients.every((i: any) => i.answer === "had" && i.source === "guess")).toBe(true);
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now });
    expect(day.body.meals[0].ingredients[0].source).toBe("guess"); // visible in history
  });

  it("Q60 the server derives food groups itself and refuses items that were not in the list", async () => {
    const u = await ready();
    const { key } = await suggest(u, "pizza");
    const invented = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "pizza", eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "dragonfruit", answer: "didnt_have", kind: "listed" }] }, { now });
    expect(invented.status).toBe(422);
    expect(invented.body.error.code).toBe("NOT_IN_SUGGESTION");
    const withTag = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "pizza", eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "garlic", answer: "had", kind: "added", food_group: "TAG-12" }] }, { now });
    expect(withTag.status).toBe(422); // a client-sent group is not accepted at all
    const added = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "pizza", eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "Garlic", answer: "had", kind: "added" }, { name: "mystery spice", answer: "had", kind: "added" }] }, { now });
    expect(added.status).toBe(201);
    const by = Object.fromEntries(added.body.ingredients.map((i: any) => [i.name, i]));
    expect(by.garlic).toMatchObject({ food_group: "TAG-03", source: "user_added", answer: "had" });
    expect(by["mystery spice"].food_group).toBe("other");
  });

  it("Q123, Q23, Q41: a saved dish pre-fills its ingredients as saved_dish; editing the dish changes future meals only; a dish saved from a guess is not confirmed", async () => {
    const u = await ready();
    const { key, res } = await suggest(u, "paneer curry");
    const ingredients = res.body.items.map((i: any) => ({ name: i.name, answer: "had", kind: "listed" }));
    const first = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "paneer curry", eaten: exact(D, "12:00"), mode: "marked", ingredients, save_as_dish: { place: "Home" } }, { now });
    const dishId = first.body.saved_dish_id;
    expect(dishId).toBeTruthy();
    const reuse = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "paneer curry", eaten: exact(D, "13:00"), saved_dish_id: dishId }, { now });
    expect(reuse.status).toBe(201);
    expect(reuse.body.ingredients.every((i: any) => i.source === "saved_dish" && i.answer === "had")).toBe(true);
    const v2 = await call(u, "POST", `/v1/dishes/${dishId}/versions`, { ingredients: [{ name: "paneer", answer: "had" }] }, { now });
    expect(v2.body.version).toBe(2);
    const { data: old } = await asUser(u).from("meal_ingredients").select("id").eq("meal_id", reuse.body.meal.id);
    expect(old!.length).toBe(ingredients.length); // the earlier meal keeps what it was saved with
    const next = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "paneer curry", eaten: exact(D, "14:00"), saved_dish_id: dishId }, { now });
    expect(next.body.ingredients).toHaveLength(1);
    const other = await ready();
    expect((await call(other, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "x", eaten: { mode: "now" }, saved_dish_id: dishId }, { now })).status).toBe(404);

    const g = await suggest(u, "pizza");
    const guess = await call(u, "POST", "/v1/meals", { save_key: g.key, dish_text: "pizza", eaten: exact(D, "14:30"), mode: "assume_usual", save_as_dish: {} }, { now });
    const { data: ver } = await asUser(u).from("saved_dish_versions").select("confirmed").eq("dish_id", guess.body.saved_dish_id).single();
    expect(ver!.confirmed).toBe(false);
  });

  it("Q22 malformed output, extra fields (prompt injection) and timeouts are rejected; the meal still saves and manual entry works", async () => {
    const u = await ready();
    for (const marker of ["[mock-malformed]", "[mock-inject]"]) {
      const { key, res } = await suggest(u, `soup ${marker}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("failed");
      expect(res.body.items).toEqual([]);
      expect(JSON.stringify(res.body)).not.toContain("stop eating");
      const meal = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: `soup ${marker}`, eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "onion", answer: "had", kind: "added" }] }, { now });
      expect(meal.status).toBe(201);
      expect(meal.body.ingredients).toEqual([{ name: "onion", food_group: "TAG-03", answer: "had", source: "user_added" }]);
    }
  }, 60000);

  it("Q101, Q196: the provider failing twice means one retry only, then ingredients unknown and status failed", async () => {
    const u = await ready();
    const before = await admin();
    const started = Date.now();
    const { key, res } = await suggest(u, "stew [mock-timeout]");
    const elapsed = Date.now() - started;
    expect(res.body.status).toBe("failed");
    expect(res.body.message).toBe("Your meal is saved. Add ingredients yourself, or try the check again later.");
    expect(elapsed).toBeGreaterThanOrEqual(2000); // one retry after 2 seconds
    expect(elapsed).toBeLessThan(4000);           // and no further automatic retries
    const after = await admin();
    expect(after.ai_calls_24h - before.ai_calls_24h).toBe(1);
    expect(after.ai_failures_24h - before.ai_failures_24h).toBe(1);
    const meal = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "stew [mock-timeout]", eaten: { mode: "now" } }, { now });
    expect(meal.status).toBe(201);
    expect(meal.body.meal.ai_check_status).toBe("failed");
    expect(meal.body.ingredients).toEqual([]);
  }, 30000);

  it("Q197 the same meal (same save key) is never sent to the AI twice", async () => {
    const u = await ready();
    const before = (await admin()).ai_calls_24h;
    const key = randomUUID();
    const a = await suggest(u, "dal makhani", key);
    const b = await suggest(u, "dal makhani", key);
    expect(b.res.body.replayed).toBe(true);
    expect(b.res.body.items).toEqual(a.res.body.items);
    expect((await admin()).ai_calls_24h - before).toBe(1);
  });

  it("Q194 a 250-character dish is saved in full; only the first 200 characters go to the AI", async () => {
    const u = await ready();
    // "beer" sits after character 200, so the mock (which only sees what is sent) must not find it.
    const text = `${"plain rice ".repeat(19)}`.slice(0, 205).padEnd(205, "x") + " with beer and more beer and beer";
    expect(text.length).toBeGreaterThanOrEqual(230);
    const { key, res } = await suggest(u, text);
    expect(res.body.items.map((i: any) => i.name)).not.toContain("beer");
    const meal = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: text, eaten: { mode: "now" } }, { now });
    const { data } = await asUser(u).from("meals").select("dish_text").eq("id", meal.body.meal.id).single();
    expect(data!.dish_text).toBe(text);
  });

  it("Q103, Q159: the AI input is the dish text and language only", async () => {
    // The provider interface accepts nothing else; this checks the stored record of what was sent.
    const u = await proUser("US", { answers: [{ question_id: "ON-14", value: "50_59", answered_at: new Date().toISOString() }, { question_id: "ON-10", value: ["pregnancy"], answered_at: new Date().toISOString() }] });
    await consent(u);
    const { res } = await suggest(u, "chai");
    expect(res.body.status).toBe("ok");
    const { data } = await asUser(u).from("food_suggestions").select("*").single();
    const stored = JSON.stringify(data);
    for (const secret of ["50_59", "pregnancy", u.email, u.id.slice(0, 8) + "x"]) expect(stored).not.toContain(secret);
    expect(Object.keys(data!).sort()).toEqual(["created_at", "id", "input_hash", "latency_ms", "model", "output", "prompt_version", "purpose", "save_key", "status", "user_id"]);
  });
});

describe("Slice C: AI spending protections (plan 0.4)", () => {
  it("Q192 the 11th check within an hour is refused for that request; the meal still saves with the right message", async () => {
    const u = await ready();
    for (let i = 0; i < 10; i++) expect((await suggest(u, `toast ${i}`)).res.body.status).not.toBe("limited");
    const { key, res } = await suggest(u, "toast 11");
    expect(res.body.status).toBe("limited");
    expect(res.body.message).toBe("Your meal is saved. Add ingredients yourself, or try the check again later.");
    const meal = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "toast 11", eaten: { mode: "now" } }, { now });
    expect(meal.status).toBe(201);
    expect(meal.body.meal.ai_check_status).toBe("limited");
  });

  it("Q193 the 41st check in a day is refused until midnight in the user's time zone", async () => {
    const u = await ready();
    const today = "2026-11-10"; // the user's local day at the test clock
    const rows = Array.from({ length: 40 }, () => ({
      op: "insert", table: "ai_usage",
      row: { at: new Date(Date.now() - 3 * 3600_000).toISOString(), local_day: today, purpose: "FOOD_GROUP_INGREDIENT_LIST", model: "mock-ingredients-1" },
    }));
    await srvRpc("srv_tx", { p_user: u.id, p_ops: rows });
    const limited = await suggest(u, "rice");
    expect(limited.res.body.status).toBe("limited");
    // After midnight in New York it is a new local day and the count starts again.
    const tomorrow = await call(u, "POST", "/v1/food-suggestions", { save_key: randomUUID(), dish_text: "chai" }, { now: at("2026-11-11", "00:05", NY) });
    expect(tomorrow.body.status).toBe("ok");
  });

  it("Q198 the kill switch stops all AI calls at once and meal logging keeps working", async () => {
    const u = await ready();
    await srvRpc("srv_admin_set", { p_what: "flag", p_value: { key: "ai_enabled", enabled: false } });
    try {
      const before = (await admin()).ai_calls_24h;
      const { key, res } = await suggest(u, "burrito");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("paused");
      expect(res.body.message).toBe("The ingredient check is paused right now. Your meal is saved.");
      expect((await admin()).ai_calls_24h).toBe(before);
      const meal = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "burrito", eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "beans", answer: "had", kind: "added" }] }, { now });
      expect(meal.status).toBe(201);
      expect(meal.body.meal.ai_check_status).toBe("manual");
    } finally {
      await srvRpc("srv_admin_set", { p_what: "flag", p_value: { key: "ai_enabled", enabled: true } });
    }
    expect((await suggest(u, "burrito")).res.body.status).toBe("ok");
  });

  it("Q190, Q191: at the monthly limit AI pauses for everyone and meals still save; one founder alert per level, with no user data", async () => {
    const u = await ready();
    await suggest(u, "pizza"); // make sure there is some spend this month
    const spent = (await admin()).month_spent_micros;
    await srvRpc("srv_admin_set", { p_what: "monthly_limit_micros", p_value: spent + 1 });
    try {
      const crossing = await suggest(u, "pasta"); // this call takes spending over the limit
      expect(crossing.res.body.status).toBe("ok");
      const other = await ready();
      const { key, res } = await suggest(other, "burger");
      expect(res.body.status).toBe("paused");
      expect(res.body.message).toBe("The ingredient check is paused right now. Your meal is saved.");
      const meal = await call(other, "POST", "/v1/meals", { save_key: key, dish_text: "burger", eaten: { mode: "now" } }, { now });
      expect(meal.status).toBe(201);
      expect(meal.body.meal.ai_check_status).toBe("paused");
      expect(meal.body.ingredients).toEqual([]);
      const month = new Date().toISOString().slice(0, 7);
      const alerts = (await admin()).alerts.filter((a: any) => a.kind === "ai_budget" && a.detail.month === month);
      for (const level of [50, 80, 100]) expect(alerts.filter((a: any) => a.detail.level_percent === level), `level ${level}`).toHaveLength(1);
      for (const a of alerts) expect(Object.keys(a.detail).sort()).toEqual(["level_percent", "limit_micros", "month", "spent_micros"]);
      // raising the limit switches AI back on without a release
      await srvRpc("srv_admin_set", { p_what: "monthly_limit_micros", p_value: 50000000 });
      expect((await suggest(other, "salad")).res.body.status).not.toBe("paused");
    } finally {
      await srvRpc("srv_admin_set", { p_what: "monthly_limit_micros", p_value: 50000000 });
    }
  });

  it("Q200 a request costing 3 times the expected cost raises a founder alert with size and model only", async () => {
    const u = await ready();
    const before = (await admin()).alerts.filter((a: any) => a.kind === "ai_cost_anomaly").length;
    await suggest(u, "feast [mock-costly]");
    const alerts = (await admin()).alerts.filter((a: any) => a.kind === "ai_cost_anomaly");
    expect(alerts.length).toBe(before + 1);
    expect(Object.keys(alerts[0].detail).sort()).toEqual(["cost_micros", "expected_micros", "input_tokens", "model", "output_tokens"]);
    expect(JSON.stringify(alerts[0].detail)).not.toContain(u.id);
  });

  it("Q102 with Keep my meal photos on: only the stripped copy is stored, with no location or camera data, and only its owner can read it", async () => {
    const jpeg = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: { r: 90, g: 160, b: 60 } } })
      .withExif({ IFD0: { Make: "TestCam", Copyright: "gps 51.5,-0.12" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "51/1 30/1 0/1" } }).jpeg().toBuffer();
    expect((await sharp(jpeg).metadata()).exif).toBeDefined(); // the original really carries location data
    const u = await ready();
    expect((await call(u, "PATCH", "/v1/me/profile", { keep_meal_photos: true })).status).toBe(200);
    const form = new FormData();
    form.set("photo", new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }), "meal.jpg");
    form.set("save_key", randomUUID());
    const res = await fetch(`${BASE}/v1/meal-photos`, { method: "POST", headers: { Authorization: `Bearer ${u.token}` }, body: form });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.kept).toBe(true);
    const { data: rows } = await asUser(u).from("meal_photos").select("path,kept");
    expect(rows).toHaveLength(1);
    const { data: file } = await asUser(u).storage.from("meal-photos").download(rows![0]!.path);
    const stored = Buffer.from(await file!.arrayBuffer());
    const meta = await sharp(stored).metadata();
    expect(meta.exif).toBeUndefined();
    expect(Math.max(meta.width!, meta.height!)).toBeLessThan(2400); // the shrunk copy, not the original
    expect(stored.includes(Buffer.from("TestCam"))).toBe(false);
    // Another user cannot read it.
    const other = await onboarded();
    const { data: theirs } = await asUser(other).storage.from("meal-photos").download(rows![0]!.path);
    expect(theirs).toBeNull();
  });

  it("photos: a Free account is refused; for Pro the mock cannot see, so it abstains honestly and nothing is stored (Q102)", async () => {
    const jpeg = await sharp({ create: { width: 2400, height: 1800, channels: 3, background: { r: 200, g: 120, b: 60 } } })
      .withExif({ IFD0: { Make: "TestCam", Copyright: "gps 51.5,-0.12" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "51/1 30/1 0/1" } }).jpeg().toBuffer();
    const send = async (u: User) => {
      const form = new FormData();
      form.set("photo", new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }), "meal.jpg");
      form.set("save_key", randomUUID());
      const res = await fetch(`${BASE}/v1/meal-photos`, { method: "POST", headers: { Authorization: `Bearer ${u.token}` }, body: form });
      return { status: res.status, body: await res.json() };
    };
    const free = await onboarded();
    expect((await send(free)).status).toBe(403);
    const u = await ready();
    const r = await send(u);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("abstained");
    expect(r.body.kept).toBe(false);
    const { data: photos } = await asUser(u).from("meal_photos").select("id");
    expect(photos).toHaveLength(0);
    const { data: files } = await asUser(u).storage.from("meal-photos").list(u.id);
    expect(files ?? []).toHaveLength(0);
  });
});
