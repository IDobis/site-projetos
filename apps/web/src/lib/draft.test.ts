import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, draftKey, readDraft, saveDraft } from './draft';

function installStorage() {
  const memory = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('draft storage', () => {
  it('keeps a draft and clears it after save', () => {
    installStorage();
    const key = draftKey();
    saveDraft(key, {
      name: 'Caderno',
      description: 'Notas',
      url: 'https://caderno.dev',
      status: 'in_progress',
      tags: 'next, sqlite',
    });

    expect(readDraft(key)).toEqual({
      name: 'Caderno',
      description: 'Notas',
      url: 'https://caderno.dev',
      status: 'in_progress',
      tags: 'next, sqlite',
    });

    clearDraft(key);
    expect(readDraft(key)).toBeNull();
  });

  it('uses a separate key for each project and ignores broken data', () => {
    installStorage();
    expect(draftKey('abc')).toBe('site-projetos:draft:abc');
    window.localStorage.setItem(draftKey('abc'), '{');
    expect(readDraft(draftKey('abc'))).toBeNull();
  });
});
