/**
 * Mejora Hipotiroidismo y Demencia (GES con protocolo local):
 *  - Agrega autores reales desde PDFs HCSFB 98 y HCSFB 117
 *  - Demencia: expande síntomas conductuales con fármacos específicos desde PDF
 *    (Metilfenidato, Risperidona, Melatonina, Trazodona + medidas no farmacológicas)
 *  - Hipotiroidismo: solo autores (contenido ya correcto)
 *
 * Uso:  node scripts/update-ges-tiroides-demencia-v3.mjs
 *       node scripts/update-ges-tiroides-demencia-v3.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─── HIPOTIROIDISMO (HCSFB 98) ───────────────────────────────────────────────
const ID_TIRO = '696efcff77924d3a78533dce';

const AUTHORS_TIRO = {
  elaboradores: ['Dra. Micaela Fasani Montagna', 'Dr. Maicol Candia Sandoval'],
  revisores:    ['TM Eva López Ferrada', 'Dr. Felipe Sancho Tapia'],
  aprobadores:  ['Dr. Álvaro Lagos'],
};

// ─── DEMENCIA (HCSFB 117) ────────────────────────────────────────────────────
const ID_DEM = '696ea74c245ef362de4f4338';

const AUTHORS_DEM = {
  elaboradores: ['Dr. Felipe Sancho Tapia', 'Dr. Rodrigo Enríquez Heredia'],
  revisores:    ['Dra. Estefanía Acuña Brevis'],
  aprobadores:  ['Dr. Álvaro Lagos'],
};

// Bloque nuevo para síntomas conductuales — va después del tratamiento farmacológico
const BLOQUE_CONDUCTUALES = {
  id:    'dem-conductuales',
  type:  'flowchart',
  color: 'purple',
  order: 13,
  title: 'Síntomas Psicológicos y Conductuales — Manejo HCSFB',
  content: 'Ningún fármaco tiene evidencia alta — preferir medidas no farmacológicas primero; farmacológico solo si falla',
  details: [
    '━━━ MEDIDAS NO FARMACOLÓGICAS (primera línea) ━━━',
    'Higiene del sueño y rutinas fijas de actividad',
    'Adaptaciones ambientales: reducir estímulos, aumentar iluminación diurna',
    'Estrategias tranquilizantes: música, reminiscencia, contacto afectivo',
    'Evitar desencadenantes conocidos (ruido, cambios de entorno)',
    'Seguridad para deambular · Prevención de caídas',
    '',
    '━━━ TRATAMIENTO FARMACOLÓGICO (si medidas no farmacológicas fallan) ━━━',
    'Apatía → Metilfenidato 10 mg/día VO',
    'Agitación verbal o física → Sertralina 50–200 mg · Citalopram 20 mg · Escitalopram 10 mg',
    '~ Si agitación severa: Risperidona 1–3 mg VO · usar mínima dosis efectiva',
    'Trastorno del sueño → Melatonina 3 mg (disminuye despertares) · Trazodona 100 mg (mejora horas totales)',
    '~ No usar benzodiacepinas en demencia',
    'Depresión asociada → ISRS (Sertralina, Escitalopram) · evitar ATC por efecto anticolinérgico',
    '',
    '━━━ SÍNTOMAS A EVALUAR EN CADA CONTROL ━━━',
    'Psicológicos: apatía, ansiedad, ánimo bajo, delirios, identificaciones erróneas',
    'Conductuales: vagabundeo, resistencia a cuidados, conductas sexuales inapropiadas',
  ],
  layout_position: 'main',
};

// Bloque actualizado "Tratamiento Farmacológico" con nota de suspensión de Donepezilo
const BLOQUE_TRATAMIENTO_FARMACO = {
  id:    'dem-trat-farm',
  type:  'flowchart',
  color: 'blue',
  order: 12,
  title: 'Tratamiento Farmacológico — Protocolo Local HCSFB',
  content: 'Iniciar siempre con consentimiento informado · idealmente con indicación de especialidad',
  details: [
    '━━━ DEMENCIA LEVE-MODERADA (GDS 4–5) ━━━',
    'Donepezilo (primera línea oral)',
    '~ Inicio: 5 mg/noche × 4 semanas',
    '~ Mantención: subir a 10 mg/noche',
    '~ Si no hay mejoría de síntomas: suspender en el siguiente control anual',
    'Rivastigmina cápsulas',
    '~ Inicio: 1.5 mg c/12h',
    '~ Titular cada 2 semanas hasta 6 mg c/12h',
    'Rivastigmina parche (mejor tolerancia GI)',
    '~ Inicio: 4.6 mg/24h × 4 semanas',
    '~ Mantención: 9.5 mg/24h',
    '━━━ DEMENCIA MODERADA-SEVERA (GDS 6–7) o intolerancia a IAChE ━━━',
    'Memantina',
    '~ Inicio: 5 mg/día semana 1',
    '~ Titular +5 mg/semana hasta máximo 20 mg/día',
    'Combinación Donepezilo + Memantina: puede indicarse en GDS 5–6',
    '━━━ SEGUIMIENTO ━━━',
    'Control a las 4 semanas tras inicio de fármaco',
    'Luego control cada 3–6 meses',
    'Plazo inicio tratamiento: ≤ 30 días desde confirmación diagnóstica (garantía GES)',
  ],
  layout_position: 'main',
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TIROIDES & DEMENCIA v3 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

// --- HIPOTIROIDISMO: solo autores ---
{
  const { data, error } = await supabase
    .from('topics').select('authors').eq('id', ID_TIRO).single();
  if (error) { console.error('❌ Fetch hipotiroidismo:', error.message); }
  else {
    console.log('📋 Hipotiroidismo (HCSFB 98)');
    console.log('   Autores actuales:', JSON.stringify(data.authors));
    console.log('   Autores nuevos:  ', JSON.stringify(AUTHORS_TIRO));
    console.log('   Bloques: sin cambio (contenido ya correcto)\n');
    if (APPLY) {
      const { error: e } = await supabase
        .from('topics').update({ authors: AUTHORS_TIRO }).eq('id', ID_TIRO);
      if (e) console.error('  ❌', e.message);
      else   console.log('  ✅ Autores actualizados.\n');
    }
  }
}

// --- DEMENCIA: autores + reemplazar bloques conductuales ---
{
  const { data, error } = await supabase
    .from('topics').select('content_blocks, authors').eq('id', ID_DEM).single();
  if (error) { console.error('❌ Fetch demencia:', error.message); }
  else {
    // Reemplazar el bloque de tratamiento farmacológico y agregar conductuales
    const otherBlocks = (data.content_blocks || []).filter(
      b => !['dem-trat-farm', 'dem-conductuales'].includes(b.id) &&
           b.title !== 'Tratamiento Farmacológico — Protocolo Local HCSFB'
    );
    const newBlocks = [...otherBlocks, BLOQUE_TRATAMIENTO_FARMACO, BLOQUE_CONDUCTUALES]
      .sort((a, b) => (a.order || 99) - (b.order || 99));

    console.log('📋 Demencia (HCSFB 117)');
    console.log('   Autores actuales:', JSON.stringify(data.authors));
    console.log('   Autores nuevos:  ', JSON.stringify(AUTHORS_DEM));
    console.log(`   Bloques: ${data.content_blocks.length} → ${newBlocks.length}`);
    console.log('   Cambios:');
    console.log('     - Reemplaza bloque Tratamiento Farmacológico (agrega nota suspensión Donepezilo)');
    console.log('     - Agrega bloque Síntomas Conductuales con fármacos específicos del PDF');
    console.log('       (Metilfenidato, Risperidona, Melatonina, Trazodona)\n');

    if (APPLY) {
      const { error: e } = await supabase
        .from('topics').update({ content_blocks: newBlocks, authors: AUTHORS_DEM }).eq('id', ID_DEM);
      if (e) console.error('  ❌', e.message);
      else   console.log('  ✅ Demencia actualizada.\n');
    }
  }
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
