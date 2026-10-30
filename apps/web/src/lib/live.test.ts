import { afterEach, describe, expect, it } from 'vitest';
import {
  applyLive,
  optimisticRemove,
  optimisticUpsert,
  reconcileLive,
  resetLive,
  revertRemove,
} from './live';
import { Project } from './types';

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Caderno',
    description: null,
    url: null,
    status: 'idea',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  resetLive();
});

describe('live project updates', () => {
  it('hides a removed project and restores it on failure', () => {
    const item = project();
    expect(applyLive([item], 1)).toEqual({ items: [item], total: 1 });

    optimisticRemove(item);
    expect(applyLive([item], 1)).toEqual({ items: [], total: 0 });

    revertRemove(item.id);
    expect(applyLive([item], 1).items.map((entry) => entry.name)).toEqual(['Caderno']);
  });

  it('keeps an edit until the server list catches up', () => {
    const item = project();
    const edited = project({
      name: 'Caderno novo',
      updatedAt: '2026-02-01T00:00:00.000Z',
    });

    optimisticUpsert(edited);
    expect(applyLive([item], 1).items[0]?.name).toBe('Caderno novo');

    reconcileLive([item]);
    expect(applyLive([item], 1).items[0]?.name).toBe('Caderno novo');

    reconcileLive([edited]);
    expect(applyLive([edited], 1).items[0]?.name).toBe('Caderno novo');
  });
});
