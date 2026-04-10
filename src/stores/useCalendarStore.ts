import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  color: string;
  type: 'manual' | 'todo_sync';
}

interface CalendarStore {
  events: CalendarEvent[];
  load: () => Promise<void>;
  add: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const toEvent = (row: Record<string, unknown>): CalendarEvent => ({
  id: row.id as string,
  title: row.title as string,
  date: new Date(row.date as string),
  color: row.color as string,
  type: row.type as CalendarEvent['type'],
});

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],

  load: async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[CalendarStore] load failed:', error.message); return; }
    if (data) set({ events: data.map(toEvent) });
  },

  add: async (event) => {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: event.title,
        date: event.date,
        color: event.color,
        type: event.type,
      })
      .select()
      .single();
    if (!error && data) set((s) => ({ events: [...s.events, toEvent(data)] }));
  },

  remove: async (id) => {
    await supabase.from('events').delete().eq('id', id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));