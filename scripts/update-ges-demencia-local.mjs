/**
 * Integra el Protocolo Local HCSFB 117 (Diagnóstico y Manejo de Demencia)
 * dentro del tema GES existente de Alzheimer y otras demencias.
 *
 * Uso:  node scripts/update-ges-demencia-local.mjs
 *       node scripts/update-ges-demencia-local.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '696ea74c245ef362de4f4338';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Reemplaza el bloque alert genérico y agrega bloques clínicos locales
const NEW_LOCAL_BLOCKS = [
  // Escala GDS — clasificación local
  {
    id: 'dem-local-gds',
    type: 'flowchart',
    color: 'blue',
    order: 20,
    title: 'Estratificación por Escala GDS — Protocolo Local HCSFB 117',
    content: 'Clasificación de severidad de la demencia y conducta clínica según GDS (Global Deterioration Scale)',
    details: [
      'GDS 1–2: Sin demencia — seguimiento de factores de riesgo cardiovascular y depresión',
      'GDS 3: Deterioro cognitivo leve — evaluación neuropsicológica, estimulación cognitiva',
      'GDS 4–5: Demencia leve a moderada — inicio de tratamiento farmacológico + derivación a neurología',
      'GDS 6–7: Demencia severa — manejo sintomático, cuidados paliativos, apoyo familiar intensivo',
    ],
    layout_position: 'main',
  },
  // Farmacología local
  {
    id: 'dem-local-farmacos',
    type: 'flowchart',
    color: 'green',
    order: 21,
    title: 'Tratamiento Farmacológico — Protocolo Local',
    content: 'Opciones farmacológicas disponibles y criterios de uso según protocolo HCSFB 117',
    details: [
      'Inhibidores de Acetilcolinesterasa (leve-moderada): Donepezilo 5–10 mg/noche; Rivastigmina 6–12 mg/día o parche 4.6–9.5 mg',
      'Memantina (moderada-severa o intolerancia a IAChE): inicio 5 mg/día, titular a 20 mg/día',
      'Combinación Donepezilo + Memantina puede indicarse en demencia moderada-severa',
      'Síntomas conductuales: preferir medidas no farmacológicas; antipsicóticos de forma puntual y con vigilancia cardiovascular',
      'Depresión asociada: ISRS (sertralina, citalopram); evitar ATC por efectos anticolinérgicos',
    ],
    layout_position: 'main',
  },
  // Derivación
  {
    id: 'dem-local-derivacion',
    type: 'criteria',
    color: 'red',
    order: 22,
    title: 'Criterios de Derivación a Neurología — HCSFB → HHM',
    content: 'Indicaciones de derivación al Hospital Herminda Martín según protocolo local HCSFB 117',
    items: [
      'Diagnóstico incierto o presentación atípica (demencia frontotemporal, Lewy body)',
      'Edad de inicio < 65 años',
      'Deterioro rápido o manejo difícil',
      'Síntomas conductuales severos refractarios a tratamiento',
      'Necesidad de neuroimágenes avanzadas (RM cerebral)',
      'Evaluación neuropsicológica formal por psicólogo',
    ],
    layout_position: 'main',
  },
  // Equipo multidisciplinario
  {
    id: 'dem-local-equipo',
    type: 'flowchart',
    color: 'amber',
    order: 23,
    title: 'Equipo Multidisciplinario — PROSAM HCSFB',
    content: 'Roles del equipo en la atención local de demencia',
    details: [
      'Médico: sospecha diagnóstica, exámenes, inicio tratamiento, derivación',
      'Psicólogo: evaluación cognitiva (MMSE, MoCA, test del reloj), intervención psicológica',
      'Trabajador Social: evaluación de red de apoyo, cuidadores, beneficios sociales',
      'Terapeuta Ocupacional: evaluación funcional (ABVD), adaptación del entorno',
      'Cuidadores: psicoeducación, prevención de claudicación del cuidador',
    ],
    layout_position: 'main',
  },
];

// Reemplaza el bloque alert genérico existente (id: dem-local-banner)
// y agrega los nuevos bloques locales detallados

const LOCAL_PROTOCOL_META = {
  protocol_code:      'HCSFB 117',
  protocol_edition:   'Primera',
  protocol_date:      'Mayo 2024',
  protocol_validity:  'Mayo 2029',
  protocol_objective: 'Estandarizar el diagnóstico y manejo de la demencia en el HCSFB mediante evaluación multidisciplinaria, estratificación GDS y criterios claros de derivación a nivel secundario.',
  protocol_file_url:  '',
  protocol_authors: [
    { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina y PROSAM' },
    { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora' },
    { name: 'Dirección HCSFB', role: 'Aprobadora' },
  ],
  last_updated: new Date().toISOString(),
};

// --- Main ---
const { data: topic, error: fetchErr } = await supabase
  .from('topics')
  .select('content_blocks')
  .eq('id', TOPIC_ID)
  .single();

if (fetchErr) { console.error('Fetch error:', fetchErr.message); process.exit(1); }

// Remove generic alert block and add detailed local blocks
const existingBlocks = (topic.content_blocks || []).filter(b => b.id !== 'dem-local-banner');
const mergedBlocks   = [...existingBlocks, ...NEW_LOCAL_BLOCKS];

console.log(`\nBloques existentes (sin banner genérico): ${existingBlocks.length}`);
console.log(`Bloques locales nuevos: ${NEW_LOCAL_BLOCKS.length}`);
console.log(`Total tras merge: ${mergedBlocks.length}`);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({ ...LOCAL_PROTOCOL_META, has_local_protocol: true, content_blocks: mergedBlocks })
  .eq('id', TOPIC_ID);

if (error) { console.error('❌ Error:', error.message); process.exit(1); }
console.log('\n✅ Demencia GES actualizado con protocolo local HCSFB 117.');
