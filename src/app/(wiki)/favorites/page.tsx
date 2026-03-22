'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Star } from 'lucide-react';
import { getFavoriteDocuments } from '@/lib/documents';
import type { Document } from '@/types';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-gray-100">
      <div className="w-5 h-5 bg-gray-200 rounded animate-pulse shrink-0" />
      <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
      <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const { data, error } = await getFavoriteDocuments();
        if (!error && data) {
          setDocuments(data as Document[]);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">즐겨찾기</h1>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
          <Star size={40} className="mb-3 opacity-40" />
          <p className="text-sm">
            즐겨찾기한 문서가 없습니다.{' '}
            <br />
            문서 편집 화면에서 ☆ 아이콘을 클릭해 추가하세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => router.push('/documents/' + doc.id)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left hover:bg-blue-50 hover:text-[#0054FF] transition-colors group"
              >
                {/* Star icon (filled yellow) */}
                <Star
                  size={16}
                  className="shrink-0 fill-yellow-400 text-yellow-400 group-hover:fill-yellow-500 group-hover:text-yellow-500 transition-colors"
                />

                {/* Document icon */}
                {doc.icon ? (
                  <span className="shrink-0 text-[18px] leading-none">{doc.icon}</span>
                ) : (
                  <FileText
                    size={18}
                    className="shrink-0 text-gray-400 group-hover:text-[#0054FF] transition-colors"
                  />
                )}

                <span className="flex-1 truncate text-sm font-medium text-gray-800 group-hover:text-[#0054FF]">
                  {doc.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400 group-hover:text-[#0054FF]/70">
                  {relativeTime(doc.updated_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
