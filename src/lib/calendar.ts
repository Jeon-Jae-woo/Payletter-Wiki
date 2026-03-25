import { supabase } from './supabase';
import type { CalendarEvent } from '@/types';

// Get events for a month range
export async function getEventsForMonth(year: number, month: number) {
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59).toISOString();
  return supabase
    .from('calendar_events')
    .select('*')
    .gte('start_at', start)
    .lte('start_at', end)
    .order('start_at', { ascending: true });
}

// Create an event and optionally link documents
export async function createEvent(
  data: {
    user_id: string;
    title: string;
    description?: string;
    start_at: string;
    end_at?: string;
    all_day?: boolean;
    color?: string;
    priority?: 'high' | 'medium' | 'low';
  },
  documentIds: string[] = []
) {
  const { data: rawEvent, error } = await supabase
    .from('calendar_events')
    .insert(data)
    .select()
    .single();
  if (error || !rawEvent) return { data: null, error };
  const event = rawEvent as CalendarEvent;

  if (documentIds.length > 0) {
    await supabase.from('event_document_links').insert(
      documentIds.map((document_id) => ({ event_id: event.id, document_id }))
    );
  }
  return { data: event, error: null };
}

// Update an event and replace linked documents
export async function updateEvent(
  id: string,
  data: {
    title?: string;
    description?: string;
    start_at?: string;
    end_at?: string;
    all_day?: boolean;
    color?: string;
    priority?: 'high' | 'medium' | 'low';
  },
  documentIds: string[] = []
) {
  const { data: rawEvent, error } = await supabase
    .from('calendar_events')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error || !rawEvent) return { data: null, error };

  // Replace all linked documents
  await supabase.from('event_document_links').delete().eq('event_id', id);
  if (documentIds.length > 0) {
    await supabase.from('event_document_links').insert(
      documentIds.map((document_id) => ({ event_id: id, document_id }))
    );
  }
  return { data: rawEvent as CalendarEvent, error: null };
}

// Delete an event
export async function deleteEvent(id: string) {
  return supabase.from('calendar_events').delete().eq('id', id);
}

// Get linked documents for an event
export async function getEventDocuments(eventId: string) {
  return supabase
    .from('event_document_links')
    .select('document_id, documents(id, title, icon)')
    .eq('event_id', eventId);
}
