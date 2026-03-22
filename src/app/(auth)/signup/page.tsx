'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateEncKey } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      if (error.message === 'User already registered') {
        setError('이미 가입된 이메일입니다.');
      } else if (error.status === 429) {
        setError('잠시 후 다시 시도해주세요. (이메일 발송 한도 초과)');
      } else {
        setError(`회원가입 실패: ${error.message}`);
      }
    } else if (data.session) {
      // 이메일 확인 OFF 상태 — 즉시 세션 발급됨
      // 비공개 문서 암호화 키 자동 생성 (사용자에게 노출되지 않음)
      if (!data.user?.user_metadata?.enc_key) {
        const encKey = await generateEncKey();
        await supabase.auth.updateUser({ data: { enc_key: encKey } });
      }
      router.push('/');
      router.refresh();
    } else {
      // 이메일 확인 ON 상태 — 인증 메일 발송
      setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl border border-border p-8 shadow-sm text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">이메일을 확인해주세요</h2>
        <p className="text-sm text-gray-500">
          {email}으로 인증 링크를 보냈습니다.
          <br />링크를 클릭하면 로그인됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">회원가입</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">이메일</label>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">비밀번호</label>
          <Input type="password" placeholder="6자 이상" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full bg-[#0054FF] hover:bg-[#0044DD] text-white">
          {loading ? '처리 중...' : '회원가입'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-[#0054FF] hover:underline font-medium">
          로그인
        </Link>
      </p>
    </div>
  );
}
