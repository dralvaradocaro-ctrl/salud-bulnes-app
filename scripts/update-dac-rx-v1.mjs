/**
 * Disyunción AC — Agrega galería de radiografías de referencia Rockwood.
 * Inserta un bloque image_gallery en la pestaña dac_protocolo (order 3).
 *
 * Uso:  node scripts/update-dac-rx-v1.mjs
 *       node scripts/update-dac-rx-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '1b52d348-1a5f-4cff-836e-10472eef1324';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const RX_BLOCK = {
  id: 'dac-v1-rx-gallery',
  tab: 'dac_protocolo',
  type: 'image_gallery',
  order: 3,
  title: 'Radiografías de Referencia — Clasificación Rockwood',
  description: 'Haz clic en cualquier imagen para ampliarla. La distancia coracoclavicular normal es 11–13 mm.',
  images: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/ACJ_injuries_classification.svg/500px-ACJ_injuries_classification.svg.png',
      caption: 'Clasificación de Rockwood — Los 6 tipos',
      label: 'Diagrama',
      description: 'Vista esquemática comparativa. Tipo I–II: conservador. Tipo III: controversia. Tipo IV–VI: quirúrgico.',
      alt: 'Diagrama clasificación Rockwood DAC tipos I al VI',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Tossy_II.png',
      caption: 'Tipo II — Comparativa bilateral',
      label: 'Tipo II',
      description: 'Hombro derecho afectado vs izquierdo normal. El espacio AC está levemente ampliado; ligamento coracoclavicular parcialmente intacto.',
      alt: 'Radiografía Tossy II bilateral acromioclavicular',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Grade3ACsep.png',
      caption: 'Tipo III — Elevación clavicular',
      label: 'Tipo III',
      description: 'Clavícula elevada con aumento del espacio coracoclavicular (25–100% del normal). Ligamento CC completamente roto.',
      alt: 'Radiografía disyunción acromioclavicular Grado 3',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Grade3ACsepMark.png',
      caption: 'Tipo III — Con marcadores de distancia',
      label: 'Anotada',
      description: 'Mismo caso con líneas de medición superpuestas. Medir siempre desde borde superior coracoides hasta borde inferior de clavícula en línea vertical.',
      alt: 'Radiografía disyunción AC Grado 3 con marcadores distancia coracoclavicular',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Tossy-III_right.jpg',
      caption: 'Tipo III–V — Desplazamiento severo',
      label: 'Tipo III–V',
      description: 'Clavícula protruye más de un ancho de su diámetro. Ligamentos AC y CC completamente desinsertados. Indicación quirúrgica en discusión.',
      alt: 'Radiografía Tossy III hombro derecho disyunción severa',
    },
  ],
  source: 'Wikimedia Commons — CC0 / CC BY-SA 4.0 (James Heilman MD, Jansenj, Yosi I)',
  layout_position: 'main',
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DAC — GALERÍA RX v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);
console.log(`\nBloque: ${RX_BLOCK.id}`);
console.log(`Imágenes: ${RX_BLOCK.images.length}`);
RX_BLOCK.images.forEach((img, i) => console.log(`  [${i + 1}] ${img.label} — ${img.caption}`));

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

// Leer bloques actuales y agregar el nuevo
const { data, error: fetchErr } = await supabase
  .from('topics')
  .select('content_blocks')
  .eq('id', TOPIC_ID)
  .single();

if (fetchErr) { console.error('❌ Fetch error:', fetchErr.message); process.exit(1); }

// Quitar bloque anterior de RX si existe, luego insertar el nuevo
const existing = (data.content_blocks || []).filter(b => b.id !== RX_BLOCK.id);
const updated  = [...existing, RX_BLOCK].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const { error } = await supabase
  .from('topics')
  .update({ content_blocks: updated, last_updated: new Date().toISOString() })
  .eq('id', TOPIC_ID);

if (error) { console.error('\n❌ Error:', error.message); process.exit(1); }
console.log(`\n✅ Galería de radiografías agregada (${RX_BLOCK.images.length} imágenes).`);
