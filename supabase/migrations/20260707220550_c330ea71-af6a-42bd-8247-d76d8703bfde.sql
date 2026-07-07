
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.ai_document_category AS ENUM (
    'crm_user_guide','company_profile','product_datasheet','supplier_agreement',
    'customer_document','invoice_template','commission_agreement','sop_procedure',
    'sales_training','technical_document','legal_compliance','general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_document_access_level AS ENUM (
    'all_internal','management_only','finance_only','operations_only','sales_only','super_admin_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_document_status AS ENUM ('processing','ready','failed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_chat_role AS ENUM ('user','assistant','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: check if a user can read an access_level
CREATE OR REPLACE FUNCTION public.can_read_ai_access_level(_user_id uuid, _level public.ai_document_access_level)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _level
    WHEN 'all_internal' THEN public.has_staff_role(_user_id)
    WHEN 'management_only' THEN public.has_any_role(_user_id, ARRAY['super_admin','management']::app_role[])
    WHEN 'finance_only' THEN public.has_any_role(_user_id, ARRAY['super_admin','management','finance']::app_role[])
    WHEN 'operations_only' THEN public.has_any_role(_user_id, ARRAY['super_admin','management','operations']::app_role[])
    WHEN 'sales_only' THEN public.has_any_role(_user_id, ARRAY['super_admin','management','sales']::app_role[])
    WHEN 'super_admin_only' THEN public.has_role(_user_id, 'super_admin'::app_role)
    ELSE false
  END
$$;

-- ai_documents
CREATE TABLE public.ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category public.ai_document_category NOT NULL DEFAULT 'general',
  description text,
  file_url text,
  file_type text,
  byte_size bigint,
  access_level public.ai_document_access_level NOT NULL DEFAULT 'all_internal',
  related_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  related_supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  related_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.ai_document_status NOT NULL DEFAULT 'processing',
  chunk_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_documents TO authenticated;
GRANT ALL ON public.ai_documents TO service_role;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI docs: staff read by access level"
  ON public.ai_documents FOR SELECT TO authenticated
  USING (public.can_read_ai_access_level(auth.uid(), access_level));

CREATE POLICY "AI docs: management can insert"
  ON public.ai_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "AI docs: management can update"
  ON public.ai_documents FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "AI docs: management can delete"
  ON public.ai_documents FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE INDEX ai_documents_category_idx ON public.ai_documents(category);
CREATE INDEX ai_documents_status_idx ON public.ai_documents(status);
CREATE INDEX ai_documents_customer_idx ON public.ai_documents(related_customer_id) WHERE related_customer_id IS NOT NULL;
CREATE INDEX ai_documents_supplier_idx ON public.ai_documents(related_supplier_id) WHERE related_supplier_id IS NOT NULL;

CREATE TRIGGER ai_documents_set_updated_at
  BEFORE UPDATE ON public.ai_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ai_document_chunks
CREATE TABLE public.ai_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.ai_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  chunk_text text NOT NULL,
  page_number integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_document_chunks TO authenticated;
GRANT ALL ON public.ai_document_chunks TO service_role;
ALTER TABLE public.ai_document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI chunks: readable via parent access"
  ON public.ai_document_chunks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_documents d
    WHERE d.id = document_id
      AND public.can_read_ai_access_level(auth.uid(), d.access_level)
  ));

CREATE POLICY "AI chunks: management can insert"
  ON public.ai_document_chunks FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE POLICY "AI chunks: management can delete"
  ON public.ai_document_chunks FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','management']::app_role[]));

CREATE INDEX ai_document_chunks_doc_idx ON public.ai_document_chunks(document_id);
CREATE INDEX ai_document_chunks_embedding_idx
  ON public.ai_document_chunks USING hnsw (embedding vector_cosine_ops);

-- ai_chat_sessions
CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  related_module text,
  related_record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_sessions TO authenticated;
GRANT ALL ON public.ai_chat_sessions TO service_role;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI sessions: owner all"
  ON public.ai_chat_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ai_chat_sessions_user_idx ON public.ai_chat_sessions(user_id, updated_at DESC);

CREATE TRIGGER ai_chat_sessions_set_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ai_chat_messages
CREATE TABLE public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.ai_chat_role NOT NULL,
  content text NOT NULL,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI messages: owner all"
  ON public.ai_chat_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ai_chat_messages_session_idx ON public.ai_chat_messages(session_id, created_at);

-- ai_actions_log
CREATE TABLE public.ai_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  related_module text,
  related_record_id text,
  ai_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_actions_log TO authenticated;
GRANT ALL ON public.ai_actions_log TO service_role;
ALTER TABLE public.ai_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI actions: owner insert"
  ON public.ai_actions_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "AI actions: staff read"
  ON public.ai_actions_log FOR SELECT TO authenticated
  USING (public.has_staff_role(auth.uid()));

CREATE INDEX ai_actions_log_user_idx ON public.ai_actions_log(user_id, created_at DESC);

-- Match function for RAG
CREATE OR REPLACE FUNCTION public.match_ai_chunks(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  document_title text,
  document_category public.ai_document_category,
  chunk_text text,
  page_number int,
  similarity float
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id AS chunk_id,
    c.document_id,
    d.title AS document_title,
    d.category AS document_category,
    c.chunk_text,
    c.page_number,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.ai_document_chunks c
  JOIN public.ai_documents d ON d.id = c.document_id
  WHERE d.status = 'ready'
    AND c.embedding IS NOT NULL
    AND public.can_read_ai_access_level(_user_id, d.access_level)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
