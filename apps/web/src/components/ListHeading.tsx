'use client';

import { useSearchParams } from 'next/navigation';
import { STATUS_NAV_LABELS } from '@/lib/labels';
import { isProjectStatus } from '@/lib/types';

export function ListHeading() {
  const raw = useSearchParams().get('status') ?? '';
  const title = isProjectStatus(raw) ? STATUS_NAV_LABELS[raw] : 'Projetos';

  return (
    <header className="intro">
      <p className="eyebrow">Painel</p>
      <h1 className="title">{title}</h1>
      <p className="lede">Ideias, links e o andamento do que você faz.</p>
    </header>
  );
}
