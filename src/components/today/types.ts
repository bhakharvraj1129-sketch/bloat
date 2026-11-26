export type State = {
  onboarded: boolean;
  plan: "free" | "pro";
  /** Feature keys this deployment does not offer (invited beta): their buttons and links are hidden. */
  unavailable?: string[];
  paused: boolean;
  profile: {
    country: string; time_zone: string; analysis_time_zone: string; units: "us" | "metric"; date_format: "MM/DD" | "DD/MM";
    logging_mode: "full" | "keep_an_eye"; watched_groups: string[]; goals: string[]; cuisines: string[];
    keep_meal_photos: boolean; hide_charts: boolean; revision: number;
  };
  today: { date: string; highest_logged: number | null; provisional_zero: boolean; episodes: number; duration_ms: number; duration_partial: boolean };
  open_episode: null | {
    id: string; started_at: string; start_precision: string; revision: number; current_strength: number | null;
    samples: Array<{ strength: number; observed_at: string }>; ask_still_happening: boolean;
  };
  pending_review: null | { date: string; highest_logged: number | null };
  weekly_impact_due: boolean;
  followed: string[];
  cycle_context: boolean;
  progress: { days_logged: number; confirmed_days: number; confirmed_needed: number };
  timeline: Array<{ kind: "meal" | "episode" | "activity"; id: string; at: string | null; text: string; strongest?: number | null; open?: boolean }>;
  pro: null | {
    phase?: { label: string } | null;
    experiment?: { id: string; name: string; day: number; of: number; phase: string; answered_today: boolean } | null;
    card?: { id: string; title: string; kind: string } | null;
    next_best_log?: { id: string; text: string } | null;
    shortcuts?: Array<{ href: string; label: string }>;
    adaptive?: { more_activities: string[]; more_symptoms: string[] };
    frequent_dishes?: string[];
    saved_dishes?: Array<{ id: string; name: string; place: string | null }>;
  };
  recent_dishes?: string[];
  adaptive?: { more_activities: string[]; more_symptoms: string[] };
};
