-- ============================================================
-- LetterWiki — Migration 003: Remove PIN-lock columns
-- 암호화 방식으로 전환 — is_locked / lock_pin_hash 컬럼 제거
-- ============================================================

ALTER TABLE documents
  DROP COLUMN IF EXISTS is_locked,
  DROP COLUMN IF EXISTS lock_pin_hash;
