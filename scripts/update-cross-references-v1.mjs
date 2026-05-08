/**
 * Agrega bloques `reference` bidireccionales entre protocolos que se mencionan
 * explícitamente entre sí, para permitir navegación directa desde la app.
 *
 * El bloque `reference` con reference_type='topic' ya existe en el renderer
 * (ResponsiveTopicLayout.jsx líneas 591-623) y renderiza como card azul clicable.
 *
 * Uso:  node scripts/update-cross-references-v1.mjs
 *       node scripts/update-cross-references-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ── Resolver ID de Intento Suicida por nombre ─────────────────────────────
const { data: intentoTopics } = await supabase
  .from('topics').select('id, name').ilike('name', '%intento suicida%');

// Preferir el de Hospitalizados (GCL 1.10), que tiene más bloques
const intentoTopic = intentoTopics?.find(t => t.name.toLowerCase().includes('gcl') || t.name.toLowerCase().includes('manejo'))
  ?? intentoTopics?.[0];

const INTENTO_ID   = intentoTopic?.id ?? null;
const INTENTO_LABEL = intentoTopic?.name
  ? `GCL 1.10 — ${intentoTopic.name}`
  : 'GCL 1.10 — Manejo de Pacientes con Intento Suicida';

// ── Pares a vincular ──────────────────────────────────────────────────────
// Cada entrada: { topicId, blockId, tab, title, reference_type, reference_id, reference_label }
const LINKS = [
  // 1. HCSFB 165 Respuesta Rápida → HCSFB 159 Agitación
  {
    topicId: '099cba54-aec4-4d2b-9760-64b5302fe77e',
    label:   'HCSFB 165 — Respuesta Rápida MQ',
    block: {
      id:              'ref-165-to-159',
      type:            'reference',
      tab:             'Respuesta',
      title:           'Ver también',
      reference_type:  'topic',
      reference_id:    '13e6128f-882a-4a19-8e18-47cbf13203eb',
      reference_label: 'HCSFB 159 — Contención Farmacológica y No Farmacológica en Agitación Psicomotora',
    },
  },
  // 2. HCSFB 159 Agitación → HCSFB 165 Respuesta Rápida
  {
    topicId: '13e6128f-882a-4a19-8e18-47cbf13203eb',
    label:   'HCSFB 159 — Agitación Psicomotora',
    block: {
      id:              'ref-159-to-165',
      type:            'reference',
      tab:             'Evaluación',
      title:           'Ver también',
      reference_type:  'topic',
      reference_id:    '099cba54-aec4-4d2b-9760-64b5302fe77e',
      reference_label: 'HCSFB 165 — Activación y Respuesta Rápida para Pacientes con Diagnóstico Psiquiátrico',
    },
  },
  // 3. GCL 1.9 Contención Física → HCSFB 165 Respuesta Rápida
  {
    topicId: '9e0b3406-9055-43a4-8a75-bf6d290bceb4',
    label:   'GCL 1.9 — Contención Física',
    block: {
      id:              'ref-conten-to-rrmq',
      type:            'reference',
      tab:             'Indicaciones',
      title:           'Ver también',
      reference_type:  'topic',
      reference_id:    '099cba54-aec4-4d2b-9760-64b5302fe77e',
      reference_label: 'HCSFB 165 — Activación y Respuesta Rápida para Pacientes con Diagnóstico Psiquiátrico',
    },
  },
  // 4. HCSFB 160 Prevención Autolesiones → GCL 1.10 Intento Suicida
  ...(INTENTO_ID ? [{
    topicId: 'c0aecd59-f807-4c2e-af91-408d5f5928b3',
    label:   'HCSFB 160 — Prevención Autolesiones',
    block: {
      id:              'ref-autolesiones-to-is',
      type:            'reference',
      tab:             'Protocolo',
      title:           'Ver también',
      reference_type:  'topic',
      reference_id:    INTENTO_ID,
      reference_label: INTENTO_LABEL,
    },
  }] : []),
  // 5. GCL 1.10 Intento Suicida → HCSFB 166 Criterios SM
  ...(INTENTO_ID ? [{
    topicId: INTENTO_ID,
    label:   'GCL 1.10 — Intento Suicida',
    block: {
      id:              'ref-is-to-criterios',
      type:            'reference',
      tab:             'Protocolo',
      title:           'Ver también',
      reference_type:  'topic',
      reference_id:    'fa57bf50-f39c-4438-af5e-bfa33be36fce',
      reference_label: 'HCSFB 166 — Criterios de Ingreso, Derivación y Egreso en Salud Mental',
    },
  }] : []),
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  CROSS-REFERENCES v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`  Intento Suicida: ${INTENTO_ID ?? '❌ NO ENCONTRADO'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const entry of LINKS) {
  const { data: topic, error } = await supabase
    .from('topics').select('name, content_blocks').eq('id', entry.topicId).single();

  if (error) { console.error(`❌ Fetch ${entry.label}: ${error.message}`); continue; }

  const blocks = topic.content_blocks || [];

  // Idempotente: no agregar si ya existe un bloque con el mismo id o apuntando al mismo destino
  const alreadyExists = blocks.some(
    b => b.id === entry.block.id || (b.type === 'reference' && b.reference_id === entry.block.reference_id)
  );

  console.log(`📋 ${entry.label}`);
  console.log(`   → ${entry.block.reference_label}`);
  console.log(`   Tab: ${entry.block.tab} | Block ID: ${entry.block.id}`);

  if (alreadyExists) {
    console.log(`   ⚠️  Ya existe — sin cambio\n`);
    continue;
  }

  console.log(`   + Agregar bloque reference\n`);

  if (!APPLY) continue;

  const newBlocks = [...blocks, entry.block];
  const { error: e } = await supabase
    .from('topics').update({ content_blocks: newBlocks }).eq('id', entry.topicId);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Reference agregado.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
