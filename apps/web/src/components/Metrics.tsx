'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { getCounts, subscribeCounts } from '@/lib/counts';
import { STATUS_NAV_LABELS } from '@/lib/labels';
import { withViewTransition } from '@/lib/navigate';
import { isProjectStatus, PROJECT_STATUSES, ProjectStatus } from '@/lib/types';

const ITEMS: { status: '' | ProjectStatus; label: string }[] = [
  { status: '', label: 'Total' },
  ...PROJECT_STATUSES.map((status) => ({
    status,
    label: STATUS_NAV_LABELS[status],
  })),
];

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

export function Metrics() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const counts = useSyncExternalStore(subscribeCounts, getCounts, () => null);
  const raw = searchParams.get('status') ?? '';
  const active = isProjectStatus(raw) ? raw : '';

  return (
    <div className="metrics" aria-label="Resumo">
      {ITEMS.map((item) => {
        const href = filterHref(item.status, searchParams);
        const current = active === item.status;
        const value =
          counts == null ? null : item.status === '' ? counts.total : counts[item.status];
        return (
          <a
            key={item.label}
            href={href}
            className="metric"
            aria-current={current ? 'page' : undefined}
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
            <span className="metric-label">{item.label}</span>
            {value == null ? (
              <span className="skeleton skeleton-block" />
            ) : (
              <span className="metric-value num">{value}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}
