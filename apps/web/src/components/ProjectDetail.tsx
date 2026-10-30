'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApiError, deleteProject, getProject } from '@/lib/api';
import { clearDraft, draftKey } from '@/lib/draft';
import { formatDate } from '@/lib/labels';
import { optimisticRemove, revertRemove, useLiveProject } from '@/lib/live';
import { withViewTransition } from '@/lib/navigate';
import { Project } from '@/lib/types';
import { ProjectLink, TagList } from './ProjectBits';
import { ConfirmDialog } from './ConfirmDialog';
import { DetailSkeleton, EmptyState, ErrorState } from './States';
import { StatusBadge } from './StatusBadge';
import { toast } from './Toaster';
import { TransitionLink } from './TransitionLink';

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const live = useLiveProject(id);
  const [project, setProject] = useState<Project | null>(null);
  const [kind, setKind] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [confirming, setConfirming] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (live?.phase === 'pending') return;
    let cancelled = false;
    getProject(id)
      .then((data) => {
        if (cancelled) return;
        setProject(data);
        setKind('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          if (!live) setKind('missing');
          return;
        }
        if (!live) setKind('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey, live]);

  const shown = live?.project ?? project;

  async function onDelete() {
    if (!shown) return;
    const snapshot = shown;
    setConfirming(false);
    optimisticRemove(snapshot);
    toast('Projeto excluído.');
    withViewTransition(() => router.push('/'));
    try {
      await deleteProject(id);
      clearDraft(draftKey(id));
    } catch {
      revertRemove(id);
      toast('Não foi possível excluir.');
    }
  }

  if (!shown && kind === 'loading') {
    return (
      <>
        <p className="sr-only" role="status">
          Carregando projeto
        </p>
        <DetailSkeleton />
      </>
    );
  }

  if (!shown && kind === 'missing') {
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

  if (!shown) {
    return (
      <ErrorState
        title="Não foi possível carregar"
        description="O projeto não chegou. Tente de novo."
        onRetry={() => setReloadKey((current) => current + 1)}
      />
    );
  }

  return (
    <article>
      <TransitionLink href="/" className="back">
        Voltar
      </TransitionLink>
      <div className="title-row">
        <h1 className="title">{shown.name}</h1>
        <StatusBadge status={shown.status} />
      </div>
      <p className="prose">{shown.description || 'Sem descrição'}</p>

      <div className="card meta-wrap">
        <dl className="meta">
          <div>
            <dt>Link</dt>
            <dd>
              <ProjectLink url={shown.url} />
            </dd>
          </div>
          <div>
            <dt>Tags</dt>
            <dd>
              <TagList tags={shown.tags} />
            </dd>
          </div>
          <div>
            <dt>Criado em</dt>
            <dd>
              <time className="num" dateTime={shown.createdAt}>
                {formatDate(shown.createdAt)}
              </time>
            </dd>
          </div>
          <div>
            <dt>Atualizado em</dt>
            <dd>
              <time className="num" dateTime={shown.updatedAt}>
                {formatDate(shown.updatedAt)}
              </time>
            </dd>
          </div>
        </dl>
      </div>

      <div className="actions inline start">
        <TransitionLink href={`/projects/${shown.id}/edit`} className="btn btn-primary">
          Editar
        </TransitionLink>
        <button
          type="button"
          className="btn btn-danger"
          aria-haspopup="dialog"
          onClick={() => setConfirming(true)}
        >
          Excluir
        </button>
      </div>

      {confirming ? (
        <ConfirmDialog
          title="Excluir projeto?"
          description={`O projeto ${shown.name} será removido. Essa ação não tem volta.`}
          confirmLabel="Excluir"
          onCancel={() => setConfirming(false)}
          onConfirm={onDelete}
        />
      ) : null}
    </article>
  );
}
