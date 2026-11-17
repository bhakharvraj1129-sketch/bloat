import { describe, expect, it } from "vitest";
import { includedSections, privateDoctorSnapshot } from "@/lib/domain/report-privacy";

const base = () => ({
  sections: { symptoms: {}, meals: {}, bowel: {}, habits: {}, medicines: [], health: { conditions: [] }, family: null, tests: [], experiments: [], missing: [] },
  summary: {
    bloating_days_30: 9, typical_strength: 5, average_daily_score: 4, typical_episode_minutes: 90, how_long: "3-12 months", how_often: "Daily", weekly_impact: "A little",
    patterns: [{ label: "Fizzy drinks", kind: "food" }, { label: "Ate quickly", kind: "habit" }, { label: "Old", kind: undefined }],
    medicines: [{ name: "Zorvatrin-7Q" }], context: ["Pregnancy"], warning_signs: [{ label: "Vomiting", times: 1 }],
    doctor_line: { sentence: "x", ovarian: "ovarian sentence", source: "NHS", days: 13 }, questions: "q",
  },
  medicine_line: "line",
});

describe("doctor report privacy filter", () => {
  it("older snapshots: a section counts as included only when it holds data", () => {
    expect(includedSections(base())).toEqual(["symptoms", "meals", "bowel", "habits", "medicines", "health", "tests", "experiments", "missing"]);
    expect(includedSections({ included: ["meals", "nonsense"], sections: {} })).toEqual(["meals"]);
  });

  it("removes switched-off sections from the summary as well as the sections, and is safe to apply twice", () => {
    const d = { ...base(), included: ["meals", "tests"] };
    const once = privateDoctorSnapshot(d);
    expect(privateDoctorSnapshot(once)).toEqual(once);
    expect(once.summary).toMatchObject({ medicines: [], context: [], warning_signs: [], doctor_line: null, typical_strength: null, how_long: null });
    expect(once.summary.patterns).toEqual([{ label: "Fizzy drinks", kind: "food" }]);
    expect(once.medicine_line).toBeNull();
    expect(once.sections.health).toBeNull();
    expect(JSON.stringify(once)).not.toContain("Zorvatrin");
    expect(JSON.stringify(once)).not.toContain("Pregnancy");
    expect(d.summary.medicines).toHaveLength(1); // the input is not changed
  });

  it("Health off keeps the doctor line but drops its ovarian sentence", () => {
    const d = privateDoctorSnapshot({ ...base(), included: ["symptoms"] });
    expect(d.summary.doctor_line).toMatchObject({ sentence: "x", ovarian: null });
  });
});
