/**
 * Marca topics como "Tema Complementario" via tipo_contenido (genera badge ámbar
 * en card de categoría). Revierte el tag "Tema complementario" que se había
 * agregado por error al campo tags.
 *
 * Uso:  node scripts/update-tema-complementario-badge-v1.mjs
 *       node scripts/update-tema-complementario-badge-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPIC_NAMES = [
  '%dolor oncol%',
  '%subcut%',
  '%urgencias en cuidados%',
  '%hiperkalemia%',
  '%cuerpo extra%',
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TEMA COMPLEMENTARIO BADGE v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const namePattern of TOPIC_NAMES) {
  const { data: topics } = await supabase
    .from('topics').select('id, name, tags, tipo_contenido').ilike('name', namePattern);

  for (const topic of (topics || [])) {
    console.log(`📋 ${topic.name} (${topic.id})`);
    const updates = {};
    let changed = false;

    // Setear tipo_contenido — preservar otros valores y agregar tema_complementario
    const existingTipos = Array.isArray(topic.tipo_contenido) ? topic.tipo_contenido : [];
    if (!existingTipos.includes('tema_complementario')) {
      updates.tipo_contenido = ['tema_complementario', ...existingTipos.filter(t => t !== 'tema_complementario')];
      console.log(`   ~ tipo_contenido: ${JSON.stringify(updates.tipo_contenido)}`);
      changed = true;
    }

    // Revertir tag (sacar "Tema complementario" del array tags)
    const existingTags = Array.isArray(topic.tags) ? topic.tags : [];
    const filteredTags = existingTags.filter(t =>
      typeof t !== 'string' || !t.toLowerCase().includes('complementario')
    );
    if (filteredTags.length !== existingTags.length) {
      updates.tags = filteredTags;
      console.log(`   ~ tags (sin "Tema complementario"): ${JSON.stringify(filteredTags)}`);
      changed = true;
    }

    if (!changed) {
      console.log(`   (sin cambios)\n`);
      continue;
    }

    if (!APPLY) { console.log(); continue; }

    const { error } = await supabase.from('topics').update(updates).eq('id', topic.id);
    if (error) console.error(`   ❌ ${error.message}`);
    else       console.log(`   ✅ Actualizado.\n`);
  }
}

if (!APPLY) console.log('\n⚠️  Modo dry-run. Agrega --apply.');
