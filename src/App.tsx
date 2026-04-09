import { useEffect } from 'react';
import TodoWidget from './components/TodoWidget';
import CalendarWidget from './components/CalendarWidget';
import PomodoroWidget from './components/PomodoroWidget';
import NoteWidget from './components/NoteWidget';
import BookmarkWidget from './components/BookmarkWidget';
import { useTodoStore } from './stores/useTodoStore';
import { useCalendarStore } from './stores/useCalendarStore';
import { useBookmarkStore } from './stores/useBookmarkStore';
import './index.css';

export default function App() {
  // ✅ 统一在顶层加载所有 store 数据，避免各 Widget 独立 load 导致竞态覆盖
  const loadTodos = useTodoStore((s) => s.load);
  const loadEvents = useCalendarStore((s) => s.load);
  const loadBookmarks = useBookmarkStore((s) => s.load);

  useEffect(() => {
    loadTodos();
    loadEvents();
    loadBookmarks();
  }, [loadTodos, loadEvents, loadBookmarks]);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', padding: '32px 40px', boxSizing: 'border-box' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px', margin: 0 }}>个人工作台</h1>
        <p style={{ fontSize: 12, color: '#C7C7CC', marginTop: 4 }}>
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24, alignItems: 'stretch' }}>
        <TodoWidget />
        <CalendarWidget />
        <PomodoroWidget />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, alignItems: 'stretch' }}>
        <NoteWidget />
        <BookmarkWidget />
      </div>
    </div>
  );
}
