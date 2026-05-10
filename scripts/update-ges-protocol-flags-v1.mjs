/**
 * Depura el flag `has_local_protocol` en topics GES:
 *   - Solo Hipotiroidismo y Alzheimer/Demencia (los que efectivamente tienen
 *     protocolo local desarrollado) mantienen has_local_protocol = true.
 *   - El resto de topics GES (clasificacion_ges = 'GES') pasa a false.
 *   - Topics no-GES NO se modifican (son protocolos institucionales locales
 *     legítimos: RCP, TEC, Trombolisis, etc.).
 *
 * Uso:
 *   node --env-file=.env scripts/update-ges-protocol-flags-v1.mjs           (dry-run)
 *   node --env-file=.env scripts/update-ges-protocol-flags-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// GES con protocolo local efectivamente desarrollado
const KEEP_LOCAL = [
  'hipotiroidismo',
  'alzheimer',          // "Enfermedad de Alzheimer y otras demencias"
];

const matchesKeep = (name) => {
  const n = (name || '').toLowerCase();
  return KEEP_LOCAL.some((k) => n.includes(k));
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DEPURACIÓN has_local_protocol EN GES — ${APPLY ? '⚡ APPLY' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// 1) Cargar todos los GES
const { data: gesTopics, error } = await supabase
  .from('topics')
  .select('id, name, has_local_protocol, clasificacion_ges')
  .eq('clasificacion_ges', 'GES')
  .order('name');

if (error) { console.error(`❌ ${error.message}`); process.exit(1); }
console.log(`Total topics GES: ${gesTopics.length}\n`);

// 2) Clasificar
const keep = gesTopics.filter((t) => matchesKeep(t.name));
const flip = gesTopics.filter((t) => !matchesKeep(t.name) && t.has_local_protocol === true);
const alreadyOff = gesTopics.filter((t) => !matchesKeep(t.name) && !t.has_local_protocol);

console.log(`✅ MANTENER has_local_protocol=true (${keep.length}):`);
keep.forEach((t) => console.log(`   • ${t.name}  [${t.has_local_protocol ? 'true ✓' : 'FALSE — habrá que activar'}]`));

console.log(`\n🔻 CAMBIAR has_local_protocol → false (${flip.length}):`);
flip.slice(0, 25).forEach((t) => console.log(`   - ${t.name}`));
if (flip.length > 25) console.log(`   … y ${flip.length - 25} más`);

console.log(`\n⏭️  Ya están en false (${alreadyOff.length}) — sin cambios`);

// 3) Plan: asegurar keep en true y flip en false
const toTrue = keep.filter((t) => t.has_local_protocol !== true);
const toFalse = flip;

console.log(`\n📋 Plan:`);
console.log(`   • UPDATE has_local_protocol=true en ${toTrue.length} topic(s)`);
console.log(`   • UPDATE has_local_protocol=false en ${toFalse.length} topic(s)`);

if (!APPLY) {
  console.log(`\n⚠️  Modo dry-run. Agrega --apply para escribir.\n`);
  process.exit(0);
}

// 4) Apply
let ok = 0, fail = 0;

if (toTrue.length) {
  const { error: e1 } = await supabase.from('topics').update({ has_local_protocol: true }).in('id', toTrue.map((t) => t.id));
  if (e1) { console.error(`❌ Activando: ${e1.message}`); fail += toTrue.length; }
  else { console.log(`   ✅ ${toTrue.length} activados`); ok += toTrue.length; }
}

if (toFalse.length) {
  const { error: e2 } = await supabase.from('topics').update({ has_local_protocol: false }).in('id', toFalse.map((t) => t.id));
  if (e2) { console.error(`❌ Desactivando: ${e2.message}`); fail += toFalse.length; }
  else { console.log(`   ✅ ${toFalse.length} desactivados`); ok += toFalse.length; }
}

console.log(`\nResultado: ${ok} OK, ${fail} fail\n`);
