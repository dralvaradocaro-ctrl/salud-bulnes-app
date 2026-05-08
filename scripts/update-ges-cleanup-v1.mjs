/**
 * Limpia emojis no-telefónicos y bullets • en protocolos GES.
 * Afecta: Hipotiroidismo (hipo-v2-farmacos, hipo-v2-derivacion)
 *         Demencia (dem-v2-examenes)
 *
 * Uso:  node scripts/update-ges-cleanup-v1.mjs
 *       node scripts/update-ges-cleanup-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  GES CLEANUP v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// ── PATCHES ──────────────────────────────────────────────────────────────────
// Cada patch: { topicId?, nameSearch?, blockId, field, items }
// items: array completo que reemplaza el field del bloque

// ── 1. Hipotiroidismo ─────────────────────────────────────────────────────────
const { data: hipoTopics } = await supabase
  .from('topics').select('id, name, content_blocks').ilike('name', '%hipotiroidismo%');

const hipo = hipoTopics?.[0];
if (!hipo) {
  console.error('❌ Hipotiroidismo no encontrado'); process.exit(1);
}

console.log(`📋 ${hipo.name} (${hipo.id})\n`);

let hipoBlocks = hipo.content_blocks || [];
let hipoChanged = false;

// — hipo-v2-farmacos (flowchart details) —
{
  const idx = hipoBlocks.findIndex(b => b.id === 'hipo-v2-farmacos');
  if (idx === -1) {
    console.log('  ⚠️  hipo-v2-farmacos no encontrado');
  } else {
    const block = { ...hipoBlocks[idx] };
    const before = block.details.slice();
    block.details = block.details.map(item => {
      if (typeof item !== 'string') return item;
      return item
        .replace(/^⏱\s*/, '')
        .replace(/^📋\s*/, '')
        .replace(/^🚫\s*/, '')
        .trim();
    });
    const changed = block.details.some((item, i) => item !== before[i]);
    if (changed) {
      before.forEach((old, i) => {
        if (old !== block.details[i]) console.log(`  [hipo-v2-farmacos] "${old}" →\n               "${block.details[i]}"`);
      });
      hipoBlocks = [...hipoBlocks.slice(0, idx), block, ...hipoBlocks.slice(idx + 1)];
      hipoChanged = true;
    } else {
      console.log('  [hipo-v2-farmacos] Sin cambios necesarios');
    }
  }
}

// — hipo-v2-derivacion (criteria items) —
{
  const idx = hipoBlocks.findIndex(b => b.id === 'hipo-v2-derivacion');
  if (idx === -1) {
    console.log('  ⚠️  hipo-v2-derivacion no encontrado');
  } else {
    const block = { ...hipoBlocks[idx] };
    const before = block.items.slice();
    block.items = block.items.map(item => {
      if (typeof item !== 'string') return item;
      // Convertir cabecera 🏥 → separador
      if (item.startsWith('🏥')) {
        return '━━━ DERIVAR A: Endocrinología — Hospital Herminda Martín, Chillán ━━━';
      }
      // Convertir texto plano de cabecera → separador
      if (item === 'INDICACIONES DE DERIVACIÓN:') {
        return '━━━ INDICACIONES DE DERIVACIÓN ━━━';
      }
      return item
        .replace(/^📋\s*VÍA:\s*/, 'Vía: ')
        .replace(/^📄\s*ADJUNTAR:\s*/, 'Adjuntar: ')
        .replace(/^[•·]\s*/, '')
        .trim();
    });
    const changed = block.items.some((item, i) => item !== before[i]);
    if (changed) {
      before.forEach((old, i) => {
        if (old !== block.items[i]) console.log(`  [hipo-v2-derivacion] "${old.substring(0,60)}" →\n               "${block.items[i].substring(0,60)}"`);
      });
      hipoBlocks = [...hipoBlocks.slice(0, idx), block, ...hipoBlocks.slice(idx + 1)];
      hipoChanged = true;
    } else {
      console.log('  [hipo-v2-derivacion] Sin cambios necesarios');
    }
  }
}

if (hipoChanged && APPLY) {
  const { error } = await supabase
    .from('topics').update({ content_blocks: hipoBlocks }).eq('id', hipo.id);
  if (error) console.error(`  ❌ Error: ${error.message}`);
  else       console.log(`\n  ✅ Hipotiroidismo actualizado.\n`);
} else if (!hipoChanged) {
  console.log('  (sin cambios)\n');
}

// ── 2. Demencia ───────────────────────────────────────────────────────────────
const DEMENCIA_ID = '696ea74c245ef362de4f4338';
const { data: dem } = await supabase
  .from('topics').select('id, name, content_blocks').eq('id', DEMENCIA_ID).single();

if (!dem) {
  console.error('❌ Demencia no encontrada'); process.exit(1);
}

console.log(`📋 ${dem.name} (${dem.id})\n`);

let demBlocks = dem.content_blocks || [];
let demChanged = false;

// — dem-v2-examenes (criteria items) —
{
  const idx = demBlocks.findIndex(b => b.id === 'dem-v2-examenes');
  if (idx === -1) {
    console.log('  ⚠️  dem-v2-examenes no encontrado');
  } else {
    const block = { ...demBlocks[idx] };
    const before = block.items.slice();
    block.items = block.items.map(item => {
      if (typeof item !== 'string') return item;
      if (item.startsWith('⚠️')) {
        return item.replace(/^⚠️\s*/, '').replace(/SOLO si/, 'solo si');
      }
      return item;
    });
    const changed = block.items.some((item, i) => item !== before[i]);
    if (changed) {
      before.forEach((old, i) => {
        if (old !== block.items[i]) console.log(`  [dem-v2-examenes] "${old.substring(0,70)}" →\n               "${block.items[i].substring(0,70)}"`);
      });
      demBlocks = [...demBlocks.slice(0, idx), block, ...demBlocks.slice(idx + 1)];
      demChanged = true;
    } else {
      console.log('  [dem-v2-examenes] Sin cambios necesarios');
    }
  }
}

if (demChanged && APPLY) {
  const { error } = await supabase
    .from('topics').update({ content_blocks: demBlocks }).eq('id', dem.id);
  if (error) console.error(`  ❌ Error: ${error.message}`);
  else       console.log(`\n  ✅ Demencia actualizada.\n`);
} else if (!demChanged) {
  console.log('  (sin cambios)\n');
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
