'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, X } from 'lucide-react';
import { searchDocuments } from '@/lib/documents';
import type { Document } from '@/types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens; reset state when modal closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await searchDocuments(q);
        if (!error && data) {
          setResults(data as Document[]);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, []);

  useEffect(() => {
    doSearch(query);
    setSelectedIndex(0);
  }, [query, doSearch]);

  function handleSelect(doc: Document) {
    router.push('/documents/' + doc.id);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl mx-4 mt-32 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search size={18} className="shrink-0 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="문서 검색..."
            className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 bg-transparent"
          />
          <div className="flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="flex items-center justify-center w-5 h-5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="지우기"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              Esc
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              검색어를 입력하세요
            </div>
          ) : isLoading ? (
            <div className="px-4 py-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse shrink-0" />
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-12 h-3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              검색 결과가 없습니다
            </div>
          ) : (
            <ul className="py-1.5">
              {results.map((doc, idx) => (
                <li key={doc.id}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-950 text-[#0054FF]'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleSelect(doc)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {doc.icon ? (
                      <span className="shrink-0 text-[15px] leading-none">{doc.icon}</span>
                    ) : (
                      <FileText
                        size={15}
                        className={`shrink-0 ${idx === selectedIndex ? 'text-[#0054FF]' : 'text-gray-400'}`}
                      />
                    )}
                    <span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                      {relativeTime(doc.updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
