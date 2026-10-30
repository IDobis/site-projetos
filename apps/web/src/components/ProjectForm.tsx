'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { ApiError, createProject, updateProject } from '@/lib/api';
import { clearDraft, draftKey, ProjectDraft, readDraft, saveDraft } from '@/lib/draft';
import { STATUS_LABELS } from '@/lib/labels';
import { parseTags } from '@/lib/tags';
import { PROJECT_STATUSES, ProjectStatus } from '@/lib/types';

const EMPTY_DRAFT: ProjectDraft = {
  name: '',
  description: '',
  url: '',
  status: 'idea',
  tags: '',
};

type ProjectFormProps = {
  mode: 'create' | 'edit';
  projectId?: string;
  initial?: ProjectDraft;
};

export function ProjectForm({
  mode,
  projectId,
  initial = EMPTY_DRAFT,
}: ProjectFormProps) {
  const router = useRouter();
  const key = draftKey(mode === 'edit' ? projectId : undefined);
  const [form, setForm] = useState<ProjectDraft>(initial);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const draft = readDraft(key);
    if (draft) setForm(draft);
    setReady(true);
  }, [key]);

  function update<K extends keyof ProjectDraft>(field: K, value: ProjectDraft[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      saveDraft(key, next);
      return next;
    });
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setErrors({});

    const payload = {
      name: form.name,
      description: form.description,
      url: form.url,
      status: form.status,
      tags: parseTags(form.tags),
    };

    try {
      const saved =
        mode === 'create' || !projectId
          ? await createProject(payload)
          : await updateProject(projectId, payload);
      clearDraft(key);
      router.push(`/projects/${saved.id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields ?? {});
        if (!error.fields || Object.keys(error.fields).length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError('Não foi possível salvar o projeto.');
      }
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <p className="text-sm text-stone-600" role="status">
        Carregando formulário...
      </p>
    );
  }

  const cancelHref = mode === 'edit' && projectId ? `/projects/${projectId}` : '/';

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
        {mode === 'create' ? 'Novo projeto' : 'Editar projeto'}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        O rascunho fica salvo neste navegador até o projeto ser gravado.
      </p>

      {formError ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <div className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:p-6">
        <Field label="Nome" id="name" error={errors.name}>
          <input
            id="name"
            name="name"
            value={form.name}
            maxLength={120}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            onChange={(event) => update('name', event.target.value)}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field label="Descrição" id="description" error={errors.description}>
          <textarea
            id="description"
            name="description"
            value={form.description}
            rows={4}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'description-error' : undefined}
            onChange={(event) => update('description', event.target.value)}
            className={inputClass(Boolean(errors.description))}
          />
        </Field>

        <Field label="URL" id="url" error={errors.url}>
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={form.url}
            aria-invalid={Boolean(errors.url)}
            aria-describedby={errors.url ? 'url-error' : undefined}
            onChange={(event) => update('url', event.target.value)}
            className={inputClass(Boolean(errors.url))}
          />
        </Field>

        <Field label="Status" id="status" error={errors.status}>
          <select
            id="status"
            name="status"
            value={form.status}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={errors.status ? 'status-error' : undefined}
            onChange={(event) => update('status', event.target.value as ProjectStatus)}
            className={inputClass(Boolean(errors.status))}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Tags"
          id="tags"
          error={errors.tags}
          hint="Separe as tags por vírgula."
        >
          <input
            id="tags"
            name="tags"
            value={form.tags}
            aria-invalid={Boolean(errors.tags)}
            aria-describedby={errors.tags ? 'tags-error' : 'tags-hint'}
            onChange={(event) => update('tags', event.target.value)}
            className={inputClass(Boolean(errors.tags))}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="rounded-full border border-stone-300 px-4 py-2 text-center text-sm font-medium hover:bg-white"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function inputClass(invalid: boolean): string {
  return `w-full rounded-xl border bg-white px-3 py-2 text-sm ${
    invalid ? 'border-red-400' : 'border-stone-300'
  }`;
}
