import { isProjectStatus, ProjectStatus } from './types';

export type ProjectDraft = {
  name: string;
  description: string;
  url: string;
  status: ProjectStatus;
  tags: string;
};

const PREFIX = 'site-projetos:draft:';

export function draftKey(projectId?: string): string {
  return `${PREFIX}${projectId ?? 'new'}`;
}

export function readDraft(key: string): ProjectDraft | null {
  const storage = localStorageOrNull();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ProjectDraft>;
    if (!parsed || typeof parsed.name !== 'string') return null;
    return {
      name: parsed.name,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      url: typeof parsed.url === 'string' ? parsed.url : '',
      status:
        typeof parsed.status === 'string' && isProjectStatus(parsed.status)
          ? parsed.status
          : 'idea',
      tags: typeof parsed.tags === 'string' ? parsed.tags : '',
    };
  } catch {
    return null;
  }
}

export function saveDraft(key: string, draft: ProjectDraft): void {
  const storage = localStorageOrNull();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(draft));
}

export function clearDraft(key: string): void {
  const storage = localStorageOrNull();
  if (!storage) return;
  storage.removeItem(key);
}

function localStorageOrNull(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
