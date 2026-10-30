import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { DatabaseSync } from 'node:sqlite';
import { DATABASE } from '../database/sqlite';
import { Project, ProjectList, ProjectStatus } from './project.types';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  status: string;
  tags: string;
  created_at: string;
  updated_at: string;
};

type CountRow = {
  total: number;
};

export type ListQuery = {
  q?: string;
  tag?: string;
  status?: ProjectStatus;
  page: number;
  pageSize: number;
};

@Injectable()
export class ProjectsRepository implements OnModuleDestroy {
  private closed = false;

  constructor(@Inject(DATABASE) private readonly db: DatabaseSync) {}

  onModuleDestroy(): void {
    if (this.closed) return;
    this.closed = true;
    this.db.close();
  }

  list(query: ListQuery): ProjectList {
    const { where, values } = this.filters(query);
    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS total FROM projects ${where}`)
      .get(...values) as CountRow;
    const offset = (query.page - 1) * query.pageSize;
    const rows = this.db
      .prepare(
        `SELECT id, name, description, url, status, tags, created_at, updated_at
         FROM projects ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...values, query.pageSize, offset) as ProjectRow[];

    return {
      items: rows.map(mapProject),
      total: Number(totalRow.total),
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  findById(id: string): Project | null {
    const row = this.db
      .prepare(
        `SELECT id, name, description, url, status, tags, created_at, updated_at
         FROM projects WHERE id = ?`,
      )
      .get(id) as ProjectRow | undefined;
    return row ? mapProject(row) : null;
  }

  insert(project: Project): void {
    this.db
      .prepare(
        `INSERT INTO projects (id, name, description, url, status, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        project.id,
        project.name,
        project.description,
        project.url,
        project.status,
        JSON.stringify(project.tags),
        project.createdAt,
        project.updatedAt,
      );
  }

  update(project: Project): void {
    this.db
      .prepare(
        `UPDATE projects
         SET name = ?, description = ?, url = ?, status = ?, tags = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        project.name,
        project.description,
        project.url,
        project.status,
        JSON.stringify(project.tags),
        project.updatedAt,
        project.id,
      );
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return Number(result.changes) > 0;
  }

  private filters(query: ListQuery): { where: string; values: Array<string | number> } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    const q = query.q?.trim().toLowerCase() ?? '';

    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      clauses.push(
        `(lower(name) LIKE ? ESCAPE '\\' OR EXISTS (
          SELECT 1 FROM json_each(projects.tags) AS tag
          WHERE lower(tag.value) LIKE ? ESCAPE '\\'
        ))`,
      );
      values.push(pattern, pattern);
    }

    if (query.status) {
      clauses.push('status = ?');
      values.push(query.status);
    }

    const tag = query.tag?.trim().toLowerCase() ?? '';
    if (tag) {
      clauses.push(
        `EXISTS (
          SELECT 1 FROM json_each(projects.tags) AS tag
          WHERE tag.value = ?
        )`,
      );
      values.push(tag);
    }

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values,
    };
  }
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    status: row.status as ProjectStatus,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
