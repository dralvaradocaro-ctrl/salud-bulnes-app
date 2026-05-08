/**
 * Elimina emojis de los bloques con contenido clínico en 3 protocolos Hospitalizados.
 * Reemplaza indicadores visuales por separadores ━━━ o texto plano.
 *
 * Uso:  node scripts/update-hospitalizados-clean-v1.mjs
 *       node scripts/update-hospitalizados-clean-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Patches: topicId → { blockId → newItems[] }
const PATCHES = {

  // HCSFB 129 — Hipnóticos
  'eb702967-32fa-4aef-8246-742195d078e8': {
    'hipn-v3-diagnostico': [
      "Frecuencia: ≥ 3 noches por semana",
      "Duración: ≥ 1 mes de persistencia",
      "Síntomas diurnos asociados (al menos uno):",
      "   • Fatiga o malestar general",
      "   • Déficit de atención, concentración o memoria",
      "   • Disfunción social, laboral o académica",
      "   • Irritabilidad o alteraciones del ánimo",
      "   • Somnolencia diurna excesiva",
      "Descartar primero: dolor no controlado, apnea del sueño, síndrome piernas inquietas, depresión, ansiedad, uso de sustancias",
      "Escala de Epworth (somnolencia diurna): 0–9 normal · 10–12 leve · 13–16 moderado · >16 severo",
    ],
    'hipn-v3-seguimiento': [
      "Control a las 6 semanas: evaluación de efectos adversos (sedación diurna, caídas, dependencia)",
      "Control a las 8–12 semanas: reaplicar Escala de Epworth — evaluar eficacia",
      "Duración recomendada del tratamiento:",
      "   • Adultos mayores (≥ 65 años): máximo 3 meses",
      "   • Adultos jóvenes: máximo 6 meses",
      "   • Después: retirada gradual (reducir 25% cada 1–2 semanas)",
      "Signos de alarma para suspender: caídas nocturnas, somnolencia diurna severa, amnesia, dependencia",
      "Derivar a psiquiatría: insomnio crónico (> 6 meses) refractario, comorbilidad psiquiátrica mayor",
    ],
  },

  // GCL 2.2.1 — Error de Medicación
  '23e96a67-0f39-4bfe-91e0-88d63d04c3ae': {
    'errmed-v3-notificacion': [
      "━━━ INMEDIATO (primeros minutos) ━━━",
      "Atender al paciente — evaluar signos vitales y estado clínico",
      "Avisar al médico tratante o de turno",
      "Administrar tratamiento si existe antídoto o acción correctiva",
      "",
      "━━━ DOCUMENTACIÓN (primeras 2 horas) ━━━",
      "Registrar en hoja de enfermería: qué ocurrió, cuándo, cómo",
      "Completar Formulario OfiCySP (Oficina de Calidad y Seguridad del Paciente)",
      "No alterar registros previos ni borrar anotaciones",
      "",
      "━━━ ANÁLISIS (dentro de 72 horas) ━━━",
      "Revisión por jefatura de servicio",
      "Identificación de causa raíz: ¿prescripción? ¿dispensación? ¿administración?",
      "Medidas correctivas inmediatas y preventivas",
      "",
      "El objetivo es el análisis sistémico — no la sanción individual",
    ],
  },

  // GCL 1.9 — Contención Física
  '9e0b3406-9055-43a4-8a75-bf6d290bceb4': {
    'conten-v3-monitoreo': [
      "Temperatura: evaluar hipertermia por agitación o infección",
      "Color de piel bajo sujeciones: palidez o cianosis indica compresión vascular",
      "Sensibilidad: paresia o parestesias bajo bandas → aflojar inmediatamente",
      "Pulso distal: verificar perfusión en extremidades contenidas",
      "Estado de conciencia: nivel de alerta, respuesta a estímulos",
      "",
      "━━━ COMPLICACIONES A VIGILAR ━━━",
      "TEP / TVP: movilizar extremidades libres pasivamente si es posible",
      "LPP: cambiar posición dentro de lo permitido por la contención",
      "Lesiones traumáticas por forcejeo",
      "Hematomas en sitios de sujeción",
      "",
      "Reevaluar necesidad de contención cada 4 horas; retirar tan pronto sea seguro",
    ],
  },
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  HOSPITALIZADOS CLEAN v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

for (const [topicId, blockPatches] of Object.entries(PATCHES)) {
  const { data: topic, error } = await supabase
    .from('topics').select('name, content_blocks').eq('id', topicId).single();

  if (error) { console.error(`❌ Fetch ${topicId}: ${error.message}`); continue; }

  const blocks = topic.content_blocks || [];
  const updated = blocks.map(b => {
    const newItems = blockPatches[b.id];
    if (!newItems) return b;
    return { ...b, items: newItems };
  });

  console.log(`📋 ${topic.name}`);
  Object.keys(blockPatches).forEach(bid => {
    const b = updated.find(x => x.id === bid);
    if (b) console.log(`   + limpio: [${bid}] — ${b.items.length} ítems`);
    else    console.log(`   ⚠️  No encontrado: ${bid}`);
  });
  console.log();

  if (!APPLY) continue;

  const { error: e } = await supabase
    .from('topics').update({ content_blocks: updated }).eq('id', topicId);
  if (e) console.error(`  ❌ Error: ${e.message}`);
  else   console.log(`  ✅ Emojis eliminados.\n`);
}

if (!APPLY) {
  console.log('⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
