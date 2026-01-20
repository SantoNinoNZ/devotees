import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // Disable auto URL detection - we handle OAuth tokens manually in /auth/callback
    detectSessionInUrl: false,
    flowType: 'implicit',
    storageKey: 'devotees-auth',
    // No-op lock to avoid AbortError with navigator.locks API in Next.js
    lock: async (_name, _acquireTimeout, fn) => await fn(),
  },
});
