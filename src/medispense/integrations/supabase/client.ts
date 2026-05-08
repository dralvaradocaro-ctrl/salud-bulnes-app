// Cliente Supabase EXCLUSIVO para la sub-app medispense.
// Usa un storageKey distinto para que la sesión NO interfiera con la
// sesión del cliente principal de salud-bulnes (que vive en otra key).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      storageKey: 'sb-medispense-auth-token',
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
