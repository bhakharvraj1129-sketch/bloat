"use client";
import { createBrowserClient } from "@supabase/ssr";

// Browser client: used only for signing in and out. All data goes through the /v1 server routes.
export function browserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
