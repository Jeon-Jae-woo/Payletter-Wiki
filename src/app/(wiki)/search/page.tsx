'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText } from 'lucide-react';
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

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">검색</h1>

      {/* Search input */}
      <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm mb-6 focus-within:border-[#0054FF] transition-colors">
        <Search size={18} className="shrink-0 text-gray-400 dark:text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="문서 제목을 검색하세요..."
          className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 bg-transparent"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-[#0054FF] border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {/* Results */}
      {!query.trim() ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Search size={40} className="mb-3 opacity-30" />
          <p className="text-sm">검색어를 입력하면 문서를 찾아드립니다</p>
          <p className="text-xs mt-1 text-gray-300">Cmd+K 단축키로도 검색할 수 있습니다</p>
        </div>
      ) : results.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FileText size={40} className="mb-3 opacity-30" />
          <p className="text-sm">"{query}"에 대한 검색 결과가 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {results.map((doc, idx) => (
            <li key={doc.id}>
              <button
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors group ${
                  idx === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-950 text-[#0054FF]'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => handleSelect(doc)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                {doc.icon ? (
                  <span className="shrink-0 text-[18px] leading-none">{doc.icon}</span>
                ) : (
                  <FileText
                    size={18}
                    className={`shrink-0 transition-colors ${
                      idx === selectedIndex ? 'text-[#0054FF]' : 'text-gray-400'
                    }`}
                  />
                )}
                <span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
                <span className={`shrink-0 text-xs ${idx === selectedIndex ? 'text-[#0054FF]/70' : 'text-gray-400 dark:text-gray-500'}`}>
                  {relativeTime(doc.updated_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
