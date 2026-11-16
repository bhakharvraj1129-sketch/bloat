import { z } from "zod";
import { ApiError, notFound, route } from "@/server/http";
import { loadUser } from "@/server/userdata";

const body = z.strictObject({
  change: z.enum(["stopped", "dose_changed", "restarted"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  precision: z.enum(["exact", "approximate", "not_sure"]),
});

export const POST = route({ body, mutation: true, feature: "medicines" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const { data: med } = await ctx.db.from("medicines").select("id").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!med) notFound("Medicine");
  if (ctx.body.date && ctx.body.date > u.today) throw new ApiError(422, "FUTURE_TIME", "That date is in the future.");
  const row = { medicine_id: med!.id, change: ctx.body.change, date: ctx.body.date ?? null, date_precision: ctx.body.precision };
  return ctx.commit([{ op: "insert", table: "medicine_changes", row }], 201, { change: row });
});

