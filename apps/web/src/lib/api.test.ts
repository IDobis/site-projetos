import { describe, expect, it } from 'vitest';
import { buildProjectsQuery } from './api';
import { parseTags } from './tags';

describe('project helpers', () => {
  it('builds the list query', () => {
    expect(
      buildProjectsQuery({ q: ' react ', status: 'done', page: 2, pageSize: 20 }),
    ).toBe('?q=react&status=done&page=2&pageSize=20');
    expect(buildProjectsQuery({})).toBe('');
  });

  it('normalizes tags typed in the form', () => {
    expect(parseTags(' Next, react, React, ')).toEqual(['next', 'react']);
  });
});
