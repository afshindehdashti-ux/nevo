
DROP POLICY IF EXISTS "Anyone can create ai session rows" ON public.ai_assistant_conversations;
CREATE POLICY "Anyone can create ai session rows" ON public.ai_assistant_conversations
FOR INSERT TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) BETWEEN 1 AND 120
  AND (user_id IS NULL OR user_id = auth.uid())
);
