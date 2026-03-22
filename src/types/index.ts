// Shared types for LetterWiki — matches Supabase schema exactly

export type Document = {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  content: Record<string, unknown> | null;  // TipTap JSON
  icon: string | null;
  cover_url: string | null;
  is_favorite: boolean;
  sort_order: number;
  visibility: 'default' | 'private' | 'public';
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type EventDocumentLink = {
  event_id: string;
  document_id: string;
};
