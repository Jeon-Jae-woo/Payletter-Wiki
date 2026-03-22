'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import SearchModal from '@/components/search/SearchModal';
import { MoreHorizontal, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left sidebar */}
      <Sidebar />

      {/* Right: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-white shrink-0">
          {/* Breadcrumb area */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="text-gray-400">LetterWiki</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium">시작하기</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="검색"
            >
              <Search size={16} />
            </button>
            <button className="px-3 py-1 text-sm font-medium rounded-md border border-border text-gray-600 hover:bg-gray-50 transition-colors">
              공유
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="로그아웃"
            >
              <LogOut size={16} />
            </button>
            <button
              className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="더 보기"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
