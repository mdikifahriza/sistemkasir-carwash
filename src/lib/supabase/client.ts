import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase env belum diisi');
  }

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Singleton instance
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return createSupabaseBrowserClient();
  }

  // Client-side: use singleton
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseBrowserClient();
  }
  return supabaseInstance;
})();

