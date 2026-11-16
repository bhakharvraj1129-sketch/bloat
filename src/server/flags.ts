import "server-only";
import type { Db } from "./supabase";
import { anonClient } from "./supabase";

/** Flags are read on every request, so a change (for example the AI kill switch) applies at once. */
export async function flag(key: string, db?: Db): Promise<boolean> {
  const { data, error } = await (db ?? anonClient()).from("feature_flags").select("enabled").eq("key", key).maybeSingle();
  if (error || !data) return false; // fail closed
  return !!data.enabled;
}
export const checkoutEnabled = (db?: Db) => flag("checkout_enabled", db);
