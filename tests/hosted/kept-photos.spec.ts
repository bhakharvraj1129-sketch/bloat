import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PASSWORD, sessionFor, SUPABASE_KEY, SUPABASE_URL } from "./session";

// Kept meal photos on the PUBLIC preview, before the account is deleted (final round of 23 Nov).
// The "pro" account keeps two synthetic photos (plain colour squares). The run's operator then
// deletes the account through "Delete my account" (tests/hosted/delete-accounts.ts) and checks from
// the database that no photo is left. Uses only the labelled mock check: it checks first that the
// preview's ingredient check is the mock, so no paid AI call can be made.
const BASE = process.env.HOSTED_URL!;
test.beforeAll(() => { if (!BASE) throw new Error("Set HOSTED_URL"); });

test("hosted, signed in: a Pro account keeps two synthetic photos, stored in its own folder only", async () => {
  test.skip(!PASSWORD, "needs the run's synthetic accounts");
  const { token } = await sessionFor("pro");
  const auth = { Authorization: `Bearer ${token}` };
  const json = async (method: string, path: string, body?: unknown) => {
    const r = await fetch(`${BASE}${path}`, { method, headers: { ...auth, "content-type": "application/json", "idempotency-key": randomUUID() }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  expect((await json("POST", "/v1/consents", { type: "ai_meal" })).status).toBeLessThan(300);
  // The preview's check must be the labelled mock (no paid AI).
  const typed = await json("POST", "/v1/food-suggestions", { save_key: randomUUID(), dish_text: "toast" });
  expect(typed.status).toBe(200);
  expect(typed.body.provider_label).toBe("Test data (mock)");
  expect((await json("PATCH", "/v1/me/profile", { keep_meal_photos: true })).status).toBe(200);
  for (const colour of [{ r: 200, g: 140, b: 80 }, { r: 80, g: 140, b: 200 }]) {
    const jpeg = await sharp({ create: { width: 64, height: 64, channels: 3, background: colour } }).jpeg().toBuffer();
    const form = new FormData();
    form.set("photo", new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }), "synthetic.jpg");
    form.set("save_key", randomUUID());
    const res = await fetch(`${BASE}/v1/meal-photos`, { method: "POST", headers: auth, body: form });
    expect(res.status).toBe(200);
    expect((await res.json()).kept).toBe(true);
  }
  const me = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: auth } });
  const { data: user } = await me.auth.getUser(token);
  const { data: files, error } = await me.storage.from("meal-photos").list(user.user!.id);
  expect(error).toBeNull();
  expect(files).toHaveLength(2);
});
