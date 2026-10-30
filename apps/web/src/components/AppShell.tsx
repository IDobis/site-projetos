'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { refreshCounts, subscribeCounts, getCounts } from '@/lib/counts';
import { STATUS_NAV_LABELS } from '@/lib/labels';
import { useLiveVersion } from '@/lib/live';
import { withViewTransition } from '@/lib/navigate';
import { SIDEBAR_STORAGE_KEY } from '@/lib/theme';
import { isProjectStatus, ProjectStatus } from '@/lib/types';
import {
  IconClose,
  IconDone,
  IconGrid,
  IconIdea,
  IconMenu,
  IconPanel,
  IconPaused,
  IconPlus,
  IconProgress,
} from './Icons';
import { ThemeToggle } from './ThemeToggle';
import { TransitionLink } from './TransitionLink';

type SidebarMode = 'expanded' | 'collapsed';

const SIDEBAR_EVENT = 'projetos-sidebar';

const NAV: {
  status: '' | ProjectStatus;
  label: string;
  icon: () => React.ReactNode;
}[] = [
  { status: '', label: 'Projetos', icon: IconGrid },
  { status: 'idea', label: STATUS_NAV_LABELS.idea, icon: IconIdea },
  { status: 'in_progress', label: STATUS_NAV_LABELS.in_progress, icon: IconProgress },
  { status: 'paused', label: STATUS_NAV_LABELS.paused, icon: IconPaused },
  { status: 'done', label: STATUS_NAV_LABELS.done, icon: IconDone },
];

function subscribeSidebar(listener: () => void) {
  window.addEventListener(SIDEBAR_EVENT, listener);
  return () => window.removeEventListener(SIDEBAR_EVENT, listener);
}

function readSidebar(): SidebarMode {
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed'
    ? 'collapsed'
    : 'expanded';
}

function writeSidebar(mode: SidebarMode) {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, mode);
  document.documentElement.dataset.sidebar = mode;
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
}

function filterHref(status: string, searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const q = searchParams.get('q')?.trim();
  const tag = searchParams.get('tag')?.trim();
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);
  if (status) params.set('status', status);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const liveVersion = useLiveVersion();
  const mode = useSyncExternalStore<SidebarMode>(
    subscribeSidebar,
    readSidebar,
    () => 'expanded',
  );

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname, searchKey]);

  useEffect(() => {
    refreshCounts().catch(() => undefined);
  }, [liveVersion]);

  function toggleSidebar() {
    writeSidebar(mode === 'collapsed' ? 'expanded' : 'collapsed');
  }

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Navegação">
        <SidebarBrand mode={mode} onToggle={toggleSidebar} />
        <MenuLinks />
        <SidebarFoot />
      </aside>
      <div className="content-shift">
        <header className="mobile-bar">
          <button
            type="button"
            className="icon-btn"
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="menu-movel"
            onClick={() => {
              setOpen(true);
              dialogRef.current?.showModal();
            }}
          >
            <IconMenu />
          </button>
          <TransitionLink href="/" className="wordmark">
            Projetos
          </TransitionLink>
        </header>
        {children}
      </div>
      <dialog
        ref={dialogRef}
        id="menu-movel"
        className="drawer"
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="drawer-head">
          <p className="wordmark">Projetos</p>
          <button
            type="button"
            className="icon-btn"
            aria-label="Fechar menu"
            onClick={() => dialogRef.current?.close()}
          >
            <IconClose />
          </button>
        </div>
        <MenuLinks />
        <SidebarFoot />
      </dialog>
    </div>
  );
}

function SidebarBrand({ mode, onToggle }: { mode: SidebarMode; onToggle: () => void }) {
  const collapsed = mode === 'collapsed';
  return (
    <div className="sidebar-brand">
      <TransitionLink href="/" className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          P
        </span>
        <span className="brand-name">Projetos</span>
      </TransitionLink>
      <button
        type="button"
        className="icon-btn sidebar-toggle"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        aria-pressed={collapsed}
        onClick={onToggle}
      >
        <IconPanel />
      </button>
    </div>
  );
}

function MenuLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get('status') ?? '';
  const active = isProjectStatus(raw) ? raw : '';
  const counts = useSyncExternalStore(subscribeCounts, getCounts, () => null);

  return (
    <nav className="side-nav">
      <ul>
        {NAV.map((item) => {
          const href = filterHref(item.status, searchParams);
          const current = pathname === '/' && active === item.status;
          const count =
            counts == null
              ? null
              : item.status === ''
                ? counts.total
                : counts[item.status];
          const Icon = item.icon;
          return (
            <li key={item.status || 'all'}>
              <a
                href={href}
                className="nav-link"
                aria-current={current ? 'page' : undefined}
                title={item.label}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  withViewTransition(() => router.replace(href, { scroll: false }));
                }}
              >
                <Icon />
                <span className="nav-label">{item.label}</span>
                <span className="nav-count num">{count == null ? '' : count}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFoot() {
  const pathname = usePathname();
  return (
    <div className="sidebar-foot">
      <div className="sidebar-theme">
        <ThemeToggle />
        <span className="theme-label">Tema</span>
      </div>
      <TransitionLink
        href="/projects/new"
        className="btn btn-primary sidebar-new"
        aria-current={pathname === '/projects/new' ? 'page' : undefined}
        title="Novo projeto"
      >
        <IconPlus />
        <span className="btn-label">Novo projeto</span>
      </TransitionLink>
    </div>
  );
}
