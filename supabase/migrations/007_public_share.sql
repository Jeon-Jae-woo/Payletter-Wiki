-- ============================================================
-- LetterWiki — Public Share RLS Policy
-- Allows anonymous (unauthenticated) users to read documents
-- with visibility = 'public'
-- ============================================================

CREATE POLICY "documents: select public" ON documents
  FOR SELECT TO anon
  USING (visibility = 'public');
