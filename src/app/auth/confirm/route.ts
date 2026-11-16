import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookieClient } from "@/server/supabase";

// Email link fallback (when the email template sends a link instead of a code).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type) {
    const db = await cookieClient();
    const { error } = await db.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL("/today", url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in", url.origin));
}
