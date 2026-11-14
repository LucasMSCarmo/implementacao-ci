import pg from 'pg';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const api = (path: string) => `${process.env.API_URL ?? 'http://localhost:3100'}${path}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function send(method: string, path: string, body?: unknown) {
  const res = await fetch(api(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
}

beforeEach(async () => {
  await pool.query('TRUNCATE tasks RESTART IDENTITY');
});

afterAll(async () => {
  await pool.end();
});

describe('API de tarefas + PostgreSQL', () => {
  it('GET /health confirma conexão com o banco', async () => {
    const res = await send('GET', '/health');
    expect(res).toEqual({ status: 200, body: { status: 'ok', database: 'up' } });
  });

  it('POST /tasks grava a tarefa no banco', async () => {
    const res = await send('POST', '/tasks', {
      title: 'Configurar CI',
      description: 'GitHub Actions',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Configurar CI', done: false });

    const { rows } = await pool.query('SELECT title, description, done FROM tasks WHERE id = $1', [
      res.body.id,
    ]);
    expect(rows[0]).toEqual({ title: 'Configurar CI', description: 'GitHub Actions', done: false });
  });

  it('GET /tasks lista as tarefas em ordem de criação', async () => {
    await send('POST', '/tasks', { title: 'A' });
    await send('POST', '/tasks', { title: 'B' });
    const res = await send('GET', '/tasks');
    expect(res.status).toBe(200);
    expect(res.body.map((t: { title: string }) => t.title)).toEqual(['A', 'B']);
  });

  it('GET /tasks?done= filtra pelo status no banco', async () => {
    await send('POST', '/tasks', { title: 'Feita', done: true });
    await send('POST', '/tasks', { title: 'Pendente' });
    const feitas = await send('GET', '/tasks?done=true');
    const pendentes = await send('GET', '/tasks?done=false');
    expect(feitas.body.map((t: { title: string }) => t.title)).toEqual(['Feita']);
    expect(pendentes.body.map((t: { title: string }) => t.title)).toEqual(['Pendente']);
  });

  it('PATCH /tasks/:id altera apenas os campos enviados', async () => {
    const { body } = await send('POST', '/tasks', { title: 'Original', description: 'desc' });
    const res = await send('PATCH', `/tasks/${body.id}`, { done: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Original', description: 'desc', done: true });

    const cleared = await send('PATCH', `/tasks/${body.id}`, { description: null });
    expect(cleared.body.description).toBeNull();
  });

  it('DELETE /tasks/:id remove do banco', async () => {
    const { body } = await send('POST', '/tasks', { title: 'Apagar' });
    expect((await send('DELETE', `/tasks/${body.id}`)).status).toBe(204);
    const { rowCount } = await pool.query('SELECT 1 FROM tasks WHERE id = $1', [body.id]);
    expect(rowCount).toBe(0);
    expect((await send('GET', `/tasks/${body.id}`)).status).toBe(404);
  });

  it('valida entrada antes de chegar ao banco', async () => {
    const res = await send('POST', '/tasks', { title: '' });
    expect(res.status).toBe(400);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM tasks');
    expect(rows[0].n).toBe(0);
  });

  it('trata tentativa de SQL injection como texto comum', async () => {
    const malicious = "x'); DROP TABLE tasks; --";
    const res = await send('POST', '/tasks', { title: malicious });
    expect(res.status).toBe(201);
    expect((await send('GET', `/tasks/${res.body.id}`)).body.title).toBe(malicious);
  });
});
