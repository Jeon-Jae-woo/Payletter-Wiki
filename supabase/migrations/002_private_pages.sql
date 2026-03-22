-- ============================================================
-- LetterWiki — Migration 002: Private Pages
-- ============================================================

-- visibility: 'default'(기본) | 'private'(비공개) | 'public'(향후 공개 공유용)
ALTER TABLE documents
  ADD COLUMN visibility text NOT NULL DEFAULT 'default'
    CHECK (visibility IN ('default', 'private', 'public'));

-- 잠금 기능
ALTER TABLE documents
  ADD COLUMN is_locked      boolean NOT NULL DEFAULT false,
  ADD COLUMN lock_pin_hash  text;    -- SHA-256 해시 (RLS로 보호, owner만 접근 가능)

-- 조회 성능용 인덱스
CREATE INDEX idx_documents_visibility ON documents(user_id, visibility);

-- ============================================================
-- 향후 공개 공유 준비용 RLS (현재는 주석 처리)
-- 공유 기능 구현 시 아래 주석 해제
-- ============================================================
-- CREATE POLICY "documents: select public" ON documents
--   FOR SELECT USING (visibility = 'public');
