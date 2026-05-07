/**
 * v3 — Enriquece protocolos de Urgencias con contenido completo extraído de PDFs reales.
 * Incluye teléfonos de activación, flujos detallados y algoritmos Mermaid.
 *
 * Uso:  node scripts/update-protocolos-urgencias-v3.mjs
 *       node scripts/update-protocolos-urgencias-v3.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─────────────────────────────────────────────────────────────────────────────
// CÓDIGO AZUL — AOC 1.1
// (ID se resuelve por búsqueda por nombre)
// ─────────────────────────────────────────────────────────────────────────────
const CODIGO_AZUL_AUTHORS = [
  { name: 'Dra. Camila Gutiérrez Canales', role: 'Elaboradora — Médico HCSFB' },
  { name: 'Dr. Maicol Candia Sandoval',    role: 'Revisor — Subdirector Médico HCSFB' },
  { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
];

const CODIGO_AZUL_BLOCKS = [
  {
    id: 'cazul-v3-activacion',
    type: 'flowchart',
    color: 'blue',
    order: 1,
    title: 'Activación del Código Azul — HCSFB',
    content: 'El Código Azul se activa ante cualquier caso de compromiso o pérdida de conciencia con escasa o nula respuesta a estímulos',
    details: [
      '🚨 DISPARADOR: compromiso o pérdida de conciencia con escasa o nula respuesta a estímulos',
      '',
      '📞 TELÉFONOS DE ACTIVACIÓN:',
      '   • Interno 425974 (urgencias)',
      '   • Interno 425902 (urgencias alternativo)',
      '',
      '⏱ EVALUACIÓN SIMULTÁNEA: buscar pulso y respiración JUNTOS durante 5–10 segundos',
      '   → Si ausentes o duda: INICIAR RCP inmediatamente',
      '   → Si presentes: posición lateral de seguridad + oxígeno + monitorizar',
    ],
    layout_position: 'main',
  },
  {
    id: 'cazul-v3-flujo',
    type: 'flowchart',
    color: 'amber',
    order: 2,
    title: 'Flujo del Código Azul — 5 Pasos',
    content: 'Secuencia de respuesta desde el reconocimiento hasta la llegada del equipo de reanimación',
    details: [
      '1️⃣  RECONOCIMIENTO: funcionario detecta paciente sin respuesta',
      '   → Estimular hombros: "¿Está bien? ¿Me escucha?"',
      '   → Evaluar pulso y respiración simultáneamente (5–10 segundos)',
      '',
      '2️⃣  ACTIVACIÓN: gritar "¡CÓDIGO AZUL!" + llamar a internos 425974 o 425902',
      '   → Nunca abandonar al paciente para llamar — pedir a otra persona',
      '',
      '3️⃣  SVB: funcionario capacitado inicia Soporte Vital Básico',
      '   → Compresiones cardíacas: 100–120/min · profundidad 5–6 cm · permitir retroceso completo',
      '   → Ventilaciones 30:2 si hay 2 reanimadores capacitados (o solo compresiones si 1)',
      '   → Desfibrilador: conectar tan pronto esté disponible',
      '',
      '4️⃣  EQUIPO DE URGENCIAS: llega en ≤ 3 minutos → toma el control del SVA',
      '   → SVA: manejo avanzado de vía aérea · acceso venoso · medicamentos · monitoreo',
      '',
      '5️⃣  TRASLADO A URGENCIAS: en camilla con monitoreo continuo',
      '   → Continuar RCP durante el traslado si está en paro',
    ],
    layout_position: 'main',
  },
  {
    id: 'cazul-v3-rcp-basico',
    type: 'criteria',
    color: 'red',
    order: 3,
    title: 'Puntos Críticos del RCP — Antes de que Llegue el Equipo de Urgencias',
    content: 'Calidad del RCP es el factor más determinante en la supervivencia — no interrumpir salvo para desfibrilación',
    items: [
      '✅ Frecuencia compresiones: 100–120 por minuto (ritmo de "Stayin\' Alive")',
      '✅ Profundidad: 5–6 cm en adultos · 1/3 del diámetro torácico en niños',
      '✅ Retroceso completo: dejar que el tórax recupere su posición entre compresiones',
      '✅ Relación compresiones:ventilaciones: 30:2 (si hay 2 rescatadores capacitados)',
      '✅ Minimizar pausas: interrumpir compresiones ≤ 10 segundos (solo para análisis ritmo y descarga)',
      '✅ Rotar rescatador cada 2 minutos (fatiga reduce calidad rápidamente)',
      '✅ DEA: conectar TAN PRONTO esté disponible — seguir instrucciones de voz',
      '',
      '⚠️ Si solo hay 1 rescatador: compresiones CONTINUAS sin ventilaciones',
      '⚠️ Si vía aérea avanzada: compresiones continuas + ventilación c/6 segundos (10/min)',
    ],
    layout_position: 'main',
  },
  {
    id: 'cazul-v3-mermaid',
    type: 'mermaid',
    order: 4,
    title: 'Algoritmo AOC 1.1 — Código Azul HCSFB',
    content: `flowchart TD
    A([Paciente sin respuesta\\no compromiso de consciencia]) --> B[Estimular hombros:\\n¿Está bien?]
    B --> C{¿Responde?}
    C -->|Sí| D([Evaluar causa\\ny tratar])
    C -->|No| E[Activar CÓDIGO AZUL\\nInternos 425974 o 425902]
    E --> F[Evaluar pulso + respiración\\nsimultáneamente · 5–10 seg]
    F --> G{¿Pulso y/o\\nrespiración presentes?}
    G -->|Sí| H[Posición lateral de seguridad\\nO2 + monitorizar + esperar equipo]
    G -->|No — dudosos| I[Iniciar RCP inmediato\\n100–120 compresiones/min · 5–6 cm]
    I --> J[Conectar DEA\\ntan pronto disponible]
    J --> K{¿DEA aconseja\\ndescarga?}
    K -->|Sí| L[DESCARGA — todos alejados\\nReanudar RCP inmediatamente]
    K -->|No| M[Continuar RCP\\nsin interrupciones]
    L --> N[Equipo urgencias llega\\n≤ 3 min · asume SVA]
    M --> N
    H --> N
    N --> O([Traslado a Urgencias\\ncon RCP activo si en paro])`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function updateTopic(topicId, authors, blocks, label) {
  const { data: current, error: fetchErr } = await supabase
    .from('topics')
    .select('content_blocks, name')
    .eq('id', topicId)
    .single();

  if (fetchErr) {
    console.error(`❌ ${label}: fetch error — ${fetchErr.message}`);
    return false;
  }

  console.log(`\n📋 ${label} — "${current.name}"`);
  console.log(`   Bloques actuales: ${(current.content_blocks || []).length}`);
  console.log(`   Bloques nuevos: ${blocks.length}`);

  if (!APPLY) return true;

  const { error } = await supabase
    .from('topics')
    .update({
      protocol_authors: authors,
      content_blocks:   blocks,
      last_updated:     new Date().toISOString(),
    })
    .eq('id', topicId);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }

  console.log(`   ✅ Actualizado correctamente`);
  return true;
}

async function findTopicIdByName(name) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();
  if (error || !data) {
    console.log(`  ⚠️  No encontrado: "${name}" — ${error?.message}`);
    return null;
  }
  console.log(`  ✅ Encontrado: "${data.name}" (${data.id})`);
  return data.id;
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  URGENCIAS v3 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);

console.log('\nBuscando Código Azul por nombre...');
const codigoAzulId = await findTopicIdByName('Código Azul');

if (codigoAzulId) {
  await updateTopic(codigoAzulId, CODIGO_AZUL_AUTHORS, CODIGO_AZUL_BLOCKS, 'CÓDIGO AZUL (AOC 1.1)');
} else {
  console.log('\n⚠️  Código Azul no encontrado. Intentando búsqueda alternativa...');
  const altId = await findTopicIdByName('codigo azul');
  if (altId) {
    await updateTopic(altId, CODIGO_AZUL_AUTHORS, CODIGO_AZUL_BLOCKS, 'CÓDIGO AZUL (AOC 1.1)');
  } else {
    console.log('❌ No se pudo encontrar el topic Código Azul. Verificar nombre en Supabase.');
  }
}

if (!APPLY) {
  console.log('\n\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
} else {
  console.log('\n\n✅ Protocolos de Urgencias actualizados (v3).');
}
