import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError, notFound, route } from "@/server/http";
import { CONSENT_VERSION, DOWNLOAD_NOTE } from "@/lib/wording";

const body = z.strictObject({
  recipient: z.string().trim().min(1).max(120), purpose: z.string().trim().min(1).max(200),
  expires_in_days: z.number().int().min(1).max(30), consent: z.literal(true),
});

// Share a doctor report by link: a separate consent naming recipient, purpose and expiry.
// The link can be revoked at any time.
export const POST = route({ body, mutation: true, feature: "doctor_pdf" }, async (ctx) => {
  const { data: report } = await ctx.db.from("reports").select("id,kind,stale").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!report || report.kind !== "doctor") notFound("Report");
  if (report!.stale) throw new ApiError(409, "REPORT_STALE", "A record in this report changed. Make the report again before sharing it.");
  const token = randomBytes(32).toString("base64url");
  const id = randomUUID();
  const now = new Date(ctx.now).toISOString();
  const expires_at = new Date(ctx.now + ctx.body.expires_in_days * 86400000).toISOString();
  await ctx.commit([
    { op: "insert", table: "consents", row: { type: "doctor_share", version: CONSENT_VERSION, granted_at: now } },
    { op: "insert", table: "report_shares", row: { id, report_id: report!.id, token_hash: createHash("sha256").update(token).digest("hex"), recipient: ctx.body.recipient, purpose: ctx.body.purpose, expires_at, consent_at: now } },
  ], 201, { share_id: id, expires_at });
  // The link is shown once. Only its hash is stored.
  return { status: 201, data: { share_id: id, expires_at, url: `/share/${token}`, note: DOWNLOAD_NOTE } };
});

export const DELETE = route({ mutation: true }, async (ctx) => {
  const shareId = new URL(ctx.req.url).searchParams.get("share") ?? "";
  const { data } = await ctx.db.from("report_shares").select("id").eq("user_id", ctx.userId).eq("report_id", ctx.params.id!).eq("id", shareId).maybeSingle();
  if (!data) notFound("Share link");
  const at = new Date(ctx.now).toISOString();
  return ctx.commit([{ op: "update", table: "report_shares", match: { id: data!.id }, set: { revoked_at: at }, require: true }], 200, { share_id: data!.id, revoked_at: at, note: DOWNLOAD_NOTE });
});
