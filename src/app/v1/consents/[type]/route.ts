import { ApiError, route } from "@/server/http";
import { CONSENT_VERSION } from "@/lib/wording";

const OPTIONAL = ["ai_meal", "email", "research", "doctor_share"];

// Withdraw an optional consent. Optional processing stops; the diary is never deleted by this.
export const DELETE = route({ mutation: true }, async (ctx) => {
  const type = ctx.params.type!;
  if (!OPTIONAL.includes(type)) {
    throw new ApiError(422, "REQUIRED_CONSENT", "This agreement is needed to use Bloat. To withdraw it, delete your account in Me.");
  }
  const at = new Date(ctx.now).toISOString();
  const ops = [{ op: "insert" as const, table: "consents", row: { type, version: CONSENT_VERSION, withdrawn_at: at } }];
  // Withdrawing doctor sharing revokes every live share link.
  const extra = type === "doctor_share"
    ? [{ op: "update" as const, table: "report_shares", match: { user_id: ctx.userId }, set: { revoked_at: at } }]
    : [];
  return ctx.commit([...ops, ...extra], 200, { type, withdrawn_at: at });
});
