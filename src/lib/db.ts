import Dexie, { type Table } from 'dexie';

export interface Todo {
  id?: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  tags: string[];
  isCompleted: boolean;
  createdAt: Date;
}

export interface CalendarEvent {
  id?: number;
  title: string;
  date: Date;
  color: string;
  type: 'todo_sync' | 'manual';
  refTodoId?: number;
}

export interface Note {
  id?: number;
  content: string; // BlockNote JSON string
  updatedAt: Date;
}

export interface Bookmark {
  id?: number;
  title: string;
  url: string;
  order: number;
}

export class WorkspaceDB extends Dexie {
  todos!: Table<Todo, number>;
  events!: Table<CalendarEvent, number>;
  notes!: Table<Note, number>;
  bookmarks!: Table<Bookmark, number>;

  constructor() {
    super('PersonalWorkspaceDB');
    this.version(1).stores({
      todos: '++id, priority, dueDate, isCompleted',
      events: '++id, date, type',
      notes: '++id, updatedAt',
      bookmarks: '++id, order',
    });
  }
}

export const db = new WorkspaceDB();
