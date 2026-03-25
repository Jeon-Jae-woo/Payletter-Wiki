# LetterWiki — 프로젝트 요약 보고서

---

## 1. 프로젝트 한 줄 요약

페이레터(Payletter)의 브랜드 컬러(`#0054FF`)와 노션(Notion)의 UX를 결합한 개인형 위키 + 캘린더 + 할 일 통합 지식 관리 플랫폼으로, 문서·일정·할 일 사이의 백링크(Backlink)로 컨텍스트를 연결한다.

---

## 2. PRD vs 구현 비교표

### 4.1 Notion 스타일 Wiki

| PRD 정의 기능 | 구현 여부 | 비고 |
|---|:---:|---|
| 무제한 계층 구조(Nested Documents) | ✅ | `parent_id` 자기 참조, 사이드바 중첩 트리로 구현 |
| 실시간 자동 저장(Auto-save) | ✅ | 1초 디바운스, `idle / 저장 중... / 저장됨 / 저장 실패` 상태 표시 |
| 마크다운 단축키 | ✅ | TipTap 기본 마크다운 단축키 지원 |
| 페이지별 아이콘 설정 | ✅ | 24가지 이모지 픽커, 문서별 개별 설정 |
| 페이지별 커버 이미지 설정 | ✅ | 이미지 URL 직접 입력 또는 4가지 프리셋 그라디언트 선택 |

### 4.2 Smart Calendar

| PRD 정의 기능 | 구현 여부 | 비고 |
|---|:---:|---|
| 월간/주간 뷰 전환 대시보드 | ✅ | 헤더 토글 버튼으로 즉시 전환 |
| Wiki Linking — 일정에 위키 문서 태깅(Backlink) | ✅ | 일정 생성·수정 시 위키 문서 검색 및 태깅, `event_document_links` 테이블에 저장 |
| 페이레터 블루 포인트 컬러 일정 하이라이트 | ✅ | 오늘 날짜 및 이벤트에 `#0054FF` 적용 |
| 일정 삭제 | ✅ | 상세 모달에서 삭제 버튼 + 확인 단계 |
| 일정 수정 | ✅ | `EventEditModal`로 모든 필드 수정 가능 |
| 일정 중요도 | ✅ | 높음(빨강) / 보통(파랑) / 낮음(회색) 색상 칩 시각화 |

### 4.3 Navigation & Search

| PRD 정의 기능 | 구현 여부 | 비고 |
|---|:---:|---|
| 최근 수정된 문서 리스트 | ✅ | `/recent` — 최근 수정 문서 20개, 상대 시간 표시 |
| 즐겨찾기(Favorites) | ✅ | `/favorites` — `is_favorite = true` 문서 목록, 에디터 내 ☆ 버튼 토글 |
| 전체 문서 통합 검색 (Cmd+K) | ✅ | Cmd+K / Ctrl+K 단축키, 200ms 디바운스, 키보드 화살표 + Enter 네비게이션 |

---

## 3. 기술 스택 계획 vs 실제

| 레이어 | PRD 계획 | 실제 구현 | 비고 |
|---|---|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) | Next.js 16 (App Router, TypeScript, `src/` 디렉토리) | 버전 상향 |
| Styling | Tailwind CSS + Shadcn UI | Tailwind CSS v4 + Shadcn UI (Slate base, CSS variables) | 버전 상향 |
| Database / Auth | Supabase (PostgreSQL) | Supabase (PostgreSQL + Row Level Security) | RLS 명시적 적용 |
| Editor | TipTap (Rich Text & Slash Command 지원) | TipTap v3 (Rich Text + 슬래시 커맨드 + 체크박스) | 버전 명시, 할 일 블록 추가 |
| Calendar | React-Day-Picker 또는 FullCalendar | React-Day-Picker v9 | FullCalendar 미채택, React-Day-Picker 선택 |
| Encryption | (미정의) | Web Crypto API — AES-256-GCM | PRD에 없던 보안 레이어 추가 |
| Icons | Lucide React | Lucide React | 동일 |
| Popup | (미정의) | tippy.js (슬래시 커맨드 메뉴) | PRD에 없던 의존성 추가 |
| 인증 미들웨어 | (미정의) | `src/proxy.ts` (Next.js 16 Proxy, 구 middleware) | PRD에 없던 구성 요소 |

---

## 4. 에이전트 협업 프로토콜 달성 현황

| 에이전트 | PRD 역할 | 실제 수행 작업 |
|---|---|---|
| [System-Architect] | 전체 프로젝트 스캐폴딩, 폴더 구조 설계, 패키지 의존성 관리 | `src/` 디렉토리 기반 App Router 구조 설계, `(auth)` / `(wiki)` Route Group 분리, `types/`, `hooks/`, `lib/` 레이어 설계, 패키지 의존성 확정 |
| [DB-Agent] | DB 스키마 설계, SQL 마이그레이션, RLS 설정, API Route 최적화 | `documents`, `calendar_events`, `event_document_links`, `todos` 4개 테이블 설계, RLS 적용, `supabase/migrations/` 4개 마이그레이션 파일 작성, `lib/documents.ts` · `lib/calendar.ts` · `lib/todos.ts` 데이터 접근 레이어 구현, `types/database.ts` 제네릭 타입 정의 |
| [UI-Agent] | Shadcn UI 커스텀, Payletter Blue 테마 적용, Notion 스타일 레이아웃 구현 | `globals.css`에 Payletter Blue 테마 및 TipTap prose 스타일(체크박스·목록·인용 포함) 적용, Pretendard 폰트 CDN 연동, `MainLayout.tsx` / `Sidebar.tsx`(공개·비공개 섹션 통합) 구현, `TodoCreateInput.tsx` / `TodoItem.tsx` UI 구현 |
| [Feature-Agent] | 에디터 로직 구현, 캘린더 연동, 복잡한 비즈니스 로직 처리 | TipTap 에디터(암호화·아이콘·커버·즐겨찾기·체크박스), 슬래시 커맨드, `useAutoSave.ts`(제목 변경 이벤트 포함), 캘린더 뷰(할 일 뱃지), 통합 검색 모달, AES-256-GCM 암호화(`lib/crypto.ts`), 사이드바 실시간 동기화(CustomEvent), 할 일 페이지(`/todo`) |

---

## 5. PRD 대비 추가로 구현된 사항

PRD에는 명시되지 않았으나 구현 과정에서 추가된 기능 및 구성 요소:

| 추가 항목 | 설명 |
|---|---|
| 인증(Auth) 시스템 | 이메일/패스워드 로그인·회원가입, Supabase Auth 연동, `/auth/callback` OAuth 세션 처리 |
| 보호된 라우팅 | `src/proxy.ts`에서 미인증 사용자를 `/login`으로 리디렉트 |
| AES-256-GCM 비공개 페이지 암호화 | 비공개 전환 시 브라우저에서 콘텐츠 암호화 후 DB 저장. 키는 `user_metadata.enc_key`에 자동 관리 |
| 사이드바 실시간 동기화 | 제목·아이콘·공개여부 변경 시 CustomEvent(`document-title-changed` 등)로 사이드바 즉시 갱신 |
| 비공개 문서 사이드바 섹션 | 사이드바 하단에 비공개 문서 전용 섹션, 공개 문서와 동일한 UI(트리, 추가 버튼) |
| 할 일 목록 (`/todo`) | 탭(오늘/전체/완료) 필터, 마감일 설정, 위키 문서 연결, KST 타임존 정확 처리 |
| 인라인 할 일 체크박스 | 에디터 내 `/할 일 목록` 슬래시 커맨드로 체크박스 블록 삽입, 완료 시 취소선 |
| 캘린더 할 일 뱃지 | 마감일이 있는 할 일 개수를 캘린더 날짜 셀에 `☐ N` 형태로 표시 |
| 전용 검색 페이지 (`/search`) | Cmd+K 전역 모달 외에 사이드바에서 접근 가능한 인라인 검색 페이지 별도 구현 |
| 일정 상세 카드 | 캘린더 내 이벤트 클릭 시 하단에 상세 정보를 표시하는 카드 UI |
| tippy.js 의존성 | 슬래시 커맨드 팝업 메뉴 렌더링을 위해 추가 |
| `visibility` 필드 | `documents` 테이블에 공개 여부 컬럼 (`'default' \| 'private' \| 'public'`) |
| `todos` 테이블 | 할 일 데이터 저장, `due_date`로 캘린더 연동, `document_id`로 위키 연결 |
| 사이드바 DocRow 삭제 메뉴 | 사이드바 문서 항목 호버 시 `···` 버튼 노출 → Notion 스타일 삭제 확인 메뉴 |
| 자식 페이지 즉시 표시 | 새 자식 페이지 생성 직후 사이드바 트리에 즉시 반영 (리로드 불필요) |
| 인증 흐름 개선 | 미인증 사용자 전체 라우트를 `/login`으로 리다이렉트, 로그인 후 wiki 홈 이동 |
| 사이드바 유저 프로필 | 하단에 아바타(이니셜) + 이메일 + 로그아웃 버튼 표시 |
| 일정 삭제 | 일정 상세 모달에서 삭제 버튼 + 확인 단계 후 삭제, `deleteEvent` API 연동 |
| 일정 수정 모달 | 연필 아이콘 클릭 → `EventEditModal`: 모든 필드(제목/날짜/시간/중요도/메모/연결문서) 수정 가능 |
| 일정 중요도 | `priority: 'high' \| 'medium' \| 'low'` 필드 추가, 높음(빨강)/보통(파랑)/낮음(회색) 칩 색상 시각화 |
| 일정 상세 모달 개선 | 하단 바 → 화면 중앙 모달로 변경하여 가시성 개선, 연결 문서 목록 표시 |
| 페이지 백링크 | 슬래시 커맨드 `/페이지 링크` → `PageSearchModal`에서 문서 검색 후 인라인 칩으로 삽입, 클릭 시 새 탭으로 이동 |
| 다크모드 | `useTheme` 훅 + `ThemeProvider`, localStorage 저장, 깜빡임 방지 인라인 스크립트, 사이드바 토글 버튼 (Sun/Moon) |

---

## 6. 미구현 / 향후 과제

MVP 이후 확장 가능한 기능 제안:

| 분류 | 항목 | 설명 |
|---|---|---|
| Wiki | 문서 히스토리 / 버전 관리 | 수정 이력 저장 및 이전 버전으로 롤백 |
| Wiki | 멀티미디어 블록 | 이미지 업로드(Storage), 동영상 임베드, 코드 블록 하이라이팅 |
| Wiki | 문서 공유 / 퍼블리시 | 특정 문서를 공개 URL로 공유하는 기능 |
| Todo | 반복 할 일 | 매일/매주 반복 일정 설정 |
| Todo | 우선순위 / 태그 | 할 일 분류 및 필터링 |
| Calendar | 반복 일정 | 매일/매주/매월 반복 이벤트 설정 |
| Calendar | 외부 캘린더 연동 | Google Calendar / iCal 가져오기/내보내기 |
| Calendar | 문서 → 일정 역방향 링크 | 문서 에디터에서 연결된 일정 목록 조회 |
| 협업 | 실시간 협업 편집 | WebSocket 기반 다중 사용자 동시 편집 (Yjs 등) |
| 검색 | 전문 검색(Full-text Search) | Supabase pg_trgm 또는 외부 검색 엔진 연동 |
| 알림 | 일정 알림 | 브라우저 푸시 알림 또는 이메일 리마인더 |
| 모바일 | 반응형 레이아웃 | 모바일/태블릿 최적화 사이드바 및 에디터 UX |
| 확장 | API 공개 | REST/GraphQL API로 외부 도구 연동 지원 |
