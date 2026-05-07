/**
 * Restructura el tema GES "Hipotiroidismo" para el modo 3 pestañas:
 *   Protocolo Local | Pauta de Cotejo | Algoritmo
 *
 * Uso:  node scripts/update-ges-hipotiroidismo-v2.mjs
 *       node scripts/update-ges-hipotiroidismo-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '696efcff77924d3a78533dce';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const OLD_LOCAL_IDS = new Set([
  'hipo-local-tamizaje', 'hipo-local-laboratorio', 'hipo-local-dosificacion',
  'hipo-local-seguimiento', 'hipo-local-derivacion',
]);

// ── Bloques del Protocolo Local ────────────────────────────────────────────
const LOCAL_BLOCKS = [
  // 1. Flujo de atención y responsables
  {
    id: 'hipo-v2-flujo',
    type: 'flowchart',
    color: 'blue',
    order: 10,
    local_protocol: true,
    title: 'Flujo de Atención — Policlínico HCSFB 98',
    content: 'Responsables y secuencia del manejo del hipotiroidismo primario en policlínico APS',
    details: [
      '1. MÉDICO: detecta sospecha clínica o pertenece a grupo de tamizaje → solicita TSH + T4L en ayunas',
      '2. LABORATORIO HCSFB: resultado TSH disponible en ≤ 24–48h hábiles',
      '3. MÉDICO: interpreta resultado → inicia Levotiroxina o deriva si criterio',
      '4. QUÍMICO-FARMACÉUTICO (QF): co-gestiona controles alternados c/6m; deja orden interna TSH + perfil lipídico para siguiente control médico',
      '5. MÉDICO: control anual cuando paciente está compensado (2 TSH en rango consecutivos)',
      '6. DERIVACIÓN A ENDOCRINOLOGÍA HHM: si criterio (ver más abajo) → vía Teleprocesos MINSAL',
      '→ Muestra TSH: en ayunas, antes de tomar la dosis de Levotiroxina del día',
    ],
    layout_position: 'main',
  },

  // 2. Grupos a tamizar (quiénes)
  {
    id: 'hipo-v2-tamizaje',
    type: 'criteria',
    color: 'blue',
    order: 11,
    local_protocol: true,
    title: 'Grupos de Tamizaje — ¿A quién solicitar TSH?',
    content: 'Población a la que se debe solicitar perfil tiroideo según protocolo local HCSFB 98',
    items: [
      'Antecedente de cirugía tiroidea, radioyodo o radioterapia cervical',
      'Disfunción tiroidea previa o anticuerpos antitiroideos (AcTPO) positivos',
      'Hipercolesterolemia · Obesidad (IMC > 30) · Infertilidad',
      'Enfermedades autoinmunes: DM tipo 1, Sjögren, artritis reumatoidea, Addison, enfermedad celíaca, vitíligo',
      'Uso crónico de amiodarona o litio',
      'Depresión confirmada en menores de 65 años',
      'Mayores de 65 años con sospecha de depresión o deterioro cognitivo',
      'Síndrome de Down o Turner · Embarazadas (solicitar también T4 libre)',
    ],
    layout_position: 'main',
  },

  // 3. Valores de referencia del laboratorio local
  {
    id: 'hipo-v2-laboratorio',
    type: 'flowchart',
    color: 'green',
    order: 12,
    local_protocol: true,
    title: 'Valores de Referencia — Laboratorio HCSFB',
    content: 'Rangos normales utilizados en el laboratorio del HCSFB (no usar valores de laboratorios externos)',
    details: [
      'TSH adultos: 0.38–5.33 µUI/mL',
      'TSH gestantes 1° trimestre: 0.05–3.70 µUI/mL',
      'TSH gestantes 2° trimestre: 0.31–4.35 µUI/mL',
      'TSH gestantes 3° trimestre: 0.41–5.18 µUI/mL',
      'T4 libre: 0.6–1.2 ng/dL',
      'Meta de tratamiento TSH adultos < 70 años: 1–3 µUI/mL',
      'Meta TSH adultos ≥ 70 años: 3–6 µUI/mL (más conservador)',
    ],
    layout_position: 'main',
  },

  // 4. Farmacología — dosis, titulación, plazos
  {
    id: 'hipo-v2-farmacos',
    type: 'flowchart',
    color: 'amber',
    order: 13,
    local_protocol: true,
    title: 'Tratamiento con Levotiroxina — Dosis y Titulación',
    content: 'Esquema de inicio y ajuste de Levotiroxina según nivel de TSH y características del paciente',
    details: [
      'TSH 5–10 µUI/mL (subclínico leve): NO iniciar salvo AcTPO+ o síntomas evidentes',
      'TSH 10–20 µUI/mL: iniciar LT4 25–50 µg/día → titular a 50–100 µg/día',
      'TSH > 20 µUI/mL: LT4 1.0–1.6 µg/kg/día según edad y peso corporal ideal',
      'Adultos mayores ≥ 75 años: inicio 12.5–25 µg/día y titulación muy lenta c/8–12 semanas',
      'NO iniciar tratamiento si TSH < 10 µUI/mL en adultos ≥ 75 años (beneficio no demostrado)',
      '⏱ Ajustes: ±25–50 µg cada 6–8 semanas (o ±12.5–25 µg en adultos mayores)',
      '📋 Administración: en ayunas, 30–60 min antes del desayuno',
      '🚫 Separar de: calcio, hierro, omeprazol, estatinas y anticonvulsivantes (absorción reducida)',
    ],
    layout_position: 'main',
  },

  // 5. Derivación — cuándo, a dónde, cómo
  {
    id: 'hipo-v2-derivacion',
    type: 'criteria',
    color: 'red',
    order: 14,
    local_protocol: true,
    title: 'Criterios de Derivación a Endocrinología — HCSFB → HHM',
    content: 'Indicaciones de derivación a endocrinología del Hospital Herminda Martín',
    items: [
      '🏥 DESTINO: Endocrinología del Hospital Herminda Martín (HHM), Chillán',
      '📋 VÍA: Interconsulta por Teleprocesos MINSAL o telemedicina según disponibilidad',
      '📄 ADJUNTAR: Resumen + TSH + T4L + AcTPO + medicamentos actuales',
      '',
      'INDICACIONES DE DERIVACIÓN:',
      '• Antecedente de cáncer tiroideo (cualquier TSH)',
      '• Cardiopatía coronaria o insuficiencia cardíaca asociada',
      '• Nódulo tiroideo palpable o bocio persistente',
      '• TSH fuera de rango tras 3 ajustes de dosis (derivar antes de 6 meses)',
      '• Sospecha de hipotiroidismo severo o mixedema',
      '• Hipotiroidismo secundario (TSH normal o baja con T4L baja)',
      '• Uso de amiodarona o litio (titulación compleja)',
      '• Embarazo con o sin tratamiento previo (objetivos TSH estrictos por trimestre)',
    ],
    layout_position: 'main',
  },
];

// ── Bloque Mermaid (pestaña "Algoritmo") ──────────────────────────────────
const MERMAID_BLOCK = {
  id: 'hipo-v2-mermaid',
  type: 'mermaid',
  order: 20,
  title: 'Algoritmo HCSFB 98 — Manejo del Hipotiroidismo en Policlínico APS',
  content: `flowchart TD
    A([Sospecha clínica o grupo\\nde tamizaje identificado]) --> B[Solicitar TSH + T4L\\nen ayunas · antes de LT4]
    B --> C{Resultado TSH\\nLaboratorio HCSFB}
    C -->|TSH < 5.33\\nnormal| D([Sin hipotiroidismo\\nControl según patología base])
    C -->|TSH 5–10\\nsubclínico leve| E{¿AcTPO+\\no sintomático?}
    E -->|No| F[Observar · repetir TSH\\nen 6 meses]
    E -->|Sí| G
    C -->|TSH 10–20| G[Iniciar LT4 25–50 µg/día\\ntitular a 50–100 µg/día]
    C -->|TSH > 20| H[LT4 1.0–1.6 µg/kg/día\\nsegún edad y peso]
    G --> I{¿Edad\\n≥ 75 años?}
    H --> I
    I -->|Sí| J[Inicio 12.5–25 µg/día\\ntitulación muy lenta]
    I -->|No| K[Inicio 25–50 µg/día\\ntitular c/6–8 semanas]
    J --> L[Control TSH en 6–8 semanas\\n+ AcTPO + perfil lipídico]
    K --> L
    L --> M{¿TSH en meta?\\n< 70a: 1–3 · ≥ 70a: 3–6}
    M -->|Sí| N{¿2° TSH en\\nrango consecutivos?}
    N -->|No| L
    N -->|Sí| O[Control anual médico\\nc/6m alternado QF]
    M -->|No — ajustar dosis| P{¿3 ajustes sin\\ncompensación?}
    P -->|No| Q[Ajustar ±25 µg\\nnuevo control 6–8 semanas]
    Q --> L
    P -->|Sí| R([🏥 Derivar Endocrinología HHM\\nvía Teleprocesos MINSAL])`,
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
console.log(`Bloques checklist (Pauta de Cotejo): ${checklistCount}`);
console.log(`Total: ${mergedBlocks.length}`);
console.log(`\nModo activado: ${localCount > 0 && checklistCount > 0 ? '✅ 3 pestañas' : '❌ faltan bloques'}`);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({
    has_local_protocol: true,
    protocol_code:      'HCSFB 98',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2023',
    protocol_validity:  'Marzo 2027',
    protocol_objective: 'Establecer una guía de referencia para la atención del hipotiroidismo primario en el Policlínico APS del HCSFB, mejorando la pesquisa, previniendo complicaciones y garantizando atención oportuna y de calidad.',
    protocol_authors: [
      { name: 'Dra. Micaela Fasani Montagna', role: 'Elaboradora — Médico Cirujano EDF HCSFB' },
      { name: 'Dr. Maicol Candia Sandoval',   role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'TM Eva López Ferrada',          role: 'Revisora — D.T. Laboratorio Clínico HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',       role: 'Aprobador — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
    ],
    content_blocks: mergedBlocks,
    last_updated: new Date().toISOString(),
  })
  .eq('id', TOPIC_ID);

if (error) { console.error('❌ Error:', error.message); process.exit(1); }
console.log('\n✅ Hipotiroidismo GES actualizado con modo 3 pestañas.');
