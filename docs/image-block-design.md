# 이미지 블록 기능 설계서

> **대상 프로젝트:** LetterWiki
> **작성일:** 2026-03-25
> **구현 범위:** 에디터 내 이미지 삽입 (파일 업로드 + URL 입력)

---

## 1. 기능 개요

TipTap 에디터에서 노션(Notion)처럼 이미지를 블록으로 삽입할 수 있는 기능.
슬래시 커맨드(`/이미지`)로 진입하며, **파일 직접 업로드**와 **URL 입력** 두 가지 방식을 지원한다.

### 사용자 플로우

```
에디터에서 / 입력
  └─ "이미지" 선택
        ├─ [파일 업로드] 탭 → 로컬 파일 선택 → Supabase Storage 업로드 → 이미지 블록 삽입
        └─ [URL 입력] 탭  → URL 붙여넣기 → 이미지 블록 삽입
```

---

## 2. 아키텍처 구성

```
슬래시 커맨드 (/이미지)
    │
    ▼
CustomEvent('open-image-upload')   ← SlashCommandExtension.ts에 항목 추가
    │
    ▼
ImageUploadModal.tsx               ← 모달 UI (파일 업로드 / URL 탭)
    │
    ├─ 파일 선택 → uploadImage() in lib/storage.ts → Supabase Storage
    │                   └─ Public URL 반환
    └─ URL 직접 입력
    │
    ▼
Editor.tsx → editor.commands.insertContent({ type: 'imageBlock', attrs: { src, alt } })
    │
    ▼
ImageBlockNode.ts                  ← TipTap 커스텀 Node (block 타입)
    └─ NodeView: <figure> 렌더링 (이미지 + 캡션 입력)
```

---

## 3. 신규 파일 목록

| 파일 | 역할 |
|---|---|
| `src/components/editor/ImageBlockNode.ts` | TipTap 커스텀 블록 노드 정의 |
| `src/components/editor/ImageUploadModal.tsx` | 이미지 삽입 모달 UI |
| `src/lib/storage.ts` | Supabase Storage 업로드 유틸 |
| `supabase/migrations/006_storage_bucket.sql` | Storage 버킷 및 RLS 정책 생성 |

### 수정 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/components/editor/SlashCommandExtension.ts` | `이미지` 커맨드 항목 추가 |
| `src/components/editor/Editor.tsx` | `ImageBlockNode` 등록, `ImageUploadModal` 렌더링 |
| `src/app/globals.css` | `figure`, `figcaption` prose 스타일 추가 |

---

## 4. 상세 설계

### 4.1 Supabase Storage 버킷

```sql
-- supabase/migrations/006_storage_bucket.sql

-- 이미지 전용 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('wiki-images', 'wiki-images', true)
ON CONFLICT DO NOTHING;

-- 로그인한 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wiki-images');

-- 업로드한 본인만 삭제 가능
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wiki-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 이미지는 누구나 조회 가능 (public bucket)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wiki-images');
```

**버킷 구조:**
```
wiki-images/
  └── {user_id}/
        └── {uuid}.{ext}    (예: a1b2c3.../img_20260325_abc123.jpg)
```

---

### 4.2 `src/lib/storage.ts`

```ts
import { supabase } from '@/lib/supabase';

const BUCKET = 'wiki-images';

export async function uploadImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  // 파일 크기 제한: 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: '파일 크기는 10MB 이하여야 합니다.' };
  }

  // 허용 타입: jpeg, png, gif, webp
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return { url: null, error: 'JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.' };
  }

  const ext = file.name.split('.').pop();
  const filename = `${userId}/img_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(filename, file);
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: data.publicUrl, error: null };
}
```

---

### 4.3 `ImageBlockNode.ts`

TipTap `@tiptap/extension-image` 기본 확장을 그대로 쓰되, **캡션(figcaption)** 과 **정렬(align)** 속성을 추가한 커스텀 노드로 확장한다.

**노드 스펙:**
```ts
// 주요 attributes
{
  src: string;          // 이미지 URL (필수)
  alt: string;          // 대체 텍스트
  caption: string;      // 캡션 (선택)
  align: 'left' | 'center' | 'right';  // 정렬 (기본: center)
}
```

**NodeView 렌더링 구조:**
```html
<figure class="image-block" data-align="center">
  <img src="{src}" alt="{alt}" />
  <figcaption contenteditable="true" placeholder="캡션을 입력하세요 (선택)">
    {caption}
  </figcaption>
</figure>
```

**NodeView 인터랙션:**
- 이미지 클릭 → 선택 상태(파란 테두리)
- 이미지 호버 → 정렬 툴바 표시 (← | ↔ | →)
- `figcaption` → 직접 텍스트 입력 가능

---

### 4.4 `ImageUploadModal.tsx`

**탭 구조:**

```
┌─────────────────────────────────────────┐
│  이미지 삽입                              │
│  ┌─────────────┐ ┌───────────────────┐  │
│  │  파일 업로드  │ │    URL 입력       │  │
│  └─────────────┘ └───────────────────┘  │
│                                          │
│  [파일 업로드 탭]                         │
│  ┌───────────────────────────────────┐  │
│  │  드래그 앤 드롭 또는 클릭하여 선택   │  │
│  │  JPG PNG GIF WEBP / 최대 10MB    │  │
│  └───────────────────────────────────┘  │
│  업로드 중... ████████░░ 80%             │
│                                          │
│  [URL 입력 탭]                           │
│  https://example.com/image.jpg           │
│                                          │
│  대체 텍스트(alt): __________________    │
│                                          │
│           [취소]  [삽입]                 │
└─────────────────────────────────────────┘
```

**Props:**
```ts
type Props = {
  onInsert: (src: string, alt: string) => void;
  onClose: () => void;
  userId: string;
};
```

**상태:**
```ts
type Tab = 'upload' | 'url';
const [tab, setTab] = useState<Tab>('upload');
const [file, setFile] = useState<File | null>(null);
const [preview, setPreview] = useState<string | null>(null);  // ObjectURL
const [urlInput, setUrlInput] = useState('');
const [alt, setAlt] = useState('');
const [uploading, setUploading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**파일 드롭 처리:**
```ts
function handleDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) setFileAndPreview(file);
}

function setFileAndPreview(file: File) {
  setFile(file);
  setPreview(URL.createObjectURL(file));  // 미리보기
}
```

**삽입 처리:**
```ts
async function handleInsert() {
  if (tab === 'upload' && file) {
    setUploading(true);
    const { url, error } = await uploadImage(file, userId);
    setUploading(false);
    if (error) { setError(error); return; }
    onInsert(url!, alt);
  } else if (tab === 'url' && urlInput.trim()) {
    onInsert(urlInput.trim(), alt);
  }
}
```

---

### 4.5 `SlashCommandExtension.ts` 추가 항목

```ts
{
  title: '이미지',
  description: '이미지를 업로드하거나 URL로 삽입',
  icon: '🖼️',
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run();
    window.dispatchEvent(new CustomEvent('open-image-upload'));
  },
},
```

---

### 4.6 `Editor.tsx` 변경 사항

```ts
// 추가 상태
const [showImageModal, setShowImageModal] = useState(false);

// 이벤트 리스너 등록
useEffect(() => {
  const handler = () => setShowImageModal(true);
  window.addEventListener('open-image-upload', handler);
  return () => window.removeEventListener('open-image-upload', handler);
}, []);

// extensions 배열에 추가
ImageBlockNode,

// 모달 렌더링
{showImageModal && (
  <ImageUploadModal
    userId={userId}
    onInsert={(src, alt) => {
      editor?.commands.insertContent({
        type: 'imageBlock',
        attrs: { src, alt, caption: '', align: 'center' },
      });
      setShowImageModal(false);
    }}
    onClose={() => setShowImageModal(false)}
  />
)}
```

> **주의:** `Editor` 컴포넌트가 현재 `userId`를 props로 받지 않는다.
> `supabase.auth.getUser()` 결과를 `useEffect` 내에서 state로 관리하거나, 이미 초기화 시 확보한 `encKeyRef` 패턴처럼 ref로 보관한다.

---

### 4.7 `globals.css` prose 스타일

```css
/* 이미지 블록 */
.prose figure.image-block {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
}
.prose figure.image-block[data-align="center"] { align-items: center; }
.prose figure.image-block[data-align="left"]   { align-items: flex-start; }
.prose figure.image-block[data-align="right"]  { align-items: flex-end; }

.prose figure.image-block img {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}
.prose figure.image-block figcaption {
  margin-top: 0.375rem;
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
}
.prose figure.image-block figcaption:empty::before {
  content: attr(data-placeholder);
  color: #d1d5db;
}

/* 다크모드 */
.dark .prose figure.image-block figcaption { color: #6b7280; }
.dark .prose figure.image-block figcaption:empty::before { color: #4b5563; }

/* 이미지 선택 상태 */
.prose figure.image-block.ProseMirror-selectednode img {
  outline: 2px solid #0054FF;
  outline-offset: 2px;
}
```

---

## 5. 패키지 의존성

추가 설치가 필요한 패키지 **없음**.

- `@tiptap/extension-image`는 `@tiptap/starter-kit`에 **미포함**이므로 별도 설치 필요:
  ```bash
  npm install @tiptap/extension-image
  ```
- Supabase Storage는 기존 `@supabase/supabase-js` 클라이언트로 처리 가능.

---

## 6. 비공개 문서(암호화) 고려

현재 비공개 문서는 콘텐츠 전체를 AES-256-GCM으로 암호화하여 DB에 저장한다.
이미지 URL 자체는 Supabase Storage의 **공개 버킷**에 저장되므로 문서 내 URL도 평문으로 노출될 수 있다.

| 케이스 | 동작 |
|---|---|
| 공개 문서의 이미지 | Storage Public URL → 문제 없음 |
| 비공개 문서의 이미지 | 문서 JSON은 암호화되지만 Storage URL 자체는 공개 — **이미지 URL 직접 접근 가능** |

**MVP 범위에서는 이미지 URL 암호화를 제외**하고, 향후 비공개 버킷 + Signed URL 방식으로 확장한다.

---

## 7. 미래 확장 포인트

| 항목 | 설명 |
|---|---|
| 이미지 리사이즈 핸들 | NodeView에 드래그 핸들 추가 (`width` attribute 저장) |
| 비공개 이미지 | Supabase Storage 비공개 버킷 + `createSignedUrl()` |
| 이미지 압축 | 업로드 전 `browser-image-compression` 라이브러리로 전처리 |
| 붙여넣기 업로드 | `ClipboardEvent`에서 `image/*` 감지 → 자동 업로드 |
| 드래그 앤 드롭 (에디터 외부) | TipTap `handleDrop` 이벤트에서 파일 감지 |

---

## 8. 구현 순서

```
Step 1. Supabase Storage 버킷 생성 (migration 006)
Step 2. src/lib/storage.ts — uploadImage 유틸
Step 3. ImageBlockNode.ts — TipTap 커스텀 노드
Step 4. globals.css — prose 스타일 추가
Step 5. ImageUploadModal.tsx — 모달 UI
Step 6. SlashCommandExtension.ts — /이미지 커맨드 등록
Step 7. Editor.tsx — 노드 등록 + 모달 연결
Step 8. 동작 검증
```
