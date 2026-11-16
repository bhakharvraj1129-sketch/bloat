import { randomUUID } from "node:crypto";
import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { journeySnapshot, REPORT_VERSIONS } from "@/server/reports";
import { tx } from "@/server/db";
import { addDays } from "@/lib/time";
import { thresholds } from "@/lib/registry";

// Your journey (Pro). Free accounts get 403 and no preview of any finding.
export const GET = route({ feature: "your_journey" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const proSince = ctx.entitlement?.pro_since ?? null;
  const snapshot = await journeySnapshot(ctx.db, ctx.userId, u, ctx.now, proSince);
  // One stored snapshot per month, and one per quarter of Pro; earlier ones are never rewritten.
  const month = `${u.today.slice(0, 7)}-01`;
  const { data: have } = await ctx.db.from("reports").select("id,kind,range_from").eq("user_id", ctx.userId).in("kind", ["journey", "quarterly"]);
  const ops = [];
  if (!(have ?? []).some((r) => r.kind === "journey" && r.range_from === month)) {
    ops.push({ op: "insert" as const, table: "reports", row: { id: randomUUID(), kind: "journey", range_from: month, range_to: u.today, snapshot, versions: REPORT_VERSIONS } });
  }
  if (proSince) {
    const start = proSince.slice(0, 10);
    const quarters = Math.floor((Date.parse(u.today) - Date.parse(start)) / 86400000 / thresholds.quarterly_summary_days);
    for (let q = 1; q <= quarters; q++) {
      const from = addDays(start, (q - 1) * thresholds.quarterly_summary_days);
      if (!(have ?? []).some((r) => r.kind === "quarterly" && r.range_from === from)) {
        ops.push({ op: "insert" as const, table: "reports", row: { id: randomUUID(), kind: "quarterly", range_from: from, range_to: addDays(from, thresholds.quarterly_summary_days - 1), snapshot, versions: REPORT_VERSIONS } });
      }
    }
  }
  if (ops.length) await tx(ctx.userId, ops).catch(() => {});
  return ok({ ...snapshot, date_format: u.profile.date_format, doctor_report: { from: snapshot.from, to: snapshot.to } });
});
