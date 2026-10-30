'use client';

import { TransitionLink } from './TransitionLink';

export function hostLabel(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function ProjectLink({ url }: { url: string | null }) {
  if (!url) return <span className="muted">Sem link</span>;
  return (
    <a className="ext" href={url} target="_blank" rel="noreferrer">
      {hostLabel(url)}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

export function TagList({
  tags,
  dense = false,
  activeTag,
  onTag,
}: {
  tags: string[];
  dense?: boolean;
  activeTag?: string;
  onTag?: (tag: string) => void;
}) {
  if (tags.length === 0) return <span className="muted">Sem tags</span>;
  const className = dense ? 'chip dense' : 'chip';

  return (
    <ul className="cluster">
      {tags.map((tag) => (
        <li key={tag}>
          {onTag ? (
            <button
              type="button"
              className={className}
              aria-pressed={activeTag === tag}
              onClick={() => onTag(tag)}
            >
              {tag}
            </button>
          ) : (
            <TransitionLink
              className={className}
              href={`/?tag=${encodeURIComponent(tag)}`}
            >
              {tag}
            </TransitionLink>
          )}
        </li>
      ))}
    </ul>
  );
}
