import { create } from 'zustand';
import { db, type CalendarEvent } from '../lib/db';

interface CalendarStore {
  events: CalendarEvent[];
  load: () => Promise<void>;
  add: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],

  load: async () => {
    const events = await db.events.toArray();
    set({ events });
  },

  add: async (event) => {
    const id = await db.events.add(event);
    const newEvent = await db.events.get(id as number);
    if (newEvent) set((s) => ({ events: [...s.events, newEvent] }));
  },

  remove: async (id) => {
    await db.events.delete(id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));
