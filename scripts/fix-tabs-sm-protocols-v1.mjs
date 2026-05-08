/**
 * Agrega propiedad `tab` a los bloques de 3 protocolos SM que entran en GES mode
 * y tienen sus bloques `criteria` ocultos (filtrados en línea 954 de ResponsiveTopicLayout).
 *
 * Al agregar `tab`, hasTabs=true → isGESMode=false → todos los bloques son visibles.
 *
 * Uso:  node scripts/fix-tabs-sm-protocols-v1.mjs
 *       node scripts/fix-tabs-sm-protocols-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Mapa de id de bloque → pestaña a asignar
const TAB_MAP = {
  // HCSFB 153 — Clotiazepam
  'ef1502b6-2c86-455a-8f38-e90e355e7d9e': {
    label: 'HCSFB 153 — Clotiazepam',
    tabs: {
      'clotia-inclusion':   'Indicaciones',
      'clotia-exclusion':   'Indicaciones',
      'clotia-prescripcion': 'Prescripción',
      'clotia-seguimiento': 'Prescripción',
      'clotia-mermaid':     'Algoritmo',
    },
  },
  // HCSFB 166 — Criterios SM
  'fa57bf50-f39c-4438-af5e-bfa33be36fce': {
    label: 'HCSFB 166 — Criterios SM',
    tabs: {
      'sm-sad-persons':        'Criterios',
      'sm-criterios-ingreso':  'Criterios',
      'sm-criterios-traslado': 'Criterios',
      'sm-criterios-egreso':   'Criterios',
      'sm-mermaid':            'Algoritmo',
    },
  },
  // HCSFB 160 — Prevención Autolesiones
  'c0aecd59-f807-4c2e-af91-408d5f5928b3': {
    label: 'HCSFB 160 — Prevención Autolesiones',
    tabs: {
      'auto-asq':    'Protocolo',
      'auto-manejo': 'Protocolo',
      'auto-mermaid': 'Algoritmo',
    },
  },
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  FIX TABS SM PROTOCOLS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const [topicId, config] of Object.entries(TAB_MAP)) {
  const { data: topic, error } = await supabase
    .from('topics').select('content_blocks').eq('id', topicId).single();

  if (error) { console.error(`❌ Fetch ${config.label}: ${error.message}`); continue; }

  const blocks = topic.content_blocks || [];
  const updated = blocks.map(b => {
    const tabVal = config.tabs[b.id];
    if (!tabVal) {
      console.warn(`  ⚠️  Bloque sin match: "${b.id}" (${config.label})`);
      return b;
    }
    return { ...b, tab: tabVal };
  });

  console.log(`📋 ${config.label}`);
  updated.forEach(b => {
    const changed = b.tab !== blocks.find(ob => ob.id === b.id)?.tab;
    console.log(`   ${changed ? '+' : ' '} [${b.tab || '—'}] ${b.type.padEnd(10)} ${b.title?.substring(0,50)}`);
  });
  console.log();

  if (!APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ content_blocks: updated }).eq('id', topicId);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Tabs asignados.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
