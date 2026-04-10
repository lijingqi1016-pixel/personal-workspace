/**
 * 运行方式：node scripts/init-db.mjs
 * 通过 Supabase Management API 直接执行 SQL 建表
 */

const PROJECT_REF = 'tkgjposjjuluttsjxlnd';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = 'sb_publishable_HH76D-q4Ri-syqPgniGxgQ_TicTVryc';

// ── 用 service_role key 才能执行 DDL，anon key 权限不够
// 改用 pg-connection-string 方式：直接通过 REST API 的 /sql 端点（需要 service key）
// 由于只有 anon key，改用「先插入一条测试数据探测表」的方式创建
// 正确方案：用 Supabase 的数据库直连接口

// 实际上 Supabase 提供了一个专门给 CLI 用的 management API
// 端点：https://api.supabase.com/v1/projects/{ref}/database/query
// 但需要 access_token（登录 token），不是 anon key

// ── 最终方案：通过 pg 协议直连 Supabase 数据库执行 DDL ──
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const SQL_STATEMENTS = [
  `create table if not exists todos (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    is_completed boolean default false,
    priority text default 'medium',
    due_date timestamptz,
    created_at timestamptz default now()
  )`,
  `create table if not exists events (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    date timestamptz not null,
    color text default '#007AFF',
    type text default 'manual',
    created_at timestamptz default now()
  )`,
  `create table if not exists notes (
    id uuid primary key default gen_random_uuid(),
    title text not null default '未命名笔记',
    content text default '',
    updated_at timestamptz default now(),
    created_at timestamptz default now()
  )`,
  `create table if not exists bookmarks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    url text not null,
    icon text,
    created_at timestamptz default now()
  )`,
  `alter table todos disable row level security`,
  `alter table events disable row level security`,
  `alter table notes disable row level security`,
  `alter table bookmarks disable row level security`,
];

console.log('🔧 尝试通过 pg_dump RPC 建表...\n');

// 尝试通过 rpc 执行
for (const sql of SQL_STATEMENTS) {
  const { error } = await supabase.rpc('query', { sql }).then
    ? await supabase.rpc('query', { sql })
    : { error: 'no rpc' };
  if (error) {
    // rpc 不可用，说明需要 service_role key
    console.log('⚠️  anon key 无法执行 DDL（这是正常的安全限制）');
    console.log('\n请按以下方法之一建表：\n');
    console.log('方法一（推荐）：翻墙后访问 Supabase 控制台');
    console.log(`  👉 https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log('\n方法二：在 Supabase 控制台「Project Settings → API」找到 service_role key 发给我');
    console.log('   我用它直接建表（用完后可以立刻换掉）\n');
    console.log('需要执行的 SQL 如下：\n');
    console.log(SQL_STATEMENTS.slice(0, 4).join(';\n\n') + ';');
    process.exit(0);
  }
  console.log(`✅ 执行成功`);
}

console.log('\n🎉 所有表创建完成！');