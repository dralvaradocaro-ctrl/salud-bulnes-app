/**
 * Mejora 4 protocolos de Policlínico/SM:
 *  - Agrega autores reales (todos tenían authors: [])
 *  - Infiltración Rodilla: agrega mermaid (activa auto-tab)
 *  - Criterios SM / Prevención Autolesiones / Clotiazepam: autores únicamente
 *
 * Uso:  node scripts/update-policlinico-sm-v1.mjs
 *       node scripts/update-policlinico-sm-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─── AUTORES ────────────────────────────────────────────────────────────────

const AUTHORS_SM_SIMPLE = {
  elaboradores: ['Dr. Rodrigo Enríquez Heredia', 'Dra. Daniella Sbarbaro Arias'],
  revisores:    ['Dra. Micaela Fasani Montagna'],
  aprobadores:  ['Dr. Álvaro Lagos'],
};

const AUTHORS_CLOTIAZEPAM = {
  elaboradores: ['Dr. Rodrigo Enríquez Heredia', 'Dra. Daniella Sbarbaro Arias', 'Dr. Guillermo Beltrán Carrasco'],
  revisores:    ['Dra. Micaela Fasani Montagna'],
  aprobadores:  ['QF Mauricio Fuentes Baltierra', 'Dr. Álvaro Lagos'],
};

// HCSFB 151 — autores no disponibles en PDFs leídos; se deja en blanco hasta revisión
const AUTHORS_INFILTRACION = {};

// ─── INFILTRACIÓN RODILLA — agregar mermaid ──────────────────────────────────

const MERMAID_INFILTRACION = {
  id:    'infil-mermaid',
  type:  'mermaid',
  order: 5,
  title: 'Algoritmo HCSFB 151 — Infiltración de Rodilla con Corticoides',
  content: `flowchart TD
    A([Paciente con gonartrosis\\nEVA ≥ 4 en policlínico]) --> B{¿Kellgren-Lawrence\\nII–IV?}
    B -->|No| C([Optimizar AINES\\n+ kinesiterapia])
    B -->|Sí| D{¿Respuesta\\ninsuficiente ≥ 4 sem?}
    D -->|No| C
    D -->|Sí| E{¿Contraindicación\\npresente?}
    E -->|Infección · prótesis\\ncoagulopatía · glicemia > 250\\ninterv. < 3 meses| F([Manejo alternativo\\nDerivar Traumatología])
    E -->|No| G[Consentimiento informado\\nRegistrar en ficha]
    G --> H[Betametasona 7 mg + Lidocaína 2%\\n4 mL · aguja 21G · abordaje suprapatelar]
    H --> I[Reposo articular\\n24–48 h]
    I --> J[Control 4 semanas:\\nEVA + funcionalidad]
    J --> K{¿Respuesta\\n> 4 semanas?}
    K -->|Sí| L([Continuar programa\\nmáx 3/año · máx 3 años consecutivos])
    K -->|No o progresión| M([Derivar Traumatología\\nEvaluar prótesis])`,
  layout_position: 'main',
};

// ─── UPDATES ────────────────────────────────────────────────────────────────

const UPDATES = [
  {
    label: 'Criterios SM (HCSFB 166)',
    id:    'fa57bf50-f39c-4438-af5e-bfa33be36fce',
    authors: AUTHORS_SM_SIMPLE,
    addBlocks: [],
  },
  {
    label: 'Prevención Autolesiones (HCSFB 160)',
    id:    'c0aecd59-f807-4c2e-af91-408d5f5928b3',
    authors: AUTHORS_SM_SIMPLE,
    addBlocks: [],
  },
  {
    label: 'Clotiazepam (HCSFB 153)',
    id:    'ef1502b6-2c86-455a-8f38-e90e355e7d9e',
    authors: AUTHORS_CLOTIAZEPAM,
    addBlocks: [],
  },
  {
    label: 'Infiltración Rodilla (HCSFB 151)',
    id:    '5bb27846-3bb2-4833-a8f5-1774118b88d7',
    authors: AUTHORS_INFILTRACION,
    addBlocks: [MERMAID_INFILTRACION],
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  POLICLÍNICO SM v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const u of UPDATES) {
  const { data: topic, error } = await supabase
    .from('topics')
    .select('content_blocks, authors')
    .eq('id', u.id)
    .single();

  if (error) { console.error(`❌ Fetch ${u.label}: ${error.message}`); continue; }

  const existingBlocks = topic.content_blocks || [];
  const newBlocks = u.addBlocks.length
    ? [...existingBlocks, ...u.addBlocks]
    : existingBlocks;

  const authorsChanged = Object.keys(u.authors).length > 0;

  console.log(`📋 ${u.label}`);
  console.log(`   Autores actuales: ${JSON.stringify(topic.authors)}`);
  if (authorsChanged) console.log(`   Autores nuevos:   ${JSON.stringify(u.authors)}`);
  else                console.log(`   Autores:          sin cambio (pendiente PDF)`);
  console.log(`   Bloques actuales: ${existingBlocks.length}  →  nuevos: ${newBlocks.length}`);
  if (u.addBlocks.length) u.addBlocks.forEach(b => console.log(`   + bloque "${b.type}": ${b.title}`));
  console.log();

  if (!APPLY) continue;

  const payload = { content_blocks: newBlocks };
  if (authorsChanged) payload.authors = u.authors;

  const { error: e } = await supabase.from('topics').update(payload).eq('id', u.id);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Actualizado.`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
