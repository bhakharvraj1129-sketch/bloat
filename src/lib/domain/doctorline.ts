// The doctor line (plan 0.3, A14). Free for everyone. A quiet line, never on Today, never a pop-up.
import { doctorLine } from "../registry";
import { NHS_SOURCE_LABEL, NHS_SOURCE_URL } from "../wording";

export type DoctorLine = {
  show: boolean; days: number; window: number; sentence: string; ovarianSentence: string | null;
  shortened: boolean; source: string; sourceUrl: string;
};

/**
 * Shown when bloating was logged on MORE than 12 of the last 30 days. For users 50+ with ovaries
 * (ON-14, ON-15) the NHS ovarian sentence is added word for word. DN-01 shortens it to one
 * sentence for 90 days. "Prefer not to say" and skipped answers are never treated as Yes.
 */
export function buildDoctorLine(
  bloatingDays: number, ageRange: unknown, ovaries: unknown, pausedUntil: string | null, today: string,
): DoctorLine {
  const show = bloatingDays >= doctorLine.days_min;
  const shortened = !!pausedUntil && pausedUntil >= today;
  const older = ageRange === "50_59" || ageRange === "60";
  const ovarian = show && !shortened && older && ovaries === "yes" ? doctorLine.ovarian_sentence : null;
  return {
    show, days: bloatingDays, window: doctorLine.window_days, sentence: doctorLine.sentence,
    ovarianSentence: ovarian, shortened, source: NHS_SOURCE_LABEL, sourceUrl: NHS_SOURCE_URL,
  };
}
