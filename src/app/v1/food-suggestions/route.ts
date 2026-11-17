import { z } from "zod";
import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { runCheck } from "@/server/ai/check";
import { hasAiConsent } from "@/server/meals";
import { AI_FIXED_TEXT } from "@/lib/wording";

const body = z.strictObject({ save_key: z.string().min(8).max(128), dish_text: z.string().trim().min(1).max(300) });

// Pro: list bloating-related ingredients for a typed dish. Needs the CN-04 consent first.
// AI trouble is never an error here: the answer says what happened and the meal can still be saved.
export const POST = route({ capability: "recording", body, feature: "ai_ingredient_check" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  if (!(await hasAiConsent(ctx.db, ctx.userId))) {
    throw new ApiError(403, "CONSENT_REQUIRED", "Agree to the AI ingredient check first.", { consent: "ai_meal" });
  }
  const result = await runCheck(ctx.db, ctx.userId, u.today, ctx.body.save_key, "FOOD_GROUP_INGREDIENT_LIST", { dish_text: ctx.body.dish_text });
  return ok({ ...result, fixed_text: AI_FIXED_TEXT });
});
