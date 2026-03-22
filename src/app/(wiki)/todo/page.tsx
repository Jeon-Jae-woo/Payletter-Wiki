'use client';

import { useState, useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getTodos, createTodo } from '@/lib/todos';
import TodoItem from '@/components/todo/TodoItem';
import TodoCreateInput from '@/components/todo/TodoCreateInput';
import type { Todo } from '@/types';

type Tab = 'today' | 'all' | 'done';

const TAB_LABELS: Record<Tab, string> = {
  today: '오늘',
  all: '전체',
  done: '완료',
};

function getLocalDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function filterTodos(todos: Todo[], tab: Tab): Todo[] {
  const todayStr = getLocalDateStr();
  if (tab === 'today') return todos.filter((t) => !t.is_done && t.due_date === todayStr);
  if (tab === 'all') return todos.filter((t) => !t.is_done);
  return todos.filter((t) => t.is_done);
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      const { data } = await getTodos();
      setTodos((data ?? []) as Todo[]);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleAdd(title: string, dueDate: string | null, documentId: string | null) {
    if (!userId) return;
    const { data } = await createTodo({ user_id: userId, title, due_date: dueDate, document_id: documentId });
    if (data) setTodos((prev) => [data as Todo, ...prev]);
  }

  function handleUpdate(updated: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const filtered = filterTodos(todos, tab);

  const todayCount = todos.filter((t) => !t.is_done && t.due_date === getLocalDateStr()).length;
  const allCount = todos.filter((t) => !t.is_done).length;
  const doneCount = todos.filter((t) => t.is_done).length;

  const counts: Record<Tab, number> = { today: todayCount, all: allCount, done: doneCount };

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare size={22} className="text-[#0054FF]" />
        <h1 className="text-2xl font-bold text-gray-900">할 일</h1>
      </div>

      {/* 할 일 추가 */}
      <div className="mb-6">
        <TodoCreateInput onAdd={handleAdd} />
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-100">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-[#0054FF] text-[#0054FF]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[t]}
            {counts[t] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t ? 'bg-[#0054FF] text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CheckSquare size={36} className="mb-3 opacity-20" />
          <p className="text-sm">
            {tab === 'today' ? '오늘 마감인 할 일이 없습니다' :
             tab === 'all' ? '할 일을 추가해보세요' :
             '완료된 할 일이 없습니다'}
          </p>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {filtered.map((todo) => (
            <li key={todo.id}>
              <TodoItem todo={todo} onUpdate={handleUpdate} onDelete={handleDelete} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
