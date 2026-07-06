
-- ============ QUOTATIONS ============
CREATE SEQUENCE IF NOT EXISTS public.quotation_number_seq START 1000;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM
    ('draft','pending_approval','approved','sent','accepted','rejected','expired','converted','void');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE OR REPLACE FUNCTION public.next_quotation_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n bigint; y text := to_char(now(),'YYYY');
BEGIN
  n := nextval('public.quotation_number_seq');
  RETURN 'QT-' || y || '-' || lpad(n::text, 5, '0');
END $$;

CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  inquiry_id uuid REFERENCES public.project_inquiries(id) ON DELETE SET NULL,
  status quotation_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT current_date,
  valid_until date,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  terms text,
  notes text,
  internal_notes text,
  approved_by uuid,
  approved_at timestamptz,
  sent_at timestamptz,
  accepted_at timestamptz,
  converted_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  position int NOT NULL DEFAULT 1,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 1,
  unit text,
  unit_price numeric(14,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotations TO service_role;
GRANT ALL ON public.quotation_items TO service_role;
GRANT USAGE ON SEQUENCE public.quotation_number_seq TO authenticated, service_role;

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage quotations" ON public.quotations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]));
CREATE POLICY "Customers read own approved quotations" ON public.quotations FOR SELECT TO authenticated
  USING (status IN ('sent','accepted','converted') AND public.is_customer_user(auth.uid(), customer_id));

CREATE POLICY "Staff manage quotation items" ON public.quotation_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]));
CREATE POLICY "Customers read own quotation items" ON public.quotation_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quotations q
    WHERE q.id = quotation_items.quotation_id
      AND q.status IN ('sent','accepted','converted')
      AND public.is_customer_user(auth.uid(), q.customer_id)
  ));

CREATE OR REPLACE FUNCTION public.quotations_assign_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := public.next_quotation_number();
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.recalc_quotation_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE q_id uuid := COALESCE(NEW.quotation_id, OLD.quotation_id);
        sub numeric(14,2);
        vr numeric(5,2);
BEGIN
  SELECT COALESCE(SUM(line_total),0) INTO sub FROM public.quotation_items WHERE quotation_id = q_id;
  SELECT vat_rate INTO vr FROM public.quotations WHERE id = q_id;
  UPDATE public.quotations
     SET subtotal = sub,
         vat_amount = round(sub * COALESCE(vr,0) / 100, 2),
         total = sub + round(sub * COALESCE(vr,0) / 100, 2),
         updated_at = now()
   WHERE id = q_id;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_quotations_number ON public.quotations;
CREATE TRIGGER trg_quotations_number BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.quotations_assign_number();

DROP TRIGGER IF EXISTS trg_quotations_updated ON public.quotations;
CREATE TRIGGER trg_quotations_updated BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_quotations_stamp ON public.quotations;
CREATE TRIGGER trg_quotations_stamp BEFORE INSERT OR UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

DROP TRIGGER IF EXISTS trg_quotations_approval ON public.quotations;
CREATE TRIGGER trg_quotations_approval BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.log_status_approval();

DROP TRIGGER IF EXISTS trg_qitems_recalc ON public.quotation_items;
CREATE TRIGGER trg_qitems_recalc AFTER INSERT OR UPDATE OR DELETE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_quotation_totals();

CREATE INDEX IF NOT EXISTS idx_quotations_customer ON public.quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_qitems_q ON public.quotation_items(quotation_id);

-- ============ COMMUNICATIONS ============
DO $$ BEGIN
  CREATE TYPE communication_kind AS ENUM ('note','email','call','meeting','whatsapp','file');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE communication_direction AS ENUM ('inbound','outbound','internal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,          -- 'customer'|'lead'|'order'|'invoice'|'quotation'|'project'|'partner'|'shipment'
  entity_id uuid NOT NULL,
  kind communication_kind NOT NULL DEFAULT 'note',
  direction communication_direction NOT NULL DEFAULT 'internal',
  subject text,
  body text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  contact_name text,
  contact_email text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communications TO authenticated;
GRANT ALL ON public.communications TO service_role;

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage communications" ON public.communications FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]));
CREATE POLICY "Customers read own comms" ON public.communications FOR SELECT TO authenticated
  USING (
    direction <> 'internal'
    AND entity_type = 'customer'
    AND public.is_customer_user(auth.uid(), entity_id)
  );
CREATE POLICY "Partners read own comms" ON public.communications FOR SELECT TO authenticated
  USING (
    direction <> 'internal'
    AND entity_type = 'partner'
    AND public.is_partner_user(auth.uid(), entity_id)
  );

DROP TRIGGER IF EXISTS trg_comms_updated ON public.communications;
CREATE TRIGGER trg_comms_updated BEFORE UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_comms_stamp ON public.communications;
CREATE TRIGGER trg_comms_stamp BEFORE INSERT OR UPDATE ON public.communications
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

CREATE INDEX IF NOT EXISTS idx_comms_entity ON public.communications(entity_type, entity_id, occurred_at DESC);

-- ============ TASKS ============
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('open','in_progress','waiting','done','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'open',
  priority task_priority NOT NULL DEFAULT 'normal',
  assigned_to uuid,
  due_date date,
  entity_type text,
  entity_id uuid,
  approval_required boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read tasks" ON public.tasks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]));
CREATE POLICY "Staff insert tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]));
CREATE POLICY "Assignee or staff update tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','moderator']::app_role[])
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['admin','moderator']::app_role[])
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );
CREATE POLICY "Admins delete tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_tasks_updated ON public.tasks;
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_tasks_stamp ON public.tasks;
CREATE TRIGGER trg_tasks_stamp BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_entity ON public.tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(due_date) WHERE status <> 'done';

-- ============ AI ASSISTANT CONVERSATIONS ============
CREATE TABLE IF NOT EXISTS public.ai_assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  visitor_ip text,
  visitor_country text,
  message_count int NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  lead_captured boolean NOT NULL DEFAULT false,
  inquiry_id uuid REFERENCES public.project_inquiries(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ai_assistant_conversations TO authenticated, anon;
GRANT ALL ON public.ai_assistant_conversations TO service_role;
ALTER TABLE public.ai_assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create ai session rows" ON public.ai_assistant_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update own session by id" ON public.ai_assistant_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff read ai sessions" ON public.ai_assistant_conversations FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','moderator','user']::app_role[]));

CREATE INDEX IF NOT EXISTS idx_ai_sessions_created ON public.ai_assistant_conversations(created_at DESC);
