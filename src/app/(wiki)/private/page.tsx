'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, EyeOff, Lock } from 'lucide-react';
// Lock icon is used for encrypted-private indicator
import { getPrivateDocuments } from '@/lib/documents';
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

export default function PrivatePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const { data, error } = await getPrivateDocuments();
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
      <div className="flex items-center gap-3 mb-6">
        <EyeOff size={22} className="text-[#0054FF]" />
        <h1 className="text-2xl font-bold text-gray-900">비공개 페이지</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        비공개로 설정된 문서는 검색, 최근 문서, 사이드바 목록에 노출되지 않습니다.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
          <EyeOff size={40} className="mb-3 opacity-30" />
          <p className="text-sm">비공개 문서가 없습니다.</p>
          <p className="text-xs mt-1 text-gray-300">
            문서 편집 화면에서 👁 버튼을 눌러 비공개로 설정하세요.
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
                {/* 아이콘 */}
                <div className="shrink-0">
                  {doc.icon ? (
                    <span className="text-[18px] leading-none">{doc.icon}</span>
                  ) : (
                    <FileText
                      size={18}
                      className="text-gray-400 group-hover:text-[#0054FF] transition-colors"
                    />
                  )}
                </div>

                <span className="flex-1 truncate text-sm font-medium text-gray-800 group-hover:text-[#0054FF]">
                  {doc.title}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Lock size={11} className="text-[#0054FF] opacity-60" />
                  <span className="text-xs text-gray-400 group-hover:text-[#0054FF]/70">
                    {relativeTime(doc.updated_at)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
