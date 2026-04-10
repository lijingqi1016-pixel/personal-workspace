import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface BookmarkStore {
  bookmarks: BookmarkItem[];
  load: () => Promise<void>;
  add: (item: Omit<BookmarkItem, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (id: string, changes: Partial<BookmarkItem>) => Promise<void>;
}

const toBookmark = (row: Record<string, unknown>): BookmarkItem => ({
  id: row.id as string,
  title: row.title as string,
  url: row.url as string,
  icon: row.icon as string | undefined,
});

export const useBookmarkStore = create<BookmarkStore>((set) => ({
  bookmarks: [],

  load: async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('[BookmarkStore] load failed:', error.message); return; }
    if (data) set({ bookmarks: data.map(toBookmark) });
  },

  add: async (item) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ title: item.title, url: item.url, icon: item.icon })
      .select()
      .single();
    if (!error && data) set((s) => ({ bookmarks: [...s.bookmarks, toBookmark(data)] }));
  },

  remove: async (id) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
  },

  update: async (id, changes) => {
    await supabase.from('bookmarks').update(changes).eq('id', id);
    set((s) => ({
      bookmarks: s.bookmarks.map((b) => (b.id === id ? { ...b, ...changes } : b)),
    }));
  },
}));