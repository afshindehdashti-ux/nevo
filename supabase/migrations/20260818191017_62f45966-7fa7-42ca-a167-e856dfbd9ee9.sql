CREATE TABLE public.image_slot_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_path text NOT NULL UNIQUE,
  asset_key text NOT NULL,
  storage_path text NOT NULL,
  width integer,
  height integer,
  content_type text,
  byte_size integer,
  license_source text,
  license_type text,
  license_id text,
  license_credit text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX image_slot_overrides_active_idx ON public.image_slot_overrides (is_active);
CREATE INDEX image_slot_overrides_key_idx ON public.image_slot_overrides (asset_key);

GRANT SELECT ON public.image_slot_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_slot_overrides TO authenticated;
GRANT ALL ON public.image_slot_overrides TO service_role;

ALTER TABLE public.image_slot_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active image overrides are publicly readable"
  ON public.image_slot_overrides FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert image overrides"
  ON public.image_slot_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update image overrides"
  ON public.image_slot_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete image overrides"
  ON public.image_slot_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER image_slot_overrides_touch_updated_at
  BEFORE UPDATE ON public.image_slot_overrides
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE POLICY "Admins can read site images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload site images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));