import { create } from 'zustand';
import { db } from '../lib/db';

interface BookmarkItem {
  id?: number;
  title: string;
  url: string;
  order: number;
}

interface BookmarkStore {
  bookmarks: BookmarkItem[];
  load: () => Promise<void>;
  add: (item: Omit<BookmarkItem, 'id' | 'order'>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  update: (id: number, changes: Partial<BookmarkItem>) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarks: [],

  load: async () => {
    const bookmarks = await db.bookmarks.orderBy('order').toArray();
    set({ bookmarks });
  },

  add: async (item) => {
    const order = get().bookmarks.length;
    const id = await db.bookmarks.add({ ...item, order });
    const newItem = await db.bookmarks.get(id as number);
    if (newItem) set((s) => ({ bookmarks: [...s.bookmarks, newItem] }));
  },

  remove: async (id) => {
    await db.bookmarks.delete(id);
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
  },

  update: async (id, changes) => {
    await db.bookmarks.update(id, changes);
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    }));
  },
}));
