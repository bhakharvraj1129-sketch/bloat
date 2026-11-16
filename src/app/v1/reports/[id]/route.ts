import { notFound, ok, route } from "@/server/http";

// Stored reports stay readable after a downgrade: past owned data is never locked away.
export const GET = route({}, async (ctx) => {
  const { data } = await ctx.db.from("reports").select("*").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!data) notFound("Report");
  const { data: shares } = await ctx.db.from("report_shares").select("id,recipient,purpose,expires_at,revoked_at,created_at").eq("user_id", ctx.userId).eq("report_id", data!.id).order("created_at", { ascending: false });
  return ok({ ...data, user_id: undefined, shares: shares ?? [], pdf_url: data!.kind === "doctor" ? `/v1/reports/${data!.id}/pdf` : null });
});

export const DELETE = route({ mutation: true }, async (ctx) => {
  const { data } = await ctx.db.from("reports").select("id").eq("user_id", ctx.userId).eq("id", ctx.params.id!).maybeSingle();
  if (!data) notFound("Report");
  return ctx.commit([{ op: "delete", table: "reports", match: { id: data!.id }, require: true }], 204, null);
});
