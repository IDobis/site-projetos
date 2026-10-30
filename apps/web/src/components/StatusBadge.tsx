import { STATUS_LABELS } from '@/lib/labels';
import { ProjectStatus } from '@/lib/types';

const styles: Record<ProjectStatus, string> = {
  idea: 'bg-stone-100 text-stone-700',
  in_progress: 'bg-teal-50 text-teal-900',
  paused: 'bg-amber-50 text-amber-900',
  done: 'bg-emerald-50 text-emerald-900',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
