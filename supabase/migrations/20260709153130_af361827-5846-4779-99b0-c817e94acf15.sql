CREATE TABLE public.mcp_tool_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  tool_name text NOT NULL,
  user_id uuid,
  user_email text,
  client_id text,
  status text NOT NULL CHECK (status IN ('ok','error','unauthorized')),
  error_message text,
  input_bytes integer,
  result_rows integer,
  duration_ms integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mcp_tool_invocations_user_id_idx ON public.mcp_tool_invocations (user_id, started_at DESC);
CREATE INDEX mcp_tool_invocations_tool_name_idx ON public.mcp_tool_invocations (tool_name, started_at DESC);
CREATE INDEX mcp_tool_invocations_request_id_idx ON public.mcp_tool_invocations (request_id);

GRANT SELECT ON public.mcp_tool_invocations TO authenticated;
GRANT ALL ON public.mcp_tool_invocations TO service_role;

ALTER TABLE public.mcp_tool_invocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own MCP invocations"
  ON public.mcp_tool_invocations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins read all MCP invocations"
  ON public.mcp_tool_invocations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));
