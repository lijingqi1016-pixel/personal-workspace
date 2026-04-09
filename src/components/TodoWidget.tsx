import { useState, useRef } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useTodoStore } from '../stores/useTodoStore';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Todo } from '../lib/db';

const PRIORITY_CONFIG = {
  high:   { label: '高', color: '#FF3B30', bg: '#FFF1F0' },
  medium: { label: '中', color: '#FFCC00', bg: '#FFFBEB' },
  low:    { label: '低', color: '#34C759', bg: '#F0FFF4' },
};

const PRESET_TAGS = ['工作', '学习', '生活'];

function CountdownBadge({ dueDate }: { dueDate?: Date }) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const overdue = isPast(due) && !isToday(due);
  const text = overdue
    ? `逾期 ${formatDistanceToNow(due, { locale: zhCN })}`
    : isToday(due)
    ? '今天截止'
    : `剩余 ${formatDistanceToNow(due, { locale: zhCN, addSuffix: false })}`;

  return (
    <span
      style={{ color: overdue ? '#FF3B30' : '#8E8E93', fontSize: 11 }}
      className="ml-1 shrink-0"
    >
      {text}
    </span>
  );
}

export default function TodoWidget() {
  // load 由 App.tsx 统一调用，此处只读取响应式状态
  const { todos, add, toggle, remove } = useTodoStore();
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!input.trim()) return;
    await add({
      title: input.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: selectedTags,
      isCompleted: false,
    });
    setInput('');
    setDueDate('');
    setSelectedTags([]);
    setPriority('medium');
    setShowForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') setShowForm(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const active = todos.filter((t) => !t.isCompleted);
  const completed = todos.filter((t) => t.isCompleted);

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 380 }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>
          待办任务
          {active.length > 0 && (
            <span
              style={{
                marginLeft: 8, fontSize: 11, fontWeight: 500,
                background: '#007AFF', color: '#fff',
                borderRadius: 10, padding: '1px 7px',
              }}
            >
              {active.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => { setShowForm(!showForm); setTimeout(() => inputRef.current?.focus(), 50); }}
          style={{ color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
          className="hover:bg-blue-50 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 添加表单 */}
      {showForm && (
        <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <input
            ref={inputRef}
            className="input-ghost"
            placeholder="输入任务内容，回车确认..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ fontSize: 14, color: '#1C1C1E', marginBottom: 8 }}
          />
          <div className="flex items-center gap-2 flex-wrap">
            {/* 优先级 */}
            {(['high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                style={{
                  fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: priority === p ? PRIORITY_CONFIG[p].color : PRIORITY_CONFIG[p].bg,
                  color: priority === p ? '#fff' : PRIORITY_CONFIG[p].color,
                  transition: 'all 0.15s',
                }}
              >
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
            {/* 标签 */}
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: selectedTags.includes(tag) ? '#007AFF' : '#E5E5EA',
                  color: selectedTags.includes(tag) ? '#fff' : '#636366',
                  transition: 'all 0.15s',
                }}
              >
                {tag}
              </button>
            ))}
            {/* 日期 */}
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                fontSize: 11, color: '#636366', background: '#E5E5EA',
                border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer',
              }}
            />
          </div>
        </div>
      )}

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 280 }}>
        {active.length === 0 && !showForm && (
          <div style={{ color: '#C7C7CC', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
            点击 + 添加新任务
          </div>
        )}

        {active.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggle(todo.id!)}
            onDelete={() => setDeleteConfirm(todo.id!)}
            deleteConfirm={deleteConfirm === todo.id}
            onConfirmDelete={() => { remove(todo.id!); setDeleteConfirm(null); }}
            onCancelDelete={() => setDeleteConfirm(null)}
          />
        ))}

        {completed.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#C7C7CC', margin: '12px 0 4px', fontWeight: 500 }}>
              已完成 {completed.length}
            </div>
            {completed.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggle(todo.id!)}
                onDelete={() => remove(todo.id!)}
                deleteConfirm={false}
                onConfirmDelete={() => remove(todo.id!)}
                onCancelDelete={() => {}}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function TodoItem({
  todo, onToggle, onDelete, deleteConfirm, onConfirmDelete, onCancelDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const pc = PRIORITY_CONFIG[todo.priority];

  return (
    <div
      className="group flex items-start gap-3 py-2 px-1 rounded-xl transition-colors hover:bg-gray-50"
      style={{ opacity: todo.isCompleted ? 0.45 : 1 }}
    >
      {/* 圆形 Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 20, height: 20, borderRadius: '50%', border: `2px solid ${todo.isCompleted ? '#007AFF' : '#C7C7CC'}`,
          background: todo.isCompleted ? '#007AFF' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, marginTop: 1, transition: 'all 0.2s',
        }}
      >
        {todo.isCompleted && <Check size={11} color="#fff" strokeWidth={3} />}
      </button>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span
            style={{
              fontSize: 13, color: '#1C1C1E', fontWeight: 400,
              textDecoration: todo.isCompleted ? 'line-through' : 'none',
            }}
          >
            {todo.title}
          </span>
          {/* 优先级圆点 */}
          <span
            style={{ width: 6, height: 6, borderRadius: '50%', background: pc.color, display: 'inline-block', flexShrink: 0 }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {todo.tags.map((tag) => (
            <span
              key={tag}
              style={{ fontSize: 10, color: '#8E8E93', background: '#F2F2F7', borderRadius: 4, padding: '1px 5px' }}
            >
              {tag}
            </span>
          ))}
          <CountdownBadge dueDate={todo.dueDate} />
        </div>
      </div>

      {/* 删除按钮 */}
      {!todo.isCompleted && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {deleteConfirm ? (
            <>
              <button onClick={onConfirmDelete} style={{ fontSize: 10, color: '#FF3B30', background: '#FFF1F0', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>确认</button>
              <button onClick={onCancelDelete} style={{ fontSize: 10, color: '#8E8E93', background: '#F2F2F7', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>取消</button>
            </>
          ) : (
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7C7CC', padding: 2 }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}