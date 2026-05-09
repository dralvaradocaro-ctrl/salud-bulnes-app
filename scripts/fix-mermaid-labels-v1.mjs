/**
 * Fix masivo de mermaid en TODOS los topics:
 *  - Envuelve labels de nodos en comillas (necesario en Mermaid v11 cuando hay
 *    paréntesis, slashes, en-dash, middle dot, signos de pregunta, +, etc.)
 *  - Reemplaza \n literal por <br/> (más estable que \n en v11)
 *
 * Idempotente: si un label ya tiene comillas, no las duplica.
 *
 * Uso:
 *   node scripts/fix-mermaid-labels-v1.mjs           (dry-run; muestra muestras)
 *   node scripts/fix-mermaid-labels-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

function fixMermaid(content) {
  if (!content || typeof content !== 'string') return content;
  let c = content;

  // 1) \n literal → <br/>
  c = c.replace(/\\n/g, '<br/>');

  // 2) Envolver shapes con comillas si no las tienen.
  //    Orden importa: primero stadium ([...]) para evitar colisión con [...].

  // Stadium:  ID([texto])  →  ID(["texto"])
  c = c.replace(/\(\[([^\]"\n]+?)\]\)/g, '(["$1"])');

  // Round:    ID(texto)    →  ID("texto")    — solo si NO viene precedido por '[' (stadium ya procesado)
  //           y solo si el contenido no tiene paréntesis para evitar over-match
  c = c.replace(/(?<![\[\(])\(([^()"\n\|]+?)\)/g, '("$1")');

  // Square:   ID[texto]    →  ID["texto"]    — evita matchear ya procesados (que contienen ")
  c = c.replace(/(?<!\()\[([^\[\]"\n]+?)\]/g, '["$1"]');

  // Diamond:  ID{texto}    →  ID{"texto"}
  c = c.replace(/\{([^\{\}"\n]+?)\}/g, '{"$1"}');

  return c;
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  FIX MERMAID LABELS — ${APPLY ? 'APPLY MODE' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const { data: topics, error } = await supabase
  .from('topics')
  .select('id, name, protocol_code, content_blocks');

if (error) { console.error('Fetch:', error.message); process.exit(1); }

let totalTopics = 0, totalMermaid = 0, totalChanged = 0, samplesShown = 0;
const updates = [];

for (const t of topics) {
  if (!Array.isArray(t.content_blocks)) continue;
  let topicChanged = false;
  const newBlocks = t.content_blocks.map(b => {
    if (b.type !== 'mermaid' || !b.content) return b;
    totalMermaid++;
    const fixed = fixMermaid(b.content);
    if (fixed === b.content) return b;
    totalChanged++;
    topicChanged = true;
    if (samplesShown < 3 && (t.protocol_code === 'HCSFB 159' || t.protocol_code === 'HCSFB 117' || t.protocol_code === 'GCL 1.4 A')) {
      const beforeLines = b.content.split('\n');
      const afterLines  = fixed.split('\n');
      console.log(`--- DIFF [${t.protocol_code}] ${b.id} ---`);
      for (let i = 0; i < Math.min(beforeLines.length, afterLines.length); i++) {
        if (beforeLines[i] !== afterLines[i]) {
          console.log(`  L${i+1} ANTES : ${beforeLines[i].trim().slice(0, 100)}`);
          console.log(`  L${i+1} DESPUÉS: ${afterLines[i].trim().slice(0, 100)}`);
        }
      }
      console.log('');
      samplesShown++;
    }
    return { ...b, content: fixed };
  });
  if (topicChanged) {
    totalTopics++;
    updates.push({ id: t.id, content_blocks: newBlocks, name: t.name, code: t.protocol_code });
  }
}

console.log(`Topics escaneados: ${topics.length}`);
console.log(`Bloques mermaid totales: ${totalMermaid}`);
console.log(`Bloques mermaid modificados: ${totalChanged}`);
console.log(`Topics con cambios: ${totalTopics}\n`);

if (!APPLY) {
  console.log('Modo dry-run. Agregá --apply para escribir en la base de datos.');
  process.exit(0);
}

let applied = 0;
for (const u of updates) {
  const { error: e } = await supabase
    .from('topics')
    .update({ content_blocks: u.content_blocks, last_updated: new Date().toISOString() })
    .eq('id', u.id);
  if (e) console.error(`  Error ${u.code || u.id}:`, e.message);
  else { applied++; }
}

console.log(`\nActualizados: ${applied}/${updates.length}`);
