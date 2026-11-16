import { z } from "zod";
import { ok, route } from "@/server/http";
import { CONSENT_VERSION } from "@/lib/wording";

const OPTIONAL = ["ai_meal", "email", "research", "doctor_share"] as const;

export const GET = route({}, async (ctx) => {
  const { data } = await ctx.db.from("consents").select("type,version,granted_at,withdrawn_at,created_at").eq("user_id", ctx.userId).order("created_at");
  const latest: Record<string, unknown> = {};
  for (const c of data ?? []) latest[c.type as string] = c;
  return ok({ consents: Object.values(latest) });
});

// Grant an optional consent (versioned, append-only).
export const POST = route({ body: z.strictObject({ type: z.enum(OPTIONAL) }), mutation: true }, async (ctx) => {
  const granted_at = new Date(ctx.now).toISOString();
  return ctx.commit([{ op: "insert", table: "consents", row: { type: ctx.body.type, version: CONSENT_VERSION, granted_at } }], 201, { type: ctx.body.type, version: CONSENT_VERSION, granted_at });
});
