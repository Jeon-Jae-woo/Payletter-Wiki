'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { PageLinkNode } from '@/components/editor/PageLinkNode';
import { ImageBlockNode } from '@/components/editor/ImageBlockNode';
import type { Document } from '@/types';

type Props = {
  document: Document;
};

function isGradient(value: string): boolean {
  return value.startsWith('linear-gradient');
}

export default function ShareView({ document }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      PageLinkNode,
      ImageBlockNode,
    ],
    content: (document.content as Record<string, unknown>) ?? '',
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none focus:outline-none',
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover */}
      {document.cover_url && (
        <div className="w-full h-40 rounded-t-lg overflow-hidden mb-0">
          {isGradient(document.cover_url) ? (
            <div className="w-full h-full" style={{ background: document.cover_url }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={document.cover_url} alt="cover" className="w-full h-40 object-cover" />
          )}
        </div>
      )}

      <div className="px-8 py-10">
        {/* Icon */}
        {document.icon && (
          <div className="text-5xl mb-3 select-none">{document.icon}</div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {document.title || '제목 없음'}
        </h1>

        {/* Content */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
