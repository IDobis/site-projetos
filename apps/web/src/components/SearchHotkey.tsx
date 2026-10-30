'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { withViewTransition } from '@/lib/navigate';

export function SearchHotkey() {
  const router = useRouter();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.key !== '/' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.repeat
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('dialog[open]')) return;

      event.preventDefault();
      const field = document.getElementById('q');
      if (field instanceof HTMLInputElement) {
        field.focus();
        field.select();
        return;
      }
      withViewTransition(() => router.push('/#busca'));
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return null;
}
