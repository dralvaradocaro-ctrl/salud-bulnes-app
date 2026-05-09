/**
 * SDM v2.3: marcar el bloque "subdireccion_medica" como horario fijo
 * de jornada completa (lun-jue 08:00-17:00, vie 08:00-16:00).
 *
 * Razón: el subdirector siempre debe aparecer ocupado en SDM toda la jornada
 * para que no le agenden pacientes/visitas, aunque pueda tener bloqueos
 * nominales (Selector, PSCV, etc.) superpuestos en el mismo horario.
 *
 * Uso:
 *   node scripts/update-sdm-subdireccion-fulltime-v1.mjs           (dry-run)
 *   node scripts/update-sdm-subdireccion-fulltime-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const NEW_PATTERN = {
  lun: [{ from: '08:00', to: '17:00' }],
  mar: [{ from: '08:00', to: '17:00' }],
  mie: [{ from: '08:00', to: '17:00' }],
  jue: [{ from: '08:00', to: '17:00' }],
  vie: [{ from: '08:00', to: '16:00' }],
};

console.log(`\n  subdireccion_medica → weekday_pattern jornada completa`);
console.log(`  Lun-Jue: 08:00-17:00`);
console.log(`  Vie:     08:00-16:00\n`);

if (!APPLY) {
  console.log('Dry-run. Agregá --apply.');
  process.exit(0);
}

const { error } = await supabase
  .from('sdm_block_templates')
  .update({
    weekday_pattern: NEW_PATTERN,
    weekly_hours: 35,
    default_schedule: '08:00-17:00 (Lun-Jue) · 08:00-16:00 (Vie)',
    notes: 'Bloqueo fijo de jornada del subdirector. Otros bloqueos nominales pueden superponerse.',
  })
  .eq('id', 'subdireccion_medica');

if (error) { console.error('❌', error.message); process.exit(1); }
console.log('✅ Actualizado.');
