import { listProjects } from './api';
import { PROJECT_STATUSES, ProjectStatus } from './types';

export type StatusCounts = { total: number } & Record<ProjectStatus, number>;

let current: StatusCounts | null = null;
let requestId = 0;
const listeners = new Set<() => void>();

export function subscribeCounts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCounts(): StatusCounts | null {
  return current;
}

export async function refreshCounts() {
  const id = ++requestId;
  const [all, ...byStatus] = await Promise.all([
    listProjects({ page: 1, pageSize: 1 }),
    ...PROJECT_STATUSES.map((status) => listProjects({ status, page: 1, pageSize: 1 })),
  ]);
  if (id !== requestId) return;
  const next = { total: all.total } as StatusCounts;
  PROJECT_STATUSES.forEach((status, index) => {
    next[status] = byStatus[index]?.total ?? 0;
  });
  current = next;
  listeners.forEach((listener) => listener());
}
