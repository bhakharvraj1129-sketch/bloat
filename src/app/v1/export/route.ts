import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { route } from "@/server/http";

// Download my data (free, never blocked by plan, country or consent). The link works for 15 minutes.
export const POST = route({ body: z.strictObject({ format: z.enum(["json", "csv"]) }), mutation: true }, async (ctx) => {
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const expires_at = new Date(ctx.now + 15 * 60_000).toISOString();
  await ctx.commit([
    { op: "insert", table: "export_jobs", row: { id, format: ctx.body.format, status: "ready", token_hash: createHash("sha256").update(token).digest("hex"), expires_at } },
    { op: "insert", table: "audit_log", row: { action: "export_requested", meta: { format: ctx.body.format } } },
  ], 201, { job: id, format: ctx.body.format, expires_at });
  // The token is returned once and never stored, so a replayed request cannot leak it.
  return { status: 201, data: { job: id, format: ctx.body.format, expires_at, download_url: `/v1/export/${id}?token=${token}` } };
});
