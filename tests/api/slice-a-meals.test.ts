import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { asUser, at, call, exact, NY, onboarded } from "./helpers";

const D = "2026-11-10";
const now = at(D, "15:00", NY);

describe("Slice A: basic meals (plan A11)", () => {
  it("a Free meal saves with ai_check_status free_plan and no ingredients", async () => {
    const u = await onboarded();
    const r = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "Chicken burrito with beans", eaten: { mode: "now" }, portion: "medium", pace: "quickly", origin: "restaurant_or_takeaway" }, { now });
    expect(r.status).toBe(201);
    expect(r.body.meal.ai_check_status).toBe("free_plan");
    expect(r.body.ingredients).toEqual([]);
    const { data } = await asUser(u).from("meal_ingredients").select("id");
    expect(data).toHaveLength(0);
  });

  it("Q97 a Free account sending ingredients or a photo source gets 403 and nothing is saved or sent to AI", async () => {
    const u = await onboarded();
    const key = randomUUID();
    const r = await call(u, "POST", "/v1/meals", { save_key: key, dish_text: "curry", eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "onion", answer: "had", kind: "added" }] }, { now });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("PLAN_REQUIRED");
    const s = await call(u, "POST", "/v1/food-suggestions", { save_key: key, dish_text: "curry" }, { now });
    expect(s.status).toBe(403);
    const { data: meals } = await asUser(u).from("meals").select("id");
    const { data: sugg } = await asUser(u).from("food_suggestions").select("id");
    expect(meals).toHaveLength(0);
    expect(sugg).toHaveLength(0);
  });

  it("Q67 a non-English food name is kept exactly as typed", async () => {
    const u = await onboarded("IN");
    const text = "सेव उसल with पाव – घर का";
    const r = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: text, eaten: { mode: "now", zone: "Asia/Kolkata" } }, { now });
    expect(r.status).toBe(201);
    const { data } = await asUser(u).from("meals").select("dish_text").single();
    expect(data!.dish_text).toBe(text);
  });

  it("dish text over 300 characters and future times are refused", async () => {
    const u = await onboarded();
    expect((await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "x".repeat(301), eaten: { mode: "now" } }, { now })).status).toBe(422);
    const f = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "soup", eaten: exact(D, "19:00") }, { now });
    expect(f.status).toBe(422);
    expect(f.body.error.code).toBe("FUTURE_TIME");
  });

  it("Q11 a day with a symptom answer but no meals keeps its score; meals count is zero", async () => {
    const u = await onboarded();
    await call(u, "PUT", `/v1/days/${D}/review`, { worst: 4, whole_day: "yes", food_coverage: "none_recorded" }, { now: at("2026-11-11", "08:00", NY) });
    const h = await call(u, "GET", `/v1/history?from=${D}&to=${D}`, undefined, { now: at("2026-11-11", "08:00", NY) });
    expect(h.body.days[0]).toMatchObject({ status: "CONFIRMED", score: 4, meals: 0, coverage: "NONE" });
  });

  it("edit needs If-Match; a stale revision is 409; delete removes the meal", async () => {
    const u = await onboarded();
    const r = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "toast", eaten: { mode: "now" } }, { now });
    const id = r.body.meal.id;
    const ok = await call(u, "PATCH", `/v1/meals/${id}`, { dish_text: "toast and jam" }, { now, ifMatch: 1 });
    expect(ok.status).toBe(200);
    expect(ok.body.meal.revision).toBe(2);
    expect((await call(u, "PATCH", `/v1/meals/${id}`, { dish_text: "x" }, { now, ifMatch: 1 })).status).toBe(409);
    expect((await call(u, "DELETE", `/v1/meals/${id}`, undefined, { now })).status).toBe(204);
    const { data } = await asUser(u).from("meals").select("id");
    expect(data).toHaveLength(0);
  });

  it("Q104 no meal answer contains a calorie or nutrient number", async () => {
    const u = await onboarded();
    const r = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "pizza", eaten: { mode: "now" } }, { now });
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now });
    for (const body of [r.body, day.body]) expect(JSON.stringify(body).toLowerCase()).not.toMatch(/calorie|kcal|protein|carb|nutrient|fat_g/);
  });
});
