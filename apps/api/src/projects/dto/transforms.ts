export function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function emptyToNull({ value }: { value: unknown }): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizeTags({ value }: { value: unknown }): unknown {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return value;

  const tags: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return value;
    const tag = item.trim().toLowerCase();
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
  }
  return tags;
}
