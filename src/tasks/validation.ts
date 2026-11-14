import type { NewTask, TaskChanges } from './types.js';

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 1000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkTitle(title: unknown, errors: string[]): string | undefined {
  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title é obrigatório e deve ser um texto não vazio');
    return undefined;
  }
  if (title.trim().length > TITLE_MAX) {
    errors.push(`title deve ter no máximo ${TITLE_MAX} caracteres`);
    return undefined;
  }
  return title.trim();
}

function checkDescription(description: unknown, errors: string[]): string | null | undefined {
  if (description === undefined || description === null) return null;
  if (typeof description !== 'string') {
    errors.push('description deve ser um texto');
    return undefined;
  }
  if (description.length > DESCRIPTION_MAX) {
    errors.push(`description deve ter no máximo ${DESCRIPTION_MAX} caracteres`);
    return undefined;
  }
  return description;
}

function checkDone(done: unknown, errors: string[]): boolean | undefined {
  if (typeof done !== 'boolean') {
    errors.push('done deve ser booleano');
    return undefined;
  }
  return done;
}

export function validateNewTask(body: unknown): Result<NewTask> {
  if (!isObject(body))
    return { ok: false, errors: ['corpo da requisição deve ser um objeto JSON'] };
  const errors: string[] = [];
  const title = checkTitle(body.title, errors);
  const description = checkDescription(body.description, errors);
  const done = body.done === undefined ? false : checkDone(body.done, errors);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { title: title!, description: description ?? null, done: done! } };
}

export function validateTaskChanges(body: unknown): Result<TaskChanges> {
  if (!isObject(body))
    return { ok: false, errors: ['corpo da requisição deve ser um objeto JSON'] };
  const errors: string[] = [];
  const changes: TaskChanges = {};
  if ('title' in body) {
    const title = checkTitle(body.title, errors);
    if (title !== undefined) changes.title = title;
  }
  if ('description' in body) {
    const description = checkDescription(body.description, errors);
    if (description !== undefined) changes.description = description;
  }
  if ('done' in body) {
    const done = checkDone(body.done, errors);
    if (done !== undefined) changes.done = done;
  }
  if (errors.length > 0) return { ok: false, errors };
  if (Object.keys(changes).length === 0) {
    return { ok: false, errors: ['informe ao menos um campo: title, description ou done'] };
  }
  return { ok: true, value: changes };
}

export function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
