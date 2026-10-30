import { ProjectStatus } from './types';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: 'Ideia',
  in_progress: 'Em andamento',
  paused: 'Pausado',
  done: 'Concluído',
};

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
