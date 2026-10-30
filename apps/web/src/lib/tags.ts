export function parseTags(input: string): string[] {
  const tags: string[] = [];
  for (const part of input.split(',')) {
    const tag = part.trim().toLowerCase();
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
  }
  return tags;
}

export function formatTags(tags: string[]): string {
  return tags.join(', ');
}
