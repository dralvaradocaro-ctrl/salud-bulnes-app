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
  // rrmq-v3-niveles: ya dice "HCSFB 159" y "GCL 1.9" — solo agregar links
  {
    topicId: TOPIC_IDS.rrmq,
    blockId: 'rrmq-v3-niveles',
    links: {
      'HCSFB 159': TOPIC_IDS.agitacion,
      'GCL 1.9':   TOPIC_IDS.contencion,
    },
  },

  // rrmq-v3-traslado: actualizar ítem + links (• ya fue eliminado en script anterior)
  {
    topicId: TOPIC_IDS.rrmq,
    blockId: 'rrmq-v3-traslado',
    links: {
      'Contención Física (GCL 1.9)': TOPIC_IDS.contencion,
    },
    itemPatches: {
      'Necesidad de contención física prolongada (> 8 horas)':
        'Necesidad de Contención Física (GCL 1.9) prolongada (> 8 horas)',
    },
  },

  // ── GCL 1.9 Contención Física ─────────────────────────────────────────────
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
  {
    topicId: 'c0aecd59-f807-4c2e-af91-408d5f5928b3',
    blockId: 'auto-manejo',
    links: {
      'Intento Suicida (GCL 1.10)': TOPIC_IDS.intentoSuic,
      'GCL 1.10':                   TOPIC_IDS.intentoSuic,
    },
    itemPatches: {
      'Médico puede indicar manejo farmacológico o contención según lo protocolizado':
        'Médico puede indicar manejo farmacológico o contención física según criterio clínico',
      'Mantener hospitalizado hasta cese de ideación suicida aguda':
        'Hospitalización y seguimiento según GCL 1.10 hasta cese de ideación suicida aguda',
    },
  },

  // ── GCL 1.10 Intento Suicida ─────────────────────────────────────────────
  {
    topicId: TOPIC_IDS.intentoSuic,
    blockId: 'intsuic-v4-derivacion',
    links: {
      'Agitación Psicomotora (HCSFB 159)': TOPIC_IDS.agitacion,
      'HCSFB 166':                          TOPIC_IDS.criteriosSM,
    },
    itemPatches: {
      'Agitación refractaria a manejo con recursos disponibles en HCSFB':
        'Agitación Psicomotora (HCSFB 159) refractaria a manejo con recursos disponibles en HCSFB',
    },
    appendItems: [
      'Para criterios de hospitalización, derivación y egreso en Salud Mental: ver HCSFB 166',
    ],
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

    // Actualizar items — normaliza bullet y espacios para matching robusto
    if (patch.itemPatches && (block.items || block.details)) {
      const field = block.items ? 'items' : 'details';
      const norm = (s) => (typeof s === 'string' ? s.replace(/^[•·]\s*/, '').trim().normalize('NFC') : '');
      block[field] = block[field].map(item => {
        const normalizedItem = norm(item);
        const match = Object.entries(patch.itemPatches)
          .find(([key]) => norm(key) === normalizedItem);
        if (match) {
          console.log(`  [${patch.blockId}] "${String(item).substring(0,60)}" →`);
          console.log(`               "${match[1].substring(0,60)}"`);
          return match[1];
        }
        return item;
      });
    }

    // Agregar ítems al final
    if (patch.appendItems) {
      const field = block.items ? 'items' : block.details ? 'details' : null;
      if (field) {
        block[field] = [...block[field], ...patch.appendItems];
        patch.appendItems.forEach(item =>
          console.log(`  [${patch.blockId}] + "${item.substring(0,80)}"`)
        );
      }
    }

    // Mostrar links añadidos
    if (patch.links) console.log(`  [${patch.blockId}] links: ${JSON.stringify(patch.links)}`);

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
