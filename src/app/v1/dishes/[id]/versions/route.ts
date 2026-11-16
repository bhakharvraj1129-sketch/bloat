import { z } from "zod";
import { notFound, route } from "@/server/http";
import { deriveGroup } from "@/lib/food-keywords";

const body = z.strictObject({
  ingredients: z.array(z.strictObject({ name: z.string().trim().min(1).max(60), answer: z.enum(["had", "didnt_have", "not_sure"]) })).max(30),
  archived: z.boolean().optional(),
});

// A new version of a saved dish. It changes future meals only: meals already saved keep the
// ingredients they were saved with (test Q23).
export const POST = route({ body, mutation: true, feature: "saved_dishes" }, async (ctx) => {
  const { data: dish } = await ctx.db.from("saved_dishes").select("*").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!dish) notFound("Saved dish");
  const version = (dish!.current_version as number) + 1;
  const ingredients = ctx.body.ingredients.map((i) => ({ name: i.name.toLowerCase(), food_group: deriveGroup(i.name), answer: i.answer }));
  return ctx.commit([
    { op: "insert", table: "saved_dish_versions", row: { dish_id: dish!.id, version, ingredients, confirmed: true } },
    { op: "update", table: "saved_dishes", match: { id: dish!.id }, set: { current_version: version, archived: ctx.body.archived ?? false } },
  ], 201, { dish_id: dish!.id, version, ingredients });
});
