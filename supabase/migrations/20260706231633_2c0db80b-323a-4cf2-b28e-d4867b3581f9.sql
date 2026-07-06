
-- Notify approvers on approval_requests INSERT and status change via pg_net -> internal endpoint.
CREATE OR REPLACE FUNCTION public.notify_approval_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_kind text;
  svc_key text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    event_kind := 'submitted';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
      RETURN NEW;
    END IF;
    IF NEW.status NOT IN ('approved','rejected','cancelled') THEN
      RETURN NEW;
    END IF;
    event_kind := 'decision';
  ELSE
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
    RAISE WARNING 'notify_approval_change: missing vault secret email_queue_service_role_key';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://project--d4274815-117e-4165-b985-4a102b99aa9c.lovable.app/api/public/approval-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || svc_key
      ),
      body := jsonb_build_object(
        'request_id', NEW.id,
        'event', event_kind,
        'status', NEW.status
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_approval_change: http_post failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_approval_change() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_approval_change() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_notify_approval_insert ON public.approval_requests;
CREATE TRIGGER trg_notify_approval_insert
AFTER INSERT ON public.approval_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_approval_change();

DROP TRIGGER IF EXISTS trg_notify_approval_update ON public.approval_requests;
CREATE TRIGGER trg_notify_approval_update
AFTER UPDATE OF status ON public.approval_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_approval_change();
