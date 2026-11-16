-- Server-only functions. Each one checks the server secret first.
-- They are the only way to write data, so rules checked by the server cannot be bypassed.

-- Apply a list of write operations for one user in a single transaction.
-- op: {"op":"insert"|"upsert"|"update"|"delete","table":..., "row":{}, "conflict":[..], "match":{}, "set":{}, "require":bool}
create or replace function public.srv_tx(p_secret text, p_user uuid, p_ops jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  op jsonb; t text; kind text; cols text; sets text; mcols text; conflict text;
  row_j jsonb; r jsonb; n bigint; res jsonb := '[]'::jsonb;
begin
  perform private.assert_secret(p_secret);
  if p_user is null then raise exception 'NO_USER'; end if;
  if not exists (select 1 from auth.users u where u.id = p_user) then
    raise exception 'USER_GONE' using errcode = 'P0002';
  end if;
  for op in select * from jsonb_array_elements(p_ops) loop
    t := op->>'table'; kind := op->>'op'; r := null;
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = t and c.column_name = 'user_id'
    ) then
      raise exception 'BAD_TABLE %', t;
    end if;
    if kind in ('insert','upsert') then
      row_j := (op->'row') || jsonb_build_object('user_id', p_user);
      select string_agg(format('%I', k), ',') into cols from jsonb_object_keys(row_j) k;
      conflict := '';
      if kind = 'upsert' then
        select string_agg(format('%I = excluded.%I', k, k), ',') into sets
          from jsonb_object_keys(row_j) k
          where k not in (select jsonb_array_elements_text(op->'conflict'));
        select string_agg(format('%I', k), ',') into mcols from jsonb_array_elements_text(op->'conflict') k;
        conflict := format(' on conflict (%s) do update set %s where x.user_id = %L', mcols, coalesce(sets, 'user_id = excluded.user_id'), p_user);
      end if;
      execute format(
        'insert into public.%I as x (%s) select %s from jsonb_populate_record(null::public.%I, $1)%s returning to_jsonb(x.*)',
        t, cols, cols, t, conflict) using row_j into r;
      get diagnostics n = row_count;
    elsif kind = 'update' then
      select string_agg(format('%I', k), ',') into cols from jsonb_object_keys(op->'set') k where k <> 'user_id';
      select string_agg(format('%I', k), ',') into mcols from jsonb_object_keys(op->'match') k;
      execute format(
        'update public.%I as x set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1)) '
        'where x.user_id = $2 and (%s) = (select %s from jsonb_populate_record(null::public.%I, $3)) returning to_jsonb(x.*)',
        t, cols, cols, t, mcols, mcols, t) using op->'set', p_user, op->'match' into r;
      get diagnostics n = row_count;
    elsif kind = 'delete' then
      select string_agg(format('%I', k), ',') into mcols from jsonb_object_keys(op->'match') k;
      if mcols is null then
        execute format('delete from public.%I as x where x.user_id = $1', t) using p_user;
      else
        execute format(
          'delete from public.%I as x where x.user_id = $1 and (%s) = (select %s from jsonb_populate_record(null::public.%I, $2))',
          t, mcols, mcols, t) using p_user, op->'match';
      end if;
      get diagnostics n = row_count;
    else
      raise exception 'BAD_OP %', kind;
    end if;
    if coalesce((op->>'require')::boolean, false) and n = 0 then
      raise exception 'NO_MATCH %', t using errcode = 'P0003';
    end if;
    res := res || jsonb_build_array(jsonb_build_object('n', n, 'row', r));
  end loop;
  return res;
end $$;

-- AI gate: kill switch, monthly spending limit, per-user hour and day counts (plan 0.4).
create or replace function public.srv_ai_gate(p_secret text, p_user uuid, p_local_day date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s private.ai_settings; spent bigint; h int; d int; on_ boolean;
begin
  perform private.assert_secret(p_secret);
  select * into s from private.ai_settings;
  select coalesce((select enabled from public.feature_flags where key = 'ai_enabled'), false) into on_;
  select coalesce(sum(cost_micros), 0) into spent from public.ai_usage where at >= date_trunc('month', now());
  select count(*) into h from public.ai_usage where user_id = p_user and at > now() - interval '1 hour';
  select count(*) into d from public.ai_usage where user_id = p_user and local_day = p_local_day;
  return jsonb_build_object('enabled', on_, 'month_spent_micros', spent,
    'monthly_limit_micros', s.monthly_limit_micros, 'expected_cost_micros', s.expected_cost_micros,
    'hour_count', h, 'day_count', d);
end $$;

-- Record one AI call; returns budget levels (50/80/100) newly crossed so one alert is sent per level.
create or replace function public.srv_ai_record(p_secret text, p_user uuid, p_row jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s private.ai_settings; spent bigint; lvl int; crossed int[] := '{}'; m text := to_char(now(), 'YYYY-MM'); cost bigint;
begin
  perform private.assert_secret(p_secret);
  cost := coalesce((p_row->>'cost_micros')::bigint, 0);
  insert into public.ai_usage (user_id, local_day, purpose, model, input_tokens, output_tokens, cost_micros, latency_ms, retried, failed)
  values (p_user, (p_row->>'local_day')::date, p_row->>'purpose', p_row->>'model',
    coalesce((p_row->>'input_tokens')::int, 0), coalesce((p_row->>'output_tokens')::int, 0), cost,
    (p_row->>'latency_ms')::int, coalesce((p_row->>'retried')::boolean, false), coalesce((p_row->>'failed')::boolean, false));
  select * into s from private.ai_settings;
  select coalesce(sum(cost_micros), 0) into spent from public.ai_usage where at >= date_trunc('month', now());
  foreach lvl in array array[50, 80, 100] loop
    if spent * 100 >= s.monthly_limit_micros * lvl then
      insert into private.ai_alerts (month, level) values (m, lvl) on conflict do nothing;
      if found then
        crossed := crossed || lvl;
        insert into private.founder_alerts (kind, detail)
        values ('ai_budget', jsonb_build_object('level_percent', lvl, 'month', m, 'spent_micros', spent, 'limit_micros', s.monthly_limit_micros));
      end if;
    end if;
  end loop;
  if s.expected_cost_micros > 0 and cost >= 3 * s.expected_cost_micros then
    insert into private.founder_alerts (kind, detail)
    values ('ai_cost_anomaly', jsonb_build_object('cost_micros', cost, 'expected_micros', s.expected_cost_micros,
      'model', p_row->>'model', 'input_tokens', (p_row->>'input_tokens')::int, 'output_tokens', (p_row->>'output_tokens')::int));
  end if;
  return jsonb_build_object('month_spent_micros', spent, 'crossed', to_jsonb(crossed));
end $$;

create or replace function public.srv_alert(p_secret text, p_kind text, p_detail jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  insert into private.founder_alerts (kind, detail) values (p_kind, coalesce(p_detail, '{}'::jsonb));
end $$;

-- Founder settings: spending limit and flags (used by the founder tools, never by clients).
create or replace function public.srv_admin_set(p_secret text, p_what text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if p_what = 'monthly_limit_micros' then
    update private.ai_settings set monthly_limit_micros = (p_value #>> '{}')::bigint, updated_at = now() where id;
  elsif p_what = 'expected_cost_micros' then
    update private.ai_settings set expected_cost_micros = (p_value #>> '{}')::bigint, updated_at = now() where id;
  elsif p_what = 'flag' then
    insert into public.feature_flags (key, enabled) values (p_value->>'key', (p_value->>'enabled')::boolean)
    on conflict (key) do update set enabled = excluded.enabled, updated_at = now();
  else
    raise exception 'BAD_SETTING';
  end if;
end $$;

create or replace function public.srv_admin_read(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'ai_settings', (select to_jsonb(s) from private.ai_settings s),
    'month_spent_micros', (select coalesce(sum(cost_micros), 0) from public.ai_usage where at >= date_trunc('month', now())),
    'ai_calls_24h', (select count(*) from public.ai_usage where at > now() - interval '24 hours'),
    'ai_failures_24h', (select count(*) from public.ai_usage where failed and at > now() - interval '24 hours'),
    'alerts', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc), '[]'::jsonb) from (select * from private.founder_alerts order by created_at desc limit 50) a),
    'review_queue', (select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'kind', q.kind, 'ref', q.ref, 'created_at', q.created_at, 'reviewed_at', q.reviewed_at) order by q.created_at desc), '[]'::jsonb)
      from (select * from public.review_queue order by created_at desc limit 100) q),
    'flags', (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from public.feature_flags f),
    'events_7d', (select coalesce(jsonb_object_agg(name, c), '{}'::jsonb) from (select name, count(*) c from public.product_events where at > now() - interval '7 days' group by name) e),
    'waitlist_count', (select count(*) from private.waitlist)
  );
end $$;

-- Billing: one authoritative, idempotent, ordered entitlement update per provider event (plan A04).
create or replace function public.srv_billing_event(p_secret text, p_event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (p_event->>'user_id')::uuid; typ text := p_event->>'type';
  at_ timestamptz := (p_event->>'occurred_at')::timestamptz; cur public.entitlements; stale boolean := false;
begin
  perform private.assert_secret(p_secret);
  begin
    insert into public.billing_events (user_id, provider, event_id, type, occurred_at, applied)
    values (uid, p_event->>'provider', p_event->>'event_id', typ, at_, true);
  exception when unique_violation then
    return jsonb_build_object('duplicate', true, 'applied', false);
  end;
  insert into public.entitlements (user_id) values (uid) on conflict do nothing;
  select * into cur from public.entitlements where user_id = uid for update;
  if cur.last_event_at is not null and at_ < cur.last_event_at then
    stale := true;
    update public.billing_events set applied = false where provider = p_event->>'provider' and event_id = p_event->>'event_id';
    return jsonb_build_object('duplicate', false, 'applied', false, 'stale', true);
  end if;
  if typ in ('activated','renewed','resumed') then
    update public.entitlements set plan = 'pro', status = 'active',
      billing_interval = coalesce(p_event->>'interval', billing_interval),
      started_at = coalesce(started_at, at_), ends_at = (p_event->>'ends_at')::timestamptz, pause_until = null,
      billing_country = coalesce(p_event->>'billing_country', billing_country),
      provider = p_event->>'provider', provider_ref = coalesce(p_event->>'provider_ref', provider_ref),
      offer = coalesce(p_event->'offer', offer), pro_since = coalesce(pro_since, at_),
      last_event_at = at_, updated_at = now() where user_id = uid;
  elsif typ = 'paused' then
    update public.entitlements set status = 'paused', pause_until = (p_event->>'pause_until')::timestamptz,
      last_event_at = at_, updated_at = now() where user_id = uid;
  elsif typ in ('payment_failed','grace') then
    update public.entitlements set status = case when typ = 'grace' then 'grace' else 'failed' end,
      last_event_at = at_, updated_at = now() where user_id = uid;
  elsif typ in ('cancelled','refunded','chargeback','expired') then
    update public.entitlements set
      status = case typ when 'refunded' then 'refunded' when 'chargeback' then 'chargeback' else 'cancelled' end,
      plan = case when typ = 'cancelled' and (p_event->>'ends_at')::timestamptz > now() then plan else 'free' end,
      ends_at = coalesce((p_event->>'ends_at')::timestamptz, ends_at),
      last_event_at = at_, updated_at = now() where user_id = uid;
  else
    raise exception 'BAD_EVENT_TYPE %', typ;
  end if;
  return jsonb_build_object('duplicate', false, 'applied', true);
end $$;

-- Account deletion: tombstone, then purge everything (all tables cascade from auth.users).
create or replace function public.srv_delete_account(p_secret text, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  insert into private.deletion_tombstones (user_hash)
  values (encode(sha256(convert_to(p_user::text, 'utf8')), 'hex')) on conflict do nothing;
  delete from auth.users where id = p_user;
end $$;

-- After a backup restore: delete again every account that has a tombstone.
create or replace function public.srv_reapply_tombstones(p_secret text)
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  perform private.assert_secret(p_secret);
  delete from auth.users u where exists (
    select 1 from private.deletion_tombstones t
    where t.user_hash = encode(sha256(convert_to(u.id::text, 'utf8')), 'hex'));
  get diagnostics n = row_count;
  return n;
end $$;

-- Public share link lookup by token hash: only live, unrevoked shares return anything.
create or replace function public.srv_share_lookup(p_secret text, p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare out_ jsonb;
begin
  perform private.assert_secret(p_secret);
  select jsonb_build_object('report_id', r.id, 'kind', r.kind, 'snapshot', r.snapshot, 'versions', r.versions,
      'range_from', r.range_from, 'range_to', r.range_to, 'created_at', r.created_at, 'expires_at', s.expires_at)
    into out_
  from public.report_shares s join public.reports r on r.id = s.report_id and r.user_id = s.user_id
  where s.token_hash = p_token_hash and s.revoked_at is null and s.expires_at > now() and not r.stale;
  return out_;
end $$;

create or replace function public.srv_export_lookup(p_secret text, p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare out_ jsonb;
begin
  perform private.assert_secret(p_secret);
  select jsonb_build_object('user_id', j.user_id, 'format', j.format, 'id', j.id) into out_
  from public.export_jobs j where j.token_hash = p_token_hash and j.expires_at > now() and j.status = 'ready';
  return out_;
end $$;

create or replace function public.srv_waitlist_add(p_secret text, p_email text, p_country text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  insert into private.waitlist (email, country) values (lower(trim(p_email)), p_country) on conflict do nothing;
end $$;

-- Lock every function down, then allow the secret-gated ones to be called through the API.
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
grant execute on function
  public.srv_tx(text, uuid, jsonb), public.srv_ai_gate(text, uuid, date), public.srv_ai_record(text, uuid, jsonb),
  public.srv_alert(text, text, jsonb), public.srv_admin_set(text, text, jsonb), public.srv_admin_read(text),
  public.srv_billing_event(text, jsonb), public.srv_delete_account(text, uuid), public.srv_reapply_tombstones(text),
  public.srv_share_lookup(text, text), public.srv_export_lookup(text, text), public.srv_waitlist_add(text, text, text)
to anon, authenticated;

-- Private storage for kept meal photos: each user can reach only their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 2097152, array['image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy meal_photos_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy meal_photos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy meal_photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
