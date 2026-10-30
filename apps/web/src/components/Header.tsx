'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { TransitionLink } from './TransitionLink';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell header-bar">
        <TransitionLink
          href="/"
          className="wordmark"
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          Projetos
        </TransitionLink>
        <div className="header-actions">
          <ThemeToggle />
          <TransitionLink
            href="/projects/new"
            className="btn btn-primary"
            aria-current={pathname === '/projects/new' ? 'page' : undefined}
          >
            <span className="label-short">Novo</span>
            <span className="label-long">Novo projeto</span>
          </TransitionLink>
        </div>
      </div>
    </header>
  );
}
