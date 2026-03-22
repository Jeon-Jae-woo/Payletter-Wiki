import type { Document, CalendarEvent, EventDocumentLink } from './index';

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: Document;
        Insert: {
          id?: string;
          user_id: string;
          parent_id?: string | null;
          title?: string;
          content?: Record<string, unknown> | null;
          icon?: string | null;
          cover_url?: string | null;
          is_favorite?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Document, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_at: string;
          end_at?: string | null;
          all_day?: boolean;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      event_document_links: {
        Row: EventDocumentLink;
        Insert: EventDocumentLink;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
