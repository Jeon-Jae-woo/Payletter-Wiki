'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, FileText, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateTodo, deleteTodo } from '@/lib/todos';
import { searchDocuments } from '@/lib/documents';
import type { Todo, Document } from '@/types';

type Props = {
  todo: Todo;
  onUpdate: (updated: Todo) => void;
  onDelete: (id: string) => void;
};

function formatDueDate(dateStr: string): { label: string; overdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { label: `${Math.abs(diff)}일 지남`, overdue: true };
  if (diff === 0) return { label: '오늘', overdue: false };
  if (diff === 1) return { label: '내일', overdue: false };
  if (diff <= 7) return { label: `${diff}일 후`, overdue: false };
  return { label: new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }), overdue: false };
}

export default function TodoItem({ todo, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showDocSearch, setShowDocSearch] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docResults, setDocResults] = useState<Document[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  async function handleToggle() {
    const { data } = await updateTodo(todo.id, { is_done: !todo.is_done });
    if (data) onUpdate(data as Todo);
  }

  async function handleTitleSave() {
    setIsEditing(false);
    if (!editTitle.trim() || editTitle === todo.title) return;
    const { data } = await updateTodo(todo.id, { title: editTitle.trim() });
    if (data) onUpdate(data as Todo);
  }

  async function handleDueDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value || null;
    const { data } = await updateTodo(todo.id, { due_date: val });
    if (data) onUpdate(data as Todo);
  }

  async function handleDocSearch(q: string) {
    setDocSearch(q);
    if (!q.trim()) { setDocResults([]); return; }
    const { data } = await searchDocuments(q);
    setDocResults((data ?? []) as Document[]);
  }

  async function handleLinkDoc(doc: Document) {
    const { data } = await updateTodo(todo.id, { document_id: doc.id });
    if (data) onUpdate(data as Todo);
    setShowDocSearch(false);
    setDocSearch('');
    setDocResults([]);
  }

  async function handleUnlinkDoc() {
    const { data } = await updateTodo(todo.id, { document_id: null });
    if (data) onUpdate(data as Todo);
  }

  async function handleDelete() {
    await deleteTodo(todo.id);
    onDelete(todo.id);
  }

  const due = todo.due_date ? formatDueDate(todo.due_date) : null;

  return (
    <div className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${todo.is_done ? 'opacity-60' : ''}`}>
      {/* 체크박스 */}
      <button
        onClick={handleToggle}
        className={`shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          todo.is_done
            ? 'bg-[#0054FF] border-[#0054FF]'
            : 'border-gray-300 dark:border-gray-600 hover:border-[#0054FF]'
        }`}
        aria-label={todo.is_done ? '완료 취소' : '완료'}
      >
        {todo.is_done && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        {/* 제목 */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') { setEditTitle(todo.title); setIsEditing(false); }
            }}
            className="w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent outline-none border-b border-[#0054FF]"
          />
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className={`text-sm cursor-text ${todo.is_done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}
          >
            {todo.title}
          </p>
        )}

        {/* 메타: 마감일 + 위키 연결 */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {/* 마감일 */}
          <label className={`flex items-center gap-1 cursor-pointer text-xs ${due?.overdue ? 'text-red-500' : 'text-gray-400'}`}>
            <Calendar size={11} />
            {due ? (
              <span>{due.label}</span>
            ) : (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">마감일</span>
            )}
            <input
              type="date"
              value={todo.due_date ?? ''}
              onChange={handleDueDateChange}
              className="absolute opacity-0 w-0 h-0"
            />
          </label>

          {/* 위키 연결 */}
          {todo.document ? (
            <div className="flex items-center gap-1 text-xs text-[#0054FF]">
              <button
                onClick={() => router.push('/documents/' + todo.document!.id)}
                className="flex items-center gap-1 hover:underline"
              >
                {todo.document.icon ? (
                  <span>{todo.document.icon}</span>
                ) : (
                  <FileText size={11} />
                )}
                <span className="max-w-[100px] truncate">{todo.document.title}</span>
              </button>
              <button onClick={handleUnlinkDoc} className="text-gray-300 hover:text-red-400 transition-colors">
                <X size={10} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDocSearch((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600 hover:text-[#0054FF] opacity-0 group-hover:opacity-100 transition-all"
              >
                <FileText size={11} />
                위키 연결
              </button>
              {showDocSearch && (
                <div className="absolute left-0 top-5 z-20 bg-white dark:bg-gray-800 border border-border rounded-xl shadow-lg p-2 w-52">
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => handleDocSearch(e.target.value)}
                    placeholder="문서 검색..."
                    autoFocus
                    className="w-full text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-[#0054FF] mb-1.5 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  {docResults.length > 0 ? (
                    <ul className="space-y-0.5 max-h-36 overflow-y-auto">
                      {docResults.map((doc) => (
                        <li key={doc.id}>
                          <button
                            onClick={() => handleLinkDoc(doc)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-[#0054FF]"
                          >
                            {doc.icon ? <span>{doc.icon}</span> : <FileText size={12} className="shrink-0" />}
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
          )}
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
        aria-label="삭제"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
