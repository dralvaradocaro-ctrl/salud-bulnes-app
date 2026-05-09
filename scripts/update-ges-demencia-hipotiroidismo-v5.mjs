/**
 * Limpieza profunda de Demencia (HCSFB 117) e Hipotiroidismo (HCSFB 98):
 *  - Elimina bloques residuales/duplicados que el v4 no filtró
 *  - Asigna `tab` a bloques GES preservados (Pauta de Cotejo, Criterios Inclusión GES)
 *  - Hipotiroidismo migra a modo de pestañas explícitas (5 pestañas)
 *
 * Uso:
 *   node scripts/update-ges-demencia-hipotiroidismo-v5.mjs           (dry-run)
 *   node scripts/update-ges-demencia-hipotiroidismo-v5.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const ID_DEM  = '696ea74c245ef362de4f4338';
const ID_TIRO = '696efcff77924d3a78533dce';

// ─── DEMENCIA ───────────────────────────────────────────────────────────────
const DEM_DELETE = new Set([
  'dem-flujo-empam',
  'dem-flujo-espontaneo',
  'dem-examenes',
  'dem-derivacion-neuro',
  'dem-roles',
  'dem-formularios',
  '87dbed67-2231-4896-b16a-1d807f9a7a7f', // mermaid Algoritmo Derivación GES (genérico)
]);

const DEM_TAB_ASSIGNMENTS = {
  '68a07721-9372-4030-9231-0722393bebc9': 'dem_cotejo',   // protocol_header Pauta de Cotejo
  '61da8559-6b50-49fd-a022-24f7a7b398fa': 'dem_protocolo', // criteria Criterios Inclusión GES
  '126bde46-45a5-4e60-a879-72f3d5134182': 'dem_cotejo',   // checklist Pauta de Cotejo Alzheimer/Demencia
};

// ─── HIPOTIROIDISMO ─────────────────────────────────────────────────────────
const HIPO_DELETE = new Set([
  'dea41a3c-b724-4d1c-806e-9e2678388cf7', // mermaid Algoritmo Derivación GES (genérico)
]);

const HIPO_TAB_ASSIGNMENTS = {
  'hipo-v4-flujo':       'hipo_protocolo',
  'hipo-v4-tamizaje':    'hipo_protocolo',
  'hipo-v4-laboratorio': 'hipo_protocolo',
  'hipo-v4-farmacos':    'hipo_farmacos',
  'hipo-v4-derivacion':  'hipo_derivacion',
  'hipo-v4-ref-dem':     'hipo_derivacion',
  'hipo-v4-mermaid':     'hipo_flujogramas',
  'bc099aab-2f1c-4244-83a7-5d8807088a1f': 'hipo_protocolo', // criteria Criterios Inclusión GES
  '317a37e0-334a-4076-bdac-3e46a0642ee8': 'hipo_cotejo',    // protocol_header Pauta de Cotejo
  '67860723-f159-419f-b61c-c3c5230db695': 'hipo_cotejo',    // checklist Pauta de Cotejo Hipotiroidismo
};

// ─── MIGRACIÓN ──────────────────────────────────────────────────────────────
async function migrateTopic({ id, label, deleteIds, tabAssignments }) {
  const { data, error } = await supabase
    .from('topics')
    .select('content_blocks')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Fetch ${label}:`, error.message);
    return;
  }

  const before = data.content_blocks || [];
  const afterDelete = before.filter(b => !deleteIds.has(b.id));
  const afterTabs = afterDelete.map(b =>
    tabAssignments[b.id] ? { ...b, tab: tabAssignments[b.id] } : b
  );

  const removed = before.length - afterDelete.length;
  const tabsAssigned = Object.keys(tabAssignments).filter(id =>
    afterDelete.some(b => b.id === id)
  ).length;

  const tabsBreakdown = afterTabs.reduce((acc, b) => {
    const t = b.tab || '(sin tab)';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  console.log(`${label}`);
  console.log(`  bloques antes:        ${before.length}`);
  console.log(`  removidos:            ${removed}`);
  console.log(`  tabs asignados:       ${tabsAssigned}`);
  console.log(`  bloques finales:      ${afterTabs.length}`);
  console.log(`  distribución pestañas:`);
  Object.entries(tabsBreakdown)
    .sort()
    .forEach(([t, n]) => console.log(`    ${t.padEnd(20)} ${n}`));
  console.log('');

  if (!APPLY) return;

  const { error: e } = await supabase
    .from('topics')
    .update({ content_blocks: afterTabs, last_updated: new Date().toISOString() })
    .eq('id', id);

  if (e) console.error(`  Error update ${label}:`, e.message);
  else   console.log(`  Actualizado.\n`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DEMENCIA & HIPOTIROIDISMO v5 — ${APPLY ? 'APPLY MODE' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

await migrateTopic({
  id:              ID_DEM,
  label:           'Demencia (HCSFB 117)',
  deleteIds:       DEM_DELETE,
  tabAssignments:  DEM_TAB_ASSIGNMENTS,
});

await migrateTopic({
  id:              ID_TIRO,
  label:           'Hipotiroidismo (HCSFB 98)',
  deleteIds:       HIPO_DELETE,
  tabAssignments:  HIPO_TAB_ASSIGNMENTS,
});

if (!APPLY) {
  console.log('Modo dry-run. Agregá --apply para escribir en la base de datos.');
}
