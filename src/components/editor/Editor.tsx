'use client';
import 'tippy.js/dist/tippy.css';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommandExtension from './SlashCommandExtension';
import { useAutoSave } from '@/hooks/useAutoSave';
import { updateDocument } from '@/lib/documents';
import {
  encryptContent,
  decryptContent,
  isEncryptedContent,
} from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import type { Document } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Smile, Camera, Star, Globe, Lock } from 'lucide-react';

type Props = {
  document: Document;
};

// TipTap v3 fix: Enter on empty list item should exit the list.
const ListItemEnterFix = Extension.create({
  name: 'listItemEnterFix',
  priority: 200,
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, commands } = this.editor;
        const { $from } = state.selection;
        const isInEmptyListItemParagraph =
          $from.parent.type.name === 'paragraph' &&
          $from.parent.content.size === 0 &&
          $from.node(-1)?.type.name === 'listItem';
        if (isInEmptyListItemParagraph) {
          return commands.liftListItem('listItem');
        }
        return false;
      },
    };
  },
});

const SAVE_STATUS_LABEL: Record<string, string> = {
  idle: '',
  saving: '저장 중...',
  saved: '저장됨',
  error: '저장 실패',
};

const EMOJI_LIST = [
  '📝', '📄', '📋', '📌', '📍', '🗂️', '📁', '📂',
  '💡', '🔑', '🎯', '✅', '⭐', '🔖', '💬', '🗒️',
  '🏠', '👤', '🛠️', '📊', '📈', '💼', '🎨', '🔍',
];

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #0054FF 0%, #6366f1 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #10b981 0%, #0054FF 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
];

function isGradient(value: string): boolean {
  return value.startsWith('linear-gradient');
}

export default function Editor({ document }: Props) {
  const { save, saveStatus } = useAutoSave(document.id);

  // ── 암호화 키 & 콘텐츠 초기화 ──────────────────────────────
  const encKeyRef = useRef<string | null>(null);
  const [contentReady, setContentReady] = useState(false);

  // ── Visibility ─────────────────────────────────────────────
  const [visibility, setVisibility] = useState<'default' | 'private' | 'public'>(
    document.visibility ?? 'default'
  );
  const visibilityRef = useRef(visibility);
  useEffect(() => { visibilityRef.current = visibility; }, [visibility]);

  // ── Icon ───────────────────────────────────────────────────
  const [icon, setIcon] = useState<string | null>(document.icon ?? null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const iconButtonRef = useRef<HTMLButtonElement | HTMLSpanElement | null>(null);

  // ── Favorite ───────────────────────────────────────────────
  const [isFavorite, setIsFavorite] = useState<boolean>(document.is_favorite ?? false);

  // ── Cover ──────────────────────────────────────────────────
  const [coverUrl, setCoverUrl] = useState<string | null>(document.cover_url ?? null);
  const [showCoverPanel, setShowCoverPanel] = useState(false);
  const [coverInput, setCoverInput] = useState('');
  const [showCoverButton, setShowCoverButton] = useState(false);
  const coverPanelRef = useRef<HTMLDivElement>(null);

  // ── 초기화: 암호화 키 로드 + 비공개 문서 복호화 ────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      const key: string | null = user?.user_metadata?.enc_key ?? null;
      encKeyRef.current = key;

      if (isEncryptedContent(document.content) && key) {
        try {
          const plain = await decryptContent(document.content, key);
          if (!cancelled) {
            editorInitContentRef.current = plain;
          }
        } catch {
          // 복호화 실패 시 빈 문서로 열림
          if (!cancelled) editorInitContentRef.current = null;
        }
      } else {
        if (!cancelled) editorInitContentRef.current = document.content as Record<string, unknown> | null;
      }

      if (!cancelled) setContentReady(true);
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);

  // 에디터 초기 콘텐츠를 ref로 보관 (useEditor보다 먼저 필요)
  const editorInitContentRef = useRef<Record<string, unknown> | null>(null);

  // ── 아이콘 피커 외부 클릭 닫기 ────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        iconPickerRef.current &&
        !iconPickerRef.current.contains(e.target as Node) &&
        iconButtonRef.current &&
        !iconButtonRef.current.contains(e.target as Node)
      ) {
        setShowIconPicker(false);
      }
    }
    if (showIconPicker) window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showIconPicker]);

  // ── 커버 패널 외부 클릭 닫기 ──────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (coverPanelRef.current && !coverPanelRef.current.contains(e.target as Node)) {
        setShowCoverPanel(false);
      }
    }
    if (showCoverPanel) window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showCoverPanel]);

  // ── 브라우저 탭 타이틀 ────────────────────────────────────
  useEffect(() => {
    window.document.title = icon
      ? `${icon} ${document.title || '제목 없음'}`
      : document.title || '제목 없음';
  }, [icon, document.title]);

  // ── 아이콘 핸들러 ─────────────────────────────────────────
  async function handleSelectEmoji(emoji: string) {
    setIcon(emoji);
    setShowIconPicker(false);
    await updateDocument(document.id, { icon: emoji });
  }

  async function handleRemoveIcon() {
    setIcon(null);
    setShowIconPicker(false);
    await updateDocument(document.id, { icon: null });
  }

  // ── 커버 핸들러 ───────────────────────────────────────────
  async function handleSetCover(value: string) {
    setCoverUrl(value);
    setShowCoverPanel(false);
    setCoverInput('');
    await updateDocument(document.id, { cover_url: value });
  }

  async function handleRemoveCover() {
    setCoverUrl(null);
    setShowCoverPanel(false);
    setCoverInput('');
    await updateDocument(document.id, { cover_url: null });
  }

  function handleApplyCoverUrl() {
    if (coverInput.trim()) handleSetCover(coverInput.trim());
  }

  // ── 즐겨찾기 ─────────────────────────────────────────────
  async function handleToggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    await updateDocument(document.id, { is_favorite: next });
  }

  // ── Visibility 토글 ───────────────────────────────────────
  async function handleToggleVisibility() {
    const next = visibility === 'private' ? 'default' : 'private';
    setVisibility(next);

    // 현재 에디터 콘텐츠
    const currentContent = editor?.getJSON() as Record<string, unknown> | undefined;

    if (next === 'private' && encKeyRef.current && currentContent) {
      // 비공개로 전환 → 암호화 후 저장
      const encrypted = await encryptContent(currentContent, encKeyRef.current);
      await updateDocument(document.id, {
        visibility: next,
        content: encrypted as unknown as Record<string, unknown>,
      });
    } else {
      // 공개로 전환 → 평문 저장
      await updateDocument(document.id, {
        visibility: next,
        content: currentContent ?? null,
      });
    }
  }

  // ── TipTap 에디터 ─────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return '제목을 입력하세요';
          return "내용을 입력하거나 '/'를 눌러 명령어를 사용하세요";
        },
      }),
      ListItemEnterFix,
      SlashCommandExtension,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none focus:outline-none min-h-[60vh]',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON() as Record<string, unknown>;

      if (visibilityRef.current === 'private' && encKeyRef.current) {
        // 비공개 문서 → 암호화 후 저장
        encryptContent(content, encKeyRef.current).then((encrypted) => {
          save({ content: encrypted as unknown as Record<string, unknown> });
        });
      } else {
        save({ content });
      }
    },
    immediatelyRender: false,
  });

  // ── 복호화 완료 후 에디터에 콘텐츠 주입 ──────────────────
  useEffect(() => {
    if (contentReady && editor) {
      editor.commands.setContent(editorInitContentRef.current ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentReady, editor]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover Image Area */}
      {coverUrl ? (
        <div
          className="relative w-full h-40 rounded-t-lg overflow-hidden group"
          onMouseEnter={() => setShowCoverButton(true)}
          onMouseLeave={() => setShowCoverButton(false)}
        >
          {isGradient(coverUrl) ? (
            <div className="w-full h-full" style={{ background: coverUrl }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="cover" className="w-full h-40 object-cover" />
          )}
          {/* Favorite button */}
          <div className="absolute top-2 right-3">
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/80 backdrop-blur-sm transition-colors ${
                isFavorite ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Star size={12} className={isFavorite ? 'fill-yellow-400' : ''} />
              {isFavorite ? '즐겨찾기됨' : '즐겨찾기'}
            </button>
          </div>

          {/* Change cover button overlay */}
          <div className={`absolute bottom-2 right-3 transition-opacity ${showCoverButton ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative">
              <button
                onClick={() => setShowCoverPanel((v) => !v)}
                className="px-3 py-1.5 text-xs font-medium bg-white/90 text-gray-700 rounded-lg shadow hover:bg-white transition-colors"
              >
                커버 변경
              </button>
              {showCoverPanel && (
                <div
                  ref={coverPanelRef}
                  className="absolute z-20 bg-white border border-border rounded-xl shadow-lg p-3 w-72 right-0 bottom-9"
                >
                  <CoverPanel
                    coverInput={coverInput}
                    setCoverInput={setCoverInput}
                    onApply={handleApplyCoverUrl}
                    onSelectGradient={handleSetCover}
                    onRemove={handleRemoveCover}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="px-8 py-10">
        {/* 상단 우측: 즐겨찾기 + 커버 추가 + 비공개 토글 */}
        {!coverUrl && (
          <div className="flex justify-end items-center gap-3 mb-1">
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isFavorite
                  ? 'text-yellow-400 hover:text-yellow-500'
                  : 'text-gray-400 hover:text-gray-500'
              }`}
              aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Star size={13} className={isFavorite ? 'fill-yellow-400' : ''} />
              {isFavorite ? '즐겨찾기됨' : '즐겨찾기'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowCoverPanel((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-500 transition-colors"
              >
                <Camera size={13} />
                커버 추가
              </button>
              {showCoverPanel && (
                <div
                  ref={coverPanelRef}
                  className="absolute z-20 bg-white border border-border rounded-xl shadow-lg p-3 w-72 right-0 top-6"
                >
                  <CoverPanel
                    coverInput={coverInput}
                    setCoverInput={setCoverInput}
                    onApply={handleApplyCoverUrl}
                    onSelectGradient={handleSetCover}
                    onRemove={handleRemoveCover}
                  />
                </div>
              )}
            </div>

            {/* 비공개 토글 */}
            <button
              onClick={handleToggleVisibility}
              className={`flex items-center gap-1 text-xs transition-colors ${
                visibility === 'private'
                  ? 'text-[#0054FF] hover:text-[#0044DD]'
                  : 'text-gray-400 hover:text-gray-500'
              }`}
              title={visibility === 'private' ? '비공개 (클릭하여 공개 전환)' : '공개 (클릭하여 비공개 전환)'}
            >
              {visibility === 'private' ? (
                <><Lock size={13} />비공개</>
              ) : (
                <><Globe size={13} />공개</>
              )}
            </button>
          </div>
        )}

        {/* 커버 있을 때도 비공개 토글 표시 */}
        {coverUrl && (
          <div className="flex justify-end mb-1">
            <button
              onClick={handleToggleVisibility}
              className={`flex items-center gap-1 text-xs transition-colors ${
                visibility === 'private'
                  ? 'text-[#0054FF] hover:text-[#0044DD]'
                  : 'text-gray-400 hover:text-gray-500'
              }`}
              title={visibility === 'private' ? '비공개 (클릭하여 공개 전환)' : '공개 (클릭하여 비공개 전환)'}
            >
              {visibility === 'private' ? (
                <><Lock size={13} />비공개</>
              ) : (
                <><Globe size={13} />공개</>
              )}
            </button>
          </div>
        )}

        {/* Icon Picker Area */}
        <div className="relative mb-3">
          {icon ? (
            <span
              ref={iconButtonRef as React.RefObject<HTMLSpanElement>}
              className="text-5xl cursor-pointer select-none inline-block"
              onClick={() => setShowIconPicker((v) => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setShowIconPicker((v) => !v)}
            >
              {icon}
            </span>
          ) : (
            <button
              ref={iconButtonRef as React.RefObject<HTMLButtonElement>}
              onClick={() => setShowIconPicker((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Smile size={16} />
              아이콘 추가
            </button>
          )}

          {showIconPicker && (
            <div
              ref={iconPickerRef}
              className="absolute z-20 bg-white border border-border rounded-xl shadow-lg p-3 w-72 top-full mt-1 left-0"
            >
              <div className="grid grid-cols-8 gap-1 mb-3">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRemoveIcon}
                className="w-full text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors border border-gray-200"
              >
                제거
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          defaultValue={document.title}
          placeholder="제목 없음"
          onChange={(e) => save({ title: e.target.value })}
          className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 bg-transparent border-none outline-none mb-6 resize-none"
        />

        {/* Save status */}
        <div className="h-5 mb-4">
          {saveStatus !== 'idle' && (
            <span className={`text-xs ${saveStatus === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
              {SAVE_STATUS_LABEL[saveStatus]}
            </span>
          )}
        </div>

        {/* 콘텐츠 로딩 중 스켈레톤 */}
        {!contentReady ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}

        {/* 비공개 문서 안내 배너 */}
        {visibility === 'private' && contentReady && (
          <div className="mt-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-[#0054FF]">
            <Lock size={12} />
            이 문서는 비공개입니다. 내용이 암호화되어 DB에 저장됩니다.
          </div>
        )}
      </div>
    </div>
  );
}

// ── 커버 패널 서브 컴포넌트 ────────────────────────────────────────────
function CoverPanel({
  coverInput,
  setCoverInput,
  onApply,
  onSelectGradient,
  onRemove,
}: {
  coverInput: string;
  setCoverInput: (v: string) => void;
  onApply: () => void;
  onSelectGradient: (g: string) => void;
  onRemove: () => void;
}) {
  return (
    <>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={coverInput}
          onChange={(e) => setCoverInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApply()}
          placeholder="이미지 URL을 입력하세요"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0054FF] transition-colors"
        />
        <button
          onClick={onApply}
          className="px-3 py-1.5 text-xs font-medium bg-[#0054FF] text-white rounded-lg hover:bg-[#0044DD] transition-colors"
        >
          적용
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        {PRESET_GRADIENTS.map((g) => (
          <button
            key={g}
            onClick={() => onSelectGradient(g)}
            className="flex-1 h-8 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all"
            style={{ background: g }}
            title="프리셋 커버"
          />
        ))}
      </div>

      <button
        onClick={onRemove}
        className="w-full text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors border border-gray-200"
      >
        제거
      </button>
    </>
  );
}
