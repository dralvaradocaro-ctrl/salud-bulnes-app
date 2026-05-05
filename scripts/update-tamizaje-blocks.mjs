/**
 * Actualiza los content_blocks del topic "Protocolo de Tamizaje Nutricional"
 * - Elimina bloque Objetivo (ya aparece en ProtocolHeader)
 * - Añade botón referencia a la calculadora NRS-2002
 * - Convierte Criterios de Evaluación Prioritaria a type "criteria"
 * - Añade flujograma operativo como bloque Mermaid
 *
 * Uso:  node scripts/update-tamizaje-blocks.mjs
 *       node scripts/update-tamizaje-blocks.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '699c845c6050f253dd81526f';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const MERMAID_FLOWCHART = `flowchart TD
    A([Ingreso Paciente\\nServicio de Medicina]) --> B{¿Criterio\\nPrioritario?\\nColostomía · Sondas · Sepsis\\nDesnutrición · Caquexia...}
    B -->|Sí| C[ALTO RIESGO\\nEvaluación Prioritaria]
    C --> D[Derivación a Nutrición\\nPlazo: 24-48 horas hábiles]
    B -->|No| E[TAMIZAJE INICIAL\\nNRS-2002 Etapa 1\\n1. IMC menor a 20.5\\n2. Pérdida de peso\\n3. Baja ingesta\\n4. Enf. grave]
    E --> F{¿Alguna respuesta\\npositiva?}
    F -->|No — Todas negativas| G[SIN RIESGO\\nVigilancia clínica\\nReevaluar a demanda]
    F -->|Sí — Al menos una| H[EVALUACIÓN FORMAL\\nNRS-2002 Etapa 2\\nEstado Nutricional + Severidad\\n+ Edad mayor a 70 años]
    H --> I{Puntaje Total\\nNRS-2002}
    I -->|Menos de 3 puntos| J[RIESGO BAJO\\nEvaluación nutricional precoz\\nPlazo: 5 días hábiles]
    I -->|3 o más puntos| K[ALTO RIESGO\\nDerivación a Nutrición\\nPlazo: 48-72 horas hábiles]

    style A fill:#1e40af,color:#fff,stroke:#1e3a8a
    style C fill:#dc2626,color:#fff,stroke:#b91c1c
    style D fill:#fecaca,color:#7f1d1d,stroke:#dc2626
    style G fill:#16a34a,color:#fff,stroke:#15803d
    style J fill:#d97706,color:#fff,stroke:#b45309
    style K fill:#dc2626,color:#fff,stroke:#b91c1c`;

const NEW_BLOCKS = [
  // 0 — Botón calculadora
  {
    id: 'ref-nrs2002-calc',
    type: 'reference',
    reference_type: 'calculator',
    reference_id: 'nrs2002',
    reference_label: 'Calculadora interactiva NRS-2002 — Screening inicial y evaluación formal de riesgo nutricional',
    title: 'Calculadora NRS-2002',
    color: 'blue',
    order: 0,
    layout_position: 'main',
  },

  // 1 — Población objetivo (breve, distinto del objetivo)
  {
    id: 'ai-1771865233507-1',
    type: 'text',
    color: 'blue',
    order: 1,
    title: 'Población Objetivo',
    content: 'Todos los pacientes que ingresan al Servicio de Medicina del Hospital de Bulnes, salvo aquellos que por proporcionalidad terapéutica y/o criterio clínico no se benefician de evaluación nutricional formal.',
    details: [],
    layout_position: 'main',
  },

  // 2 — Roles
  {
    id: 'ai-1771865233507-2',
    type: 'flowchart',
    color: 'blue',
    order: 2,
    title: 'Roles y Responsabilidades por Estamento',
    content: 'Distribución de tareas del equipo multidisciplinario',
    details: [
      'TENS / Enfermería: Aplicar Etapa 1 del NRS-2002 al ingreso e identificar criterios de prioridad',
      'Enfermero/a: Aplicar Etapa 2 del NRS-2002 si el tamizaje inicial es alterado y gestionar derivación',
      'Equipo Médico: Identificar pacientes con evaluación prioritaria e indicar soporte nutricional',
      'Equipo de Nutrición: Realizar evaluación completa, iniciar/monitorear soporte y realizar seguimiento de ingesta',
    ],
    layout_position: 'main',
  },

  // 3 — Criterios prioritarios (type criteria para mejor visual)
  {
    id: 'ai-1771865233507-3',
    type: 'criteria',
    color: 'red',
    order: 3,
    title: 'Criterios de Evaluación Nutricional Prioritaria',
    content: 'Pacientes que requieren evaluación independiente del resultado del screening NRS-2002',
    items: [
      'Usuarios con colostomía o ileostomía',
      'Usuarios con sonda de alimentación nasogástrica, naso yeyunal, gastrostomía o yeyunostomía',
      'Pacientes con nutrición enteral oral vigente',
      'Ingreso por desnutrición calórico-proteica',
      'Síndrome de realimentación (diagnosticado o en alto riesgo)',
      'Caquexia',
      'Sepsis o shock séptico',
      'Enfermedad oncológica activa con compromiso nutricional',
      'Riesgo moderado o alto de lesiones por presión (NSRAS, Braden Q o Braden)',
      'Cualquier cuadro que, a juicio médico, justifique evaluación prioritaria',
    ],
    layout_position: 'main',
    // Nota sobre plazo
    description: 'Plazo de evaluación formal: 24 a 48 horas hábiles desde el ingreso',
  },

  // 4 — Tamizaje inicial
  {
    id: 'ai-1771865233507-4',
    type: 'flowchart',
    color: 'green',
    order: 4,
    title: 'Paso 1: Tamizaje Inicial (NRS-2002 Etapa 1)',
    content: 'Aplicado por TENS/Enfermería al ingreso — 4 preguntas dicotómicas',
    details: [
      'IMC estimado < 20,5 kg/m² (estimar clínicamente si no hay peso disponible)',
      'Pérdida de peso en los últimos 3 meses',
      'Disminución de la ingesta alimentaria en la última semana',
      'Presencia de enfermedad grave',
      'Resultado Negativo (todas No): Sin riesgo nutricional actual',
      'Resultado Positivo (al menos una Sí): Tamizaje alterado → pasar a Etapa 2',
    ],
    layout_position: 'main',
  },

  // 5 — Evaluación formal
  {
    id: 'ai-1771865233507-5',
    type: 'flowchart',
    color: 'amber',
    order: 5,
    title: 'Paso 2: Evaluación Formal (NRS-2002 Etapa 2)',
    content: 'Aplicada por Enfermería cuando el tamizaje inicial resulta alterado',
    details: [
      'Componente Nutricional: IMC bajo, pérdida de peso reciente, reducción de ingesta (0-3 pts)',
      'Componente de Severidad: estrés metabólico Leve · Moderado · Severo (0-3 pts)',
      'Factor Edad: +1 punto adicional si el paciente tiene ≥ 70 años',
      'Puntaje ≥ 3 → Alto riesgo → Derivación a Nutrición prioritaria (48-72 h)',
      'Puntaje < 3 → Riesgo bajo → Evaluación precoz (5-7 días hábiles)',
    ],
    layout_position: 'main',
  },

  // 6 — Manejo alto riesgo
  {
    id: 'ai-1771865233507-6',
    type: 'flowchart',
    color: 'red',
    order: 6,
    title: 'Manejo: Alto Riesgo (NRS-2002 ≥ 3)',
    content: 'Conducta ante puntaje igual o superior a 3',
    details: [
      'Derivación inmediata a Nutrición prioritaria',
      'Evaluación nutricional completa por nutricionista',
      'Definición de intervención o soporte nutricional específico',
      'Plazo: 48-72 horas hábiles desde el ingreso',
    ],
    layout_position: 'main',
  },

  // 7 — Manejo riesgo bajo / sin riesgo
  {
    id: 'ai-1771865233507-7',
    type: 'flowchart',
    color: 'green',
    order: 7,
    title: 'Manejo: Riesgo Bajo (< 3) y Sin Riesgo',
    content: 'Seguimiento y vigilancia clínica',
    details: [
      'Riesgo Bajo (< 3): Evaluación nutricional precoz — no inmediata — plazo 5-7 días hábiles',
      'Sin Riesgo (tamizaje negativo): No requiere evaluación formal precoz',
      'Reevaluar ante cualquier deterioro o cambios en la ingesta',
      'Mantener vigilancia clínica activa en ambos casos',
    ],
    layout_position: 'main',
  },

  // 8 — Reevaluación
  {
    id: 'ai-1771865233507-8',
    type: 'alert',
    color: 'orange',
    order: 8,
    title: 'Criterios de Reevaluación Nutricional',
    content: 'Todo paciente debe recibir reevaluación en presencia de cualquiera de estas situaciones',
    details: [
      'Deterioro clínico evidente',
      'Disminución significativa de la ingesta',
      'Prolongación de la hospitalización',
      'Complicaciones infecciosas',
      'Cambio en requerimientos metabólicos',
      'Modificación de la vía de alimentación',
    ],
    layout_position: 'main',
  },

  // 9 — Registros
  {
    id: 'ai-1771865233507-9',
    type: 'text',
    color: 'blue',
    order: 9,
    title: 'Registros y Documentación',
    content: 'El tamizaje debe registrarse en la ficha clínica usando Anexo B o su versión digital equivalente.',
    details: [
      'Incluir resultado del tamizaje, profesional responsable, fecha y hora',
      'La indicación médica de evaluación prioritaria debe quedar explícita en la solicitud de hospitalización, ingreso o evolución médica',
    ],
    layout_position: 'main',
  },

  // 10 — Flujograma Operativo (Mermaid)
  {
    id: 'mermaid-flujo-nutricional',
    type: 'mermaid',
    color: 'blue',
    order: 10,
    title: 'Flujograma Operativo — Estratificación Nutricional Servicio de Medicina',
    content: MERMAID_FLOWCHART,
    layout_position: 'main',
  },
];

console.log(`\nNuevos bloques (${NEW_BLOCKS.length}):`);
NEW_BLOCKS.forEach(b => console.log(`  [${b.order}] ${b.type.padEnd(12)} ${b.title}`));

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({ content_blocks: NEW_BLOCKS, last_updated: new Date().toISOString() })
  .eq('id', TOPIC_ID);

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log('\n✅ content_blocks actualizados correctamente.');
