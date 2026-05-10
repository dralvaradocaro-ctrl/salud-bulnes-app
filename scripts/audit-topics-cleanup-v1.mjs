/**
 * Auditoría de la tabla `topics`: identifica candidatos a limpieza.
 *   - Vacíos:           sin contenido en ningún campo de protocolo.
 *   - Casi vacíos:      ≤ 1 bloque, o solo bloques meta/reference.
 *   - Duplicados nombre: mismo `name` normalizado (lowercase, sin tildes,
 *                       sin paréntesis con códigos).
 *   - Sospecha contenido: descripciones con similitud > 80%.
 *
 * Uso:  node --env-file=.env scripts/audit-topics-cleanup-v1.mjs
 *
 * Genera siempre un archivo audit-topics-report-<fecha>.json con todo
 * el detalle, pensado para revisar antes de borrar (ver delete-topics-v1.mjs).
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ── Helpers ──────────────────────────────────────────────────────────
const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')         // tildes
    .replace(/\([^)]*\)/g, '')                // (...)
    .replace(/\b(gcl|ges|sm|po|ad|cp|cpu)[\s\-_]*\d+(\.\d+)*\b/g, '') // códigos
    .replace(/[^a-z0-9\s]/g, ' ')             // puntuación
    .replace(/\s+/g, ' ')
    .trim();

const isEmptyArray = (v) => !Array.isArray(v) || v.length === 0;
const isEmptyObject = (v) => !v || (typeof v === 'object' && Object.keys(v).length === 0);
const isEmptyText = (v) => !v || (typeof v === 'string' && v.trim().length === 0);

const isFullyEmpty = (t) =>
  isEmptyArray(t.content_blocks) &&
  isEmptyText(t.description) &&
  isEmptyObject(t.protocol_flowchart) &&
  isEmptyArray(t.protocol_medications) &&
  isEmptyObject(t.protocol_algorithm) &&
  isEmptyText(t.clinical_summary) &&
  isEmptyText(t.diagnostic_orientation) &&
  isEmptyText(t.complementary_studies) &&
  isEmptyText(t.initial_treatment);

const blockTypes = (blocks) => (Array.isArray(blocks) ? blocks.map((b) => b?.type || 'unknown') : []);

const isAlmostEmpty = (t) => {
  if (isEmptyArray(t.content_blocks)) return false; // ya cae en "vacíos"
  const types = blockTypes(t.content_blocks);
  if (types.length <= 1) return true;
  const meaningful = types.filter((tp) => !['meta', 'reference'].includes(tp));
  return meaningful.length === 0;
};

// Jaccard sobre n-grams de palabras (3-grams de palabras)
const wordNgrams = (s, n = 3) => {
  const words = (s || '').split(/\s+/).filter(Boolean);
  if (words.length < n) return new Set(words);
  const out = new Set();
  for (let i = 0; i <= words.length - n; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
};
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

// ── Carga ────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  AUDITORÍA TOPICS — limpieza`);
console.log(`═══════════════════════════════════════════════════════\n`);

const PAGE = 1000;
let all = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, description, content_blocks, protocol_flowchart, protocol_medications, protocol_algorithm, clinical_summary, diagnostic_orientation, complementary_studies, initial_treatment, has_local_protocol, category_id, subcategory, created_at')
    .order('created_at', { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
  if (!data || data.length === 0) break;
  all = all.concat(data);
  if (data.length < PAGE) break;
}
console.log(`Total topics: ${all.length}\n`);

// ── 1) Vacíos ────────────────────────────────────────────────────────
const empty = all.filter(isFullyEmpty);
console.log(`📭 VACÍOS  (${empty.length})`);
empty.slice(0, 30).forEach((t) =>
  console.log(`   - ${t.id}  ${t.name}  [${t.category_id || 'sin cat.'}]`)
);
if (empty.length > 30) console.log(`   … y ${empty.length - 30} más`);

// ── 2) Casi vacíos ───────────────────────────────────────────────────
const almost = all.filter((t) => !isFullyEmpty(t) && isAlmostEmpty(t));
console.log(`\n📄 CASI VACÍOS  (${almost.length})`);
almost.slice(0, 30).forEach((t) => {
  const types = blockTypes(t.content_blocks);
  console.log(`   - ${t.id}  ${t.name}  [bloques: ${types.length} → ${types.join(', ') || '—'}]`);
});
if (almost.length > 30) console.log(`   … y ${almost.length - 30} más`);

// ── 3) Duplicados por nombre normalizado ─────────────────────────────
const byNorm = new Map();
for (const t of all) {
  const k = normalize(t.name);
  if (!k) continue;
  if (!byNorm.has(k)) byNorm.set(k, []);
  byNorm.get(k).push(t);
}
const dupGroups = [...byNorm.values()].filter((g) => g.length > 1);
console.log(`\n👯 DUPLICADOS POR NOMBRE  (${dupGroups.length} grupos)`);
dupGroups.slice(0, 20).forEach((g) => {
  // marcar el de mayor content
  const ranked = [...g].sort((a, b) =>
    (Array.isArray(b.content_blocks) ? b.content_blocks.length : 0) -
    (Array.isArray(a.content_blocks) ? a.content_blocks.length : 0));
  console.log(`   • "${g[0].name}"  (${g.length} copias)`);
  ranked.forEach((t, i) => {
    const blocks = Array.isArray(t.content_blocks) ? t.content_blocks.length : 0;
    const tag = i === 0 ? '★ más completo' : '↳ candidato a borrar';
    console.log(`       ${tag.padEnd(22)} ${t.id}  [${blocks} bloques]  ${t.name}`);
  });
});
if (dupGroups.length > 20) console.log(`   … y ${dupGroups.length - 20} más`);

// ── 4) Sospecha de duplicado por contenido ───────────────────────────
const corpus = all
  .filter((t) => !isFullyEmpty(t))
  .map((t) => ({ t, ng: wordNgrams(normalize(`${t.description || ''} ${(t.content_blocks?.[0]?.content) || ''}`)) }))
  .filter((x) => x.ng.size >= 5);

const contentDups = [];
for (let i = 0; i < corpus.length; i++) {
  for (let j = i + 1; j < corpus.length; j++) {
    if (normalize(corpus[i].t.name) === normalize(corpus[j].t.name)) continue; // ya cubierto en (3)
    const sim = jaccard(corpus[i].ng, corpus[j].ng);
    if (sim >= 0.8) contentDups.push({ a: corpus[i].t, b: corpus[j].t, sim });
  }
}
contentDups.sort((a, b) => b.sim - a.sim);
console.log(`\n🔍 SOSPECHA POR CONTENIDO  (${contentDups.length} pares, similitud ≥ 0.80)`);
contentDups.slice(0, 15).forEach(({ a, b, sim }) => {
  console.log(`   • ${(sim * 100).toFixed(0)}%  ${a.name}  ⇄  ${b.name}`);
  console.log(`              ${a.id}    ${b.id}`);
});
if (contentDups.length > 15) console.log(`   … y ${contentDups.length - 15} más`);

// ── Reporte JSON ─────────────────────────────────────────────────────
const fname = `audit-topics-report-${new Date().toISOString().slice(0, 10)}.json`;
const report = {
  generatedAt: new Date().toISOString(),
  totalTopics: all.length,
  empty: empty.map((t) => ({ id: t.id, name: t.name, category_id: t.category_id, created_at: t.created_at })),
  almostEmpty: almost.map((t) => ({
    id: t.id,
    name: t.name,
    blockCount: Array.isArray(t.content_blocks) ? t.content_blocks.length : 0,
    blockTypes: blockTypes(t.content_blocks),
  })),
  duplicateNameGroups: dupGroups.map((g) => {
    const ranked = [...g].sort((a, b) =>
      (Array.isArray(b.content_blocks) ? b.content_blocks.length : 0) -
      (Array.isArray(a.content_blocks) ? a.content_blocks.length : 0));
    return {
      normalizedName: normalize(g[0].name),
      topics: ranked.map((t, i) => ({
        id: t.id,
        name: t.name,
        blockCount: Array.isArray(t.content_blocks) ? t.content_blocks.length : 0,
        recommendation: i === 0 ? 'keep' : 'review',
      })),
    };
  }),
  contentSuspectPairs: contentDups.map(({ a, b, sim }) => ({
    similarity: Number(sim.toFixed(3)),
    a: { id: a.id, name: a.name },
    b: { id: b.id, name: b.name },
  })),
};
writeFileSync(fname, JSON.stringify(report, null, 2));
console.log(`\n💾 Reporte guardado en: ${fname}`);
console.log(`   Próximo paso: editar manualmente la lista de IDs a borrar y correr`);
console.log(`   node --env-file=.env scripts/delete-topics-v1.mjs --apply\n`);
