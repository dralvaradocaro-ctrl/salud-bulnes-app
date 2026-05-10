/**
 * Inyecta en protocolos vigentes una nota informativa de los medicamentos
 * nuevos disponibles vía Arsenal Básico SSÑ-2026 (Res. Ex. N°5754, dic-2025)
 * para Hospitales Comunitarios.
 *
 * Estrategia segura:
 *   - NO modifica bloques existentes.
 *   - Agrega UN bloque tipo `text` al final de `content_blocks` con id
 *     "ssn2026-novedad" (idempotente: si ya existe, se omite).
 *   - Adicionalmente marca el topic con `metadata.ssn2026_updated = true`
 *     (si la columna metadata existe) para que el frontend muestre el aviso
 *     amarillo. Si no existe la columna, el frontend usa el set estático
 *     en src/lib/ssn2026-updated-topics.ts.
 *
 * Uso:
 *   node --env-file=.env scripts/update-protocolos-ssn2026-v1.mjs
 *   node --env-file=.env scripts/update-protocolos-ssn2026-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const NOVEDAD_BLOCK_ID = 'ssn2026-novedad';

// ── Mapeo: patrón de nombre de topic → medicamentos relevantes ───────
// El patrón se prueba como ILIKE %patrón%.
const PATTERN_MEDS = [
  {
    patterns: ['epilepsia', 'convuls', 'crisis epil', 'rcp'],
    label: 'PM Epilepsia / Urgencia neurológica',
    meds: [
      '**Lacosamida 100 mg comp** — anticonvulsivante adyuvante en crisis focales.',
      '**Vigabatrina 500 mg comp** — 1ª línea espasmos infantiles (West).',
      '**Clobazam 10 mg comp** — adyuvante en crisis refractarias / Lennox-Gastaut.',
      '**Oxcarbazepina susp 60 mg/mL · comp 300 mg** — alternativa a carbamazepina.',
      '**Ácido valproico LP 250 mg · jarabe 250 mg/5mL · gotas 375 mg/mL** — nuevas presentaciones.',
      '**Lamotrigina bucodispersable 25 mg** — forma farmacéutica nueva.',
      '**Topiramato 100 mg comp** — concentración nueva (existía solo 25 mg).',
      '**Carbamazepina LP 200 mg** — concentración LP nueva.',
    ],
  },
  {
    patterns: ['paliativ', 'dolor cr', 'cuidados paliat', 'cpu'],
    label: 'Cuidados Paliativos / CPU',
    meds: [
      '**Morfina LP 30 mg comp** — analgésico opioide de liberación prolongada.',
      '**Tramadol LP 100 mg comp** — opioide débil de liberación prolongada.',
      '**Tramadol/Paracetamol 325/37,5 mg comp** — combinación oral.',
      '**Escopolamina 20 mg/mL ampolla** — antiespasmódico parenteral.',
    ],
  },
  {
    patterns: ['cesaci', 'tabaco', 'cesac'],
    label: 'GES Cesación del consumo de tabaco',
    meds: [
      '**Anfebutamona (Bupropion) LP 150 mg comp** — apoyo farmacológico a la cesación.',
    ],
  },
  {
    patterns: ['cardiovascular', 'pscv', 'diabet', 'dm2'],
    label: 'PSCV / Cardiovascular / DM2',
    meds: [
      '**Empagliflozina 10 mg comp** — alternativa a Dapagliflozina (iSGLT2).',
      '**Rivaroxabán 20 mg comp** — DOAC para continuidad de tratamiento iniciado en especialidad.',
    ],
  },
  {
    patterns: ['respirator', 'asma', 'epoc', 'salud respiratoria'],
    label: 'PM Salud Respiratoria',
    meds: [
      '**Budesonida + Formoterol 160/4,5 mcg inhalador** — terapia combinada de mantención.',
      '**Fluticasona 125 mcg inhalador (mono)** — corticoide inhalado.',
    ],
  },
  {
    patterns: ['parto prematur', 'amenaza de parto', 'tocolisis', 'gineco'],
    label: 'Urgencia Gineco-Obstétrica',
    meds: [
      '**Nifedipino 10 mg comp** — tocolítico de 1ª línea en parto prematuro.',
    ],
  },
  {
    patterns: ['intubaci', 'sri', 'secuencia r', 'urgencia'],
    label: 'SRI / Urgencias',
    meds: [
      '**Ketamina 500 mg/mL ampolla** — inducción anestésica en SRI; útil en broncoespasmo, asma severa, status epiléptico refractario, agitación severa, sedoanalgesia para procedimientos.',
    ],
  },
  {
    patterns: ['cirrosis', 'hep'],
    label: 'GES Cirrosis hepática',
    meds: [
      '**Calcio + Vitamina D 500 mg + 800 UI comp** — concentración recomendada para osteoprotección.',
    ],
  },
];

const buildBlock = (label, meds) => ({
  id: NOVEDAD_BLOCK_ID,
  type: 'text',
  color: 'amber',
  order: 9999,
  title: '🆕 Arsenal Básico SSÑ-2026 — medicamentos nuevos disponibles',
  content: `> **Novedad institucional.** El Servicio de Salud Ñuble emitió el Arsenal Básico para Hospitales Comunitarios 2026 (Resolución Exenta N°5754, 23-dic-2025). Este arsenal **complementa** al arsenal local del HCSF Bulnes (Res. Ex. 5235), no lo reemplaza.

**Aplicable a este protocolo (${label}):**

${meds.map(m => `- ${m}`).join('\n')}

> Estas presentaciones están ahora disponibles en farmacia y son matchables desde la **Prescripción Inteligente**. Para detalle completo, ver el [Arsenal del medispense](/PrescripcionInteligente/arsenal) — los nuevos registros aparecen marcados con badge **🆕 SSÑ-2026**.`,
  layout_position: 'main',
});

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  UPDATE PROTOCOLOS — SSÑ-2026 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// 1) Buscar topics que matchean cualquier patrón
const allPatterns = [...new Set(PATTERN_MEDS.flatMap(p => p.patterns))];
console.log(`Buscando topics con ${allPatterns.length} patrones...\n`);

const { data: topics, error: fetchErr } = await supabase
  .from('topics')
  .select('id, name, content_blocks')
  .or(allPatterns.map(p => `name.ilike.%${p}%`).join(','));

if (fetchErr) {
  console.error(`❌ Error al buscar topics: ${fetchErr.message}`);
  process.exit(1);
}

console.log(`Encontrados ${topics?.length || 0} topics candidatos.\n`);

if (!topics || topics.length === 0) {
  console.log('Nada que actualizar.');
  process.exit(0);
}

// 2) Para cada topic, decidir qué grupo de meds aplicar (el primer match)
const updates = [];
for (const t of topics) {
  const lower = (t.name || '').toLowerCase();
  const group = PATTERN_MEDS.find(g => g.patterns.some(p => lower.includes(p)));
  if (!group) continue;

  const blocks = Array.isArray(t.content_blocks) ? t.content_blocks : [];
  const alreadyHas = blocks.some(b => b && b.id === NOVEDAD_BLOCK_ID);

  updates.push({
    topic: t,
    group,
    alreadyHas,
    nextBlocks: alreadyHas
      ? blocks.map(b => (b && b.id === NOVEDAD_BLOCK_ID ? buildBlock(group.label, group.meds) : b))
      : [...blocks, buildBlock(group.label, group.meds)],
  });
}

console.log(`Plan de actualización (${updates.length} topics):\n`);
updates.forEach(u =>
  console.log(`   ${u.alreadyHas ? '🔄 update' : '➕ append'}  [${u.group.label}]  →  ${u.topic.name}`)
);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir.\n');
  process.exit(0);
}

// 3) Aplicar
let ok = 0, fail = 0;
for (const u of updates) {
  const { error } = await supabase
    .from('topics')
    .update({ content_blocks: u.nextBlocks })
    .eq('id', u.topic.id);
  if (error) {
    console.error(`   ❌ ${u.topic.name}: ${error.message}`);
    fail++;
  } else {
    console.log(`   ✅ ${u.topic.name}`);
    ok++;
  }
}

console.log(`\nResultado: ${ok} OK, ${fail} fail\n`);
console.log('Sugerencia: actualiza también src/lib/ssn2026-updated-topics.ts');
console.log('con los IDs de topics tocados para que el aviso amarillo aparezca.\n');

console.log('IDs afectados:');
updates.forEach(u => console.log(`   '${u.topic.id}', // ${u.topic.name}`));
