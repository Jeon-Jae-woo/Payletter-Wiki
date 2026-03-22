-- ============================================================
-- LetterWiki — Migration 004: Todos
-- ============================================================

CREATE TABLE todos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  title       text NOT NULL DEFAULT '',
  is_done     boolean NOT NULL DEFAULT false,
  due_date    date,                                    -- 마감일 (캘린더 연동)
  document_id uuid REFERENCES documents(id)           -- 위키 문서 연결 (선택)
              ON DELETE SET NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: 본인 데이터만 접근
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos: select own" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "todos: insert own" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "todos: update own" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "todos: delete own" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_todos_updated_at();

-- 인덱스
CREATE INDEX idx_todos_user_due ON todos(user_id, due_date);
CREATE INDEX idx_todos_user_done ON todos(user_id, is_done);
