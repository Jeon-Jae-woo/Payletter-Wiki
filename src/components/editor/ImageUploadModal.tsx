'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, Link } from 'lucide-react';
import { uploadImage } from '@/lib/storage';

type Tab = 'upload' | 'url';

type Props = {
  userId: string;
  onInsert: (src: string, alt: string) => void;
  onClose: () => void;
};

export default function ImageUploadModal({ userId, onInsert, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyFile(f: File) {
    setError(null);
    setFile(f);
    const prev = preview;
    if (prev) URL.revokeObjectURL(prev);
    setPreview(URL.createObjectURL(f));
    if (!alt) setAlt(f.name.replace(/\.[^.]+$/, ''));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) applyFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, alt]);

  async function handleInsert() {
    setError(null);
    if (tab === 'upload') {
      if (!file) { setError('파일을 선택해주세요.'); return; }
      setUploading(true);
      const { url, error: uploadError } = await uploadImage(file, userId);
      setUploading(false);
      if (uploadError || !url) { setError(uploadError ?? '업로드에 실패했습니다.'); return; }
      onInsert(url, alt);
    } else {
      if (!urlInput.trim()) { setError('URL을 입력해주세요.'); return; }
      onInsert(urlInput.trim(), alt);
    }
  }

  const canInsert = tab === 'upload' ? !!file : !!urlInput.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Pretendard, sans-serif' }}>
            이미지 삽입
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {(['upload', 'url'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${tab === t
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                {t === 'upload' ? <><Upload size={13} /> 파일 업로드</> : <><Link size={13} /> URL 입력</>}
              </button>
            ))}
          </div>

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="미리보기" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-gray-900" />
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${isDragging
                      ? 'border-[#0054FF] bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-[#0054FF] hover:bg-blue-50 dark:hover:bg-blue-950/20'
                    }`}
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    드래그 앤 드롭 또는 <span className="text-[#0054FF] font-medium">클릭하여 선택</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">JPG · PNG · GIF · WEBP / 최대 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f); }}
              />
            </div>
          )}

          {/* URL Tab */}
          {tab === 'url' && (
            <div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] transition-colors bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {urlInput && (
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlInput}
                    alt="미리보기"
                    className="w-full max-h-40 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Alt text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              대체 텍스트 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="이미지 설명"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] transition-colors bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!canInsert || uploading}
              onClick={handleInsert}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                bg-[#0054FF] hover:bg-[#0044DD] disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {uploading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {uploading ? '업로드 중...' : '삽입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
