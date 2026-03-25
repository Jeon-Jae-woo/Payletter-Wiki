import { BookOpen, CalendarDays } from 'lucide-react';

type FeatureCard = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const features: FeatureCard[] = [
  {
    icon: <BookOpen size={22} className="text-[#0054FF]" />,
    title: '위키 페이지',
    description:
      '노션 스타일의 에디터로 지식을 자유롭게 정리하세요. 페이지를 중첩하고, 제목을 추가하고, 나만의 개인 지식 베이스를 만들어보세요.',
  },
  {
    icon: <CalendarDays size={22} className="text-[#0054FF]" />,
    title: '캘린더',
    description:
      '일정, 마감일, 스케줄을 노트와 함께 관리하세요. 기획과 문서화를 하나의 통합된 워크스페이스에서 이어갑니다.',
  },
];

export default function WikiHomePage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      {/* Hero */}
      <div className="mb-10">
        <div className="text-5xl mb-5 select-none">📝</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          시작하기
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl">
          LetterWiki에 오신 것을 환영합니다 — 노트, 위키, 캘린더를 한곳에서 관리하는 나만의 워크스페이스입니다. 새 페이지를 작성하거나 아래 기능을 둘러보세요.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((card) => (
          <div
            key={card.title}
            className="flex flex-col gap-3 p-5 rounded-lg border border-border bg-white dark:bg-gray-800 hover:border-[#0054FF] transition-colors cursor-default"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-50 dark:bg-blue-950">
              {card.icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {card.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
