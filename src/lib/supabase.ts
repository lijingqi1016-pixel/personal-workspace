import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tkgjposjjuluttsjxlnd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HH76D-q4Ri-syqPgniGxgQ_TicTVryc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
