export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#0054FF]">LetterWiki</span>
          <p className="mt-1 text-sm text-gray-500">나만의 지식 관리 워크스페이스</p>
        </div>
        {children}
      </div>
    </div>
  );
}
