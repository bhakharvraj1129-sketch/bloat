import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { BASE, call, proUser } from "./helpers";

// Defect X1 (26 Nov 2026). The plan (B04: "Export: all owner-visible records") was missing four tables
// the person can read: their report share links (who they shared with, why, until when), the
// ingredient suggestions saved for their dishes, the product events about their account, and their
// own export jobs. The hashes of link tokens stay out of the file.

describe("X1: the export holds every owner-visible record", () => {
  it("share links, saved ingredient suggestions, product events and export jobs are in the file; token hashes are not", async () => {
    const u = await proUser();
    await call(u, "POST", "/v1/consents", { type: "ai_meal" });
    const save_key = randomUUID();
    expect((await call(u, "POST", "/v1/food-suggestions", { save_key, dish_text: "cola" })).status).toBe(200);
    expect((await call(u, "POST", "/v1/meals", { save_key, dish_text: "cola", eaten: { mode: "now" }, mode: "marked", ingredients: [{ name: "cola", answer: "had", kind: "listed" }] })).status).toBe(201);
    const today = (await call(u, "GET", "/v1/me/state")).body.today.date as string;
    const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - 86400000).toISOString().slice(0, 10);
    const rep = await call(u, "POST", "/v1/reports", { kind: "doctor", from: yesterday, to: today });
    expect(rep.status, JSON.stringify(rep.body)).toBe(201);
    const share = await call(u, "POST", `/v1/reports/${rep.body.id}/shares`, { recipient: "Dr Export", purpose: "appointment", expires_in_days: 7, consent: true });
    expect(share.status).toBe(201);

    const job = await call(u, "POST", "/v1/export", { format: "json" });
    const file = await (await fetch(`${BASE}${job.body.download_url}`, { headers: { Authorization: `Bearer ${u.token}` } })).json();
    expect(file.schema_version).toBe("bloat-export-2");
    expect(file.tables.report_shares.map((s: { recipient: string; purpose: string }) => `${s.recipient}:${s.purpose}`)).toEqual(["Dr Export:appointment"]);
    expect(file.tables.food_suggestions.length).toBeGreaterThanOrEqual(1);
    expect(file.tables.product_events.length).toBeGreaterThanOrEqual(1);
    expect(file.tables.export_jobs.length).toBeGreaterThanOrEqual(1);
    for (const t of ["report_shares", "export_jobs"]) for (const row of file.tables[t]) expect(Object.keys(row), t).not.toContain("token_hash");
    expect(file.row_counts.report_shares).toBe(1);
  });
});
