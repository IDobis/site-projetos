'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { FormEvent, useEffect, useState } from 'react';
import { listProjects } from '@/lib/api';
import { formatDate, STATUS_LABELS } from '@/lib/labels';
import { applyLive, reconcileLive, useLiveVersion } from '@/lib/live';
import { PROJECT_STATUSES, Project, ProjectList as ProjectPage } from '@/lib/types';
import { ProjectLink, TagList } from './ProjectBits';
import { EmptyState, ErrorState, ListSkeleton } from './States';
import { StatusBadge } from './StatusBadge';
import { TransitionLink } from './TransitionLink';

const PAGE_SIZE = 20;

type Memory = { key: string; data: ProjectPage };
let memory: Memory | null = null;
const memoryListeners = new Set<() => void>();

function rememberList(key: string, data: ProjectPage) {
  memory = { key, data };
  memoryListeners.forEach((listener) => listener());
}

function subscribeMemory(listener: () => void) {
  memoryListeners.add(listener);
  return () => memoryListeners.delete(listener);
}

export function ProjectList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const page = positivePage(searchParams.get('page'));
  const cacheKey = `${q}\n${status}\n${tag}\n${page}`;
  const [qInput, setQInput] = useState(q);
  const [trackedQ, setTrackedQ] = useState(q);
  if (q !== trackedQ) {
    setTrackedQ(q);
    setQInput(q);
  }
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState(false);
  const [errorKey, setErrorKey] = useState(cacheKey);
  if (errorKey !== cacheKey) {
    setErrorKey(cacheKey);
    setError(false);
  }
  const data = useSyncExternalStore(
    subscribeMemory,
    () => (memory?.key === cacheKey ? memory.data : null),
    () => null,
  );
  const liveVersion = useLiveVersion();

  useEffect(() => {
    if (window.location.hash !== '#busca') return;
    document.getElementById('q')?.focus();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (qInput.trim() === q.trim()) return;
      replaceQuery(router, { q: qInput, status, tag, page: 1 });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [qInput, q, status, tag, router]);

  useEffect(() => {
    let cancelled = false;
    listProjects({
      q,
      tag: tag || undefined,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (cancelled) return;
        rememberList(cacheKey, result);
      })
      .catch(() => {
        if (cancelled || memory?.key === cacheKey) return;
        setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, q, tag, status, page, reloadKey]);

  useEffect(() => {
    if (data) reconcileLive(data.items);
  }, [data]);

  const view =
    data && liveVersion >= 0 ? { ...data, ...applyLive(data.items, data.total) } : null;

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceQuery(router, { q: qInput, status, tag, page: 1 });
  }

  function onTag(nextTag: string) {
    replaceQuery(router, { q, status, tag: nextTag === tag ? '' : nextTag, page: 1 });
  }

  const filtered = q.trim().length > 0 || status.length > 0 || tag.length > 0;
  const statusValue = PROJECT_STATUSES.includes(
    status as (typeof PROJECT_STATUSES)[number],
  )
    ? status
    : '';

  return (
    <>
      <form id="busca" role="search" className="toolbar" onSubmit={onSearchSubmit}>
        <div className="field">
          <label htmlFor="q" className="field-label">
            Busca
          </label>
          <div className="search">
            <input
              id="q"
              name="q"
              value={qInput}
              placeholder="Nome ou tag"
              autoComplete="off"
              aria-keyshortcuts="/"
              onChange={(event) => setQInput(event.target.value)}
            />
            <kbd aria-hidden="true">/</kbd>
          </div>
        </div>
        <div className="field">
          <label htmlFor="status" className="field-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={statusValue}
            onChange={(event) =>
              replaceQuery(router, {
                q: qInput,
                status: event.target.value,
                tag,
                page: 1,
              })
            }
            className="control select"
          >
            <option value="">Todos</option>
            {PROJECT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
      </form>

      {tag ? (
        <div className="filters">
          <button
            type="button"
            className="chip"
            aria-pressed="true"
            onClick={() => replaceQuery(router, { q, status, tag: '', page: 1 })}
          >
            {tag}
            <span aria-hidden="true">×</span>
            <span className="sr-only">Remover tag</span>
          </button>
        </div>
      ) : null}

      {!data && !error ? (
        <>
          <p className="sr-only" role="status">
            Carregando projetos
          </p>
          <ListSkeleton />
        </>
      ) : null}

      {error && !view ? (
        <ErrorState
          title="Não foi possível carregar"
          description="A lista não chegou. Tente de novo."
          onRetry={() => setReloadKey((current) => current + 1)}
        />
      ) : null}

      {view && view.items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="Nenhum resultado"
            description="Tente outro nome, outra tag ou outro status."
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQInput('');
                replaceQuery(router, { q: '', status: '', tag: '', page: 1 });
              }}
            >
              Limpar filtros
            </button>
          </EmptyState>
        ) : (
          <EmptyState
            mark="0"
            title="Nenhum projeto ainda"
            description="Crie o primeiro para começar."
          >
            <TransitionLink href="/projects/new" className="btn btn-primary">
              Criar projeto
            </TransitionLink>
          </EmptyState>
        )
      ) : null}

      {view && view.items.length > 0 ? (
        <ProjectResults
          data={view}
          activeTag={tag}
          onTag={onTag}
          onPage={(nextPage) => replaceQuery(router, { q, status, tag, page: nextPage })}
        />
      ) : null}
    </>
  );
}

function ProjectResults({
  data,
  activeTag,
  onTag,
  onPage,
}: {
  data: ProjectPage;
  activeTag: string;
  onTag: (tag: string) => void;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const countLabel = data.total === 1 ? '1 projeto' : `${data.total} projetos`;

  return (
    <div>
      <p className="count num">{countLabel}</p>
      <div className="results">
        <ul className="results-cards">
          {data.items.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} activeTag={activeTag} onTag={onTag} />
            </li>
          ))}
        </ul>
        <div className="results-table card table-scroll">
          <table className="data">
            <caption className="sr-only">Lista de projetos</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Status</th>
                <th scope="col">Tags</th>
                <th scope="col">Atualizado</th>
                <th scope="col">Link</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((project) => (
                <tr key={project.id}>
                  <td>
                    <TransitionLink
                      href={`/projects/${project.id}`}
                      className="name-link"
                    >
                      {project.name}
                    </TransitionLink>
                    <p className="subline">{project.description || 'Sem descrição'}</p>
                  </td>
                  <td>
                    <StatusBadge status={project.status} />
                  </td>
                  <td>
                    <TagList
                      tags={project.tags}
                      dense
                      activeTag={activeTag}
                      onTag={onTag}
                    />
                  </td>
                  <td className="nowrap num">{formatDate(project.updatedAt, 'short')}</td>
                  <td>
                    <ProjectLink url={project.url} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pageCount > 1 ? (
        <Pagination page={data.page} pageCount={pageCount} onPage={onPage} />
      ) : null}
    </div>
  );
}

function ProjectCard({
  project,
  activeTag,
  onTag,
}: {
  project: Project;
  activeTag: string;
  onTag: (tag: string) => void;
}) {
  return (
    <article className="card project-card">
      <div className="project-card-top">
        <h2 className="card-title">
          <TransitionLink href={`/projects/${project.id}`} className="name-link">
            {project.name}
          </TransitionLink>
        </h2>
        <StatusBadge status={project.status} />
      </div>
      <p className="card-copy clamp-3">{project.description || 'Sem descrição'}</p>
      <TagList tags={project.tags} activeTag={activeTag} onTag={onTag} />
      <div className="card-foot">
        <ProjectLink url={project.url} />
        <time className="num" dateTime={project.updatedAt}>
          {formatDate(project.updatedAt, 'short')}
        </time>
      </div>
    </article>
  );
}

function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  return (
    <nav aria-label="Paginação" className="pager">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="btn btn-ghost"
      >
        Anterior
      </button>
      <p className="num muted">
        Página {page} de {pageCount}
      </p>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        className="btn btn-ghost"
      >
        Próxima
      </button>
    </nav>
  );
}

function replaceQuery(
  router: ReturnType<typeof useRouter>,
  next: { q: string; status: string; tag: string; page: number },
) {
  const params = new URLSearchParams();
  const q = next.q.trim();
  const tag = next.tag.trim();
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);
  if (next.status) params.set('status', next.status);
  if (next.page > 1) params.set('page', String(next.page));
  const query = params.toString();
  router.replace(query ? `/?${query}` : '/', { scroll: false });
}

function positivePage(value: string | null): number {
  const page = Number(value ?? '1');
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}
