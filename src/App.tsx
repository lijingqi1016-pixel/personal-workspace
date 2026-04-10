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
    <div className="workspace-bg">
      <header className="workspace-header">
        <h1 className="workspace-title">个人工作台</h1>
        <p className="workspace-date">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </header>

      {/* 顶部三栏：移动端单列 → 平板双列 → 桌面三列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6 items-stretch">
        <TodoWidget />
        <CalendarWidget />
        <PomodoroWidget />
      </div>

      {/* 底部：移动端单列 → 桌面 3:2 分栏 */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4 md:gap-6 items-stretch">
        <NoteWidget />
        <BookmarkWidget />
      </div>
    </div>
  );
}
