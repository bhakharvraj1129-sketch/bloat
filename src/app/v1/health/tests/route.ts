import { randomUUID } from "node:crypto";
import { staleDoctorReportOps } from "@/server/meals";
import { z } from "zod";
import { notFound, route } from "@/server/http";

const TESTS = ["lactose_breath_test", "fructose_breath_test", "sibo_breath_test", "coeliac_blood_test", "full_blood_count", "anaemia_found", "ca125_blood_test", "ultrasound", "endoscopy", "colonoscopy", "transit_study", "anorectal_manometry", "other"] as const;
const body = z.strictObject({
  test: z.enum(TESTS), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), date_precision: z.enum(["exact", "approximate", "not_sure"]).optional(),
  result_text: z.string().trim().max(200).optional(),
});

// HC-04: tests the user has had, with the result as the doctor wrote it. Shown in the doctor PDF.
export const POST = route({ body, mutation: true, feature: "health_background" }, async (ctx) => {
  const row = { id: randomUUID(), test: ctx.body.test, date: ctx.body.date ?? null, date_precision: ctx.body.date_precision ?? (ctx.body.date ? "exact" : "not_sure"), result_text: ctx.body.result_text ?? null };
  return ctx.commit([{ op: "insert", table: "health_tests", row }], 201, { test: row });
});

export const DELETE = route({ mutation: true, feature: "health_background" }, async (ctx) => {
  const id = new URL(ctx.req.url).searchParams.get("id") ?? "";
  const { data } = await ctx.db.from("health_tests").select("id").eq("user_id", ctx.userId).eq("id", id).maybeSingle();
  if (!data) notFound("Test");
  // A deleted test also flags stored doctor reports and revokes their share links (plan B05).
  return ctx.commit([{ op: "delete", table: "health_tests", match: { id: data!.id }, require: true }, ...(await staleDoctorReportOps(ctx.db, ctx.userId))], 204, null);
});
