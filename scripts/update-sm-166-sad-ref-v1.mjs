/**
 * En HCSFB 166 (Criterios SM):
 *  - Reemplaza el bloque sm-sad-persons (criteria estático) por un score_calculator
 *    funcional clonado del GCL 1.10, conservando id y tab "Criterios"
 *  - Agrega bloque reference al GCL 1.10 (Intento Suicida) — completa el par bidireccional
 *
 * Uso:
 *   node scripts/update-sm-166-sad-ref-v1.mjs           (dry-run)
 *   node scripts/update-sm-166-sad-ref-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const ID_166 = 'fa57bf50-f39c-4438-af5e-bfa33be36fce';
const ID_GCL110 = '64dfc162-38ac-40c9-8cff-2e898bd40988';

const SAD_CALC_BLOCK = {
  id: 'sm-sad-persons',
  tab: 'Criterios',
  type: 'score_calculator',
  order: 1,
  title: 'Calculadora SAD PERSONS — Riesgo suicida',
  description: 'Marcar los ítems presentes — 1 punto por cada ítem',
  items: [
    { label: 'S — Sexo masculino (mayor letalidad en el intento)' },
    { label: 'A — Edad menor a 20 o mayor a 45 años' },
    { label: 'D — Depresión o desesperanza marcada' },
    { label: 'P — Tentativa de suicidio previa' },
    { label: 'E — Abuso de alcohol o drogas' },
    { label: 'R — Pérdida de pensamiento racional (psicosis, delirio)' },
    { label: 'S — Sin apoyo social o familiar adecuado' },
    { label: 'O — Plan suicida organizado y específico' },
    { label: 'N — Sin pareja estable o viudo/a reciente' },
    { label: 'S — Enfermedad somática grave o crónica' },
  ],
  thresholds: [
    { min: 0, max: 2,  color: 'green', label: 'Bajo riesgo',     action: 'Manejo ambulatorio — derivar a PROSAM con prioridad' },
    { min: 3, max: 6,  color: 'amber', label: 'Riesgo moderado', action: 'Hospitalizar en MQ o Pediatría con dupla psicosocial' },
    { min: 7, max: 10, color: 'red',   label: 'Riesgo alto',     action: 'Hospitalizar y evaluar criterios de derivación a HCHM' },
  ],
  layout_position: 'main',
};

const REF_BLOCK = {
  id: 'sm-ref-intsuic',
  tab: 'Criterios',
  type: 'reference',
  order: 99,
  title: 'Ver también',
  reference_type: 'topic',
  reference_id: ID_GCL110,
  reference_label: 'GCL 1.10 — Manejo de Pacientes con Intento Suicida en Urgencias (flujo, calculadora SAD PERSONS, derivación)',
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  HCSFB 166 — SAD CALC + REFERENCE — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const { data, error } = await supabase
  .from('topics').select('content_blocks').eq('id', ID_166).single();
if (error) { console.error('Fetch:', error.message); process.exit(1); }

const before = data.content_blocks || [];
// Quitar viejo sm-sad-persons y viejo sm-ref-intsuic (idempotencia)
const without = before.filter(b => b.id !== 'sm-sad-persons' && b.id !== 'sm-ref-intsuic');
const merged = [...without, SAD_CALC_BLOCK, REF_BLOCK]
  .sort((a, b) => (a.order || 99) - (b.order || 99));

console.log(`  bloques antes:  ${before.length}`);
console.log(`  bloques final:  ${merged.length}`);
console.log(`  cambios:`);
console.log(`    - sm-sad-persons: criteria → score_calculator (10 ítems, 3 umbrales)`);
console.log(`    - sm-ref-intsuic: reference → GCL 1.10\n`);

if (!APPLY) {
  console.log('Modo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

const { error: e } = await supabase
  .from('topics').update({ content_blocks: merged, last_updated: new Date().toISOString() }).eq('id', ID_166);
if (e) { console.error('Update:', e.message); process.exit(1); }
console.log('Actualizado HCSFB 166.');
