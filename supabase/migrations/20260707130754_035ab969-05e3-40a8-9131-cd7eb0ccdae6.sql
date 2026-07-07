
-- Trigger function: fire when an email is moved to the DLQ (status='dlq' in
-- public.email_send_log). Posts to the internal alerts endpoint, which
-- enqueues a branded alert email to the operations mailbox.
CREATE OR REPLACE FUNCTION public.notify_email_dlq()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  svc_key text;
BEGIN
  -- Only fire on DLQ transitions
  IF NEW.status IS DISTINCT FROM 'dlq' THEN
    RETURN NEW;
  END IF;

  -- Never alert on the alert template itself (defence-in-depth against loops)
  IF COALESCE(NEW.template_name, '') = 'email-dlq-alert' THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO svc_key
    FROM vault.decrypted_secrets
    WHERE name = 'email_queue_service_role_key';
  EXCEPTION WHEN OTHERS THEN
    svc_key := NULL;
  END;

  IF svc_key IS NULL THEN
    RAISE WARNING 'notify_email_dlq: missing vault secret email_queue_service_role_key';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://project--d4274815-117e-4165-b985-4a102b99aa9c.lovable.app/api/public/alerts/email-dlq',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || svc_key
      ),
      body := jsonb_build_object(
        'message_id', NEW.message_id,
        'template_name', NEW.template_name,
        'recipient_email', NEW.recipient_email,
        'error_message', NEW.error_message,
        'failed_at', NEW.created_at,
        'metadata', NEW.metadata
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_email_dlq: http_post failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Lock down execution: only the trigger owner (and service role) may run it.
REVOKE ALL ON FUNCTION public.notify_email_dlq() FROM PUBLIC, anon, authenticated;

-- Idempotent trigger install
DROP TRIGGER IF EXISTS trg_notify_email_dlq ON public.email_send_log;
CREATE TRIGGER trg_notify_email_dlq
AFTER INSERT ON public.email_send_log
FOR EACH ROW
EXECUTE FUNCTION public.notify_email_dlq();
