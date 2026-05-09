/**
 * Pre-carga asignaciones titular/subrogante por programa.
 * Inferidas de la agenda real 4-8 mayo 2026 + distribución equitativa
 * para programas sin referente identificable (médicos con menos carga).
 *
 * El subdirector puede editar todo desde la UI "Consola Gestión → Asignaciones".
 *
 * Uso:
 *   node scripts/seed-sdm-assignments-v1.mjs           (dry-run)
 *   node scripts/seed-sdm-assignments-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Asignaciones inferidas
const ASSIGNMENTS = [
  // [block_id, titular, subrogante]
  ['selector_demanda',    'alvarado',   'ruf'],
  ['poli_taco',           'alvarado',   'cordero'],
  ['regulacion_ic',       'sbarbaro',   'enriquez'],
  ['cp_y_ad',             'santibanez', 'toledo'],
  ['ecicep',              'correa',     'enriquez'],
  ['gestion_ges',         'r_aguilera', 'sbarbaro'],
  ['gestion_pscv',        'alvarado',   'carreno'],
  ['gestion_acv',         'alvarado',   'enriquez'],
  ['gestion_mq',          'san_martin', 'enriquez'],
  ['gestion_urgencias',   'sbarbaro',   'correa'],
  ['gestion_iaas',        'sbarbaro',   'carreno'],
  ['gestion_proa',        'sbarbaro',   'r_aguilera'],
  ['visita_proa',         'sbarbaro',   'r_aguilera'],
  ['dependencia_severa',  'carreno',    'santibanez'],
  ['gestion_dep_severa',  'santibanez', 'carreno'],
  ['chcc',                'v_aguilera', 'fasani'],
  ['telesalud',           'santibanez', 'correa'],
  ['gestion_tm',          'r_aguilera', 'cordero'],
  // Sin referente claro — distribución a médicos con menos carga
  ['citacion_tribunales', 'alvarado',   'gil'],
  ['reuniones_agendadas', 'alvarado',   'rivas'],
  ['citaciones_radio',    'alvarado',   'troncoso'],
  ['gestion_policlinico', 'alvarado',   'beltran'],
  ['reunion_maternidad',  'fasani',     'sandoval'],
  ['reunion_medica',      'alvarado',   'sbarbaro'],
  ['reunion_sala_era',    'ruf',        'toledo'],
  ['reunion_equipo_mq',   'san_martin', 'rivas'],
  ['comite_iaas',         'sbarbaro',   'carreno'],
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  ASIGNACIONES POR PROGRAMA — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`  Programas a asignar: ${ASSIGNMENTS.length}`);
const titulares = new Set();
ASSIGNMENTS.forEach(([_, t]) => titulares.add(t));
console.log(`  Médicos titulares únicos: ${titulares.size}\n`);

// Distribución de cargas
const carga = {};
ASSIGNMENTS.forEach(([_, t, s]) => {
  carga[t] = (carga[t] || 0) + 1;
  if (s) carga[s] = (carga[s] || 0) + 0.5;
});
console.log('  Carga total (titular=1, subrogante=0.5):');
Object.entries(carga).sort((a, b) => b[1] - a[1]).forEach(([d, c]) => {
  console.log(`    ${d.padEnd(15)} ${c}`);
});

if (!APPLY) {
  console.log('\nModo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

// Limpiar assignments previos para evitar duplicados
await supabase.from('sdm_program_assignments').delete().neq('id', 0);

const rows = ASSIGNMENTS.flatMap(([blockId, titular, subrogante]) => {
  const out = [{ block_template_id: blockId, doctor_id: titular, role_type: 'titular' }];
  if (subrogante) out.push({ block_template_id: blockId, doctor_id: subrogante, role_type: 'subrogante' });
  return out;
});

const { error } = await supabase.from('sdm_program_assignments').insert(rows);
if (error) { console.error('\n❌ Error:', error.message); process.exit(1); }
console.log(`\n✅ ${rows.length} asignaciones cargadas (${ASSIGNMENTS.length} titulares + subrogantes).`);
