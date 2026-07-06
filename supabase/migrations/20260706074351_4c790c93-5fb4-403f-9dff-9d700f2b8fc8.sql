
-- 1. Add approval audit columns to project_inquiries
ALTER TABLE public.project_inquiries
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 2. Reusable trigger: stamps approved_by/approved_at + logs to activity_logs
--    Fires on any table that has: a text 'status' column, and optional
--    'approved_by uuid' / 'approved_at timestamptz' columns.
CREATE OR REPLACE FUNCTION public.log_status_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status text;
  old_status text;
  approver uuid := auth.uid();
BEGIN
  new_status := lower(coalesce((to_jsonb(NEW) ->> 'status'), ''));
  old_status := lower(coalesce((to_jsonb(OLD) ->> 'status'), ''));

  IF new_status = 'approved' AND old_status IS DISTINCT FROM 'approved' THEN
    -- stamp approver + timestamp when the columns exist
    BEGIN
      NEW.approved_by := approver;
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
    BEGIN
      NEW.approved_at := now();
    EXCEPTION WHEN undefined_column THEN NULL;
    END;

    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
    VALUES (
      approver,
      'approve',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'previous_status', old_status,
        'new_status', new_status,
        'approved_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach to project_inquiries
DROP TRIGGER IF EXISTS project_inquiries_log_approval ON public.project_inquiries;
CREATE TRIGGER project_inquiries_log_approval
  BEFORE UPDATE OF status ON public.project_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.log_status_approval();

-- 4. Reusable RPC clients can call to log any approval action against any record
CREATE OR REPLACE FUNCTION public.log_approval(
  _entity_type text,
  _entity_id uuid,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'approve',
    _entity_type,
    _entity_id,
    coalesce(_metadata, '{}'::jsonb) || jsonb_build_object('approved_at', now())
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_approval(text, uuid, jsonb) TO authenticated;
