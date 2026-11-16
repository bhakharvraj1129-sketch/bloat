import { ApiError, errorResponse } from "@/server/http";
import { bearerClient, cookieClient } from "@/server/supabase";
import { renderDoctorPdf } from "@/server/pdf/doctor";
import type { DoctorSnapshot } from "@/server/reports";

export const runtime = "nodejs";

// Download the doctor PDF. Once downloaded, a copy can't be recalled, and the app says so.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = crypto.randomUUID();
  const header = req.headers.get("authorization");
  const db = header?.toLowerCase().startsWith("bearer ") ? bearerClient(header.slice(7).trim()) : await cookieClient();
  const { data: auth } = header ? await db.auth.getUser(header.slice(7).trim()) : await db.auth.getUser();
  if (!auth?.user) return errorResponse(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."), requestId);
  const { data } = await db.from("reports").select("snapshot,kind,range_from,range_to").eq("user_id", auth.user.id).eq("id", id).maybeSingle();
  if (!data || data.kind !== "doctor") return errorResponse(new ApiError(404, "NOT_FOUND", "Report not found."), requestId);
  const pdf = await renderDoctorPdf(data.snapshot as DoctorSnapshot);
  return new Response(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="bloat-doctor-report-${data.range_from}-to-${data.range_to}.pdf"`, "cache-control": "no-store" },
  });
}
