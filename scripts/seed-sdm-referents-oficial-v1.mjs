/**
 * SDM v2: agrega ~20 block_templates faltantes (administrativos + programas)
 * y sobrescribe sdm_program_assignments con la nómina oficial del PDF
 * "Distribución Programas Médicos Junio 2025–Mayo 2026".
 *
 * Pre-requisito: ejecutar antes el SQL de
 *   supabase/migrations/20260510120000_sdm_v2_priority.sql
 *
 * Uso:
 *   node scripts/seed-sdm-referents-oficial-v1.mjs           (dry-run)
 *   node scripts/seed-sdm-referents-oficial-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ════════════════════════════════════════════════════════════════════════════
// NUEVOS BLOCK TEMPLATES (programas del PDF que aún no estaban)
// ════════════════════════════════════════════════════════════════════════════
const NEW_BLOCKS = [
  // SUBDIRECCIÓN y CALIDAD
  { id: 'tecnovigilancia',            name: 'Tecnovigilancia',                       category: 'administrativo' },
  { id: 'comite_muerte_perinatal',    name: 'Comité Muerte Fetal/Perinatal/Infantil/Materna', category: 'reunion' },
  { id: 'acreditacion_calidad',       name: 'Acreditación y Calidad',                category: 'administrativo' },
  // SERVICIOS CLÍNICOS (jefaturas)
  { id: 'medico_ust',                 name: 'Médico UST (Unidad Sanitaria Territorial)', category: 'administrativo' },
  { id: 'rehabilitacion',             name: 'Rehabilitación',                        category: 'administrativo' },
  { id: 'servicio_mq',                name: 'Servicio Médico-Quirúrgico (Jefatura)', category: 'administrativo' },
  { id: 'servicio_go',                name: 'Servicio Gineco-Obstetricia (Jefatura)', category: 'administrativo' },
  { id: 'servicio_pediatria',         name: 'Servicio Pediatría (Jefatura)',         category: 'administrativo' },
  { id: 'servicio_urgencias',         name: 'Servicio Urgencias (Jefatura)',         category: 'administrativo' },
  // PROGRAMAS POLICLÍNICO
  { id: 'sala_era',                   name: 'Sala ERA',                              category: 'clinico' },
  { id: 'sala_ira',                   name: 'Sala IRA',                              category: 'clinico' },
  { id: 'programa_its',               name: 'Programa ITS',                          category: 'administrativo' },
  { id: 'adulto_mayor',               name: 'Programa Adulto Mayor',                 category: 'administrativo' },
  { id: 'tuberculosis',               name: 'Programa Tuberculosis',                 category: 'administrativo' },
  { id: 'adulto',                     name: 'Programa Adulto',                       category: 'administrativo' },
  { id: 'epilepsia',                  name: 'Programa Epilepsia',                    category: 'administrativo' },
  { id: 'adolescente',                name: 'Programa Adolescente',                  category: 'administrativo' },
  { id: 'hipotiroidismo_referente',   name: 'Programa Hipotiroidismo (referente)',   category: 'administrativo' },
  { id: 'infantil',                   name: 'Programa Infantil',                     category: 'administrativo' },
  { id: 'artrosis',                   name: 'Programa Artrosis',                     category: 'administrativo' },
  { id: 'alcoholismo',                name: 'Programa Alcoholismo',                  category: 'administrativo' },
  { id: 'salud_mujer',                name: 'Programa Salud de la Mujer',            category: 'administrativo' },
  { id: 'cirugia_menor',              name: 'Cirugía Menor',                         category: 'clinico' },
  { id: 'sm_adulto',                  name: 'Salud Mental Adulto',                   category: 'administrativo' },
  { id: 'sm_infantil',                name: 'Salud Mental Infantil',                 category: 'administrativo' },
  { id: 'sidra',                      name: 'SIDRA',                                 category: 'administrativo' },
  { id: 'epidemiologia',              name: 'Epidemiología',                         category: 'administrativo' },
  { id: 'promocion',                  name: 'Promoción',                             category: 'administrativo' },
  { id: 'referencia_contrarreferencia', name: 'Referencia y Contrarreferencia',      category: 'administrativo' },
  { id: 'farmacia_botiquin',          name: 'Farmacia y Botiquín',                   category: 'administrativo' },
  { id: 'imagenologia',               name: 'Imagenología y Rayos',                  category: 'administrativo' },
  { id: 'curaciones_heridas',         name: 'Curaciones y Manejo Avanzado de Heridas', category: 'clinico' },
  { id: 'artritis_reumatoide',        name: 'Artritis Reumatoide',                   category: 'administrativo' },
  { id: 'tabaquismo',                 name: 'Tabaquismo',                            category: 'administrativo' },
  { id: 'subdireccion_medica',        name: 'Subdirección Médica',                   category: 'administrativo' },
].map(b => ({
  ...b,
  weekly_hours: 0,
  default_schedule: 'Sin horario fijo (responsabilidad permanente)',
  weekday_pattern: {},
  is_monthly: false,
}));

// ════════════════════════════════════════════════════════════════════════════
// NÓMINA OFICIAL — del PDF "Distribución Programas Médicos Junio 2025–Mayo 2026"
// Format: [block_id, [titular], [subrogantes en orden]]
// ════════════════════════════════════════════════════════════════════════════
const REFERENTS = [
  ['subdireccion_medica',         'fasani',     ['cordero', 'alvarado']],
  ['tecnovigilancia',             'cordero',    ['alvarado']],
  ['comite_muerte_perinatal',     'fasani',     ['carreno']],
  ['medico_ust',                  'san_martin', ['santibanez', 'cordero']],
  ['rehabilitacion',              'santibanez', ['cordero', 'v_aguilera']],
  ['servicio_mq',                 'san_martin', ['alvarado', 'v_aguilera', 'rivas']],
  ['servicio_go',                 'carreno',    ['cordero', 'correa', 'gil']],
  ['servicio_pediatria',          'sbarbaro',   ['gil', 'santibanez']],
  ['servicio_urgencias',          'sandoval',   ['cordero', 'ruf', 'gil']],
  ['gestion_pscv',                'alvarado',   ['ruf', 'beltran', 'rivas']],
  ['gestion_policlinico',         'beltran',    ['correa', 'ruf']],
  ['dependencia_severa',          'r_aguilera', ['correa', 'sbarbaro', 'ruf']],
  ['gestion_dep_severa',          'r_aguilera', ['correa', 'sbarbaro', 'ruf']],
  ['programa_its',                'toledo',     ['gil', 'carreno']],
  ['sala_era',                    'san_martin', ['correa', 'rivas']],
  ['sala_ira',                    'correa',     ['san_martin', 'rivas']],
  ['adulto_mayor',                'correa',     ['alvarado']],
  ['tuberculosis',                'rivas',      ['sandoval', 'san_martin']],
  ['adulto',                      'ruf',        ['enriquez']],
  ['epilepsia',                   'rivas',      ['ruf']],
  ['adolescente',                 'toledo',     ['correa', 'sbarbaro']],
  ['hipotiroidismo_referente',    'carreno',    ['toledo', 'alvarado']],
  ['infantil',                    'rivas',      ['v_aguilera', 'cordero']],
  ['artrosis',                    'enriquez',   ['cordero', 'v_aguilera']],
  ['chcc',                        'v_aguilera', ['rivas', 'cordero']],
  ['alcoholismo',                 'santibanez', ['r_aguilera']],
  ['salud_mujer',                 'gil',        ['carreno', 'toledo', 'r_aguilera']],
  ['cirugia_menor',               'v_aguilera', ['carreno', 'toledo', 'gil']],
  ['cp_y_ad',                     'santibanez', ['correa', 'sbarbaro', 'carreno']],
  ['gestion_iaas',                'sbarbaro',   ['alvarado', 'correa']],
  ['comite_iaas',                 'sbarbaro',   ['alvarado', 'correa']],
  ['sm_adulto',                   'enriquez',   ['beltran', 'ruf']],
  ['telesalud',                   'sandoval',   ['r_aguilera', 'ruf', 'correa']],
  ['gestion_tm',                  'sandoval',   ['r_aguilera', 'ruf', 'correa']],
  ['sm_infantil',                 'beltran',    ['correa', 'ruf']],
  ['sidra',                       'alvarado',   ['cordero', 'ruf']],
  ['epidemiologia',               'sbarbaro',   ['alvarado', 'carreno']],
  ['promocion',                   'cordero',    ['ruf', 'toledo']],
  ['referencia_contrarreferencia','enriquez',   ['sbarbaro', 'ruf', 'sandoval', 'correa']],
  ['poli_taco',                   'fasani',     ['beltran', 'cordero', 'alvarado']],
  ['acreditacion_calidad',        'cordero',    ['alvarado']],
  ['farmacia_botiquin',           'sandoval',   ['gil', 'alvarado']],
  ['gestion_ges',                 'r_aguilera', ['sbarbaro', 'correa', 'v_aguilera']],
  ['ecicep',                      'ruf',        ['correa', 'beltran', 'alvarado']],
  ['gestion_proa',                'sbarbaro',   ['alvarado', 'correa', 'carreno']],
  ['visita_proa',                 'sbarbaro',   ['alvarado', 'correa', 'carreno']],
  ['imagenologia',                'cordero',    ['v_aguilera', 'gil']],
  ['curaciones_heridas',          'carreno',    ['alvarado', 'ruf']],
  ['artritis_reumatoide',         'alvarado',   ['r_aguilera', 'correa']],
  ['tabaquismo',                  'beltran',    ['ruf']],
];

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  SDM v2 — REFERENTES OFICIALES — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`  Block templates nuevos: ${NEW_BLOCKS.length}`);
console.log(`  Programas con referentes: ${REFERENTS.length}`);
const totalAssignments = REFERENTS.reduce((sum, [, , subs]) => sum + 1 + subs.length, 0);
console.log(`  Asignaciones totales (T+S): ${totalAssignments}\n`);

// Carga de trabajo
const carga = {};
REFERENTS.forEach(([_, t, subs]) => {
  carga[t] = (carga[t] || 0) + 1;
  subs.forEach((s, i) => carga[s] = (carga[s] || 0) + Math.max(0.1, 0.5 / (i + 1)));
});
console.log('  Carga ponderada (T=1, S₁=0.5, S₂=0.25, S₃=0.17, S₄=0.13):');
Object.entries(carga).sort((a, b) => b[1] - a[1]).forEach(([d, c]) => {
  console.log(`    ${d.padEnd(15)} ${c.toFixed(2)}`);
});

if (!APPLY) {
  console.log('\nPre-requisito: ejecutar antes el SQL en Supabase Studio:');
  console.log('  supabase/migrations/20260510120000_sdm_v2_priority.sql\n');
  console.log('Modo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

// 1) Insertar nuevos block_templates
console.log('\n→ Insertando block_templates nuevos...');
const { error: e1 } = await supabase.from('sdm_block_templates').upsert(NEW_BLOCKS, { onConflict: 'id' });
if (e1) { console.error('❌', e1.message); process.exit(1); }
console.log(`  ✅ ${NEW_BLOCKS.length} templates upserted`);

// 2) Limpiar asignaciones previas
console.log('\n→ Limpiando asignaciones previas...');
const { error: e2 } = await supabase.from('sdm_program_assignments').delete().neq('id', 0);
if (e2) { console.error('❌', e2.message); process.exit(1); }

// 3) Insertar referentes oficiales (con fallback si priority no existe)
console.log('\n→ Insertando referentes oficiales con priority...');
const rowsWithPrio = [];
REFERENTS.forEach(([blockId, titular, subs]) => {
  rowsWithPrio.push({ block_template_id: blockId, doctor_id: titular, role_type: 'titular', priority: 1 });
  subs.forEach((s, i) => rowsWithPrio.push({
    block_template_id: blockId, doctor_id: s, role_type: 'subrogante', priority: i + 1,
  }));
});

let { error: e3 } = await supabase.from('sdm_program_assignments').insert(rowsWithPrio);
if (e3 && /priority/i.test(e3.message)) {
  console.warn(`  ⚠ Columna priority no existe en BD — reintentando sin priority.`);
  console.warn(`  ⚠ Para soporte multi-subrogante, ejecutá supabase/migrations/20260510120000_sdm_v2_priority.sql`);
  const rowsNoPrio = rowsWithPrio.map(({ priority, ...rest }) => rest);
  // Sin priority no podemos repetir (block_id, doctor_id, role_type) pero el constraint UNIQUE incluye doctor_id
  // así que si un titular ya está como subrogante en otro priority, no choca.
  const { error: e3b } = await supabase.from('sdm_program_assignments').insert(rowsNoPrio);
  if (e3b) { console.error('❌', e3b.message); process.exit(1); }
} else if (e3) {
  console.error('❌', e3.message); process.exit(1);
}
console.log(`  ✅ ${rowsWithPrio.length} asignaciones insertadas`);

console.log(`\n✅ SDM v2 referentes aplicado.`);
