import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { InMemoryTaskRepository } from './in-memory-repository.js';

let healthy = true;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  healthy = true;
  app = createApp({
    tasks: new InMemoryTaskRepository(),
    healthCheck: async () => {
      if (!healthy) throw new Error('db down');
    },
  });
});

describe('rotas /tasks (repositório em memória)', () => {
  it('cria e busca uma tarefa', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Nova' }).expect(201);
    expect(created.headers.location).toBe(`/tasks/${created.body.id}`);
    const found = await request(app).get(`/tasks/${created.body.id}`).expect(200);
    expect(found.body.title).toBe('Nova');
  });

  it('retorna 400 para dados inválidos', async () => {
    const res = await request(app).post('/tasks').send({ title: '' }).expect(400);
    expect(res.body.errors).toBeDefined();
  });

  it('retorna 400 para JSON malformado', async () => {
    await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);
  });

  it('retorna 400 para id inválido e 404 para id inexistente', async () => {
    await request(app).get('/tasks/abc').expect(400);
    await request(app).get('/tasks/999').expect(404);
    await request(app).patch('/tasks/999').send({ done: true }).expect(404);
    await request(app).delete('/tasks/999').expect(404);
  });

  it('atualiza e remove uma tarefa', async () => {
    const { body } = await request(app).post('/tasks').send({ title: 'X' });
    const updated = await request(app).patch(`/tasks/${body.id}`).send({ done: true }).expect(200);
    expect(updated.body.done).toBe(true);
    await request(app).delete(`/tasks/${body.id}`).expect(204);
    await request(app).get(`/tasks/${body.id}`).expect(404);
  });

  it('retorna 404 para rota desconhecida', async () => {
    await request(app).get('/nada').expect(404);
  });
});

describe('GET /health', () => {
  it('retorna 200 quando o banco responde', async () => {
    await request(app).get('/health').expect(200, { status: 'ok', database: 'up' });
  });

  it('retorna 503 quando o banco está fora', async () => {
    healthy = false;
    await request(app).get('/health').expect(503);
  });
});
