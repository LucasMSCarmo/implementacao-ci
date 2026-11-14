import { describe, expect, it } from 'vitest';
import {
  parseDoneFilter,
  parseId,
  validateNewTask,
  validateTaskChanges,
} from '../../src/tasks/validation.js';

describe('validateNewTask', () => {
  it('aceita tarefa válida e aplica valores padrão', () => {
    expect(validateNewTask({ title: '  Estudar CI  ' })).toEqual({
      ok: true,
      value: { title: 'Estudar CI', description: null, done: false },
    });
  });

  it('rejeita título ausente ou vazio', () => {
    expect(validateNewTask({}).ok).toBe(false);
    expect(validateNewTask({ title: '   ' }).ok).toBe(false);
  });

  it('rejeita título longo demais', () => {
    expect(validateNewTask({ title: 'a'.repeat(121) }).ok).toBe(false);
  });

  it('rejeita tipos inválidos e acumula os erros', () => {
    const result = validateNewTask({ title: 1, description: 2, done: 'sim' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(3);
  });

  it('rejeita corpo que não é objeto', () => {
    expect(validateNewTask(null).ok).toBe(false);
    expect(validateNewTask([]).ok).toBe(false);
  });
});

describe('validateTaskChanges', () => {
  it('aceita alteração parcial', () => {
    expect(validateTaskChanges({ done: true })).toEqual({ ok: true, value: { done: true } });
  });

  it('permite limpar a descrição com null', () => {
    expect(validateTaskChanges({ description: null })).toEqual({
      ok: true,
      value: { description: null },
    });
  });

  it('rejeita corpo sem campos conhecidos', () => {
    expect(validateTaskChanges({ foo: 1 }).ok).toBe(false);
  });

  it('rejeita done não booleano', () => {
    expect(validateTaskChanges({ done: 'true' }).ok).toBe(false);
  });
});

describe('parseId', () => {
  it.each([
    ['1', 1],
    ['42', 42],
    ['0', null],
    ['-1', null],
    ['abc', null],
    ['1.5', null],
    ['99999999999999999999', null],
  ])('parseId(%s) = %s', (raw, expected) => {
    expect(parseId(raw)).toBe(expected);
  });
});

describe('parseDoneFilter', () => {
  it('converte true/false e ignora ausência', () => {
    expect(parseDoneFilter('true')).toEqual({ ok: true, value: true });
    expect(parseDoneFilter('false')).toEqual({ ok: true, value: false });
    expect(parseDoneFilter(undefined)).toEqual({ ok: true, value: undefined });
  });

  it('rejeita valores inválidos', () => {
    expect(parseDoneFilter('sim').ok).toBe(false);
    expect(parseDoneFilter(['true']).ok).toBe(false);
  });
});
