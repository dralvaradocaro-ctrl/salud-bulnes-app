/**
 * Importa el historial de agendas SDM (refuerzos AM/PM por dia) desde el
 * JSON estructurado en scripts/data/historical-agendas-2026.json hacia
 * sdm_weekly_agendas. Esto es lo que el "Sortear refuerzos" lee para
 * balancear carga contra semanas previas del año (gte('week_start', enero 1)).
 *
 * Idempotente: hace upsert por week_start. Si la fila ya existe, se mergean
 * sus reinforcements con los del JSON sin pisar otros campos de data.
 *
 * Uso:
 *   node scripts/import-historical-agendas-v1.mjs           (dry-run)
 *   node scripts/import-historical-agendas-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APPLY = process.argv.includes('--apply');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'historical-agendas-2026.json');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  IMPORT HISTORICAL AGENDAS — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
console.log(`  fuente: ${path.relative(process.cwd(), DATA_FILE)}`);
console.log(`  semanas en JSON: ${raw.length}\n`);

// Carga doctores activos para validar y reportar IDs faltantes.
const { data: doctorsRows, error: dErr } = await supabase
  .from('sdm_doctors')
  .select('id, display_name, active');
if (dErr) { console.error('No se pudo cargar sdm_doctors:', dErr.message); process.exit(1); }
const doctorIds = new Set((doctorsRows || []).map(d => d.id));
console.log(`  doctores en DB: ${doctorIds.size}`);

const missingDoctors = new Set();
const flagMissing = (id) => { if (id && !doctorIds.has(id)) missingDoctors.add(id); };

// Carga semanas existentes para reportar overrides
const { data: existing, error: eErr } = await supabase
  .from('sdm_weekly_agendas')
  .select('week_start, data')
  .in('week_start', raw.map(r => r.weekStart));
if (eErr) { console.error('No se pudo leer sdm_weekly_agendas:', eErr.message); process.exit(1); }
const existingByWeek = Object.fromEntries((existing || []).map(r => [r.week_start, r.data || {}]));

console.log(`\n──── PLAN ────`);
const ops = [];
for (const week of raw) {
  const reinforcements = {};
  for (const [date, r] of Object.entries(week.reinforcements || {})) {
    flagMissing(r.am);
    flagMissing(r.pm);
    reinforcements[date] = { am: r.am || null, pm: r.pm || null };
  }
  const had = existingByWeek[week.weekStart];
  const prevData = had || {};
  const merged = {
    ...prevData,
    reinforcements: { ...(prevData.reinforcements || {}), ...reinforcements },
    historical_source: week.source || 'PDF historico',
    historical_label:  week.label  || week.weekStart,
  };
  const action = had ? 'merge ' : 'insert';
  console.log(`  ${action}  ${week.weekStart}  ${week.label || ''}`);
  ops.push({ weekStart: week.weekStart, data: merged });
}

if (missingDoctors.size > 0) {
  console.log(`\n  ⚠ doctores referenciados que NO estan en sdm_doctors (se igual se guardan):`);
  [...missingDoctors].sort().forEach(d => console.log(`     - ${d}`));
}

console.log(`\n──── RESUMEN ────`);
console.log(`  semanas a escribir: ${ops.length}`);

if (!APPLY) {
  console.log('\nDry-run. Para aplicar: --apply\n');
  process.exit(0);
}

let ok = 0, fail = 0;
for (const op of ops) {
  const { error } = await supabase
    .from('sdm_weekly_agendas')
    .upsert({ week_start: op.weekStart, data: op.data }, { onConflict: 'week_start' });
  if (error) { console.error(`  ✗ ${op.weekStart}: ${error.message}`); fail++; }
  else ok++;
}
console.log(`\n  insertados/actualizados: ${ok}  fallidos: ${fail}\n`);
