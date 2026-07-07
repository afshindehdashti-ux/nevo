
CREATE TABLE public.csv_export_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  export_type text NOT NULL,
  filename text NOT NULL,
  sha256 text NOT NULL,
  byte_size bigint NOT NULL,
  row_count integer NOT NULL,
  scope text,
  entity_type text,
  entity_id text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX csv_export_audit_created_at_idx ON public.csv_export_audit (created_at DESC);
CREATE INDEX csv_export_audit_entity_idx ON public.csv_export_audit (entity_type, entity_id);
CREATE INDEX csv_export_audit_sha256_idx ON public.csv_export_audit (sha256);

GRANT SELECT, INSERT ON public.csv_export_audit TO authenticated;
GRANT ALL ON public.csv_export_audit TO service_role;

ALTER TABLE public.csv_export_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Privileged roles can view csv export audit"
  ON public.csv_export_audit FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[]));

CREATE POLICY "Privileged roles can insert csv export audit"
  ON public.csv_export_audit FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_any_role(auth.uid(), ARRAY['super_admin','management','finance']::app_role[])
  );
