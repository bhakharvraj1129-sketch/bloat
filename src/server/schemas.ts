import { z } from "zod";

export const timeInput = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("now"), zone: z.string().max(64).optional() }),
  z.strictObject({
    mode: z.enum(["exact", "approximate"]),
    local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    offset_min: z.number().int().min(-840).max(840).optional(),
    zone: z.string().max(64).optional(),
  }),
]);

export const strength = z.number().int().min(1).max(10);
export const uuid = z.uuid();
export const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const yesNoNotSure = z.enum(["yes", "no", "not_sure"]);

export function ifMatch(req: Request): number | null {
  const h = req.headers.get("if-match");
  if (!h) return null;
  const n = Number(h.replace(/"/g, ""));
  return Number.isInteger(n) ? n : null;
}
