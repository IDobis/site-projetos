import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import { Header } from '@/components/Header';
import { SearchHotkey } from '@/components/SearchHotkey';
import { Toaster } from '@/components/Toaster';
import { themeBootScript } from '@/lib/theme';
import './globals.css';

const sans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: { default: 'Projetos', template: '%s · Projetos' },
  description: 'Guarde e acompanhe os seus projetos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="page font-sans antialiased">
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <Header />
        <main id="conteudo" tabIndex={-1} className="shell stack pb-16 pt-8 md:pt-12">
          {children}
        </main>
        <Toaster />
        <SearchHotkey />
      </body>
    </html>
  );
}
