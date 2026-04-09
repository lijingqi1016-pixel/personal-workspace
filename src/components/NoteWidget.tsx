import { useEffect, useCallback, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { db } from '../lib/db';

const NOTE_ID = 1; // 单篇备忘录

export default function NoteWidget() {
  const editor = useCreateBlockNote();
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useCallback(() => {
    let t: ReturnType<typeof setTimeout>;
    return (fn: () => void) => { clearTimeout(t); t = setTimeout(fn, 600); };
  }, [])();

  // 初始化：从 Dexie 读取内容
  useEffect(() => {
    (async () => {
      const note = await db.notes.get(NOTE_ID);
      if (note?.content) {
        try {
          const blocks = JSON.parse(note.content);
          await editor.replaceBlocks(editor.document, blocks);
        } catch (_) {}
      }
      setLoaded(true);
    })();
  }, [editor]);

  // 自动保存
  const handleChange = useCallback(() => {
    if (!loaded) return;
    saveTimer(async () => {
      const content = JSON.stringify(editor.document);
      const existing = await db.notes.get(NOTE_ID);
      if (existing) {
        await db.notes.update(NOTE_ID, { content, updatedAt: new Date() });
      } else {
        await db.notes.add({ id: NOTE_ID, content, updatedAt: new Date() });
      }
    });
  }, [editor, loaded, saveTimer]);

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 340 }}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1E' }}>临时备忘录</h2>
        <span style={{ fontSize: 10, color: '#C7C7CC' }}>自动保存</span>
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
