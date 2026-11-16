import { ok, route } from "@/server/http";
import { loadUser } from "@/server/userdata";
import { loadBundle } from "@/server/insights";
import { cardForToday } from "@/server/cards";
import { CARD_FOOTER } from "@content/cards";

// One card a day, the same card all day (Pro).
export const GET = route({ feature: "daily_cards" }, async (ctx) => {
  const u = await loadUser(ctx.db, ctx.userId, ctx.now);
  const b = await loadBundle(ctx.db, ctx.userId, u, ctx.now, ctx.plan);
  const c = await cardForToday(ctx.db, ctx.userId, u, b);
  if (!c) return ok({ card: null, footer: CARD_FOOTER });
  return ok({
    card: { id: c.card.id, kind: c.card.kind, title: c.card.title, text: c.card.text, label: c.card.label, sources: c.card.sources, version: c.card.version },
    why: c.why, feedback: c.feedback, footer: CARD_FOOTER, date: u.today,
  });
});
