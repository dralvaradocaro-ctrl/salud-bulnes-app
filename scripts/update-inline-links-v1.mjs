/**
 * Agrega `block.links` (pattern → topicId) a bloques específicos que mencionan
 * otros protocolos, y actualiza el texto de los ítems para que el nombre del
 * protocolo referenciado aparezca explícitamente y sea clicable inline.
 *
 * El renderer en ResponsiveTopicLayout.jsx detecta block.links y renderiza los
 * patrones como <Link> inline con subrayado azul.
 *
 * Uso:  node scripts/update-inline-links-v1.mjs
 *       node scripts/update-inline-links-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// IDs de topics destino
const TOPIC_IDS = {
  agitacion:   '13e6128f-882a-4a19-8e18-47cbf13203eb', // HCSFB 159 Agitación
  rrmq:        '099cba54-aec4-4d2b-9760-64b5302fe77e', // HCSFB 165 Respuesta Rápida
  contencion:  '9e0b3406-9055-43a4-8a75-bf6d290bceb4', // GCL 1.9 Contención Física
  intentoSuic: '64dfc162-38ac-40c9-8cff-2e898bd40988', // GCL 1.10 Intento Suicida
  criteriosSM: 'fa57bf50-f39c-4438-af5e-bfa33be36fce', // HCSFB 166 Criterios SM
};

// Lista de patches: { topicId, blockId, links, itemPatches }
// itemPatches: { oldText → newText } para actualizar el texto del ítem en el que aparece el link
const PATCHES = [

  // ── HCSFB 165 Respuesta Rápida ────────────────────────────────────────────
  // rrmq-v3-traslado: "contención física" → GCL 1.9
  {
    topicId: TOPIC_IDS.rrmq,
    blockId: 'rrmq-v3-traslado',
    links: {
      'Contención Física (GCL 1.9)': TOPIC_IDS.contencion,
    },
    itemPatches: {
      '• Necesidad de contención física prolongada (> 8 horas)':
        'Necesidad de Contención Física (GCL 1.9) prolongada (> 8 horas)',
    },
  },

  // ── GCL 1.9 Contención Física ─────────────────────────────────────────────
  // conten-v3-indicaciones: "Agitación" → HCSFB 159
  {
    topicId: TOPIC_IDS.contencion,
    blockId: 'conten-v3-indicaciones',
    links: {
      'Agitación Psicomotora (HCSFB 159)': TOPIC_IDS.agitacion,
    },
    itemPatches: {
      'Agitación no controlable con tratamiento farmacológico máximo':
        'Agitación Psicomotora (HCSFB 159) no controlable con tratamiento farmacológico máximo',
    },
  },

  // ── HCSFB 160 Prevención Autolesiones ────────────────────────────────────
  // auto-manejo: VIA 3 menciona manejo farmacológico + contención → links a HCSFB 159 y GCL 1.9
  {
    topicId: 'c0aecd59-f807-4c2e-af91-408d5f5928b3',
    blockId: 'auto-manejo',
    links: {
      'Agitación Psicomotora (HCSFB 159)': TOPIC_IDS.agitacion,
      'Contención Física (GCL 1.9)':        TOPIC_IDS.contencion,
      'Intento Suicida (GCL 1.10)':          TOPIC_IDS.intentoSuic,
    },
    itemPatches: {
      'Médico puede indicar manejo farmacológico o contención según lo protocolizado':
        'Médico puede indicar manejo farmacológico — Agitación Psicomotora (HCSFB 159) — o Contención Física (GCL 1.9) según criterio clínico',
      'Mantener hospitalizado hasta cese de ideación suicida aguda':
        'Mantener hospitalizado hasta cese de ideación suicida — ver Intento Suicida (GCL 1.10)',
    },
  },

  // ── GCL 1.10 Intento Suicida ─────────────────────────────────────────────
  // intsuic-v4-derivacion: "agitación refractaria" → HCSFB 159
  // intsuic-v4-alta: hospitalización → HCSFB 166 Criterios SM
  {
    topicId: TOPIC_IDS.intentoSuic,
    blockId: 'intsuic-v4-derivacion',
    links: {
      'Agitación Psicomotora (HCSFB 159)': TOPIC_IDS.agitacion,
    },
    itemPatches: {
      'Agitación refractaria a manejo con recursos disponibles en HCSFB':
        'Agitación Psicomotora (HCSFB 159) refractaria a manejo con recursos disponibles en HCSFB',
    },
  },
  {
    topicId: TOPIC_IDS.intentoSuic,
    blockId: 'intsuic-v4-alta',
    links: {
      'Criterios de Salud Mental (HCSFB 166)': TOPIC_IDS.criteriosSM,
    },
    itemPatches: {
      'Compensación del episodio + hora de control psiquiátrico asignada (PROSAM u otro)':
        'Compensación del episodio + hora de control psiquiátrico asignada — ver Criterios de Salud Mental (HCSFB 166)',
    },
  },
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  INLINE LINKS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// Agrupar patches por topicId
const byTopic = {};
for (const patch of PATCHES) {
  if (!byTopic[patch.topicId]) byTopic[patch.topicId] = [];
  byTopic[patch.topicId].push(patch);
}

for (const [topicId, patches] of Object.entries(byTopic)) {
  const { data: topic, error } = await supabase
    .from('topics').select('name, content_blocks').eq('id', topicId).single();
  if (error) { console.error(`❌ Fetch ${topicId}: ${error.message}`); continue; }

  let blocks = topic.content_blocks || [];
  let changed = false;

  console.log(`📋 ${topic.name}`);

  for (const patch of patches) {
    const blockIdx = blocks.findIndex(b => b.id === patch.blockId);
    if (blockIdx === -1) {
      console.log(`  ⚠️  Bloque no encontrado: ${patch.blockId}`);
      continue;
    }

    const block = { ...blocks[blockIdx] };

    // Agregar/mergear links
    block.links = { ...(block.links || {}), ...patch.links };

    // Actualizar items
    if (patch.itemPatches && (block.items || block.details)) {
      const field = block.items ? 'items' : 'details';
      block[field] = block[field].map(item => {
        const newText = patch.itemPatches[item] ?? patch.itemPatches[item?.trim?.()];
        if (newText !== undefined) {
          console.log(`  [${patch.blockId}] "${item.substring(0,60)}" →`);
          console.log(`               "${newText.substring(0,60)}"`);
          return newText;
        }
        return item;
      });
    }

    // Mostrar links añadidos
    console.log(`  [${patch.blockId}] links: ${JSON.stringify(patch.links)}`);

    blocks = [...blocks.slice(0, blockIdx), block, ...blocks.slice(blockIdx + 1)];
    changed = true;
  }

  console.log();
  if (!changed || !APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ content_blocks: blocks }).eq('id', topicId);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Inline links aplicados.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
