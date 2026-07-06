
CREATE TABLE public.doc_intel_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  -- Match conditions (all provided conditions must match; empty arrays/nulls are ignored)
  match_categories text[] NOT NULL DEFAULT '{}',
  match_doc_type_ilike text,
  match_filename_ilike text,
  match_keywords text[] NOT NULL DEFAULT '{}',
  match_confidentiality text[] NOT NULL DEFAULT '{}',
  match_visibility text[] NOT NULL DEFAULT '{}',
  -- Actions
  action_require_approval boolean NOT NULL DEFAULT false,
  action_block_public boolean NOT NULL DEFAULT false,
  action_set_confidentiality text,
  action_set_visibility text,
  action_set_destination text,
  action_set_folder_path text,
  action_add_tags text[] NOT NULL DEFAULT '{}',
  action_min_confidence numeric(4,3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_intel_routing_rules TO authenticated;
GRANT ALL ON public.doc_intel_routing_rules TO service_role;

ALTER TABLE public.doc_intel_routing_rules ENABLE ROW LEVEL SECURITY;

-- All staff can read
CREATE POLICY "Staff can read routing rules"
ON public.doc_intel_routing_rules FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin','management','sales','operations','finance','read_only']::app_role[])
);

-- Only super_admin + management can write
CREATE POLICY "Admins can insert routing rules"
ON public.doc_intel_routing_rules FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "Admins can update routing rules"
ON public.doc_intel_routing_rules FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "Admins can delete routing rules"
ON public.doc_intel_routing_rules FOR DELETE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE TRIGGER trg_doc_intel_routing_rules_updated
BEFORE UPDATE ON public.doc_intel_routing_rules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_doc_intel_routing_rules_stamp
BEFORE INSERT OR UPDATE ON public.doc_intel_routing_rules
FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_by();

CREATE INDEX idx_doc_intel_routing_rules_enabled_priority
ON public.doc_intel_routing_rules(enabled, priority);

-- Seed with safe defaults for sensitive categories
INSERT INTO public.doc_intel_routing_rules
  (name, description, priority, match_categories, action_require_approval, action_block_public, action_set_confidentiality)
VALUES
  ('Force approval: Invoices', 'Invoices always require human approval and cannot be public.', 10,
   ARRAY['Invoice'], true, true, 'confidential'),
  ('Force approval: NDAs & Contracts', 'Legal documents require approval and stay restricted.', 10,
   ARRAY['NDA','Contract'], true, true, 'restricted'),
  ('Force approval: QC & Compliance', 'Quality/compliance reports require approval before routing.', 20,
   ARRAY['Quality Control Report','Compliance Certificate'], true, true, 'confidential'),
  ('Force approval: Commercial docs', 'Proposals and quotations require approval.', 30,
   ARRAY['Commercial Proposal','Quotation'], true, true, 'confidential');
