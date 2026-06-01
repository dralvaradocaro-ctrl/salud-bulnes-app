/**
 * Pobla la tabla `medications` con los medicamentos NUEVOS del Arsenal Básico
 * para Hospitales Comunitarios del Servicio de Salud Ñuble 2026
 * (Resolución Exenta N°5754 del 23-dic-2025).
 *
 * Convive con seed-arsenal-hcsfb-v1.mjs (arsenal local Bulnes, Res. Ex. 5235).
 * Solo inserta medicamentos / presentaciones que NO existen ya en la BD.
 *
 * Marca cada registro nuevo con prefijo "[SSÑ-2026]" en `restrictions` para
 * que la UI los pueda destacar visualmente.
 *
 * Uso:  node scripts/seed-arsenal-hcsfb-v2-ssn2026.mjs            (dry-run)
 *       node scripts/seed-arsenal-hcsfb-v2-ssn2026.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

// `medications` tiene RLS que bloquea inserts con la anon key.
// Exporta SUPABASE_SERVICE_ROLE_KEY para poder escribir con --apply.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const SOURCE_TAG = '[SSÑ-2026]';

const m = (name, presentation, dose_value, dose_unit, category, observation, active_ingredient) => ({
  name,
  active_ingredient: active_ingredient || name,
  presentation,
  dose_value,
  dose_unit,
  category: category || null,
  restrictions: observation ? `${SOURCE_TAG} ${observation}` : SOURCE_TAG,
  is_active: true,
});

const MEDICATIONS = [
  // ──────────────────────────────────────────────────────────────────
  // A) Principios activos completamente nuevos
  // ──────────────────────────────────────────────────────────────────

  // Antidepresivos / cesación tabaco
  m('Anfebutamona (Bupropion)', 'Comprimido liberación prolongada', 150, 'mg',
    'Antidepresivo', 'GES cesación del consumo de tabaco (PM)', 'Bupropion'),

  // Combinación inhalada
  m('Budesonida + Formoterol', 'Inhalador', 160, 'mcg/4.5mcg/dosis',
    'Combinación inhalada', 'PM Salud Respiratoria'),

  // Anticonvulsivantes nuevos
  m('Clobazam', 'Comprimido', 10, 'mg',
    'Benzodiacepina', 'PM Epilepsia'),
  m('Lacosamida', 'Comprimido', 100, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),
  m('Oxcarbazepina', 'Comprimido', 300, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),
  m('Oxcarbazepina', 'Suspensión oral', 60, 'mg/mL',
    'Anticonvulsivante', 'PM Epilepsia'),
  m('Vigabatrina', 'Comprimido', 500, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),

  // Antidiabético
  m('Empagliflozina', 'Comprimido', 10, 'mg',
    'Antidiabético', 'Alternativa Dapagliflozina (PSCV, según protocolo)'),

  // Antiespasmódico GI
  m('Escopolamina', 'Solución inyectable', 20, 'mg/mL',
    'Antiespasmódico', 'CPU'),

  // Corticoide inhalado mono
  m('Fluticasona', 'Inhalador', 125, 'mcg/dosis',
    'Corticoide inhalado', 'PM Salud Respiratoria'),

  // Anestésico
  m('Ketamina', 'Solución inyectable', 500, 'mg/mL',
    'Anestésico', 'SRI / dolor refractario / agitación severa / crisis asmática severa'),

  // Anticoagulante DOAC
  m('Rivaroxabán', 'Comprimido', 20, 'mg',
    'Anticoagulante', 'Continuidad de tratamiento iniciado en especialidad'),

  // Opioide combinación
  m('Tramadol + Paracetamol', 'Comprimido', 325, 'mg/37.5mg',
    'Opioide', 'CPU'),

  // ──────────────────────────────────────────────────────────────────
  // B) Presentaciones nuevas de principios activos ya existentes
  // ──────────────────────────────────────────────────────────────────

  // Ácido valproico — presentaciones nuevas
  m('Ácido valproico', 'Jarabe', 250, 'mg/5mL',
    'Anticonvulsivante', 'PM Epilepsia'),
  m('Ácido valproico', 'Comprimido liberación prolongada', 250, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),
  m('Ácido valproico', 'Solución oral gotas', 375, 'mg/mL',
    'Anticonvulsivante', 'PM Epilepsia'),

  // Amoxicilina + Ác. clavulánico — presentaciones nuevas
  m('Amoxicilina + Ácido clavulánico', 'Comprimido', 1000, 'mg (875+125)',
    'Antibiótico', 'Grupo de acceso (PROA)'),
  m('Amoxicilina + Ácido clavulánico', 'Suspensión oral', 457, 'mg/5mL (400+57)',
    'Antibiótico', 'Grupo de acceso (PROA)'),

  // Calcio + Vitamina D — presentaciones nuevas
  m('Calcio + Vitamina D', 'Comprimido', 500, 'mg + 800UI',
    'Suplemento', 'GES Cirrosis hepática'),
  m('Calcio + Vitamina D', 'Comprimido', 450, 'mg + 175UI',
    'Suplemento'),

  // Carbamazepina — LP 200mg
  m('Carbamazepina', 'Comprimido liberación prolongada', 200, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),

  // Hierro fumarato + vitaminas + ácido fólico
  m('Fierro fumarato + Vitaminas + Ácido fólico', 'Comprimido', 1, 'comp',
    'Suplemento', null, 'Hierro fumarato + Vitaminas + Ácido fólico'),

  // Flucloxacilina — comprimido (ya existe jarabe)
  m('Flucloxacilina', 'Comprimido', 500, 'mg',
    'Antibiótico', 'Grupo de acceso (PROA)'),

  // Lamotrigina — bucodispersable
  m('Lamotrigina', 'Comprimido bucodispersable', 25, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),

  // Morfina LP comp 30mg
  m('Morfina', 'Comprimido liberación prolongada', 30, 'mg',
    'Opioide', 'CPU'),

  // Nifedipino comp 10mg (parto prematuro)
  m('Nifedipino', 'Comprimido', 10, 'mg',
    'Tocolítico', 'Atención de parto prematuro'),

  // Topiramato 100mg
  m('Topiramato', 'Comprimido', 100, 'mg',
    'Anticonvulsivante', 'PM Epilepsia'),

  // Tramadol LP 100mg
  m('Tramadol', 'Comprimido liberación prolongada', 100, 'mg',
    'Opioide', 'CPU'),
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  ARSENAL SSÑ-2026 v2 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`  Res. Ex. N°5754 (23-dic-2025) Servicio de Salud Ñuble`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`Total candidatos: ${MEDICATIONS.length}`);
console.log(`Categorías: ${[...new Set(MEDICATIONS.map(x => x.category))].length}\n`);

// Helper: chequea si un registro ya existe (idempotencia)
async function existsAlready(med) {
  const { data, error } = await supabase
    .from('medications')
    .select('id')
    .eq('name', med.name)
    .eq('presentation', med.presentation)
    .eq('dose_value', med.dose_value)
    .eq('dose_unit', med.dose_unit)
    .limit(1);
  if (error) {
    console.error(`   ⚠️  Error al chequear ${med.name}: ${error.message}`);
    return false;
  }
  return (data || []).length > 0;
}

// Pre-flight: clasificar en NEW vs SKIP
const toInsert = [];
const toSkip = [];
for (const med of MEDICATIONS) {
  const hit = await existsAlready(med);
  if (hit) toSkip.push(med);
  else toInsert.push(med);
}

console.log(`📊 Pre-flight check vs. BD:`);
console.log(`   Nuevos a insertar:  ${toInsert.length}`);
console.log(`   Ya presentes (skip): ${toSkip.length}\n`);

console.log(`Muestra de los nuevos (primeros 8):`);
toInsert.slice(0, 8).forEach(med =>
  console.log(`   • ${med.name} ${med.dose_value}${med.dose_unit} (${med.presentation}) [${med.category}]`)
);

if (toSkip.length) {
  console.log(`\nSe omiten (ya en BD):`);
  toSkip.forEach(med =>
    console.log(`   - ${med.name} ${med.dose_value}${med.dose_unit} (${med.presentation})`)
  );
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la BD.\n');
  process.exit(0);
}

if (toInsert.length === 0) {
  console.log('\n✅ Nada que insertar. BD ya está al día con SSÑ-2026.\n');
  process.exit(0);
}

// Insertar en batch
const BATCH_SIZE = 100;
let inserted = 0;
for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
  const batch = toInsert.slice(i, i + BATCH_SIZE);
  const { data, error } = await supabase.from('medications').insert(batch).select('id');
  if (error) {
    console.error(`\n❌ Error en batch ${i}-${i + batch.length}: ${error.message}`);
    process.exit(1);
  }
  inserted += data.length;
  console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data.length} insertados`);
}

console.log(`\n✅ Total insertados: ${inserted}/${toInsert.length}`);
console.log(`   Marcador en restrictions: "${SOURCE_TAG} ..."`);
console.log(`   Query verificación: select count(*) from medications where restrictions ilike '${SOURCE_TAG}%';\n`);
