import { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  mark,
  children,
}: {
  title: string;
  description: string;
  mark?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      {mark ? (
        <p className="empty-mark num" aria-hidden="true">
          {mark}
        </p>
      ) : null}
      <h2 className="empty-title">{title}</h2>
      <p className="lede">{description}</p>
      {children}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      <h2 className="empty-title">{title}</h2>
      <p className="lede">{description}</p>
      <button type="button" className="btn btn-ghost" onClick={onRetry}>
        Tentar de novo
      </button>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="results" aria-hidden="true">
      <div className="results-cards">
        {['a', 'b', 'c'].map((key) => (
          <div key={key} className="card project-card">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        ))}
      </div>
      <div className="results-table card">
        {['a', 'b', 'c', 'd'].map((key) => (
          <div key={key} className="skeleton skeleton-row" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton skeleton-block" />
      <div className="card form-card">
        {['a', 'b', 'c', 'd'].map((key) => (
          <div key={key} className="skeleton skeleton-field" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton skeleton-line short" />
      <div
        className="skeleton skeleton-title"
        style={{ marginTop: '1rem', height: '2.4rem', width: '70%' }}
      />
      <div className="skeleton skeleton-line" style={{ marginTop: '1rem' }} />
      <div className="card meta-wrap">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}
