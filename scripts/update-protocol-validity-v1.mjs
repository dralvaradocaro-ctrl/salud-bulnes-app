/**
 * Popula protocol_validity para protocolos locales que no lo tienen aún.
 * Los valores vienen de los PDFs leídos en sesión anterior.
 *
 * Uso:  node scripts/update-protocol-validity-v1.mjs
 *       node scripts/update-protocol-validity-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// [substring en nombre, vigencia]
const VALIDITY_MAP = [
  ['TACO',                       'Marzo 2031'],
  ['Anticoagulación Oral',       'Marzo 2031'],
  ['Telemedicina',               'Mayo 2030'],
  ['Disyunción',                 'Abril 2030'],
  ['Acromioclavicular',          'Abril 2030'],
  ['RCP Adulto',                 'Julio 2028'],
  ['Cardiopulmonar Adulto',      'Julio 2028'],
  ['RCP Pediátric',              'Febrero 2029'],
  ['Cardiopulmonar Pediátric',   'Febrero 2029'],
  ['TEC Adulto',                 'Abril 2030'],
  ['Traumatismo Encéfalo',       'Abril 2030'],
  ['Intento Suicida',            'Noviembre 2027'],
  ['Contención Física',          'Enero 2028'],
  ['Caídas',                     'Mayo 2026'],
  ['Prevención de Caídas',       'Mayo 2026'],
  ['Error de Medicación',        'Enero 2028'],
  ['Error Medicación',           'Enero 2028'],
  ['Lesiones por Presión',       'Mayo 2029'],
  ['LPP',                        'Mayo 2029'],
  ['Transfusión',                'Enero 2029'],
  ['Dolor Agudo',                'Julio 2028'],
  ['Post-Operatorio',            'Julio 2028'],
  ['Agitación Psicomotora',      'Marzo 2031'],
  ['Contención Farmacológica',   'Marzo 2031'],
  ['Autolesion',                 'Febrero 2031'],
  ['Prevención de Autolesion',   'Febrero 2031'],
  ['PROA',                       'Febrero 2031'],
  ['Antibióticos',               'Febrero 2031'],
  ['Respuesta Rápida',           'Marzo 2031'],
  ['Criterios de Ingreso',       'Marzo 2031'],
  ['Criterios Salud Mental',     'Marzo 2031'],
  ['Toracocentesis',             'Mayo 2030'],
  ['Hipnótico',                  'Marzo 2030'],
  ['Clotiazepam',                'Noviembre 2030'],
  ['Infiltración',               'Octubre 2030'],
  ['Rodilla',                    'Octubre 2030'],
  ['Trombolisis',                'Marzo 2030'],
  ['Código Azul',                'Julio 2027'],
  ['Intubación',                 'Abril 2030'],
];

function findValidity(name) {
  for (const [pattern, validity] of VALIDITY_MAP) {
    if (name.toLowerCase().includes(pattern.toLowerCase())) return validity;
  }
  return null;
}

// Fetch topics locales sin protocol_validity
const { data: topics, error } = await supabase
  .from('topics')
  .select('id, name, protocol_validity, has_local_protocol')
  .eq('has_local_protocol', true);

if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

const toUpdate = [];
const noMatch  = [];

for (const t of topics) {
  const validity = findValidity(t.name);
  if (validity && !t.protocol_validity) {
    toUpdate.push({ id: t.id, name: t.name, validity });
  } else if (!validity && !t.protocol_validity) {
    noMatch.push(t.name);
  }
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  VIGENCIAS PROTOCOLOS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);
console.log(`\nProtocolos locales totales: ${topics.length}`);
console.log(`A actualizar (sin vigencia + con match): ${toUpdate.length}`);
console.log(`Sin match (quedan sin vigencia): ${noMatch.length}`);
console.log(`Ya tienen vigencia: ${topics.length - toUpdate.length - noMatch.length}`);

console.log('\nActualizaciones:');
for (const u of toUpdate) {
  console.log(`  "${u.name}" → ${u.validity}`);
}

if (noMatch.length > 0) {
  console.log('\nSin match de vigencia:');
  noMatch.forEach(n => console.log(`  - ${n}`));
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

let ok = 0, fail = 0;
for (const u of toUpdate) {
  const { error: e } = await supabase
    .from('topics')
    .update({ protocol_validity: u.validity })
    .eq('id', u.id);
  if (e) { console.error(`  ❌ ${u.name}: ${e.message}`); fail++; }
  else ok++;
}

console.log(`\n✅ ${ok} vigencias actualizadas${fail > 0 ? ` | ❌ ${fail} errores` : ''}.`);
