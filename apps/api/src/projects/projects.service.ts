import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { projectNotFound } from '../common/not-found';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects.query';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectList } from './project.types';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly projects: ProjectsRepository) {}

  list(query: ListProjectsQueryDto): ProjectList {
    return this.projects.list({
      q: query.q,
      tag: query.tag,
      status: query.status,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
  }

  get(id: string): Project {
    const project = this.projects.findById(id);
    if (!project) projectNotFound();
    return project;
  }

  create(dto: CreateProjectDto): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description ?? null,
      url: dto.url ?? null,
      status: dto.status ?? 'idea',
      tags: dto.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.projects.insert(project);
    return project;
  }

  update(id: string, dto: UpdateProjectDto): Project {
    const current = this.projects.findById(id);
    if (!current) projectNotFound();

    const project: Project = {
      ...current,
      name: dto.name ?? current.name,
      description:
        dto.description !== undefined ? (dto.description ?? null) : current.description,
      url: dto.url !== undefined ? (dto.url ?? null) : current.url,
      status: dto.status ?? current.status,
      tags: dto.tags ?? current.tags,
      updatedAt: new Date().toISOString(),
    };
    this.projects.update(project);
    return project;
  }

  remove(id: string): void {
    const deleted = this.projects.delete(id);
    if (!deleted) projectNotFound();
  }
}
