import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, isSameMonth, addMonths, subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTodoStore } from '../stores/useTodoStore';
import { useCalendarStore } from '../stores/useCalendarStore';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const PRIORITY_COLORS: Record<string, string> = {
  high: '#FF3B30', medium: '#FFCC00', low: '#34C759',
};

const EVENT_COLORS = ['#007AFF', '#FF3B30', '#FFCC00', '#34C759', '#AF52DE', '#FF9500'];

export default function CalendarWidget() {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]);
  const [tooltip, setTooltip] = useState<{ date: Date; x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // todos 直接读取共享 store，由 App.tsx 统一加载，此处不重复 loadTodos
  const { todos } = useTodoStore();
  const { events, load: loadEvents, add: addEvent, remove: removeEvent } = useCalendarStore();

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // 点击 panel 外部时关闭
  useEffect(() => {
    if (!showInput) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInput]);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  // 聚合当天事项（待办 + 手动），已完成的待办不显示
  const getDayItems = (date: Date) => {
    const todoItems = todos
      .filter((t) => !t.isCompleted && t.dueDate && isSameDay(new Date(t.dueDate), date))
      .map((t) => ({ title: t.title, color: PRIORITY_COLORS[t.priority], type: 'todo' }));
    const eventItems = events
      .filter((e) => isSameDay(new Date(e.date), date))
      .map((e) => ({ title: e.title, color: e.color, type: 'event', id: e.id }));
    return [...todoItems, ...eventItems];
  };

  const handleDayClick = (date: Date, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // 计算弹窗位置，优先在点击元素下方，避免超出屏幕
    const panelWidth = 300;
    const estimatedPanelHeight = 160;
    let x = rect.left;
    let y = rect.bottom + 6;
    if (x + panelWidth > window.innerWidth - 12) x = window.innerWidth - panelWidth - 12;
    if (y + estimatedPanelHeight > window.innerHeight - 12) y = rect.top - estimatedPanelHeight - 6;
    setSelected(date);
    setPanelPos({ x, y });
    setShowInput(true);
    setTooltip(null);
    e.stopPropagation();
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim() || !selected) return;
    await addEvent({ title: eventTitle.trim(), date: selected, color: eventColor, type: 'manual' });
    setEventTitle('');
    setShowInput(false);
  };

  return (
    <>
    <div className="card flex flex-col h-full" style={{ minHeight: 380 }} onClick={() => { setShowInput(false); setTooltip(null); }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>
          {format(current, 'yyyy年 M月', { locale: zhCN })}
        </h2>
        <div className="flex items-center gap-1">
          <NavBtn onClick={(e) => { e.stopPropagation(); setCurrent(subMonths(current, 1)); }}>
            <ChevronLeft size={15} />
          </NavBtn>
          <NavBtn onClick={(e) => { e.stopPropagation(); setCurrent(new Date()); }}>
            <span style={{ fontSize: 10 }}>今</span>
          </NavBtn>
          <NavBtn onClick={(e) => { e.stopPropagation(); setCurrent(addMonths(current, 1)); }}>
            <ChevronRight size={15} />
          </NavBtn>
        </div>
      </div>

      {/* 星期表头 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEK_DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#C7C7CC', fontWeight: 500, padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0', flex: 1 }}>
        {/* 填充前置空格 */}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map((day) => {
          const items = getDayItems(day);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, current);
          const isSelected = selected && isSameDay(day, selected);

          return (
            <div
              key={day.toISOString()}
              onClick={(e) => handleDayClick(day, e)}
              onMouseEnter={(e) => {
                if (items.length > 0) {
                  setTooltip({ date: day, x: e.clientX, y: e.clientY });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '3px 0', cursor: 'pointer', borderRadius: 8,
                background: isSelected ? 'rgba(0,122,255,0.08)' : 'transparent',
                transition: 'background 0.15s',
              }}
              className="hover:bg-gray-50"
            >
              {/* 日期数字 */}
              <div
                style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: isCurrentDay ? 600 : 400,
                  color: isCurrentDay ? '#fff' : isCurrentMonth ? '#1C1C1E' : '#C7C7CC',
                  background: isCurrentDay ? '#007AFF' : 'transparent',
                }}
              >
                {format(day, 'd')}
              </div>
              {/* 事项圆点（最多3个） */}
              {items.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {items.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      style={{ width: 4, height: 4, borderRadius: '50%', background: item.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>

    {/* ===== Portal: 事项弹出面板 (脱离 card overflow:hidden) ===== */}
    {showInput && selected && panelPos && createPortal(
      <div
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: panelPos.x,
          top: panelPos.y,
          width: 300,
          background: '#fff',
          borderRadius: 14,
          padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
          zIndex: 9998,
          animation: 'fadeIn 0.15s ease',
        }}
      >
        {/* 标题行 */}
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>
            {format(selected, 'M月d日', { locale: zhCN })}
          </span>
          <button onClick={() => setShowInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7C7CC', padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        {/* 当天所有事项（含 todo + event） */}
        {getDayItems(selected).length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {getDayItems(selected).map((item, i) => (
              <div key={i} className="flex items-center gap-2" style={{ padding: '4px 0', borderBottom: '1px solid #F2F2F7' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#1C1C1E', flex: 1, lineHeight: 1.4 }}>{item.title}</span>
                <span style={{ fontSize: 10, color: '#C7C7CC', flexShrink: 0 }}>
                  {item.type === 'todo' ? '待办' : '事项'}
                </span>
                {'id' in item && typeof (item as { id?: number }).id === 'number' && (
                  <button
                    onClick={() => removeEvent((item as { id: number }).id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7C7CC', padding: 0 }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 添加新事项 */}
        <div style={{ fontSize: 11, color: '#8E8E93', marginBottom: 6 }}>添加事项</div>
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className="input-ghost flex-1"
            placeholder="事项内容..."
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddEvent(); if (e.key === 'Escape') setShowInput(false); }}
            style={{ fontSize: 12, color: '#1C1C1E', padding: '4px 0' }}
          />
          <button
            onClick={handleAddEvent}
            style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
          >
            <Plus size={12} />
          </button>
        </div>
        {/* 颜色选择 */}
        <div className="flex gap-1.5 mt-2">
          {EVENT_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => setEventColor(c)}
              style={{
                width: 16, height: 16, borderRadius: '50%', background: c,
                cursor: 'pointer', border: eventColor === c ? '2px solid #1C1C1E' : '2px solid transparent',
                transition: 'border 0.1s',
              }}
            />
          ))}
        </div>
      </div>,
      document.body
    )}

    {/* ===== Portal: Hover Tooltip ===== */}
    {tooltip && (() => {
      const items = getDayItems(tooltip.date);
      return items.length > 0 ? createPortal(
        <div
          style={{
            position: 'fixed', left: tooltip.x + 8, top: tooltip.y + 8,
            background: 'rgba(28,28,30,0.92)', borderRadius: 10, padding: '8px 12px',
            zIndex: 9999, pointerEvents: 'none', minWidth: 140,
            backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            {format(tooltip.date, 'M月d日', { locale: zhCN })}
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#fff' }}>{item.title}</span>
            </div>
          ))}
        </div>,
        document.body
      ) : null;
    })()}
    </>
  );
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', color: '#636366',
        width: 24, height: 24, borderRadius: 6, display: 'flex',
        alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s',
      }}
      className="hover:bg-gray-100"
    >
      {children}
    </button>
  );
}
