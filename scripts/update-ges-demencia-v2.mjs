/**
 * Restructura el tema GES "Alzheimer y otras demencias" para el modo 3 pestañas:
 *   Protocolo Local | Pauta de Cotejo | Algoritmo
 *
 * - Marca bloques locales con local_protocol: true
 * - Agrega mermaid basado en el flujograma real del PDF HCSFB 117
 * - Contenido enfocado en: exámenes, plazos, farmacología, derivación, responsables
 *
 * Uso:  node scripts/update-ges-demencia-v2.mjs
 *       node scripts/update-ges-demencia-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '696ea74c245ef362de4f4338';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// IDs de bloques locales anteriores a remover (reemplazados por los nuevos)
const OLD_LOCAL_IDS = new Set([
  'dem-local-banner', 'dem-local-gds', 'dem-local-farmacos',
  'dem-local-derivacion', 'dem-local-equipo',
]);

// ── Bloques del Protocolo Local (pestaña "Protocolo Local") ────────────────
// local_protocol: true → el componente los muestra en la pestaña "Protocolo Local"
const LOCAL_BLOCKS = [
  // 1. Flujo de atención multidisciplinaria (quién hace qué y en qué orden)
  {
    id: 'dem-v2-flujo',
    type: 'flowchart',
    color: 'blue',
    order: 20,
    local_protocol: true,
    title: 'Flujo de Atención Multidisciplinaria — PROSAM HCSFB 117',
    content: 'Responsables y secuencia de la atención desde la detección hasta la decisión diagnóstica',
    details: [
      '1. ENFERMERA: detecta EMPAM alterado o deterioro cognitivo en cualquier tipo de atención → activa flujo',
      '2. ASISTENTE SOCIAL: evalúa red de apoyo familiar, situación socioeconómica y cuidadores (simultáneo con paso 3)',
      '3. MÉDICO MORBILIDAD: decide abrir sospecha GES (plazo: en la misma atención) → solicita batería de exámenes',
      '4. TERAPEUTA OCUPACIONAL: evaluación funcional extendida con instrumentos (ABVD, Barthel)',
      '5. PSICÓLOGO: aplica MMSE, MoCA, Test del Reloj y batería neuropsicológica',
      '6. MATRÓN/A: consejería VIH (protocolo rutinario para apertura GES)',
      '7. MÉDICO SALUD MENTAL: con todos los antecedentes — confirma diagnóstico, descarta demencia o deriva a Neurología HHM extendiendo plazo de sospecha GES',
    ],
    layout_position: 'main',
  },

  // 2. Exámenes a solicitar (qué pedir específicamente)
  {
    id: 'dem-v2-examenes',
    type: 'criteria',
    color: 'green',
    order: 21,
    local_protocol: true,
    title: 'Batería de Exámenes — Apertura Sospecha GES',
    content: 'Exámenes a solicitar al abrir sospecha GES de demencia — permiten descartar causas tratables',
    items: [
      'Hemograma + VHS (anemia, infección crónica)',
      'Perfil bioquímico: glicemia, creatinina, BUN, pruebas hepáticas',
      'TSH (hipotiroidismo como causa reversible de deterioro cognitivo)',
      'Vitamina B12 y Ácido Fólico (déficit tratable)',
      'VDRL o RPR (neurosífilis — causa tratable)',
      'Orina completa (ITU como causa de delirium/agravamiento agudo)',
      'Electrocardiograma (cardiopatía subyacente antes de iniciar fármacos)',
      '⚠️ Neuroimagen (TAC o RM cerebral): SOLO si presenta derivación a Neurología HHM',
      'Plazo GES: exámenes en ≤ 7 días desde apertura de sospecha',
    ],
    layout_position: 'main',
  },

  // 3. GDS — escala de estratificación y conducta clínica
  {
    id: 'dem-v2-gds',
    type: 'flowchart',
    color: 'amber',
    order: 22,
    local_protocol: true,
    title: 'Estratificación GDS y Conducta Clínica',
    content: 'Global Deterioration Scale — define la severidad y determina el tratamiento farmacológico',
    details: [
      'GDS 1–2 (Sin demencia): seguimiento de FRCV, depresión y estimulación cognitiva preventiva',
      'GDS 3 (Deterioro cognitivo leve): evaluación neuropsicológica, estimulación cognitiva, reevaluar en 6 meses',
      'GDS 4–5 (Demencia leve a moderada): INICIO de tratamiento farmacológico + derivación a Neurología',
      'GDS 6–7 (Demencia severa): manejo sintomático, cuidados paliativos, apoyo intensivo al cuidador',
      '→ Plazo inicio tratamiento: ≤ 30 días desde confirmación diagnóstica (garantía GES)',
    ],
    layout_position: 'main',
  },

  // 4. Farmacología (doses, cuándo iniciar, plazos)
  {
    id: 'dem-v2-farmacos',
    type: 'flowchart',
    color: 'green',
    order: 23,
    local_protocol: true,
    title: 'Tratamiento Farmacológico — Protocolo Local HCSFB',
    content: 'Fármacos disponibles, dosis de inicio y titulación según severidad (GDS 4–7)',
    details: [
      'DEMENCIA LEVE-MODERADA (GDS 4–5):',
      '  • Donepezilo: inicio 5 mg/noche × 4 semanas → subir a 10 mg/noche (primera línea oral)',
      '  • Rivastigmina cápsulas: inicio 1.5 mg c/12h → titular cada 2 semanas hasta 6 mg c/12h',
      '  • Rivastigmina parche: 4.6 mg/24h × 4 semanas → 9.5 mg/24h (mejor tolerancia)',
      'DEMENCIA MODERADA-SEVERA (GDS 6–7) o intolerancia a IAChE:',
      '  • Memantina: inicio 5 mg/día × semana 1 → +5 mg/semana hasta 20 mg/día (máx)',
      '  • Combinación Donepezilo + Memantina: puede indicarse en GDS 5–6',
      'SÍNTOMAS CONDUCTUALES: preferir medidas no farmacológicas; antipsicóticos solo de forma puntual',
      'DEPRESIÓN ASOCIADA: ISRS (sertralina 50 mg, citalopram 20 mg) — evitar ATC (anticolinérgicos)',
      '→ Control farmacológico: 4 semanas tras inicio; luego cada 3–6 meses',
    ],
    layout_position: 'main',
  },

  // 5. Derivación — cuándo, a dónde, cómo
  {
    id: 'dem-v2-derivacion',
    type: 'criteria',
    color: 'red',
    order: 24,
    local_protocol: true,
    title: 'Criterios de Derivación a Neurología — HCSFB → HHM',
    content: 'Cuándo derivar, adónde y cómo gestionar la derivación según protocolo local',
    items: [
      '🏥 DESTINO: Neurología del Hospital Herminda Martín (HHM), Chillán',
      '📋 VÍA: Interconsulta por Teleprocesos MINSAL (sistema electrónico HCSFB)',
      '📄 ADJUNTAR: Resumen clínico + resultados de batería de exámenes + puntaje GDS',
      '⏱ PLAZO: Dentro de la garantía GES (plazo desde confirmación diagnóstica)',
      '',
      'INDICACIONES DE DERIVACIÓN:',
      '• Diagnóstico incierto o presentación atípica (demencia frontotemporal, Lewy body, vascular)',
      '• Edad de inicio < 65 años (demencia precoz)',
      '• Deterioro cognitivo rápido (< 6 meses) — descartar causa orgánica urgente',
      '• Síntomas conductuales severos refractarios a tratamiento local',
      '• Necesidad de neuroimagen avanzada (RM cerebral con contraste)',
      '• Evaluación neuropsicológica formal especializada',
      '• Sin respuesta a tratamiento farmacológico tras 6 meses',
    ],
    layout_position: 'main',
  },
];

// ── Bloque Mermaid (pestaña "Algoritmo") — basado en flujograma real HCSFB 117
const MERMAID_BLOCK = {
  id: 'dem-v2-mermaid',
  type: 'mermaid',
  order: 30,
  title: 'Flujograma HCSFB 117 — Detección y Manejo de Demencia',
  content: `flowchart TD
    EN([Enfermera: EMPAM alterado\\no deterioro cognitivo\\ndetectado en atención]) --> AS1[Asistente Social:\\nevaluación red de apoyo\\ny cuidadores]
    EN --> MM[Médico Morbilidad:\\nabre sospecha GES\\nsolicita batería de exámenes]
    MC([Médico Morbilidad\\nconsulta espontánea:\\nabre sospecha GES]) --> AS2[Asistente Social]
    MC --> TO2[Terapeuta Ocupacional:\\nevaluación extendida]
    MC --> PS2[Psicólogo: MMSE\\nMoCA · Reloj]
    MC --> MAT2[Matrón/a:\\nconsejería VIH]
    MM --> TO[Terapeuta Ocupacional:\\nevaluación funcional\\ncon instrumentos]
    MM --> PS[Psicólogo: MMSE\\nMoCA · Test del Reloj]
    MM --> MAT[Matrón/a:\\nconsejería VIH]
    AS1 --> MSM[Médico Salud Mental:\\nconfirma · descarta\\no deriva a Neurología HHM\\nextendiendo plazo sospecha]
    TO --> MSM
    PS --> MSM
    MAT --> MSM
    AS2 --> MSM
    TO2 --> MSM
    PS2 --> MSM
    MAT2 --> MSM
    MSM --> OK([✅ Confirmado GDS 4–7:\\ninicio tratamiento farmacológico\\nseguimiento PROSAM c/3–6m])
    MSM --> NO([❌ Descartado:\\nmanejo por morbilidad general\\nestimulación cognitiva si GDS 3])
    MSM --> DER([🏥 Deriva Neurología HHM\\nvía Teleprocesos:\\natípico · < 65a · rápido · refractario])`,
  layout_position: 'main',
};

// ── Main ───────────────────────────────────────────────────────────────────
const { data: topic, error: fetchErr } = await supabase
  .from('topics')
  .select('content_blocks')
  .eq('id', TOPIC_ID)
  .single();

if (fetchErr) { console.error('Fetch error:', fetchErr.message); process.exit(1); }

const existingBlocks = (topic.content_blocks || []).filter(b => !OLD_LOCAL_IDS.has(b.id));
const mergedBlocks   = [...existingBlocks, ...LOCAL_BLOCKS, MERMAID_BLOCK];

const checklistCount = mergedBlocks.filter(b => b.type === 'checklist').length;
const localCount     = mergedBlocks.filter(b => b.local_protocol === true).length;
const mermaidCount   = mergedBlocks.filter(b => b.type === 'mermaid').length;

console.log(`\nBloques GES originales (sin locales viejos): ${existingBlocks.length}`);
console.log(`Bloques protocolo local (local_protocol:true): ${localCount}`);
console.log(`Bloques mermaid: ${mermaidCount}`);
console.log(`Bloques checklist (pestaña Pauta de Cotejo): ${checklistCount}`);
console.log(`Total: ${mergedBlocks.length}`);
console.log(`\nModo activado: ${localCount > 0 && checklistCount > 0 ? '✅ 3 pestañas (Protocolo Local | Pauta de Cotejo | Algoritmo)' : '❌ faltan bloques'}`);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({
    has_local_protocol: true,
    protocol_code:      'HCSFB 117',
    protocol_edition:   'Primera',
    protocol_date:      'Mayo 2024',
    protocol_validity:  'Mayo 2029',
    protocol_objective: 'Estandarizar el diagnóstico y manejo de la demencia en el HCSFB mediante evaluación multidisciplinaria, estratificación GDS y criterios claros de derivación a Neurología del Hospital Herminda Martín.',
    protocol_authors: [
      { name: 'Dr. Rodrigo Enríquez Heredia',   role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
      { name: 'Dra. Micaela Fasani Montagna',    role: 'Revisora — Subdirectora Médica HCSFB' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
    content_blocks: mergedBlocks,
    last_updated: new Date().toISOString(),
  })
  .eq('id', TOPIC_ID);

if (error) { console.error('❌ Error:', error.message); process.exit(1); }
console.log('\n✅ Demencia GES actualizado con modo 3 pestañas.');
