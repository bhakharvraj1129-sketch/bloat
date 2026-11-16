import { ok, route } from "@/server/http";
import { CARD_FOOTER, publishedCards } from "@content/cards";
import { ARTICLES } from "@content/articles";
import { whatHelps } from "@/lib/domain/cards";
import { experimentDef } from "@/lib/domain/experiments";

// Learn library (Pro): every card and article with its source, hidden cards with Un-hide, and
// "What helps you" once an activity has 3 or more tries with before and after scores.
export const GET = route({ feature: "learn_library" }, async (ctx) => {
  const [{ data: hidden }, { data: responses }] = await Promise.all([
    ctx.db.from("hidden_cards").select("card_id").eq("user_id", ctx.userId),
    ctx.db.from("activity_responses").select("ref_kind,ref_id,before_score,after_score").eq("user_id", ctx.userId),
  ]);
  const hiddenIds = new Set((hidden ?? []).map((h) => h.card_id as string));
  const cards = publishedCards();
  const name = (kind: string, id: string) => (kind === "card" ? cards.find((c) => c.id === id)?.title : kind === "experiment" ? experimentDef(id)?.name : id.replace(/_/g, " ")) ?? id;
  return ok({
    cards: cards.map((c) => ({ id: c.id, kind: c.kind, title: c.title, text: c.text, label: c.label, sources: c.sources, hidden: hiddenIds.has(c.id) })),
    articles: ARTICLES,
    what_helps: whatHelps((responses ?? []) as never, name),
    footer: CARD_FOOTER,
    articles_note: "These are outlines. Full articles are added once written and checked against their sources.",
  });
});
