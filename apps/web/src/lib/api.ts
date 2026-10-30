import { Project, ProjectInput, ProjectList } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(
    status: number,
    message: string,
    code?: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string>;
  };
};

export function buildProjectsQuery(filters: {
  q?: string;
  tag?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  const tag = filters.tag?.trim();
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);
  if (filters.status) params.set('status', filters.status);
  if (filters.page && filters.page > 0) params.set('page', String(filters.page));
  if (filters.pageSize && filters.pageSize > 0) {
    params.set('pageSize', String(filters.pageSize));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function listProjects(filters: {
  q?: string;
  tag?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProjectList> {
  return request<ProjectList>(`/projects${buildProjectsQuery(filters)}`);
}

export function getProject(id: string): Promise<Project> {
  return request<Project>(`/projects/${id}`);
}

export function createProject(input: ProjectInput): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProject(id: string, input: ProjectInput): Promise<Project> {
  return request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string): Promise<void> {
  return request<void>(`/projects/${id}`, { method: 'DELETE' });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API.');
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as ErrorPayload | T | null;
  if (!response.ok) {
    const error = (payload as ErrorPayload | null)?.error;
    throw new ApiError(
      response.status,
      error?.message ?? 'Não foi possível concluir a operação.',
      error?.code,
      error?.fields,
    );
  }

  return payload as T;
}
