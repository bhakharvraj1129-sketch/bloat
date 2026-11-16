import { z } from "zod";
import { route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { addDays } from "@/lib/time";
import { thresholds } from "@/lib/registry";

// "Not useful": hidden for 30 days, offered once more, then not again.
export const POST = route({ body: z.strictObject({ id: z.string().min(1).max(80), kind: z.enum(["next_best_log", "focus"]).default("next_best_log") }), mutation: true, feature: "next_best_log" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const rule = ctx.body.kind === "focus" ? ctx.body.id : `NBL:${ctx.body.id}`;
  const { data: prior } = await ctx.db.from("focus_state").select("dismiss_count").eq("user_id", ctx.userId).eq("rule", rule).maybeSingle();
  const until = addDays(u.today, thresholds.focus_dismiss_days);
  return ctx.commit(
    [{ op: "upsert", table: "focus_state", row: { rule, dismissed_until: until, dismiss_count: ((prior?.dismiss_count as number | undefined) ?? 0) + 1, updated_at: new Date(ctx.now).toISOString() }, conflict: ["user_id", "rule"] }],
    200, { rule, dismissed_until: until },
  );
});
