import { createHash } from "node:crypto";
import { ApiError, errorResponse } from "@/server/http";
import { buildExport, EXPORT_SCHEMA_VERSION, toCsv } from "@/server/export";
import { cookieClient, bearerClient } from "@/server/supabase";

// The download needs both the signed-in owner and an unexpired link. An expired link gives nothing.
export async function GET(req: Request, { params }: { params: Promise<{ job: string }> }) {
  const { job } = await params;
  const requestId = crypto.randomUUID();
  const header = req.headers.get("authorization");
  const db = header?.toLowerCase().startsWith("bearer ") ? bearerClient(header.slice(7).trim()) : await cookieClient();
  const { data: auth } = header ? await db.auth.getUser(header.slice(7).trim()) : await db.auth.getUser();
  if (!auth?.user) return errorResponse(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."), requestId);
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const { data: row } = await db.from("export_jobs").select("*").eq("user_id", auth.user.id).eq("id", job).maybeSingle();
  const valid = row && row.token_hash === createHash("sha256").update(token).digest("hex") && Date.parse(row.expires_at) > Date.now();
  if (!valid) return errorResponse(new ApiError(404, "NOT_FOUND", "This download link has expired. Ask for a new one in Me."), requestId);
  const data = await buildExport(db, auth.user.id);
  const stamp = new Date().toISOString().slice(0, 10);
  if (row.format === "csv") {
    return new Response(toCsv(data), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bloat-data-${stamp}.csv"`, "cache-control": "no-store" },
    });
  }
  return new Response(JSON.stringify({ schema_version: EXPORT_SCHEMA_VERSION, exported_at: new Date().toISOString(), tables: data }, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="bloat-data-${stamp}.json"`, "cache-control": "no-store" },
  });
}
