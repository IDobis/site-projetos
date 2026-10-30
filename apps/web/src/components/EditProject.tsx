'use client';

import { useEffect, useState } from 'react';
import { ApiError, getProject } from '@/lib/api';
import { useLiveProject } from '@/lib/live';
import { formatTags } from '@/lib/tags';
import { Project } from '@/lib/types';
import { ProjectForm } from './ProjectForm';
import { EmptyState, ErrorState, FormSkeleton } from './States';
import { TransitionLink } from './TransitionLink';

export function EditProject({ id }: { id: string }) {
  const live = useLiveProject(id);
  const [project, setProject] = useState<Project | null>(null);
  const [kind, setKind] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getProject(id)
      .then((data) => {
        if (cancelled) return;
        setProject(data);
        setKind('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) setKind('missing');
        else setKind('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const shown = live?.project ?? project;

  if (kind === 'missing') {
    return (
      <EmptyState
        title="Projeto não encontrado"
        description="Ele não está mais na lista."
      >
        <TransitionLink href="/" className="btn btn-ghost">
          Voltar para a lista
        </TransitionLink>
      </EmptyState>
    );
  }

  if (!shown && kind === 'error') {
    return (
      <ErrorState
        title="Não foi possível carregar"
        description="O projeto não chegou. Tente de novo."
        onRetry={() => setReloadKey((current) => current + 1)}
      />
    );
  }

  if (!shown) {
    return (
      <>
        <p className="sr-only" role="status">
          Carregando projeto
        </p>
        <FormSkeleton />
      </>
    );
  }

  return (
    <ProjectForm
      mode="edit"
      project={shown}
      initial={{
        name: shown.name,
        description: shown.description ?? '',
        url: shown.url ?? '',
        status: shown.status,
        tags: formatTags(shown.tags),
      }}
    />
  );
}
