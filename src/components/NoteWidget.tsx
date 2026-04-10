import { useEffect, useCallback, useRef, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { supabase } from '../lib/supabase';

// 固定使用同一条笔记记录（单篇备忘录）
const NOTE_SLUG = 'main';

export default function NoteWidget() {
  const editor = useCreateBlockNote();
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const noteIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 初始化：从 Supabase 读取备忘录内容 ──
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('title', NOTE_SLUG)
        .maybeSingle();

      if (error) {
        console.error('[NoteWidget] load failed:', error.message);
        setLoaded(true);
        return;
      }

      if (data) {
        noteIdRef.current = data.id;
        if (data.content) {
          try {
            const blocks = JSON.parse(data.content);
            await editor.replaceBlocks(editor.document, blocks);
          } catch (_) { /* 内容格式错误时静默跳过，从空白开始 */ }
        }
      } else {
        // 首次使用，创建记录
        const { data: created, error: createErr } = await supabase
          .from('notes')
          .insert({ title: NOTE_SLUG, content: '' })
          .select()
          .single();
        if (!createErr && created) noteIdRef.current = created.id;
      }

      setLoaded(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 防抖自动保存（600ms 无操作后写入 Supabase）──
  const handleChange = useCallback(() => {
    if (!loaded) return;
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const content = JSON.stringify(editor.document);
      const id = noteIdRef.current;
      if (!id) return;

      const { error } = await supabase
        .from('notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);

      setSaveStatus(error ? 'error' : 'saved');
      if (error) console.error('[NoteWidget] save failed:', error.message);
    }, 600);
  }, [editor, loaded]);

  const statusText = {
    saved: '已同步',
    saving: '保存中…',
    error: '保存失败',
  };
  const statusColor = {
    saved: '#C7C7CC',
    saving: '#FFCC00',
    error: '#FF3B30',
  };

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 340 }}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>临时备忘录</h2>
        <span style={{ fontSize: 10, color: statusColor[saveStatus], transition: 'color 0.3s' }}>
          {statusText[saveStatus]}
        </span>
      </div>

      {/* 编辑器区域 */}
      <div
        style={{ flex: 1, overflow: 'hidden', borderRadius: 12 }}
        className="blocknote-wrapper"
      >
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="light"
          style={{ height: '100%', fontSize: 13 }}
        />
      </div>
    </div>
  );
}