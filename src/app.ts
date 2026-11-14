import express, { type ErrorRequestHandler } from 'express';
import { taskRoutes } from './tasks/routes.js';
import type { TaskRepository } from './tasks/types.js';

export interface AppDeps {
  tasks: TaskRepository;
  healthCheck: () => Promise<void>;
}

export function createApp(deps: AppDeps): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    try {
      await deps.healthCheck();
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'error', database: 'down' });
    }
  });

  app.use('/tasks', taskRoutes(deps.tasks));

  app.use((_req, res) => {
    res.status(404).json({ errors: ['rota não encontrada'] });
  });

  const errorHandler: ErrorRequestHandler = (err: { type?: string }, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return void res.status(400).json({ errors: ['JSON inválido'] });
    }
    console.error(err);
    res.status(500).json({ errors: ['erro interno'] });
  };
  app.use(errorHandler);

  return app;
}
