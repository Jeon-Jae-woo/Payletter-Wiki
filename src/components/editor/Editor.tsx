'use client';
import 'tippy.js/dist/tippy.css';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommandExtension from './SlashCommandExtension';
import { useAutoSave } from '@/hooks/useAutoSave';
import { updateDocument } from '@/lib/documents';
import type { Document } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Smile, Camera, Star } from 'lucide-react';

type Props = {
  document: Document;
};

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

  // Icon state
  const [icon, setIcon] = useState<string | null>(document.icon ?? null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const iconButtonRef = useRef<HTMLButtonElement | HTMLSpanElement | null>(null);

  // Favorite state
  const [isFavorite, setIsFavorite] = useState<boolean>(document.is_favorite ?? false);

  async function handleToggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    await updateDocument(document.id, { is_favorite: next });
  }

  // Cover state
  const [coverUrl, setCoverUrl] = useState<string | null>(document.cover_url ?? null);
  const [showCoverPanel, setShowCoverPanel] = useState(false);
  const [coverInput, setCoverInput] = useState('');
  const [showCoverButton, setShowCoverButton] = useState(false);
  const coverPanelRef = useRef<HTMLDivElement>(null);

  // Close icon picker on outside click
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
    if (showIconPicker) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showIconPicker]);

  // Close cover panel on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        coverPanelRef.current &&
        !coverPanelRef.current.contains(e.target as Node)
      ) {
        setShowCoverPanel(false);
      }
    }
    if (showCoverPanel) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showCoverPanel]);

  // Sync browser tab title with icon + document title
  useEffect(() => {
    window.document.title = icon
      ? `${icon} ${document.title || '제목 없음'}`
      : document.title || '제목 없음';
  }, [icon, document.title]);

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
    if (coverInput.trim()) {
      handleSetCover(coverInput.trim());
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return '제목을 입력하세요';
          return "내용을 입력하거나 '/'를 눌러 명령어를 사용하세요";
        },
      }),
      SlashCommandExtension,
    ],
    content: document.content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none focus:outline-none min-h-[60vh]',
      },
    },
    onUpdate: ({ editor }) => {
      save({ content: editor.getJSON() as Record<string, unknown> });
    },
    immediatelyRender: false,
  });

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
          {/* Favorite button (always visible on cover) */}
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
        {/* Add cover button + Favorite toggle (top-right, when no cover) */}
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
              <Star
                size={13}
                className={isFavorite ? 'fill-yellow-400' : ''}
              />
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

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// Sub-component for the cover panel (shared between "add" and "change" buttons)
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
