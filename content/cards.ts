// Daily cards (plan A16). The text of every card is copied from the plan, which restates one
// sentence from the cited public source. A card can only be published with a source link, a
// label and a version. Source links must be re-checked by the owner before Gate 1.
import { z } from "zod";

export const CARD_FOOTER = "General wellness information, not medical advice. If you have a diagnosed condition, follow your doctor's advice first.";

const SRC = {
  niddk: { name: "NIDDK", url: "https://www.niddk.nih.gov/health-information/digestive-diseases/gas-digestive-tract/eating-diet-nutrition" },
  nhs: { name: "NHS", url: "https://www.nhs.uk/symptoms/bloating/" },
  bda: { name: "BDA", url: "https://www.bda.uk.com/resource/irritable-bowel-syndrome-diet.html" },
  bda2025: { name: "BDA 2025", url: "https://www.bda.uk.com/resource/constipation.html" },
  walk: { name: "2021 RCT", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8035544/" },
  breathing: { name: "2025 RCT", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12658723/" },
  nhsBreathing: { name: "NHS", url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" },
  cdc: { name: "CDC", url: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html" },
};

export const cardSchema = z.strictObject({
  id: z.string(), version: z.string().min(1), kind: z.enum(["tip", "mind_body"]), title: z.string().min(1), text: z.string().min(1),
  label: z.string(), sources: z.array(z.strictObject({ name: z.string().min(1), url: z.url() })),
  trigger: z.string().nullable(), exclusions: z.array(z.enum(["previous_tummy_surgery", "pregnant_or_breastfeeding", "needs_fx03_no", "food_restriction_tip"])),
  status: z.enum(["published", "draft"]),
}).refine((c) => c.status !== "published" || (c.sources.length > 0 && c.label.length > 0), { message: "A card cannot be published without a source link and a label." });

export type Card = z.infer<typeof cardSchema>;

const tip = (id: string, title: string, text: string, trigger: string | null, label: string, sources: Card["sources"], exclusions: Card["exclusions"] = []): Card =>
  ({ id, version: "1", kind: "tip", title, text, trigger, label, sources, exclusions, status: "published" });
const mb = (id: string, title: string, text: string, trigger: string | null, sources: Card["sources"], exclusions: Card["exclusions"] = [], status: Card["status"] = "published"): Card =>
  ({ id, version: "1", kind: "mind_body", title, text, trigger, label: sources.length ? "Activity" : "", sources, exclusions, status });

export const CARDS: Card[] = [
  tip("eat-slowly", "Eat more slowly", "Eating slowly and sitting down for meals is one of the habits health services suggest for gas. Try putting your fork down between bites.", "ate_quickly_2", "Often suggested", [SRC.niddk]),
  tip("mouth-closed", "Chew with your mouth closed", "Chewing with your mouth closed helps you swallow less air.", null, "Often suggested", [SRC.nhs]),
  tip("gum-break", "Take a break from gum and hard candy", "Chewing gum and sucking hard candy are listed as habits to limit for gas.", "gum_2", "Often suggested", [SRC.niddk], ["food_restriction_tip"]),
  tip("skip-straw", "Skip the straw", "Drinking through a straw is listed as a habit to limit for gas.", "straw_2", "Often suggested", [SRC.niddk]),
  tip("fizzy", "Notice fizzy drinks", "Soda, sparkling water and energy drinks are listed as drinks that can add to gas.", "fizzy_3", "Often suggested", [SRC.niddk, SRC.nhs], ["food_restriction_tip"]),
  tip("sugar-free", "Check \"sugar-free\" labels", "Sweeteners ending in \"-ol\" (sorbitol, xylitol, erythritol) in gum, candy and protein bars can cause gas in some people.", "sugar_alcohols_2", "Often suggested", [SRC.niddk], ["food_restriction_tip"]),
  tip("smaller-meals", "Smaller, more frequent meals", "Health services suggest smaller, more frequent meals instead of large ones.", "large_3", "Often suggested", [SRC.niddk, SRC.nhs], ["food_restriction_tip"]),
  tip("late-meal", "No big meal right before bed", "The NHS suggests avoiding large meals late at night.", "late_meal_2", "Often suggested", [SRC.nhs, SRC.bda], ["food_restriction_tip"]),
  tip("regular-meals", "Regular meals", "The BDA suggests three regular meals a day, without skipping meals and then eating a lot.", "skipped_meal_2", "Often suggested (IBS-type advice)", [SRC.bda]),
  tip("water", "Drink enough water", "The BDA suggests about 8 cups of fluid a day, mostly water or non-caffeinated drinks.", "less_water_1", "Often suggested", [SRC.nhs, SRC.bda]),
  tip("caffeine-alcohol", "Caffeine and alcohol", "For IBS-type symptoms the BDA suggests up to 3 cups of caffeinated drinks a day and up to 2 units of alcohol with 2 alcohol-free days a week.", "caffeine_alcohol_4", "Often suggested (IBS-type advice)", [SRC.bda], ["food_restriction_tip"]),
  tip("fibre", "Fibre, gradually", "Raise fibre slowly; a sudden rise can make symptoms worse. Some people find oats or up to a tablespoon of linseeds a day helpful.", null, "Some evidence", [SRC.bda, SRC.niddk]),
  tip("kiwi", "Kiwifruit and regularity", "Two or three whole kiwifruit a day for 4 weeks may help with constipation.", "constipation_2", "Some evidence", [SRC.bda2025], ["needs_fx03_no"]),
  mb("walk", "Gentle walk after a meal", "A gentle 10–15 minute walk after eating is an easy way to move. One small study in people with bloating found it helped some symptoms. Only if walking is comfortable.", "bloating_after_meals_3", [SRC.nhs, SRC.walk]),
  mb("move", "Move a little every day", "Regular activity supports digestion. Adults are advised to aim for about 150 minutes of moderate activity a week.", "sitting_2", [SRC.nhs, SRC.cdc]),
  mb("slow-breathing", "5-minute slow breathing", "Sit or lie comfortably. Breathe in through your nose for a count of 5 and out through your mouth for 5, for 5 minutes. Don't force it.", "stressed_2", [SRC.nhsBreathing]),
  mb("belly-breathing", "Belly breathing", "One hand on your chest, one below your ribs. Breathe in slowly so your belly rises, out through pursed lips. 3 minutes, up to 3 times a day.", null, [SRC.breathing]),
  mb("massage", "Tummy massage", "The NHS suggests gently massaging your stomach from right to left. Use light, circular strokes for a few minutes.", "constipation_1", [SRC.nhs], ["previous_tummy_surgery"]),
  // The plan names no linkable source for these two ("activity guidance", "general wellbeing"),
  // so they stay drafts until the owner supplies one. A card is never published without a source.
  mb("stretch", "Gentle stretch", "A few minutes of slow, comfortable stretching. Stop if anything hurts.", null, [], ["pregnant_or_breastfeeding", "previous_tummy_surgery"], "draft"),
  mb("wind-down", "Wind down for sleep", "A regular bedtime routine and a screen-free half hour before bed can help sleep.", "poor_sleep_2", [], [], "draft"),
];

export const publishedCards = () => CARDS.filter((c) => c.status === "published");
