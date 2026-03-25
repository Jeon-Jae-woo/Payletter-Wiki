'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { updateEvent } from '@/lib/calendar';
import { searchDocuments } from '@/lib/documents';
import type { CalendarEvent, Document } from '@/types';

type LinkedDoc = { id: string; title: string; icon: string | null };

type Props = {
  event: CalendarEvent;
  initialLinkedDocs: LinkedDoc[];
  onClose: () => void;
  onSuccess: (event: CalendarEvent) => void;
};

function formatDateValue(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeValue(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function EventEditModal({ event, initialLinkedDocs, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(formatDateValue(event.start_at));
  const [startTime, setStartTime] = useState(event.all_day ? '09:00' : formatTimeValue(event.start_at));
  const [endTime, setEndTime] = useState(
    event.end_at && !event.all_day ? formatTimeValue(event.end_at) : '10:00'
  );
  const [allDay, setAllDay] = useState(event.all_day);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(event.priority ?? 'medium');
  const [description, setDescription] = useState(event.description ?? '');
  const [linkedDocs, setLinkedDocs] = useState<LinkedDoc[]>(initialLinkedDocs);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    const { data } = await searchDocuments(query);
    setSearchResults(((data ?? []) as Document[]).slice(0, 5));
    setShowDropdown(true);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, runSearch]);

  function addLinkedDoc(doc: Document) {
    if (!linkedDocs.find((d) => d.id === doc.id)) {
      setLinkedDocs((prev) => [...prev, { id: doc.id, title: doc.title, icon: doc.icon }]);
    }
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  }

  function removeLinkedDoc(id: string) {
    setLinkedDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function validate(): boolean {
    const newErrors: { title?: string; date?: string } = {};
    if (!title.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!date) newErrors.date = '날짜를 선택해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    const start_at = allDay
      ? new Date(`${date}T00:00:00`).toISOString()
      : new Date(`${date}T${startTime}:00`).toISOString();
    const end_at = allDay
      ? new Date(`${date}T23:59:59`).toISOString()
      : new Date(`${date}T${endTime}:00`).toISOString();

    const { data: updated, error } = await updateEvent(
      event.id,
      {
        title: title.trim(),
        description: description.trim() || undefined,
        start_at,
        end_at,
        all_day: allDay,
        color: event.color ?? '#0054FF',
        priority,
      },
      linkedDocs.map((d) => d.id)
    );

    setIsSubmitting(false);
    if (error || !updated) return;
    onSuccess(updated);
  }

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
            일정 수정
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-transparent text-gray-800 dark:text-gray-200
                ${errors.title ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#0054FF]'}`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              날짜 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-transparent text-gray-800 dark:text-gray-200
                ${errors.date ? 'border-red-400 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-[#0054FF]'}`}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editAllDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 accent-[#0054FF] rounded"
            />
            <label htmlFor="editAllDay" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              하루 종일
            </label>
          </div>

          {/* Time inputs */}
          {!allDay && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] transition-colors bg-transparent text-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] transition-colors bg-transparent text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">중요도</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => {
                const labels = { high: '높음', medium: '보통', low: '낮음' };
                const styles = {
                  high: priority === 'high' ? 'bg-red-500 text-white border-red-500' : 'text-red-500 border-red-200 hover:bg-red-50',
                  medium: priority === 'medium' ? 'bg-[#0054FF] text-white border-[#0054FF]' : 'text-[#0054FF] border-blue-200 hover:bg-blue-50',
                  low: priority === 'low' ? 'bg-gray-400 text-white border-gray-400' : 'text-gray-500 border-gray-200 hover:bg-gray-50',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 text-sm font-medium border rounded-lg transition-colors ${styles[p]}`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">메모</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="메모를 입력하세요 (선택사항)"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent text-gray-800 dark:text-gray-200"
            />
          </div>

          {/* Document Linking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">관련 문서 연결</label>
            <div ref={searchRef} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="문서를 검색하세요"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent text-gray-800 dark:text-gray-200"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-[#0054FF] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                  {searchResults.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => addLinkedDoc(doc)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                    >
                      <span className="text-base">{doc.icon ?? '📄'}</span>
                      <span className="truncate text-gray-800 dark:text-gray-200">{doc.title || '제목 없음'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {linkedDocs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {linkedDocs.map((doc) => (
                  <span
                    key={doc.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md
                      bg-blue-50 border border-[#0054FF] text-[#0054FF]"
                  >
                    <span>{doc.icon ?? '📄'}</span>
                    <span className="max-w-[120px] truncate">{doc.title || '제목 없음'}</span>
                    <button
                      type="button"
                      onClick={() => removeLinkedDoc(doc.id)}
                      className="ml-0.5 hover:text-blue-800 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                bg-[#0054FF] hover:bg-[#0044DD] disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
