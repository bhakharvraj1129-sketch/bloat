// Which main destination owns each screen, so the right tab is marked wherever a screen is opened.
// Today owns logging, the morning review and recall; History owns day detail (and a review opened
// from History); Patterns owns insights, experiments and reports; You owns settings and health.
export type Owner = "today" | "history" | "insights" | "me";

const RULES: Array<[RegExp, Owner]> = [
  [/^\/(today|meal|cards)(\/|$)/, "today"],
  [/^\/(history|day)(\/|$)/, "history"],
  [/^\/(insights|triggers|experiments|report|doctor|journey)(\/|$)/, "insights"],
  [/^\/(me|health|learn|upgrade)(\/|$)/, "me"],
];

/** `from` is the previous screen in this tab, when known: a review opened from History stays under History. */
export function ownerOf(path: string, from?: string | null): Owner | null {
  if (/^\/review(\/|$)/.test(path)) return from && /^\/(history|day)(\/|$)/.test(from) ? "history" : "today";
  for (const [re, owner] of RULES) if (re.test(path)) return owner;
  return null;
}
