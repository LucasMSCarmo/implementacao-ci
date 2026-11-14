import { createApp } from './app.js';
import { createPool } from './db.js';
import { PgTaskRepository } from './tasks/pg-repository.js';

const pool = createPool();
const app = createApp({
  tasks: new PgTaskRepository(pool),
  healthCheck: async () => {
    await pool.query('SELECT 1');
  },
});

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  console.log(`API de tarefas ouvindo na porta ${port}`);
});

function shutdown(): void {
  server.close(() => void pool.end().then(() => process.exit(0)));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
