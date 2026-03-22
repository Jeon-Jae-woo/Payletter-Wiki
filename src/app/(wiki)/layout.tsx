import MainLayout from '@/components/layout/MainLayout';

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
