'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  House,
  Clock,
  Star,
  Search,
  Plus,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Lock,
  CheckSquare,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { getRootDocuments, createDocument, getChildDocuments, getPrivateDocuments } from '@/lib/documents';
import type { Document } from '@/types';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const workspaceNav: NavItem[] = [
  { label: '홈', icon: <House size={16} />, href: '/' },
  { label: '최근 문서', icon: <Clock size={16} />, href: '/recent' },
  { label: '즐겨찾기', icon: <Star size={16} />, href: '/favorites' },
  { label: '검색', icon: <Search size={16} />, href: '/search' },
  { label: '캘린더', icon: <CalendarDays size={16} />, href: '/calendar' },
  { label: '할 일', icon: <CheckSquare size={16} />, href: '/todo' },
];

function DocRow({
  doc,
  userId,
  onCreateChild,
  depth = 0,
}: {
  doc: Document;
  userId: string | null;
  onCreateChild: (parentId: string) => void;
  depth?: number;
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [children, setChildren] = useState<Document[] | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // 이 문서의 하위에 새 문서가 생성되면 children에 추가하고 펼치기
  useEffect(() => {
    function handleChildCreated(e: Event) {
      const { parentId, doc: newDoc } = (e as CustomEvent<{ parentId: string; doc: Document }>).detail;
      if (parentId !== doc.id) return;
      setChildren((prev) => (prev === null ? [newDoc] : [...prev, newDoc]));
      setIsExpanded(true);
    }
    window.addEventListener('child-document-created', handleChildCreated);
    return () => window.removeEventListener('child-document-created', handleChildCreated);
  }, [doc.id]);

  // Cap indent: depth 0 → pl-0, depth 1 → pl-3, depth 2+ → pl-6
  const paddingLeft = depth === 0 ? 0 : depth === 1 ? 12 : 24;

  async function handleChevronClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (isExpanded) {
      // Just collapse
      setIsExpanded(false);
      return;
    }

    if (children === null) {
      // Need to fetch
      setLoadingChildren(true);
      try {
        const { data, error } = await getChildDocuments(doc.id);
        if (!error && data) {
          setChildren(data as Document[]);
        } else {
          setChildren([]);
        }
      } catch {
        setChildren([]);
      } finally {
        setLoadingChildren(false);
      }
    }

    // Expand (whether freshly fetched or already cached)
    setIsExpanded(true);
  }

  async function handleCreateChildHere(e: React.MouseEvent) {
    e.stopPropagation();
    onCreateChild(doc.id);
  }

  // Hide chevron only if we've fetched and there are no children
  const showChevron = children === null || children.length > 0;

  return (
    <li>
      <div
        className="group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-blue-50 hover:text-[#0054FF] transition-colors cursor-pointer"
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => router.push('/documents/' + doc.id)}
      >
        {/* Expand/Collapse chevron */}
        {showChevron ? (
          <button
            onClick={handleChevronClick}
            className="shrink-0 flex items-center justify-center w-4 h-4 rounded hover:bg-blue-100 transition-colors text-gray-400 hover:text-[#0054FF]"
            aria-label={isExpanded ? '접기' : '펼치기'}
            disabled={loadingChildren}
          >
            {loadingChildren ? (
              <span className="block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        ) : (
          <span className="shrink-0 w-4 h-4" />
        )}

        {/* Icon */}
        {doc.icon ? (
          <span className="shrink-0 text-[14px] leading-none">{doc.icon}</span>
        ) : (
          <FileText size={15} className="shrink-0 text-gray-400 group-hover:text-[#0054FF]" />
        )}

        {/* Title */}
        <span className="flex-1 truncate overflow-hidden">{doc.title}</span>

        {/* Add child button — visible on hover */}
        {isHovered && (
          <button
            onClick={handleCreateChildHere}
            className="shrink-0 flex items-center justify-center w-5 h-5 rounded hover:bg-blue-100 transition-colors text-gray-400 hover:text-[#0054FF]"
            aria-label="하위 페이지 추가"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* Nested children */}
      {isExpanded && children && children.length > 0 && (
        <ul className="space-y-0.5">
          {children.map((child) => (
            <DocRow
              key={child.id}
              doc={child}
              userId={userId}
              onCreateChild={onCreateChild}
              depth={Math.min(depth + 1, 2)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <li key={i} className="px-2 py-1.5">
          <div className="h-4 animate-pulse bg-gray-200 rounded w-full" />
        </li>
      ))}
    </>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [privateDocuments, setPrivateDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPrivate, setShowPrivate] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!user) {
          setUserId(null);
          setDocuments([]);
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        const [{ data, error }, { data: privData }] = await Promise.all([
          getRootDocuments(),
          getPrivateDocuments(),
        ]);
        if (cancelled) return;

        if (!error && data) setDocuments(data as Document[]);
        if (privData) setPrivateDocuments(privData as Document[]);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // 에디터에서 제목 변경 시 사이드바 실시간 반영
  useEffect(() => {
    function handleTitleChange(e: Event) {
      const { id, title } = (e as CustomEvent<{ id: string; title: string }>).detail;
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, title } : doc))
      );
      setPrivateDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, title } : doc))
      );
    }
    window.addEventListener('document-title-changed', handleTitleChange);
    return () => window.removeEventListener('document-title-changed', handleTitleChange);
  }, []);

  // 에디터에서 아이콘 변경 시 사이드바 실시간 반영
  useEffect(() => {
    function handleIconChange(e: Event) {
      const { id, icon } = (e as CustomEvent<{ id: string; icon: string | null }>).detail;
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, icon } : doc))
      );
      setPrivateDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? { ...doc, icon } : doc))
      );
    }
    window.addEventListener('document-icon-changed', handleIconChange);
    return () => window.removeEventListener('document-icon-changed', handleIconChange);
  }, []);

  // 에디터에서 visibility 변경 시 사이드바 섹션 간 이동
  useEffect(() => {
    function handleVisibilityChange(e: Event) {
      const { id, visibility, doc } = (e as CustomEvent<{
        id: string;
        visibility: 'default' | 'private' | 'public';
        doc: Document;
      }>).detail;

      if (visibility === 'private') {
        // 일반 목록 → 비공개 목록으로 이동
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setPrivateDocuments((prev) =>
          prev.some((d) => d.id === id) ? prev : [doc, ...prev]
        );
      } else {
        // 비공개 목록 → 일반 목록으로 이동
        setPrivateDocuments((prev) => prev.filter((d) => d.id !== id));
        setDocuments((prev) =>
          prev.some((d) => d.id === id) ? prev : [doc, ...prev]
        );
      }
    }
    window.addEventListener('document-visibility-changed', handleVisibilityChange);
    return () => window.removeEventListener('document-visibility-changed', handleVisibilityChange);
  }, []);

  async function handleCreateRootDocument() {
    if (!userId || isCreating) return;
    setIsCreating(true);
    try {
      const { data, error } = await createDocument({
        user_id: userId,
        title: '제목 없음',
      });
      if (!error && data) {
        const newDoc = data as Document;
        setDocuments((prev) => [...prev, newDoc]);
        router.push('/documents/' + newDoc.id);
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateChildDocument(parentId: string) {
    if (!userId || isCreating) return;
    setIsCreating(true);
    try {
      const { data, error } = await createDocument({
        user_id: userId,
        title: '제목 없음',
        parent_id: parentId,
      });
      if (!error && data) {
        const newDoc = data as Document;
        window.dispatchEvent(new CustomEvent('child-document-created', { detail: { parentId, doc: newDoc } }));
        router.push('/documents/' + newDoc.id);
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreatePrivateDocument() {
    if (!userId || isCreating) return;
    setIsCreating(true);
    try {
      const { data, error } = await createDocument({
        user_id: userId,
        title: '제목 없음',
        visibility: 'private',
      });
      if (!error && data) {
        const newDoc = data as Document;
        setPrivateDocuments((prev) => [...prev, newDoc]);
        router.push('/documents/' + newDoc.id);
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleCreateChildPrivateDocument(parentId: string) {
    if (!userId || isCreating) return;
    setIsCreating(true);
    try {
      const { data, error } = await createDocument({
        user_id: userId,
        title: '제목 없음',
        parent_id: parentId,
        visibility: 'private',
      });
      if (!error && data) {
        const newDoc = data as Document;
        window.dispatchEvent(new CustomEvent('child-document-created', { detail: { parentId, doc: newDoc } }));
        router.push('/documents/' + newDoc.id);
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div
      className="relative flex flex-col h-full bg-[#F7F7F7] border-r border-border transition-all duration-200 shrink-0"
      style={{ width: isCollapsed ? 0 : 240 }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="absolute -right-3 top-4 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-border shadow-sm hover:bg-blue-50 hover:text-[#0054FF] transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Inner content hidden when collapsed */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 150ms',
          pointerEvents: isCollapsed ? 'none' : 'auto',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-12 shrink-0">
          <span className="text-[#0054FF] font-bold text-lg tracking-tight select-none">
            LetterWiki
          </span>
        </div>

        <Separator />

        {/* Workspace Navigation */}
        <nav className="px-2 pt-3 pb-1 shrink-0">
          <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            워크스페이스
          </p>
          <ul className="space-y-0.5">
            {workspaceNav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-blue-50 hover:text-[#0054FF] transition-colors"
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Separator className="my-2" />

        {/* 페이지 + 비공개 — 하나의 ScrollArea */}
        <div className="flex flex-col flex-1 min-h-0 px-2">
          <ScrollArea className="flex-1">
            {/* 공개 페이지 섹션 */}
            <div className="mb-1">
              <div className="flex items-center justify-between px-2 mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  페이지
                </p>
                <button
                  onClick={handleCreateRootDocument}
                  disabled={isCreating || !userId}
                  className="flex items-center justify-center w-5 h-5 rounded hover:bg-blue-50 hover:text-[#0054FF] text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="새 페이지"
                >
                  <Plus size={14} />
                </button>
              </div>

              <ul className="space-y-0.5 pr-1">
                {isLoading ? (
                  <SkeletonRows />
                ) : documents.length === 0 ? (
                  <li className="px-2 py-2 text-center">
                    <p className="text-xs text-gray-400">페이지가 없습니다</p>
                    <button
                      onClick={handleCreateRootDocument}
                      disabled={isCreating || !userId}
                      className="mt-1 text-xs text-[#0054FF] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      첫 페이지를 만들어보세요
                    </button>
                  </li>
                ) : (
                  documents.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      userId={userId}
                      onCreateChild={handleCreateChildDocument}
                      depth={0}
                    />
                  ))
                )}
              </ul>

              <button
                onClick={handleCreateRootDocument}
                disabled={isCreating || !userId}
                className="flex items-center gap-2 w-full px-2 py-1.5 mt-0.5 rounded-md text-sm text-gray-500 hover:bg-blue-50 hover:text-[#0054FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={15} className="shrink-0" />
                <span>새 페이지</span>
              </button>
            </div>

            <Separator className="my-2" />

            {/* 비공개 페이지 섹션 */}
            <div className="mb-1">
              <div className="flex items-center justify-between px-2 mb-1">
                <button
                  onClick={() => setShowPrivate((v) => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Lock size={10} />
                  비공개
                  <ChevronDown
                    size={10}
                    className={`transition-transform ${showPrivate ? '' : '-rotate-90'}`}
                  />
                </button>
                <button
                  onClick={handleCreatePrivateDocument}
                  disabled={isCreating || !userId}
                  className="flex items-center justify-center w-5 h-5 rounded hover:bg-blue-50 hover:text-[#0054FF] text-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="새 비공개 페이지"
                >
                  <Plus size={14} />
                </button>
              </div>

              {showPrivate && (
                <>
                  <ul className="space-y-0.5 pr-1">
                    {isLoading ? (
                      <SkeletonRows />
                    ) : privateDocuments.length === 0 ? (
                      <li className="px-2 py-2 text-center">
                        <p className="text-xs text-gray-400">비공개 페이지가 없습니다</p>
                        <button
                          onClick={handleCreatePrivateDocument}
                          disabled={isCreating || !userId}
                          className="mt-1 text-xs text-[#0054FF] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          비공개 페이지를 만들어보세요
                        </button>
                      </li>
                    ) : (
                      privateDocuments.map((doc) => (
                        <DocRow
                          key={doc.id}
                          doc={doc}
                          userId={userId}
                          onCreateChild={handleCreateChildPrivateDocument}
                          depth={0}
                        />
                      ))
                    )}
                  </ul>

                  <button
                    onClick={handleCreatePrivateDocument}
                    disabled={isCreating || !userId}
                    className="flex items-center gap-2 w-full px-2 py-1.5 mt-0.5 rounded-md text-sm text-gray-500 hover:bg-blue-50 hover:text-[#0054FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={15} className="shrink-0" />
                    <span>새 비공개 페이지</span>
                  </button>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Bottom: Settings */}
        <div className="px-2 py-2 shrink-0">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-gray-500 hover:bg-blue-50 hover:text-[#0054FF] transition-colors"
          >
            <Settings size={16} className="shrink-0" />
            <span>설정</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
