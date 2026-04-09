import { create } from 'zustand';
import { db, type Todo } from '../lib/db';

interface TodoStore {
  todos: Todo[];
  load: () => Promise<void>;
  add: (todo: Omit<Todo, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: number, changes: Partial<Todo>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  toggle: (id: number) => Promise<void>;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],

  load: async () => {
    const todos = await db.todos.toArray();
    // createdAt 未在 Dexie schema 中索引，用 JS 排序避免 orderBy 静默失败
    todos.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    set({ todos });
  },

  add: async (todo) => {
    const id = await db.todos.add({ ...todo, createdAt: new Date() });
    const newTodo = await db.todos.get(id as number);
    if (newTodo) set((s) => ({ todos: [newTodo, ...s.todos] }));
  },

  update: async (id, changes) => {
    await db.todos.update(id, changes);
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
  },

  remove: async (id) => {
    await db.todos.delete(id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },

  toggle: async (id) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    const isCompleted = !todo.isCompleted;
    await db.todos.update(id, { isCompleted });
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, isCompleted } : t)),
    }));
  },
}));
