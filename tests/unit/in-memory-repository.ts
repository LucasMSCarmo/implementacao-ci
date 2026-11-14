import type { NewTask, Task, TaskChanges, TaskRepository } from '../../src/tasks/types.js';

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  private nextId = 1;

  async list(filter: { done?: boolean } = {}): Promise<Task[]> {
    return this.tasks.filter((t) => filter.done === undefined || t.done === filter.done);
  }
  async findById(id: number): Promise<Task | null> {
    return this.tasks.find((t) => t.id === id) ?? null;
  }
  async create(task: NewTask): Promise<Task> {
    const created = { id: this.nextId++, ...task, createdAt: new Date().toISOString() };
    this.tasks.push(created);
    return created;
  }
  async update(id: number, changes: TaskChanges): Promise<Task | null> {
    const task = await this.findById(id);
    if (!task) return null;
    Object.assign(task, changes);
    return task;
  }
  async remove(id: number): Promise<boolean> {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }
}
