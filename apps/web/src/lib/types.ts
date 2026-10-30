export const PROJECT_STATUSES = ['idea', 'in_progress', 'paused', 'done'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  status: ProjectStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectList = {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
};

export type ProjectInput = {
  name: string;
  description?: string;
  url?: string;
  status?: ProjectStatus;
  tags?: string[];
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}
