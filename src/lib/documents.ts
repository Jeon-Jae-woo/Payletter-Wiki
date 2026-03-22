import { supabase } from './supabase';
import type { Document } from '@/types';

// Fetch root-level documents for the current user
export async function getRootDocuments(includePrivate = false) {
  let query = supabase
    .from('documents')
    .select('*')
    .is('parent_id', null)
    .order('sort_order', { ascending: true });
  if (!includePrivate) {
    query = query.eq('visibility', 'default');
  }
  return query;
}

// Fetch children of a document
export async function getChildDocuments(parentId: string, includePrivate = false) {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('parent_id', parentId)
    .order('sort_order', { ascending: true });
  if (!includePrivate) {
    query = query.eq('visibility', 'default');
  }
  return query;
}

// Fetch a single document by id
export async function getDocument(id: string) {
  return supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
}

// Create a new document (user_id must match auth.uid() — enforced by RLS)
export async function createDocument(data: {
  user_id: string;
  title?: string;
  parent_id?: string | null;
  icon?: string;
  visibility?: 'default' | 'private' | 'public';
}) {
  return supabase
    .from('documents')
    .insert({
      user_id: data.user_id,
      title: data.title ?? '제목 없음',
      parent_id: data.parent_id ?? null,
      icon: data.icon ?? null,
      visibility: data.visibility ?? 'default',
    })
    .select()
    .single();
}

// Update document content (auto-save)
export async function updateDocument(
  id: string,
  data: Partial<Pick<Document, 'title' | 'content' | 'icon' | 'cover_url' | 'is_favorite' | 'sort_order' | 'visibility'>>
) {
  return supabase
    .from('documents')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

// Delete a document (cascades to children via DB)
export async function deleteDocument(id: string) {
  return supabase
    .from('documents')
    .delete()
    .eq('id', id);
}

// Get favorite documents
export async function getFavoriteDocuments() {
  return supabase
    .from('documents')
    .select('*')
    .eq('is_favorite', true)
    .order('updated_at', { ascending: false });
}

// Get recently updated documents
export async function getRecentDocuments(limit = 10, includePrivate = false) {
  let query = supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (!includePrivate) {
    query = query.eq('visibility', 'default');
  }
  return query;
}

// Full-text search across titles
export async function searchDocuments(query: string, includePrivate = false) {
  let q = supabase
    .from('documents')
    .select('*')
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(20);
  if (!includePrivate) {
    q = q.eq('visibility', 'default');
  }
  return q;
}

// 비공개 문서만 조회
export async function getPrivateDocuments() {
  return supabase
    .from('documents')
    .select('*')
    .eq('visibility', 'private')
    .order('updated_at', { ascending: false });
}

