// Row shapes used by the rule code. They mirror the database tables (plan B02).
export type Episode = {
  id: string; started_at: string; start_zone: string; start_offset_min: number;
  start_precision: "exact" | "approximate"; ended_at: string | null;
  end_precision: "exact" | "approximate" | "unknown" | null;
  state: "OPEN" | "CLOSED_REPORTED_TIME" | "CLOSED_APPROXIMATE" | "END_UNKNOWN";
  feel: string[]; eased: string | null; revision: number; entered_at?: string;
};
export type Sample = { id: string; episode_id: string; strength: number; observed_at: string };
export type Review = {
  date: string; worst: number | null; cannot_remember: boolean;
  whole_day: "yes" | "only_part_of_the_day" | "not_sure" | null;
  food_coverage: "all" | "mostly" | "some" | "none_recorded" | "not_sure" | "i_ate_and_drank_nothing" | null;
  bowel_answer: "yes" | "no" | "not_sure" | null;
  watched: Record<string, "yes" | "no" | "not_sure">;
  reviewed_at: string; late: boolean; metric_version: string; revision: number;
};
export type Mark = { date: string; no_bloating_at: string };
export type Meal = {
  id: string; eaten_at: string; zone: string; offset_min: number; time_precision: string; dish_text: string;
  portion: string | null; amount_count: number | null; amount_unit: string | null; pace: string | null;
  origin: string | null; source: string; saved_dish_id: string | null; saved_dish_confirmed: boolean;
  ai_check_status: string; revision: number; save_key?: string;
};
export type Ingredient = {
  id: string; meal_id: string; name: string; food_group: string;
  answer: "had" | "didnt_have" | "not_sure" | "unknown";
  source: "ai_confirmed" | "user_added" | "saved_dish" | "recalled" | "guess" | "dont_know" | "ai_failed";
  source_label: string | null; ai_listed: boolean;
};
export type Observation = {
  id: string; date: string; activity_id: string; answer: "yes" | "no" | "not_sure";
  detail: Record<string, unknown> | null; observed_at: string | null; source: "tap" | "review";
};
export type CycleEvent = { id: string; kind: "start" | "end"; date: string; date_precision: string };
export type Medicine = {
  id: string; name: string; type: string; med_group: string | null; started_on: string | null;
  started_precision: string; note: string | null;
};
export type MedicineChange = { id: string; medicine_id: string; change: string; date: string | null; date_precision: string };
export type Bowel = {
  id: string; occurred_at: string; zone: string; offset_min: number; time_precision: string;
  stool_type: string | null; strain: string | null; complete: string | null; revision: number;
};
export type Exercise = {
  id: string; type: string; started_at: string; zone: string; offset_min: number; time_precision: string;
  minutes: number; intensity: string | null; meal_relation: string | null;
  minutes_from_last_meal: number | null; minutes_to_next_meal: number | null; revision: number;
};

export type DayStatus = "UNKNOWN" | "PROVISIONAL" | "CONFIRMED" | "LATE" | "CONFLICT";
export type FoodCoverage = "ALL" | "MOSTLY" | "SOME" | "NONE" | "UNKNOWN" | "NO_INTAKE";
export type Exposure = "PRESENT" | "ABSENT" | "UNKNOWN";
