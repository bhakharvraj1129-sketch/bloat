// Fixed wording. These sentences come from the plan (A01, A14, A15, A17, 0.3, 0.4) and are never
// rewritten by code or AI. The medical-help text is adapted from the NHS "Bloating" page for the US,
// Canada and India (for example "pass gas", "urgent care", the local emergency number), so it is
// labelled "Adapted from NHS, Bloating" and never claimed to be an exact quote. Every NHS warning sign is kept.
import { emergencyNumber } from "./registry";

export const CONSENT_VERSION = "2026-11-16";
export const HELP_PAGE_VERSION = "nhs-bloating-2026-11-07";
export const NHS_SOURCE_URL = "https://www.nhs.uk/symptoms/bloating/";
export const NHS_SOURCE_LABEL = "Adapted from NHS, Bloating";

export const INTENDED_USE =
  "Bloat is a general wellness app for adults. It lets people record bloating, meals, bowel movements, exercise and daily habits, and shows patterns in their own records. Bloat does not diagnose, treat, cure, mitigate or prevent any disease or condition, does not give medical advice, and is not for emergencies.";

export const TAGLINE = "Track your bloating. Spot your possible triggers. Bring real data to your doctor.";

export const COMPARISON_LINE = "This is a difference in your records, not a medical measure.";
export const TRIGGERS_FOOTER = "These are patterns in your own records, not proof of a cause.";
export const MEDICINE_LINE = "This is a difference in your records, not proof the medicine caused it.";
export const AI_FIXED_TEXT =
  "These are foods often linked to gas or bloating (sources: NIH, NHS). AI suggestion, may be wrong. Mark each one.";
export const AI_PAUSED_MESSAGE = "The ingredient check is paused right now. Your meal is saved.";
export const AI_LIMITED_MESSAGE = "Your meal is saved. Add ingredients yourself, or try the check again later.";
export const FOLLOWED_ONLY_NOTE = "You can compare the 3 habits you follow. Follow a habit to start comparing it.";
export const KIWI_WARNING = "Don't try this if you're allergic to kiwi";
export const STOP_IF_WORSE = "Stop if you feel worse";
export const DOWNLOAD_NOTE = "Downloaded copies can't be recalled.";
// Deleting an account removes kept photos first, then the account. A failure from the photo step on
// (the server answers 500 or more) leaves the account and diary in place, but kept photos removed before
// the failure stay removed. Owner's wording, 24 Nov 2026 (was decision D20).
export const DELETE_UNFINISHED =
  "We couldn't finish deleting your account. Your account and diary are still available, but some saved meal photos may already have been deleted. Try again to finish.";
// The server refused before anything was removed (an answer below 500).
export const DELETE_REFUSED = "That didn't work. Nothing was deleted. Try again.";

export const HOW_BLOAT_WORKS = [
  "Tap I feel bloated when it starts, and Bloating gone when it ends.",
  "Add meals as you eat. Pro can snap a photo.",
  "Each morning, answer a few questions about yesterday to set your Bloat Score. \"Mostly\" is a fine answer.",
  "Bloat shows patterns in your own records. It doesn't diagnose or treat anything. For worrying symptoms, see When to get medical help.",
];

export type HelpLevel = "emergency" | "urgent" | "see_doctor";

export function emergencyPhrase(countryCode: string | null | undefined): string {
  const n = emergencyNumber(countryCode);
  return n ? `Call ${n} now` : "Call your local emergency number now";
}

/** The help page (plan A17). Section text is the stored copy adapted from the NHS page. */
export function helpPage(countryCode: string | null | undefined) {
  return {
    version: HELP_PAGE_VERSION,
    title: "When to get medical help",
    intro: "Bloat is a tracker. It can't tell you what is causing your symptoms or whether they are serious.",
    sections: [
      {
        level: "emergency" as HelpLevel,
        heading: `${emergencyPhrase(countryCode)} if you have bloating with a swollen stomach and:`,
        items: [
          "stomach pain that is severe and came on very suddenly",
          "you are vomiting blood, or your vomit looks like coffee grounds",
          "severe difficulty breathing – you're gasping, choking or unable to get words out",
        ],
      },
      {
        level: "urgent" as HelpLevel,
        heading: "Contact a doctor today or go to urgent care if you have bloating and:",
        items: [
          "vomiting, diarrhoea or constipation",
          "stomach pain",
          "a high temperature, or you feel hot, cold or shivery",
          "a swelling or lump in your tummy",
          "you can't pee, poo or pass gas",
          "a burning feeling in your chest from stomach acid (acid reflux)",
        ],
      },
      {
        level: "see_doctor" as HelpLevel,
        heading: "Book a regular appointment with a doctor if:",
        items: [
          "you feel bloated regularly",
          "you've tried changing what you eat and still keep feeling bloated",
          "you have bloating and are losing weight without trying",
          "you have bloating and blood in your poo",
        ],
      },
    ],
    source:
      "Adapted from NHS, Bloating. Contact routes and the emergency number are changed for your country. This page is general information, not medical advice.",
    sourceUrl: NHS_SOURCE_URL,
  };
}

/** The sentence shown inline under a warning chip, by NHS level (0.3 fix 3). */
export function levelSentence(level: HelpLevel, countryCode: string | null | undefined): string {
  if (level === "emergency") return `${emergencyPhrase(countryCode)}.`;
  if (level === "urgent") return "Contact a doctor today or go to urgent care.";
  return "Book an appointment with a doctor.";
}

/** EP-08 common symptoms that show the matching NHS sentence inline (0.3 fix 4). */
export const COMMON_SYMPTOM_LEVEL: Record<string, HelpLevel> = {
  abdominal_pain: "urgent",
  constipation: "urgent",
  diarrhoea: "urgent",
  heartburn_or_reflux: "urgent",
};
export const COMMON_SYMPTOM_NHS: Record<string, string> = {
  abdominal_pain: "stomach pain",
  constipation: "vomiting, diarrhoea or constipation",
  diarrhoea: "vomiting, diarrhoea or constipation",
  heartburn_or_reflux: "a burning feeling in your chest from stomach acid (acid reflux)",
};
export function commonSymptomSentence(code: string): string | null {
  const item = COMMON_SYMPTOM_NHS[code];
  return item ? `Contact a doctor today or go to urgent care if you have bloating and: ${item}.` : null;
}

// Words that must never appear in the UI or marketing (plan A17). "cause" is allowed only inside
// the fixed possible-triggers footer and the fixed experiment templates.
export const BANNED_PHRASES = [
  "safe food", "bad food", "trigger confirmed", "cause of your bloating", "cure", "heal", "diagnose",
  "abnormal", "high risk", "all clear", "you may have", "doctor approved", "clinically proven",
  "medically validated", "reviewed by clinicians", "recommended by doctors",
];
