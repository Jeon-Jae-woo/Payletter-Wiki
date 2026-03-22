import { createSupabaseServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Editor from '@/components/editor/Editor';
import type { Document } from '@/types';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !document) notFound();

  return <Editor document={document as unknown as Document} />;
}
