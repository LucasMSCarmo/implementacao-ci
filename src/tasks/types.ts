export interface Task {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: string;
}

export interface NewTask {
  title: string;
  description: string | null;
  done: boolean;
}

export type TaskChanges = Partial<NewTask>;

export interface TaskRepository {
  list(filter?: { done?: boolean }): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  create(task: NewTask): Promise<Task>;
  update(id: number, changes: TaskChanges): Promise<Task | null>;
  remove(id: number): Promise<boolean>;
}
