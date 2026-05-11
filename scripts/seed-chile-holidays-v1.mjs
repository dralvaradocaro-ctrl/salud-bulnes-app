/**
 * Marca como is_holiday=true en sdm_shift_calendar los feriados obligatorios
 * de Chile para un rango de años. Si la fecha no existe en el calendario,
 * la inserta con turno_number calculado desde un ancla conocida (rotación
 * diaria T1→T7 cíclica).
 *
 * Ancla: 2026-05-11 (lunes) = T2.
 *
 * Feriados obligatorios cubiertos (Ley 19.973, 19.668, 20.215, 21.357):
 *   - Año Nuevo, Viernes Santo, Sábado Santo, Día del Trabajador, Glorias
 *     Navales, Pueblos Originarios, San Pedro y Pablo, Virgen del Carmen,
 *     Asunción, Fiestas Patrias (18, 19), Encuentro Dos Mundos,
 *     Iglesias Evangélicas, Todos los Santos, Inmaculada Concepción, Navidad.
 *
 * NO incluye los traslados de movibles (San Pedro, Encuentro, Evangélicas)
 * cuando caen martes/miércoles — esos casos hay que ajustarlos a mano si
 * aplican un año concreto.
 *
 * Uso:
 *   node --env-file=.env scripts/seed-chile-holidays-v1.mjs                        (dry-run, 2026-2030)
 *   node --env-file=.env scripts/seed-chile-holidays-v1.mjs --apply
 *   node --env-file=.env scripts/seed-chile-holidays-v1.mjs --apply --years 2026,2027
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const yearsArgIdx = process.argv.indexOf('--years');
const YEARS = yearsArgIdx > -1 && process.argv[yearsArgIdx + 1]
  ? process.argv[yearsArgIdx + 1].split(',').map(Number)
  : [2026, 2027, 2028, 2029, 2030];

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ── Algoritmo de Pascua (Meeus/Jones/Butcher) ────────────────────────
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const fmt = (d) => d.toISOString().slice(0, 10);
const shiftDays = (d, n) => {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
};

function feriadosChile(year) {
  const pascua = easterSunday(year);
  return [
    { date: `${year}-01-01`, name: 'Año Nuevo' },
    { date: fmt(shiftDays(pascua, -2)), name: 'Viernes Santo' },
    { date: fmt(shiftDays(pascua, -1)), name: 'Sábado Santo' },
    { date: `${year}-05-01`, name: 'Día del Trabajador' },
    { date: `${year}-05-21`, name: 'Glorias Navales' },
    { date: `${year}-06-20`, name: 'Día Nacional de los Pueblos Originarios' },
    { date: `${year}-06-29`, name: 'San Pedro y San Pablo' },
    { date: `${year}-07-16`, name: 'Virgen del Carmen' },
    { date: `${year}-08-15`, name: 'Asunción de la Virgen' },
    { date: `${year}-09-18`, name: 'Independencia Nacional' },
    { date: `${year}-09-19`, name: 'Glorias del Ejército' },
    { date: `${year}-10-12`, name: 'Encuentro de Dos Mundos' },
    { date: `${year}-10-31`, name: 'Día de las Iglesias Evangélicas' },
    { date: `${year}-11-01`, name: 'Día de Todos los Santos' },
    { date: `${year}-12-08`, name: 'Inmaculada Concepción' },
    { date: `${year}-12-25`, name: 'Navidad' },
  ];
}

// ── Turno desde ancla 2026-05-11 = T2 (rotación T1→T7 cíclica diaria) ─
const ANCHOR_DATE = new Date('2026-05-11T00:00:00');
const ANCHOR_TURNO = 2;
function turnoForDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = Math.round((d - ANCHOR_DATE) / 86400000);
  return ((ANCHOR_TURNO - 1 + days) % 7 + 7) % 7 + 1;
}

// ── Ejecutar ─────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  FERIADOS CHILE → sdm_shift_calendar — ${APPLY ? '⚡ APPLY' : '🔍 DRY-RUN'}`);
console.log(`  Años: ${YEARS.join(', ')}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const allFeriados = YEARS.flatMap(y => feriadosChile(y).map(f => ({ ...f, year: y })));
console.log(`Total feriados a procesar: ${allFeriados.length}\n`);

// Pre-flight: ver qué fechas ya existen
const dates = allFeriados.map(f => f.date);
const { data: existing, error } = await supabase
  .from('sdm_shift_calendar')
  .select('date, is_holiday, turno_number')
  .in('date', dates);
if (error) { console.error('❌ ' + error.message); process.exit(1); }
const existingByDate = Object.fromEntries((existing || []).map(c => [c.date, c]));

const toUpdate = [];   // ya existen, solo cambiar is_holiday=true
const toInsert = [];   // no existen, crear con is_holiday=true + turno calculado
const alreadyOk = [];  // ya están marcados

for (const f of allFeriados) {
  const cur = existingByDate[f.date];
  if (cur) {
    if (cur.is_holiday === true) alreadyOk.push(f);
    else toUpdate.push(f);
  } else {
    toInsert.push({ ...f, turno_number: turnoForDate(f.date) });
  }
}

console.log(`✅ Ya marcados como feriado: ${alreadyOk.length}`);
console.log(`🔧 UPDATE (existen, falta marcar): ${toUpdate.length}`);
console.log(`➕ INSERT (no existen): ${toInsert.length}\n`);

if (toUpdate.length) {
  console.log('Actualizar:');
  toUpdate.slice(0, 12).forEach(f => console.log(`   ${f.date}  ${f.name}`));
  if (toUpdate.length > 12) console.log(`   … +${toUpdate.length - 12}`);
}
if (toInsert.length) {
  console.log('\nInsertar (con turno calculado desde ancla):');
  toInsert.slice(0, 12).forEach(f => console.log(`   ${f.date}  T${f.turno_number}  ${f.name}`));
  if (toInsert.length > 12) console.log(`   … +${toInsert.length - 12}`);
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir.\n');
  process.exit(0);
}

// Apply
let ok = 0, fail = 0;

for (const f of toUpdate) {
  const { error } = await supabase.from('sdm_shift_calendar')
    .update({ is_holiday: true })
    .eq('date', f.date);
  if (error) { console.error(`   ❌ ${f.date}: ${error.message}`); fail++; }
  else ok++;
}

if (toInsert.length > 0) {
  const rows = toInsert.map(f => ({
    date: f.date,
    turno_number: f.turno_number,
    is_holiday: true,
    replacements: [],
  }));
  const { error: e2 } = await supabase.from('sdm_shift_calendar').insert(rows);
  if (e2) { console.error(`   ❌ INSERT batch: ${e2.message}`); fail += rows.length; }
  else ok += rows.length;
}

console.log(`\nResultado: ${ok} OK, ${fail} fail. Ya estaban: ${alreadyOk.length}.\n`);
