'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { ApiError, createProject, updateProject } from '@/lib/api';
import { clearDraft, draftKey, ProjectDraft, readDraft, saveDraft } from '@/lib/draft';
import { clearFormFailure, peekFormFailure, stashFormFailure } from '@/lib/form-error';
import { STATUS_LABELS } from '@/lib/labels';
import { optimisticUpsert, revertUpsert, settleUpsert } from '@/lib/live';
import { withViewTransition } from '@/lib/navigate';
import { parseTags } from '@/lib/tags';
import { PROJECT_STATUSES, Project, ProjectStatus } from '@/lib/types';
import { toast } from './Toaster';
import { FormSkeleton } from './States';
import { TransitionLink } from './TransitionLink';

const EMPTY_DRAFT: ProjectDraft = {
  name: '',
  description: '',
  url: '',
  status: 'idea',
  tags: '',
};

const FIELD_ORDER = ['name', 'description', 'url', 'status', 'tags'] as const;

type ProjectFormProps = {
  mode: 'create' | 'edit';
  project?: Project;
  initial?: ProjectDraft;
};

export function ProjectForm({ mode, project, initial = EMPTY_DRAFT }: ProjectFormProps) {
  const router = useRouter();
  const key = draftKey(mode === 'edit' ? project?.id : undefined);
  const [form, setForm] = useState<ProjectDraft>(initial);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      const draft = readDraft(key);
      if (draft) setForm(draft);
      const failure = peekFormFailure(key);
      if (failure) {
        setErrors(failure.fields);
        setFormError(Object.keys(failure.fields).length > 0 ? null : failure.message);
        focusField(failure.fields);
      }
      setReady(true);
      window.setTimeout(() => clearFormFailure(key), 1500);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
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
    if (saving) return;

    const local = localErrors(form);
    if (Object.keys(local).length > 0) {
      setErrors(local);
      setFormError(null);
      focusField(local);
      return;
    }

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

    if (mode === 'edit' && project) {
      const optimistic = toOptimistic(project, form);
      optimisticUpsert(optimistic);
      withViewTransition(() => router.push(`/projects/${project.id}`));
      try {
        const saved = await updateProject(project.id, payload);
        settleUpsert(saved);
        clearDraft(key);
        toast('Projeto salvo.');
      } catch (error) {
        revertUpsert(project.id);
        const failure = toFailure(error);
        stashFormFailure(key, failure);
        toast(
          Object.keys(failure.fields).length > 0 ? 'Confira os campos.' : failure.message,
        );
        router.push(`/projects/${project.id}/edit`);
      }
      return;
    }

    try {
      const saved = await createProject(payload);
      clearDraft(key);
      settleUpsert(saved);
      toast('Projeto salvo.');
      withViewTransition(() => router.push(`/projects/${saved.id}`));
    } catch (error) {
      const failure = toFailure(error);
      setErrors(failure.fields);
      setFormError(Object.keys(failure.fields).length > 0 ? null : failure.message);
      focusField(failure.fields);
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <>
        <p className="sr-only" role="status">
          Carregando formulário
        </p>
        <FormSkeleton />
      </>
    );
  }

  const cancelHref = mode === 'edit' && project ? `/projects/${project.id}` : '/';

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="form-narrow"
      aria-describedby={formError ? 'form-error' : undefined}
    >
      <h1 className="title">{mode === 'create' ? 'Novo projeto' : 'Editar projeto'}</h1>
      <p className="lede">O rascunho fica neste navegador.</p>

      {formError ? (
        <p id="form-error" className="form-alert" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="card form-card">
        <Field label="Nome" id="name" error={errors.name}>
          <input
            id="name"
            name="name"
            value={form.name}
            maxLength={120}
            required
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            onChange={(event) => update('name', event.target.value)}
            className="control"
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
            className="control"
          />
        </Field>

        <Field label="URL" id="url" error={errors.url}>
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
            value={form.url}
            aria-invalid={Boolean(errors.url)}
            aria-describedby={errors.url ? 'url-error' : undefined}
            onChange={(event) => update('url', event.target.value)}
            className="control"
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
            className="control select"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tags" id="tags" error={errors.tags} hint="Separe por vírgula.">
          <input
            id="tags"
            name="tags"
            value={form.tags}
            aria-invalid={Boolean(errors.tags)}
            aria-describedby={errors.tags ? 'tags-error' : 'tags-hint'}
            onChange={(event) => update('tags', event.target.value)}
            className="control"
          />
        </Field>
      </div>

      <div className="actions inline">
        <TransitionLink href={cancelHref} className="btn btn-ghost">
          Cancelar
        </TransitionLink>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando' : 'Salvar'}
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
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function localErrors(form: ProjectDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.name.trim();
  if (name.length === 0) errors.name = 'Informe o nome.';
  else if (name.length > 120) errors.name = 'O nome deve ter no máximo 120 caracteres.';
  const url = form.url.trim();
  if (url && !/^https?:\/\/\S+$/i.test(url)) {
    errors.url = 'Informe uma URL válida, com http:// ou https://.';
  }
  return errors;
}

function toOptimistic(project: Project, form: ProjectDraft): Project {
  const description = form.description.trim();
  const url = form.url.trim();
  return {
    ...project,
    name: form.name.trim(),
    description: description || null,
    url: url || null,
    status: form.status,
    tags: parseTags(form.tags),
    updatedAt: new Date().toISOString(),
  };
}

function toFailure(error: unknown): { fields: Record<string, string>; message: string } {
  if (error instanceof ApiError) {
    return { fields: error.fields ?? {}, message: error.message };
  }
  return { fields: {}, message: 'Não foi possível salvar o projeto.' };
}

function focusField(fields: Record<string, string>) {
  const id = FIELD_ORDER.find((field) => fields[field]);
  if (!id) return;
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}
