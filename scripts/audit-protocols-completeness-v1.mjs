/**
 * Score de completitud (0-100) por topic basado en:
 *   - cantidad y diversidad de bloques
 *   - presencia de flujograma, medicamentos, checklist/criteria
 *   - tabs organizados, referencias cruzadas
 *   - largo de contenido textual
 *
 * Uso: node --env-file=.env scripts/audit-protocols-completeness-v1.mjs
 *
 * Genera consola top-30 más débiles + archivo JSON con todos.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ── Helpers ──────────────────────────────────────────────────────────
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const str = (v) => (typeof v === 'string' ? v : '');

const TEXT_FIELDS_PER_BLOCK = ['content', 'description'];
const ARRAY_TEXT_FIELDS_PER_BLOCK = ['details', 'items'];

const blockTextLength = (b) => {
  if (!b || typeof b !== 'object') return 0;
  let n = 0;
  for (const f of TEXT_FIELDS_PER_BLOCK) n += str(b[f]).length;
  for (const f of ARRAY_TEXT_FIELDS_PER_BLOCK) {
    if (Array.isArray(b[f])) {
      for (const x of b[f]) n += typeof x === 'string' ? x.length : str(x?.text).length;
    }
  }
  // checklist: secciones[].items[]
  if (b.type === 'checklist' && Array.isArray(b.sections)) {
    for (const s of b.sections) for (const it of arr(s.items)) n += typeof it === 'string' ? it.length : str(it?.label).length;
  }
  return n;
};

const FLOWCHART_TYPES = new Set(['flowchart', 'mermaid']);
const MEDS_TYPES = new Set(['dose_calculator', 'medication']);
const CHECKLIST_TYPES = new Set(['checklist', 'criteria']);
const REFERENCE_TYPES = new Set(['reference']);

const KNOWN_TYPES = ['text', 'flowchart', 'criteria', 'dose_calculator', 'mermaid', 'checklist'];

// ── Score por dimensión ──────────────────────────────────────────────
function scoreTopic(t) {
  const blocks = arr(t.content_blocks);
  const types = blocks.map((b) => b?.type).filter(Boolean);
  const uniqTypes = new Set(types);
  const totalText = blocks.reduce((s, b) => s + blockTextLength(b), 0) + str(t.description).length;

  // 1) cantidad de bloques (20)
  const cantidad = Math.min(blocks.length / 8, 1) * 20;

  // 2) diversidad (15)
  const diversidad = (Math.min([...uniqTypes].filter((tp) => KNOWN_TYPES.includes(tp)).length, 6) / 6) * 15;

  // 3) flujograma (15)
  const tieneFlow = !!obj(t.protocol_flowchart) || blocks.some((b) => FLOWCHART_TYPES.has(b?.type));
  const flujograma = tieneFlow ? 15 : 0;

  // 4) medicamentos (10)
  const tieneMeds = arr(t.protocol_medications).length > 0 || blocks.some((b) => MEDS_TYPES.has(b?.type));
  const medicamentos = tieneMeds ? 10 : 0;

  // 5) checklist/criteria (10)
  const tieneCk = blocks.some((b) => CHECKLIST_TYPES.has(b?.type));
  const checklist = tieneCk ? 10 : 0;

  // 6) tabs (10)
  const tabs = blocks.filter((b) => str(b?.tab)).length;
  const organizados = blocks.length > 0 ? Math.min(tabs / blocks.length, 1) * 10 : 0;

  // 7) referencias (10)
  const tieneRefs = arr(t.related_topics).length > 0 || blocks.some((b) => REFERENCE_TYPES.has(b?.type));
  const referencias = tieneRefs ? 10 : 0;

  // 8) largo (10) — escala log: 500 chars = 5pt, 2000 = pleno
  const largo = Math.min(totalText / 2000, 1) * 10;

  const total = Math.round(cantidad + diversidad + flujograma + medicamentos + checklist + organizados + referencias + largo);

  // ¿qué dimensiones bajan más el score?
  const breakdown = {
    cantidad: Math.round(cantidad),
    diversidad: Math.round(diversidad),
    flujograma: Math.round(flujograma),
    medicamentos: Math.round(medicamentos),
    checklist: Math.round(checklist),
    organizados: Math.round(organizados),
    referencias: Math.round(referencias),
    largo: Math.round(largo),
  };
  const missing = Object.entries(breakdown)
    .filter(([k, v]) =>
      ({ cantidad: 20, diversidad: 15, flujograma: 15, medicamentos: 10, checklist: 10, organizados: 10, referencias: 10, largo: 10 }[k]) - v >= 5)
    .map(([k]) => k);

  return { total, breakdown, missing, blockCount: blocks.length, types: [...uniqTypes] };
}

// ── Carga ────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  AUDITORÍA COMPLETITUD DE PROTOCOLOS`);
console.log(`═══════════════════════════════════════════════════════\n`);

const PAGE = 1000;
let all = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, description, content_blocks, protocol_flowchart, protocol_medications, related_topics, has_local_protocol, category_id, subcategory, clasificacion_ges')
    .order('name', { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) { console.error(`❌ ${error.message}`); process.exit(1); }
  if (!data || data.length === 0) break;
  all = all.concat(data);
  if (data.length < PAGE) break;
}

// excluir vacíos completos
const isEmpty = (t) =>
  !arr(t.content_blocks).length &&
  !str(t.description) &&
  !obj(t.protocol_flowchart) &&
  !arr(t.protocol_medications).length;

const candidates = all.filter((t) => !isEmpty(t));
console.log(`Total topics evaluables: ${candidates.length}  (de ${all.length} totales)\n`);

const scored = candidates.map((t) => ({ topic: t, ...scoreTopic(t) }));
scored.sort((a, b) => a.total - b.total);

// ── Top 30 más débiles ───────────────────────────────────────────────
console.log(`🪫 TOP 30 PROTOCOLOS MÁS DÉBILES (score ascendente)\n`);
console.log(`  score │ bloques │ falta                              │ topic`);
console.log(`  ──────┼─────────┼────────────────────────────────────┼──────`);
scored.slice(0, 30).forEach(({ topic, total, missing, blockCount }) => {
  const m = missing.length ? missing.slice(0, 4).join(',') : '—';
  console.log(`   ${String(total).padStart(3)}  │  ${String(blockCount).padStart(4)}   │ ${m.padEnd(34)} │ ${topic.name}`);
});

// ── Candidatos prioritarios ──────────────────────────────────────────
const priority = scored.filter(
  ({ topic, total }) => total < 40 && (topic.has_local_protocol || topic.clasificacion_ges === 'GES'),
);

console.log(`\n⚠️  CANDIDATOS PRIORITARIOS  (score < 40 y has_local_protocol=true o GES)`);
priority.forEach(({ topic, total, missing }) => {
  console.log(`   • [${total}]  ${topic.name}`);
  console.log(`        falta: ${missing.join(', ') || '—'}`);
  console.log(`        id:    ${topic.id}`);
});

// ── Histograma ───────────────────────────────────────────────────────
const buckets = [0, 20, 40, 60, 80, 100];
const histo = Array(buckets.length - 1).fill(0);
for (const s of scored) {
  for (let i = 0; i < buckets.length - 1; i++) {
    if (s.total >= buckets[i] && s.total < buckets[i + 1]) { histo[i]++; break; }
    if (i === buckets.length - 2 && s.total === 100) { histo[i]++; break; }
  }
}
console.log(`\n📊 DISTRIBUCIÓN`);
buckets.slice(0, -1).forEach((b, i) => {
  const next = buckets[i + 1];
  const bar = '█'.repeat(Math.round((histo[i] / Math.max(...histo, 1)) * 30));
  console.log(`   ${String(b).padStart(3)}–${String(next).padStart(3)}  ${String(histo[i]).padStart(3)}  ${bar}`);
});

// ── JSON ─────────────────────────────────────────────────────────────
const fname = `audit-protocols-completeness-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(fname, JSON.stringify({
  generatedAt: new Date().toISOString(),
  total: candidates.length,
  histogram: buckets.slice(0, -1).map((b, i) => ({ from: b, to: buckets[i + 1], count: histo[i] })),
  priority: priority.map(({ topic, total, missing, breakdown }) => ({
    id: topic.id, name: topic.name, score: total, missing, breakdown,
    has_local_protocol: !!topic.has_local_protocol, clasificacion_ges: topic.clasificacion_ges || null,
  })),
  all: scored.map(({ topic, total, breakdown, missing, blockCount, types }) => ({
    id: topic.id, name: topic.name, score: total, breakdown, missing, blockCount, types,
    has_local_protocol: !!topic.has_local_protocol, clasificacion_ges: topic.clasificacion_ges || null,
  })),
}, null, 2));
console.log(`\n💾 Reporte guardado en: ${fname}\n`);
