
-- Lead pipeline fields on project_inquiries
ALTER TABLE public.project_inquiries
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_score smallint,
  ADD COLUMN IF NOT EXISTS next_action_date date,
  ADD COLUMN IF NOT EXISTS project_type text,
  ADD COLUMN IF NOT EXISTS budget_range text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS converted_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.project_inquiries
    ADD CONSTRAINT project_inquiries_priority_check
    CHECK (priority IN ('low','normal','high','urgent'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.project_inquiries
    ADD CONSTRAINT project_inquiries_score_check
    CHECK (internal_score IS NULL OR (internal_score >= 0 AND internal_score <= 100));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.project_inquiries
    ADD CONSTRAINT project_inquiries_project_type_len
    CHECK (project_type IS NULL OR char_length(project_type) <= 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.project_inquiries
    ADD CONSTRAINT project_inquiries_budget_len
    CHECK (budget_range IS NULL OR char_length(budget_range) <= 80);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.project_inquiries
    ADD CONSTRAINT project_inquiries_timeline_len
    CHECK (timeline IS NULL OR char_length(timeline) <= 80);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.project_inquiries
    ADD CONSTRAINT project_inquiries_internal_notes_len
    CHECK (internal_notes IS NULL OR char_length(internal_notes) <= 5000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_project_inquiries_assigned_to
  ON public.project_inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_next_action
  ON public.project_inquiries(next_action_date);

DROP TRIGGER IF EXISTS trg_project_inquiries_updated_at ON public.project_inquiries;
CREATE TRIGGER trg_project_inquiries_updated_at
  BEFORE UPDATE ON public.project_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_project_inquiries_stamp_updated_by ON public.project_inquiries;
CREATE TRIGGER trg_project_inquiries_stamp_updated_by
  BEFORE UPDATE ON public.project_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

-- AI summary fields on customers and projects
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_summary_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.customers
    ADD CONSTRAINT customers_ai_summary_len
    CHECK (ai_summary IS NULL OR char_length(ai_summary) <= 4000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.projects
    ADD CONSTRAINT projects_ai_summary_len
    CHECK (ai_summary IS NULL OR char_length(ai_summary) <= 4000);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
