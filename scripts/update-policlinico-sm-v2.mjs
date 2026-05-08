/**
 * Reescribe 3 protocolos Policlínico/SM desde los PDFs fuente (HCSFB 153, 160, 166)
 * aplicando el Axioma de edición:
 *
 *  - Sin emojis
 *  - Sin redundancia
 *  - Datos locales primero
 *  - Dosis exactas desde PDF (corrige error: Clotiazepam 5 mg cp, max 30/receta)
 *  - Separadores como estructura
 *  - Escala SAD PERSONS completa (sin abrir el PDF)
 *  - Mermaid actualizado con nodo de re-evaluación en Prevención Autolesiones
 *
 * Uso:  node scripts/update-policlinico-sm-v2.mjs
 *       node scripts/update-policlinico-sm-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─── HCSFB 153 — CLOTIAZEPAM ──────────────────────────────────────────────────
const ID_CLOTIA = 'ef1502b6-2c86-455a-8f38-e90e355e7d9e';

const BLOCKS_CLOTIA = [
  {
    id:    'clotia-inclusion',
    type:  'criteria',
    color: 'blue',
    order: 1,
    title: 'Criterios de Inclusión — ¿Cuándo indicar Clotiazepam?',
    content: 'Solo indicar en diagnósticos CIE-10 específicos con medidas no farmacológicas insuficientes',
    items: [
      '━━━ DIAGNÓSTICOS VÁLIDOS ━━━',
      'F41.9 — Trastorno de ansiedad no especificado',
      'F41.1 — Trastorno de ansiedad generalizada',
      'F41.0 — Trastorno de pánico (ansiedad paroxística episódica)',
      'F40.x — Trastornos de ansiedad fóbica (agorafobia, fobia social, específica)',
      '━━━ CONDICIÓN OBLIGATORIA ━━━',
      'Iniciar o ajustar ISRS en forma concomitante (primera línea de tratamiento definitivo)',
      '~ Sertralina 50 mg/día — primera línea',
      '~ Fluoxetina 20 mg/día',
      '~ Escitalopram 10 mg/día',
      'El ISRS cubre la ansiedad a largo plazo; el Clotiazepam cubre el período de latencia inicial (2–4 semanas)',
    ],
    layout_position: 'main',
  },
  {
    id:    'clotia-exclusion',
    type:  'criteria',
    color: 'red',
    order: 2,
    title: 'Criterios de Exclusión — No indicar Clotiazepam si:',
    content: 'Contraindicaciones definidas en el protocolo HCSFB 153',
    items: [
      'Trastorno del sueño como diagnóstico principal (usar hipnótico específico — ver HCSFB 129)',
      'Uso crónico de benzodiazepinas previo (riesgo de abstinencia y adición)',
      'Trastorno por abuso de sustancias activo (alcohol u otras drogas)',
    ],
    layout_position: 'main',
  },
  {
    id:    'clotia-prescripcion',
    type:  'flowchart',
    color: 'green',
    order: 3,
    title: 'Protocolo de Prescripción HCSFB',
    content: 'Normativa interna — supervisión por QF Farmacia obligatoria',
    details: [
      '1. Confirmar diagnóstico CIE-10 incluido y ausencia de criterios de exclusión',
      '2. Iniciar o ajustar ISRS concomitantemente (obligatorio antes de prescribir)',
      '3. Clotiazepam 5 mg comprimidos: 1–2 comprimidos/día según severidad del cuadro',
      '~ Máximo 30 comprimidos por receta (equivale a 2–4 semanas de tratamiento)',
      '4. Receta retenida (benzodiazepina) — prescribir en formulario correspondiente',
      '5. QF Farmacia autoriza la entrega y supervisa el límite de 30 comprimidos',
      '6. No renovar sin nueva atención médica presencial',
      '7. Informar al paciente sobre el riesgo de dependencia y el carácter transitorio del fármaco',
      '8. Registrar en Rayen',
    ],
    layout_position: 'main',
  },
  {
    id:    'clotia-seguimiento',
    type:  'criteria',
    color: 'amber',
    order: 4,
    title: 'Seguimiento y Plan de Retiro',
    content: 'El ISRS es el tratamiento definitivo — el Clotiazepam se retira en 2–4 semanas',
    items: [
      '━━━ CONTROLES ━━━',
      'Control en 2 semanas: evaluar respuesta al ISRS y tolerabilidad del Clotiazepam',
      'Control en 4 semanas: decidir retiro gradual o derivación a PROSAM/Psiquiatría',
      'Derivar a PROSAM si requiere más de 4 semanas o no hay respuesta al ISRS',
      '━━━ PAUTA DE RETIRO GRADUAL ━━━',
      'Semana 1: reducir 25% de la dosis',
      'Semana 2: reducir otro 25%',
      'Semana 3: días alternos',
      'Semana 4: suspender',
      '━━━ SEÑALES DE ABSTINENCIA ━━━',
      'Ansiedad rebote, insomnio, irritabilidad, sudoración',
      'Conducta: retornar a dosis previa y retirar más lentamente',
      '━━━ ISRS POSTERIOR ━━━',
      'Mantener el ISRS al menos 6 meses adicionales tras suspender el Clotiazepam',
    ],
    layout_position: 'main',
  },
  {
    id:    'clotia-mermaid',
    type:  'mermaid',
    order: 5,
    title: 'Algoritmo HCSFB 153 — Uso de Clotiazepam en Ansiedad',
    content: `flowchart TD
    A([Médico detecta trastorno de ansiedad\\ncon medidas no farmacológicas insuficientes]) --> B{¿Criterio\\nde exclusión?}
    B -->|BZD crónicas · abuso sustancias\\ntrastorno del sueño| C([No indicar Clotiazepam\\nVer alternativa — HCSFB 129])
    B -->|No| D{¿Diagnóstico\\nCIE-10 incluido?}
    D -->|No — otro diagnóstico| C
    D -->|F41.0 / F41.1 / F41.9 / F40| E[Iniciar ISRS concomitante\\nSertralina 50 mg/día primera línea]
    E --> F[Clotiazepam 5 mg: 1–2 cp/día\\nMáx 30 cp · máx 4 semanas]
    F --> G[QF autoriza entrega\\nRegistrar en Rayen]
    G --> H[Control en 2 semanas]
    H --> I{¿Respuesta\\nal ISRS?}
    I -->|Sí| J[Retiro gradual Clotiazepam\\n25% por semana]
    I -->|No — < 4 semanas| K[Continuar · nueva evaluación\\nmédica obligatoria a las 4 sem]
    K --> L{¿> 4 semanas\\nsin respuesta?}
    L -->|Sí| M([Derivar PROSAM o Psiquiatría])
    L -->|No| J
    J --> N([Mantener ISRS 6 meses adicionales])`,
    layout_position: 'main',
  },
];

// ─── HCSFB 166 — CRITERIOS SM ────────────────────────────────────────────────
const ID_SM = 'fa57bf50-f39c-4438-af5e-bfa33be36fce';

const BLOCKS_SM = [
  {
    id:    'sm-sad-persons',
    type:  'criteria',
    color: 'amber',
    order: 1,
    title: 'Escala SAD PERSONS — Cálculo de Riesgo Suicida',
    content: 'Puntaje 0–2: manejo ambulatorio · 3–6: hospitalizar · > 6: hospitalizar con urgencia',
    items: [
      '━━━ ÍTEMS (1 punto cada uno) ━━━',
      'S — Sexo masculino',
      'A — Edad menor de 20 o mayor de 45 años',
      'D — Depresión activa',
      'P — Tentativa suicida previa',
      'E — Abuso de alcohol',
      'R — Pensamiento irracional (psicosis o deterioro cognitivo)',
      'S — Sin apoyo social',
      'O — Plan organizado de suicidio',
      'N — No tiene pareja o cónyuge',
      'S — Enfermedad somática grave',
      '━━━ INTERPRETACIÓN ━━━',
      '0–2 puntos: poco riesgo — manejo ambulatorio',
      '3–6 puntos: hospitalizar en HCSFB',
      '> 6 puntos: hospitalizar con urgencia — evaluar traslado HCHM',
    ],
    layout_position: 'main',
  },
  {
    id:    'sm-criterios-ingreso',
    type:  'criteria',
    color: 'blue',
    order: 2,
    title: 'Criterios de Ingreso a Hospitalización',
    content: 'Cualquiera de estos criterios justifica hospitalización en Medicina o Pediatría HCSFB — indicación médica obligatoria',
    items: [
      'Ideación suicida con SAD PERSONS mayor o igual a 3 puntos',
      'Intento suicida (independiente del puntaje)',
      'Psicosis activa (delirios, alucinaciones, desorganización)',
      'Planes activos de dañar a terceros',
    ],
    layout_position: 'main',
  },
  {
    id:    'sm-criterios-traslado',
    type:  'criteria',
    color: 'red',
    order: 3,
    title: 'Criterios de Traslado a HCHM — Psiquiatría',
    content: 'Cuando los recursos de hospital básico son insuficientes — gestionar interconsulta con internista HCHM antes del traslado',
    items: [
      'Intento suicida de alta letalidad que requiera UCI o UPC',
      'Catatonía (requiere diagnóstico diferencial y tratamiento especializado)',
      'Manía o hipomanía severa sin respuesta a tratamiento inicial',
      'Primera psicosis sin diagnóstico previo (requiere evaluación especializada completa)',
      'Agitación psicomotora incontrolable con los recursos disponibles en HCSFB',
      '━━━ GESTIÓN ━━━',
      'Llamar a Internista HCHM para interconsulta urgente',
      'Traslado en ambulancia con acompañamiento médico',
    ],
    layout_position: 'main',
  },
  {
    id:    'sm-criterios-egreso',
    type:  'criteria',
    color: 'green',
    order: 4,
    title: 'Criterios de Egreso — TODOS deben cumplirse',
    content: 'Para el alta de hospitalización por causa psiquiátrica — verificar cada criterio antes de dar egreso',
    items: [
      'Sin ideación suicida activa (puede haber ideación pasiva encapsulada)',
      'Sin psicosis activa (o delirios encapsulados sin riesgo conductual)',
      'No planea dañar a terceros',
      'Red de apoyo adecuada (familiar o comunitaria que pueda supervisar)',
      'Control médico concertado en 7 días o menos',
      'Plan de acción en crisis elaborado con dupla psicosocial antes del alta',
      '━━━ DERIVACIÓN AL ALTA ━━━',
      'Derivar a PROSAM del centro de salud correspondiente',
      'Contacto crisis: Fono Salud 600 360 7777 · Urgencias HCSFB',
    ],
    layout_position: 'main',
  },
  {
    id:    'sm-mermaid',
    type:  'mermaid',
    order: 5,
    title: 'Algoritmo HCSFB 166 — Criterios de Ingreso, Traslado y Egreso SM',
    content: `flowchart TD
    A([Médico evalúa paciente con\\nsintomatología de salud mental]) --> B{¿Criterio\\nde ingreso?}
    B -->|No| C([Manejo ambulatorio\\nPROSAM o policlínico])
    B -->|SAD PERSONS ≥ 3\\nintento suicida\\npsicosis · planes daño| D[Hospitalizar en MQ o Pediatría\\nIndicación médica obligatoria]
    D --> E{¿Criterio\\nde traslado HCHM?}
    E -->|UCI · catatonía · manía\\n1ª psicosis · agitación refractaria| F[IC Internista HCHM\\nTraslado en ambulancia con médico]
    E -->|No| G[Manejo en HCSFB\\ndupla psicosocial activa]
    G --> H{¿Cumple TODOS\\nlos criterios de egreso?}
    H -->|No| I[Ajuste de tratamiento\\nmantener hospitalizado]
    I --> H
    H -->|Sí| J[Alta con plan de crisis\\ncontrol en 7 días]
    J --> K([Derivación PROSAM prioritaria])`,
    layout_position: 'main',
  },
];

// ─── HCSFB 160 — PREVENCIÓN AUTOLESIONES ─────────────────────────────────────
const ID_AUTO = 'c0aecd59-f807-4c2e-af91-408d5f5928b3';

const BLOCKS_AUTO = [
  {
    id:    'auto-asq',
    type:  'flowchart',
    color: 'blue',
    order: 1,
    title: 'Cuestionario ASQ — Ask Suicide-Screening Questions',
    content: 'Aplicar a TODO paciente hospitalizado al ingreso · Lo aplica el enfermero/a de sala · Registrar y anexar a ficha clínica · Sensibilidad 100% · Especificidad 89%',
    details: [
      '━━━ PREGUNTAS OBLIGATORIAS (hacer las 4) ━━━',
      '',
      'P1: "En las últimas semanas, ¿ha deseado estar muerto?"',
      'P2: "En las últimas semanas, ¿usted o su familia estarían mejor si usted estuviera muerto?"',
      'P3: "En la última semana, ¿ha estado pensando en suicidarse?"',
      'P4: "¿Alguna vez ha intentado suicidarse?" (Si sí: ¿cómo?, ¿cuándo?)',
      '',
      '━━━ PREGUNTA ADICIONAL (solo si una o más respuestas positivas) ━━━',
      '',
      'P5: "¿Está pensando en suicidarse en este momento?"',
      '',
      '→ Actuar según resultado — ver bloque Manejo según Resultado',
    ],
    layout_position: 'main',
  },
  {
    id:    'auto-manejo',
    type:  'criteria',
    color: 'green',
    order: 2,
    title: 'Manejo según Resultado ASQ',
    content: 'Tres vías de acción según el resultado — aplicar inmediatamente y registrar en ficha clínica',
    items: [
      '━━━ VIA 1 — Ninguna positiva (P1 a P4 todas NO) ━━━',
      'Sin precauciones adicionales',
      'Alta segura cuando corresponda clínicamente',
      '',
      '━━━ VIA 2 — Una o más positivas + P5 = NO (sin ideación actual) ━━━',
      'Sin necesidad de reposicionamiento ni retiro de objetos',
      'Evaluación por dupla psicosocial antes del alta',
      'Derivación a PROSAM al alta según criterio médico',
      'Registrar evaluación en ficha clínica',
      '',
      '━━━ VIA 3 — Una o más positivas + P5 = SI (ideación activa) ━━━',
      'Trasladar al paciente a sala frente al mesón de enfermería (supervisión visual continua)',
      'Retirar objetos peligrosos del entorno: cinturones, cables, medicamentos, objetos cortantes',
      'Avisar al médico tratante de forma inmediata',
      'Evaluación urgente por dupla psicosocial',
      'Médico puede indicar manejo farmacológico o contención según lo protocolizado',
      'Derivación a psiquiatría según criterio médico',
      'Mantener hospitalizado hasta cese de ideación suicida aguda',
      'Derivación a PROSAM al alta',
    ],
    layout_position: 'main',
  },
  {
    id:    'auto-mermaid',
    type:  'mermaid',
    order: 3,
    title: 'Algoritmo HCSFB 160 — Prevención de Autolesiones y Suicidio',
    content: `flowchart TD
    A([Paciente ingresa\\na hospitalización]) --> B[Enfermero/a aplica ASQ al ingreso\\nRegistra y anexa a ficha clínica]
    B --> C{P1–P4:\\n¿alguna positiva?}
    C -->|No — todas negativas| D([Sin precauciones adicionales\\nAlta cuando corresponda])
    C -->|Si — una o más positivas| E[Aplicar P5:\\n¿ideación suicida actual?]
    E -->|P5 = No\\nsin ideación actual| F[Evaluación dupla psicosocial\\nantes del alta]
    F --> G([Derivación PROSAM al alta\\nRegistro en ficha])
    E -->|P5 = Si\\nideación activa| H[Sala frente al mesón\\nsupervisión visual continua]
    H --> I[Retirar objetos peligrosos\\nAvisar médico tratante]
    I --> J[Evaluación urgente\\ndupla psicosocial]
    J --> K[Manejo farmacológico o contención\\nsegún protocolos HCSFB]
    K --> L{¿Cede\\nideación suicida aguda?}
    L -->|No| K
    L -->|Si| M([Alta con derivación\\nPROSAM prioritaria])`,
    layout_position: 'main',
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  POLICLÍNICO SM v2 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const UPDATES = [
  {
    label:  'HCSFB 153 — Clotiazepam',
    id:     ID_CLOTIA,
    blocks: BLOCKS_CLOTIA,
    notes:  [
      'Corrige dosis: 5 mg cp 1-2/día (era 5-10mg c/8-12h, excedía límite 30cp)',
      'Elimina exclusiones no presentes en PDF (embarazo, miastenia, etc.)',
      'Elimina todos los emojis',
    ],
  },
  {
    label:  'HCSFB 166 — Criterios SM',
    id:     ID_SM,
    blocks: BLOCKS_SM,
    notes:  [
      'Agrega bloque SAD PERSONS completo (10 ítems + interpretación)',
      'Corrige doble bullet en criterios de ingreso',
      'Elimina emojis (checkmarks, teléfono)',
    ],
  },
  {
    label:  'HCSFB 160 — Prevención Autolesiones',
    id:     ID_AUTO,
    blocks: BLOCKS_AUTO,
    notes:  [
      'Agrega desde PDF: derivación psiquiatría + manejo farmacológico/contención en Vía 3',
      'Agrega nodo re-evaluación de ideación en mermaid',
      'Aclara registro en ficha clínica',
    ],
  },
];

for (const u of UPDATES) {
  const { data: topic, error } = await supabase
    .from('topics').select('content_blocks').eq('id', u.id).single();

  if (error) { console.error(`❌ Fetch ${u.label}: ${error.message}`); continue; }

  console.log(`📋 ${u.label}`);
  console.log(`   Bloques actuales: ${(topic.content_blocks||[]).length}  →  nuevos: ${u.blocks.length}`);
  u.notes.forEach(n => console.log(`   ~ ${n}`));
  console.log();

  if (!APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ content_blocks: u.blocks }).eq('id', u.id);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Actualizado.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
