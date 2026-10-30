import { ProjectStatus } from './types';

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: 'Ideia',
  in_progress: 'Em andamento',
  paused: 'Pausado',
  done: 'Concluído',
};

export function formatDate(value: string, style: 'short' | 'medium' = 'medium'): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: style,
    timeStyle: 'short',
  }).format(date);
}
