import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z, type ZodType } from "zod";
import { bearerClient, cookieClient, type Db } from "./supabase";
import { DbError, tx, type Op } from "./db";
import { isProFeature, type FeatureKey } from "@/lib/registry";
import { effectivePlan, type Entitlement } from "@/lib/domain/plan";
import { env } from "./env";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export type Result = { status: number; data: unknown };

export type Ctx<B> = {
  req: Request;
  params: Record<string, string>;
  requestId: string;
  userId: string;
  db: Db;
  body: B;
  plan: "free" | "pro";
  entitlement: Entitlement | null;
  now: number;
  /** Commit writes and the idempotency record together, then answer. */
  commit: (ops: Op[], status: number, data: unknown) => Promise<Result>;
};

type Options<B> = {
  auth?: boolean;
  body?: ZodType<B>;
  /** Feature key from the configuration. Pro features answer 403 PLAN_REQUIRED for Free accounts. */
  feature?: FeatureKey;
  /** Mutations must send Idempotency-Key. */
  mutation?: boolean;
  /** Country capability this route needs. Checked on every request, so a pause takes effect at once. */
  capability?: Capability;
};

export type Capability = "recording" | "payments";
const CAPABILITY_OFF: Record<Capability, string> = {
  recording: "New entries are paused in your country for now. You can still read, export and delete your records.",
  payments: "Bloat Pro can't be bought in your country for now. Nothing has been charged.",
};

/** A capability is off for a country when the founder has suspended or retired it there. */
async function assertCapability(db: Db, userId: string, capability: Capability): Promise<void> {
  const { data: profile } = await db.from("profiles").select("residence_country").eq("user_id", userId).maybeSingle();
  const country = (profile as { residence_country?: string } | null)?.residence_country;
  if (!country) return; // not set up yet: onboarding decides which countries can start
  const { data, error } = await db.from("country_capabilities").select("status").eq("country", country).eq("feature", capability).maybeSingle();
  const status = (data as { status?: string } | null)?.status;
  // Fail closed: if the status cannot be read, the capability is treated as off.
  if (error || status === "suspended" || status === "retired") throw new ApiError(403, "CAPABILITY_OFF", CAPABILITY_OFF[capability]);
}

function json(status: number, data: unknown, requestId: string): Response {
  return Response.json(data, { status, headers: { "x-request-id": requestId, "cache-control": "no-store" } });
}

export function errorResponse(e: ApiError, requestId: string): Response {
  return json(e.status, { error: { code: e.code, message: e.message, details: e.details ?? null }, request_id: requestId }, requestId);
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

type Who = { userId: string; db: Db; email: string | null };
const confirmedEmail = (u: { email?: string | null; email_confirmed_at?: string | null }) => (u.email && u.email_confirmed_at ? u.email.toLowerCase() : null);

async function authenticate(req: Request): Promise<Who | null> {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    const db = bearerClient(token);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, db, email: confirmedEmail(data.user) };
  }
  const db = await cookieClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  return { userId: data.user.id, db, email: confirmedEmail(data.user) };
}

/**
 * Designated test accounts (BLOAT_PRO_TEST_EMAILS) get Pro without any purchase, so Pro screens
 * can be tested while payments and the mock purchase are off. Decided on the server only, and
 * only for a confirmed email address (the person proved they read that mailbox).
 */
export function isProTestAccount(email: string | null): boolean {
  if (!email) return false;
  return env.proTestEmails.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email);
}

async function loadEntitlement(db: Db, userId: string): Promise<Entitlement | null> {
  const { data, error } = await db.from("entitlements").select("*").eq("user_id", userId).maybeSingle();
  if (error) return null; // fail closed: an unreadable entitlement is treated as Free
  return (data as Entitlement | null) ?? null;
}

type Handler<B> = (ctx: Ctx<B>) => Promise<Result>;
type NextCtx = { params: Promise<Record<string, string>> };

export function route<B = undefined>(opts: Options<B>, handler: Handler<B>) {
  return async (req: Request, nextCtx: NextCtx): Promise<Response> => {
    const requestId = randomUUID();
    try {
      const params = (await nextCtx.params) ?? {};
      const needAuth = opts.auth !== false;
      const who = needAuth ? await authenticate(req) : null;
      if (needAuth && !who) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");

      let raw: unknown = undefined;
      let rawText = "";
      if (opts.body) {
        rawText = await req.text();
        try {
          raw = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new ApiError(422, "VALIDATION", "The request was not valid JSON.");
        }
      }

      const url = new URL(req.url);
      const routeKey = `${req.method} ${url.pathname}`;
      const idemKey = req.headers.get("idempotency-key");
      const payloadHash = hash(`${routeKey}\n${rawText}`);
      if (opts.mutation && needAuth) {
        if (!idemKey || idemKey.length < 8 || idemKey.length > 128) {
          throw new ApiError(422, "IDEMPOTENCY_KEY_REQUIRED", "Send an Idempotency-Key header with this request.");
        }
        const { data: prior } = await who!.db
          .from("command_log").select("payload_hash,http_status,response")
          .eq("user_id", who!.userId).eq("route", routeKey).eq("key", idemKey).maybeSingle();
        if (prior) {
          if (prior.payload_hash !== payloadHash) {
            throw new ApiError(409, "IDEMPOTENCY_KEY_REUSED", "This save key was already used for a different request.");
          }
          if (prior.http_status === 204) return new Response(null, { status: 204, headers: { "x-request-id": requestId } });
          return json(prior.http_status ?? 200, prior.response, requestId);
        }
      }

      let body = undefined as B;
      if (opts.body) {
        const parsed = opts.body.safeParse(raw);
        if (!parsed.success) {
          throw new ApiError(422, "VALIDATION", "Some answers were not valid.", z.treeifyError(parsed.error));
        }
        body = parsed.data;
      }

      let entitlement: Entitlement | null = null;
      let plan: "free" | "pro" = "free";
      // Test mode only (synthetic accounts): a fixed clock so time rules can be exercised end to end.
      const testNow = process.env.BLOAT_TEST_LOGIN === "1" ? req.headers.get("x-bloat-test-now") : null;
      const now = testNow && !Number.isNaN(Date.parse(testNow)) ? Date.parse(testNow) : Date.now();
      if (who) {
        entitlement = await loadEntitlement(who.db, who.userId);
        plan = effectivePlan(entitlement, now);
        if (plan !== "pro" && isProTestAccount(who.email)) plan = "pro";
        if (opts.feature && isProFeature(opts.feature) && plan !== "pro") {
          throw new ApiError(403, "PLAN_REQUIRED", "This is part of Bloat Pro.");
        }
        if (opts.capability) await assertCapability(who.db, who.userId, opts.capability);
      }

      const commit = async (ops: Op[], status: number, data: unknown): Promise<Result> => {
        const all = [...ops];
        if (opts.mutation && who && idemKey) {
          all.push({
            op: "insert", table: "command_log",
            row: { route: routeKey, key: idemKey, payload_hash: payloadHash, http_status: status, response: data },
          });
        }
        if (who) await tx(who.userId, all);
        return { status, data };
      };

      const result = await handler({
        req, params, requestId, userId: who?.userId ?? "", db: who?.db as Db, body, plan, entitlement, now, commit,
      });
      if (result.status === 204) return new Response(null, { status: 204, headers: { "x-request-id": requestId } });
      return json(result.status, result.data, requestId);
    } catch (e) {
      if (e instanceof ApiError) return errorResponse(e, requestId);
      if (e instanceof DbError) {
        if (e.isUnique && e.mentions("command_log")) {
          return errorResponse(new ApiError(409, "IN_PROGRESS", "This request is already being saved. Check save status."), requestId);
        }
        if (e.isUserGone) return errorResponse(new ApiError(401, "UNAUTHENTICATED", "Sign in to continue."), requestId);
        if (e.isOverlap) return errorResponse(new ApiError(422, "OVERLAP", "This overlaps another bloating record."), requestId);
        if (e.isCheck) return errorResponse(new ApiError(422, "VALIDATION", "Some answers were not valid."), requestId);
        // No health data in logs: only the database error code is recorded.
        console.error(JSON.stringify({ level: "error", request_id: requestId, db_code: e.code }));
        return errorResponse(new ApiError(500, "SERVER_ERROR", "Something went wrong. Nothing was saved."), requestId);
      }
      console.error(JSON.stringify({ level: "error", request_id: requestId, kind: e instanceof Error ? e.name : "unknown" }));
      // Stack traces only in test mode with synthetic accounts; never on a live site.
      if (process.env.BLOAT_TEST_LOGIN === "1" && e instanceof Error) console.error(e.stack);
      return errorResponse(new ApiError(500, "SERVER_ERROR", "Something went wrong. Nothing was saved."), requestId);
    }
  };
}

export const ok = (data: unknown): Result => ({ status: 200, data });

export function notFound(what = "Record"): never {
  // Other users' IDs answer exactly like missing ones (plan B01).
  throw new ApiError(404, "NOT_FOUND", `${what} not found.`);
}
