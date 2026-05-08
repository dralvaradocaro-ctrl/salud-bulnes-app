/**
 * Pobla authors en todos los protocolos con contenido pero sin autores.
 * Datos extraídos de PDFs HCSFB y GCL en sesiones anteriores.
 *
 * Uso:  node scripts/update-authors-batch-v1.mjs
 *       node scripts/update-authors-batch-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─── ACTUALIZACIONES POR ID (Hospitalizados con ID conocido) ─────────────────

const UPDATES_BY_ID = [
  {
    label: 'HCSFB 159 — Agitación Psicomotora',
    id: '13e6128f-882a-4a19-8e18-47cbf13203eb',
    authors: {
      elaboradores: ['Dr. Rodrigo Enríquez Heredia', 'Dra. Daniella Sbarbaro Arias'],
      revisores:    ['Dra. Micaela Fasani Montagna'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'HCSFB 129 — Hipnóticos',
    id: 'eb702967-32fa-4aef-8246-742195d078e8',
    authors: {
      elaboradores: ['Dra. Estefanía Acuña Brevis', 'Dr. Sebastián Bustos Sepúlveda', 'Dr. Roberto Aguilera Jaque'],
      revisores:    ['Dr. Felipe Sancho Tapia'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'HCSFB 165 — Respuesta Rápida MQ',
    id: '099cba54-aec4-4d2b-9760-64b5302fe77e',
    authors: {
      elaboradores: ['Dr. Ignacio San Martín Reyes'],
      revisores:    ['Dra. Micaela Fasani Montagna'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'GCL 2.2.2 — Caídas',
    id: 'c97b6632-904c-4e9c-ba80-defb5b1199d9',
    authors: {
      elaboradores: ['EU. María Teresa Medina Bravo'],
      revisores:    ['EU. Mauricio Contreras Parra'],
      aprobadores:  ['Director Hospital'],
    },
  },
  {
    label: 'GCL 2.2.1 — Error de Medicación',
    id: '23e96a67-0f39-4bfe-91e0-88d63d04c3ae',
    authors: {
      elaboradores: ['EU. María Teresa Medina Bravo', 'EU. Nelson Valdés Anabálon'],
      revisores:    ['EU. Mauricio Contreras Parra'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'GCL 1.9 — Contención Física',
    id: '9e0b3406-9055-43a4-8a75-bf6d290bceb4',
    authors: {
      elaboradores: ['EU. Nelson Valdés Anabálon'],
      revisores:    ['EU. Mauricio Contreras Parra'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'HCSFB 139 — Toracocentesis',
    id: 'df8dbe5d-59a0-4447-80a7-3af37319e325',
    authors: {
      elaboradores: ['Dr. Sebastián Bustos Sepúlveda', 'Dra. Valentina Sandoval Valenzuela', 'Dr. Roberto Aguilera Jaque'],
      revisores:    ['Dr. Felipe Sancho Tapia'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'GCL 1.3 — Dolor Agudo Post-Op',
    id: '66086cdd-cd73-46ca-87da-245fdb2f4e32',
    authors: {
      elaboradores: ['Dr. Roberto Aguilera Jaque'],
      revisores:    ['Dr. Maicol Candia Sandoval'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
];

// ─── ACTUALIZACIONES POR NOMBRE (Urgencias — IDs no logueados) ───────────────

const UPDATES_BY_NAME = [
  {
    label: 'AOC 1.1 — Código Azul',
    nameSubstring: 'Código Azul',
    authors: {
      elaboradores: ['Dra. Camila Gutiérrez Canales'],
      revisores:    ['Dr. Maicol Candia Sandoval'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
  {
    label: 'GCL 1.10 — Intento Suicida',
    nameSubstring: 'Intento Suicida',
    authors: {
      elaboradores: ['Dr. Rodrigo Enríquez Heredia', 'Psic. Sandra Ferrada Landero'],
      revisores:    ['Dr. Felipe Sancho Tapia'],
      aprobadores:  ['Dr. Álvaro Lagos'],
    },
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  AUTORES EN LOTE v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// --- Por ID ---
for (const u of UPDATES_BY_ID) {
  const { data, error } = await supabase
    .from('topics').select('authors').eq('id', u.id).single();

  if (error) { console.error(`❌ Fetch ${u.label}: ${error.message}`); continue; }

  const hasAuthors = data.authors && Object.keys(data.authors).length > 0;
  console.log(`📋 ${u.label}`);
  console.log(`   Autores actuales: ${hasAuthors ? JSON.stringify(data.authors) : 'null / vacío'}`);
  console.log(`   Autores nuevos:   ${JSON.stringify(u.authors)}`);

  if (APPLY) {
    const { error: e } = await supabase.from('topics').update({ authors: u.authors }).eq('id', u.id);
    if (e) console.error(`  ❌ Error: ${e.message}`);
    else   console.log('  ✅ Actualizado.\n');
  } else {
    console.log();
  }
}

// --- Por nombre ---
for (const u of UPDATES_BY_NAME) {
  const { data, error } = await supabase
    .from('topics').select('id, name, authors').ilike('name', `%${u.nameSubstring}%`);

  if (error) { console.error(`❌ Fetch ${u.label}: ${error.message}`); continue; }
  if (!data || data.length === 0) { console.log(`⚠️  Sin match: "${u.nameSubstring}"`); continue; }

  for (const topic of data) {
    const hasAuthors = topic.authors && Object.keys(topic.authors).length > 0;
    console.log(`📋 ${u.label} → "${topic.name}" (${topic.id})`);
    console.log(`   Autores actuales: ${hasAuthors ? JSON.stringify(topic.authors) : 'null / vacío'}`);
    console.log(`   Autores nuevos:   ${JSON.stringify(u.authors)}`);

    if (APPLY) {
      const { error: e } = await supabase.from('topics').update({ authors: u.authors }).eq('id', topic.id);
      if (e) console.error(`  ❌ Error: ${e.message}`);
      else   console.log('  ✅ Actualizado.\n');
    } else {
      console.log();
    }
  }
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
