-- 1) Set immutable search_path on email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';

-- 2) Revoke public/anon/authenticated execute on all SECURITY DEFINER functions in public
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_row_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_status_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.stamp_updated_by() FROM PUBLIC, anon, authenticated;

-- 3) has_role is invoked from RLS policies as the authenticated user; keep execute for authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 4) log_approval is invoked by admin flows via RPC; keep execute for authenticated only
REVOKE EXECUTE ON FUNCTION public.log_approval(text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_approval(text, uuid, jsonb) TO authenticated;