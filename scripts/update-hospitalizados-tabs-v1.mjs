/**
 * Agrega propiedad `tab` a los bloques de 12 protocolos Hospitalizados que tienen
 * mermaid pero sin tabs explícitos → entran en GES mode → criteria bloques ocultos.
 *
 * Al agregar `tab`, hasTabs=true → isGESMode=false → todos los bloques son visibles.
 *
 * Uso:  node scripts/update-hospitalizados-tabs-v1.mjs
 *       node scripts/update-hospitalizados-tabs-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Mapa: topicId → { label, tabs: { blockId → tabName } }
const TAB_MAP = {

  // HCSFB 159 — Agitación Psicomotora
  '13e6128f-882a-4a19-8e18-47cbf13203eb': {
    label: 'HCSFB 159 — Agitación Psicomotora',
    tabs: {
      'agit-v3-bars':           'Evaluación',
      'agit-v3-escalon1':       'Evaluación',
      'agit-v3-escalon-adultos':'Manejo',
      'agit-v3-pediatrico':     'Manejo',
      'agit-v3-mermaid':        'Algoritmo',
    },
  },

  // HCSFB 129 — Hipnóticos
  'eb702967-32fa-4aef-8246-742195d078e8': {
    label: 'HCSFB 129 — Hipnóticos',
    tabs: {
      'hipn-v3-diagnostico': 'Diagnóstico',
      'hipn-v3-nofarm':      'Diagnóstico',
      'hipn-v3-zdrugs':      'Fármacos',
      'hipn-v3-otros':       'Fármacos',
      'hipn-v3-seguimiento': 'Fármacos',
      'hipn-v3-mermaid':     'Algoritmo',
    },
  },

  // GCL 1.9 — Contención Física
  '9e0b3406-9055-43a4-8a75-bf6d290bceb4': {
    label: 'GCL 1.9 — Contención Física',
    tabs: {
      'conten-v3-indicaciones': 'Indicaciones',
      'conten-v3-tecnica':      'Técnica',
      'conten-v3-monitoreo':    'Técnica',
      'contencion-mermaid':     'Algoritmo',
    },
  },

  // GCL 2.2.2 — Caídas
  'c97b6632-904c-4e9c-ba80-defb5b1199d9': {
    label: 'GCL 2.2.2 — Caídas',
    tabs: {
      'caidas-v3-dowton':  'Evaluación',
      'caidas-v3-medidas': 'Prevención',
      'caidas-v3-evento':  'Prevención',
      'caidas-v3-mermaid': 'Algoritmo',
    },
  },

  // GCL 2.2.1 — Error de Medicación
  '23e96a67-0f39-4bfe-91e0-88d63d04c3ae': {
    label: 'GCL 2.2.1 — Error de Medicación',
    tabs: {
      'errmed-v3-5correctos':   'Criterios',
      'errmed-v3-flujo':        'Protocolo',
      'errmed-v3-notificacion': 'Protocolo',
      'errmed-v3-mermaid':      'Algoritmo',
    },
  },

  // HCSFB 165 — Respuesta Rápida MQ
  '099cba54-aec4-4d2b-9760-64b5302fe77e': {
    label: 'HCSFB 165 — Respuesta Rápida MQ',
    tabs: {
      'rrmq-v3-alertas':  'Señales',
      'rrmq-v3-niveles':  'Respuesta',
      'rrmq-v3-traslado': 'Respuesta',
      'rrmq-v3-mermaid':  'Algoritmo',
    },
  },

  // GCL 1.3 — Dolor Agudo Post-Op
  '66086cdd-cd73-46ca-87da-245fdb2f4e32': {
    label: 'GCL 1.3 — Dolor Agudo Post-Op',
    tabs: {
      'dolor-v3-escalas':  'Evaluación',
      'dolor-v3-aines':    'Fármacos',
      'dolor-v3-opioides': 'Fármacos',
      'dolor-v3-adversos': 'Fármacos',
      'dolor-v3-mermaid':  'Algoritmo',
    },
  },

  // HCSFB 139 — Toracocentesis
  'df8dbe5d-59a0-4447-80a7-3af37319e325': {
    label: 'HCSFB 139 — Toracocentesis',
    tabs: {
      'toraco-v3-contraindicaciones': 'Indicaciones',
      'toraco-v3-tecnica':            'Técnica',
      'toraco-v3-materiales':         'Técnica',
      'toraco-v3-estudios':           'Técnica',
      'toracocentesis-mermaid':       'Algoritmo',
    },
  },

  // GCL 2.2.3-A — LPP
  'da8d14ee-463c-48d0-9460-509bbc422cd7': {
    label: 'GCL 2.2.3-A — LPP',
    tabs: {
      'lpp-braden':      'Evaluación',
      'lpp-estadios':    'Evaluación',
      'lpp-preventivas': 'Prevención',
      'lpp-registro':    'Prevención',
      'lpp-mermaid':     'Algoritmo',
    },
  },

  // GCL 1.7 — Transfusión
  'ea66f700-760b-479b-8299-eef151e98754': {
    label: 'GCL 1.7 — Transfusión',
    tabs: {
      'trans-indicaciones': 'Criterios',
      'trans-reacciones':   'Criterios',
      'trans-mermaid':      'Algoritmo',
    },
  },

  // HCSFB 161 — PROA
  '286e18f1-7d84-4e43-a90a-a15923f4d14c': {
    label: 'HCSFB 161 — PROA',
    tabs: {
      'proa-principios': 'Criterios',
      'proa-duraciones': 'Criterios',
      'proa-mermaid':    'Algoritmo',
    },
  },

  // Tamizaje Nutricional
  '699c845c6050f253dd81526f': {
    label: 'Tamizaje Nutricional',
    tabs: {
      'ref-nrs2002-calc':       'Protocolo',
      'ai-1771865233507-1':     'Protocolo',
      'ai-1771865233507-2':     'Protocolo',
      'ai-1771865233507-3':     'Protocolo',
      'ai-1771865233507-4':     'Protocolo',
      'ai-1771865233507-5':     'Protocolo',
      'ai-1771865233507-6':     'Protocolo',
      'ai-1771865233507-7':     'Protocolo',
      'ai-1771865233507-8':     'Protocolo',
      'ai-1771865233507-9':     'Protocolo',
      'mermaid-flujo-nutricional': 'Algoritmo',
    },
  },
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  HOSPITALIZADOS TABS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const [topicId, config] of Object.entries(TAB_MAP)) {
  const { data: topic, error } = await supabase
    .from('topics').select('content_blocks').eq('id', topicId).single();

  if (error) { console.error(`❌ Fetch ${config.label}: ${error.message}`); continue; }

  const blocks = topic.content_blocks || [];
  let unmatchedCount = 0;

  const updated = blocks.map(b => {
    const tabVal = config.tabs[b.id];
    if (!tabVal) {
      console.warn(`  ⚠️  Sin match: "${b.id}" en ${config.label}`);
      unmatchedCount++;
      return b;
    }
    return { ...b, tab: tabVal };
  });

  const changedCount = updated.filter((b, i) => b.tab !== blocks[i]?.tab).length;

  console.log(`📋 ${config.label}  [${blocks.length} bloques, ${changedCount} cambian, ${unmatchedCount} sin match]`);
  updated.forEach(b => {
    const orig = blocks.find(ob => ob.id === b.id);
    const changed = b.tab !== orig?.tab;
    console.log(`   ${changed ? '+' : ' '} [${(b.tab || '—').padEnd(12)}] ${b.type.padEnd(12)} ${b.id}`);
  });
  console.log();

  if (!APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ content_blocks: updated }).eq('id', topicId);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Tabs asignados.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
