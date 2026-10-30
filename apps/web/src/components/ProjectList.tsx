'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { listProjects } from '@/lib/api';
import { STATUS_LABELS } from '@/lib/labels';
import { PROJECT_STATUSES, Project, ProjectList as ProjectPage } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

const PAGE_SIZE = 20;

export function ProjectList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = positivePage(searchParams.get('page'));
  const [qInput, setQInput] = useState(q);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; data: ProjectPage }
  >({ kind: 'loading' });

  useEffect(() => {
    setQInput(q);
  }, [q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (qInput.trim() === q.trim()) return;
      replaceQuery(router, { q: qInput, status, page: 1 });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [qInput, q, status, router]);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    listProjects({
      q,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, page, reloadKey]);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceQuery(router, { q: qInput, status, page: 1 });
  }

  const filtered = q.trim().length > 0 || status.length > 0;

  return (
    <section>
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl tracking-tight">Meus projetos</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Guarde ideias, links e o andamento do que você está construindo.
        </p>
      </div>

      <form
        onSubmit={onSearchSubmit}
        className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:grid-cols-[1fr_14rem]"
      >
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            value={qInput}
            placeholder="Nome ou tag"
            onChange={(event) => setQInput(event.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={
              PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])
                ? status
                : ''
            }
            onChange={(event) =>
              replaceQuery(router, { q, status: event.target.value, page: 1 })
            }
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
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

      <div className="mt-6">
        {state.kind === 'loading' ? (
          <p className="text-sm text-stone-600" role="status">
            Carregando projetos...
          </p>
        ) : null}

        {state.kind === 'error' ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">Não foi possível carregar os projetos.</p>
            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-3 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-900 hover:bg-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {state.kind === 'ready' && state.data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center">
            <p className="font-medium">
              {filtered ? 'Nenhum projeto encontrado.' : 'Nenhum projeto por aqui ainda.'}
            </p>
            <p className="mt-1 text-sm text-stone-600">
              {filtered
                ? 'Tente outro nome, outra tag ou outro status.'
                : 'Crie o primeiro para começar a lista.'}
            </p>
            {!filtered ? (
              <Link
                href="/projects/new"
                className="mt-4 inline-flex rounded-full bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Criar projeto
              </Link>
            ) : null}
          </div>
        ) : null}

        {state.kind === 'ready' && state.data.items.length > 0 ? (
          <ProjectResults
            data={state.data}
            onPage={(nextPage) => replaceQuery(router, { q, status, page: nextPage })}
          />
        ) : null}
      </div>
    </section>
  );
}

function ProjectResults({
  data,
  onPage,
}: {
  data: ProjectPage;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div>
      <p className="mb-3 text-sm text-stone-600">
        {data.total === 1 ? '1 projeto' : `${data.total} projetos`}
      </p>
      <div className="grid gap-3 md:hidden">
        {data.items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((project) => (
              <tr key={project.id} className="border-t border-stone-200">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/projects/${project.id}`} className="hover:text-pine">
                    {project.name}
                  </Link>
                </td>
                <td className="max-w-xs px-4 py-3 text-stone-600">
                  <span className="line-clamp-2">
                    {project.description || 'Sem descrição'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ProjectLink url={project.url} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-4 py-3">
                  <TagList tags={project.tags} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={data.page} pageCount={pageCount} onPage={onPage} />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/projects/${project.id}`} className="font-medium hover:text-pine">
          {project.name}
        </Link>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
        {project.description || 'Sem descrição'}
      </p>
      <div className="mt-3">
        <ProjectLink url={project.url} />
      </div>
      <div className="mt-3">
        <TagList tags={project.tags} />
      </div>
    </article>
  );
}

function ProjectLink({ url }: { url: string | null }) {
  if (!url) return <span className="text-sm text-stone-400">Sem link</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-pine underline-offset-2 hover:underline"
    >
      {url.replace(/^https?:\/\//, '')}
    </a>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-sm text-stone-400">Sem tags</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700"
        >
          {tag}
        </li>
      ))}
    </ul>
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
    <nav aria-label="Paginação" className="mt-4 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        Anterior
      </button>
      <p className="text-sm text-stone-600">
        Página {page} de {pageCount}
      </p>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        Próxima
      </button>
    </nav>
  );
}

function replaceQuery(
  router: ReturnType<typeof useRouter>,
  next: { q: string; status: string; page: number },
) {
  const params = new URLSearchParams();
  const q = next.q.trim();
  if (q) params.set('q', q);
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
