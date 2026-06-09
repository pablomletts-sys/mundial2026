// Shared Supabase client factory — disables Realtime to avoid ws errors on Node 18
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: { persistSession: false },
      global: { fetch },
      realtime: { transport: ws },
    }
  );
}
