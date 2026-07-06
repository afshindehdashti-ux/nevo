
ALTER TABLE public.communications
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.communications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thread_id uuid;

CREATE INDEX IF NOT EXISTS communications_thread_id_idx ON public.communications(thread_id);
CREATE INDEX IF NOT EXISTS communications_parent_id_idx ON public.communications(parent_id);

CREATE OR REPLACE FUNCTION public.communications_set_thread()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE parent_thread uuid;
BEGIN
  IF NEW.thread_id IS NULL THEN
    IF NEW.parent_id IS NOT NULL THEN
      SELECT COALESCE(thread_id, id) INTO parent_thread FROM public.communications WHERE id = NEW.parent_id;
      NEW.thread_id := COALESCE(parent_thread, NEW.id);
    ELSE
      NEW.thread_id := NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS communications_set_thread_trg ON public.communications;
CREATE TRIGGER communications_set_thread_trg
BEFORE INSERT ON public.communications
FOR EACH ROW EXECUTE FUNCTION public.communications_set_thread();

-- Backfill: existing messages become their own thread root
UPDATE public.communications SET thread_id = id WHERE thread_id IS NULL;
