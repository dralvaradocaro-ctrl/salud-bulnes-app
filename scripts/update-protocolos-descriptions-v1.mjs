/**
 * Pobla la columna `description` (1-2 líneas que aparecen en las cards de Category)
 * para los protocolos locales que no la tenían.
 *
 * Uso:
 *   node scripts/update-protocolos-descriptions-v1.mjs           (dry-run)
 *   node scripts/update-protocolos-descriptions-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Mapeo por protocol_code → descripción corta (máx 130 caracteres)
const DESCRIPTIONS = {
  // Acabados de insertar (batch 2026-05)
  'AOC 1.2':     'Sistema ESI de 5 niveles para priorizar atención en urgencias según riesgo vital, con tiempos máximos de espera.',
  'GCL 3.3.2':   'Precauciones de aislamiento (aérea, gotitas, contacto, cohorte, protector) según vía de transmisión y agente identificado.',
  'RE GCL 2.3':  'Sistema de notificación, análisis y mejora continua para incidentes, eventos adversos y eventos centinela.',
  'API 1.3':     'Requisitos obligatorios de la orden, indicaciones previas y preparación según tipo de examen radiológico.',
  'AOC 2.1':     'Procedimiento de derivación HCSFB → HCHM u otros centros, con coordinación SAMU según tipo de móvil (M1/M2/M3).',
  'HCSFB 121':   'Acompañamiento humanizado del duelo gestacional y perinatal según Ley 21.371 (estrategia EPICE, certificados, permisos laborales).',
  'HCSFB 167':   'Estándares de atención digna, comunicación efectiva y trato humanizado en todas las dependencias del HCSFB.',
  'HCSFB 150':   'Estrategias para garantizar atención preferente a mayores de 60, personas con discapacidad y cuidadores (Ley 21.168).',
  'HCSFB 154':   'Mecanismos de ingreso, recepción y traslado entre servicios, con verificación de documentos y brazalete de identificación.',
  'HCSFB 141':   'Manejo escalonado de la agitación en hospitalizados con escala RASS, opciones VO/IM y dosis máximas por edad.',
  // Locales preexistentes sin description
  'GCL 1.13':    'Manejo del paciente anticoagulado oral en policlínico: ajuste DTS por INR, controles, derivación a PoliTACO HCHM.',
  'HCSFB 139':   'Toracocentesis diagnóstica y terapéutica en sala: indicaciones, técnica paso a paso, materiales y estudios del líquido pleural.',
  'HCSFB 138':   'Flujo operativo HCSFB para atención de patologías GES vía telemedicina: registro Rayen, derivación, seguimiento.',
  'HCSFB 161':   'Programa de Optimización de Antibióticos (PROA): reevaluación a 48-72h, desescalamiento y duración óptima de tratamientos.',
  'HCSFB 166':   'Criterios de ingreso, derivación y egreso en pacientes con diagnóstico de salud mental atendidos en policlínico HCSFB.',
  'HCSFB 160':   'Tamizaje ASQ al ingreso y manejo escalonado del riesgo de autolesiones y conducta suicida en policlínico.',
  'GCL 2.2.2':   'Valoración del riesgo de caídas, medidas reforzadas por turno y registro de eventos adversos asociados.',
  'GCL 2.2.3-A': 'Valoración del riesgo de LPP, prevención por categoría (cambios de posición, colchón, hidratación) y manejo según etapa.',
  'GCL 1.7':     'Doble chequeo de la unidad, monitoreo de la transfusión y manejo de reacciones adversas inmediatas y tardías.',
  'HCSFB 159':   'Manejo escalonado de agitación con escala BARS desde medidas no farmacológicas hasta IV, con derivación a HCHM si refractario.',
  'GCL 2.2.1':   'Detección, notificación y manejo del error de medicación: antídotos, monitoreo y formulario OFICYSP.',
  'HCSFB 151':   'Programa Gonartrosis del HCSFB: indicación, técnica y seguimiento de infiltración de rodilla con corticoides (KOOS-PS, WOMAC).',
  'GCL 1.3':     'Manejo escalonado del dolor agudo postoperatorio en 3 pasos (paracetamol → AINE → opioide) con reevaluación a 30-60 min.',
  'HCSFB 153':   'Indicaciones, dosis máxima (30 comprimidos) y duración (4 semanas) del Clotiazepam con ISRS concomitante para ansiedad.',
  'HCSFB 165':   'Activación y respuesta rápida en 3 niveles ante señales de alerta en pacientes hospitalizados con diagnóstico psiquiátrico.',
  'GCL 1.9':     'Indicación médica, técnica de contención decúbito supino con banda abdominal y 4 extremidades, prevención de aspiración.',
  'HCSFB 129':   'Evaluación con criterios ICSD-2 y Epworth, higiene del sueño primero y manejo farmacológico ajustado por edad.',
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  POBLAR DESCRIPTIONS — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const codes = Object.keys(DESCRIPTIONS);
const { data: topics, error } = await supabase
  .from('topics').select('id, name, protocol_code, description').in('protocol_code', codes);

if (error) { console.error('Fetch:', error.message); process.exit(1); }

let toUpdate = 0, skipped = 0;
const updates = [];
for (const t of topics || []) {
  const newDesc = DESCRIPTIONS[t.protocol_code];
  const cur = (t.description || '').trim();
  if (cur && cur === newDesc) {
    skipped++;
    continue;
  }
  updates.push({ id: t.id, code: t.protocol_code, name: t.name.slice(0, 50), newDesc });
  toUpdate++;
}

console.log(`Encontrados: ${topics?.length || 0}`);
console.log(`A actualizar: ${toUpdate}`);
console.log(`Sin cambios: ${skipped}\n`);

updates.forEach(u => {
  console.log(`  [${u.code}] ${u.name}`);
  console.log(`     → ${u.newDesc.slice(0, 100)}${u.newDesc.length > 100 ? '...' : ''}`);
});

if (!APPLY) {
  console.log('\nModo dry-run. Agregá --apply para escribir.');
  process.exit(0);
}

let ok = 0;
for (const u of updates) {
  const { error: e } = await supabase
    .from('topics').update({ description: u.newDesc }).eq('id', u.id);
  if (e) console.error(`  ❌ ${u.code}: ${e.message}`);
  else   ok++;
}
console.log(`\nActualizados: ${ok}/${updates.length}`);
