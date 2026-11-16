import { z } from "zod";
import { route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { addDays } from "@/lib/time";
import { doctorLine } from "@/lib/registry";

// DN-01 "I've spoken to a doctor about this": the doctor line is shortened to one sentence for 90 days.
export const POST = route({ body: z.strictObject({ response: z.literal("i_ve_spoken_to_a_doctor_about_this") }), mutation: true, feature: "doctor_line" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const until = addDays(u.today, doctorLine.spoken_to_doctor_shortens_days);
  return ctx.commit(
    [{ op: "upsert", table: "nudge_state", row: { doctor_paused_until: until, reason: "spoken_to_doctor", updated_at: new Date(ctx.now).toISOString() }, conflict: ["user_id"] }],
    200, { shortened_until: until },
  );
});
