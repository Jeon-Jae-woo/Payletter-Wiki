# LetterWiki PRD
### Payletter Style Personal Wiki & Knowledge Management Platform

---

## 1. Project Overview

**Project Name:** LetterWiki (Payletter Style Personal Wiki)

**Vision**
페이레터(Payletter)의 신뢰감 있는 브랜드 컬러와 노션(Notion)의 직관적인 UX를 결합한 개인형 지식 및 일정 관리 플랫폼.

**Goal**
단순한 메모를 넘어, 위키 문서와 캘린더 일정이 상호 연결되는 지능형 워크스페이스 구축.

---

## 2. Brand Identity & Design System

| 항목 | 내용 |
|---|---|
| **Primary Color** | `#0054FF` (Payletter Blue) — 핵심 버튼, 링크, 활성화 상태에 적용 |
| **Secondary Color** | White & Light Gray (Background), Dark Gray (Text) |
| **Typography** | Pretendard 또는 Sans-serif 계열의 깔끔한 폰트 |

### Layout

```
┌─────────────────────────────────────────────────┐
│  Sidebar (가변형 좌측 네비게이션)                    │
│  └── 문서 트리 구조                               │
├─────────────────────────────────────────────────┤
│  Main Content (중앙 집중형 에디터 영역)              │
│  └── 가독성을 극대화한 레이아웃                      │
└─────────────────────────────────────────────────┘
```

---

## 3. Tech Stack (Core)

| 레이어 | 기술 |
|---|---|
| **Framework** | Next.js 14+ (App Router, TypeScript) |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Database / Auth** | Supabase (PostgreSQL) |
| **Editor** | TipTap (Rich Text & Slash Command 지원) |
| **Calendar** | React-Day-Picker 또는 FullCalendar |
| **Icons** | Lucide React |

---

## 4. Key Features (MVP)

### 4.1 Notion-style Wiki

- 무제한 계층 구조(Nested Documents) 지원
- 실시간 자동 저장(Auto-save) 및 마크다운 단축키
- 페이지별 아이콘 및 커버 이미지 설정

### 4.2 Smart Calendar

- 월간 / 주간 뷰 전환 대시보드
- **Wiki Linking** — 일정 생성 시 관련 위키 문서를 검색하여 태깅(Backlink)하는 기능
- 페이레터 블루 포인트 컬러를 활용한 일정 하이라이트

### 4.3 Navigation & Search

- 최근 수정된 문서 리스트 및 즐겨찾기(Favorites)
- 전체 문서 통합 검색 (`Cmd+K`)

---

## 5. Agent Collaboration Protocol

Claude 메인 에이전트는 아래 서브에이전트들을 작업 단위별로 가상 호출하여 전문성을 유지한다.

### 5.1 `[System-Architect]`

> **Role:** 전체 프로젝트 스캐폴딩, 폴더 구조 설계, 패키지 의존성 관리
>
> **Trigger:** 프로젝트 초기화 및 대규모 구조 변경 시 호출

### 5.2 `[DB-Agent]` — Supabase Expert

> **Role:** DB 스키마 설계, SQL 마이그레이션, RLS(보안 정책) 설정, API Route 최적화
>
> **Trigger:** 데이터 모델링 및 백엔드 로직 구현 시 호출

### 5.3 `[UI-Agent]` — Design System Expert

> **Role:** Shadcn UI 커스텀, Payletter Blue 테마 적용, 노션 스타일 레이아웃 구현
>
> **Trigger:** 컴포넌트 제작 및 스타일링 작업 시 호출

### 5.4 `[Feature-Agent]` — Integration Expert

> **Role:** 에디터 로직 구현, 캘린더 연동, 복잡한 비즈니스 로직 처리
>
> **Trigger:** 개별 기능 개발 단계에서 호출

---

## 6. Development Workflow

```
1. Context Load   → 모든 작업 전 PRD.md 재독, 방향성 확인
2. Auto-Delegation → 작업 성격에 맞는 서브에이전트 선언 후 작업 시작
                     (예: "지금부터 [UI-Agent] 모드로 사이드바를 만듭니다.")
3. Validation     → 결과물이 페이레터 브랜드 가이드와 노션의 사용성을 충족하는지 검토
4. Git Commit     → 작업 단위별로 Conventional Commits 규칙에 따라 커밋
```
