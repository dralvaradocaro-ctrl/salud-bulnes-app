/**
 * Sortea refuerzos AM/PM para todas las semanas desde --from hasta --to,
 * usando sortReinforcements con la nueva lógica (regla dura "preferir
 * libres", exclusión Fasani / jerárquicos / urgentólogos, equidad por
 * carga PM separada). Persiste el resultado en sdm_weekly_agendas.data.reinforcements.
 *
 * Idempotente: hace upsert mergeando `reinforcements` sin pisar otros
 * campos del data.
 *
 * Uso:
 *   node scripts/sortear-refuerzos-from-week-v1.mjs --from=2026-06-01 --to=2026-12-31
 *   node scripts/sortear-refuerzos-from-week-v1.mjs --from=2026-06-01 --to=2026-12-31 --apply
 */
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateAgenda,
  sortReinforcements,
  getMondayOfWeek,
  fmtDate,
} from '../src/components/sdm/lib/generateAgenda.js';

const APPLY = process.argv.includes('--apply');
const argFrom = (process.argv.find(a => a.startsWith('--from=')) || '').slice('--from='.length);
const argTo   = (process.argv.find(a => a.startsWith('--to='))   || '').slice('--to='.length);
const FROM = argFrom || '2026-06-01';
const TO   = argTo   || '2026-12-31';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  SORTEAR REFUERZOS — ${APPLY ? 'APPLY' : 'DRY-RUN'}  (${FROM} → ${TO})`);
console.log(`═══════════════════════════════════════════════════════\n`);

// Listado de lunes en el rango.
function listMondays(fromStr, toStr) {
  const out = [];
  const start = new Date(fromStr + 'T12:00:00');
  const end   = new Date(toStr   + 'T12:00:00');
  // Avanzar al lunes igual o posterior a `from`
  const d = new Date(start);
  const dow = d.getDay();
  const offset = dow === 0 ? 1 : (dow === 1 ? 0 : 8 - dow);
  d.setDate(d.getDate() + offset);
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

const mondays = listMondays(FROM, TO);
console.log(`  semanas a procesar: ${mondays.length}`);

// Cargar entidades fijas una sola vez.
const [d, r, bt, pa] = await Promise.all([
  supabase.from('sdm_doctors').select('*').eq('active', true).order('display_name'),
  supabase.from('sdm_shift_rotation').select('*'),
  supabase.from('sdm_block_templates').select('*'),
  supabase.from('sdm_program_assignments').select('*'),
]);
if (d.error || r.error || bt.error || pa.error) {
  console.error('Error cargando entidades base.');
  process.exit(1);
}
const doctors            = d.data || [];
const rotation           = r.data || [];
const blockTemplates     = bt.data || [];
const programAssignments = pa.data || [];

// Histórico anual de reinforcements (todas las semanas previas + del año).
const yearStart = `${new Date(FROM + 'T12:00:00').getFullYear()}-01-01`;
const { data: pastAgendas, error: paErr } = await supabase
  .from('sdm_weekly_agendas')
  .select('week_start, data')
  .gte('week_start', yearStart);
if (paErr) { console.error('Error histórico:', paErr.message); process.exit(1); }
const existingReinforcements = {};
const existingDataByWeek = {};
(pastAgendas || []).forEach(row => {
  existingDataByWeek[row.week_start] = row.data || {};
  if (row.data?.reinforcements) existingReinforcements[row.week_start] = row.data.reinforcements;
});
console.log(`  historial cargado: ${Object.keys(existingReinforcements).length} semanas con reinforcements\n`);

// Procesar cada semana del rango.
const results = [];
for (const weekStart of mondays) {
  // shift_calendar y absences de esa semana
  const monday = new Date(weekStart + 'T12:00:00');
  const weekEnd = new Date(monday); weekEnd.setDate(monday.getDate() + 6);
  const weekEndStr = fmtDate(weekEnd);
  const monthBefore = new Date(monday); monthBefore.setDate(monday.getDate() - 7);
  const monthBeforeStr = fmtDate(monthBefore);

  const [c, a, ob] = await Promise.all([
    supabase.from('sdm_shift_calendar').select('*').gte('date', monthBeforeStr).lte('date', weekEndStr),
    supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEndStr),
    supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart),
  ]);
  if (c.error || a.error || ob.error) {
    console.error(`  ✗ ${weekStart}: ${(c.error||a.error||ob.error).message}`);
    continue;
  }
  const shiftCalendar = c.data || [];
  const absences = a.data || [];
  const oneoffBlocks = ob.data || [];

  // Refuerzos manuales preservados (si el usuario ya editó esa semana).
  const manualReinforcements = existingReinforcements[weekStart] || {};

  // Generar agenda (sin overrides — usamos los defaults del backend).
  const agenda = generateAgenda({
    weekStart,
    doctors,
    rotation,
    shiftCalendar,
    blockTemplates,
    programAssignments,
    absences,
    oneoffBlocks,
    manualReinforcements,
  });

  // Sortear refuerzos para esta semana.
  // existingReinforcements va acumulando lo sorteado en semanas previas del lote
  // para que el balance se mantenga.
  const sorted = sortReinforcements({
    weeks: [{ weekStart, days: agenda }],
    doctors,
    existingReinforcements,
  });
  const nuevos = sorted[weekStart] || {};
  // Actualizar el historial acumulado para que las semanas siguientes en este
  // mismo lote vean el balance recién sorteado.
  existingReinforcements[weekStart] = nuevos;

  // Resumen por médico
  const counts = {};
  Object.values(nuevos).forEach(s => {
    if (s?.am) counts[s.am] = { ...(counts[s.am]||{}), am: (counts[s.am]?.am||0)+1 };
    if (s?.pm) counts[s.pm] = { ...(counts[s.pm]||{}), pm: (counts[s.pm]?.pm||0)+1 };
  });
  results.push({ weekStart, nuevos, counts });

  const summary = Object.entries(counts)
    .map(([id, c]) => `${id}(AM${c.am||0}/PM${c.pm||0})`)
    .join(' ');
  console.log(`  ✓ ${weekStart}  ${summary}`);
}

if (!APPLY) {
  console.log('\nDry-run. Para aplicar: --apply\n');
  process.exit(0);
}

// Persistir
let ok = 0, fail = 0;
for (const { weekStart, nuevos } of results) {
  const prev = existingDataByWeek[weekStart] || {};
  const merged = { ...prev, reinforcements: nuevos };
  const { error } = await supabase
    .from('sdm_weekly_agendas')
    .upsert({ week_start: weekStart, data: merged }, { onConflict: 'week_start' });
  if (error) { fail++; console.error(`  ✗ ${weekStart}: ${error.message}`); }
  else ok++;
}
console.log(`\n  semanas guardadas: ${ok}  fallidas: ${fail}\n`);
