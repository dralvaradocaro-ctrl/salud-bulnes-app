/**
 * Agrega imagen del procedimiento al protocolo de Toracocentesis (HCSFB 139),
 * pestaña "Técnica". Imagen: diagrama esquemático en español del NIH (CC BY 4.0).
 *
 * Uso:
 *   node scripts/update-toracocentesis-imagen-v1.mjs           (dry-run)
 *   node scripts/update-toracocentesis-imagen-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPIC_ID = 'df8dbe5d-59a0-4447-80a7-3af37319e325';
const BLOCK_ID = 'toraco-v3-imagen-procedimiento';

const IMAGE_BLOCK = {
  id: BLOCK_ID,
  type: 'image_gallery',
  tab: 'Técnica',
  order: 15, // después del flowchart de técnica (~10) y antes de materiales (~20)
  title: 'Diagrama del procedimiento',
  description: 'Esquema anatómico que muestra la inserción de la aguja en el espacio pleural y el drenaje del líquido a una bolsa colectora.',
  images: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Thoracentesis-es.png',
      alt: 'Diagrama de toracocentesis mostrando paciente sentado, inserción de aguja en espacio pleural y drenaje a bolsa colectora',
      caption: 'Toracocentesis — diagrama esquemático del procedimiento',
    },
  ],
  source: 'National Heart, Lung and Blood Institute (NIH). Licencia CC BY 4.0',
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TORACOCENTESIS — agregar imagen — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const { data, error } = await supabase
  .from('topics')
  .select('content_blocks')
  .eq('id', TOPIC_ID)
  .single();

if (error) {
  console.error('Fetch:', error.message);
  process.exit(1);
}

const before = data.content_blocks || [];
const withoutOld = before.filter(b => b.id !== BLOCK_ID);
const merged = [...withoutOld, IMAGE_BLOCK];

console.log(`bloques antes:  ${before.length}`);
console.log(`bloques final:  ${merged.length} (${before.length === merged.length ? 'reemplazo' : 'agregado nuevo'})`);
console.log(`bloque agregado:`);
console.log(`  id:    ${IMAGE_BLOCK.id}`);
console.log(`  tab:   ${IMAGE_BLOCK.tab}`);
console.log(`  type:  ${IMAGE_BLOCK.type}`);
console.log(`  url:   ${IMAGE_BLOCK.images[0].url}`);
console.log('');

if (!APPLY) {
  console.log('Modo dry-run. Agregá --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error: e } = await supabase
  .from('topics')
  .update({ content_blocks: merged, last_updated: new Date().toISOString() })
  .eq('id', TOPIC_ID);

if (e) { console.error('Update:', e.message); process.exit(1); }
console.log('Actualizado.');
