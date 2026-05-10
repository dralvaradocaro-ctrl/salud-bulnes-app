/**
 * Auditor de referencias cruzadas entre topics:
 *   1. Detector de links rotos:
 *      - block.links pattern → topicId
 *      - block.reference_id (type === 'reference')
 *      - topic.related_topics[].topic_id
 *   2. Sugerencias automáticas: si un topic menciona un keyword cuyo topic
 *      canónico existe y no está enlazado, lo lista como sugerencia.
 *   3. Aplicador opcional: lee suggestions-approved.json y crea las refs.
 *
 * Uso:
 *   node --env-file=.env scripts/audit-cross-references-v1.mjs
 *   node --env-file=.env scripts/audit-cross-references-v1.mjs --apply-suggestions suggestions-approved.json
 *
 * Formato suggestions-approved.json:
 *   [{ "from_topic_id": "...", "to_topic_id": "...", "label": "...",
 *      "mode": "related" | "reference" | "inline", "pattern": "..." (solo inline) }]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const APPLY_FLAG = '--apply-suggestions';
const applyIdx = process.argv.indexOf(APPLY_FLAG);
const APPLY_FILE = applyIdx >= 0 ? process.argv[applyIdx + 1] : null;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ── Helpers ──────────────────────────────────────────────────────────
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' ? v : '');
const norm = (s) => str(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// keywords iniciales: pares (regex en lower-norm, palabra para reportar)
// Los topic IDs canónicos se descubren al cargar `topics` (búsqueda fuzzy por name).
const BASE_KEYWORDS = [
  ['rcp pediatric', 'RCP Pediátrico'],
  ['rcp adulto', 'RCP Adulto'],
  ['secuencia r', 'Secuencia Rápida de Intubación (SRI)'],
  ['intubaci', 'Secuencia Rápida de Intubación (SRI)'],
  ['traumatismo cra', 'Manejo del Traumatismo Craneoencefálico'],
  ['tec adulto', 'Manejo del Traumatismo Craneoencefálico'],
  ['intento suicid', 'Manejo de Pacientes con Intento Suicida'],
  ['cuerpo extra', 'Manejo de Cuerpo Extraño'],
  ['cuidados paliat', 'Alivio del dolor y cuidados paliativos'],
  ['sedaci', 'Sedación Paliativa'],
  ['vía subcut', 'Vía Subcutánea en Cuidados Paliativos'],
  ['vía subcut', 'Vía Subcutánea en Cuidados Paliativos'],
  ['epilepsia', 'Epilepsia'],
  ['hipotiroid', 'Hipotiroidismo'],
  ['cesaci', 'Cesación del consumo de tabaco'],
  ['demencia', 'Demencia'],
  ['diabetes mellitus tipo 1', 'Diabetes mellitus tipo 1'],
  ['diabetes mellitus tipo 2', 'Diabetes mellitus tipo 2'],
  ['hipertensi', 'Hipertensión'],
  ['fibrilaci', 'Fibrilación auricular'],
  ['iam', 'Infarto Agudo'],
  ['infarto agudo', 'Infarto Agudo'],
  ['acv', 'ACV'],
  ['cirrosis', 'Cirrosis hepática'],
  ['hepatitis b', 'Hepatitis crónica por virus hepatitis B'],
  ['hepatitis c', 'Hepatitis crónica por virus hepatitis C'],
  ['asma', 'Asma bronquial'],
  ['ira ', 'Infección respiratoria aguda'],
  ['parto prematur', 'Prevención de parto prematuro'],
  ['violencia sex', 'Código Lila'],
];

// ── Carga ────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  AUDITORÍA REFERENCIAS CRUZADAS`);
console.log(`═══════════════════════════════════════════════════════\n`);

const PAGE = 1000;
let topics = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, content_blocks, related_topics')
    .order('name', { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) { console.error(`❌ ${error.message}`); process.exit(1); }
  if (!data || data.length === 0) break;
  topics = topics.concat(data);
  if (data.length < PAGE) break;
}

const idsSet = new Set(topics.map((t) => t.id));
console.log(`Topics cargados: ${topics.length}\n`);

// ── 1) Links rotos ───────────────────────────────────────────────────
const broken = [];

for (const t of topics) {
  // related_topics
  for (const r of arr(t.related_topics)) {
    if (r?.topic_id && !idsSet.has(r.topic_id)) {
      broken.push({ from: t.id, fromName: t.name, kind: 'related_topics', target: r.topic_id, detail: `label="${r.label || ''}"` });
    }
  }
  // content_blocks
  arr(t.content_blocks).forEach((b, idx) => {
    if (!b || typeof b !== 'object') return;
    if (b.type === 'reference' && b.reference_id && (!b.reference_type || b.reference_type === 'topic') && !idsSet.has(b.reference_id)) {
      broken.push({ from: t.id, fromName: t.name, kind: 'block.reference_id', target: b.reference_id, detail: `block #${idx} (${b.id || 'no-id'})` });
    }
    if (b.links && typeof b.links === 'object') {
      for (const [pattern, val] of Object.entries(b.links)) {
        const tid = typeof val === 'string' ? val : val?.topicId;
        if (tid && !idsSet.has(tid)) {
          broken.push({ from: t.id, fromName: t.name, kind: 'block.links', target: tid, detail: `block #${idx} pattern="${pattern}"` });
        }
      }
    }
  });
}

console.log(`🔗 LINKS ROTOS  (${broken.length})`);
broken.slice(0, 25).forEach((b) =>
  console.log(`   • ${b.fromName}\n        ${b.kind} → ${b.target}  ${b.detail}`)
);
if (broken.length > 25) console.log(`   … y ${broken.length - 25} más`);

// ── 2) Resolver keywords contra topics existentes ────────────────────
const KEYWORDS = [];
for (const [pat, hint] of BASE_KEYWORDS) {
  const candidates = topics.filter((t) => norm(t.name).includes(norm(hint).split(' ')[0]));
  // mejor match: el que tenga más overlap del hint
  const best = candidates.sort((a, b) => {
    const sa = norm(a.name).includes(norm(hint)) ? 1000 : 0;
    const sb = norm(b.name).includes(norm(hint)) ? 1000 : 0;
    return (sb + b.name.length) - (sa + a.name.length);
  })[0];
  if (best) KEYWORDS.push({ pat, target: best, hint });
}
console.log(`\n🔑 Diccionario de keywords resuelto: ${KEYWORDS.length}/${BASE_KEYWORDS.length}`);

// ── 3) Sugerencias ───────────────────────────────────────────────────
const collectText = (t) => {
  const parts = [str(t.description)];
  for (const b of arr(t.content_blocks)) {
    if (!b) continue;
    parts.push(str(b.content), str(b.title), str(b.description));
    for (const f of ['details', 'items']) {
      if (Array.isArray(b[f])) for (const x of b[f]) parts.push(typeof x === 'string' ? x : str(x?.text || x?.label));
    }
  }
  return parts.join('\n');
};

const linkedTargetIds = (t) => {
  const set = new Set();
  for (const r of arr(t.related_topics)) if (r?.topic_id) set.add(r.topic_id);
  for (const b of arr(t.content_blocks)) {
    if (!b) continue;
    if (b.type === 'reference' && b.reference_id) set.add(b.reference_id);
    if (b.links && typeof b.links === 'object') {
      for (const v of Object.values(b.links)) {
        const tid = typeof v === 'string' ? v : v?.topicId;
        if (tid) set.add(tid);
      }
    }
  }
  return set;
};

const suggestions = [];

for (const t of topics) {
  const text = norm(collectText(t));
  if (!text.length) continue;
  const linked = linkedTargetIds(t);

  for (const { pat, target, hint } of KEYWORDS) {
    if (target.id === t.id) continue;
    if (linked.has(target.id)) continue;
    const idx = text.indexOf(pat);
    if (idx < 0) continue;
    const snippet = text.slice(Math.max(0, idx - 30), idx + pat.length + 30).replace(/\s+/g, ' ').trim();
    suggestions.push({
      from_topic_id: t.id,
      from_name: t.name,
      to_topic_id: target.id,
      to_name: target.name,
      label: hint,
      mode: 'related',
      keyword: pat,
      snippet: `…${snippet}…`,
    });
  }
}

console.log(`\n💡 SUGERENCIAS  (${suggestions.length})`);
suggestions.slice(0, 25).forEach((s) =>
  console.log(`   • ${s.from_name}  →  ${s.to_name}\n        keyword "${s.keyword}"  · ${s.snippet}`)
);
if (suggestions.length > 25) console.log(`   … y ${suggestions.length - 25} más`);

// ── JSON de salida ───────────────────────────────────────────────────
const fname = `audit-cross-references-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(fname, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalTopics: topics.length,
  brokenLinks: broken,
  suggestions,
}, null, 2));
console.log(`\n💾 Reporte: ${fname}`);

if (!APPLY_FILE) {
  console.log(`\nPara aplicar sugerencias filtradas:`);
  console.log(`   1) cp ${fname} suggestions-approved.json`);
  console.log(`   2) editar dejando solo las que apruebas (formato: [{from_topic_id, to_topic_id, label, mode, pattern?}])`);
  console.log(`   3) node --env-file=.env scripts/audit-cross-references-v1.mjs --apply-suggestions suggestions-approved.json\n`);
  process.exit(0);
}

// ── 4) Apply ─────────────────────────────────────────────────────────
if (!existsSync(APPLY_FILE)) {
  console.error(`\n❌ No existe ${APPLY_FILE}`);
  process.exit(1);
}
const approved = JSON.parse(readFileSync(APPLY_FILE, 'utf-8'));
if (!Array.isArray(approved)) { console.error('Archivo debe ser un array'); process.exit(1); }

console.log(`\n⚡ Aplicando ${approved.length} sugerencia(s) desde ${APPLY_FILE}\n`);

// agrupar por from_topic_id
const byFrom = approved.reduce((acc, s) => {
  if (!acc.has(s.from_topic_id)) acc.set(s.from_topic_id, []);
  acc.get(s.from_topic_id).push(s);
  return acc;
}, new Map());

let ok = 0, fail = 0;
for (const [fromId, items] of byFrom.entries()) {
  const t = topics.find((x) => x.id === fromId);
  if (!t) { console.error(`   ❌ topic ${fromId} no existe`); fail++; continue; }

  const nextRelated = arr(t.related_topics).slice();
  const nextBlocks = arr(t.content_blocks).slice();
  let dirty = false;

  for (const s of items) {
    if (s.mode === 'related') {
      if (!nextRelated.some((r) => r?.topic_id === s.to_topic_id)) {
        nextRelated.push({ topic_id: s.to_topic_id, label: s.label });
        dirty = true;
      }
    } else if (s.mode === 'reference') {
      const blockId = `xref-${s.to_topic_id.slice(0, 8)}`;
      if (!nextBlocks.some((b) => b?.id === blockId)) {
        nextBlocks.push({
          id: blockId,
          type: 'reference',
          reference_type: 'topic',
          reference_id: s.to_topic_id,
          reference_label: s.label,
          order: 9000,
        });
        dirty = true;
      }
    } else if (s.mode === 'inline') {
      // anexa un bloque text con link inline al final
      const blockId = `xref-inline-${s.to_topic_id.slice(0, 8)}`;
      if (!nextBlocks.some((b) => b?.id === blockId)) {
        nextBlocks.push({
          id: blockId,
          type: 'text',
          title: 'Ver también',
          content: `Consultar también: **${s.label}**.`,
          links: { [s.label]: { topicId: s.to_topic_id, label: s.label } },
          order: 9100,
        });
        dirty = true;
      }
    }
  }

  if (!dirty) { console.log(`   ⏭  ${t.name} — sin cambios`); continue; }

  const { error } = await supabase
    .from('topics')
    .update({ related_topics: nextRelated, content_blocks: nextBlocks })
    .eq('id', t.id);
  if (error) { console.error(`   ❌ ${t.name}: ${error.message}`); fail++; }
  else { console.log(`   ✅ ${t.name}  (+${items.length} ref)`); ok++; }
}

console.log(`\nResultado: ${ok} OK, ${fail} fail\n`);
