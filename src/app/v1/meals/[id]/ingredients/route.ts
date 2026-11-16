import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { checkStatusFor, getMeal, ingredientOps, ingredientsBody, loadSuggestion } from "@/server/meals";
import type { Op } from "@/server/db";

const body = z.strictObject({ ...ingredientsBody, recalled: z.boolean().optional() });

// Replace a meal's ingredient answers (Pro). Also used by the recalled check after upgrading.
export const PUT = route({ body, mutation: true, feature: "ai_ingredient_check" }, async (ctx) => {
  const m = await getMeal(ctx.db, ctx.userId, ctx.params.id!);
  const b = ctx.body;
  const mode = b.mode ?? "marked";
  const recalled = !!b.recalled;
  if (recalled && m.ai_check_status !== "free_plan" && m.ai_check_status !== "recalled") {
    throw new ApiError(422, "NOT_RECALLABLE", "Only meals saved on the Free plan can be filled in afterwards.");
  }
  const suggestion = await loadSuggestion(ctx.db, ctx.userId, m.save_key ?? "");
  const built = ingredientOps(m.id, mode, b.ingredients ?? [], suggestion, recalled);
  const status = checkStatusFor(mode, suggestion, (b.ingredients ?? []).some((i) => i.kind === "added"), recalled);
  const ops: Op[] = [
    { op: "delete", table: "meal_ingredients", match: { meal_id: m.id } },
    ...built.ops,
    { op: "update", table: "meals", match: { id: m.id }, set: { ai_check_status: status, revision: m.revision + 1 } },
  ];
  return ctx.commit(ops, 200, {
    meal_id: m.id, ai_check_status: status,
    ingredients: built.rows.map((r) => ({ name: r.name, food_group: r.food_group, answer: r.answer, source: r.source })),
  });
});
