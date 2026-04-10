import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date | null;
  createdAt: Date;
}

interface TodoStore {
  todos: Todo[];
  load: () => Promise<void>;
  add: (todo: Omit<Todo, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, changes: Partial<Todo>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggle: (id: string) => Promise<void>;
}

// 数据库行 → 本地对象
const toTodo = (row: Record<string, unknown>): Todo => ({
  id: row.id as string,
  title: row.title as string,
  isCompleted: row.is_completed as boolean,
  priority: row.priority as Todo['priority'],
  dueDate: row.due_date ? new Date(row.due_date as string) : null,
  createdAt: new Date(row.created_at as string),
});

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],

  load: async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[TodoStore] load failed:', error.message);
      return;
    }
    if (data) set({ todos: data.map(toTodo) });
  },

  add: async (todo) => {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        title: todo.title,
        is_completed: todo.isCompleted ?? false,
        priority: todo.priority ?? 'medium',
        due_date: todo.dueDate ?? null,
      })
      .select()
      .single();
    if (error) { console.error('[TodoStore] add failed:', error.message); return; }
    if (data) set((s) => ({ todos: [toTodo(data), ...s.todos] }));
  },

  update: async (id, changes) => {
    const dbChanges: Record<string, unknown> = {};
    if (changes.title !== undefined) dbChanges.title = changes.title;
    if (changes.isCompleted !== undefined) dbChanges.is_completed = changes.isCompleted;
    if (changes.priority !== undefined) dbChanges.priority = changes.priority;
    if (changes.dueDate !== undefined) dbChanges.due_date = changes.dueDate;
    await supabase.from('todos').update(dbChanges).eq('id', id);
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    }));
  },

  remove: async (id) => {
    await supabase.from('todos').delete().eq('id', id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },

  toggle: async (id) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;
    const isCompleted = !todo.isCompleted;
    await supabase.from('todos').update({ is_completed: isCompleted }).eq('id', id);
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, isCompleted } : t)),
    }));
  },
}));