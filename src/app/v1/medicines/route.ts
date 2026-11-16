import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { optionValues } from "@/lib/registry";

const body = z.strictObject({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["medicine", "supplement"]),
  med_group: z.string().optional(),
  started_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  started_precision: z.enum(["exact", "approximate", "not_sure"]),
  note: z.string().trim().max(300).optional(),
});

// Medicines are a record only (free). Bloat never comments on medicines.
export const GET = route({ feature: "medicines" }, async (ctx) => {
  const [{ data: meds }, { data: changes }] = await Promise.all([
    ctx.db.from("medicines").select("*").eq("user_id", ctx.userId).order("created_at"),
    ctx.db.from("medicine_changes").select("*").eq("user_id", ctx.userId).order("created_at"),
  ]);
  return ok({ medicines: (meds ?? []).map((m) => ({ ...m, changes: (changes ?? []).filter((c) => c.medicine_id === m.id) })) });
});

export const POST = route({ body, mutation: true, feature: "medicines" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  if (b.med_group && !optionValues("MD-04").includes(b.med_group)) throw new ApiError(422, "VALIDATION", "Unknown medicine type.");
  if (b.started_on && b.started_on > u.today) throw new ApiError(422, "FUTURE_TIME", "That date is in the future.");
  const id = randomUUID();
  const row = { id, name: b.name, type: b.type, med_group: b.med_group ?? null, started_on: b.started_on ?? null, started_precision: b.started_precision, note: b.note ?? null };
  return ctx.commit([{ op: "insert", table: "medicines", row }], 201, { medicine: { ...row, changes: [] } });
});
