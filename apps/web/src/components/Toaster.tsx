'use client';

import { useSyncExternalStore } from 'react';

type Toast = { id: number; message: string };

const EMPTY: Toast[] = [];
let toasts: Toast[] = EMPTY;
let nextId = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function toast(message: string) {
  const item = { id: ++nextId, message };
  toasts = [...toasts, item].slice(-3);
  emit();
  window.setTimeout(() => {
    toasts = toasts.filter((entry) => entry.id !== item.id);
    emit();
  }, 3200);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function Toaster() {
  const items = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => EMPTY,
  );
  return (
    <div className="toast-region" aria-live="polite" aria-relevant="additions">
      {items.map((item) => (
        <p key={item.id} className="toast" role="status">
          {item.message}
        </p>
      ))}
    </div>
  );
}
