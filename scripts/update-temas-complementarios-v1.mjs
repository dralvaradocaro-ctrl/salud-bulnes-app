/**
 * Marca topics como "Tema complementario" agregando:
 *  - description corta (frase resumen visible en card de categoría)
 *  - tag "Tema complementario" (preservando tags existentes)
 *
 * Aplica a: 3 topics paliativos creados + Hiperkalemia + Cuerpo Extraño en Urgencias.
 *
 * Uso:  node scripts/update-temas-complementarios-v1.mjs
 *       node scripts/update-temas-complementarios-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const COMPLEMENTARIO_TAG = 'Tema complementario';

const TOPICS = [
  {
    nameLike: '%dolor oncol%',
    description: 'Escalera analgésica de la OMS, AINEs, opioides y coadyuvantes en dolor por cáncer.',
  },
  {
    nameLike: '%subcut%',
    description: 'Administración de fármacos e hidratación por vía subcutánea en cuidados paliativos.',
  },
  {
    nameLike: '%urgencias en cuidados%',
    description: 'Manejo clínico de las urgencias más frecuentes en pacientes con enfermedad avanzada.',
  },
  {
    nameLike: '%hiperkalemia%',
    description: null, // ya tiene description
  },
  {
    nameLike: '%cuerpo extra%',
    description: null, // ya tiene description
  },
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TEMAS COMPLEMENTARIOS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const cfg of TOPICS) {
  const { data: topics } = await supabase
    .from('topics').select('id, name, description, tags').ilike('name', cfg.nameLike);

  if (!topics || topics.length === 0) {
    console.log(`⚠️  No encontrado: ${cfg.nameLike}`);
    continue;
  }

  for (const topic of topics) {
    console.log(`📋 ${topic.name} (${topic.id})`);
    const updates = {};
    let changed = false;

    // Description
    if (cfg.description && topic.description !== cfg.description) {
      updates.description = cfg.description;
      console.log(`   ~ description: "${cfg.description}"`);
      changed = true;
    }

    // Tag (preservar existentes, agregar al inicio)
    const existingTags = Array.isArray(topic.tags) ? topic.tags : [];
    const hasComplementario = existingTags.some(t =>
      typeof t === 'string' && t.toLowerCase().includes('complementario')
    );
    if (!hasComplementario) {
      updates.tags = [COMPLEMENTARIO_TAG, ...existingTags];
      console.log(`   ~ tags: ${JSON.stringify(updates.tags)}`);
      changed = true;
    } else {
      console.log(`   (ya tiene tag complementario)`);
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
