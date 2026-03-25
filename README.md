# LetterWiki

페이레터(Payletter)의 브랜드 컬러와 노션(Notion)의 UX를 결합한 개인형 지식 및 일정 관리 플랫폼.

**🌐 라이브 데모: [payletter-wiki.vercel.app](https://payletter-wiki.vercel.app)**

---

## 프로젝트 개요

위키 문서와 캘린더 일정이 상호 연결되는 개인 워크스페이스입니다. 단순 메모를 넘어, 문서와 일정 사이의 백링크(Backlink)를 통해 컨텍스트를 연결하는 지능형 지식 관리를 지향합니다.

---

## 브랜드 & 디자인 시스템

| 항목 | 값 |
|---|---|
| Primary Color | `#0054FF` (Payletter Blue) |
| Background | White / `#F7F7F7` (Sidebar) |
| Text | Dark Gray |
| Font | Pretendard (CDN) |
| Layout | Notion 스타일 — 좌측 사이드바 + 중앙 에디터 |

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, `src/` 디렉토리) |
| Styling | Tailwind CSS v4 + Shadcn UI (Slate base, CSS variables) |
| Database / Auth | Supabase (PostgreSQL + Row Level Security) |
| Editor | TipTap v3 (Rich Text + 슬래시 커맨드) |
| Calendar | React-Day-Picker v9 |
| Encryption | Web Crypto API (AES-256-GCM) |
| Icons | Lucide React |
| Popup | tippy.js (슬래시 커맨드 메뉴) |
| Deployment | Vercel |

---

## 구현된 기능

### 1. Notion 스타일 Wiki

- **무제한 계층 문서 트리** — 사이드바에서 부모/자식 문서를 중첩 구조로 관리. 클릭으로 펼치기/접기
- **TipTap 에디터** — 리치 텍스트 편집, 마크다운 단축키 지원
- **슬래시(`/`) 커맨드** — 제목 1~3, 본문, 글머리 기호, 순서 목록, 인용구, 할 일 목록 등 블록 타입 삽입
- **1초 디바운스 자동 저장** — `idle / 저장 중... / 저장됨 / 저장 실패` 상태 표시
- **아이콘 선택** — 24가지 이모지 픽커, 문서별 개별 아이콘 설정
- **커버 이미지** — 이미지 URL 직접 입력 또는 4가지 프리셋 그라디언트 선택
- **즐겨찾기 토글** — 에디터 우상단 ☆ 버튼으로 즐겨찾기 추가/해제
- **인라인 할 일 목록** — `/할 일 목록` 커맨드로 체크박스 블록 삽입, 클릭으로 완료/미완료 토글 및 취소선 표시
- **페이지 링크 (백링크)** — `/페이지 링크` 커맨드로 다른 문서를 인라인 칩으로 삽입. 클릭 시 새 탭에서 해당 문서로 이동

### 2. 비공개 페이지 (Private Pages)

- **AES-256-GCM 클라이언트 암호화** — 비공개 전환 시 TipTap JSON 콘텐츠를 브라우저에서 암호화 후 DB 저장. DB 관리자도 내용을 볼 수 없음
- **투명한 키 관리** — 256비트 암호화 키는 Supabase `user_metadata.enc_key`에 자동 저장. 사용자가 별도로 키를 관리할 필요 없음
- **공개/비공개 전환** — 에디터 상단 토글 버튼으로 즉시 전환. 전환 시 자동으로 암호화/복호화
- **사이드바 통합** — 비공개 문서가 사이드바 하단 별도 섹션에 표시되며, 공개 문서와 동일한 UI(문서 추가, 트리 구조) 지원
- **실시간 동기화** — 제목, 아이콘, 공개 여부 변경 시 CustomEvent로 사이드바 즉시 갱신
- **Notion 스타일 삭제 메뉴** — 사이드바 문서 항목(DocRow) 호버 시 `···` 버튼 노출, 클릭하면 삭제 확인 메뉴 표시
- **자식 페이지 즉시 반영** — 새 자식 페이지 생성 직후 사이드바 트리에 즉시 표시

### 3. 문서 공유 (Public Share)

- **공유 링크 생성** — 에디터 우상단 "공유" 버튼으로 공개 URL 즉시 발급. `visibility = 'public'`으로 전환
- **비로그인 열람** — `/share/{id}` 경로는 인증 없이 접근 가능. Supabase RLS anon 정책으로 보호
- **읽기 전용 뷰** — 공유 페이지에서 TipTap 콘텐츠를 편집 불가 모드로 렌더링. 아이콘·커버·제목 표시
- **보안 제약** — 비공개(암호화) 문서는 공유 버튼 비활성화. 공유 중인 문서는 비공개 전환 불가

### 4. Smart Calendar

- **월간 / 주간 뷰 전환** — 헤더 토글 버튼으로 즉시 전환
- **일정 생성** — 날짜 클릭 → 모달에서 제목, 날짜, 시간, 종일 여부, 메모, 중요도 입력
- **일정 수정** — 상세 모달 내 연필 버튼으로 기존 일정 수정 (모든 필드 + 연결 문서 교체)
- **일정 삭제** — 상세 모달 내 삭제 버튼 + 확인 단계
- **중요도 (높음/보통/낮음)** — 일정별 중요도 설정, 캘린더 칩 색상으로 시각화 (빨강/파랑/회색)
- **Wiki Linking (Backlink)** — 일정 생성·수정 시 관련 위키 문서를 검색하여 태깅. `event_document_links` 테이블에 저장
- **일정 상세 모달** — 이벤트 클릭 시 화면 중앙 모달로 상세 정보 + 연결 문서 표시
- **할 일 뱃지** — 날짜 셀에 해당 날짜 마감 할 일 개수 표시 (`☐ N`)
- **Payletter Blue 하이라이트** — 오늘 날짜와 이벤트에 `#0054FF` 적용

### 5. 할 일 목록 (To-do)

- **독립 페이지 (`/todo`)** — 사이드바에서 접근 가능한 전용 할 일 관리 페이지
- **탭 필터** — 오늘 / 전체 / 완료 탭으로 빠른 분류 (KST 기준 오늘 날짜 적용)
- **할 일 추가** — 제목, 마감일, 위키 문서 연결을 한 번에 입력
- **인라인 편집** — 제목 클릭으로 바로 수정, Enter/blur로 저장
- **위키 연결** — 할 일에 위키 문서를 태깅하여 컨텍스트 연결
- **캘린더 연동** — 마감일이 설정된 할 일은 캘린더 날짜 셀에 뱃지로 표시

### 6. 네비게이션 & 검색

- **통합 검색 (Cmd+K / Ctrl+K)** — 어디서든 단축키로 검색 모달 열기. 200ms 디바운스, 키보드 화살표 + Enter 네비게이션
- **전용 검색 페이지 (`/search`)** — 사이드바 "검색" 메뉴에서 접근 가능한 인라인 검색 페이지
- **최근 문서 (`/recent`)** — 최근 수정된 문서 20개를 상대 시간(`n분 전`)으로 표시
- **즐겨찾기 (`/favorites`)** — `is_favorite = true`인 문서 목록

### 7. 다크모드

- **라이트 / 다크 모드 전환** — 사이드바 하단 토글 버튼으로 즉시 전환
- **설정 자동 저장** — `localStorage`에 테마 저장, 새로고침 후에도 유지
- **깜빡임 방지** — 페이지 로드 시 inline script로 초기 테마 즉시 적용
- **전체 UI 대응** — 사이드바, 에디터, 캘린더, 모달, 투두, 검색 등 모든 컴포넌트 다크모드 지원

### 8. 인증 (Auth)

- **이메일/패스워드 로그인 · 회원가입** — Supabase Auth 연동
- **암호화 키 자동 발급** — 회원가입/첫 로그인 시 암호화 키 자동 생성 및 저장
- **보호된 라우팅** — `src/proxy.ts`에서 미인증 사용자를 `/login`으로 리디렉트 (`/share/*` 제외)
- **Auth 콜백** — `/auth/callback` 라우트로 OAuth 세션 처리

---

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx                      # 루트 레이아웃 (Pretendard 폰트, lang="ko")
│   ├── globals.css                     # Payletter Blue 테마 + TipTap prose 스타일
│   ├── (auth)/
│   │   ├── layout.tsx                  # 인증 페이지 레이아웃 (중앙 정렬)
│   │   ├── login/page.tsx              # 로그인 페이지
│   │   └── signup/page.tsx             # 회원가입 페이지
│   ├── (wiki)/
│   │   ├── layout.tsx                  # MainLayout 래퍼
│   │   ├── page.tsx                    # 홈 (시작하기)
│   │   ├── documents/[id]/page.tsx     # 문서 에디터 (Server Component)
│   │   ├── calendar/page.tsx           # 캘린더 페이지
│   │   ├── todo/page.tsx               # 할 일 목록 페이지
│   │   ├── private/page.tsx            # 비공개 문서 목록
│   │   ├── search/page.tsx             # 검색 전용 페이지
│   │   ├── recent/page.tsx             # 최근 문서
│   │   └── favorites/page.tsx          # 즐겨찾기
│   ├── share/[id]/page.tsx             # 공유 문서 공개 뷰 (인증 불필요)
│   └── auth/callback/route.ts          # Supabase Auth 콜백
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx              # 사이드바 + 헤더 + 검색모달 통합 레이아웃
│   │   └── Sidebar.tsx                 # 공개/비공개 문서 트리, 문서 생성, 접기/펼치기
│   ├── editor/
│   │   ├── Editor.tsx                  # TipTap 에디터 (암호화·아이콘·커버·즐겨찾기·공유 포함)
│   │   ├── SlashCommandExtension.ts    # '/' 트리거 TipTap 익스텐션
│   │   └── SlashCommandMenu.tsx        # 키보드 네비게이션 슬래시 커맨드 팝업
│   ├── share/
│   │   └── ShareView.tsx               # 공유 페이지용 읽기 전용 TipTap 렌더러
│   ├── calendar/
│   │   ├── CalendarView.tsx            # 월/주 캘린더 뷰 (react-day-picker 기반, 할 일 뱃지 포함)
│   │   └── EventCreateModal.tsx        # 일정 생성 모달 (위키 연결 포함)
│   ├── todo/
│   │   ├── TodoCreateInput.tsx         # 할 일 추가 입력 (마감일 + 위키 연결)
│   │   └── TodoItem.tsx                # 할 일 아이템 (인라인 편집, 위키 링크, 삭제)
│   ├── search/
│   │   └── SearchModal.tsx             # Cmd+K 전역 검색 모달
│   └── ui/                             # Shadcn UI 컴포넌트 (Button, Input, 등)
├── hooks/
│   └── useAutoSave.ts                  # 1초 디바운스 자동 저장 훅 (제목 변경 이벤트 포함)
├── lib/
│   ├── supabase.ts                     # 브라우저 Supabase 싱글턴 클라이언트
│   ├── supabase-server.ts              # 서버 컴포넌트용 Supabase 클라이언트
│   ├── crypto.ts                       # AES-256-GCM 암호화/복호화 유틸리티
│   ├── documents.ts                    # 문서 CRUD 데이터 접근 레이어
│   ├── todos.ts                        # 할 일 CRUD 데이터 접근 레이어
│   └── calendar.ts                     # 캘린더 이벤트 CRUD + 위키 링크 처리
├── types/
│   ├── index.ts                        # Document, CalendarEvent, EventDocumentLink, Todo 타입
│   └── database.ts                     # Supabase Database 제네릭 타입
└── proxy.ts                            # Next.js 16 Proxy (구 middleware) — 인증 가드
```

---

## 데이터베이스 스키마

```sql
-- 문서 테이블 (무제한 계층 구조)
documents (
  id          uuid PRIMARY KEY,
  user_id     uuid REFERENCES auth.users,
  parent_id   uuid REFERENCES documents,   -- null = 루트 문서
  title       text,
  content     jsonb,                        -- TipTap JSON (비공개 시 AES-256-GCM 암호문)
  icon        text,                         -- 이모지
  cover_url   text,                         -- 이미지 URL 또는 그라디언트
  visibility  text DEFAULT 'default',       -- 'default' | 'private' | 'public'
  is_favorite boolean DEFAULT false,
  sort_order  integer DEFAULT 0,
  created_at, updated_at timestamptz
)

-- 캘린더 일정 테이블
calendar_events (
  id          uuid PRIMARY KEY,
  user_id     uuid REFERENCES auth.users,
  title       text,
  description text,
  start_at    timestamptz,
  end_at      timestamptz,
  all_day     boolean DEFAULT false,
  color       text DEFAULT '#0054FF',
  created_at, updated_at timestamptz
)

-- 일정 ↔ 문서 백링크 테이블
event_document_links (
  event_id    uuid REFERENCES calendar_events,
  document_id uuid REFERENCES documents,
  PRIMARY KEY (event_id, document_id)
)

-- 할 일 테이블
todos (
  id          uuid PRIMARY KEY,
  user_id     uuid REFERENCES auth.users,
  title       text NOT NULL,
  is_done     boolean DEFAULT false,
  due_date    date,                         -- 마감일 (캘린더 연동)
  document_id uuid REFERENCES documents,   -- 위키 문서 연결
  sort_order  integer DEFAULT 0,
  created_at, updated_at timestamptz
)
```

모든 테이블에 **Row Level Security(RLS)** 적용 — 사용자는 자신의 데이터에만 접근 가능.
`visibility = 'public'` 문서는 anon 정책으로 비로그인 사용자도 읽기 가능.

---

## 로컬 실행

### 1. 환경변수 설정

`.env.local` 파일을 생성하고 Supabase 프로젝트 정보를 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. DB 마이그레이션

Supabase SQL Editor에서 순서대로 실행합니다.

```
supabase/migrations/001_init_schema.sql          # 기본 스키마 (documents, calendar_events 등)
supabase/migrations/002_private_pages.sql        # visibility 컬럼 추가
supabase/migrations/003_remove_lock_columns.sql  # 구 PIN 컬럼 제거
supabase/migrations/004_todos.sql                # todos 테이블 생성
supabase/migrations/005_event_priority.sql       # 일정 중요도 컬럼 추가
supabase/migrations/006_storage_bucket.sql       # 이미지 스토리지 버킷
supabase/migrations/007_public_share.sql         # 공유 문서 anon RLS 정책
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속

---

## 배포

**Vercel** 배포 — [payletter-wiki.vercel.app](https://payletter-wiki.vercel.app)

GitHub 레포 연결 후 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) 설정으로 자동 배포됩니다.

---

## 에이전트 협업 프로토콜

이 프로젝트는 Claude Code의 서브에이전트 아키텍처로 개발되었습니다. (`AGENTS.md` 참고)

| 에이전트 | 역할 |
|---|---|
| [System-Architect] | 프로젝트 스캐폴딩, 폴더 구조, 패키지 의존성 |
| [DB-Agent] | Supabase 스키마 설계, SQL 마이그레이션, RLS |
| [UI-Agent] | Shadcn UI 커스텀, Payletter 테마, 레이아웃 구현 |
| [Feature-Agent] | 에디터 로직, 캘린더 연동, 암호화, 비즈니스 로직 |
