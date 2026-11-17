-- Synthetic test accounts for private previews. Creates an already-confirmed sign-in for an
-- @example.com or @bloat.test address only (addresses no real person can own), so preview and
-- browser tests need no mailbox and send no email. Needs the server secret, and the app only
-- calls it when BLOAT_TEST_LOGIN=1, which a live site must never set.
create or replace function public.srv_test_user(p_secret text, p_email text, p_password text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid; addr text := lower(trim(p_email));
begin
  perform private.assert_secret(p_secret);
  if addr !~ '^[a-z0-9._+-]+@(example\.com|bloat\.test)$' then
    raise exception 'NOT_SYNTHETIC' using errcode = '22023';
  end if;
  if p_password is null or char_length(p_password) < 8 or char_length(p_password) > 72 then
    raise exception 'BAD_PASSWORD' using errcode = '22023';
  end if;
  select u.id into uid from auth.users u where u.email = addr;
  if uid is not null then return uid; end if;
  uid := gen_random_uuid();
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', addr,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', addr, 'email_verified', true), 'email', now(), now(), now());
  return uid;
end $$;

revoke execute on function public.srv_test_user(text, text, text) from public, anon, authenticated;
grant execute on function public.srv_test_user(text, text, text) to anon, authenticated;
