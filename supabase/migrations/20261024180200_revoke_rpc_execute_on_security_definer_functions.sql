-- Trigger/internal functions: no direct RPC access for API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.login_attempts_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_fields() FROM PUBLIC, anon, authenticated;
-- Used by RLS policies / admin UI: signed-in only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
