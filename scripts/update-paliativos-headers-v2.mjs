/**
 * Revierte el approach v1 y aplica el nuevo:
 * - Quita description del topic
 * - Agrega tags (palabras clave al lado del icono)
 * - Devuelve el bloque protocol_header al inicio con summary (resumen dentro del header)
 * - Quita el bloque text "Fuente" que había puesto en la primera pestaña
 *
 * Uso:  node scripts/update-paliativos-headers-v2.mjs
 *       node scripts/update-paliativos-headers-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const PATCHES = [
  {
    nameLike: '%dolor oncol%',
    tags: ['Dolor', 'Opioides', 'Escalera OMS', 'Coadyuvantes'],
    header: {
      id: 'dolor-onco-header',
      type: 'protocol_header',
      ordinario: 'REFERENCIA CLÍNICA',
      title: 'Evaluación y manejo farmacológico del dolor oncológico',
      institution: 'Pontificia Universidad Católica de Chile',
      department: 'Capítulo en Medicina Paliativa y Cuidados Continuos',
      date: 'Autor: Claudio Fierro',
      summary:
        'Síntesis del capítulo de Claudio Fierro sobre evaluación clínica del dolor oncológico, escalera analgésica de la OMS, AINEs, opioides débiles y potentes, rotación de opioides y fármacos coadyuvantes — adaptado al arsenal HCSFB.',
      order: 1,
    },
    fuenteIdToRemove: 'dolor-onco-fuente',
  },
  {
    nameLike: '%subcut%',
    tags: ['Vía SC', 'Hipodermoclisis', 'Infusión continua', 'Cuidados Paliativos'],
    header: {
      id: 'sc-header',
      type: 'protocol_header',
      ordinario: 'REFERENCIA CLÍNICA',
      title: 'Vía Subcutánea en Cuidados Paliativos',
      institution: 'Pontificia Universidad Católica de Chile',
      department: 'Material docente — Enfermería',
      date: 'Autora: E.U. Paula Ossandón Lira (2020)',
      summary:
        'Síntesis del documento de la E.U. Paula Ossandón Lira sobre administración de fármacos e hidratación por vía subcutánea: indicaciones, técnica, modos de administración, hipodermoclisis y compatibilidad farmacológica — adaptado al arsenal HCSFB.',
      order: 1,
    },
    fuenteIdToRemove: 'sc-fuente',
  },
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  PALIATIVOS HEADERS v2 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const patch of PATCHES) {
  const { data: topics } = await supabase
    .from('topics').select('id, name, description, tags, content_blocks').ilike('name', patch.nameLike);

  if (!topics || topics.length === 0) {
    console.log(`⚠️  No encontrado: ${patch.nameLike}`);
    continue;
  }

  for (const topic of topics) {
    console.log(`📋 ${topic.name} (${topic.id})`);

    let blocks = topic.content_blocks || [];

    // 1. Quitar el bloque "Fuente" si existe
    const fuenteIdx = blocks.findIndex(b => b.id === patch.fuenteIdToRemove);
    if (fuenteIdx !== -1) {
      console.log(`   - Quita bloque cita "${patch.fuenteIdToRemove}"`);
      blocks = blocks.filter((_, i) => i !== fuenteIdx);
    }

    // 2. Reinsertar protocol_header al inicio
    const hasHeader = blocks.some(b => b.type === 'protocol_header');
    if (!hasHeader) {
      console.log(`   + Reinserta protocol_header con summary`);
      blocks = [patch.header, ...blocks];
    }

    const updates = {
      content_blocks: blocks,
      description: null,
      tags: patch.tags,
    };

    console.log(`   ~ description: null`);
    console.log(`   ~ tags: ${JSON.stringify(patch.tags)}`);

    if (!APPLY) { console.log(); continue; }

    const { error } = await supabase.from('topics').update(updates).eq('id', topic.id);
    if (error) console.error(`   ❌ ${error.message}`);
    else       console.log(`   ✅ Actualizado.\n`);
  }
}

if (!APPLY) console.log('\n⚠️  Modo dry-run. Agrega --apply.');
