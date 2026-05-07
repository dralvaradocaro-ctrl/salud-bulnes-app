/**
 * Limpia la estructura de bloques en Supabase:
 * - Elimina emojis del contenido
 * - Reemplaza '• ' al inicio de ítems criteria (el dot ya es el bullet visual)
 * - Convierte bloques flowchart con tablas ASCII a estructura limpia
 * - Corrige dem-v2-farmacos y dem-v2-derivacion (screenshot del usuario)
 *
 * Uso:  node scripts/fix-data-estructura-bloques.mjs
 *       node scripts/fix-data-estructura-bloques.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Elimina emojis y • redundantes del texto
function cleanText(s) {
  if (!s) return s;
  return s
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')   // emojis multicodigo
    .replace(/[☀-⛿]/gu, '')           // misceláneos
    .replace(/[✀-➿]/gu, '')           // dingbats
    .replace(/⚠️|✅|❌|🏥|📋|📞|📄|⏱|🚨|🚫|🎯|📌|🧠|🔺|🆕|⚡|💓|👀|✋|🌡|🩺|🤢|😖|🫁|🔎/g, '')
    .replace(/^\s*•\s+/, '')                    // bullet al inicio de ítem
    .trim();
}

function cleanItems(items) {
  return (items || [])
    .map(cleanText)
    .filter(s => s !== null && s !== undefined);
}

function cleanDetails(details) {
  return (details || []).map(cleanText);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMENCIA GES (696ea74c245ef362de4f4338) — bloques v2 ya aplicados
// ─────────────────────────────────────────────────────────────────────────────
const DEMENCIA_ID = '696ea74c245ef362de4f4338';

const DEM_FARMACOS_FIXED = {
  id: 'dem-v2-farmacos',
  type: 'flowchart',
  color: 'green',
  order: 23,
  local_protocol: true,
  title: 'Tratamiento Farmacológico — Protocolo Local HCSFB',
  content: 'Fármacos disponibles, dosis de inicio y titulación según severidad (GDS 4–7)',
  details: [
    '━━━ DEMENCIA LEVE-MODERADA (GDS 4–5) ━━━',
    'Donepezilo (primera línea oral)\n~Inicio: 5 mg/noche × 4 semanas\n~Mantención: subir a 10 mg/noche',
    'Rivastigmina cápsulas\n~Inicio: 1.5 mg c/12h\n~Titular cada 2 semanas hasta 6 mg c/12h',
    'Rivastigmina parche (mejor tolerancia)\n~Inicio: 4.6 mg/24h × 4 semanas\n~Mantención: 9.5 mg/24h',
    '━━━ DEMENCIA MODERADA-SEVERA (GDS 6–7) o intolerancia a IAChE ━━━',
    'Memantina\n~Inicio: 5 mg/día semana 1\n~Titular +5 mg/semana hasta máximo 20 mg/día',
    'Combinación Donepezilo + Memantina\n~Puede indicarse en GDS 5–6',
    '━━━ SÍNTOMAS CONDUCTUALES Y DEPRESIÓN ASOCIADA ━━━',
    'Síntomas conductuales: preferir medidas no farmacológicas; antipsicóticos solo en forma puntual',
    'Depresión asociada: ISRS (Sertralina 50 mg, Citalopram 20 mg) — evitar ATC por efecto anticolinérgico',
    'Control farmacológico: 4 semanas tras inicio; luego cada 3–6 meses',
  ],
  layout_position: 'main',
};

const DEM_DERIVACION_FIXED = {
  id: 'dem-v2-derivacion',
  type: 'criteria',
  color: 'red',
  order: 24,
  local_protocol: true,
  title: 'Criterios de Derivación a Neurología — HCSFB a HHM',
  content: 'Cuándo derivar, adónde y cómo gestionar la derivación según protocolo local',
  items: [
    'Destino: Neurología del Hospital Herminda Martín (HHM), Chillán',
    'Vía: Interconsulta por Teleprocesos MINSAL (sistema electrónico HCSFB)',
    'Adjuntar: Resumen clínico + resultados de batería de exámenes + puntaje GDS',
    'Plazo: dentro de la garantía GES (plazo desde confirmación diagnóstica)',
    '━━━ INDICACIONES DE DERIVACIÓN ━━━',
    'Diagnóstico incierto o presentación atípica (demencia frontotemporal, Lewy body, vascular)',
    'Edad de inicio menor a 65 años (demencia precoz)',
    'Deterioro cognitivo rápido (menos de 6 meses) — descartar causa orgánica urgente',
    'Síntomas conductuales severos refractarios a tratamiento local',
    'Necesidad de neuroimagen avanzada (RM cerebral con contraste)',
    'Evaluación neuropsicológica formal especializada',
    'Sin respuesta a tratamiento farmacológico tras 6 meses',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// HIPNÓTICOS (eb702967) — bloque con tabla ASCII → criteria por grupos
// ─────────────────────────────────────────────────────────────────────────────
const HIPNOTICOS_ID = 'eb702967-32fa-4aef-8246-742195d078e8';

const HIPN_ZDRUGS_FIXED = {
  id: 'hipn-v3-zdrugs',
  type: 'criteria',
  color: 'amber',
  order: 3,
  title: 'Fármacos Z-drugs — Primera Línea Farmacológica',
  content: 'Hipnóticos no benzodiacepínicos — preferir sobre BZD por menor dependencia y mejor perfil de seguridad en adultos',
  items: [
    '━━━ FÁRMACOS Z-DRUGS ━━━',
    'Zolpidem 5–10 mg — vida media 2.5h — indicado para dificultad al inicio del sueño',
    'Zolpidem ER 6.25–12.5 mg — vida media 2.8h — inicio y mantención del sueño',
    'Eszopiclona 1–3 mg — vida media 6h — preferir para problemas de mantención',
    'Zopiclona 3.75–7.5 mg — vida media 3.5–6h — inicio y mantención del sueño',
    '━━━ PRECAUCIONES ━━━',
    'Adultos mayores: usar dosis mínima (Zolpidem 5 mg o Zopiclona 3.75 mg)',
    'Duración máxima: 3 meses en adultos mayores, 6 meses en adultos jóvenes',
    'Retirada gradual: reducir 25% cada 1–2 semanas para evitar rebote',
  ],
  layout_position: 'main',
};

const HIPN_OTROS_FIXED = {
  id: 'hipn-v3-otros',
  type: 'flowchart',
  color: 'purple',
  order: 4,
  title: 'Otros Hipnóticos — Según Causa Subyacente',
  content: 'Alternativas cuando hay comorbilidades específicas o contraindicación a Z-drugs',
  details: [
    '━━━ ANTIDEPRESIVOS — depresión, ansiedad o dolor crónico ━━━',
    'Amitriptilina 50–100 mg/noche\n~Indicación: insomnio + dolor crónico o neuropático',
    'Trazodona 25–150 mg/noche\n~Indicación: primera línea si coexiste depresión',
    'Mirtazapina 7.5–30 mg/noche\n~Indicación: depresión + anorexia o pérdida de peso',
    '━━━ ANTICONVULSIVANTES — fibromialgia o dolor neuropático ━━━',
    'Pregabalina 75–300 mg/noche',
    'Gabapentina 300–900 mg/noche',
    '━━━ MELATONINA — alteración del ritmo circadiano ━━━',
    'Melatonina 1–3 mg — administrar 30–60 min antes de dormir\n~Indicaciones: turnos nocturnos, jet lag, adultos mayores de 55 años',
    '━━━ ANTIPSICÓTICOS — insomnio en contexto psiquiátrico ━━━',
    'Quetiapina 25–250 mg/noche',
    'Olanzapina 2.5–20 mg/noche',
    '━━━ BENZODIACEPINAS — evitar en adultos mayores ━━━',
    'Midazolam 7.5–15 mg/noche — vida media 2.2–6.8h\n~Riesgo: caídas, dependencia, deterioro cognitivo en adultos mayores',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// AGITACIÓN (13e6128f) — escalones con secciones y pediátrico
// ─────────────────────────────────────────────────────────────────────────────
const AGITACION_ID = '13e6128f-882a-4a19-8e18-47cbf13203eb';

const AGIT_ESCALONES_FIXED = {
  id: 'agit-v3-escalon-adultos',
  type: 'flowchart',
  color: 'amber',
  order: 3,
  title: 'Escalones 2–4 — Tratamiento Farmacológico Adultos',
  content: 'Protocolo escalonado según nivel BARS — esperar respuesta entre escalones antes de avanzar',
  details: [
    '━━━ ESCALÓN 2 — BARS 5-6 · Oral o Sublingual ━━━',
    'Sin psicosis: Lorazepam 1–2 mg sublingual u oral\n~Esperar 15 min antes de avanzar',
    'Con psicosis: Haloperidol 1–5 mg oral / Risperidona 1–3 mg oral / Olanzapina 10 mg oral o sublingual',
    '━━━ ESCALÓN 3 — BARS 6-7 refractario · Intramuscular ━━━',
    'Sin psicosis: Lorazepam 2 mg IM + Midazolam 5 mg IM\n~Esperar 20–30 min antes de avanzar',
    'Con psicosis: Haloperidol 5 mg IM / Olanzapina 10 mg IM / Droperidol 2.5–10 mg IM\n~No combinar Olanzapina IM + BZD IM (riesgo de depresión respiratoria)',
    '━━━ ESCALÓN 4 — BARS 7 severo · Intravenoso ━━━',
    'Opción A: Lorazepam 4 mg IV + Haloperidol 5 mg IV',
    'Opción B: Midazolam 10–15 mg EV + Haloperidol 5 mg EV',
    'Opción C: Droperidol 5 mg EV',
    'UCI disponible: Dexmedetomidina 1 mcg/kg en bolus de 10 min → infusión 0.5–1.2 mcg/kg/hr',
    '━━━ DESESCALADA ━━━',
    'Una vez BARS 4: retorno progresivo a vía oral según tolerancia\n~Monitorizar BARS cada 30 min hasta estabilización',
  ],
  layout_position: 'main',
};

const AGIT_PEDIATRICO_FIXED = {
  id: 'agit-v3-pediatrico',
  type: 'criteria',
  color: 'purple',
  order: 4,
  title: 'Tratamiento Farmacológico Pediátrico',
  content: 'Dosis basadas en peso para pacientes menores de 18 años — siempre priorizar manejo verbal y contención parental primero',
  items: [
    '━━━ ESCALÓN 2 — ORAL ━━━',
    'Lorazepam: 0.05–0.1 mg/kg oral (máx 2 mg/dosis)',
    'Risperidona: 0.25–2 mg oral según edad y peso',
    'Haloperidol: 0.05–0.15 mg/kg oral',
    'Midazolam: 0.25–0.5 mg/kg oral (máx 20 mg)',
    '━━━ ESCALÓN 3 — INTRAMUSCULAR ━━━',
    'Lorazepam: 0.05–0.1 mg/kg IM (mayores de 12 años: máx 10 mg/día)',
    'Midazolam: 0.1–0.15 mg/kg IM (máx 10 mg)',
    'Haloperidol: 0.05–0.15 mg/kg IM',
    '━━━ PRECAUCIONES ━━━',
    'Monitorizar saturación, FC y FR durante todo el procedimiento',
    'Tener BVM disponible si se usa BZD IM combinado con antipsicótico',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTENCIÓN FÍSICA (9e0b3406) — indicaciones/contraindicaciones con emojis
// ─────────────────────────────────────────────────────────────────────────────
const CONTENCION_ID = '9e0b3406-9055-43a4-8a75-bf6d290bceb4';

const CONTEN_IND_FIXED = {
  id: 'conten-v3-indicaciones',
  type: 'criteria',
  color: 'amber',
  order: 1,
  title: 'Indicaciones y Contraindicaciones de Contención Física',
  content: 'La contención física es una medida de último recurso — solo cuando el riesgo es inminente y la farmacología no fue suficiente',
  items: [
    '━━━ INDICACIONES (requiere indicación médica escrita) ━━━',
    'Conducta violenta con riesgo inmediato para sí mismo o para terceros',
    'Agitación no controlable con tratamiento farmacológico máximo',
    'Riesgo de retiro de dispositivos vitales (TET, CVC, sonda nasoyeyunal)',
    'Contención temporal para administrar medicamento urgente necesario',
    'Antecedente de pérdida de equilibrio o caídas con riesgo de daño',
    '━━━ CONTRAINDICACIONES ABSOLUTAS ━━━',
    'Como castigo o medida disciplinaria',
    'Como respuesta a conducta simplemente molesta para el equipo',
    'Como sustitución de vigilancia o tratamiento en curso',
    'Por conveniencia del equipo clínico',
    'Cuando existe rechazo explícito de tratamiento (evaluar capacidad del paciente)',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MEDICACIÓN (23e96a67) — 5 correctos con emojis
// ─────────────────────────────────────────────────────────────────────────────
const ERRMED_ID = '23e96a67-0f39-4bfe-91e0-88d63d04c3ae';

const ERRMED_5CORRECTOS_FIXED = {
  id: 'errmed-v3-5correctos',
  type: 'criteria',
  color: 'blue',
  order: 1,
  title: 'Los 5 Correctos — Verificación antes de Cada Administración',
  content: 'Verificar los 5 correctos antes de administrar cualquier medicamento — sin excepción',
  items: [
    'Medicamento correcto — confirmar nombre genérico y comercial',
    'Paciente correcto — verificar nombre completo y RUT en brazalete',
    'Dosis correcta — confirmar dosis en indicación médica vs. etiqueta',
    'Vía correcta — oral, IM, IV, SC, SL — según indicación',
    'Hora correcta — tolerancia de más/menos 60 minutos',
    '━━━ MEDICAMENTOS DE ALTO RIESGO — doble verificación obligatoria ━━━',
    'Insulina — Heparina — Warfarina — Digoxina — KCl — Opioides — Quimioterapia',
    'Verificar siempre con un segundo profesional antes de administrar',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// CAÍDAS (c97b6632) — escala Dowton con tabla ASCII
// ─────────────────────────────────────────────────────────────────────────────
const CAIDAS_ID = 'c97b6632-904c-4e9c-ba80-defb5b1199d9';

const CAIDAS_DOWTON_FIXED = {
  id: 'caidas-v3-dowton',
  type: 'flowchart',
  color: 'amber',
  order: 1,
  title: 'Escala de Dowton — Evaluación de Riesgo de Caída',
  content: 'Aplicar al ingreso y reevaluar diariamente — puntaje igual o mayor a 3 indica ALTO RIESGO',
  details: [
    '━━━ FACTORES DE RIESGO (1 punto por factor presente) ━━━',
    'Caídas previas (por anamnesis)',
    '━━━ MEDICAMENTOS (1 punto por cada tipo que use el paciente) ━━━',
    'Sedantes o hipnóticos',
    'Diuréticos',
    'Antihipertensivos (excluyendo diuréticos)',
    'Antiparkinsonianos',
    'Antidepresivos o antipsicóticos',
    '━━━ DÉFICITS SENSORIALES (1 punto por cada uno) ━━━',
    'Déficit visual significativo',
    'Déficit auditivo significativo',
    'Déficit motor (paresia, ataxia, amputación)',
    '━━━ OTROS FACTORES ━━━',
    'Confusión o desorientación',
    'Marcha insegura o inestable',
    '━━━ EXCEPCIONES — siempre alto riesgo independiente del puntaje ━━━',
    'Paciente bajo sedación o anestesia',
    'Uso de medicamentos del SNC en adultos mayores',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// PREVENCIÓN SUICIDIO (c0aecd59) — manejo con emojis
// ─────────────────────────────────────────────────────────────────────────────
const PREVSUIC_ID = 'c0aecd59-f807-4c2e-af91-408d5f5928b3';

const PREVSUIC_MANEJO_FIXED = {
  id: 'prevsuic-v3-manejo',
  type: 'criteria',
  color: 'amber',
  order: 2,
  title: 'Manejo según Resultado ASQ',
  content: 'Tres vías de respuesta según el resultado del cuestionario ASQ — aplicar inmediatamente',
  items: [
    '━━━ VÍA 1 — Ninguna respuesta positiva (P1 a P4 todas NO) ━━━',
    'Sin precauciones adicionales',
    'Alta segura cuando corresponda clínicamente',
    '━━━ VÍA 2 — Una o más positivas + P5 = NO (sin ideación actual) ━━━',
    'Evaluación por dupla psicosocial (psicólogo + asistente social) antes del alta',
    'Eventual derivación a PROSAM al alta',
    'Registrar evaluación en ficha clínica',
    '━━━ VÍA 3 — Una o más positivas + P5 = SÍ (ideación activa) ━━━',
    'Trasladar al paciente a sala frente al mesón de enfermería (supervisión visual continua)',
    'Retirar objetos potencialmente peligrosos del entorno (cinturones, cables, objetos cortantes)',
    'Evaluación urgente por dupla psicosocial',
    'Hospitalización hasta cese de ideación',
    'Derivación a PROSAM al alta',
    'Informar al médico tratante',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// CRITERIOS SM (fa57bf50) — derivación con emojis
// ─────────────────────────────────────────────────────────────────────────────
const CRITSM_ID = 'fa57bf50-f39c-4438-af5e-bfa33be36fce';

const CRITSM_TRASLADO_FIXED = {
  id: 'critsm-v3-traslado',
  type: 'criteria',
  color: 'red',
  order: 2,
  title: 'Criterios de Traslado a HCHM — Psiquiatría',
  content: 'Cuando los recursos de hospital básico son insuficientes — gestionar con internista de HCHM antes del traslado',
  items: [
    'Intento suicida de alta letalidad que requiere UCI o UPC',
    'Catatonía (requiere diagnóstico diferencial y tratamiento especializado)',
    'Manía o hipomanía severa sin respuesta a tratamiento inicial',
    'Primera psicosis sin diagnóstico previo (requiere evaluación especializada completa)',
    'Agitación incontrolable con los recursos farmacológicos y de personal disponibles en HCSFB',
    '━━━ GESTIÓN ━━━',
    'Llamar a Internista HCHM para interconsulta urgente',
    'Traslado en ambulancia con acompañamiento médico',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// DOLOR (66086cdd) — efectos adversos con emojis
// ─────────────────────────────────────────────────────────────────────────────
const DOLOR_ID = '66086cdd-cd73-46ca-87da-245fdb2f4e32';

const DOLOR_ADVERSOS_FIXED = {
  id: 'dolor-v3-adversos',
  type: 'criteria',
  color: 'red',
  order: 4,
  title: 'Manejo de Efectos Adversos de Opioides',
  content: 'Tratamiento específico para cada efecto adverso — evaluar antes de suspender el opioide',
  items: [
    '━━━ NÁUSEAS Y VÓMITOS ━━━',
    'Ondansetrón 4–8 mg IV (primera línea)',
    'Droperidol 1.25 mg IV',
    'Metoclopramida 10 mg IV',
    'Dexametasona 4–8 mg IV (tiene también efecto analgésico adyuvante)',
    '━━━ PRURITO (frecuente con morfina epidural) ━━━',
    'Clorfenamina 4 mg IV',
    'Naloxona 40 mcg IV en dosis baja (no revierte la analgesia)',
    '━━━ DEPRESIÓN RESPIRATORIA — FR menor a 12/min o Ramsay mayor a 3 ━━━',
    'Naloxona 80 mcg IV — repetir cada 2–3 min si no hay respuesta',
    'Suspender infusión de opioide inmediatamente',
    'BVM disponible en cama del postoperado',
    'Llamar al médico de urgencias si no responde',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// TORACOCENTESIS (df8dbe5d) — tabla LP con pipes → criteria limpio
// ─────────────────────────────────────────────────────────────────────────────
const TORACO_ID = 'df8dbe5d-59a0-4447-80a7-3af37319e325';

const TORACO_ESTUDIOS_FIXED = {
  id: 'toraco-v3-estudios',
  type: 'criteria',
  color: 'amber',
  order: 4,
  title: 'Estudios del Líquido Pleural — Todos se Envían a HCHM',
  content: 'Enviar muestras correctamente etiquetadas a laboratorio HCHM — los plazos son de entrega de resultados desde el envío',
  items: [
    '━━━ ESTUDIOS DE RUTINA ━━━',
    'Citoquímico: resultado en 24 h — tubo tapa lila',
    'Proteínas + LDH (Criterios de Light): resultado en 24 h — tubo tapa amarilla',
    '━━━ ESTUDIOS POR SOSPECHA ESPECÍFICA ━━━',
    'ADA: sospecha TBC — resultado en 3 días — tubo tapa amarilla',
    'XpertMTB/RIF: confirmación TBC — resultado en 24 h — recolectar 60 mL en frasco estéril',
    'Microbiología + cultivo y sensibilidad: sospecha empiema — resultado en 48–72 h — frascos de hemocultivo',
    'Cultivo de hongos: paciente inmunodeprimido — resultado en hasta 15 días — frasco estéril',
    'Citología oncológica: sospecha neoplasia — resultado en 5–7 días — tubo tapa amarilla',
    '━━━ CRITERIOS DE LIGHT (exudado si cumple al menos uno) ━━━',
    'Proteínas LP / proteínas suero mayor a 0.5',
    'LDH LP / LDH suero mayor a 0.6',
    'LDH LP mayor a 2/3 del límite normal del laboratorio',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPUESTA RÁPIDA MQ (099cba54) — niveles con emojis
// ─────────────────────────────────────────────────────────────────────────────
const RRMQ_ID = '099cba54-aec4-4d2b-9760-64b5302fe77e';

const RRMQ_NIVELES_FIXED = {
  id: 'rrmq-v3-niveles',
  type: 'flowchart',
  color: 'blue',
  order: 2,
  title: 'Niveles de Respuesta — Protocolo Escalonado',
  content: 'Respuesta proporcional al nivel de agitación — iniciar siempre en el nivel más bajo que corresponda',
  details: [
    '━━━ NIVEL 1 — Alerta leve (señales de alerta sin agitación activa) ━━━',
    'Intervención verbal: identificarse, hablar con calma, preguntar qué necesita',
    'Reducir estímulos: bajar luz, pedir silencio, limitar visitas temporalmente',
    'Contención emocional: validar emociones sin reforzar conducta inapropiada',
    'Reevaluación médica y ajuste de farmacología si corresponde',
    'Ofrecer medicamento SOS oral (ansiolítico o antipsicótico según indicación vigente)',
    '━━━ NIVEL 2 — Agitación moderada (BARS 5–6) ━━━',
    'Avisar al médico de urgencias y al guardia de seguridad del hospital',
    'Retirar objetos potencialmente peligrosos del entorno inmediato',
    'Intentar manejo verbal antes de recurrir a farmacología',
    'Administrar medicamento oral o IM según protocolo HCSFB 159',
    'Supervisión continua (no dejar al paciente solo)',
    '━━━ NIVEL 3 — Agitación severa o violencia (BARS 7) ━━━',
    'Activar código de alarma — avisar a urgencias y al equipo de seguridad',
    'Despejar el área y proteger a otros pacientes y personal',
    'Contención farmacológica parenteral IM/IV según escalón 3–4 de HCSFB 159',
    'Contención física si necesario (5 personas, según protocolo GCL 1.9)',
    'Supervisión continua con monitoreo de signos vitales',
    'Evaluar traslado a HCHM si no responde al tratamiento local',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// INTENTO SUICIDA (64dfc162) — emojis y SAD PERSONS
// ─────────────────────────────────────────────────────────────────────────────
const INTSUIC_ID = '64dfc162-38ac-40c9-8cff-2e898bd40988';

const INTSUIC_SADPERSONS_FIXED = {
  id: 'intsuic-v3-sadpersons',
  type: 'flowchart',
  color: 'blue',
  order: 2,
  title: 'Escala SAD PERSONS — Estratificación del Riesgo',
  content: 'Calcular puntaje SAD PERSONS en todo paciente con conducta suicida — 1 punto por cada ítem presente',
  details: [
    'S — Sexo masculino (mayor letalidad en el intento)',
    'A — Edad menor a 20 años o mayor a 45 años',
    'D — Depresión o desesperanza marcada',
    'P — Tentativa de suicidio previa',
    'E — Abuso de alcohol o drogas',
    'R — Pérdida de pensamiento racional (psicosis, delirio)',
    'S — Sin apoyo social o familiar adecuado',
    'O — Plan suicida organizado y específico',
    'N — Sin pareja estable o viudo/a reciente',
    'S — Enfermedad somática grave o crónica',
    '━━━ CONDUCTA SEGÚN PUNTAJE ━━━',
    'Puntaje 0–2: Bajo riesgo — manejo ambulatorio con derivación a salud mental',
    'Puntaje 3–6: Riesgo moderado — hospitalizar en MQ o Pediatría',
    'Puntaje 7–10: Riesgo alto — hospitalizar y evaluar derivación a HCHM',
  ],
  layout_position: 'main',
};

const INTSUIC_DERIVACION_FIXED = {
  id: 'intsuic-v3-derivacion',
  type: 'criteria',
  color: 'red',
  order: 4,
  title: 'Criterios de Derivación a Psiquiatría HCHM',
  content: 'Indicaciones para derivar al Hospital Herminda Martín — gestionar con internista de HCHM',
  items: [
    'Alta letalidad del intento (intoxicación masiva, arma de fuego, ahorcamiento)',
    'Repercusión médico-quirúrgica que requiere UCI o UPC',
    'Trastorno psiquiátrico descompensado no manejable en hospital básico',
    '━━━ RIESGO DE REINTENTO ━━━',
    'Ideación suicida persistente tras estabilización',
    'Sin conciencia de enfermedad',
    'Eventos estresantes recientes sin resolución',
    'Red de apoyo insuficiente o ausente',
    '━━━ OTROS CRITERIOS ━━━',
    'Clara intencionalidad suicida mantenida tras estabilización',
    'Duda real si el intento fue abortado (difícil distinguir de accidente)',
  ],
  layout_position: 'main',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — aplica cada fix topic por topic
// ─────────────────────────────────────────────────────────────────────────────
async function patchBlocks(topicId, patchMap, label) {
  const { data, error: fetchErr } = await supabase
    .from('topics')
    .select('content_blocks, name')
    .eq('id', topicId)
    .single();

  if (fetchErr) { console.error(`❌ ${label}: ${fetchErr.message}`); return; }

  const blocks = (data.content_blocks || []).map(b => {
    const fix = patchMap[b.id];
    return fix ? { ...b, ...fix } : b;
  });

  const changed = Object.keys(patchMap).filter(id => data.content_blocks?.some(b => b.id === id));
  console.log(`\n📋 ${label} — "${data.name}"`);
  console.log(`   Bloques parcheados: ${changed.join(', ')}`);

  if (!APPLY) return;

  const { error } = await supabase
    .from('topics')
    .update({ content_blocks: blocks, last_updated: new Date().toISOString() })
    .eq('id', topicId);

  if (error) { console.error(`   ❌ ${error.message}`); return; }
  console.log(`   ✅ Actualizado`);
}

console.log(`\n${'═'.repeat(55)}`);
console.log(`  FIX ESTRUCTURA BLOQUES — ${APPLY ? '⚡ APPLY' : '🔍 DRY-RUN'}`);
console.log(`${'═'.repeat(55)}`);

await patchBlocks(DEMENCIA_ID, {
  'dem-v2-farmacos': DEM_FARMACOS_FIXED,
  'dem-v2-derivacion': DEM_DERIVACION_FIXED,
}, 'DEMENCIA GES');

await patchBlocks(HIPNOTICOS_ID, {
  'hipn-v3-zdrugs': HIPN_ZDRUGS_FIXED,
  'hipn-v3-otros': HIPN_OTROS_FIXED,
}, 'HIPNÓTICOS');

await patchBlocks(AGITACION_ID, {
  'agit-v3-escalon-adultos': AGIT_ESCALONES_FIXED,
  'agit-v3-pediatrico': AGIT_PEDIATRICO_FIXED,
}, 'AGITACIÓN');

await patchBlocks(CONTENCION_ID, {
  'conten-v3-indicaciones': CONTEN_IND_FIXED,
}, 'CONTENCIÓN FÍSICA');

await patchBlocks(ERRMED_ID, {
  'errmed-v3-5correctos': ERRMED_5CORRECTOS_FIXED,
}, 'ERROR MEDICACIÓN');

await patchBlocks(CAIDAS_ID, {
  'caidas-v3-dowton': CAIDAS_DOWTON_FIXED,
}, 'CAÍDAS');

await patchBlocks(PREVSUIC_ID, {
  'prevsuic-v3-manejo': PREVSUIC_MANEJO_FIXED,
}, 'PREVENCIÓN SUICIDIO');

await patchBlocks(CRITSM_ID, {
  'critsm-v3-traslado': CRITSM_TRASLADO_FIXED,
}, 'CRITERIOS SM');

await patchBlocks(DOLOR_ID, {
  'dolor-v3-adversos': DOLOR_ADVERSOS_FIXED,
}, 'DOLOR POST-OP');

await patchBlocks(TORACO_ID, {
  'toraco-v3-estudios': TORACO_ESTUDIOS_FIXED,
}, 'TORACOCENTESIS');

await patchBlocks(RRMQ_ID, {
  'rrmq-v3-niveles': RRMQ_NIVELES_FIXED,
}, 'RESPUESTA RÁPIDA MQ');

await patchBlocks(INTSUIC_ID, {
  'intsuic-v3-sadpersons': INTSUIC_SADPERSONS_FIXED,
  'intsuic-v3-derivacion': INTSUIC_DERIVACION_FIXED,
}, 'INTENTO SUICIDA');

if (!APPLY) {
  console.log('\n\n⚠️  Dry-run. Agrega --apply para escribir en la base de datos.');
} else {
  console.log('\n\n✅ Estructura de bloques corregida.');
}
