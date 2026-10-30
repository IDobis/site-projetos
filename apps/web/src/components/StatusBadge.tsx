import { STATUS_LABELS } from '@/lib/labels';
import { ProjectStatus } from '@/lib/types';
import { IconDone, IconIdea, IconPaused, IconProgress } from './Icons';

const icons = {
  idea: IconIdea,
  in_progress: IconProgress,
  paused: IconPaused,
  done: IconDone,
} satisfies Record<ProjectStatus, () => React.JSX.Element>;

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const Icon = icons[status];
  return (
    <span className={`badge badge-${status}`}>
      <Icon />
      {STATUS_LABELS[status]}
    </span>
  );
}
