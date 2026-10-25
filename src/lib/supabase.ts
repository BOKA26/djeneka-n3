import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://retmgeziuujgfwidsumd.supabase.co'
).trim();

const SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_lsO8n9EGLP0M8a9TcLPzZQ_cuVWDswp'
).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export default supabase;
