import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { ANON, anon, asUser, at, BASE, call, exact, HELP_VERSION, newUser, NY, onboarded, onboardingBody, srvRpc, SUPABASE_URL } from "./helpers";

const D = "2026-11-10";
const now = at(D, "15:00", NY);

describe("Slice A: help page, onboarding and consents (plan A07, A17)", () => {
  it("the help page works without login and uses the country's emergency number", async () => {
    const us = await call(null, "GET", "/v1/help?country=US");
    expect(us.status).toBe(200);
    expect(us.body.sections[0].heading).toBe("Call 911 now if you have bloating with a swollen stomach and:");
    expect((await call(null, "GET", "/v1/help?country=IN")).body.sections[0].heading).toContain("Call 112 now");
  });

  it("Q38, Q63, Q64, Q130: an unknown country gets 'your local emergency number', never a guessed number", async () => {
    for (const c of ["FR", "ZZ", ""]) {
      const r = await call(null, "GET", `/v1/help?country=${c}`);
      expect(r.body.sections[0].heading).toBe("Call your local emergency number now if you have bloating with a swollen stomach and:");
      expect(JSON.stringify(r.body)).not.toMatch(/\b(911|112|999)\b/);
    }
  });

  it("Q93 the help page never says or implies all clear", async () => {
    const text = JSON.stringify((await call(null, "GET", "/v1/help?country=US")).body).toLowerCase();
    for (const phrase of ["all clear", "nothing to worry", "you are fine", "no warning signs", "not serious"]) expect(text).not.toContain(phrase);
  });

  it("Q92 onboarding stores the help-page acknowledgement with its version, consents with versions, and starts on Free (Q210)", async () => {
    const u = await onboarded("CA");
    const db = asUser(u);
    const { data: help } = await db.from("help_page_views").select("page_version,acknowledged");
    expect(help).toEqual([{ page_version: HELP_VERSION, acknowledged: true }]);
    const { data: consents } = await db.from("consents").select("type,version,granted_at").order("type");
    expect(consents!.map((c) => c.type)).toEqual(["health_data", "terms_privacy", "wellness_ack"]);
    expect(consents!.every((c) => c.version && c.granted_at)).toBe(true);
    const { data: ent } = await db.from("entitlements").select("plan,status,ends_at").single();
    expect(ent).toEqual({ plan: "free", status: "none", ends_at: null });
    const { data: profile } = await db.from("profiles").select("residence_country,units,date_format,analysis_time_zone").single();
    expect(profile).toEqual({ residence_country: "CA", units: "metric", date_format: "DD/MM", analysis_time_zone: "America/Toronto" });
    const bill = await call(u, "GET", "/v1/billing/entitlement");
    expect(bill.body).toMatchObject({ plan: "free", trial: null });
  });

  it("onboarding is refused without the help page, all three consents, or the 18+ answer", async () => {
    const u = await newUser();
    const noHelp = onboardingBody(); delete (noHelp as any).help;
    expect((await call(u, "POST", "/v1/onboarding/commit", noHelp)).status).toBe(422);
    expect((await call(u, "POST", "/v1/onboarding/commit", onboardingBody("US", { consents: ["terms_privacy", "health_data"] }))).status).toBe(422);
    const minor = await call(u, "POST", "/v1/onboarding/commit", onboardingBody("US", { age_18_or_older: "no" }));
    expect(minor.status).toBe(422);
    expect(minor.body.error.code).toBe("UNDER_18");
    const { data } = await asUser(u).from("profiles").select("user_id");
    expect(data).toHaveLength(0);
  });

  it("Q91 a country outside the launch wave is refused before any health answer is stored; the waitlist stores email and country only", async () => {
    const u = await newUser();
    const r = await call(u, "POST", "/v1/onboarding/commit", { ...onboardingBody(), country: "FR", answers: [{ question_id: "ON-11", value: ["gas"], answered_at: new Date().toISOString() }] });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe("CAPABILITY_OFF");
    const { data } = await asUser(u).from("question_responses").select("id");
    expect(data).toHaveLength(0);
    const before = (await srvRpc<any>("srv_admin_read", {})).waitlist_count;
    const w = await call(null, "POST", "/v1/waitlist", { email: `w-${randomUUID()}@example.com`, country: "France" });
    expect(w.status).toBe(201);
    expect((await srvRpc<any>("srv_admin_read", {})).waitlist_count).toBe(before + 1);
    expect((await call(null, "POST", "/v1/waitlist", { email: "x@example.com", country: "France", symptoms: ["gas"] })).status).toBe(422);
  });

  it("Q48 the onboarding commit is atomic and replays with the same key", async () => {
    const u = await newUser();
    const key = randomUUID();
    const body = onboardingBody("IN", {
      answers: [
        { question_id: "ON-06", value: "both", answered_at: "2026-11-10T10:00:00.000Z" },
        { question_id: "ON-07", skipped: true, answered_at: "2026-11-10T10:00:05.000Z" },
      ],
      followed: ["ACT-01", "ACT-08"], medicines: [{ name: "Iron", type: "supplement", med_group: "iron" }],
    });
    // A bad habit in the same request: nothing at all is stored.
    const bad = await call(u, "POST", "/v1/onboarding/commit", { ...body, followed: ["ACT-01", "ACT-11"] }, { key: randomUUID() });
    expect(bad.status).toBe(403);
    const { data: none } = await asUser(u).from("question_responses").select("id");
    expect(none).toHaveLength(0);
    expect((await call(u, "GET", "/v1/me/state")).body).toMatchObject({ onboarded: false });
    const a = await call(u, "POST", "/v1/onboarding/commit", body, { key });
    const b = await call(u, "POST", "/v1/onboarding/commit", body, { key });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    const db = asUser(u);
    const { data: answers } = await db.from("question_responses").select("question_id,status,value,answered_at").order("question_id");
    expect(answers).toEqual([
      { question_id: "ON-06", status: "answered", value: "both", answered_at: "2026-11-10T10:00:00+00:00" },
      { question_id: "ON-07", status: "skipped", value: null, answered_at: "2026-11-10T10:00:05+00:00" },
    ]);
    const { data: followed } = await db.from("followed_activities").select("activity_id");
    expect(followed).toHaveLength(2);
    const { data: meds } = await db.from("medicines").select("name,med_group");
    expect(meds).toEqual([{ name: "Iron", med_group: "iron" }]);
    const again = await call(u, "POST", "/v1/onboarding/commit", body, { key: randomUUID() });
    expect(again.status).toBe(409);
  });

  it("Q61 and Q90: US, Canada and India accounts run the same workflow; residence, time zone and units are stored separately", async () => {
    for (const c of ["US", "CA", "IN"] as const) {
      const u = await onboarded(c);
      const ep = await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now });
      const meal = await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "lunch", eaten: { mode: "now" } }, { now });
      expect([ep.status, meal.status]).toEqual([201, 201]);
    }
    const u = await newUser();
    await call(u, "POST", "/v1/onboarding/commit", { ...onboardingBody("IN"), time_zone: "America/Toronto", units: "us" });
    const { data } = await asUser(u).from("profiles").select("*").single();
    expect(data).toMatchObject({ residence_country: "IN", time_zone: "America/Toronto", analysis_time_zone: "America/Toronto", units: "us", date_format: "DD/MM" });
    expect(Object.keys(data!)).not.toContain("current_location");
  });

  it("Q06 changing the time zone shows a preview, starts from a stated date and never moves recorded days", async () => {
    const u = await onboarded("US");
    await call(u, "POST", "/v1/episodes", { strength: 5, started: exact(D, "23:30") }, { now: at(D, "23:45", NY) });
    const later = at("2026-11-12", "10:00", NY);
    const preview = await call(u, "PATCH", "/v1/me/profile", { analysis_time_zone: "Asia/Kolkata", preview: true }, { now: later });
    expect(preview.body.preview).toMatchObject({ from: "America/New_York", to: "Asia/Kolkata", history_moves: false, effective_from: "2026-11-13" });
    const { data: before } = await asUser(u).from("profiles").select("analysis_time_zone").single();
    expect(before!.analysis_time_zone).toBe("America/New_York");
    await call(u, "PATCH", "/v1/me/profile", { analysis_time_zone: "Asia/Kolkata" }, { now: later });
    // 23:30 New York on the 10th is 10:00 on the 11th in India; the record stays on the 10th.
    const day = await call(u, "GET", `/v1/days/${D}`, undefined, { now: at("2026-11-14", "10:00", NY) });
    expect(day.body.episodes).toHaveLength(1);
    const next = await call(u, "GET", "/v1/days/2026-11-11", undefined, { now: at("2026-11-14", "10:00", NY) });
    expect(next.body.episodes).toHaveLength(0);
  });

  it("Q74 an optional consent can be withdrawn and the diary stays; a required one cannot be withdrawn this way", async () => {
    const u = await onboarded();
    await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now });
    await call(u, "POST", "/v1/consents", { type: "ai_meal" });
    const w = await call(u, "DELETE", "/v1/consents/ai_meal");
    expect(w.status).toBe(200);
    const list = await call(u, "GET", "/v1/consents");
    expect(list.body.consents.find((c: any) => c.type === "ai_meal").withdrawn_at).toBeTruthy();
    expect((await call(u, "DELETE", "/v1/consents/health_data")).status).toBe(422);
    const { data } = await asUser(u).from("episodes").select("id");
    expect(data).toHaveLength(1);
    const { data: rows } = await asUser(u).from("consents").select("id").eq("type", "ai_meal");
    expect(rows).toHaveLength(2); // append-only: the grant and the withdrawal
  });
});

describe("Slice A: export, save status and account deletion (plan B04)", () => {
  it("export returns every owner-visible record as JSON and CSV; an expired or wrong link gives nothing (Q184)", async () => {
    const u = await onboarded();
    await call(u, "POST", "/v1/episodes", { strength: 6, started: { mode: "now" } }, { now });
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "export lunch", eaten: { mode: "now" } }, { now });
    const job = await call(u, "POST", "/v1/export", { format: "json" });
    expect(job.status).toBe(201);
    const res = await fetch(`${BASE}${job.body.download_url}`, { headers: { Authorization: `Bearer ${u.token}` } });
    expect(res.status).toBe(200);
    const file = await res.json();
    expect(file.schema_version).toBe("bloat-export-1");
    expect(file.tables.episodes).toHaveLength(1);
    expect(file.tables.meals[0].dish_text).toBe("export lunch");
    expect(file.tables.strength_samples[0].strength).toBe(6);
    expect(JSON.stringify(file)).not.toContain(u.id); // user id column is left out

    const csvJob = await call(u, "POST", "/v1/export", { format: "csv" });
    const csv = await (await fetch(`${BASE}${csvJob.body.download_url}`, { headers: { Authorization: `Bearer ${u.token}` } })).text();
    expect(csv).toContain("# table: meals");
    expect(csv).toContain("export lunch");

    // wrong token, no sign-in, another user, and an expired link all give nothing
    const bad = await fetch(`${BASE}/v1/export/${job.body.job}?token=wrong`, { headers: { Authorization: `Bearer ${u.token}` } });
    expect(bad.status).toBe(404);
    expect((await fetch(`${BASE}${job.body.download_url}`)).status).toBe(401);
    const other = await onboarded();
    expect((await fetch(`${BASE}${job.body.download_url}`, { headers: { Authorization: `Bearer ${other.token}` } })).status).toBe(404);
    await srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "update", table: "export_jobs", match: { id: job.body.job }, set: { expires_at: "2020-01-01T00:00:00Z" } }] });
    const expired = await fetch(`${BASE}${job.body.download_url}`, { headers: { Authorization: `Bearer ${u.token}` } });
    expect(expired.status).toBe(404);
    expect(await expired.text()).not.toContain("export lunch");
  });

  it("'check save status' reports whether a save key reached the server", async () => {
    const u = await onboarded();
    const key = randomUUID();
    expect((await call(u, "GET", `/v1/commands/${key}`)).body).toEqual({ saved: false });
    await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { key, now });
    const status = await call(u, "GET", `/v1/commands/${key}`);
    expect(status.body.saved).toBe(true);
    expect(status.body.response.episode.state).toBe("OPEN");
    const other = await onboarded();
    expect((await call(other, "GET", `/v1/commands/${key}`)).body).toEqual({ saved: false });
  });

  it("mutations without an Idempotency-Key are refused", async () => {
    const u = await onboarded();
    const res = await fetch(`${BASE}/v1/episodes`, { method: "POST", headers: { Authorization: `Bearer ${u.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ strength: 5, started: { mode: "now" } }) });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("IDEMPOTENCY_KEY_REQUIRED");
  });

  it("Q33, Q55, Q184: deleting an account removes every record and the sign-in; a restored backup is deleted again", async () => {
    const u = await onboarded();
    await call(u, "POST", "/v1/episodes", { strength: 6, started: { mode: "now" } }, { now });
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "last lunch", eaten: { mode: "now" } }, { now });
    expect((await call(u, "POST", "/v1/account/delete", { confirm: "delete" })).status).toBe(422);
    const del = await call(u, "POST", "/v1/account/delete", { confirm: "DELETE" });
    expect(del.status).toBe(200);
    // the old token no longer works anywhere
    expect((await call(u, "GET", "/v1/me/state")).status).toBe(401);
    expect((await call(u, "POST", "/v1/episodes", { strength: 5, started: { mode: "now" } }, { now })).status).toBe(401);
    const login = await anon().auth.signInWithPassword({ email: u.email, password: "synthetic-password-1" });
    expect(login.error).not.toBeNull();
    for (const t of ["profiles", "episodes", "meals", "strength_samples", "consents", "question_responses", "command_log"]) {
      const { data } = await asUser(u).from(t).select("*");
      expect(data ?? [], t).toEqual([]);
    }
    // a server write for the deleted account is refused, so a running job cannot recreate records
    await expect(srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "insert", table: "day_marks", row: { date: D, no_bloating_at: new Date().toISOString() } }] })).rejects.toThrow();
    // re-applying tombstones (run after a backup restore) finds nothing left to delete
    expect(await srvRpc<number>("srv_reapply_tombstones", {})).toBe(0);
  });

  it("a deleted account's earlier tokens: the app refuses them at once, Supabase refuses the user lookup and the refresh, and direct reads return nothing", async () => {
    const u = await onboarded();
    await call(u, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "token check toast", eaten: { mode: "now" } });
    // A second, separate session for the same account (another device), issued before the deletion.
    const { data: other } = await anon().auth.signInWithPassword({ email: u.email, password: "synthetic-password-1" });
    const access = other.session!.access_token, refresh = other.session!.refresh_token;
    const exp = JSON.parse(Buffer.from(access.split(".")[1]!, "base64url").toString()).exp as number;
    expect((await call(u, "POST", "/v1/account/delete", { confirm: "DELETE" })).status).toBe(200);
    expect(exp * 1000).toBeGreaterThan(Date.now() + 60_000); // the old token has not expired: what follows is the server refusing it
    // 1. The app checks every request with Supabase Auth: refused at once.
    expect((await call({ ...u, token: access }, "GET", "/v1/me/state")).status).toBe(401);
    expect((await call({ ...u, token: access }, "POST", "/v1/meals", { save_key: randomUUID(), dish_text: "after delete", eaten: { mode: "now" } })).status).toBe(401);
    // 2. Supabase Auth no longer knows the user, and the refresh token cannot make a new session.
    const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${access}` } });
    expect(who.status).toBeGreaterThanOrEqual(400);
    const renew = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }) });
    expect(renew.status).toBeGreaterThanOrEqual(400);
    // 3. A signed token is still well-formed until it expires, so direct database reads are not refused
    //    by the token check itself; they return nothing because every row went with the account, and
    //    the database never accepts writes from signed-in users.
    const rest = await fetch(`${SUPABASE_URL}/rest/v1/meals?select=id`, { headers: { apikey: ANON, Authorization: `Bearer ${access}` } });
    const rows = rest.ok ? await rest.json() : [];
    expect(rows).toEqual([]);
    const write = await fetch(`${SUPABASE_URL}/rest/v1/meals`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${access}`, "Content-Type": "application/json" }, body: JSON.stringify({ dish_text: "x" }) });
    expect(write.ok).toBe(false);
    console.log(`deleted-account token: app 401; auth/v1/user ${who.status}; refresh ${renew.status}; rest read ${rest.status} with ${rows.length} rows; rest write ${write.status}`);
  });
});
