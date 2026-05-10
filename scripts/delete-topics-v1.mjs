/**
 * Borra topics listados en `topics-to-delete.json` (en la raíz del repo).
 * Antes de borrar verifica que ningún OTRO topic los referencie:
 *   - topic.related_topics[*].topic_id
 *   - block.reference_id (cuando block.type === 'reference')
 *   - block.links pattern → topicId
 *
 * Si encuentra referencias entrantes, las lista y aborta — el humano
 * decide si las desconecta primero (otro update) o si excluye el ID.
 *
 * Formato de topics-to-delete.json:
 *   [
 *     { "id": "uuid-1", "reason": "duplicado de Demencia local" },
 *     { "id": "uuid-2", "reason": "vacío legacy" }
 *   ]
 *
 * Uso:
 *   node --env-file=.env scripts/delete-topics-v1.mjs           (dry-run)
 *   node --env-file=.env scripts/delete-topics-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const FILE = 'topics-to-delete.json';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DELETE TOPICS — ${APPLY ? '⚡ APPLY' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

if (!existsSync(FILE)) {
  console.error(`❌ No existe ${FILE} en el cwd. Crea el archivo con el formato:`);
  console.error(`   [{ "id": "...", "reason": "..." }, ...]`);
  process.exit(1);
}

const targets = JSON.parse(readFileSync(FILE, 'utf-8'));
if (!Array.isArray(targets) || targets.length === 0) {
  console.error(`❌ ${FILE} debe ser un array no vacío`);
  process.exit(1);
}

const targetIds = new Set(targets.map((t) => t.id));
console.log(`Objetivos: ${targetIds.size} topic(s) para borrar\n`);

// 1) Verificar que existan
const { data: existing } = await supabase
  .from('topics').select('id, name').in('id', [...targetIds]);
const existingIds = new Set((existing || []).map((t) => t.id));

const missing = [...targetIds].filter((id) => !existingIds.has(id));
if (missing.length) {
  console.log(`⚠️  ${missing.length} ID(s) no existen ya en BD:`);
  missing.forEach((id) => console.log(`   - ${id}`));
}

// 2) Buscar referencias entrantes
console.log(`\n🔎 Verificando referencias entrantes...`);

const { data: allTopics } = await supabase
  .from('topics')
  .select('id, name, content_blocks, related_topics');

const incoming = []; // { fromId, fromName, kind, detail, target }

for (const t of allTopics || []) {
  if (targetIds.has(t.id)) continue;

  // related_topics
  if (Array.isArray(t.related_topics)) {
    for (const r of t.related_topics) {
      if (r && targetIds.has(r.topic_id)) {
        incoming.push({
          fromId: t.id,
          fromName: t.name,
          kind: 'related_topics',
          detail: `label="${r.label || ''}"`,
          target: r.topic_id,
        });
      }
    }
  }

  // content_blocks
  const blocks = Array.isArray(t.content_blocks) ? t.content_blocks : [];
  blocks.forEach((b, idx) => {
    if (!b || typeof b !== 'object') return;
    if (b.type === 'reference' && b.reference_id && (!b.reference_type || b.reference_type === 'topic') && targetIds.has(b.reference_id)) {
      incoming.push({
        fromId: t.id,
        fromName: t.name,
        kind: 'block.reference_id',
        detail: `block #${idx} (${b.id || 'no-id'})`,
        target: b.reference_id,
      });
    }
    if (b.links && typeof b.links === 'object') {
      for (const [pattern, val] of Object.entries(b.links)) {
        const tid = typeof val === 'string' ? val : val?.topicId;
        if (tid && targetIds.has(tid)) {
          incoming.push({
            fromId: t.id,
            fromName: t.name,
            kind: 'block.links',
            detail: `block #${idx} pattern="${pattern}"`,
            target: tid,
          });
        }
      }
    }
  });
}

if (incoming.length) {
  console.log(`\n❗ ${incoming.length} referencia(s) entrante(s) encontradas — bloquean el delete:`);
  incoming.forEach((r) => {
    console.log(`   • ${r.fromName} (${r.fromId.slice(0, 8)}…)`);
    console.log(`        → apunta a ${r.target}  vía ${r.kind}  ${r.detail}`);
  });
  console.log(`\n   Resuelve estas referencias antes de borrar (otro update script o excluye el ID).`);
  if (APPLY) {
    console.log(`\n❌ Abortando apply por seguridad.\n`);
    process.exit(1);
  }
} else {
  console.log(`   ✅ Sin referencias entrantes.`);
}

// 3) Plan
console.log(`\n📋 Plan de borrado:`);
for (const t of targets) {
  if (existingIds.has(t.id)) {
    const real = (existing || []).find((x) => x.id === t.id);
    console.log(`   🗑  ${t.id}  "${real?.name}"  — ${t.reason || 'sin razón documentada'}`);
  }
}

if (!APPLY) {
  console.log(`\n⚠️  Modo dry-run. Agrega --apply para borrar.\n`);
  process.exit(0);
}

// 4) Apply
const toDelete = [...existingIds];
if (toDelete.length === 0) {
  console.log(`\nNada que borrar.\n`);
  process.exit(0);
}

const { error } = await supabase.from('topics').delete().in('id', toDelete);
if (error) {
  console.error(`\n❌ Error al borrar: ${error.message}\n`);
  process.exit(1);
}

console.log(`\n✅ Borrados: ${toDelete.length}\n`);
