import { Router } from 'express';
import type { TaskRepository } from './types.js';
import { parseDoneFilter, parseId, validateNewTask, validateTaskChanges } from './validation.js';

export function taskRoutes(repo: TaskRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const done = parseDoneFilter(req.query.done);
    if (!done.ok) return void res.status(400).json({ errors: done.errors });
    res.json(await repo.list({ done: done.value }));
  });

  router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return void res.status(400).json({ errors: ['id inválido'] });
    const task = await repo.findById(id);
    if (!task) return void res.status(404).json({ errors: ['tarefa não encontrada'] });
    res.json(task);
  });

  router.post('/', async (req, res) => {
    const result = validateNewTask(req.body);
    if (!result.ok) return void res.status(400).json({ errors: result.errors });
    const task = await repo.create(result.value);
    res.status(201).location(`/tasks/${task.id}`).json(task);
  });

  router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return void res.status(400).json({ errors: ['id inválido'] });
    const result = validateTaskChanges(req.body);
    if (!result.ok) return void res.status(400).json({ errors: result.errors });
    const task = await repo.update(id, result.value);
    if (!task) return void res.status(404).json({ errors: ['tarefa não encontrada'] });
    res.json(task);
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return void res.status(400).json({ errors: ['id inválido'] });
    const removed = await repo.remove(id);
    if (!removed) return void res.status(404).json({ errors: ['tarefa não encontrada'] });
    res.status(204).end();
  });

  return router;
}
