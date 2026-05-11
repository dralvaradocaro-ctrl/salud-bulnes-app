/**
 * Cliente Supabase específico para el módulo SDM (Subdirección Médica).
 *
 * Inyecta el header `x-sdm-write-secret` en cada request para que las RLS
 * policies de escritura permitan INSERT/UPDATE/DELETE en las tablas sdm_*.
 *
 * El secret se lee de VITE_SDM_WRITE_SECRET (cliente). Si no está seteado,
 * los reads siguen funcionando (RLS permite SELECT a todos) pero los writes
 * fallarán con un mensaje claro.
 *
 * Configuración SQL (una sola vez):
 *   ALTER DATABASE postgres SET app.sdm_write_secret = '<tu_secret>';
 *   SELECT pg_reload_conf();
 *
 * Configuración .env:
 *   VITE_SDM_WRITE_SECRET=<tu_secret>
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh';
const SDM_WRITE_SECRET = import.meta.env.VITE_SDM_WRITE_SECRET || '';

export const sdmHasWriteSecret = !!SDM_WRITE_SECRET;

export const sdmSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: SDM_WRITE_SECRET
      ? { 'x-sdm-write-secret': SDM_WRITE_SECRET }
      : {},
  },
});

/** Helper para detectar errores de RLS por falta de secret y dar mensaje claro. */
export function explainSdmWriteError(error) {
  if (!error) return null;
  const msg = error.message || '';
  if (/row.level security|RLS|policy/i.test(msg)) {
    if (!sdmHasWriteSecret) {
      return 'Falta VITE_SDM_WRITE_SECRET en .env. Pedile al administrador el secret de escritura SDM.';
    }
    return 'Secret de escritura SDM inválido o policies no aplicadas. Verificá VITE_SDM_WRITE_SECRET y la migración 20260513120000_sdm_rls_strict.';
  }
  return msg;
}
