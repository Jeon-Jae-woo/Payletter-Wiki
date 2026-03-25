'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { searchDocuments } from '@/lib/documents';
import type { Document } from '@/types';

type Props = {
  onSelect: (doc: { id: string; title: string; icon: string | null }) => void;
  onClose: () => void;
};

export default function PageSearchModal({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const { data } = await searchDocuments(q, true);
    setResults(((data ?? []) as Document[]).slice(0, 8));
    setIsSearching(false);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-32 bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-700"
        style={{ fontFamily: 'Pretendard, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search size={15} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="페이지 검색..."
            className="flex-1 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder:text-gray-500 outline-none bg-transparent"
          />
          {isSearching && (
            <div className="w-3.5 h-3.5 border-2 border-[#0054FF] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {results.length === 0 && query.trim() && !isSearching && (
            <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-gray-500">검색 결과가 없습니다</p>
          )}
          {results.length === 0 && !query.trim() && (
            <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-gray-500">페이지 이름을 입력하세요</p>
          )}
          {results.map((doc, i) => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIndex ? 'bg-blue-50 dark:bg-blue-950 text-[#0054FF]' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="flex-shrink-0 text-base">
                {doc.icon ?? <FileText size={15} />}
              </span>
              <span className="truncate text-sm">{doc.title || '제목 없음'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
