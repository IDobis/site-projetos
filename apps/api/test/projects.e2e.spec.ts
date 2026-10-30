import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/app.factory';
import { Project } from '../src/projects/project.types';

process.env.DATABASE_PATH = ':memory:';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

describe('Projects API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const listed = await request(app.getHttpServer()).get('/api/projects?pageSize=100');
    for (const item of listed.body.items as Project[]) {
      await request(app.getHttpServer()).delete(`/api/projects/${item.id}`);
    }
  });

  it('creates, edits, searches and removes a project', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/projects')
      .send({
        name: '  Site pessoal  ',
        description: 'Portfólio',
        url: 'https://exemplo.dev',
        tags: ['Next', ' react ', 'react'],
      })
      .expect(201);

    const project = created.body as Project;
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

    await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'API de notas', status: 'paused', tags: ['nestjs'] })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: '100% pronto', status: 'done', tags: ['qa'] })
      .expect(201);

    const byName = await request(app.getHttpServer())
      .get('/api/projects?q=pessoal')
      .expect(200);
    expect(byName.body.total).toBe(1);
    expect(byName.body.items[0].id).toBe(project.id);
    expect(byName.body.page).toBe(1);
    expect(byName.body.pageSize).toBe(20);

    const byTag = await request(app.getHttpServer())
      .get('/api/projects?q=NEST')
      .expect(200);
    expect(byTag.body.total).toBe(1);
    expect(byTag.body.items[0].name).toBe('API de notas');

    const byExactTag = await request(app.getHttpServer())
      .get('/api/projects?tag=Typescript')
      .expect(200);
    expect(byExactTag.body.items.map((item: Project) => item.id)).toEqual([project.id]);

    const byStatus = await request(app.getHttpServer())
      .get('/api/projects?status=done')
      .expect(200);
    expect(byStatus.body.total).toBe(1);
    expect(byStatus.body.items[0].name).toBe('100% pronto');

    const byPercent = await request(app.getHttpServer())
      .get('/api/projects?q=100%')
      .expect(200);
    expect(byPercent.body.items.map((item: Project) => item.name)).toEqual([
      '100% pronto',
    ]);

    const page = await request(app.getHttpServer())
      .get('/api/projects?page=2&pageSize=2')
      .expect(200);
    expect(page.body.total).toBe(3);
    expect(page.body.page).toBe(2);
    expect(page.body.pageSize).toBe(2);
    expect(page.body.items).toHaveLength(1);

    await request(app.getHttpServer()).delete(`/api/projects/${project.id}`).expect(204);
    await request(app.getHttpServer()).get(`/api/projects/${project.id}`).expect(404);
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
});
