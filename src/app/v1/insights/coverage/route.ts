import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { loadBundle } from "@/server/insights";

// Coverage: how many days are confirmed, late, provisional, need correcting or have nothing.
export const GET = route({ feature: "possible_triggers" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const done = b.view.summaries.filter((s) => s.date < u.today);
  const count = (f: (s: (typeof done)[number]) => boolean) => done.filter(f).length;
  return ok({
    from: b.firstDay, to: b.input.to, days: done.length,
    confirmed: count((s) => s.status === "CONFIRMED"), late: count((s) => s.status === "LATE"), provisional: count((s) => s.status === "PROVISIONAL"),
    conflict: count((s) => s.status === "CONFLICT"), unknown: count((s) => s.status === "UNKNOWN"),
    food: { all: count((s) => s.coverage === "ALL"), mostly: count((s) => s.coverage === "MOSTLY"), some: count((s) => s.coverage === "SOME"), none: count((s) => s.coverage === "NONE"), unknown: count((s) => s.coverage === "UNKNOWN"), no_intake: count((s) => s.coverage === "NO_INTAKE") },
  });
});
