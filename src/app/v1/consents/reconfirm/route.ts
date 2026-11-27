import { z } from "zod";
import { route } from "@/server/http";
import { CONSENT_RECONFIRM, CONSENT_VERSION } from "@/lib/wording";

const TYPES = Object.keys(CONSENT_RECONFIRM) as Array<keyof typeof CONSENT_RECONFIRM>;

// Confirm again a required consent whose wording changed (D33, the rename to Bloat Buddy).
// Append-only: a new grant with the current version; the earlier grant stays in the record.
export const POST = route({ body: z.strictObject({ types: z.array(z.enum(TYPES as [string, ...string[]])).min(1).max(TYPES.length) }), mutation: true }, async (ctx) => {
  const granted_at = new Date(ctx.now).toISOString();
  const types = [...new Set(ctx.body.types)];
  return ctx.commit(types.map((type) => ({ op: "insert" as const, table: "consents", row: { type, version: CONSENT_VERSION, granted_at } })), 201, { types, version: CONSENT_VERSION, granted_at });
});
