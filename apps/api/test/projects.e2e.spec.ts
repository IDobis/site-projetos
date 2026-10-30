import 'reflect-metadata';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  INestApplication,
  Logger,
} from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/app.factory';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { Project } from '../src/projects/project.types';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

describe('Projects API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createApp({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function createProject(body: Record<string, unknown>): Promise<Project> {
    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .send(body)
      .expect(201);
    return response.body as Project;
  }

  it('creates a project', async () => {
    const project = await createProject({
      name: '  Site pessoal  ',
      description: 'Portfólio',
      url: 'https://exemplo.dev',
      tags: ['Next', ' react ', 'react'],
    });

    expect(project.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(project.name).toBe('Site pessoal');
    expect(project.description).toBe('Portfólio');
    expect(project.url).toBe('https://exemplo.dev');
    expect(project.status).toBe('idea');
    expect(project.tags).toEqual(['next', 'react']);
    expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(project.updatedAt).toBe(project.createdAt);

    const fetched = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}`)
      .expect(200);
    expect(fetched.body).toEqual(project);
  });

  it('edits a project', async () => {
    const project = await createProject({
      name: 'Site pessoal',
      description: 'Portfólio',
      url: 'https://exemplo.dev',
      tags: ['next'],
    });

    const edited = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}`)
      .send({
        name: 'Site pessoal v2',
        status: 'in_progress',
        description: '',
        tags: ['TypeScript'],
      })
      .expect(200);

    const updated = edited.body as Project;
    expect(updated.name).toBe('Site pessoal v2');
    expect(updated.status).toBe('in_progress');
    expect(updated.description).toBeNull();
    expect(updated.tags).toEqual(['typescript']);
    expect(updated.url).toBe('https://exemplo.dev');
    expect(updated.createdAt).toBe(project.createdAt);
    expect(updated.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('removes a project', async () => {
    const project = await createProject({ name: 'Site pessoal' });

    await request(app.getHttpServer()).delete(`/api/projects/${project.id}`).expect(204);
    await request(app.getHttpServer()).get(`/api/projects/${project.id}`).expect(404);

    const listed = await request(app.getHttpServer()).get('/api/projects').expect(200);
    expect(listed.body.total).toBe(0);
  });

  it('searches projects by name', async () => {
    const project = await createProject({ name: 'Site pessoal', status: 'in_progress' });
    await createProject({ name: 'API de notas', status: 'paused' });
    await createProject({ name: 'Pronto', status: 'done' });

    const byName = await request(app.getHttpServer())
      .get('/api/projects?q=pessoal')
      .expect(200);
    expect(byName.body.total).toBe(1);
    expect(byName.body.items[0].id).toBe(project.id);
    expect(byName.body.page).toBe(1);
    expect(byName.body.pageSize).toBe(20);

    const byStatus = await request(app.getHttpServer())
      .get('/api/projects?status=done')
      .expect(200);
    expect(byStatus.body.total).toBe(1);
    expect(byStatus.body.items[0].name).toBe('Pronto');
  });

  it('searches projects by tag', async () => {
    const project = await createProject({ name: 'Site pessoal', tags: ['TypeScript'] });
    await createProject({ name: 'API de notas', tags: ['nestjs'] });
    await createProject({ name: 'Outro', tags: ['react'] });

    const byQuery = await request(app.getHttpServer())
      .get('/api/projects?q=NEST')
      .expect(200);
    expect(byQuery.body.total).toBe(1);
    expect(byQuery.body.items[0].name).toBe('API de notas');

    const byExactTag = await request(app.getHttpServer())
      .get('/api/projects?tag=Typescript')
      .expect(200);
    expect(byExactTag.body.total).toBe(1);
    expect(byExactTag.body.items.map((item: Project) => item.id)).toEqual([project.id]);
  });

  it('paginates the project list', async () => {
    await createProject({ name: 'Primeiro' });
    await createProject({ name: 'Segundo' });
    await createProject({ name: 'Terceiro' });

    const page = await request(app.getHttpServer())
      .get('/api/projects?page=2&pageSize=2')
      .expect(200);
    expect(page.body.total).toBe(3);
    expect(page.body.page).toBe(2);
    expect(page.body.pageSize).toBe(2);
    expect(page.body.items).toHaveLength(1);
  });

  it('treats % and _ as literal characters in search', async () => {
    await createProject({ name: '100% pronto', tags: ['qa'] });
    await createProject({ name: '100X pronto' });
    await createProject({ name: 'under_score' });
    await createProject({ name: 'underXscore' });
    await createProject({ name: 'plain' });
    await createProject({ name: 'somente tag', tags: ['100%'] });
    await createProject({ name: 'tag underscore', tags: ['a_b'] });

    const byPercent = await request(app.getHttpServer())
      .get(`/api/projects?q=${encodeURIComponent('%')}`)
      .expect(200);
    expect(names(byPercent.body.items)).toEqual(['100% pronto', 'somente tag']);

    const byUnderscore = await request(app.getHttpServer())
      .get(`/api/projects?q=${encodeURIComponent('_')}`)
      .expect(200);
    expect(names(byUnderscore.body.items)).toEqual(['tag underscore', 'under_score']);

    const byLiteralPercent = await request(app.getHttpServer())
      .get(`/api/projects?q=${encodeURIComponent('100%')}`)
      .expect(200);
    expect(names(byLiteralPercent.body.items)).toEqual(['100% pronto', 'somente tag']);
  });

  it('returns 400 when the payload is invalid', async () => {
    const missing = await request(app.getHttpServer())
      .post('/api/projects')
      .send({})
      .expect(400);
    expect(missing.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Os dados enviados são inválidos.',
        fields: { name: 'Informe o nome.' },
      },
    } satisfies ErrorBody);

    const tooLong = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'a'.repeat(121) })
      .expect(400);
    expect(tooLong.body.error.code).toBe('VALIDATION_ERROR');
    expect(tooLong.body.error.fields.name).toBe(
      'O nome deve ter no máximo 120 caracteres.',
    );

    const badStatus = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'Ok', status: 'finished' })
      .expect(400);
    expect(badStatus.body.error.fields.status).toBe('Escolha um status válido.');

    const badUrl = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'Ok', url: 'nao-e-url' })
      .expect(400);
    expect(badUrl.body.error.fields.url).toBe(
      'Informe uma URL válida, com http:// ou https://.',
    );

    const badTags = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'Ok', tags: 'react' })
      .expect(400);
    expect(badTags.body.error.fields.tags).toBe('As tags devem ser uma lista.');

    const badPage = await request(app.getHttpServer())
      .get('/api/projects?page=0')
      .expect(400);
    expect(badPage.body.error.code).toBe('VALIDATION_ERROR');
    expect(badPage.body.error.fields.page).toBe('A página deve ser maior ou igual a 1.');
  });

  it('returns 404 when the project does not exist', async () => {
    const missingId = '11111111-1111-1111-1111-111111111111';

    const getResponse = await request(app.getHttpServer())
      .get(`/api/projects/${missingId}`)
      .expect(404);
    expect(getResponse.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Projeto não encontrado.' },
    });

    const patchResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${missingId}`)
      .send({ name: 'Novo' })
      .expect(404);
    expect(patchResponse.body.error.code).toBe('NOT_FOUND');

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/api/projects/${missingId}`)
      .expect(404);
    expect(deleteResponse.body.error.code).toBe('NOT_FOUND');
  });

  it('logs 500 errors and keeps the error response', () => {
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
    const exception = new Error('falha no banco');

    new ApiExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno.' },
    });
    expect(error).toHaveBeenCalledWith('falha no banco', exception.stack);
    error.mockRestore();
  });

  it('does not log validation errors as server errors', () => {
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    new ApiExceptionFilter().catch(
      new HttpException(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Os dados enviados são inválidos.',
          },
        },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

function names(items: Project[]): string[] {
  return items.map((item) => item.name).sort();
}
