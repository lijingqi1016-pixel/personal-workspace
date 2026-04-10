import { useState, useEffect } from 'react';
import { Plus, X, ExternalLink, Pencil } from 'lucide-react';
import { useBookmarkStore } from '../stores/useBookmarkStore';

function getFavicon(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

export default function BookmarkWidget() {
  const { bookmarks, load, add, remove, update } = useBookmarkStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    if (!title.trim() || !cleanUrl) return;
    if (editId !== null) {
      await update(editId, { title: title.trim(), url: cleanUrl });
      setEditId(null);
    } else {
      await add({ title: title.trim(), url: cleanUrl });
    }
    setTitle('');
    setUrl('');
    setShowForm(false);
  };

  const startEdit = (id: string, t: string, u: string) => {
    setEditId(id);
    setTitle(t);
    setUrl(u);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setTitle('');
    setUrl('');
  };

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 340 }}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>常用网页</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setTitle(''); setUrl(''); }}
          style={{ color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 }}
          className="hover:bg-blue-50 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <input
            autoFocus
            className="input-ghost"
            placeholder="网站名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ fontSize: 13, color: '#1C1C1E', marginBottom: 6, borderBottom: '1px solid #E5E5EA', paddingBottom: 4 }}
          />
          <input
            className="input-ghost"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') cancelForm(); }}
            style={{ fontSize: 12, color: '#636366' }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSubmit}
              style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 12, cursor: 'pointer' }}
            >
              {editId !== null ? '保存' : '添加'}
            </button>
            <button
              onClick={cancelForm}
              style={{ background: '#E5E5EA', color: '#636366', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 书签列表 */}
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 && (
          <div style={{ color: '#C7C7CC', fontSize: 13, textAlign: 'center', paddingTop: 32 }}>
            点击 + 添加常用网页
          </div>
        )}
        {bookmarks.map((bm) => (
          <a
            key={bm.id}
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors hover:bg-gray-50 no-underline"
            style={{ textDecoration: 'none' }}
          >
            {/* Favicon */}
            <div
              style={{
                width: 28, height: 28, borderRadius: 7, overflow: 'hidden',
                background: '#F2F2F7', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {getFavicon(bm.url) ? (
                <img
                  src={getFavicon(bm.url)!}
                  alt=""
                  width={16}
                  height={16}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <ExternalLink size={12} color="#C7C7CC" />
              )}
            </div>

            {/* 文字 */}
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, color: '#1C1C1E', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bm.title}
              </div>
              <div style={{ fontSize: 10, color: '#C7C7CC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bm.url}
              </div>
            </div>

            {/* 操作按钮（Hover 显示） */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(bm.id!, bm.title, bm.url); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7C7CC', padding: 2, borderRadius: 4 }}
                className="hover:text-blue-500"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(bm.id!); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7C7CC', padding: 2, borderRadius: 4 }}
                className="hover:text-red-400"
              >
                <X size={12} />
              </button>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
