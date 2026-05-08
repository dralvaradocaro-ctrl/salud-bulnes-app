/**
 * Convierte items extensos de los topics paliativos a formato main + sub-items.
 * Patrones detectados:
 *  - " — HCSFB: ..."        → sub-item con la presentación HCSFB
 *  - " — Programa AD y CP"  → sub-item
 *  - " (HCSFB ...)"         → sub-item
 *  - " — Precaución..."     → sub-item con la advertencia
 *
 * Uso:  node scripts/update-paliativos-subitems-v1.mjs
 *       node scripts/update-paliativos-subitems-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPIC_NAMES = ['%dolor oncol%', '%subcut%'];

// Convierte un item criteria con texto extenso a "main\n~ sub1\n~ sub2"
function splitItem(item) {
  if (typeof item !== 'string') return item;
  // No tocar separadores ━━━ ni items vacíos
  if (/^[━═─]{3}/.test(item.trim()) || item.trim() === '') return item;

  // Primer separador a buscar: " — HCSFB:" (el más común en estos topics)
  // También: " — Programa", " — Precaución", " — Alternativa", " — Útil", " — Equianalgesia"
  // Estrategia: separar por " — " si el resultado tiene ≥ 2 partes y la primera parte es razonablemente corta (< 100 chars)
  const parts = item.split(' — ');
  if (parts.length < 2) return item;

  const main = parts[0].trim();
  // Solo aplicar si main es razonablemente corto (no estamos mutilando una frase larga)
  if (main.length > 120) return item;

  const subs = parts.slice(1).map(s => s.trim()).filter(Boolean);
  if (subs.length === 0) return item;

  return [main, ...subs.map(s => `~ ${s}`)].join('\n');
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  PALIATIVOS SUB-ITEMS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const namePattern of TOPIC_NAMES) {
  const { data: topics } = await supabase
    .from('topics').select('id, name, content_blocks').ilike('name', namePattern);

  for (const topic of (topics || [])) {
    console.log(`📋 ${topic.name} (${topic.id})`);
    let blocks = topic.content_blocks || [];
    let totalChanges = 0;

    blocks = blocks.map(b => {
      // Solo aplicar a criteria items (no a flowchart details, que ya tienen otro sistema)
      if (b.type !== 'criteria' || !Array.isArray(b.items)) return b;

      const newItems = b.items.map(item => {
        const transformed = splitItem(item);
        if (transformed !== item) totalChanges++;
        return transformed;
      });

      return { ...b, items: newItems };
    });

    if (totalChanges === 0) {
      console.log(`   (sin cambios)\n`);
      continue;
    }

    console.log(`   ~ ${totalChanges} items transformados a main + sub`);

    if (!APPLY) { console.log(); continue; }

    const { error } = await supabase
      .from('topics').update({ content_blocks: blocks }).eq('id', topic.id);
    if (error) console.error(`   ❌ ${error.message}`);
    else       console.log(`   ✅ Actualizado.\n`);
  }
}

if (!APPLY) console.log('\n⚠️  Modo dry-run. Agrega --apply.');
