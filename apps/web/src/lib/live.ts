import { useSyncExternalStore } from 'react';
import { Project } from './types';

export type LiveEntry = {
  project: Project;
  phase: 'pending' | 'settled';
};

type RemoveEntry = {
  id: string;
  snapshot: Project;
};

type LiveState = {
  upserts: Map<string, LiveEntry>;
  removed: Map<string, RemoveEntry>;
  version: number;
};

let state: LiveState = {
  upserts: new Map(),
  removed: new Map(),
  version: 0,
};

const listeners = new Set<() => void>();

function emit() {
  state = { ...state, version: state.version + 1 };
  listeners.forEach((listener) => listener());
}

export function subscribeLive(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLiveVersion() {
  return state.version;
}

export function resetLive() {
  state = { upserts: new Map(), removed: new Map(), version: 0 };
}

export function optimisticUpsert(project: Project) {
  state.removed.delete(project.id);
  state.upserts.set(project.id, { project, phase: 'pending' });
  emit();
}

export function settleUpsert(project: Project) {
  state.removed.delete(project.id);
  state.upserts.set(project.id, { project, phase: 'settled' });
  emit();
}

export function revertUpsert(id: string) {
  if (!state.upserts.delete(id)) return;
  emit();
}

export function optimisticRemove(project: Project) {
  state.upserts.delete(project.id);
  state.removed.set(project.id, { id: project.id, snapshot: project });
  emit();
}

export function revertRemove(id: string) {
  const entry = state.removed.get(id);
  if (!entry) return;
  state.removed.delete(id);
  state.upserts.set(id, { project: entry.snapshot, phase: 'settled' });
  emit();
}

export function getLiveEntry(id: string): LiveEntry | null {
  if (state.removed.has(id)) return null;
  return state.upserts.get(id) ?? null;
}

export function applyLive(
  items: Project[],
  total: number,
): { items: Project[]; total: number } {
  let nextTotal = total;
  const next: Project[] = [];

  for (const item of items) {
    if (state.removed.has(item.id)) {
      nextTotal -= 1;
      continue;
    }
    next.push(state.upserts.get(item.id)?.project ?? item);
  }

  return { items: next, total: Math.max(0, nextTotal) };
}

export function reconcileLive(items: Project[]) {
  let changed = false;

  for (const [id, entry] of state.upserts) {
    if (entry.phase !== 'settled') continue;
    const server = items.find((item) => item.id === id);
    if (server && server.updatedAt >= entry.project.updatedAt) {
      state.upserts.delete(id);
      changed = true;
    }
  }

  for (const id of state.removed.keys()) {
    if (!items.some((item) => item.id === id)) {
      state.removed.delete(id);
      changed = true;
    }
  }

  if (changed) emit();
}

export function useLiveVersion() {
  return useSyncExternalStore(subscribeLive, getLiveVersion, () => 0);
}

export function useLiveProject(id: string): LiveEntry | null {
  return useSyncExternalStore(
    subscribeLive,
    () => getLiveEntry(id),
    () => null,
  );
}
