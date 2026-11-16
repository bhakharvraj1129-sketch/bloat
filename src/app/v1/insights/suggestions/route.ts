import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { focusOf, loadBundle, triggersOf } from "@/server/insights";

// Personal Focus cards and the next best log. Each says why it appeared and can be dismissed.
export const GET = route({ feature: "next_best_log" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const f = focusOf(b, triggersOf(b));
  return ok({ focus: f.cards, next_best_log: f.next });
});
