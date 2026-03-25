'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateEncKey } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      // 기존 사용자에게 enc_key 없으면 자동 생성 (최초 1회)
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.enc_key) {
        const encKey = await generateEncKey();
        await supabase.auth.updateUser({ data: { enc_key: encKey } });
      }
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">로그인</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0054FF] hover:bg-[#0044DD] text-white"
        >
          {loading ? '로그인 중...' : '로그인'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-[#0054FF] hover:underline font-medium">
          회원가입
        </Link>
      </p>
    </div>
  );
}
