-- Supabase's security advisor flags the 14 secret-gated server functions as callable by the anon
-- and authenticated roles. The app's server calls them with the publishable key (anon role) and
-- proves itself with the server secret, which each function checks first (private.assert_secret).
-- Signed-in users never need them, so they lose EXECUTE here. A signed-in user now gets
-- "permission denied" even with the right secret; the server path (anon + secret) is unchanged.
revoke execute on function
  public.srv_tx(text, uuid, jsonb), public.srv_ai_gate(text, uuid, date), public.srv_ai_record(text, uuid, jsonb),
  public.srv_alert(text, text, jsonb), public.srv_admin_set(text, text, jsonb), public.srv_admin_read(text),
  public.srv_billing_event(text, jsonb), public.srv_delete_account(text, uuid), public.srv_reapply_tombstones(text),
  public.srv_share_lookup(text, text), public.srv_export_lookup(text, text), public.srv_waitlist_add(text, text, text),
  public.srv_test_user(text, text, text), public.srv_capability_set(text, text, text, text)
from authenticated;
