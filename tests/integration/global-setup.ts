import { execFileSync, spawn, type ChildProcess } from 'node:child_process';

// Os testes de integração exercitam o artefato do build (dist/) rodando de verdade,
// conectado a um PostgreSQL real.
const PORT = process.env.TEST_PORT ?? '3100';
let server: ChildProcess | undefined;

async function waitForHealth(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // servidor ainda subindo
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`API não respondeu em ${url}`);
}

export async function setup(): Promise<void> {
  if (!process.env.DATABASE_URL)
    throw new Error('DATABASE_URL é obrigatória nos testes de integração');
  execFileSync('node', ['dist/migrate.js'], { stdio: 'inherit' });
  server = spawn('node', ['dist/server.js'], {
    env: { ...process.env, PORT },
    stdio: 'inherit',
  });
  process.env.API_URL = `http://localhost:${PORT}`;
  await waitForHealth(`${process.env.API_URL}/health`);
}

export async function teardown(): Promise<void> {
  server?.kill('SIGTERM');
}
