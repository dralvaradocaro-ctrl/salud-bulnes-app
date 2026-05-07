/**
 * Reorganiza subcategorías de Hospitalizados, Policlínico y Urgencias
 * hacia especialidades clínicas + categorías transversales.
 *
 * Uso:  node scripts/update-subcategories-v1.mjs
 *       node scripts/update-subcategories-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_IDS = [
  '696ea6ff245ef362de4f431d', // Hospitalizados
  '696ea6ff245ef362de4f431e', // Policlínico
  '696ea6ff245ef362de4f431f', // Urgencias
];

// Mapeo: [substring en nombre] → subcategoría
// El primer match gana — orden de especificidad descendente
const RULES = [
  // ── PATRONES ESPECÍFICOS PRIMERO (evitar colisiones) ─────────────────
  ['Reanimación Cardiopulmonar',   'Urgencias y Emergencias'],
  ['RCP',                          'Urgencias y Emergencias'],

  // ── SALUD MENTAL ──────────────────────────────────────────────────────
  ['Agitación',                    'Salud Mental'],
  ['Hipnótico',                    'Salud Mental'],
  ['Clotiazepam',                  'Salud Mental'],
  ['Intento Suicida',              'Salud Mental'],
  ['Suicida',                      'Salud Mental'],
  ['Autolesion',                   'Salud Mental'],
  ['Contención Física',            'Salud Mental'],
  ['Contención Farmacológica',     'Salud Mental'],
  ['Criterios de Ingreso',         'Salud Mental'],
  ['Criterios Salud Mental',       'Salud Mental'],
  ['Respuesta Rápida',             'Salud Mental'],
  ['Salud Mental',                 'Salud Mental'],
  ['ASQ',                          'Salud Mental'],

  // ── CARDIOVASCULAR ────────────────────────────────────────────────────
  ['Trombolisis',                  'Cardiovascular'],
  ['TACO',                         'Cardiovascular'],
  ['Anticoagulación',              'Cardiovascular'],
  ['Anticoagulante',               'Cardiovascular'],
  ['Cardiovascular',               'Cardiovascular'],
  ['Cardiología',                  'Cardiovascular'],
  ['Fibrilación',                  'Cardiovascular'],
  ['Arritmia',                     'Cardiovascular'],
  ['Infarto',                      'Cardiovascular'],

  // ── NEUROLOGÍA ────────────────────────────────────────────────────────
  ['TEC',                          'Neurología'],
  ['Traumatismo Craneoencefálico', 'Neurología'],
  ['ACV',                          'Neurología'],
  ['Accidente Cerebrovascular',    'Neurología'],
  ['Demencia',                     'Neurología'],
  ['Alzheimer',                    'Neurología'],
  ['Parkinson',                    'Neurología'],
  ['Epilepsia',                    'Neurología'],
  ['Neurología',                   'Neurología'],

  // ── TRAUMATOLOGÍA ─────────────────────────────────────────────────────
  ['Disyunción',                   'Traumatología y Rehabilitación'],
  ['Acromioclavicular',            'Traumatología y Rehabilitación'],
  ['Infiltración',                 'Traumatología y Rehabilitación'],
  ['Rodilla',                      'Traumatología y Rehabilitación'],
  ['Traumatología',                'Traumatología y Rehabilitación'],
  ['Ortopedia',                    'Traumatología y Rehabilitación'],

  // ── RESPIRATORIO ──────────────────────────────────────────────────────
  ['Neumonía',                     'Respiratorio'],
  ['EPOC',                         'Respiratorio'],
  ['Asma',                         'Respiratorio'],
  ['Respiratorio',                 'Respiratorio'],

  // ── ENDOCRINOLOGÍA ────────────────────────────────────────────────────
  ['Hipotiroidismo',               'Endocrinología y Metabólico'],
  ['Glibenclamida',                'Endocrinología y Metabólico'],
  ['Diabetes',                     'Endocrinología y Metabólico'],
  ['Insulina',                     'Endocrinología y Metabólico'],
  ['Metformina',                   'Endocrinología y Metabólico'],
  ['Retinopatía',                  'Endocrinología y Metabólico'],
  ['Endocrinología',               'Endocrinología y Metabólico'],
  ['Tiroides',                     'Endocrinología y Metabólico'],
  ['Metabólico',                   'Endocrinología y Metabólico'],

  // ── NEFROLOGÍA ────────────────────────────────────────────────────────
  ['Hiperkalemia',                 'Nefrología y Electrolitos'],
  ['Potasio',                      'Nefrología y Electrolitos'],
  ['Electrolito',                  'Nefrología y Electrolitos'],
  ['Renal',                        'Nefrología y Electrolitos'],
  ['Nefrología',                   'Nefrología y Electrolitos'],

  // ── HEMATOLOGÍA ───────────────────────────────────────────────────────
  ['Transfusión',                  'Hematología'],
  ['Hematología',                  'Hematología'],
  ['Sangre',                       'Hematología'],

  // ── INFECTOLOGÍA ──────────────────────────────────────────────────────
  ['PROA',                         'Infectología'],
  ['Antibiótico',                  'Infectología'],
  ['Aislamiento',                  'Infectología'],
  ['Infección',                    'Infectología'],
  ['Infectología',                 'Infectología'],

  // ── NUTRICIÓN ─────────────────────────────────────────────────────────
  ['Nutricional',                  'Nutrición'],
  ['Nutrición',                    'Nutrición'],
  ['Tamizaje',                     'Nutrición'],

  // ── PEDIATRÍA ─────────────────────────────────────────────────────────
  ['Pediátric',                    'Pediatría'],
  ['Lactante',                     'Pediatría'],
  ['Neonatal',                     'Pediatría'],
  ['Pediatría',                    'Pediatría'],
  ['Suplementación',               'Pediatría'],

  // ── URGENCIAS Y EMERGENCIAS ───────────────────────────────────────────
  ['Código Azul',                  'Urgencias y Emergencias'],
  ['Intubación',                   'Urgencias y Emergencias'],
  ['Cuerpo Extraño',               'Urgencias y Emergencias'],
  ['Paro',                         'Urgencias y Emergencias'],
  ['Secuencia Rápida',             'Urgencias y Emergencias'],
  ['Bomba',                        'Urgencias y Emergencias'],

  // ── PROCEDIMIENTOS ────────────────────────────────────────────────────
  ['Toracocentesis',               'Procedimientos'],
  ['Dolor Agudo',                  'Procedimientos'],
  ['Post-Op',                      'Procedimientos'],
  ['Postoperatori',                'Procedimientos'],

  // ── SEGURIDAD DEL PACIENTE ────────────────────────────────────────────
  ['Caídas',                       'Seguridad del Paciente'],
  ['Caida',                        'Seguridad del Paciente'],
  ['Lesiones por Presión',         'Seguridad del Paciente'],
  ['LPP',                          'Seguridad del Paciente'],
  ['Error de Medicación',          'Seguridad del Paciente'],
  ['Error Medicación',             'Seguridad del Paciente'],
  ['Errores de Medicación',        'Seguridad del Paciente'],

  // ── HERRAMIENTAS CLÍNICAS ─────────────────────────────────────────────
  ['Imagenología',                 'Herramientas Clínicas'],
  ['Telemedicina',                 'Herramientas Clínicas'],
  ['CIE-10',                       'Herramientas Clínicas'],
  ['Códigos',                      'Herramientas Clínicas'],
  ['Guía de Atenciones',           'Herramientas Clínicas'],
  ['Policlínico',                  'Herramientas Clínicas'],
];

function classify(name) {
  for (const [pattern, cat] of RULES) {
    if (name.toLowerCase().includes(pattern.toLowerCase())) return cat;
  }
  return null; // sin cambio
}

// ─────────────────────────────────────────────────────────────────────────────
const { data: topics, error } = await supabase
  .from('topics')
  .select('id, name, subcategory, category_id')
  .in('category_id', CATEGORY_IDS);

if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

const changes = [];
for (const t of topics) {
  const newSub = classify(t.name);
  if (newSub && newSub !== t.subcategory) {
    changes.push({ id: t.id, name: t.name, old: t.subcategory, new: newSub });
  }
}

const unchanged = topics.filter(t => {
  const newSub = classify(t.name);
  return !newSub || newSub === t.subcategory;
});

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  SUBCATEGORÍAS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);
console.log(`\nTopics totales: ${topics.length}`);
console.log(`Cambios a aplicar: ${changes.length}`);
console.log(`Sin cambio / sin match: ${unchanged.length}`);

console.log('\nCambios:');
for (const c of changes) {
  console.log(`  [${(c.old || 'null').padEnd(30)}] → [${c.new}]  "${c.name}"`);
}

if (unchanged.length > 0) {
  console.log('\nSin match (quedan como están):');
  for (const t of unchanged) {
    const n = classify(t.name);
    if (!n) console.log(`  [${(t.subcategory || 'null').padEnd(30)}] "${t.name}"`);
  }
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

let ok = 0, fail = 0;
for (const c of changes) {
  const { error: e } = await supabase.from('topics').update({ subcategory: c.new }).eq('id', c.id);
  if (e) { console.error(`  ❌ ${c.name}: ${e.message}`); fail++; }
  else ok++;
}

console.log(`\n✅ ${ok} topics actualizados${fail > 0 ? ` | ❌ ${fail} errores` : ''}.`);
