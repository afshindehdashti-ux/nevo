DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE lower(email) = lower('afshin@nevoindustrial.com') LIMIT 1;
  IF target_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, is_active)
    VALUES (target_id, 'Afshin', true)
    ON CONFLICT (id) DO UPDATE SET is_active = true;
  END IF;
END $$;