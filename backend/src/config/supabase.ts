// ============================================
// Supabase Client - DESATIVADO
// O sistema agora usa MySQL local
// Este arquivo foi mantido para referência futura
// ============================================

// Para reativar o Supabase no futuro, descomente o código abaixo:
/*
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from './env';

export const supabase: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;
*/

// Placeholder export
export const supabase = null;
export default supabase;
