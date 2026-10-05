import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

// Klien server dengan service role: hanya dipakai di API untuk Storage, tidak pernah dikirim ke browser.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
