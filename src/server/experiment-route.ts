import "server-only";
import type { Db } from "./supabase";
import { notFound } from "./http";
import { tx } from "./db";
import { advance, type Exp } from "@/lib/domain/experiments";

/** Load one of the user's experiments, moved forward by date. Another user's ID answers 404. */
export async function getExperiment(db: Db, userId: string, id: string, today: string): Promise<Exp> {
  const { data } = await db.from("experiments").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  if (!data) notFound("Experiment");
  const e = data as Exp;
  const change = advance(e, today);
  if (!change) return e;
  await tx(userId, [{ op: "update", table: "experiments", match: { id: e.id }, set: change }]);
  return { ...e, ...change } as Exp;
}
