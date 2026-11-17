import { z } from "zod";
import { ApiError, route } from "@/server/http";
import { env } from "@/server/env";
import { cookieClient } from "@/server/supabase";
import { srv } from "@/server/db";

// TEST ONLY: password sign-in for synthetic accounts, so previews and browser tests do not need a
// mailbox. Off unless BLOAT_TEST_LOGIN=1; a live site must never set it.
export const POST = route({ auth: false, body: z.strictObject({ email: z.email(), password: z.string().min(8).max(72), create: z.boolean().optional() }) }, async (ctx) => {
  if (!env.testLogin) throw new ApiError(404, "NOT_FOUND", "Not found.");
  if (!/@(example\.com|bloat\.test)$/.test(ctx.body.email)) throw new ApiError(422, "VALIDATION", "Test sign-in only accepts synthetic @example.com or @bloat.test addresses.");
  const db = await cookieClient();
  const email = ctx.body.email.toLowerCase();
  let res = await db.auth.signInWithPassword({ email, password: ctx.body.password });
  if (res.error && ctx.body.create) {
    // An already-confirmed synthetic account, made on the server: no email is sent.
    try {
      await srv("srv_test_user", { p_email: email, p_password: ctx.body.password });
    } catch {
      throw new ApiError(422, "SIGN_IN_FAILED", "Could not sign in.");
    }
    res = await db.auth.signInWithPassword({ email, password: ctx.body.password });
  }
  if (res.error) throw new ApiError(422, "SIGN_IN_FAILED", "Could not sign in.");
  return { status: 200, data: { signed_in: true } };
});
