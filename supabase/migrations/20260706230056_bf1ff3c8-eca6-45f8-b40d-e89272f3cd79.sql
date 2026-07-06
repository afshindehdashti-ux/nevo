
-- Sensitivity gate: mark as pending_approval whenever a sensitive doc is not yet approved
CREATE OR REPLACE FUNCTION public.enforce_sensitive_document_gate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sensitive_levels text[] := ARRAY['confidential','restricted','secret'];
BEGIN
  IF NEW.confidentiality_level IS NOT NULL
     AND NEW.confidentiality_level = ANY(sensitive_levels)
     AND COALESCE(NEW.status,'') NOT IN ('approved','rejected','archived') THEN
    NEW.status := 'pending_approval';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_docintel_sensitive_gate ON public.doc_intel_documents;
CREATE TRIGGER trg_docintel_sensitive_gate
BEFORE INSERT OR UPDATE OF confidentiality_level, status ON public.doc_intel_documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_sensitive_document_gate();

-- Auto approval request when a sensitive doc lands in pending_approval
CREATE OR REPLACE FUNCTION public.auto_request_document_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sensitive_levels text[] := ARRAY['confidential','restricted','secret'];
BEGIN
  IF NEW.confidentiality_level IS NULL
     OR NOT (NEW.confidentiality_level = ANY(sensitive_levels))
     OR NEW.status <> 'pending_approval' THEN
    RETURN NEW;
  END IF;

  PERFORM public.ensure_approval_request(
    'document',
    NEW.id,
    format('Sensitive document (%s) requires approval', NEW.confidentiality_level),
    jsonb_build_object(
      'confidentiality_level', NEW.confidentiality_level,
      'portal_visibility', NEW.portal_visibility,
      'title', COALESCE(NEW.title, NEW.original_filename),
      'customer_id', NEW.customer_id,
      'partner_id', NEW.partner_id,
      'project_id', NEW.project_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_docintel_auto_approval ON public.doc_intel_documents;
CREATE TRIGGER trg_docintel_auto_approval
AFTER INSERT OR UPDATE OF confidentiality_level, status ON public.doc_intel_documents
FOR EACH ROW EXECUTE FUNCTION public.auto_request_document_approval();

REVOKE EXECUTE ON FUNCTION public.enforce_sensitive_document_gate() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_request_document_approval() FROM PUBLIC, anon;
