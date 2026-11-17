-- Doctor report privacy fix. Before this, switching off Medicines or Health background removed
-- the detailed sections but the page 1 summary still held medicine names and context such as
-- pregnancy. The app now filters every output (src/lib/domain/report-privacy.ts). This migration
-- applies the same rules to snapshots already stored, so old reports and their share links hold
-- nothing from a switched-off section either. Rules, in short:
--   included sections: the snapshot's "included" list, else the sections that hold data
--   Symptoms off: symptom figures, warning signs and the doctor line are removed
--   Medicines off: medicine names and the medicine line are removed
--   Health off: context (pregnancy, breastfeeding, menopause, periods, age range) and the
--     ovarian sentence are removed
--   Meals off: food patterns removed. Habits off: habit patterns removed.
-- Share links, their expiry and revocation are not touched.

create or replace function private.scrub_doctor_snapshot(d jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  all_secs constant text[] := array['symptoms','meals','bowel','habits','medicines','health','family','tests','experiments','missing'];
  inc text[];
  k text;
  secs jsonb := coalesce(d->'sections', '{}'::jsonb);
  s jsonb := coalesce(d->'summary', '{}'::jsonb);
begin
  if jsonb_typeof(d->'included') = 'array' then
    select coalesce(array_agg(x), '{}') into inc from jsonb_array_elements_text(d->'included') x where x = any(all_secs);
  else
    select coalesce(array_agg(k2), '{}') into inc from unnest(all_secs) k2 where secs ? k2 and jsonb_typeof(secs->k2) <> 'null';
  end if;
  foreach k in array all_secs loop
    if not (k = any(inc)) then secs := jsonb_set(secs, array[k], 'null'::jsonb, true); end if;
  end loop;
  if not ('symptoms' = any(inc)) then
    s := s || jsonb_build_object('bloating_days_30', null, 'typical_strength', null, 'average_daily_score', null,
      'typical_episode_minutes', null, 'how_long', null, 'how_often', null, 'weekly_impact', null,
      'warning_signs', '[]'::jsonb, 'doctor_line', null);
  end if;
  if not ('medicines' = any(inc)) then
    s := s || jsonb_build_object('medicines', '[]'::jsonb);
    d := d || jsonb_build_object('medicine_line', null);
  end if;
  if not ('health' = any(inc)) then
    s := s || jsonb_build_object('context', '[]'::jsonb);
    if jsonb_typeof(s->'doctor_line') = 'object' then s := jsonb_set(s, '{doctor_line,ovarian}', 'null'::jsonb, true); end if;
  end if;
  s := jsonb_set(s, '{patterns}', coalesce((
    select jsonb_agg(p) from jsonb_array_elements(case when jsonb_typeof(s->'patterns') = 'array' then s->'patterns' else '[]'::jsonb end) p
    where case when p->>'kind' = 'habit' then 'habits' = any(inc)
               when p->>'kind' in ('food', 'large_meal') then 'meals' = any(inc)
               else 'meals' = any(inc) and 'habits' = any(inc) end), '[]'::jsonb), true);
  return d || jsonb_build_object('sections', secs, 'summary', s, 'included', to_jsonb(inc));
end $$;

revoke all on function private.scrub_doctor_snapshot(jsonb) from public, anon, authenticated;

update public.reports
set snapshot = private.scrub_doctor_snapshot(snapshot)
where kind = 'doctor' and snapshot is distinct from private.scrub_doctor_snapshot(snapshot);
