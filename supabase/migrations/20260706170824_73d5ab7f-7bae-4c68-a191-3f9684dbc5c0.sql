-- The queue dispatch functions are provisioned only in environments with the
-- optional email worker. Guard every mutation so a clean staging database can
-- be bootstrapped before that worker exists.
DO $$
DECLARE
  signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.enqueue_email(text,jsonb)',
    'public.read_email_batch(text,integer,integer)',
    'public.delete_email(text,bigint)',
    'public.move_to_dlq(text,text,bigint,jsonb)'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET search_path = ''''', signature);
    END IF;
  END LOOP;

  FOREACH signature IN ARRAY ARRAY[
    'public.enqueue_email(text,jsonb)',
    'public.read_email_batch(text,integer,integer)',
    'public.delete_email(text,bigint)',
    'public.move_to_dlq(text,text,bigint,jsonb)',
    'public.email_queue_dispatch()',
    'public.email_queue_wake()',
    'public.handle_new_user()',
    'public.log_row_delete()',
    'public.log_status_approval()',
    'public.stamp_updated_by()'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', signature);
    END IF;
  END LOOP;

  -- has_role and log_approval are intentionally callable by signed-in users.
  FOREACH signature IN ARRAY ARRAY[
    'public.has_role(uuid,public.app_role)',
    'public.log_approval(text,uuid,jsonb)'
  ] LOOP
    IF to_regprocedure(signature) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', signature);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', signature);
    END IF;
  END LOOP;
END
$$;
