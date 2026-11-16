import "server-only";
import type { Db } from "./supabase";
import type { UserCtx } from "./userdata";
import type { Bundle } from "./insights";
import { tx } from "./db";
import { chooseCard, type CardContext } from "@/lib/domain/cards";
import { addDays, analysisDate } from "@/lib/time";

function counts(u: UserCtx, b: Bundle): Record<string, number> {
  const from = addDays(u.today, -7), to = addDays(u.today, -1);
  const inWin = (d: string) => d >= from && d <= to;
  const tapDays = (ids: string[]) => new Set(b.view.data.observations.filter((o) => inWin(o.date) && o.answer === "yes" && ids.includes(o.activity_id)).map((o) => o.date)).size;
  const dateOf = (iso: string) => analysisDate(Date.parse(iso), u.periods);
  const mealDate = new Map(b.view.data.meals.map((m) => [m.id, dateOf(m.eaten_at)]));
  const groupDays = (groups: string[]) => new Set(b.view.data.ingredients.filter((i) => i.answer === "had" && groups.includes(i.food_group)).map((i) => mealDate.get(i.meal_id)!).filter(inWin));
  const symptomDays = (code: string) => [...b.symptomsByDate.entries()].filter(([d, s]) => inWin(d) && s.has(code)).length;
  const meals = b.view.data.meals.filter((m) => inWin(dateOf(m.eaten_at)));
  const afterMeal = new Set(b.view.data.episodes.filter((e) => inWin(dateOf(e.started_at))).filter((e) => {
    const t = Date.parse(e.started_at);
    return b.view.data.meals.some((m) => { const mt = Date.parse(m.eaten_at); return mt <= t && t - mt <= 3 * 3600_000; });
  }).map((e) => dateOf(e.started_at))).size;
  const ca = new Set([...groupDays(["TAG-11", "TAG-12"]), ...b.view.data.observations.filter((o) => inWin(o.date) && o.answer === "yes" && (o.activity_id === "ACT-22" || o.activity_id === "ACT-24")).map((o) => o.date)]).size;
  return {
    ate_quickly: new Set([...meals.filter((m) => m.pace === "quickly").map((m) => dateOf(m.eaten_at)), ...b.view.data.observations.filter((o) => inWin(o.date) && o.answer === "yes" && o.activity_id === "ACT-01").map((o) => o.date)]).size,
    gum: tapDays(["ACT-03"]), straw: tapDays(["ACT-04"]), fizzy: groupDays(["TAG-09"]).size, sugar_alcohols: groupDays(["TAG-06"]).size,
    large_meal: meals.filter((m) => m.portion === "large").length, late_meal: tapDays(["ACT-05"]), skipped_meal: tapDays(["ACT-07"]),
    less_water: tapDays(["ACT-17"]), caffeine_alcohol: ca, constipation: Math.max(symptomDays("constipation"), tapDays(["ACT-14"])),
    bloating_after_meals: afterMeal, sitting: tapDays(["ACT-10"]), stressed: tapDays(["ACT-12"]), poor_sleep: tapDays(["ACT-11"]),
  };
}

/** Today's card. The first request of the day fixes it; every later request returns the same card. */
export async function cardForToday(db: Db, userId: string, u: UserCtx, b: Bundle) {
  const [hist, hidden, surgery, fx] = await Promise.all([
    db.from("card_events").select("card_id,date,reason,feedback").eq("user_id", userId).order("date", { ascending: false }).limit(60),
    db.from("hidden_cards").select("card_id").eq("user_id", userId),
    db.from("health_conditions").select("condition").eq("user_id", userId).eq("condition", "previous_tummy_surgery_incl_weight_loss_or_reflux_surgery"),
    db.from("experiment_checks").select("fx01,fx02,fx03").eq("user_id", userId).order("checked_at", { ascending: false }).limit(1),
  ]);
  const history = (hist.data ?? []) as Array<{ card_id: string; date: string; reason: string | null; feedback: unknown }>;
  const ctx: CardContext = {
    today: u.today, counts: counts(u, b), hidden: (hidden.data ?? []).map((h) => h.card_id as string), history,
    previousTummySurgery: (surgery.data ?? []).length > 0, fx: (fx.data?.[0] as CardContext["fx"]) ?? null,
  };
  const existing = history.find((h) => h.date === u.today);
  const choice = chooseCard(ctx);
  if (!choice) return null;
  let why = existing?.reason ?? choice.why;
  if (!existing) {
    await tx(userId, [{ op: "upsert", table: "card_events", row: { card_id: choice.card.id, card_version: choice.card.version, date: u.today, reason: choice.why }, conflict: ["user_id", "date"] }]);
    why = choice.why;
  }
  return { card: choice.card, why, feedback: existing?.feedback ?? null };
}
