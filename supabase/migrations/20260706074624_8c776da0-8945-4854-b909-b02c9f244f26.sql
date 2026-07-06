
-- 1. Add updated_by to the CRM record tables (deleted_by/deleted_at are captured in activity_logs
--    since these are hard deletes; adding them to hard-deleted rows would be lost with the row).
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.products  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 2. Stamp updated_by = auth.uid() on every UPDATE
CREATE OR REPLACE FUNCTION public.stamp_updated_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    NEW.updated_by := auth.uid();
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stamp_updated_by() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS customers_stamp_updated_by ON public.customers;
CREATE TRIGGER customers_stamp_updated_by
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

DROP TRIGGER IF EXISTS suppliers_stamp_updated_by ON public.suppliers;
CREATE TRIGGER suppliers_stamp_updated_by
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

DROP TRIGGER IF EXISTS products_stamp_updated_by ON public.products;
CREATE TRIGGER products_stamp_updated_by
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

-- 3. Universal delete-audit trigger — writes to activity_logs on every DELETE
--    Captures deleter (auth.uid()), timestamp, table name, row id, and a snapshot
--    of the deleted row (row_to_json) so the destroyed data is recoverable from logs.
CREATE OR REPLACE FUNCTION public.log_row_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  snapshot jsonb := to_jsonb(OLD);
  row_id uuid;
BEGIN
  -- entity_id: prefer id; fall back to user_id (user_roles has no id column concept for us)
  BEGIN
    row_id := (snapshot ->> 'id')::uuid;
  EXCEPTION WHEN others THEN row_id := NULL;
  END;
  IF row_id IS NULL THEN
    BEGIN
      row_id := (snapshot ->> 'user_id')::uuid;
    EXCEPTION WHEN others THEN row_id := NULL;
    END;
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'delete',
    TG_TABLE_NAME,
    row_id,
    jsonb_build_object(
      'deleted_by', auth.uid(),
      'deleted_at', now(),
      'snapshot', snapshot
    )
  );
  RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION public.log_row_delete() FROM PUBLIC, anon, authenticated;

-- 4. Attach the delete-audit trigger to every table where deletes matter
DROP TRIGGER IF EXISTS customers_log_delete ON public.customers;
CREATE TRIGGER customers_log_delete
  AFTER DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

DROP TRIGGER IF EXISTS suppliers_log_delete ON public.suppliers;
CREATE TRIGGER suppliers_log_delete
  AFTER DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

DROP TRIGGER IF EXISTS products_log_delete ON public.products;
CREATE TRIGGER products_log_delete
  AFTER DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

DROP TRIGGER IF EXISTS project_inquiries_log_delete ON public.project_inquiries;
CREATE TRIGGER project_inquiries_log_delete
  AFTER DELETE ON public.project_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

DROP TRIGGER IF EXISTS solutions_inspection_log_delete ON public.solutions_inspection;
CREATE TRIGGER solutions_inspection_log_delete
  AFTER DELETE ON public.solutions_inspection
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();

DROP TRIGGER IF EXISTS user_roles_log_delete ON public.user_roles;
CREATE TRIGGER user_roles_log_delete
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_row_delete();
