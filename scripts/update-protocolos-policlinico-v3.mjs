/**
 * v3 — Enriquece protocolos de Policlínico con contenido completo extraído de PDFs reales.
 * Incluye criterios de inclusión/exclusión, tablas de fármacos y algoritmos Mermaid.
 *
 * Uso:  node scripts/update-protocolos-policlinico-v3.mjs
 *       node scripts/update-protocolos-policlinico-v3.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─────────────────────────────────────────────────────────────────────────────
// CLOTIAZEPAM — HCSFB 153
// ─────────────────────────────────────────────────────────────────────────────
const CLOTIAZEPAM = {
  id: 'ef1502b6-2c86-455a-8f38-e90e355e7d9e',
  authors: [
    { name: 'Dr. Rodrigo Enríquez Heredia',     role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
    { name: 'Dra. Daniella Sbarbaro Arias',     role: 'Elaboradora — Médico PROSAM HCSFB' },
    { name: 'Dr. Guillermo Beltrán Carrasco',   role: 'Elaborador — Médico HCSFB' },
    { name: 'Dra. Micaela Fasani Montagna',     role: 'Revisora — Subdirectora Médica HCSFB' },
    { name: 'QF. Mauricio Fuentes Baltierra',   role: 'Aprobador — Químico Farmacéutico HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
  ],
  blocks: [
    {
      id: 'clotia-v3-indicaciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Criterios de Inclusión — ¿Cuándo indicar Clotiazepam?',
      content: 'Solo indicar Clotiazepam en diagnósticos CIE-10 específicos — no usar como hipnótico ni en depresión aislada',
      items: [
        '✅ F41.9 — Trastorno de ansiedad no especificado',
        '✅ F41.1 — Trastorno de ansiedad generalizada (TAG)',
        '✅ F41.0 — Trastorno de pánico (sin agorafobia)',
        '✅ F40.x — Trastornos fóbicos (agorafobia, fobia social, fobia específica)',
        '',
        '📋 CONDICIÓN OBLIGATORIA: iniciar ISRS concomitantemente al Clotiazepam',
        '• Sertralina 50 mg/día (primera línea)',
        '• Fluoxetina 20 mg/día',
        '• Escitalopram 10 mg/día',
        '• El ISRS es el tratamiento definitivo; el Clotiazepam cubre el período de latencia inicial (2–4 semanas)',
      ],
      layout_position: 'main',
    },
    {
      id: 'clotia-v3-exclusiones',
      type: 'criteria',
      color: 'red',
      order: 2,
      title: 'Criterios de Exclusión — Contraindicaciones Absolutas',
      content: 'No indicar Clotiazepam si cualquiera de estos factores está presente',
      items: [
        '🚫 Trastorno del sueño como diagnóstico principal (usar hipnótico específico)',
        '🚫 Uso crónico de benzodiazepinas (riesgo de síndrome de abstinencia y adición)',
        '🚫 Trastorno por abuso de sustancias activo (alcohol, drogas)',
        '🚫 Embarazo o lactancia',
        '🚫 Miastenia gravis',
        '🚫 Insuficiencia hepática severa',
        '🚫 Apnea del sueño no tratada',
      ],
      layout_position: 'main',
    },
    {
      id: 'clotia-v3-protocolo',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Protocolo de Prescripción — Reglas del HCSFB',
      content: 'Normativa interna HCSFB para el control y entrega de Clotiazepam — seguimiento estricto por QF',
      details: [
        '1. PRESCRIPCIÓN: médico HCSFB en receta retenida (benzodiazepina)',
        '2. DOSIS HABITUAL: Clotiazepam 5–10 mg c/8–12h según severidad',
        '3. LÍMITE: máximo 30 comprimidos por mes (1 comprimido/día equivalente)',
        '4. DURACIÓN: máximo 2–4 semanas — NO renovar sin nueva consulta médica presencial',
        '5. QUÍMICA FARMACÉUTICA: autoriza la entrega y supervisa cumplimiento del límite',
        '6. NO renovación automática: cada entrega requiere nueva evaluación médica',
        '7. RETIRO GRADUAL al término: reducir 25% cada semana para evitar síndrome de abstinencia',
        '',
        '📌 El ISRS debe mantenerse al menos 6–12 meses después de suspender el Clotiazepam',
        '📌 Si el paciente requiere más de 4 semanas → derivar a PROSAM o psiquiatría',
      ],
      layout_position: 'main',
    },
    {
      id: 'clotia-v3-seguimiento',
      type: 'criteria',
      color: 'green',
      order: 4,
      title: 'Seguimiento y Plan de Retiro',
      content: 'Cronograma de control durante el tratamiento con Clotiazepam',
      items: [
        '⏱ Control en 2 semanas: evaluar respuesta al ISRS y tolerabilidad del Clotiazepam',
        '⏱ Control en 4 semanas: decidir continuidad o retiro gradual del Clotiazepam',
        '📋 Pauta de retiro gradual (cuando corresponda):',
        '   Semana 1: reducir 25% de la dosis',
        '   Semana 2: reducir otro 25%',
        '   Semana 3: días alternos',
        '   Semana 4: suspender',
        '⚠️ Signos de abstinencia: ansiedad rebote, insomnio, irritabilidad, sudoración — retornar a dosis previa y retirar más lento',
        '🎯 El ISRS continúa al menos 6 meses adicionales tras suspender el Clotiazepam',
      ],
      layout_position: 'main',
    },
    {
      id: 'clotia-v3-mermaid',
      type: 'mermaid',
      order: 5,
      title: 'Algoritmo HCSFB 153 — Uso de Clotiazepam en Ansiedad',
      content: `flowchart TD
    A([Paciente con\\ntrastorno de ansiedad]) --> B[Evaluar diagnóstico CIE-10\\ny criterios de exclusión]
    B --> C{¿Criterio\\nde exclusión?}
    C -->|Sí| D([Manejo alternativo\\nno Clotiazepam])
    C -->|No| E{¿Diagnóstico\\nCIE-10 incluido?}
    E -->|No| D
    E -->|Sí F41.0/F41.1/F41.9/F40| F[Iniciar ISRS:\\nSertralina 50 mg/día]
    F --> G[Clotiazepam 5–10 mg c/8–12h\\nmáx 30 cp/mes · máx 4 semanas]
    G --> H[QF autoriza entrega\\nRegistrar en sistema]
    H --> I[Control en 2 semanas]
    I --> J{¿Respuesta\\aal ISRS?}
    J -->|Sí — ISRS eficaz| K[Retiro gradual Clotiazepam\\n25% por semana]
    J -->|No aún — < 4 sem| L[Continuar hasta 4 semanas\\nnueva evaluación médica obligatoria]
    L --> M{¿> 4 semanas\\nsin respuesta?}
    M -->|Sí| N([Derivar PROSAM\\no Psiquiatría])
    M -->|No| K
    K --> O([Mantener ISRS\\n6–12 meses adicionales])`,
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function updateTopic(topicId, authors, blocks, label) {
  const { data: current, error: fetchErr } = await supabase
    .from('topics')
    .select('content_blocks, name')
    .eq('id', topicId)
    .single();

  if (fetchErr) {
    console.error(`❌ ${label}: fetch error — ${fetchErr.message}`);
    return false;
  }

  console.log(`\n📋 ${label} — "${current.name}"`);
  console.log(`   Bloques actuales: ${(current.content_blocks || []).length}`);
  console.log(`   Bloques nuevos: ${blocks.length}`);

  if (!APPLY) return true;

  const { error } = await supabase
    .from('topics')
    .update({
      protocol_authors: authors,
      content_blocks:   blocks,
      last_updated:     new Date().toISOString(),
    })
    .eq('id', topicId);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }

  console.log(`   ✅ Actualizado correctamente`);
  return true;
}

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  POLICLÍNICO v3 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);

await updateTopic(CLOTIAZEPAM.id, CLOTIAZEPAM.authors, CLOTIAZEPAM.blocks, 'CLOTIAZEPAM (HCSFB 153)');

if (!APPLY) {
  console.log('\n\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
} else {
  console.log('\n\n✅ Protocolos de Policlínico actualizados (v3).');
}
