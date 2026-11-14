import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.js';

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');

async function migrate(): Promise<void> {
  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
      if (applied.rowCount) continue;
      // nome vem da listagem da pasta migrations/ do próprio projeto, não de entrada do usuário
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`migração aplicada: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
