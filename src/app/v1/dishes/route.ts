import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ok, route } from "@/server/http";
import { deriveGroup } from "@/lib/food-keywords";

const ingredient = z.strictObject({ name: z.string().trim().min(1).max(60), answer: z.enum(["had", "didnt_have", "not_sure"]) });
const body = z.strictObject({
  name: z.string().trim().min(1).max(300),
  place: z.string().trim().max(80).optional(),
  ingredients: z.array(ingredient).max(30),
});

export const GET = route({ feature: "saved_dishes" }, async (ctx) => {
  const { data: dishes } = await ctx.db.from("saved_dishes").select("*").eq("user_id", ctx.userId).eq("archived", false).order("created_at", { ascending: false });
  const { data: versions } = await ctx.db.from("saved_dish_versions").select("*").eq("user_id", ctx.userId);
  return ok({
    dishes: (dishes ?? []).map((d) => ({
      ...d, ingredients: versions?.find((v) => v.dish_id === d.id && v.version === d.current_version)?.ingredients ?? [],
    })),
  });
});

export const POST = route({ body, mutation: true, feature: "saved_dishes" }, async (ctx) => {
  const id = randomUUID();
  const ingredients = ctx.body.ingredients.map((i) => ({ name: i.name.toLowerCase(), food_group: deriveGroup(i.name), answer: i.answer }));
  return ctx.commit([
    { op: "insert", table: "saved_dishes", row: { id, name: ctx.body.name, place: ctx.body.place ?? null, current_version: 1 } },
    { op: "insert", table: "saved_dish_versions", row: { dish_id: id, version: 1, ingredients, confirmed: true } },
  ], 201, { dish: { id, name: ctx.body.name, place: ctx.body.place ?? null, current_version: 1, ingredients } });
});
