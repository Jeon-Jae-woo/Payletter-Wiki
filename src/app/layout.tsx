import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/theme-provider";

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
        {/* Prevent dark mode flash on initial load */}
        <script dangerouslySetInnerHTML={{__html: `
  (function() {
    var theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  })();
`}} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
