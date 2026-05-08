/**
 * Ajusta los topics de Cuidados Paliativos:
 * - Agrega description (mini-resumen al lado del icono)
 * - Convierte el bloque protocol_header (cita bibliográfica) en un bloque text
 *   discreto dentro de la primera pestaña, en vez de aparecer sobre todas
 *
 * Uso:  node scripts/update-paliativos-headers-v1.mjs
 *       node scripts/update-paliativos-headers-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const PATCHES = [
  {
    nameLike: '%dolor oncol%',
    description: 'Síntesis del capítulo de Claudio Fierro (Pontificia Universidad Católica de Chile) sobre evaluación clínica del dolor, escalera analgésica de la OMS, AINEs, opioides y coadyuvantes — adaptado al arsenal HCSFB.',
    citaInline: {
      tab: 'Evaluación',
      title: 'Fuente',
      content:
        'Claudio Fierro. Evaluación y manejo farmacológico del dolor oncológico. ' +
        'En: Palma A, Taboada P, Nervi F (eds), Medicina Paliativa y Cuidados Continuos. ' +
        'Pontificia Universidad Católica de Chile.',
    },
  },
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  PALIATIVOS HEADERS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const patch of PATCHES) {
  const { data: topics } = await supabase
    .from('topics').select('id, name, description, content_blocks').ilike('name', patch.nameLike);

  if (!topics || topics.length === 0) {
    console.log(`⚠️  No encontrado: ${patch.nameLike}`);
    continue;
  }

  for (const topic of topics) {
    console.log(`📋 ${topic.name} (${topic.id})`);

    let blocks = topic.content_blocks || [];
    let changed = false;

    // 1. Eliminar el bloque protocol_header existente
    const headerIdx = blocks.findIndex(b => b.type === 'protocol_header');
    if (headerIdx !== -1) {
      const removed = blocks[headerIdx];
      console.log(`   - Quita protocol_header "${removed.title?.substring(0,50)}..."`);
      blocks = blocks.filter((_, i) => i !== headerIdx);
      changed = true;
    }

    // 2. Insertar un bloque text discreto al inicio de la pestaña indicada
    const citaBlock = {
      id: `${blocks[0]?.id?.split('-').slice(0,2).join('-') || 'topic'}-fuente`,
      type: 'text',
      tab: patch.citaInline.tab,
      color: 'gray',
      order: 5,
      title: patch.citaInline.title,
      content: patch.citaInline.content,
    };

    const alreadyHasCita = blocks.some(b => b.id === citaBlock.id);
    if (!alreadyHasCita) {
      console.log(`   + Agrega cita inline en pestaña "${patch.citaInline.tab}"`);
      blocks = [citaBlock, ...blocks];
      changed = true;
    }

    // 3. Description en el topic
    const updates = { content_blocks: blocks };
    if (topic.description !== patch.description) {
      console.log(`   ~ Actualiza description: "${patch.description.substring(0,80)}..."`);
      updates.description = patch.description;
      changed = true;
    }

    if (!changed) {
      console.log(`   (sin cambios)\n`);
      continue;
    }

    if (!APPLY) { console.log(); continue; }

    const { error } = await supabase.from('topics').update(updates).eq('id', topic.id);
    if (error) console.error(`   ❌ ${error.message}`);
    else       console.log(`   ✅ Actualizado.\n`);
  }
}

if (!APPLY) console.log('\n⚠️  Modo dry-run. Agrega --apply.');
