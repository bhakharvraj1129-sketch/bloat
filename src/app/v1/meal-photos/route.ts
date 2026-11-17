import { ApiError, ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { runCheck } from "@/server/ai/check";
import { hasAiConsent } from "@/server/meals";
import { preparePhoto } from "@/server/photo";
import { AI_FIXED_TEXT } from "@/lib/wording";

export const runtime = "nodejs";

// Pro: photo → dishes and ingredients. The photo is processed in memory and is not stored unless
// "Keep my meal photos" is on.
export const POST = route({ capability: "recording", feature: "meal_photos" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  if (!(await hasAiConsent(ctx.db, ctx.userId))) {
    throw new ApiError(403, "CONSENT_REQUIRED", "Agree to the AI ingredient check first.", { consent: "ai_meal" });
  }
  const form = await ctx.req.formData().catch(() => null);
  const file = form?.get("photo");
  const saveKey = String(form?.get("save_key") ?? "");
  if (!(file instanceof File) || saveKey.length < 8 || saveKey.length > 128) throw new ApiError(422, "VALIDATION", "Send a photo and a save key.");
  if (file.size > 12 * 1024 * 1024) throw new ApiError(422, "PHOTO_TOO_LARGE", "That photo is too large. Type the dish instead.");
  let prepared: Buffer | null;
  try {
    prepared = await preparePhoto(Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new ApiError(422, "PHOTO_UNREADABLE", "That photo could not be read. Type the dish instead.");
  }
  if (!prepared) {
    // Still over 2 MB after shrinking: not sent to the AI (plan 0.4).
    return ok({ status: "too_large", dishes: [], items: [], message: "That photo is too large to check. Type the dish instead.", kept: false, fixed_text: AI_FIXED_TEXT });
  }
  const result = await runCheck(ctx.db, ctx.userId, u.today, saveKey, "DISH_RECOGNITION_FROM_PHOTO", {
    image: { base64: prepared.toString("base64"), media_type: "image/jpeg" },
  });
  let kept = false;
  if (u.profile.keep_meal_photos) {
    const path = `${ctx.userId}/${saveKey}.jpg`;
    const up = await ctx.db.storage.from("meal-photos").upload(path, prepared, { contentType: "image/jpeg", upsert: true });
    kept = !up.error;
    if (kept) {
      const { tx } = await import("@/server/db");
      await tx(ctx.userId, [{ op: "insert", table: "meal_photos", row: { path, kept: true } }]);
    }
  }
  // Otherwise the photo only ever lived in memory and is gone when this request ends.
  return ok({ ...result, kept, fixed_text: AI_FIXED_TEXT });
});
