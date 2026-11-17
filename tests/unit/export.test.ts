import { describe, expect, it } from "vitest";
import { buildExport, ExportIncomplete, EXPORT_TABLES } from "@/server/export";
import type { Db } from "@/server/supabase";

// A stand-in database that serves rows in key order, supports the keyset filters the export uses,
// and can be told to fail one read, so a failure on a later page can be tested.
function fakeDb(tables: Record<string, Record<string, unknown>[]>, failOn: { table: string; read: number } | null) {
  const reads: Record<string, number> = {};
  const db = {
    from(table: string) {
      const order: string[] = [];
      let gt: [string, string] | null = null;
      let or: string | null = null;
      const b = {
        select: () => b, eq: () => b,
        order: (k: string) => { order.push(k); return b; },
        gt: (k: string, v: string) => { gt = [k, v]; return b; },
        or: (f: string) => { or = f; return b; },
        limit: async (n: number) => {
          reads[table] = (reads[table] ?? 0) + 1;
          if (failOn && failOn.table === table && failOn.read === reads[table]) return { data: null, error: { message: "network" } };
          const cmp = (a: Record<string, unknown>, c: Record<string, unknown>) => { for (const k of order) { const x = String(a[k]), y = String(c[k]); if (x !== y) return x < y ? -1 : 1; } return 0; };
          let rows = [...(tables[table] ?? [])].sort(cmp);
          if (gt) { const [k, v] = gt; rows = rows.filter((r) => String(r[k]) > v); }
          if (or) {
            const m = /^(\w+)\.gt\."([^"]*)",and\(\w+\.eq\."([^"]*)",(\w+)\.gt\."([^"]*)"\)$/.exec(or)!;
            const [, k0, v0, , k1, v1] = m;
            rows = rows.filter((r) => String(r[k0!]) > v0! || (String(r[k0!]) === v0 && String(r[k1!]) > v1!));
          }
          return { data: rows.slice(0, n), error: null };
        },
      };
      return b;
    },
  };
  return db as unknown as Db;
}

const cards = Array.from({ length: 2345 }, (_, i) => ({ id: `id-${String(i).padStart(5, "0")}`, user_id: "u", card_id: "walk", date: `d${i}` }));
const signs = Array.from({ length: 30 }, (_, i) => ({ episode_id: `e${Math.floor(i / 3)}`, code: `c${i % 3}`, user_id: "u" }));

describe("data export", () => {
  it("a failed read on a later page fails the whole export instead of returning part of it; a retry returns every row exactly once", async () => {
    const data = { card_events: cards, warning_signs: signs };
    await expect(buildExport(fakeDb(data, { table: "card_events", read: 2 }), "u")).rejects.toBeInstanceOf(ExportIncomplete);
    await expect(buildExport(fakeDb(data, { table: "card_events", read: 3 }), "u")).rejects.toMatchObject({ table: "card_events", reason: "read_failed" });
    const ok = await buildExport(fakeDb(data, null), "u");
    expect(Object.keys(ok)).toEqual([...EXPORT_TABLES]);
    expect(ok.card_events).toHaveLength(2345);
    expect(new Set(ok.card_events!.map((r) => (r as { id: string }).id)).size).toBe(2345);
    expect(ok.card_events![0]).not.toHaveProperty("user_id");
  });

  it("two-column keys page correctly with small pages", async () => {
    const ok = await buildExport(fakeDb({ warning_signs: signs }, null), "u", 4);
    expect(ok.warning_signs!.map((r) => JSON.stringify(r))).toEqual(signs.map(({ user_id: _u, ...r }) => (void _u, JSON.stringify(r))));
  });
});
