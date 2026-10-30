import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import { AppShell } from '@/components/AppShell';
import { SearchHotkey } from '@/components/SearchHotkey';
import { Toaster } from '@/components/Toaster';
import { themeBootScript } from '@/lib/theme';
import './globals.css';

const satoshi = localFont({
  src: '../fonts/Satoshi-Variable.woff2',
  display: 'swap',
  weight: '400 700',
  style: 'normal',
  variable: '--font-sans',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  title: { default: 'Projetos', template: '%s · Projetos' },
  description: 'Guarde e acompanhe os seus projetos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={satoshi.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${satoshi.className} page antialiased`}>
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <Suspense>
          <AppShell>
            <main id="conteudo" tabIndex={-1} className="shell stack content-main">
              {children}
            </main>
          </AppShell>
        </Suspense>
        <Toaster />
        <SearchHotkey />
      </body>
    </html>
  );
}
