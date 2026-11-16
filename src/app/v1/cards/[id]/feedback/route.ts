import { z } from "zod";
import { notFound, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import type { Op } from "@/server/db";
import { publishedCards } from "@content/cards";

const body = z.strictObject({
  tried: z.enum(["tried", "not_today"]).optional(),
  result: z.enum(["helpful", "no_difference", "worse"]).optional(),
  other: z.enum(["not_relevant", "hide_this_card"]).optional(),
  unhide: z.boolean().optional(),
  before_score: z.number().int().min(0).max(10).optional(),
  after_score: z.number().int().min(0).max(10).optional(),
});

// GC-01 card feedback. "Worse" hides the card for this user and goes to the founder review queue.
export const POST = route({ body, mutation: true, feature: "daily_cards" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const card = publishedCards().find((c) => c.id === ctx.params.id);
  if (!card) notFound("Card");
  const b = ctx.body;
  const ops: Op[] = [];
  if (b.unhide) {
    ops.push({ op: "delete", table: "hidden_cards", match: { card_id: card!.id } });
    return ctx.commit(ops, 200, { card_id: card!.id, hidden: false });
  }
  const hide = b.result === "worse" || b.other === "hide_this_card";
  const feedback = { tried: b.tried ?? null, result: b.result ?? null, other: b.other ?? null };
  ops.push({ op: "update", table: "card_events", match: { card_id: card!.id, date: u.today }, set: { feedback, hidden: hide } });
  if (hide) ops.push({ op: "upsert", table: "hidden_cards", row: { card_id: card!.id }, conflict: ["user_id", "card_id"] });
  if (b.result === "worse") ops.push({ op: "insert", table: "review_queue", row: { kind: "card_worse", ref: card!.id } });
  if (b.before_score !== undefined || b.after_score !== undefined) {
    ops.push({ op: "insert", table: "activity_responses", row: { ref_kind: "card", ref_id: card!.id, date: u.today, before_score: b.before_score ?? null, after_score: b.after_score ?? null } });
  }
  return ctx.commit(ops, 200, { card_id: card!.id, hidden: hide, feedback });
});
