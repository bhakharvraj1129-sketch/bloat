import { NextResponse } from "next/server";
import { cookieClient } from "@/server/supabase";

// Google sign-in returns here. Health answers are only collected after this, so a redirect can
// never lose them.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const db = await cookieClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/today", url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in", url.origin));
}
