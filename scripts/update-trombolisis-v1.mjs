/**
 * Protocolo de Trombolisis IAMEST (HCSFB, sin código oficial) — 5 pestañas desde PDF real.
 * Protocolo | Fármacos | Contraindicaciones | Monitoreo | Flujogramas
 *
 * Uso:  node scripts/update-trombolisis-v1.mjs
 *       node scripts/update-trombolisis-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = 'a0ba85e5-04db-4d3d-9232-041c4a55410b';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const AUTHORS = [
  { name: 'Dr. Sebastián Bustos Sepúlveda',    role: 'Elaborador — Jefe Servicio Urgencias HCSFB' },
  { name: 'Dra. Valentina Sandoval Valenzuela', role: 'Elaboradora — Jefa Sub-rogante Urgencias HCSFB' },
  { name: 'Dra. Estefanía Acuña Brevis',        role: 'Elaboradora — Médica EDF HCSFB' },
  { name: 'EU. Rocío Muñoz',                    role: 'Colaboradora — Enfermera Urgencias HCSFB' },
  { name: 'Dr. Felipe Sancho Tapia',            role: 'Revisor — Subdirector Médico HCSFB' },
  { name: 'Dr. Álvaro Lagos Llanos',            role: 'Aprobador — Director HCSFB' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 1: trombo_protocolo — Contexto local y decisión de reperfusión
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLO_BLOCKS = [
  {
    id: 'trombo-v1-contexto',
    tab: 'trombo_protocolo',
    type: 'criteria',
    color: 'blue',
    order: 1,
    title: 'Realidad Local HCSFB — Por qué fibrinólisis',
    content: 'El HCSFB opta por un enfoque fármaco-invasivo dado que la PCI primaria no es factible en tiempo aceptable desde Bulnes.',
    items: [
      'Tiempo de diagnóstico ECG de IAMEST: ~10 minutos',
      'No hay SAMU permanente en la comuna — espera de móvil avanzado: 30–40 minutos mínimo',
      'Centro derivador para PCI: Hospital Las Higueras, Talcahuano — 1 hora 20 min en ambulancia',
      'Tiempo total diagnóstico → PCI: mayor a 120 minutos en condiciones ideales',
      '━━━ ESTRATEGIA ELEGIDA ━━━',
      'Dolor torácico menor a 12 horas + IAMEST → Enfoque fármaco-invasivo: fibrinólisis + PCI diferida 2–24h',
      'Dolor torácico 12 a 24 horas + IAMEST → PCI primaria directa (solicitar SAMU, no fibrinólisis)',
      'Siempre sujeto a criterio médico y condiciones del momento',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-diagnostico',
    tab: 'trombo_protocolo',
    type: 'criteria',
    color: 'amber',
    order: 2,
    title: 'Criterios Diagnósticos de IAMEST por ECG',
    content: 'Evidencia electrocardiográfica de necrosis miocárdica — ECG en los primeros 10 minutos',
    items: [
      'Elevación del segmento ST en al menos 2 derivaciones contiguas',
      'Bloqueo de rama izquierda nuevo o presumiblemente nuevo con clínica compatible',
      'Dolor torácico retroesternal típico de más de 20 minutos de duración',
      'En pacientes mayores de 35 años: tener precaución — pericarditis se manifiesta con síntomas similares (si hay duda, no repertusar)',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-medidas-generales',
    tab: 'trombo_protocolo',
    type: 'flowchart',
    color: 'green',
    order: 3,
    title: 'Medidas Generales en SCA — Iniciar al ingreso a REA',
    content: 'Medidas concomitantes mientras se prepara la trombolisis y se coordina el traslado',
    details: [
      'Instalar monitorización continua → PA, FC, SatO2, ritmo cardíaco',
      'Oxígeno → solo si SatO2 menor a 90%',
      'Aspirina → 150–300 mg masticada VO (contraindicado en úlcera péptica sangrante o alergia grave)',
      'Nitroglicerina → solo si PAS mayor a 90 mmHg y FC 50–100 lpm',
      '~ Usar con precaución o no usar en IAM de pared inferior o IAM de VD',
      'Morfina → si dolor grave no cede a nitratos; reduce demanda miocárdica de O2',
      'Clopidogrel → carga 300 mg VO si menor de 75 años; carga 75 mg VO si mayor de 75 años; mantención 75 mg/día',
      'Instalar 2 VVP, jeringas 22–23G, comprimir todo sitio de punción por más de 10 minutos',
      'Carro de paro disponible a mano durante todo el procedimiento',
      'Llamar a hemodinamista de turno → enviar ECG por teléfono → recibir indicación de reperfusión',
      'Solicitar móvil avanzado SAMU → traslado a Hospital Las Higueras (Talcahuano)',
      'Registro completo en DAU con fecha y hora de cada paso',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 2: trombo_farmacos — Trombolíticos y anticoagulación
// ─────────────────────────────────────────────────────────────────────────────
const FARMACOS_BLOCKS = [
  {
    id: 'trombo-v1-tnk',
    tab: 'trombo_farmacos',
    type: 'criteria',
    color: 'blue',
    order: 4,
    title: 'Tenecteplase (TNK) — Fármaco de Elección',
    content: 'Bolo EV único en 5–10 segundos. Dosis según peso corporal. Administrar por VVP exclusiva, no mezclar con otros fármacos ni en líneas con dextrosa.',
    items: [
      '━━━ DOSIS POR PESO ━━━',
      'Menor de 60 kg → 6.000 UI (30 mg) → 6 mL de solución reconstituida',
      '60 a menor de 70 kg → 7.000 UI (35 mg) → 7 mL',
      '70 a menor de 80 kg → 8.000 UI (40 mg) → 8 mL',
      '80 a menor de 90 kg → 9.000 UI (45 mg) → 9 mL',
      '90 kg o más → 10.000 UI (50 mg) → 10 mL (máximo absoluto)',
      '━━━ RECONSTITUCIÓN ━━━',
      'Disolver vial de 50 mg con la jeringa precargada de 10 mL de agua inyectable',
      'Concentración reconstituida: 5 mg/mL (1.000 UI/mL)',
      'Girar suavemente — NO agitar. Usar inmediatamente o refrigerar a 2–8°C por máximo 8 horas',
      '━━━ ADMINISTRACIÓN ━━━',
      'Bolo EV único en 5–10 segundos por VVP exclusiva',
      'Flush de SF 0,9% 10 mL antes y después del bolo',
      'No mezclar con heparina ni en vía con dextrosa',
      '━━━ PRECAUCIONES ━━━',
      'Niños menores de 18 años: no recomendado (sin datos de seguridad)',
      'Embarazo: evidencia limitada, riesgo de sangrado y aborto con dosis repetidas',
      'Lactancia: descartar leche materna durante primeras 24 horas post-trombolisis',
      'Insuficiencia renal: eliminación hepática — no requiere ajuste de dosis renal',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-alteplase',
    tab: 'trombo_farmacos',
    type: 'criteria',
    color: 'purple',
    order: 5,
    title: 'Alteplase (rtPA) — Alternativa si TNK no disponible',
    content: 'Esquema de dosis varía según tiempo de inicio de síntomas y peso corporal. Dosis máxima absoluta: 100 mg.',
    items: [
      '━━━ INICIO DE SÍNTOMAS MENOR A 6 HORAS ━━━',
      'Peso mayor o igual a 65 kg: bolo EV 15 mg → perfusión 50 mg en 30 min → perfusión 35 mg en 60 min',
      'Peso menor a 65 kg: bolo EV 15 mg → 0,75 mg/kg en 30 min (máx 50 mg) → 0,5 mg/kg en 60 min (máx 35 mg)',
      '━━━ INICIO DE SÍNTOMAS 6 A 12 HORAS ━━━',
      'Peso mayor o igual a 65 kg: bolo EV 10 mg → perfusión 50 mg en 60 min → 40 mg en los 120 min siguientes',
      'Peso menor a 65 kg: bolo EV 10 mg → dosis total máxima 1,5 mg/kg',
      '━━━ ANTICOAGULACIÓN CONCOMITANTE (Alteplase) ━━━',
      'HNF: bolo EV 5.000 UI antes de alteplase → perfusión 1.000 UI/hora (ajustar a TTPK 1,5–2 veces basal)',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-anticoag',
    tab: 'trombo_farmacos',
    type: 'criteria',
    color: 'amber',
    order: 6,
    title: 'Anticoagulación con TNK — Enoxaparina o HNF',
    content: 'Iniciar de forma concomitante con TNK. Enoxaparina es el fármaco de elección.',
    items: [
      '━━━ ENOXAPARINA (elección) ━━━',
      'Menor de 75 años: bolo EV 30 mg → esperar 15 min → mantención 1 mg/kg SC c/12h (máx 100 mg primeras 2 dosis)',
      'Mayor o igual a 75 años: SIN bolo → solo mantención 0,75 mg/kg SC c/12h (máx 75 mg primeras 2 dosis)',
      'FG menor a 30 mL/min (cualquier edad): dosis SC cada 24 horas',
      '━━━ HNF (alternativa) ━━━',
      'Bolo EV: 60 UI/kg con máximo de 4.000 UI',
      'Mantención: infusión EV 12 UI/kg/hora (máximo 1.000 UI/hora) por 24–48 horas',
      'Objetivo TTPK: 50–70 segundos o 1,5–2 veces el tiempo de control',
      'Monitorizar TTPK a las 3, 6, 12 y 24 horas',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-enox-calc',
    tab: 'trombo_farmacos',
    type: 'dose_calculator',
    order: 7,
    title: 'Calculadora Enoxaparina — Mantención por Peso',
    description: 'Dosis de mantención SC. Seleccionar el resultado según edad del paciente.',
    medications: [
      {
        name: 'Enoxaparina < 75 años',
        indication: 'Mantención SC c/12h (máx 100 mg)',
        dose_per_kg: 1,
        unit: 'mg',
        route: 'SC c/12h',
        dose_label: '1 mg/kg SC c/12h',
        max_dose: 100,
        concentration: 10,
        concentration_label: '100 mg/mL (jeringa 1 mL = 100 mg)',
        note: 'Máximo 100 mg para las primeras 2 dosis. Bolo previo: 30 mg EV.',
      },
      {
        name: 'Enoxaparina ≥ 75 años',
        indication: 'Mantención SC c/12h (máx 75 mg)',
        dose_per_kg: 0.75,
        unit: 'mg',
        route: 'SC c/12h',
        dose_label: '0,75 mg/kg SC c/12h',
        max_dose: 75,
        concentration: 10,
        concentration_label: '100 mg/mL (jeringa 1 mL = 100 mg)',
        note: 'Sin bolo inicial en ≥75 años. Máximo 75 mg para las primeras 2 dosis.',
      },
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 3: trombo_contrain — Contraindicaciones absolutas y relativas
// ─────────────────────────────────────────────────────────────────────────────
const CONTRAIN_BLOCKS = [
  {
    id: 'trombo-v1-absolutas',
    tab: 'trombo_contrain',
    type: 'criteria',
    color: 'red',
    order: 8,
    title: 'Contraindicaciones Absolutas',
    content: 'Cualquiera de estas descarta la trombolisis — evaluar PCI directa si está disponible',
    items: [
      'Antecedente de ACV hemorrágico o ACV de origen desconocido (cualquier tiempo)',
      'ACV isquémico en los últimos 6 meses',
      'Malformación vascular intracraneana conocida',
      'Tumor cerebral',
      'Diátesis hemorrágica (trastorno de coagulación)',
      'Hemorragia digestiva activa en las últimas 6 semanas',
      'Otra hemorragia activa (no menstrual)',
      'Cirugía mayor o traumatismo mayor en el último mes',
      'Neurocirugía en los últimos 6 meses',
      'Sospecha de disección aórtica',
      'Parto en los últimos 10 días',
      'Punción no compresible en las últimas 24 horas (punción lumbar, biopsia hepática)',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-relativas',
    tab: 'trombo_contrain',
    type: 'criteria',
    color: 'amber',
    order: 9,
    title: 'Contraindicaciones Relativas',
    content: 'Requieren evaluación caso a caso — discutir con hemodinamista antes de indicar',
    items: [
      'HTA no controlada al ingreso: PAS mayor a 180 mmHg o PAD mayor a 110 mmHg',
      'RCP prolongada mayor a 10 minutos o reanimación en las últimas 2 semanas',
      'Embarazo y postparto hasta 3 meses',
      'Punción en sitio no compresible reciente (punción lumbar, biopsia)',
      'Anticoagulación activa: INR mayor a 2–3 con Tenecteplase; INR mayor a 1,3 con Alteplase',
      'Enfermedad hepática avanzada',
      'AIT (ataque isquémico transitorio) en los últimos 6 meses',
      'Úlcera péptica activa',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 4: trombo_monitoreo — Signos de reperfusión y vigilancia
// ─────────────────────────────────────────────────────────────────────────────
const MONITOREO_BLOCKS = [
  {
    id: 'trombo-v1-reperfusion',
    tab: 'trombo_monitoreo',
    type: 'criteria',
    color: 'green',
    order: 10,
    title: 'Signos de Reperfusión — Evaluar desde los 60 minutos',
    content: 'Los signos son imprecisos individualmente — la combinación orienta mejor la respuesta al trombolítico',
    items: [
      '━━━ SIGNOS CLÁSICOS ━━━',
      'Alivio o desaparición del dolor torácico',
      'Disminución de la elevación del segmento ST en ECG de control',
      'Aparición de arritmias de reperfusión (ritmo idioventricular acelerado, extrasístoles)',
      '━━━ INTERPRETACIÓN ━━━',
      'Alivio súbito + resolución del 70% de la elevación del ST → altamente sugerente de flujo TIMI normal restaurado',
      'Resolución de la elevación del ST a los 60–90 minutos → marcador útil de permeabilidad de la arteria',
      'Menos del 50% de resolución del ST + ausencia de arritmias de reperfusión a las 2 horas → predice flujo TIMI menor a 3',
      '━━━ ACCIÓN ━━━',
      'Resolución menor al 50% del ST a los 60–90 minutos → considerar de inmediato angiografía y PCI (traslado urgente)',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-vigilancia',
    tab: 'trombo_monitoreo',
    type: 'flowchart',
    color: 'blue',
    order: 11,
    title: 'Vigilancia Activa Post-Fibrinólisis — Hasta llegada de SAMU',
    content: 'El equipo de urgencias mantiene vigilancia continua hasta el traslado al Hospital Las Higueras',
    details: [
      'Monitorización continua → PA, FC, SatO2, ritmo cardíaco',
      'Registro de signos vitales cada 15 minutos en sistema DAU',
      'ECG de control a los 60–90 minutos post-fibrinolisis y en caso de recurrencia del dolor',
      'Vigilar activamente signos de sangrado (sitios de punción, hematuria, hematemesis)',
      'No realizar punciones arteriales, IM ni procedimientos invasivos en las primeras 24 horas',
      '━━━ AL LLEGAR EL SAMU ━━━',
      'Enfermera activa Ley de Urgencias',
      'Imprimir DAU con fecha y hora de cada intervención',
      'Adjuntar ECG + consentimiento informado firmado + documentación requerida',
      'Trasladar con móvil avanzado SAMU al Hospital Las Higueras, Talcahuano',
    ],
    layout_position: 'main',
  },
  {
    id: 'trombo-v1-reacciones',
    tab: 'trombo_monitoreo',
    type: 'criteria',
    color: 'red',
    order: 12,
    title: 'Reacciones Adversas — Reconocer y Actuar',
    content: 'Principales complicaciones del tratamiento trombolítico — carro de paro disponible durante todo el procedimiento',
    items: [
      '━━━ TENECTEPLASE ━━━',
      'Hemorragia interna o superficial (más frecuente)',
      'Arritmias de reperfusión — pueden ser benignas o requerir cardioversión',
      'Hipersensibilidad o shock anafiláctico (poco frecuente)',
      'Aumento de eventos cardioembólicos en pacientes con trombo cardíaco izquierdo',
      '━━━ ALTEPLASE ━━━',
      'Hipersensibilidad o shock anafiláctico',
      'Sangrado (interno y en sitios de punción)',
      'Arritmias de reperfusión',
      'Aumento de eventos cardioembólicos en trombo cardíaco izquierdo',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 5: trombo_flujogramas — Algoritmos visuales
// ─────────────────────────────────────────────────────────────────────────────
const FLUJOGRAMAS_BLOCKS = [
  {
    id: 'trombo-v1-mermaid-general',
    tab: 'trombo_flujogramas',
    type: 'mermaid',
    order: 13,
    title: 'Flujo General IAMEST — Tiempo Puerta-Aguja ≤ 30 min',
    content: `flowchart TD
    A([Dolor torácico · Consulta en Urgencias HCSFB]) --> B[ECG en menos de 10 minutos]
    B --> C{¿IAMEST confirmado?}
    C -->|No| D([Manejo SCA según clínica\\nDescartar otras causas])
    C -->|Sí| E{¿Tiempo de\\nsíntomas?}
    E -->|Menos de 12 horas| F[Estrategia fármaco-invasiva\\nFibrinólisis + PCI diferida 2–24h]
    E -->|12 a 24 horas| G[PCI primaria\\nSolicitar SAMU directo a Las Higueras]
    F --> H{¿Contraindicación\\nabsoluta?}
    H -->|Sí| G
    H -->|No| I[Medidas generales: O2 · AAS · NTG · Morfina · Clopidogrel]
    I --> J[Contactar hemodinamista vía teléfono\\nEnviar ECG · Recibir indicación]
    J --> K[Solicitar SAMU para traslado a HHL]
    K --> L[Tenecteplase según peso\\nBolo EV único 5–10 segundos]
    L --> M[Anticoagulación concomitante\\nEnoxaparina o HNF]
    M --> N[Vigilar signos de reperfusión\\nECG c/60–90 min]
    N --> O{¿Reperfusión\\nadecuada?}
    O -->|Resolución ST ≥50%| P[Continuar monitoreo\\nEsperar SAMU]
    O -->|Resolución ST < 50%| Q[Considerar PCI urgente\\nTraslado inmediato]
    P --> R([Traslado a HHL con SAMU\\nDAU + ECG + consentimiento])
    Q --> R`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ALL_BLOCKS = [
  ...PROTOCOLO_BLOCKS,
  ...FARMACOS_BLOCKS,
  ...CONTRAIN_BLOCKS,
  ...MONITOREO_BLOCKS,
  ...FLUJOGRAMAS_BLOCKS,
];
const tabs = [...new Set(ALL_BLOCKS.map(b => b.tab))];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TROMBOLISIS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);
console.log(`\nBloques totales: ${ALL_BLOCKS.length}`);
console.log(`Pestañas: ${tabs.join(' | ')}`);
tabs.forEach(tab => {
  console.log(`  ${tab}: ${ALL_BLOCKS.filter(b => b.tab === tab).length} bloques`);
});

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase.from('topics').update({
  protocol_authors: AUTHORS,
  content_blocks:   ALL_BLOCKS,
  last_updated:     new Date().toISOString(),
}).eq('id', TOPIC_ID);

if (error) { console.error('\n❌ Error:', error.message); process.exit(1); }
console.log('\n✅ Trombolisis actualizada con estructura de 5 pestañas.');
