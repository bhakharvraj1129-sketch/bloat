// Card of the day (plan A16). One card a day, stable all day, alternating tip and mind–body.
// Triggers come before rotation, a shown card rests for 14 days, and when every allowed card of
// the wanted kind was shown recently the one shown longest ago is used (never a filler card).
import { publishedCards, type Card } from "@content/cards";
import { thresholds } from "../registry";
import { addDays } from "../time";

export type CardContext = {
  today: string;
  /** Count of days in the last 7 on which each trigger condition was logged. */
  counts: Record<string, number>;
  hidden: string[];
  history: Array<{ card_id: string; date: string }>;
  previousTummySurgery: boolean;
  /** Latest swap-check answers, when the user has answered them. Never ON-10, age or ovaries. */
  fx: { fx01: string; fx02: string; fx03: string } | null;
};

const TRIGGERS: Record<string, { key: string; min: number; why: (n: number) => string }> = {
  ate_quickly_2: { key: "ate_quickly", min: 2, why: (n) => `You logged eating quickly on ${n} of the last 7 days.` },
  gum_2: { key: "gum", min: 2, why: (n) => `You logged gum or hard sweets on ${n} of the last 7 days.` },
  straw_2: { key: "straw", min: 2, why: (n) => `You logged drinking through a straw on ${n} of the last 7 days.` },
  fizzy_3: { key: "fizzy", min: 3, why: (n) => `You logged fizzy drinks on ${n} of the last 7 days.` },
  sugar_alcohols_2: { key: "sugar_alcohols", min: 2, why: (n) => `You logged sugar-free sweeteners on ${n} of the last 7 days.` },
  large_3: { key: "large_meal", min: 3, why: (n) => `You logged a large meal ${n} times in the last 7 days.` },
  late_meal_2: { key: "late_meal", min: 2, why: (n) => `You logged a late meal on ${n} of the last 7 days.` },
  skipped_meal_2: { key: "skipped_meal", min: 2, why: (n) => `You logged skipping a meal on ${n} of the last 7 days.` },
  less_water_1: { key: "less_water", min: 1, why: (n) => `You logged drinking less water than usual on ${n} of the last 7 days.` },
  caffeine_alcohol_4: { key: "caffeine_alcohol", min: 4, why: (n) => `You logged caffeine or alcohol on ${n} of the last 7 days.` },
  constipation_2: { key: "constipation", min: 2, why: (n) => `You logged constipation on ${n} of the last 7 days.` },
  constipation_1: { key: "constipation", min: 1, why: (n) => `You logged constipation on ${n} of the last 7 days.` },
  bloating_after_meals_3: { key: "bloating_after_meals", min: 3, why: (n) => `Your bloating started within 3 hours of a meal on ${n} of the last 7 days.` },
  sitting_2: { key: "sitting", min: 2, why: (n) => `You logged mostly sitting on ${n} of the last 7 days.` },
  stressed_2: { key: "stressed", min: 2, why: (n) => `You logged feeling stressed on ${n} of the last 7 days.` },
  poor_sleep_2: { key: "poor_sleep", min: 2, why: (n) => `You logged poor sleep on ${n} of the last 7 days.` },
};
const ROTATION_WHY = "This is the next card in the regular rotation.";

export function allowedCards(ctx: CardContext): Card[] {
  return publishedCards().filter((c) => {
    if (ctx.hidden.includes(c.id)) return false;
    if (c.exclusions.includes("previous_tummy_surgery") && ctx.previousTummySurgery) return false;
    if (c.exclusions.includes("pregnant_or_breastfeeding") && ctx.fx && ctx.fx.fx01 !== "no") return false;
    // The kiwifruit card is hidden unless FX-03 was answered No.
    if (c.exclusions.includes("needs_fx03_no") && ctx.fx?.fx03 !== "no") return false;
    // No food-restriction tips are pushed after an FX-02 answer other than No.
    if (c.exclusions.includes("food_restriction_tip") && ctx.fx && ctx.fx.fx02 !== "no") return false;
    return true;
  });
}

export function chooseCard(ctx: CardContext): { card: Card; why: string } | null {
  const sorted = [...ctx.history].sort((a, b) => (a.date < b.date ? 1 : -1));
  const today = sorted.find((h) => h.date === ctx.today);
  const all = publishedCards();
  if (today) {
    const card = all.find((c) => c.id === today.card_id);
    if (card) return { card, why: ROTATION_WHY };
  }
  const allowed = allowedCards(ctx);
  if (!allowed.length) return null;
  const lastKind = all.find((c) => c.id === sorted[0]?.card_id)?.kind;
  const wanted: Card["kind"] = lastKind === "tip" ? "mind_body" : "tip";
  let pool = allowed.filter((c) => c.kind === wanted);
  if (!pool.length) pool = allowed; // every card of that kind is hidden or excluded
  const lastShown = (id: string) => sorted.find((h) => h.card_id === id)?.date ?? null;
  const cutoff = addDays(ctx.today, -thresholds.card_cooldown_days);
  const rested = pool.filter((c) => { const d = lastShown(c.id); return !d || d < cutoff; });
  const candidates = rested.length ? rested : pool;
  if (rested.length) {
    // Triggers before rotation.
    for (const c of candidates) {
      const t = c.trigger ? TRIGGERS[c.trigger] : null;
      const n = t ? ctx.counts[t.key] ?? 0 : 0;
      if (t && n >= t.min) return { card: c, why: t.why(n) };
    }
  }
  // Rotation: never shown first (in the fixed list order), otherwise the one shown longest ago.
  const pick = [...candidates].sort((a, b) => {
    const da = lastShown(a.id), db = lastShown(b.id);
    if (da === db) return all.indexOf(a) - all.indexOf(b);
    if (da === null) return -1;
    if (db === null) return 1;
    return da < db ? -1 : 1;
  })[0]!;
  return { card: pick, why: ROTATION_WHY };
}

/** "What helps you": after 3 or more tries of the same activity with before and after scores. */
export function whatHelps(rows: Array<{ ref_kind: string; ref_id: string; before_score: number | null; after_score: number | null }>, names: (kind: string, id: string) => string) {
  const groups = new Map<string, Array<{ b: number; a: number }>>();
  for (const r of rows) {
    if (r.before_score === null || r.after_score === null) continue;
    const k = `${r.ref_kind}:${r.ref_id}`;
    groups.set(k, [...(groups.get(k) ?? []), { b: r.before_score, a: r.after_score }]);
  }
  const out: Array<{ name: string; tries: number; before: number; after: number; text: string }> = [];
  for (const [k, list] of groups) {
    if (list.length < thresholds.what_helps_min_tries) continue;
    const [kind, id] = k.split(":") as [string, string];
    const avg = (xs: number[]) => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10;
    const before = avg(list.map((x) => x.b)), after = avg(list.map((x) => x.a));
    const name = names(kind, id);
    out.push({ name, tries: list.length, before, after, text: `${name}: bloating went from ${before.toFixed(1)} to ${after.toFixed(1)} on average across ${list.length} tries.` });
  }
  return out.sort((x, y) => x.name.localeCompare(y.name));
}
