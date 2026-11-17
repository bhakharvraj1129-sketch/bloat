// Helpers for API tests. They run against the built app (BASE) and the LOCAL Supabase stack with
// synthetic accounts only.
import { createClient } from "@supabase/supabase-js";
import { randomUUID, createHmac } from "node:crypto";

export const BASE = process.env.BLOAT_BASE_URL ?? "http://127.0.0.1:3100";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
export const SERVER_SECRET = process.env.BLOAT_SERVER_SECRET ?? "local-dev-server-secret-not-for-hosted-use";
export const BILLING_SECRET = process.env.BLOAT_BILLING_WEBHOOK_SECRET ?? "local-billing-secret";

export type User = { id: string; email: string; token: string; now?: string };
export type Res<T = any> = { status: number; body: T; headers: Headers };

export const anon = () => createClient(SUPABASE_URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
export const asUser = (u: User) =>
  createClient(SUPABASE_URL, ANON, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${u.token}` } } });

export async function newUser(): Promise<User> {
  const email = `t-${randomUUID()}@example.com`;
  const { data, error } = await anon().auth.signUp({ email, password: "synthetic-password-1" });
  if (error || !data.session || !data.user) throw new Error(`signUp failed: ${error?.message}`);
  return { id: data.user.id, email, token: data.session.access_token };
}

type CallOpts = { key?: string; ifMatch?: number; now?: string; token?: string | null; raw?: string; headers?: Record<string, string> };

export async function call<T = any>(u: User | null, method: string, path: string, body?: unknown, opts: CallOpts = {}): Promise<Res<T>> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  const token = opts.token === undefined ? u?.token : opts.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (method !== "GET") headers["Idempotency-Key"] = opts.key ?? randomUUID();
  if (opts.ifMatch !== undefined) headers["If-Match"] = String(opts.ifMatch);
  const now = opts.now ?? u?.now;
  if (now) headers["x-bloat-test-now"] = now;
  let payload: string | undefined;
  if (opts.raw !== undefined) { payload = opts.raw; headers["Content-Type"] = "application/json"; }
  else if (body !== undefined) { payload = JSON.stringify(body); headers["Content-Type"] = "application/json"; }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  let parsed: any = null;
  const text = await res.text();
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed as T, headers: res.headers };
}

export const HELP_VERSION = "nhs-bloating-2026-11-07";

export function onboardingBody(country: "US" | "CA" | "IN" = "US", extra: Record<string, unknown> = {}) {
  const zone = country === "IN" ? "Asia/Kolkata" : country === "CA" ? "America/Toronto" : "America/New_York";
  return {
    age_18_or_older: "yes", country, time_zone: zone, units: country === "US" ? "us" : "metric",
    help: { viewed_at: new Date().toISOString(), page_version: HELP_VERSION },
    consents: ["terms_privacy", "health_data", "wellness_ack"],
    answers: [], medicines: [], followed: [], ...extra,
  };
}

export async function onboarded(country: "US" | "CA" | "IN" = "US", extra: Record<string, unknown> = {}): Promise<User> {
  const u = await newUser();
  const r = await call(u, "POST", "/v1/onboarding/commit", onboardingBody(country, extra));
  if (r.status !== 201) throw new Error(`onboarding failed: ${r.status} ${JSON.stringify(r.body)}`);
  return u;
}

export async function makePro(u: User, interval: "monthly" | "three_month" | "annual" = "three_month", cardCountry?: string): Promise<Res> {
  const r = await call(u, "POST", "/v1/billing/mock-purchase", { interval, ...(cardCountry ? { card_country: cardCountry } : {}) });
  if (r.status !== 200) throw new Error(`mock purchase failed: ${r.status} ${JSON.stringify(r.body)}`);
  return r;
}

export async function proUser(country: "US" | "CA" | "IN" = "US", extra: Record<string, unknown> = {}): Promise<User> {
  const u = await onboarded(country, extra);
  await makePro(u);
  return u;
}

export async function webhook(event: Record<string, unknown>, secret = BILLING_SECRET): Promise<Res> {
  const raw = JSON.stringify(event);
  const sig = createHmac("sha256", secret).update(raw).digest("hex");
  const res = await fetch(`${BASE}/v1/billing/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "x-bloat-signature": sig }, body: raw });
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}

/** Server-secret RPC for test setup and for checking server-only tables. */
export async function srvRpc<T = any>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await anon().rpc(fn, { p_secret: SERVER_SECRET, ...args });
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

/** Local wall-clock helpers in a zone, for fixed-clock tests. */
export function at(date: string, time: string, offset: string): string {
  return new Date(`${date}T${time}:00${offset}`).toISOString();
}
export const NY = "-05:00"; // America/New_York in winter
export const exact = (date: string, time: string, zone = "America/New_York") => ({ mode: "exact", local: `${date}T${time}`, zone });

/**
 * Log one finished day through the real API with a fixed clock: optional episode and meals on the
 * day, then a timely review the next morning.
 */
export async function logDay(u: User, date: string, o: {
  score: number; coverage?: string; whole?: string; episode?: { start: string; end: string; strength: number };
  meals?: Array<{ time: string; text: string; origin?: string; mode?: string; ingredients?: Array<{ name: string; answer: string; kind: string }>; portion?: string }>;
  habits?: Record<string, string>; watched?: Record<string, string>; reviewAt?: string; taps?: string[];
}) {
  const next = new Date(new Date(`${date}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
  const evening = at(date, "23:30", NY);
  if (o.episode) {
    const s = await call(u, "POST", "/v1/episodes", { strength: o.episode.strength, started: exact(date, o.episode.start) }, { now: evening });
    if (s.status !== 201) throw new Error(`episode: ${JSON.stringify(s.body)}`);
    const e = await call(u, "POST", `/v1/episodes/${s.body.episode.id}/end`, { ended: exact(date, o.episode.end) }, { now: evening });
    if (e.status !== 200) throw new Error(`end: ${JSON.stringify(e.body)}`);
  }
  for (const m of o.meals ?? []) {
    const save_key = randomUUID();
    if (m.ingredients || m.mode) {
      // Test setup only: many days are logged in seconds, so earlier synthetic checks are aged to
      // keep the real per-hour and per-day limits (tested on their own) out of the way.
      await srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "update", table: "ai_usage", match: { purpose: "FOOD_GROUP_INGREDIENT_LIST" }, set: { at: "2026-01-01T00:00:00Z", local_day: "2026-01-01" } }] });
      const s = await call(u, "POST", "/v1/food-suggestions", { save_key, dish_text: m.text }, { now: evening });
      if (s.status !== 200) throw new Error(`suggest: ${JSON.stringify(s.body)}`);
    }
    const r = await call(u, "POST", "/v1/meals", {
      save_key, dish_text: m.text, eaten: exact(date, m.time), ...(m.origin ? { origin: m.origin } : {}), ...(m.portion ? { portion: m.portion } : {}),
      ...(m.mode ? { mode: m.mode } : {}), ...(m.ingredients ? { ingredients: m.ingredients } : {}),
    }, { now: evening });
    if (r.status !== 201) throw new Error(`meal: ${JSON.stringify(r.body)}`);
  }
  if (o.taps?.length) {
    const r = await call(u, "PUT", `/v1/days/${date}/activities`, { taps: o.taps.map((activity_id) => ({ activity_id })) }, { now: evening });
    if (r.status !== 200) throw new Error(`taps: ${JSON.stringify(r.body)}`);
  }
  const r = await call(u, "PUT", `/v1/days/${date}/review`, {
    worst: o.score, whole_day: o.whole ?? "yes", food_coverage: o.coverage ?? "all",
    ...(o.habits ? { habits: o.habits } : {}), ...(o.watched ? { watched: o.watched } : {}),
  }, { now: o.reviewAt ?? at(next, "08:00", NY) });
  if (r.status !== 200) throw new Error(`review ${date}: ${JSON.stringify(r.body)}`);
  return r.body;
}

export function addDays(date: string, n: number): string {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
}
