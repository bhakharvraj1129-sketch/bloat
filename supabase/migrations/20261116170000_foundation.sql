-- Bloat foundation schema (plan B02). Every private table has Row Level Security.
-- Clients may only READ their own rows. All writes go through the server with
-- public.srv_tx (server-secret gated, single transaction), so plan, consent,
-- eligibility and validation rules cannot be bypassed by calling the database directly.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Server secret (hash only). The value lives in the server's environment.
-- ---------------------------------------------------------------------------
create table private.server_secrets (
  name text primary key,
  sha256_hex text not null,
  created_at timestamptz not null default now()
);

create or replace function private.assert_secret(p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or not exists (
    select 1 from private.server_secrets s
    where s.sha256_hex = encode(sha256(convert_to(p_secret, 'utf8')), 'hex')
  ) then
    raise exception 'SERVER_SECRET_INVALID' using errcode = '42501';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 01 profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  residence_country text not null check (residence_country in ('US','CA','IN')),
  region text check (char_length(region) <= 80),
  time_zone text not null,
  analysis_time_zone text not null,
  units text not null check (units in ('us','metric')),
  date_format text not null check (date_format in ('MM/DD','DD/MM')),
  cuisines text[] not null default '{}',
  subcuisines text[] not null default '{}',
  food_preferences text[] not null default '{}',
  goals text[] not null default '{}',
  logging_mode text not null default 'full' check (logging_mode in ('full','keep_an_eye')),
  watched_groups text[] not null default '{}' check (cardinality(watched_groups) <= 5),
  keep_meal_photos boolean not null default false,
  hide_charts boolean not null default false,
  onboarding_completed_at timestamptz,
  status text not null default 'active' check (status in ('active','suspended')),
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Analysis time zone history: a change takes effect at a stated date; history does not move.
create table public.zone_periods (
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_from date not null,
  zone text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, effective_from)
);

-- 02 consents (append-only)
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('terms_privacy','health_data','wellness_ack','ai_meal','email','research','doctor_share')),
  version text not null,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  check (granted_at is not null or withdrawn_at is not null)
);
create index consents_user_idx on public.consents (user_id, type, created_at desc);

-- 03 entitlements (changed only by billing events)
create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'none' check (status in ('none','active','paused','grace','pending','failed','cancelled','refunded','chargeback')),
  billing_interval text check (billing_interval in ('monthly','three_month','annual','beta')),
  started_at timestamptz,
  ends_at timestamptz,
  pause_until timestamptz,
  billing_country text,
  provider text,
  provider_ref text,
  offer jsonb,
  pro_since timestamptz,
  recalled_check_offered_at timestamptz,
  last_event_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  event_id text not null,
  type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  applied boolean not null,
  unique (provider, event_id)
);

-- 04 question responses (definitions are the versioned JSON registry in the repo)
create table public.question_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  question_version text not null,
  value jsonb,
  status text not null check (status in ('answered','skipped')),
  answered_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index question_responses_user_idx on public.question_responses (user_id, question_id, answered_at desc);

-- 05 help page views
create table public.help_page_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_version text not null,
  viewed_at timestamptz not null,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);
create index help_page_views_user_idx on public.help_page_views (user_id);

-- 06 episodes
create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  start_zone text not null,
  start_offset_min integer not null,
  start_precision text not null check (start_precision in ('exact','approximate')),
  ended_at timestamptz,
  end_precision text check (end_precision in ('exact','approximate','unknown')),
  state text not null default 'OPEN' check (state in ('OPEN','CLOSED_REPORTED_TIME','CLOSED_APPROXIMATE','END_UNKNOWN')),
  feel text[] not null default '{}',
  eased text check (eased in ('yes','no','didn_t_pass_any','not_sure')),
  entered_at timestamptz not null default now(),
  revision integer not null default 1,
  unique (id, user_id),
  constraint episodes_end_after_start check (ended_at is null or ended_at > started_at),
  constraint episodes_state_end check (
    (state in ('OPEN','END_UNKNOWN') and ended_at is null)
    or (state in ('CLOSED_REPORTED_TIME','CLOSED_APPROXIMATE') and ended_at is not null)
  ),
  -- closed episodes cannot overlap; adjacent ones are allowed ('[)' ranges)
  constraint episodes_no_overlap exclude using gist (
    user_id with =, tstzrange(started_at, ended_at, '[)') with &&
  ) where (ended_at is not null)
);
create unique index episodes_one_open on public.episodes (user_id) where state = 'OPEN';
create index episodes_user_start_idx on public.episodes (user_id, started_at);

-- 07 strength samples (append-only readings)
create table public.strength_samples (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  strength integer not null check (strength between 1 and 10),
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (episode_id, user_id) references public.episodes (id, user_id) on delete cascade
);
create index strength_samples_ep_idx on public.strength_samples (episode_id);
create index strength_samples_user_idx on public.strength_samples (user_id, observed_at);

-- 08 episode detail
create table public.episode_symptoms (
  episode_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  primary key (episode_id, code),
  foreign key (episode_id, user_id) references public.episodes (id, user_id) on delete cascade
);
create index episode_symptoms_user_idx on public.episode_symptoms (user_id);

create table public.warning_signs (
  episode_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  logged_at timestamptz not null default now(),
  primary key (episode_id, code),
  foreign key (episode_id, user_id) references public.episodes (id, user_id) on delete cascade
);
create index warning_signs_user_idx on public.warning_signs (user_id);

-- 10 meals (created before suspicions so they can be referenced)
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null,
  zone text not null,
  offset_min integer not null,
  time_precision text not null default 'exact' check (time_precision in ('exact','approximate')),
  dish_text text not null check (char_length(dish_text) between 1 and 300),
  portion text check (portion in ('small','medium','large','not_sure')),
  amount_count numeric check (amount_count > 0),
  amount_unit text check (amount_unit in ('slices','pieces','cups','bowls','plates','cans_or_bottles','fl_oz','ml')),
  pace text check (pace in ('slowly','usual_pace','quickly','not_sure')),
  origin text check (origin in ('home','restaurant_or_takeaway','someone_else_s_home','other','not_sure')),
  source text not null default 'typed' check (source in ('typed','photo','recent','saved_dish')),
  saved_dish_id uuid,
  saved_dish_confirmed boolean not null default false,
  ai_check_status text not null check (ai_check_status in ('free_plan','not_requested','checked','abstained','failed','paused','limited','manual','dont_know','recalled')),
  save_key text not null,
  entered_at timestamptz not null default now(),
  revision integer not null default 1,
  unique (id, user_id),
  unique (user_id, save_key)
);
create index meals_user_time_idx on public.meals (user_id, eaten_at);

create table public.episode_suspicions (
  episode_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('meal','activity','not_sure')),
  meal_id uuid,
  activity_id text,
  created_at timestamptz not null default now(),
  foreign key (episode_id, user_id) references public.episodes (id, user_id) on delete cascade,
  foreign key (meal_id, user_id) references public.meals (id, user_id) on delete cascade
);
create index episode_suspicions_user_idx on public.episode_suspicions (user_id);

-- 09 day reviews (day status and score are derived by versioned rules on read)
create table public.day_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  worst integer check (worst between 0 and 10),
  cannot_remember boolean not null default false,
  whole_day text check (whole_day in ('yes','only_part_of_the_day','not_sure')),
  food_coverage text check (food_coverage in ('all','mostly','some','none_recorded','not_sure','i_ate_and_drank_nothing')),
  bowel_answer text check (bowel_answer in ('yes','no','not_sure')),
  watched jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz not null,
  late boolean not null,
  metric_version text not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  primary key (user_id, date),
  check (not (cannot_remember and worst is not null))
);

create table public.day_marks (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  no_bloating_at timestamptz not null,
  primary key (user_id, date)
);

create table public.weekly_impacts (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  answer text not null check (answer in ('not_at_all','a_little','a_lot','skip')),
  answered_at timestamptz not null,
  primary key (user_id, week_start)
);

-- 11 meal ingredients
create table public.meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  food_group text not null check (food_group ~ '^(TAG-(0[1-9]|1[0-2])|other)$'),
  answer text not null check (answer in ('had','didnt_have','not_sure','unknown')),
  source text not null check (source in ('ai_confirmed','user_added','saved_dish','recalled','guess','dont_know','ai_failed')),
  source_label text check (source_label in ('seen_in_photo','usually_in_recipe')),
  ai_listed boolean not null default false,
  model_version text,
  prompt_version text,
  created_at timestamptz not null default now(),
  foreign key (meal_id, user_id) references public.meals (id, user_id) on delete cascade
);
create index meal_ingredients_meal_idx on public.meal_ingredients (meal_id);
create index meal_ingredients_user_idx on public.meal_ingredients (user_id);

-- 12 meal photos (kept only when the user turned "Keep my meal photos" on)
create table public.meal_photos (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  kept boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (meal_id, user_id) references public.meals (id, user_id) on delete cascade
);
create index meal_photos_user_idx on public.meal_photos (user_id);

-- 13 saved dishes and versions
create table public.saved_dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 300),
  place text check (char_length(place) <= 80),
  current_version integer not null default 1,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index saved_dishes_user_idx on public.saved_dishes (user_id);

create table public.saved_dish_versions (
  dish_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  ingredients jsonb not null,
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (dish_id, version),
  foreign key (dish_id, user_id) references public.saved_dishes (id, user_id) on delete cascade
);
create index saved_dish_versions_user_idx on public.saved_dish_versions (user_id);

alter table public.meals
  add constraint meals_saved_dish_fk foreign key (saved_dish_id, user_id)
  references public.saved_dishes (id, user_id);

-- 14 food suggestions (one AI result per save key and purpose; never sent twice)
create table public.food_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  save_key text not null,
  purpose text not null check (purpose in ('DISH_RECOGNITION_FROM_PHOTO','FOOD_GROUP_INGREDIENT_LIST')),
  input_hash text not null,
  output jsonb,
  model text,
  prompt_version text,
  latency_ms integer,
  status text not null check (status in ('ok','abstained','failed','paused','limited','too_large')),
  created_at timestamptz not null default now(),
  unique (user_id, save_key, purpose)
);

-- 15 activities
create table public.followed_activities (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null check (activity_id ~ '^ACT-(0[1-9]|1[0-9]|2[0-4])$'),
  position integer not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, activity_id),
  unique (user_id, position)
);

create table public.activity_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  activity_id text not null check (activity_id ~ '^ACT-(0[1-9]|1[0-9]|2[0-4])$'),
  answer text not null check (answer in ('yes','no','not_sure')),
  detail jsonb,
  observed_at timestamptz,
  source text not null check (source in ('tap','review')),
  created_at timestamptz not null default now(),
  unique (user_id, date, activity_id)
);

create table public.cycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('start','end')),
  date date not null,
  date_precision text not null check (date_precision in ('exact','approximate')),
  created_at timestamptz not null default now(),
  unique (user_id, kind, date)
);

-- 16 exercise
create table public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  started_at timestamptz not null,
  zone text not null,
  offset_min integer not null,
  time_precision text not null check (time_precision in ('exact','approximate')),
  minutes integer not null check (minutes between 1 and 1440),
  intensity text check (intensity in ('light','moderate','vigorous','not_sure')),
  meal_relation text check (meal_relation in ('before_a_meal','after_a_meal','not_near_a_meal','not_sure')),
  minutes_from_last_meal integer,
  minutes_to_next_meal integer,
  revision integer not null default 1,
  created_at timestamptz not null default now()
);
create index exercise_user_idx on public.exercise_records (user_id, started_at);

-- 17 bowel movements (an explicit "No" for a day lives on day_reviews.bowel_answer)
create table public.bowel_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  zone text not null,
  offset_min integer not null,
  time_precision text not null check (time_precision in ('exact','approximate')),
  stool_type text,
  strain text check (strain in ('yes','no','not_sure')),
  complete text check (complete in ('yes','no','not_sure')),
  revision integer not null default 1,
  created_at timestamptz not null default now()
);
create index bowel_user_idx on public.bowel_movements (user_id, occurred_at);

-- 18 medicines
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  type text not null check (type in ('medicine','supplement')),
  med_group text,
  started_on date,
  started_precision text not null check (started_precision in ('exact','approximate','not_sure')),
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index medicines_user_idx on public.medicines (user_id);

create table public.medicine_changes (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  change text not null check (change in ('stopped','dose_changed','restarted')),
  date date,
  date_precision text not null check (date_precision in ('exact','approximate','not_sure')),
  created_at timestamptz not null default now(),
  foreign key (medicine_id, user_id) references public.medicines (id, user_id) on delete cascade
);
create index medicine_changes_user_idx on public.medicine_changes (user_id);

-- 19 health background (Pro)
create table public.health_conditions (
  user_id uuid not null references auth.users(id) on delete cascade,
  condition text not null,
  status text check (status in ('diagnosed_by_a_doctor','i_suspect_it','tested_ruled_out','not_sure','prefer_not_to_say')),
  year integer check (year between 1900 and 2100),
  created_at timestamptz not null default now(),
  primary key (user_id, condition)
);

create table public.lactose_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  breath_test text check (breath_test in ('positive','negative','unclear','not_had')),
  after_dairy text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.health_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test text not null,
  date date,
  date_precision text check (date_precision in ('exact','approximate','not_sure')),
  result_text text check (char_length(result_text) <= 200),
  created_at timestamptz not null default now()
);
create index health_tests_user_idx on public.health_tests (user_id);

-- 21 reports and shares (immutable snapshots)
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('pattern','journey','doctor','quarterly')),
  range_from date not null,
  range_to date not null,
  snapshot jsonb not null,
  versions jsonb not null,
  stale boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index reports_user_idx on public.reports (user_id, kind, created_at desc);

create table public.report_shares (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  recipient text not null check (char_length(recipient) between 1 and 120),
  purpose text not null check (char_length(purpose) between 1 and 200),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (report_id, user_id) references public.reports (id, user_id) on delete cascade
);
create index report_shares_user_idx on public.report_shares (user_id);

-- 22 focus cards and nudges
create table public.focus_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  rule text not null,
  dismissed_until date,
  dismiss_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, rule)
);

create table public.nudge_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  doctor_paused_until date,
  reason text check (reason in ('spoken_to_doctor','not_now')),
  updated_at timestamptz not null default now()
);

-- 23 experiments
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('habit','swap')),
  key text not null,
  food_group text,
  phase text not null check (phase in ('RUNNING','ADDING_BACK','PAUSED','COMPLETED','ENDED_EARLY')),
  paused_from text check (paused_from in ('RUNNING','ADDING_BACK')),
  started_on date not null,
  swap_ends_on date,
  add_back_ends_on date,
  ended_on date,
  end_reason text,
  result jsonb,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index experiments_one_active on public.experiments (user_id) where phase in ('RUNNING','ADDING_BACK','PAUSED');
create index experiments_user_idx on public.experiments (user_id, started_on);

create table public.experiment_days (
  experiment_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  answer text not null check (answer in ('yes','partly','no')),
  created_at timestamptz not null default now(),
  primary key (experiment_id, date),
  foreign key (experiment_id, user_id) references public.experiments (id, user_id) on delete cascade
);
create index experiment_days_user_idx on public.experiment_days (user_id);

create table public.experiment_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fx01 text not null check (fx01 in ('yes','no','not_sure','prefer_not_to_say')),
  fx02 text not null check (fx02 in ('yes','no','not_sure','prefer_not_to_say')),
  fx03 text not null check (fx03 in ('yes','no','not_sure','prefer_not_to_say')),
  fx04 text not null check (fx04 in ('yes','no','not_sure','prefer_not_to_say')),
  passed boolean not null,
  checked_at timestamptz not null default now()
);
create index experiment_checks_user_idx on public.experiment_checks (user_id, checked_at desc);

create table public.wellbeing_checks (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  wb01 text not null check (wb01 in ('yes','no')),
  wb02 text not null check (wb02 in ('yes','no')),
  checked_at timestamptz not null default now(),
  foreign key (experiment_id, user_id) references public.experiments (id, user_id) on delete cascade
);
create index wellbeing_checks_user_idx on public.wellbeing_checks (user_id);

-- 25 card events and before/after scores
create table public.card_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  card_version text not null,
  date date not null,
  reason text,
  feedback jsonb,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index card_events_user_card_idx on public.card_events (user_id, card_id);

create table public.hidden_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  hidden_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table public.activity_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ref_kind text not null check (ref_kind in ('card','experiment','exercise')),
  ref_id text not null,
  date date not null,
  before_score integer check (before_score between 0 and 10),
  after_score integer check (after_score between 0 and 10),
  created_at timestamptz not null default now()
);
create index activity_responses_user_idx on public.activity_responses (user_id, ref_kind, ref_id);

-- 26 feature flags and country capabilities (no user data)
create table public.feature_flags (
  key text primary key,
  enabled boolean not null,
  note text,
  updated_at timestamptz not null default now()
);

create table public.country_capabilities (
  country text not null,
  feature text not null,
  status text not null check (status in ('not_reviewed','review_in_progress','ready','suspended','retired')),
  updated_at timestamptz not null default now(),
  primary key (country, feature)
);

-- 27 operations
create table public.command_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  key text not null check (char_length(key) between 8 and 128),
  payload_hash text not null,
  http_status integer,
  response jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, route, key)
);

-- Product events: counts only. No health values, food, symptoms or free text (plan B04).
create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9_]{1,60}$'),
  props jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index product_events_user_idx on public.product_events (user_id, at);

-- Founder review queue: Worse taps, "I felt worse" endings, wellbeing pauses. Kind and reference only.
create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('card_worse','experiment_felt_worse','wellbeing_pause')),
  ref text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index review_queue_user_idx on public.review_queue (user_id);

create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('json','csv')),
  status text not null check (status in ('ready','expired')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index export_jobs_user_idx on public.export_jobs (user_id);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index audit_log_user_idx on public.audit_log (user_id, at);

-- AI usage ledger (cost control, plan 0.4). No prompt text or user content.
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  local_day date not null,
  purpose text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_micros bigint not null default 0,
  latency_ms integer,
  retried boolean not null default false,
  failed boolean not null default false
);
create index ai_usage_user_idx on public.ai_usage (user_id, at);
create index ai_usage_at_idx on public.ai_usage (at);

-- Tables without a user: never readable by clients.
create table private.ai_settings (
  id boolean primary key default true check (id),
  monthly_limit_micros bigint not null default 50000000,
  expected_cost_micros bigint not null default 300,
  updated_at timestamptz not null default now()
);
insert into private.ai_settings default values;

create table private.ai_alerts (
  month text not null,
  level integer not null,
  sent_at timestamptz not null default now(),
  primary key (month, level)
);

-- Founder alerts outbox: budget levels, cost anomalies, bad model, failure rates. Never user data.
create table private.founder_alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table private.deletion_tombstones (
  user_hash text primary key,
  deleted_at timestamptz not null default now()
);

create table private.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  country text not null check (char_length(country) between 2 and 60),
  created_at timestamptz not null default now(),
  unique (email, country)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: owners can read their own rows; no client writes at all.
-- ---------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public' and c.column_name = 'user_id' and tb.table_type = 'BASE TABLE'
  loop
    execute format('alter table public.%I enable row level security', t.table_name);
    execute format('revoke all on public.%I from anon, authenticated', t.table_name);
    execute format('grant select on public.%I to authenticated', t.table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      t.table_name || '_owner_select', t.table_name);
  end loop;
end $$;

-- Server-only tables: command log and the billing event log are not readable by clients.
revoke select on public.billing_events, public.ai_usage, public.review_queue, public.audit_log from authenticated;

alter table public.feature_flags enable row level security;
alter table public.country_capabilities enable row level security;
revoke all on public.feature_flags, public.country_capabilities from anon, authenticated;
grant select on public.feature_flags, public.country_capabilities to anon, authenticated;
create policy feature_flags_read on public.feature_flags for select to anon, authenticated using (true);
create policy country_capabilities_read on public.country_capabilities for select to anon, authenticated using (true);

insert into public.feature_flags (key, enabled, note) values
  ('ai_enabled', true, 'Emergency kill switch for all AI calls (plan 0.4). Checked on every request.'),
  ('checkout_enabled', false, 'Real payments. Stays false until Gate 2 and the owner''s explicit yes.'),
  ('production', false, 'All production flags are false until Gate 1.');

insert into public.country_capabilities (country, feature, status)
select c, f, 'not_reviewed' from unnest(array['US','CA','IN']) c, unnest(array['recording','payments']) f;
