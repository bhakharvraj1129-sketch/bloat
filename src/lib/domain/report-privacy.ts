// Doctor report privacy: the sections a person switches off must not appear anywhere in the
// report, including the page 1 summary. This one function is applied to every output (the API
// answer, the in-app preview, the PDF and the shared page) and to snapshots stored before the
// rule existed, so an older report cannot leak a section that was switched off.

export const DOCTOR_SECTIONS = ["symptoms", "meals", "bowel", "habits", "medicines", "health", "family", "tests", "experiments", "missing"] as const;
export type DoctorSection = (typeof DOCTOR_SECTIONS)[number];

export const DOCTOR_SECTION_NAMES: Record<DoctorSection, string> = {
  symptoms: "Symptoms", meals: "Meals and food groups", bowel: "Bowel record", habits: "Habits and exercise", medicines: "Medicines",
  health: "Health background", family: "Family history", tests: "Tests", experiments: "Experiments", missing: "What is missing",
};

type Json = Record<string, unknown>;

/**
 * The sections a snapshot includes. New snapshots list them in `included`. Older snapshots did
 * not, so a section counts as included only when it holds data (a switched-off section was
 * always stored as null). Anything unclear counts as not included.
 */
export function includedSections(d: { included?: unknown; sections?: unknown }): DoctorSection[] {
  if (Array.isArray(d.included)) return DOCTOR_SECTIONS.filter((k) => (d.included as unknown[]).includes(k));
  const sections = (d.sections ?? {}) as Json;
  return DOCTOR_SECTIONS.filter((k) => sections[k] !== null && sections[k] !== undefined);
}

/** Summary fields that come from the Symptoms section. */
const SYMPTOM_FIELDS = ["bloating_days_30", "typical_strength", "average_daily_score", "typical_episode_minutes", "how_long", "how_often", "weekly_impact"] as const;

/**
 * A copy of a doctor snapshot with everything from switched-off sections removed, in the summary
 * as well as in the detailed sections. Safe to call more than once.
 */
export function privateDoctorSnapshot<T>(snapshot: T): T {
  const d = structuredClone(snapshot) as unknown as Json;
  const inc = new Set(includedSections(d));
  const on = (k: DoctorSection) => inc.has(k);
  const sections = { ...((d.sections ?? {}) as Json) };
  for (const k of DOCTOR_SECTIONS) if (!on(k)) sections[k] = null;
  d.sections = sections;
  d.included = [...inc];

  const s = { ...((d.summary ?? {}) as Json) };
  if (!on("symptoms")) {
    for (const f of SYMPTOM_FIELDS) s[f] = null;
    s.warning_signs = [];
    s.doctor_line = null; // based on days with bloating
  }
  if (!on("medicines")) s.medicines = [];
  if (!on("health")) {
    s.context = []; // pregnancy, breastfeeding, menopause, periods, age range
    if (s.doctor_line && typeof s.doctor_line === "object") s.doctor_line = { ...(s.doctor_line as Json), ovarian: null };
  }
  // Patterns: food groups and large meals belong to Meals; habits to Habits. A pattern of unknown
  // kind (older snapshots) is kept only when both are included.
  const patterns = Array.isArray(s.patterns) ? (s.patterns as Json[]) : [];
  s.patterns = patterns.filter((p) => {
    if (p.kind === "habit") return on("habits");
    if (p.kind === "food" || p.kind === "large_meal") return on("meals");
    return on("meals") && on("habits");
  });
  d.summary = s;
  if (!on("medicines")) d.medicine_line = null;
  return d as unknown as T;
}
