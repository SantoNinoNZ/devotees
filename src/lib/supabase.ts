import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uvxrdmwmscevovbbrnky.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2eHJkbXdtc2Nldm92YmJybmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjU4MjEsImV4cCI6MjA4MzUwMTgyMX0.KrS5XFRnHdBr6OJo1ssbgMrOA4rLhybmlsGTnw49-tA';

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
