'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, getProject } from '@/lib/api';
import { formatTags } from '@/lib/tags';
import { Project } from '@/lib/types';
import { ProjectForm } from './ProjectForm';

export function EditProject({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [kind, setKind] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setKind('loading');
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

  if (kind === 'loading') {
    return (
      <p className="text-sm text-stone-600" role="status">
        Carregando projeto...
      </p>
    );
  }

  if (kind === 'missing') {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center">
        <p className="font-medium">Projeto não encontrado.</p>
        <Link href="/" className="mt-4 inline-flex text-sm text-pine hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  if (kind === 'error' || !project) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4" role="alert">
        <p className="text-sm text-red-800">Não foi possível carregar o projeto.</p>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          className="mt-3 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-900"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <ProjectForm
      mode="edit"
      projectId={project.id}
      initial={{
        name: project.name,
        description: project.description ?? '',
        url: project.url ?? '',
        status: project.status,
        tags: formatTags(project.tags),
      }}
    />
  );
}
