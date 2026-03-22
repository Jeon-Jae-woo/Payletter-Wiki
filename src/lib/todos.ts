import { supabase } from './supabase';
import type { Todo } from '@/types';

export async function getTodos() {
  return supabase
    .from('todos')
    .select('*, document:documents(id, title, icon)')
    .order('is_done', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true });
}

export async function getTodosForMonth(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return supabase
    .from('todos')
    .select('id, title, is_done, due_date')
    .gte('due_date', start)
    .lte('due_date', end)
    .eq('is_done', false);
}

export async function createTodo(data: {
  user_id: string;
  title: string;
  due_date?: string | null;
  document_id?: string | null;
}) {
  return supabase
    .from('todos')
    .insert({
      user_id: data.user_id,
      title: data.title,
      due_date: data.due_date ?? null,
      document_id: data.document_id ?? null,
    })
    .select('*, document:documents(id, title, icon)')
    .single();
}

export async function updateTodo(
  id: string,
  data: Partial<Pick<Todo, 'title' | 'is_done' | 'due_date' | 'document_id' | 'sort_order'>>
) {
  return supabase
    .from('todos')
    .update(data)
    .eq('id', id)
    .select('*, document:documents(id, title, icon)')
    .single();
}

export async function deleteTodo(id: string) {
  return supabase.from('todos').delete().eq('id', id);
}
