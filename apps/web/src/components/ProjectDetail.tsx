'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, deleteProject, getProject } from '@/lib/api';
import { clearDraft, draftKey } from '@/lib/draft';
import { formatDate } from '@/lib/labels';
import { Project } from '@/lib/types';
import { ConfirmDialog } from './ConfirmDialog';
import { StatusBadge } from './StatusBadge';

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [kind, setKind] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  async function onDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(id);
      clearDraft(draftKey(id));
      router.push('/');
    } catch {
      setDeleteError('Não foi possível excluir o projeto.');
      setDeleting(false);
      setConfirming(false);
    }
  }

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
    <article>
      <Link href="/" className="text-sm text-pine hover:underline">
        Voltar
      </Link>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="font-serif text-4xl tracking-tight">{project.name}</h1>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
        {project.description || 'Sem descrição'}
      </p>

      <dl className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:grid-cols-2 sm:p-6">
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Link</dt>
          <dd className="mt-1 text-sm">
            {project.url ? (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="text-pine hover:underline"
              >
                {project.url}
              </a>
            ) : (
              'Sem link'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Tags</dt>
          <dd className="mt-1 text-sm">
            {project.tags.length > 0 ? project.tags.join(', ') : 'Sem tags'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Criado em</dt>
          <dd className="mt-1 text-sm">{formatDate(project.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">
            Atualizado em
          </dt>
          <dd className="mt-1 text-sm">{formatDate(project.updatedAt)}</dd>
        </div>
      </dl>

      {deleteError ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {deleteError}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/projects/${project.id}/edit`}
          className="rounded-full bg-pine px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-800"
        >
          Editar
        </Link>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
        >
          Excluir
        </button>
      </div>

      {confirming ? (
        <ConfirmDialog
          title="Excluir projeto?"
          description={`O projeto "${project.name}" será removido. Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          pending={deleting}
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </article>
  );
}
