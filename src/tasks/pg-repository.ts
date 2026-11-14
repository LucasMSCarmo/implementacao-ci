import type { Pool } from 'pg';
import type { NewTask, Task, TaskChanges, TaskRepository } from './types.js';

interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  created_at: Date;
}

const COLUMNS = 'id, title, description, done, created_at';

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    done: row.done,
    createdAt: row.created_at.toISOString(),
  };
}

export class PgTaskRepository implements TaskRepository {
  constructor(private readonly pool: Pool) {}

  async list(filter: { done?: boolean } = {}): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      `SELECT ${COLUMNS} FROM tasks WHERE ($1::boolean IS NULL OR done = $1) ORDER BY id`,
      [filter.done ?? null],
    );
    return rows.map(toTask);
  }

  async findById(id: number): Promise<Task | null> {
    const { rows } = await this.pool.query<TaskRow>(`SELECT ${COLUMNS} FROM tasks WHERE id = $1`, [
      id,
    ]);
    return rows[0] ? toTask(rows[0]) : null;
  }

  async create(task: NewTask): Promise<Task> {
    const { rows } = await this.pool.query<TaskRow>(
      `INSERT INTO tasks (title, description, done) VALUES ($1, $2, $3) RETURNING ${COLUMNS}`,
      [task.title, task.description, task.done],
    );
    return toTask(rows[0]!);
  }

  async update(id: number, changes: TaskChanges): Promise<Task | null> {
    // COALESCE mantém o valor atual quando o campo não foi enviado
    const { rows } = await this.pool.query<TaskRow>(
      `UPDATE tasks SET
         title = COALESCE($2, title),
         description = CASE WHEN $3::boolean THEN $4 ELSE description END,
         done = COALESCE($5, done)
       WHERE id = $1 RETURNING ${COLUMNS}`,
      [
        id,
        changes.title ?? null,
        'description' in changes,
        changes.description ?? null,
        changes.done ?? null,
      ],
    );
    return rows[0] ? toTask(rows[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}
