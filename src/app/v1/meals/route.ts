import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { loadUser, resolveTime } from "@/server/userdata";
import { timeInput } from "@/server/schemas";
import type { Op } from "@/server/db";
import { checkStatusFor, ingredientOps, ingredientsBody, loadSuggestion } from "@/server/meals";

const body = z.strictObject({
  save_key: z.string().min(8).max(128),
  dish_text: z.string().trim().min(1).max(300),
  eaten: timeInput,
  portion: z.enum(["small", "medium", "large", "not_sure"]).optional(),
  amount: z.strictObject({ count: z.number().positive().max(10000), unit: z.enum(["slices", "pieces", "cups", "bowls", "plates", "cans_or_bottles", "fl_oz", "ml"]) }).optional(),
  pace: z.enum(["slowly", "usual_pace", "quickly", "not_sure", "skip"]).optional(),
  origin: z.enum(["home", "restaurant_or_takeaway", "someone_else_s_home", "other", "not_sure", "skip"]).optional(),
  source: z.enum(["typed", "photo", "recent", "saved_dish"]).default("typed"),
  saved_dish_id: z.uuid().optional(),
  ...ingredientsBody,
});

// Save a meal (plan A11). Meals always save: Free saves the basic fields; Pro adds ingredients.
// Whatever happened to the AI check, this route never fails because of it.
export const POST = route({ capability: "recording", body, mutation: true, feature: "meals_basic" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = ctx.body;
  const wantsPro = b.mode !== undefined || b.ingredients !== undefined || b.save_as_dish !== undefined || b.saved_dish_id !== undefined || b.source === "photo" || b.source === "saved_dish";
  if (wantsPro && ctx.plan !== "pro") throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Buddy Pro.");

  const { data: dup } = await ctx.db.from("meals").select("id").eq("user_id", ctx.userId).eq("save_key", b.save_key).maybeSingle();
  if (dup) throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "This meal was already saved.", { meal_id: dup.id });

  const t = resolveTime(b.eaten, u, ctx.now);
  const id = randomUUID();
  const ops: Op[] = [];
  let status = ctx.plan === "pro" ? "not_requested" : "free_plan";
  let rows: Array<Record<string, unknown>> = [];
  let savedDishConfirmed = false;

  if (ctx.plan === "pro") {
    if (b.saved_dish_id) {
      // A saved dish fills its ingredients in as saved (source saved_dish); they stay editable later.
      const { data: dish } = await ctx.db.from("saved_dishes").select("id,current_version").eq("user_id", ctx.userId).eq("id", b.saved_dish_id).maybeSingle();
      if (!dish) throw new ApiError(404, "NOT_FOUND", "Saved dish not found.");
      const { data: ver } = await ctx.db.from("saved_dish_versions").select("ingredients,confirmed").eq("user_id", ctx.userId).eq("dish_id", dish.id).eq("version", dish.current_version).maybeSingle();
      const list = (ver?.ingredients ?? []) as Array<{ name: string; food_group: string; answer: string }>;
      savedDishConfirmed = !!ver?.confirmed;
      rows = list.map((i) => ({ meal_id: id, name: i.name, food_group: i.food_group, answer: i.answer, source: "saved_dish", ai_listed: false }));
      status = "checked";
    } else {
      const suggestion = await loadSuggestion(ctx.db, ctx.userId, b.save_key);
      const mode = b.mode ?? (b.ingredients ? "marked" : undefined);
      if (mode) {
        rows = ingredientOps(id, mode, b.ingredients ?? [], suggestion, false).rows;
        status = checkStatusFor(mode, suggestion, (b.ingredients ?? []).some((i) => i.kind === "added"));
      } else if (suggestion && ["paused", "limited", "failed"].includes(suggestion.status)) {
        // The AI was paused, limited or failing: the meal saves with ingredients unknown.
        status = suggestion.status;
      }
    }
  }

  ops.push({
    op: "insert", table: "meals",
    row: {
      id, eaten_at: t.iso, zone: t.zone, offset_min: t.offset_min, time_precision: t.precision, dish_text: b.dish_text,
      portion: b.portion ?? null, amount_count: b.amount?.count ?? null, amount_unit: b.amount?.unit ?? null,
      pace: b.pace && b.pace !== "skip" ? b.pace : null, origin: b.origin && b.origin !== "skip" ? b.origin : null,
      source: b.saved_dish_id ? "saved_dish" : b.source, saved_dish_id: b.saved_dish_id ?? null, saved_dish_confirmed: savedDishConfirmed,
      ai_check_status: status, save_key: b.save_key,
    },
  });
  for (const row of rows) ops.push({ op: "insert", table: "meal_ingredients", row });

  let dishId: string | null = null;
  if (b.save_as_dish && rows.length) {
    // ML-12: keep the confirmed ingredients for one-tap reuse. A dish built from guesses or
    // unknowns is stored as not confirmed, so it never creates absence evidence.
    dishId = randomUUID();
    const confirmed = rows.every((r) => r.source !== "guess" && r.source !== "dont_know" && r.answer !== "unknown");
    ops.push({ op: "insert", table: "saved_dishes", row: { id: dishId, name: b.dish_text, place: b.save_as_dish.place ?? null, current_version: 1 } });
    ops.push({
      op: "insert", table: "saved_dish_versions",
      row: { dish_id: dishId, version: 1, confirmed, ingredients: rows.map((r) => ({ name: r.name, food_group: r.food_group, answer: r.answer })) },
    });
  }
  ops.push({ op: "insert", table: "product_events", row: { name: "meal_saved", props: { plan: ctx.plan, with_ingredients: rows.length > 0 } } });

  return ctx.commit(ops, 201, {
    meal: { id, eaten_at: t.iso, dish_text: b.dish_text, ai_check_status: status, revision: 1 },
    ingredients: rows.map((r) => ({ name: r.name, food_group: r.food_group, answer: r.answer, source: r.source })),
    saved_dish_id: dishId,
  });
});
