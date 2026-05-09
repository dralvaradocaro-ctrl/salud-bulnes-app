/**
 * Pobla las tablas SDM con catálogo inicial extraído de los PDFs:
 *  - 18 médicos
 *  - 7 turnos rotativos + volante
 *  - Calendario de turnos abril 16 → julio 31 2026
 *  - 27 plantillas de bloqueos semanales
 *
 * Pre-requisito: ejecutar antes el SQL de
 *   supabase/migrations/20260509120000_create_sdm_tables.sql
 * en Supabase Studio (SQL Editor).
 *
 * Uso:
 *   node scripts/seed-sdm-v1.mjs           (dry-run, conteo)
 *   node scripts/seed-sdm-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ════════════════════════════════════════════════════════════════════════════
// MÉDICOS
// ════════════════════════════════════════════════════════════════════════════
const DOCTORS = [
  { id: 'fasani',      display_name: 'FASANI',      full_name: 'Dra. Micaela Fasani Montagna' },
  { id: 'san_martin',  display_name: 'SAN MARTIN',  full_name: 'Dr. San Martín' },
  { id: 'r_aguilera',  display_name: 'R. AGUILERA', full_name: 'Dr. Roberto Aguilera Jaque' },
  { id: 'sandoval',    display_name: 'SANDOVAL',    full_name: 'Dr. Maicol Candia Sandoval' },
  { id: 'enriquez',    display_name: 'ENRIQUEZ',    full_name: 'Dr. Rodrigo Enríquez Heredia' },
  { id: 'sbarbaro',    display_name: 'SBARBARO',    full_name: 'Dra. Sbarbaro' },
  { id: 'alvarado',    display_name: 'ALVARADO',    full_name: 'Dr. Fernando Alvarado' },
  { id: 'ruf',         display_name: 'RUF',         full_name: 'Dr. Ruf' },
  { id: 'cordero',     display_name: 'CORDERO',     full_name: 'Dr. Cordero' },
  { id: 'correa',      display_name: 'CORREA',      full_name: 'Dr. Correa' },
  { id: 'gil',         display_name: 'GIL',         full_name: 'Dr. Gil' },
  { id: 'toledo',      display_name: 'TOLEDO',      full_name: 'Dr. Toledo' },
  { id: 'rivas',       display_name: 'RIVAS',       full_name: 'Dr. Rivas' },
  { id: 'v_aguilera',  display_name: 'V. AGUILERA', full_name: 'Dr. V. Aguilera' },
  { id: 'carreno',     display_name: 'CARREÑO',     full_name: 'Dr. Carreño' },
  { id: 'santibanez',  display_name: 'SANTIBAÑEZ',  full_name: 'Dr. Santibáñez' },
  { id: 'beltran',     display_name: 'BELTRÁN',     full_name: 'Dr. Beltrán' },
  { id: 'troncoso',    display_name: 'TRONCOSO',    full_name: 'Dr. Troncoso' },
];

// ════════════════════════════════════════════════════════════════════════════
// ROTACIÓN DE TURNOS (7 turnos + volante)
// ════════════════════════════════════════════════════════════════════════════
const ROTATION = [
  { turno_number: 1, doctor_id: 'gil',         position: 1 },
  { turno_number: 1, doctor_id: 'sandoval',    position: 2 },
  { turno_number: 2, doctor_id: 'enriquez',    position: 1 },
  { turno_number: 2, doctor_id: 'correa',      position: 2 },
  { turno_number: 3, doctor_id: 'sbarbaro',    position: 1 },
  { turno_number: 3, doctor_id: 'v_aguilera',  position: 2 },
  { turno_number: 4, doctor_id: 'r_aguilera',  position: 1 },
  { turno_number: 4, doctor_id: 'rivas',       position: 2 },
  { turno_number: 5, doctor_id: 'san_martin',  position: 1 },
  { turno_number: 5, doctor_id: 'fasani',      position: 2 },
  { turno_number: 6, doctor_id: 'alvarado',    position: 1 },
  { turno_number: 6, doctor_id: 'carreno',     position: 2 },
  { turno_number: 7, doctor_id: 'ruf',         position: 1 },
  { turno_number: 7, doctor_id: 'toledo',      position: 2 },
  { turno_number: 0, doctor_id: 'cordero',     position: 1 }, // volante
];

// ════════════════════════════════════════════════════════════════════════════
// CALENDARIO DE TURNOS (abril 16 → julio 31 2026)
// Solo días con turno asignado en el PDF (lun-jue principalmente; viernes y fines de semana en la última sección del PDF)
// ════════════════════════════════════════════════════════════════════════════
const CALENDAR = [
  // Abril
  ['2026-04-16', 1], ['2026-04-20', 6], ['2026-04-21', 7], ['2026-04-22', 1], ['2026-04-23', 2],
  ['2026-04-27', 7], ['2026-04-28', 1], ['2026-04-29', 2], ['2026-04-30', 3],
  // Mayo
  ['2026-05-04', 1], ['2026-05-05', 2], ['2026-05-06', 3], ['2026-05-07', 4],
  ['2026-05-11', 2], ['2026-05-12', 3], ['2026-05-13', 4], ['2026-05-14', 5],
  ['2026-05-18', 3], ['2026-05-19', 4], ['2026-05-20', 5], ['2026-05-21', 6],
  ['2026-05-25', 4], ['2026-05-26', 5], ['2026-05-27', 6], ['2026-05-28', 7],
  // Junio
  ['2026-06-01', 5], ['2026-06-02', 6], ['2026-06-03', 7], ['2026-06-04', 1],
  ['2026-06-08', 6], ['2026-06-09', 7], ['2026-06-10', 1], ['2026-06-11', 2],
  ['2026-06-15', 7], ['2026-06-16', 1], ['2026-06-17', 2], ['2026-06-18', 3],
  ['2026-06-22', 1], ['2026-06-23', 2], ['2026-06-24', 3], ['2026-06-25', 4],
  ['2026-06-29', 2], ['2026-06-30', 3],
  // Julio
  ['2026-07-01', 4], ['2026-07-02', 5],
  ['2026-07-06', 3], ['2026-07-07', 4], ['2026-07-08', 5], ['2026-07-09', 6],
  ['2026-07-13', 4], ['2026-07-14', 5], ['2026-07-15', 6], ['2026-07-16', 7],
  ['2026-07-20', 5], ['2026-07-21', 6], ['2026-07-22', 7], ['2026-07-23', 1],
  ['2026-07-27', 6], ['2026-07-28', 7], ['2026-07-29', 1], ['2026-07-30', 2],
];

// Reemplazos detectados ("X POR Y" en el PDF)
const REPLACEMENTS = {
  '2026-04-16': [{ doctor_id: 'sandoval', replaced_by: 'san_martin' }],
  '2026-04-22': [{ doctor_id: 'sandoval', replaced_by: 'troncoso' }],
  '2026-04-28': [{ doctor_id: 'sandoval', replaced_by: 'troncoso' }],
  '2026-05-04': [{ doctor_id: 'sandoval', replaced_by: 'san_martin' }],
  '2026-05-06': [{ doctor_id: 'sbarbaro', replaced_by: 'troncoso' }],
  '2026-05-14': [{ doctor_id: 'fasani',   replaced_by: 'correa' }],
  '2026-05-20': [{ doctor_id: 'fasani',   replaced_by: 'troncoso' }],
  '2026-06-01': [{ doctor_id: 'san_martin', replaced_by: 'troncoso' }],
  '2026-06-08': [{ doctor_id: 'alvarado', replaced_by: 'troncoso' }],
  '2026-06-22': [{ doctor_id: 'cordero',  replaced_by: 'troncoso' }],
};

// ════════════════════════════════════════════════════════════════════════════
// PLANTILLAS DE BLOQUEOS (27)
// ════════════════════════════════════════════════════════════════════════════
const BLOCK_TEMPLATES = [
  { id: 'selector_demanda', name: 'Selector de demanda', weekly_hours: 3, default_schedule: '8:00 - 11:00 x 5 días',
    weekday_pattern: { lun:[{from:'08:00',to:'11:00'}], mar:[{from:'08:00',to:'11:00'}], mie:[{from:'08:00',to:'11:00'}], jue:[{from:'08:00',to:'11:00'}], vie:[{from:'08:00',to:'11:00'}] },
    category: 'clinico' },
  { id: 'poli_taco', name: 'Poli TACO', weekly_hours: 6, default_schedule: '12:00 - 13:30 (L-Mi-J-V)',
    weekday_pattern: { lun:[{from:'12:00',to:'13:30'}], mie:[{from:'12:00',to:'13:30'}], jue:[{from:'12:00',to:'13:30'}], vie:[{from:'12:00',to:'13:30'}] },
    category: 'clinico' },
  { id: 'regulacion_ic', name: 'Regulación IC', weekly_hours: 3.33, default_schedule: '16:00 - 16:40 x 5',
    weekday_pattern: { lun:[{from:'16:00',to:'16:40'}], mar:[{from:'16:00',to:'16:40'}], mie:[{from:'16:00',to:'16:40'}], jue:[{from:'16:00',to:'16:40'}], vie:[{from:'16:00',to:'16:40'}] },
    category: 'gestion' },
  { id: 'cp_y_ad', name: 'Cuidados Paliativos y Atención Domiciliaria (CP y AD)', weekly_hours: 14, default_schedule: '14:00 - 17:00 x 5',
    weekday_pattern: { lun:[{from:'14:00',to:'17:00'}], mar:[{from:'14:00',to:'17:00'}], mie:[{from:'14:00',to:'17:00'}], jue:[{from:'14:00',to:'17:00'}], vie:[{from:'14:00',to:'17:00'}] },
    category: 'clinico', notes: 'Primer día hábil del mes no hay paliativo por CENSO' },
  { id: 'ecicep', name: 'ECICEP', weekly_hours: 3, default_schedule: '14:00 - 17:00 x 2',
    weekday_pattern: { jue:[{from:'14:00',to:'17:00'}], vie:[{from:'14:00',to:'17:00'}] }, category: 'clinico' },
  { id: 'gestion_ges', name: 'Gestión GES', weekly_hours: 6, default_schedule: '14:00 - 17:00 x 2',
    weekday_pattern: { mar:[{from:'14:00',to:'17:00'}], jue:[{from:'14:00',to:'17:00'}] }, category: 'gestion' },
  { id: 'gestion_pscv', name: 'Gestión PSCV', weekly_hours: 3, default_schedule: '14:00 - 17:00 (miércoles)',
    weekday_pattern: { mie:[{from:'14:00',to:'17:00'}] }, category: 'gestion' },
  { id: 'gestion_acv', name: 'Gestión ACV', weekly_hours: 1.5, default_schedule: '12:00 - 13:30 (semana por medio)',
    weekday_pattern: { mar:[{from:'12:00',to:'13:30'}] }, category: 'gestion', notes: 'Semana por medio' },
  { id: 'gestion_mq', name: 'Gestión MQ', weekly_hours: 2, default_schedule: '14:00 - 16:00 x 2',
    weekday_pattern: { jue:[{from:'14:00',to:'16:00'}] }, category: 'gestion' },
  { id: 'gestion_urgencias', name: 'Gestión Urgencias', weekly_hours: 2, default_schedule: '14:00 - 16:00 x 1',
    weekday_pattern: { vie:[{from:'14:00',to:'16:00'}] }, category: 'gestion' },
  { id: 'gestion_iaas', name: 'Gestión IAAS', weekly_hours: 1.5, default_schedule: '12:00 - 13:30 x 2',
    weekday_pattern: { mar:[{from:'08:00',to:'09:30'}], vie:[{from:'08:00',to:'11:00'}] }, category: 'gestion' },
  { id: 'gestion_proa', name: 'Gestión PROA', weekly_hours: 1.5, default_schedule: '12:00 - 13:30 (semana por medio)',
    weekday_pattern: { mar:[{from:'12:00',to:'13:30'}] }, category: 'gestion', notes: 'Semana por medio' },
  { id: 'visita_proa', name: 'Visita PROA', weekly_hours: 3.33, default_schedule: '16:00 - 16:40 x 5 (junto a Reg IC)',
    weekday_pattern: { mar:[{from:'14:40',to:'15:20'}] }, category: 'clinico' },
  { id: 'dependencia_severa', name: 'Dependencia Severa', weekly_hours: 3, default_schedule: '14:00 - 17:00 x 1',
    weekday_pattern: { jue:[{from:'14:00',to:'17:00'}] }, category: 'clinico' },
  { id: 'gestion_dep_severa', name: 'Gestión Dependencia Severa', weekly_hours: 1.5, default_schedule: '12:00 - 13:30 x 1',
    weekday_pattern: { mie:[{from:'12:00',to:'13:30'}] }, category: 'gestion' },
  { id: 'chcc', name: 'CHCC', weekly_hours: 3, default_schedule: '14:00 - 17:00 x 1',
    weekday_pattern: { mie:[{from:'08:00',to:'09:30'}] }, category: 'clinico' },
  { id: 'telesalud', name: 'TELESALUD', weekly_hours: 2.5, default_schedule: '11:00 - 13:30 x 3',
    weekday_pattern: { mar:[{from:'11:00',to:'13:30'}], jue:[{from:'11:00',to:'13:30'}], vie:[{from:'11:00',to:'13:30'}] }, category: 'clinico' },
  { id: 'gestion_tm', name: 'Gestión TM (Telemedicina)', weekly_hours: 2.5, default_schedule: '14:00 - 17:00 x 1',
    weekday_pattern: { mar:[{from:'10:30',to:'12:30'}] }, category: 'gestion' },
  { id: 'citacion_tribunales', name: 'Citación tribunales', weekly_hours: 0, default_schedule: 'Revisar Excel SDM',
    weekday_pattern: {}, category: 'judicial' },
  { id: 'reuniones_agendadas', name: 'Reuniones agendadas', weekly_hours: 0, default_schedule: 'Revisar Agenda SDM',
    weekday_pattern: {}, category: 'reunion' },
  { id: 'citaciones_radio', name: 'Citaciones a la radio', weekly_hours: 0, default_schedule: 'Revisar Excel de radio',
    weekday_pattern: {}, category: 'visita_radio' },
  { id: 'gestion_policlinico', name: 'Gestión Policlínico', weekly_hours: 2, default_schedule: 'Primer lunes del mes',
    weekday_pattern: {}, category: 'gestion', is_monthly: true, monthly_rule: { week_of_month: 1, weekday: 'lun' } },
  { id: 'reunion_maternidad', name: 'Reunión Maternidad', weekly_hours: 2, default_schedule: 'Primer jueves del mes',
    weekday_pattern: {}, category: 'reunion', is_monthly: true, monthly_rule: { week_of_month: 1, weekday: 'jue' } },
  { id: 'reunion_medica', name: 'Reunión Médica', weekly_hours: 3, default_schedule: 'Tercer jueves del mes',
    weekday_pattern: {}, category: 'reunion', is_monthly: true, monthly_rule: { week_of_month: 3, weekday: 'jue' } },
  { id: 'reunion_sala_era', name: 'Reunión Sala ERA', weekly_hours: 1.5, default_schedule: 'Tercer jueves del mes',
    weekday_pattern: {}, category: 'reunion', is_monthly: true, monthly_rule: { week_of_month: 3, weekday: 'jue' } },
  { id: 'reunion_equipo_mq', name: 'Reunión Equipo Multidisciplinario MQ', weekly_hours: 2, default_schedule: '11:30 - 13:30 primera semana del mes',
    weekday_pattern: {}, category: 'reunion', is_monthly: true,
    monthly_rule: { week_of_month: 1, weekday: 'mie', from: '11:30', to: '13:30' } },
  { id: 'comite_iaas', name: 'Comité IAAS', weekly_hours: 0, default_schedule: '11:00 - 13:30 (4 al año)',
    weekday_pattern: {}, category: 'reunion', notes: '4 reuniones al año' },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  SEED SDM v1 — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const calendarRows = CALENDAR.map(([date, turno]) => ({
  date,
  turno_number: turno,
  replacements: REPLACEMENTS[date] || [],
}));

console.log(`  doctors:           ${DOCTORS.length}`);
console.log(`  shift_rotation:    ${ROTATION.length}`);
console.log(`  shift_calendar:    ${calendarRows.length}`);
console.log(`  block_templates:   ${BLOCK_TEMPLATES.length}\n`);

if (!APPLY) {
  console.log('Pre-requisito: ejecutar antes el SQL en Supabase Studio:');
  console.log('  supabase/migrations/20260509120000_create_sdm_tables.sql\n');
  console.log('Modo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

async function upsert(table, rows, conflict) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflict });
  if (error) {
    console.error(`  ❌ ${table}: ${error.message}`);
    return false;
  }
  console.log(`  ✅ ${table}: ${rows.length} filas`);
  return true;
}

const ok1 = await upsert('sdm_doctors', DOCTORS, 'id');
if (!ok1) process.exit(1);

const ok2 = await upsert('sdm_shift_rotation', ROTATION, 'turno_number,doctor_id');
const ok3 = await upsert('sdm_shift_calendar', calendarRows, 'date');
const ok4 = await upsert('sdm_block_templates', BLOCK_TEMPLATES, 'id');

console.log(`\nSeed terminado. ${[ok1,ok2,ok3,ok4].filter(Boolean).length}/4 tablas OK.`);
