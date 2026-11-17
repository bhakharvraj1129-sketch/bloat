import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { addDays, asUser, BASE, call, logDay, onboarded, srvRpc, type User } from "./helpers";
import { buildExport } from "@/server/export";
import type { Db } from "@/server/supabase";

/** A small RFC 4180 reader, so quoted commas, quotes and line breaks are handled. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c;
  }
  row.push(cell); rows.push(row);
  return rows;
}

async function download(u: User, format: "json" | "csv") {
  const job = await call(u, "POST", "/v1/export", { format });
  expect(job.status).toBe(201);
  const res = await fetch(`${BASE}${job.body.download_url}`, { headers: { Authorization: `Bearer ${u.token}` } });
  expect(res.status).toBe(200);
  return { text: await res.text(), url: job.body.download_url as string };
}

const N = 1234;

describe("data export: complete, exactly once, JSON and CSV", () => {
  it(`${N} synthetic records come back exactly once in JSON and in CSV, with tricky text intact`, async () => {
    const u = await onboarded();
    const ids: string[] = [];
    const ops = Array.from({ length: N }, (_, i) => {
      const id = randomUUID(); ids.push(id);
      return { op: "insert", table: "card_events", row: { id, card_id: "walk", card_version: "1", date: addDays("2020-01-01", i), reason: `Note ${i}, with "quotes"\nand a second line` } };
    });
    for (let i = 0; i < ops.length; i += 400) await srvRpc("srv_tx", { p_user: u.id, p_ops: ops.slice(i, i + 400) });

    const json = JSON.parse((await download(u, "json")).text);
    expect(json.row_counts.card_events).toBe(N);
    const got = (json.tables.card_events as Array<{ id: string; reason: string }>);
    expect(got).toHaveLength(N);
    expect(new Set(got.map((r) => r.id)).size).toBe(N);
    expect([...got.map((r) => r.id)].sort()).toEqual([...ids].sort());
    expect(got.find((r) => r.reason.startsWith("Note 7,"))!.reason).toBe('Note 7, with "quotes"\nand a second line');
    expect(JSON.stringify(json)).not.toContain(u.id); // user_id is left out

    const csv = parseCsv((await download(u, "csv")).text);
    const start = csv.findIndex((r) => r[0] === `# table: card_events (${N} rows)`);
    expect(start).toBeGreaterThan(0);
    const header = csv[start + 1]!;
    const body: string[][] = [];
    for (let i = start + 2; i < csv.length && !(csv[i]!.length === 1 && (csv[i]![0] === "" || csv[i]![0]!.startsWith("# "))); i++) body.push(csv[i]!);
    expect(body).toHaveLength(N);
    const idCol = header.indexOf("id"), reasonCol = header.indexOf("reason");
    expect(new Set(body.map((r) => r[idCol])).size).toBe(N);
    expect(body.find((r) => r[reasonCol]!.startsWith("Note 7,"))![reasonCol]).toBe('Note 7, with "quotes"\nand a second line');
  }, 120000);

  it("reading every table in tiny pages (2 rows) gives the same result as one big read: one- and two-column keys page correctly", async () => {
    const u = await onboarded();
    for (let i = 0; i < 4; i++) await logDay(u, addDays("2026-09-01", i), { score: 4, episode: { start: "13:00", end: "14:00", strength: 5 }, meals: [{ time: "12:00", text: `meal ${i}` }, { time: "18:00", text: `dinner ${i}` }] });
    const eps = (await asUser(u).from("episodes").select("id")).data as Array<{ id: string }>;
    for (const e of eps) for (const code of ["vomiting", "fever"]) await srvRpc("srv_tx", { p_user: u.id, p_ops: [{ op: "insert", table: "warning_signs", row: { episode_id: e.id, code } }] });
    const db = asUser(u) as unknown as Db;
    const small = await buildExport(db, u.id, 2);
    const big = await buildExport(db, u.id);
    expect(small).toEqual(big);
    expect(small.warning_signs).toHaveLength(eps.length * 2);
    expect(small.meals).toHaveLength(8);
    expect(small.day_reviews!.length).toBeGreaterThanOrEqual(4);
  }, 120000);

  it("the download link still needs the owner: another account or no sign-in gets nothing", async () => {
    const u = await onboarded();
    const { url } = await download(u, "json");
    const other = await onboarded();
    expect((await fetch(`${BASE}${url}`, { headers: { Authorization: `Bearer ${other.token}` } })).status).toBe(404);
    expect((await fetch(`${BASE}${url}`)).status).toBe(401);
  });
});
