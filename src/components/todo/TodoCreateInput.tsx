'use client';

import { useState, useRef } from 'react';
import { Plus, Calendar, FileText, X } from 'lucide-react';
import { searchDocuments } from '@/lib/documents';
import type { Document } from '@/types';

type Props = {
  onAdd: (title: string, dueDate: string | null, documentId: string | null) => void;
};

export default function TodoCreateInput({ onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkedDoc, setLinkedDoc] = useState<Document | null>(null);
  const [docSearch, setDocSearch] = useState('');
  const [docResults, setDocResults] = useState<Document[]>([]);
  const [showDocSearch, setShowDocSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  async function handleDocSearch(q: string) {
    setDocSearch(q);
    if (!q.trim()) { setDocResults([]); return; }
    const { data } = await searchDocuments(q);
    setDocResults((data ?? []) as Document[]);
  }

  function handleSelectDoc(doc: Document) {
    setLinkedDoc(doc);
    setDocSearch('');
    setDocResults([]);
    setShowDocSearch(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), dueDate || null, linkedDoc?.id ?? null);
    setTitle('');
    setDueDate('');
    setLinkedDoc(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-[#0054FF] transition-colors">
        <Plus size={16} className="shrink-0 text-gray-400" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="shrink-0 px-3 py-1 text-xs font-medium text-white bg-[#0054FF] rounded-lg hover:bg-[#0044DD] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          추가
        </button>
      </div>

      {/* 마감일 + 위키 연결 옵션 */}
      <div className="flex items-center gap-3 px-1">
        {/* 마감일 */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Calendar size={13} className="text-gray-400" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-xs text-gray-500 dark:text-gray-400 outline-none bg-transparent cursor-pointer"
          />
        </label>

        {/* 위키 연결 */}
        <div className="relative" ref={searchRef}>
          {linkedDoc ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0054FF] text-xs">
              {linkedDoc.icon && <span>{linkedDoc.icon}</span>}
              <span className="max-w-[100px] truncate">{linkedDoc.title}</span>
              <button
                type="button"
                onClick={() => setLinkedDoc(null)}
                className="ml-0.5 text-gray-400 hover:text-red-400"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDocSearch((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <FileText size={13} />
              위키 연결
            </button>
          )}

          {showDocSearch && (
            <div className="absolute left-0 top-6 z-20 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-lg p-2 w-56">
              <input
                type="text"
                value={docSearch}
                onChange={(e) => handleDocSearch(e.target.value)}
                placeholder="문서 검색..."
                autoFocus
                className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] mb-1.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {docResults.length > 0 ? (
                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                  {docResults.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectDoc(doc)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-[#0054FF] transition-colors"
                      >
                        {doc.icon ? (
                          <span className="text-sm">{doc.icon}</span>
                        ) : (
                          <FileText size={13} className="text-gray-400 shrink-0" />
                        )}
                        <span className="truncate">{doc.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : docSearch ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">검색 결과 없음</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
