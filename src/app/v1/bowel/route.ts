import { randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { timeInput, yesNoNotSure } from "@/server/schemas";
import { optionValues } from "@/lib/registry";

const looks = optionValues("BW-02").filter((v) => v !== "skip") as [string, ...string[]];
const body = z.strictObject({ occurred: timeInput, stool_type: z.enum(looks).optional(), strain: yesNoNotSure.optional(), complete: yesNoNotSure.optional() });

// Bowel log (Pro). Stored exactly as described; never labelled and never alerted on.
export const POST = route({ capability: "recording", body, mutation: true, feature: "bowel_log" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const t = resolveTime(ctx.body.occurred, u, ctx.now);
  const id = randomUUID();
  const row = {
    id, occurred_at: t.iso, zone: t.zone, offset_min: t.offset_min, time_precision: t.precision,
    stool_type: ctx.body.stool_type ?? null, strain: ctx.body.strain ?? null, complete: ctx.body.complete ?? null,
  };
  return ctx.commit([{ op: "insert", table: "bowel_movements", row }], 201, { bowel_movement: row });
});
