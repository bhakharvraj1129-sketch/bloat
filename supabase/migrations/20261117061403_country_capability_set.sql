-- Founder tools can pause or restore a capability for one country (plan: "Country or provider
-- change: capability off with explanation; rights workflows kept"). No user data is touched.
create or replace function public.srv_capability_set(p_secret text, p_country text, p_feature text, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if p_country not in ('US','CA','IN') or p_feature not in ('recording','payments') then
    raise exception 'BAD_SETTING';
  end if;
  insert into public.country_capabilities (country, feature, status) values (p_country, p_feature, p_status)
  on conflict (country, feature) do update set status = excluded.status, updated_at = now();
end $$;

revoke all on function public.srv_capability_set(text, text, text, text) from public;
grant execute on function public.srv_capability_set(text, text, text, text) to anon, authenticated;
