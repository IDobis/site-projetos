export function withViewTransition(run: () => void | Promise<unknown>) {
  if (typeof document === 'undefined') {
    void run();
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = document.startViewTransition?.bind(document);
  if (!start || reduce) {
    void run();
    return;
  }

  start(() => {
    void run();
  });
}
