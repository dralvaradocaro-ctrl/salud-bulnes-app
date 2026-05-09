/**
 * Carga las ausencias de Mayo 2026 extraídas del calendario PDF "Calendario ausencias".
 *
 * Uso:
 *   node scripts/seed-sdm-absences-mayo2026.mjs           (dry-run)
 *   node scripts/seed-sdm-absences-mayo2026.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Helper: rangos
const range = (start, end) => {
  const out = [];
  const d = new Date(start);
  const e = new Date(end);
  while (d <= e) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const ABSENCES = [];
const add = (doctor_id, dates, type, notes = null, duration_hours = null) => {
  (Array.isArray(dates) ? dates : [dates]).forEach(date =>
    ABSENCES.push({ doctor_id, date, type, duration_hours, notes }));
};

// ─── SEMANA 4-8 MAYO ─────────────────────────────────────────────────────────
add('sandoval', range('2026-05-04', '2026-05-08'), 'FL', 'Feriado legal toda la semana');
add('beltran',  range('2026-05-04', '2026-05-08'), 'FL', 'Feriado legal toda la semana');
add('fasani',   range('2026-05-04', '2026-05-08'), 'P',  'Postnatal');
add('cordero',  '2026-05-04', 'A');
add('r_aguilera','2026-05-04', 'A');
add('ruf',      '2026-05-06', 'DT', '4 horas', 4);
add('v_aguilera','2026-05-08', 'A');

// ─── SEMANA 11-15 MAYO ───────────────────────────────────────────────────────
add('sandoval', range('2026-05-11', '2026-05-15'), 'FL');
add('beltran',  range('2026-05-11', '2026-05-15'), 'FL');
add('fasani',   range('2026-05-11', '2026-05-15'), 'P');
add('rivas',    '2026-05-15', 'A');
add('troncoso', '2026-05-15', 'A');

// ─── SEMANA 18-22 MAYO ───────────────────────────────────────────────────────
add('fasani',   '2026-05-18', 'DT');
add('fasani',   '2026-05-19', 'A');
add('fasani',   '2026-05-20', 'FL');
add('fasani',   '2026-05-22', 'DT');
add('ruf',      '2026-05-18', 'A');
add('ruf',      '2026-05-19', 'DT');
add('ruf',      '2026-05-20', 'DT');
add('r_aguilera','2026-05-18', 'DT');
add('san_martin','2026-05-22', 'A');
add('enriquez', '2026-05-22', 'A');
add('sbarbaro', '2026-05-22', 'A');

// ─── SEMANA 25-29 MAYO ───────────────────────────────────────────────────────
add('san_martin','2026-05-29', 'CAP', 'Capacitación');

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  AUSENCIAS MAYO 2026 — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);
console.log(`  Total ausencias: ${ABSENCES.length}\n`);

const byType = {};
ABSENCES.forEach(a => byType[a.type] = (byType[a.type] || 0) + 1);
Object.entries(byType).forEach(([t, n]) => console.log(`    ${t}: ${n}`));

if (!APPLY) {
  console.log('\nModo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

const { error } = await supabase
  .from('sdm_absences')
  .upsert(ABSENCES, { onConflict: 'doctor_id,date,type', ignoreDuplicates: false });

if (error) { console.error('\n❌ Error:', error.message); process.exit(1); }
console.log(`\n✅ ${ABSENCES.length} ausencias cargadas.`);
