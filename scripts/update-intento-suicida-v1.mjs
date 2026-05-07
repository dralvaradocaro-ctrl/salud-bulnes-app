/**
 * Intento Suicida (GCL 1.10) — Reestructura en 3 pestañas siguiendo el axioma de edición.
 * Protocolo | Derivación | Flujogramas
 *
 * Uso:  node scripts/update-intento-suicida-v1.mjs
 *       node scripts/update-intento-suicida-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '64dfc162-38ac-40c9-8cff-2e898bd40988';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const AUTHORS = [
  { name: 'Dr. Rodrigo Enríquez Heredia',    role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
  { name: 'Psicóloga Sandra Ferrada Landero', role: 'Elaboradora — PROSAM HCSFB' },
  { name: 'Dr. Felipe Sancho Tapia',          role: 'Revisor — Subdirector Médico HCSFB' },
  { name: 'Dr. Álvaro Lagos Llanos',          role: 'Aprobador — Director HCSFB' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 1: intsuic_protocolo — Evaluación y manejo en urgencias
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLO_BLOCKS = [
  {
    id: 'intsuic-v4-riesgo',
    tab: 'intsuic_protocolo',
    type: 'criteria',
    color: 'amber',
    order: 1,
    title: '¿A quién evaluar? — Grupos de riesgo',
    content: 'Evaluar conducta suicida en estos grupos aunque el motivo de consulta sea otro. Preguntar directamente no aumenta el riesgo.',
    items: [
      'Síntomas psicopatológicos: depresión, ansiedad severa, psicosis activa',
      'Antecedente de intento de suicidio previo (principal predictor de riesgo)',
      'Diagnóstico psiquiátrico activo',
      'Abuso de sustancias (alcohol, drogas)',
      'Evento estresante reciente: duelo, separación, pérdida laboral, conflicto legal',
      'Enfermedad crónica o maligna, especialmente con dolor o dependencia',
      'Adolescentes con rasgos impulsivos o conductas autolesivas previas',
      'Adultos mayores con desmedro, aislamiento social o dependencia funcional',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v4-sadcalc',
    tab: 'intsuic_protocolo',
    type: 'score_calculator',
    order: 2,
    title: 'Calculadora SAD PERSONS',
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
      { min: 0, max: 2, label: 'Bajo riesgo',      color: 'green', action: 'Manejo ambulatorio — derivar a PROSAM con prioridad' },
      { min: 3, max: 6, label: 'Riesgo moderado',  color: 'amber', action: 'Hospitalizar en MQ o Pediatría con dupla psicosocial' },
      { min: 7, max: 10, label: 'Riesgo alto',     color: 'red',   action: 'Hospitalizar y evaluar criterios de derivación a HCHM' },
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v4-flujo',
    tab: 'intsuic_protocolo',
    type: 'flowchart',
    color: 'green',
    order: 4,
    title: 'Flujo de Atención en Urgencias',
    content: 'Desde la identificación del riesgo hasta la disposición final del paciente',
    details: [
      'Identificar grupo de riesgo → indagar activamente conducta suicida',
      'Confirmar conducta suicida → derivar a urgencias HCSFB',
      'Evaluar presencia de lesiones físicas graves (intoxicación severa, heridas, ahorcamiento)',
      '~ SÍ: estabilizar + derivación inmediata HCHM en ambulancia con médico acompañante',
      '~ NO: continuar evaluación en HCSFB',
      'Calcular SAD PERSONS',
      'Puntaje 0–2: manejo ambulatorio → derivar a PROSAM con prioridad',
      'Puntaje ≥3: hospitalizar en MQ o Pediatría → activar dupla psicosocial (psicólogo + asistente social)',
      'Evaluar criterios de derivación a psiquiatría HCHM',
      '~ Criterio presente: IC a internista de HCHM → traslado coordinado',
      '~ Sin criterio: continuar manejo en HCSFB hasta cumplir criterios de alta',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 2: intsuic_derivacion — Criterios de derivación y alta
// ─────────────────────────────────────────────────────────────────────────────
const DERIVACION_BLOCKS = [
  {
    id: 'intsuic-v4-derivacion',
    tab: 'intsuic_derivacion',
    type: 'criteria',
    color: 'red',
    order: 4,
    title: 'Criterios de Derivación a Psiquiatría HCHM',
    content: 'Cualquiera de los siguientes justifica IC a internista HCHM y traslado en ambulancia con médico acompañante',
    items: [
      '━━━ GRAVEDAD DEL INTENTO ━━━',
      'Alta letalidad: intoxicación masiva, arma de fuego, ahorcamiento, precipitación',
      'Repercusión médico-quirúrgica que requiere UCI o UPC',
      '━━━ ESTADO PSIQUIÁTRICO ━━━',
      'Trastorno psiquiátrico descompensado no manejable en hospital básico',
      'Primera psicosis sin diagnóstico previo o psicosis activa severa',
      'Agitación refractaria a manejo con recursos disponibles en HCSFB',
      '━━━ RIESGO DE REINTENTO ━━━',
      'Ideación suicida persistente tras estabilización inicial',
      'Sin conciencia de enfermedad (no reconoce el intento como un problema)',
      'Eventos estresantes sin resolución y red de apoyo insuficiente o ausente',
      '━━━ OTROS CRITERIOS ━━━',
      'Clara intencionalidad suicida mantenida tras estabilización',
      'Duda real si el intento fue abortado (difícil distinguir de accidente o impulsividad)',
    ],
    layout_position: 'main',
  },
  {
    id: 'intsuic-v4-alta',
    tab: 'intsuic_derivacion',
    type: 'criteria',
    color: 'green',
    order: 5,
    title: 'Criterios de Alta',
    content: 'Debe cumplirse al menos uno — el alta siempre incluye plan de crisis y derivación prioritaria a PROSAM',
    items: [
      'Indicación expresa de psiquiatra tras evaluación formal de riesgo',
      'Petición familiar firmada con registro médico de riesgo informado al paciente y familia',
      'Compensación del episodio + hora de control psiquiátrico asignada (PROSAM u otro)',
      '━━━ AL ALTA SIEMPRE ━━━',
      'Plan de acción en crisis elaborado con dupla psicosocial',
      'Fono de emergencia entregado al paciente y familia',
      'Derivación a PROSAM con prioridad confirmada',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 3: intsuic_flujogramas — Algoritmo visual
// ─────────────────────────────────────────────────────────────────────────────
const FLUJOGRAMAS_BLOCKS = [
  {
    id: 'intsuic-v4-mermaid',
    tab: 'intsuic_flujogramas',
    type: 'mermaid',
    order: 6,
    title: 'Algoritmo GCL 1.10 — Manejo de Intento de Suicidio',
    content: `flowchart TD
    A([Paciente de riesgo\\no conducta suicida]) --> B{¿Conducta\\nsuicida confirmada?}
    B -->|No| C([Seguimiento habitual\\nderivación SM si pertinente])
    B -->|Sí| D{¿Lesiones físicas\\ngraves?}
    D -->|Sí| E[Estabilizar\\n+ derivación inmediata HCHM]
    D -->|No| F[Calcular SAD PERSONS]
    F --> G{Puntaje}
    G -->|0–2| H[Manejo ambulatorio\\nderivación PROSAM prioritaria]
    G -->|3–10| I[Hospitalizar MQ/Pediatría\\ndupla psicosocial]
    I --> J{¿Criterio\\nderivación HCHM?}
    J -->|Sí| L([IC internista HCHM\\nTraslado en ambulancia])
    J -->|No| K{¿Criterio\\nde alta?}
    K -->|No — continuar| I
    K -->|Sí| M[Alta con plan de crisis\\ncontrol PROSAM prioritario]`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ALL_BLOCKS = [...PROTOCOLO_BLOCKS, ...DERIVACION_BLOCKS, ...FLUJOGRAMAS_BLOCKS];

const tabs = [...new Set(ALL_BLOCKS.map(b => b.tab))];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  INTENTO SUICIDA v4 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);
console.log(`\nBloques totales: ${ALL_BLOCKS.length}`);
console.log(`Pestañas: ${tabs.join(' | ')}`);
tabs.forEach(tab => {
  const count = ALL_BLOCKS.filter(b => b.tab === tab).length;
  console.log(`  ${tab}: ${count} bloques`);
});

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({
    protocol_authors: AUTHORS,
    content_blocks:   ALL_BLOCKS,
    last_updated:     new Date().toISOString(),
  })
  .eq('id', TOPIC_ID);

if (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}

console.log('\n✅ Intento Suicida actualizado con estructura de 3 pestañas.');
