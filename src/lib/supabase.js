import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase env vars. Copy .env.example → .env and fill in your values.');
}

export const db = createClient(url, key);
