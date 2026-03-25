import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ShareView from '@/components/share/ShareView';
import type { Document } from '@/types';
import type { Database } from '@/types/database';

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Use anon client — no session needed. RLS policy allows reading public docs.
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('visibility', 'public')
    .single();

  if (error || !document) notFound();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[#0054FF] hover:opacity-80 transition-opacity"
        >
          <span className="text-base">✦</span>
          LetterWiki
        </a>
        <span className="text-xs text-gray-400">공유된 문서</span>
      </header>

      {/* Document */}
      <main>
        <ShareView document={document as unknown as Document} />
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-8 py-8 mt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          <a
            href="/"
            className="text-[#0054FF] hover:underline"
          >
            LetterWiki
          </a>
          로 만든 문서입니다.
        </p>
      </footer>
    </div>
  );
}
