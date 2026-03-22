import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LetterWiki",
  description: "Personal Wiki & Calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <style>{`
          :root { --font-sans: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
          body { font-family: var(--font-sans); }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
