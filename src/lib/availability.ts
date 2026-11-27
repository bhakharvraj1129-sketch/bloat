// Which features a deployment does not offer (the invited beta: no AI, and health content that has
// not been reviewed stays unavailable). Pure rule; the server reads the two settings from the
// environment (server/availability.ts).

/** Features that need an AI provider. With BLOAT_AI_PROVIDER=off they are not offered at all. */
export const AI_FEATURES = ["ai_ingredient_check", "meal_photos", "recalled_meal_check", "ai_source_labels"] as const;

/**
 * offList: BLOAT_OFF_FEATURES, comma-separated feature keys (unknown keys and spaces ignored).
 * aiProvider: BLOAT_AI_PROVIDER; "off" adds every AI feature. Empty settings switch nothing off.
 */
export function featuresOffFrom(offList: string, aiProvider: string, known: readonly string[]): string[] {
  const listed = offList.split(",").map((s) => s.trim()).filter((k) => k && known.includes(k));
  const ai = aiProvider === "off" ? AI_FEATURES.filter((k) => known.includes(k)) : [];
  return [...new Set([...listed, ...ai])];
}

/**
 * Experiments (plan section on habit and food-swap experiments). The list, start, daily answer and end
 * routes use experiments_habit; the swap-only steps (checks, wellbeing, add-back, resume) also need
 * experiments_swap. So experiments are offered at all only while experiments_habit is on, and
 * swap experiments only while both are on. Records already made are kept either way.
 */
export function experimentsOffered(off: readonly string[]): boolean {
  return !off.includes("experiments_habit");
}
export function swapExperimentsOffered(off: readonly string[]): boolean {
  return experimentsOffered(off) && !off.includes("experiments_swap");
}
