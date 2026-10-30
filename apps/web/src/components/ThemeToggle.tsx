'use client';

import { useEffect } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { IconMoon, IconSun } from './Icons';

type ThemeName = 'light' | 'dark';

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const choice = localStorage.getItem(THEME_STORAGE_KEY);
      if (choice === 'light' || choice === 'dark') return;
      applyTheme(media.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function toggle() {
    const next: ThemeName =
      document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Alternar tema"
      onClick={toggle}
    >
      <span className="when-light">
        <IconSun />
      </span>
      <span className="when-dark">
        <IconMoon />
      </span>
    </button>
  );
}
