/**
 * Disyunción Acromioclavicular (HCSFB-128) — 3 pestañas desde PDF real.
 * Protocolo | Tratamiento | Flujogramas
 *
 * Uso:  node scripts/update-dac-v1.mjs
 *       node scripts/update-dac-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '1b52d348-1a5f-4cff-836e-10472eef1324';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const AUTHORS = [
  { name: 'Dr. Rodrigo Enríquez Heredia',  role: 'Elaborador — Médico Jefe PROSAM HCSFB' },
  { name: 'Dra. Daniella Sbarbaro Arias',  role: 'Elaboradora — Médica EDF (Cirujana) HCSFB' },
  { name: 'Dr. Felipe Sancho Tapia',        role: 'Revisor — Subdirector Médico HCSFB' },
  { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 1: dac_protocolo — Clasificación y evaluación diagnóstica
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLO_BLOCKS = [
  {
    id: 'dac-v1-rockwood',
    tab: 'dac_protocolo',
    type: 'criteria',
    color: 'blue',
    order: 1,
    title: 'Clasificación de Rockwood — 6 tipos',
    content: 'Clasifica la DAC según el grado de desplazamiento clavicular medido desde el borde superior de la apófisis coracoides hasta el borde inferior de la clavícula en una línea vertical.',
    items: [
      '━━━ MANEJO CONSERVADOR ━━━',
      'Tipo I — Lig. AC parcial, CC indemne, sin luxación. Diagnóstico clínico (sin desplazamiento radiológico)',
      'Tipo II — Lig. AC completo, CC parcial (25% superior). Leve desplazamiento',
      '━━━ ZONA DE CONTROVERSIA ━━━',
      'Tipo III — CC 25–100% desplazamiento superior. Indicación quirúrgica en discusión — derivar a traumatología HCHM',
      '━━━ INDICACIÓN QUIRÚRGICA ━━━',
      'Tipo IV — Clavícula desplazada hacia posterior (trapecio). Requiere proyección axilar para diagnóstico',
      'Tipo V — CC 100–300% desplazamiento, hacia inferior del acromion',
      'Tipo VI — Desplazamiento hacia inferior de la coracoides (muy infrecuente)',
    ],
    layout_position: 'main',
  },
  {
    id: 'dac-v1-diagnostico',
    tab: 'dac_protocolo',
    type: 'flowchart',
    color: 'blue',
    order: 2,
    title: 'Evaluación Diagnóstica en Urgencias',
    content: 'Ante historia, examen físico y mecánica de trauma sugerentes de DAC',
    details: [
      'Solicitar Set de Hombro — 4 proyecciones radiográficas',
      '~ Ambas clavículas AP comparativa en una placa (medición del desplazamiento)',
      '~ Hombro AP',
      '~ Axial de escápula',
      '~ Axilar (identifica desplazamiento posterior en Tipo IV)',
      'Medir desplazamiento → coracoides al borde inferior clavícula en línea vertical',
      'Tipo I → solo clínico (sin desplazamiento radiológico visible)',
      'Clasificar según Rockwood → definir conducta',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 2: dac_tratamiento — Manejo por grado
// ─────────────────────────────────────────────────────────────────────────────
const TRATAMIENTO_BLOCKS = [
  {
    id: 'dac-v1-conservador',
    tab: 'dac_tratamiento',
    type: 'criteria',
    color: 'green',
    order: 3,
    title: 'Tratamiento Conservador — Tipo I y II',
    content: 'Indicado para grado I y II. Puede manejarse de forma completa en el HCSFB.',
    items: [
      '━━━ INMEDIATO ━━━',
      'Inmovilización con cabestrillo por 2 semanas',
      'Hielo local durante las primeras 48–72 horas',
      'Antiinflamatorios y analgésicos (AINES según tolerancia)',
      '━━━ DESDE EL INICIO ━━━',
      'Ejercicios de movilización pasivos permitidos desde el primer día',
      'Uso del brazo por debajo del nivel del hombro, limitado por dolor',
      '━━━ SEMANA 3 ━━━',
      'Rehabilitación kinesiológica (en Tipo I se puede omitir)',
      'Énfasis en fortalecimiento de articulación escapulotorácica',
      '━━━ ALTA DEPORTIVA ━━━',
      'Reincorporación a actividad deportiva cuando función sea completa y no dolorosa',
    ],
    layout_position: 'main',
  },
  {
    id: 'dac-v1-derivacion',
    tab: 'dac_tratamiento',
    type: 'criteria',
    color: 'red',
    order: 4,
    title: 'Derivación — Tipo III, IV, V y VI',
    content: 'Todos requieren evaluación por traumatología en urgencias del HCHM para definir manejo quirúrgico.',
    items: [
      'Inmovilizar con cabestrillo antes del traslado',
      'Derivar a urgencias del Hospital Las Higueras (HCHM) para evaluación por traumatología',
      '━━━ TIPO III ━━━',
      'Controversia en la literatura — puede ser quirúrgico o conservador según hallazgos',
      'El traumatólogo de HCHM define la conducta definitiva',
      '━━━ TIPO IV, V y VI ━━━',
      'Indicación quirúrgica en la mayoría de los casos',
      'TENS acompaña al paciente en ambulancia durante el traslado',
      '━━━ ACCIDENTE LABORAL (cualquier grado) ━━━',
      'Derivar a mutual de seguridad correspondiente independientemente del grado',
      'Garantiza manejo apropiado y reposo laboral necesario',
    ],
    layout_position: 'main',
  },
  {
    id: 'dac-v1-equipo',
    tab: 'dac_tratamiento',
    type: 'criteria',
    color: 'purple',
    order: 5,
    title: 'Roles del Equipo',
    content: 'Responsabilidades de cada profesional en el manejo de la DAC en urgencias HCSFB',
    items: [
      'Médico general → evaluación integral, solicitud e interpretación de RX, definición de tratamiento',
      'Tecnólogo médico → toma correcta de las 4 proyecciones del set de hombro',
      'TENS → instalación del cabestrillo, acompañamiento en ambulancia si hay derivación',
      'Supervisión del protocolo → Médico Jefe Programa Artrosis HCSFB',
      'Registro → ficha clínica y DAU (urgencias)',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 3: dac_flujogramas — Algoritmo visual
// ─────────────────────────────────────────────────────────────────────────────
const FLUJOGRAMAS_BLOCKS = [
  {
    id: 'dac-v1-mermaid',
    tab: 'dac_flujogramas',
    type: 'mermaid',
    order: 6,
    title: 'Algoritmo HCSFB-128 — Disyunción Acromioclavicular',
    content: `flowchart TD
    A([Sospecha de DAC\\nTrauma hombro · Signo de la tecla]) --> B[Solicitar Set de Hombro\\nClavículas AP bilateral · Hombro AP\\nAxial escápula · Axilar]
    B --> C[Medir desplazamiento\\nCoracoides → borde inferior clavícula]
    C --> D{Clasificación\\nRockwood}
    D -->|Tipo I| E[Solo clínico\\nSin desplazamiento RX]
    D -->|Tipo II| F[Desplazamiento leve\\nLig CC parcial]
    E --> G[Manejo conservador\\nCabestrillo 2 sem · Hielo · AINEs\\nKinesioterapia semana 3]
    F --> G
    D -->|Tipo III| H[Controversia\\nCabestrillo + derivar HCHM\\npara evaluación traumatología]
    D -->|Tipo IV-VI| I[Indicación quirúrgica\\nCabestrillo + derivar urgente HCHM]
    G --> J{¿Accidente\\nlaboral?}
    H --> J
    I --> J
    J -->|Sí| K([Derivar mutual de seguridad\\ncorrespondiente])
    J -->|No| L([Alta con instrucciones\\ny control según grado])`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ALL_BLOCKS = [...PROTOCOLO_BLOCKS, ...TRATAMIENTO_BLOCKS, ...FLUJOGRAMAS_BLOCKS];
const tabs = [...new Set(ALL_BLOCKS.map(b => b.tab))];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DISYUNCIÓN AC v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
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
console.log('\n✅ Disyunción AC actualizada con estructura de 3 pestañas.');
