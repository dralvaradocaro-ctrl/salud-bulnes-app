/**
 * Carga turnos de DOMINGOS y VIERNES de mayo-julio 2026
 * (necesarios para calcular posturno del lunes = turno del domingo).
 *
 * Uso:
 *   node scripts/seed-sdm-calendar-domingos-v1.mjs           (dry-run)
 *   node scripts/seed-sdm-calendar-domingos-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Viernes y domingos extraídos del PDF "TURNOS 16.04.2026 - 31.07.2026"
const ENTRIES = [
  // Mayo
  ['2026-05-01', 4],  // viernes
  ['2026-05-03', 7],  // domingo
  ['2026-05-08', 5],
  ['2026-05-10', 1],
  ['2026-05-15', 6],
  ['2026-05-17', 2],
  ['2026-05-22', 7],
  ['2026-05-24', 3],
  ['2026-05-29', 1],
  ['2026-05-31', 4],
  // Junio
  ['2026-06-05', 2],
  ['2026-06-07', 5],
  ['2026-06-12', 3],
  ['2026-06-14', 6],
  ['2026-06-19', 4],
  ['2026-06-21', 7],
  ['2026-06-26', 5],
  ['2026-06-28', 1],
  // Julio
  ['2026-07-03', 6],
  ['2026-07-05', 2],
  ['2026-07-10', 7],
  ['2026-07-12', 3],
  ['2026-07-17', 2],
  ['2026-07-19', 5],
  ['2026-07-24', 3],
  ['2026-07-26', 6],
  ['2026-07-31', 4],
];

console.log(`\n  Calendario viernes+domingos: ${ENTRIES.length} entradas\n`);

if (!APPLY) {
  ENTRIES.forEach(([d, t]) => console.log(`    ${d}  T${t}`));
  console.log('\nDry-run. Agregá --apply.');
  process.exit(0);
}

const rows = ENTRIES.map(([date, turno]) => ({ date, turno_number: turno, replacements: [] }));
const { error } = await supabase.from('sdm_shift_calendar').upsert(rows, { onConflict: 'date' });
if (error) { console.error('❌', error.message); process.exit(1); }
console.log(`✅ ${rows.length} entradas upserted.`);
