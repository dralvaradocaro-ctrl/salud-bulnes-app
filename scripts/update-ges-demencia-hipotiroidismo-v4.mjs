/**
 * Reestructura los protocolos GES de Demencia (HCSFB 117) e Hipotiroidismo (HCSFB 98)
 * para alinearlos con el axioma de edición de protocolos clínicos.
 *
 * Cambios clave:
 *  - Demencia: migra a 6 pestañas (Protocolo / Equipo / Fármacos / Flujogramas / Post-Dx
 *    + Pauta de Cotejo existente). Cada bloque lleva `tab` explícito.
 *  - Hipotiroidismo: mantiene modo 3 pestañas (detección automática del renderer).
 *  - Limpia emojis decorativos (excepto teléfonos), viñetas '•' en items criteria,
 *    y separa metas terapéuticas de valores de referencia en hipotiroidismo.
 *  - Autores de demencia consolidados en `protocol_authors` (campo que renderiza
 *    ProtocolHeader.jsx); el campo `authors` queda intocado.
 *  - Agrega bloques `reference` bidireccionales entre los dos protocolos.
 *
 * Uso:
 *   node scripts/update-ges-demencia-hipotiroidismo-v4.mjs           (dry-run)
 *   node scripts/update-ges-demencia-hipotiroidismo-v4.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const ID_DEM  = '696ea74c245ef362de4f4338';
const ID_TIRO = '696efcff77924d3a78533dce';

// IDs de bloques previos a remover antes de insertar los v4
const OLD_DEM_IDS = new Set([
  'dem-v2-flujo', 'dem-v2-examenes', 'dem-v2-gds', 'dem-v2-farmacos',
  'dem-v2-derivacion', 'dem-v2-mermaid',
  'dem-trat-farm', 'dem-conductuales',
  'dem-local-banner', 'dem-local-gds', 'dem-local-farmacos',
  'dem-local-derivacion', 'dem-local-equipo',
]);

const OLD_HIPO_IDS = new Set([
  'hipo-v2-flujo', 'hipo-v2-tamizaje', 'hipo-v2-laboratorio',
  'hipo-v2-farmacos', 'hipo-v2-derivacion', 'hipo-v2-mermaid',
  'hipo-local-tamizaje', 'hipo-local-laboratorio', 'hipo-local-dosificacion',
  'hipo-local-seguimiento', 'hipo-local-derivacion',
]);

// ════════════════════════════════════════════════════════════════════════════
// DEMENCIA (HCSFB 117) — 6 pestañas con `tab` explícito
// ════════════════════════════════════════════════════════════════════════════

const DEM_AUTHORS = [
  { name: 'Dr. Felipe Sancho Tapia',      role: 'Elaborador' },
  { name: 'Dr. Rodrigo Enríquez Heredia', role: 'Elaborador — Jefe PROSAM HCSFB' },
  { name: 'Dra. Estefanía Acuña Brevis',  role: 'Revisora' },
  { name: 'Dr. Álvaro Lagos Llanos',      role: 'Aprobador — Director HCSFB' },
];

const DEM_BLOCKS = [
  // ─── PESTAÑA: PROTOCOLO ──────────────────────────────────────────────────
  {
    id: 'dem-v4-reconocimiento',
    tab: 'dem_protocolo',
    type: 'criteria',
    color: 'blue',
    order: 1,
    local_protocol: true,
    title: 'Cuándo sospechar demencia',
    content: 'Situaciones que activan la apertura de sospecha GES de demencia en el HCSFB',
    items: [
      'EMPAM alterado (Examen de Medicina Preventiva del Adulto Mayor)',
      'Quejas subjetivas de memoria reportadas por el paciente o la familia',
      'Deterioro funcional progresivo en actividades de la vida diaria',
      'Cambios de conducta, ánimo o personalidad sin causa aparente',
      'Confusión recurrente, desorientación temporo-espacial',
      'Mayor de 65 años con depresión o deterioro cognitivo persistente',
      'Olvidos recurrentes que afectan el desempeño cotidiano',
    ],
    layout_position: 'main',
  },
  {
    id: 'dem-v4-gds',
    tab: 'dem_protocolo',
    type: 'flowchart',
    color: 'amber',
    order: 2,
    local_protocol: true,
    title: 'Estratificación GDS y conducta clínica',
    content: 'Global Deterioration Scale: define severidad y determina la conducta terapéutica',
    details: [
      '━━━ GDS 1–2 (sin demencia) ━━━',
      'Seguimiento de factores de riesgo cardiovascular',
      'Cribado de depresión',
      'Estimulación cognitiva preventiva',
      '━━━ GDS 3 (deterioro cognitivo leve) ━━━',
      'Evaluación neuropsicológica formal',
      'Estimulación cognitiva estructurada',
      'Reevaluar en 6 meses',
      '━━━ GDS 4–5 (demencia leve a moderada) ━━━',
      'Inicio de tratamiento farmacológico (ver pestaña Fármacos)',
      'Derivación a Neurología HHM si presentación atípica o < 65 años',
      'Apoyo psicosocial al cuidador',
      '━━━ GDS 6–7 (demencia severa) ━━━',
      'Manejo sintomático conductual y motor',
      'Cuidados paliativos progresivos',
      'Apoyo intensivo al cuidador y red de apoyo',
    ],
    layout_position: 'main',
  },
  {
    id: 'dem-v4-plazos',
    tab: 'dem_protocolo',
    type: 'criteria',
    color: 'red',
    order: 3,
    local_protocol: true,
    title: 'Plazos GES de la garantía',
    content: 'Tiempos máximos según garantía explícita en salud',
    items: [
      '━━━ APERTURA DE SOSPECHA ━━━',
      'En la misma atención donde se detecta el deterioro',
      '━━━ EXÁMENES DE LABORATORIO ━━━',
      'Resultados disponibles ≤ 7 días desde apertura',
      '━━━ CONFIRMACIÓN DIAGNÓSTICA ━━━',
      'Evaluación multidisciplinaria completa ≤ 30 días desde sospecha',
      '━━━ INICIO DE TRATAMIENTO ━━━',
      'Fármaco indicado ≤ 30 días desde confirmación diagnóstica',
      '━━━ EXTENSIÓN DE PLAZO ━━━',
      'Si se deriva a Neurología HHM, el plazo se extiende según trazabilidad de la interconsulta',
    ],
    layout_position: 'main',
  },

  // ─── PESTAÑA: EQUIPO ─────────────────────────────────────────────────────
  {
    id: 'dem-v4-equipo',
    tab: 'dem_equipo',
    type: 'criteria',
    color: 'blue',
    order: 1,
    local_protocol: true,
    title: 'Roles del equipo PROSAM',
    content: 'Quién hace qué en la evaluación multidisciplinaria de la demencia',
    items: [
      '━━━ ENFERMERA ━━━',
      'Detecta EMPAM alterado o deterioro cognitivo en cualquier tipo de atención',
      'Activa el flujo derivando al médico de morbilidad',
      '━━━ MÉDICO DE MORBILIDAD ━━━',
      'Decide abrir sospecha GES en la misma atención',
      'Solicita la batería de exámenes (ver pestaña Fármacos → Exámenes pre-tratamiento)',
      'Indica controles y responsable del seguimiento clínico',
      '━━━ ASISTENTE SOCIAL ━━━',
      'Evalúa red de apoyo familiar',
      'Caracteriza situación socioeconómica y al cuidador principal',
      'Gestiona apoyos sociales si corresponde',
      '━━━ TERAPEUTA OCUPACIONAL ━━━',
      'Evaluación funcional extendida con instrumentos validados (ABVD, Barthel)',
      'Planifica intervención de estimulación y adaptación domiciliaria',
      '━━━ PSICÓLOGO/A ━━━',
      'Aplica MMSE, MoCA y Test del Reloj',
      'Realiza batería neuropsicológica complementaria si corresponde',
      'Orientación al cuidador',
      '━━━ MATRÓN/A ━━━',
      'Consejería pre-test VIH (protocolo rutinario para apertura GES)',
      '━━━ MÉDICO DE SALUD MENTAL ━━━',
      'Integra todos los antecedentes previos',
      'Confirma diagnóstico, descarta demencia o deriva a Neurología HHM',
      'Define plan farmacológico inicial cuando corresponde',
    ],
    layout_position: 'main',
  },

  // ─── PESTAÑA: FÁRMACOS ───────────────────────────────────────────────────
  {
    id: 'dem-v4-examenes-pre',
    tab: 'dem_farmacos',
    type: 'criteria',
    color: 'green',
    order: 1,
    local_protocol: true,
    title: 'Batería de exámenes pre-tratamiento',
    content: 'Permiten descartar causas reversibles antes de iniciar fármaco específico',
    items: [
      'Hemograma con VHS (anemia, infección crónica)',
      'Perfil bioquímico: glicemia, creatinina, BUN, pruebas hepáticas',
      'TSH (descartar hipotiroidismo como causa reversible)',
      'Vitamina B12 y ácido fólico (déficit tratable)',
      'VDRL o RPR (descartar neurosífilis)',
      'Orina completa (ITU como causa de delirium o agravamiento agudo)',
      'Electrocardiograma (cardiopatía subyacente antes de iniciar inhibidor de colinesterasa)',
      '━━━ NEUROIMAGEN ━━━',
      'TAC o RM cerebral solo si el paciente se deriva a Neurología HHM',
      'No se solicita de rutina en APS',
    ],
    layout_position: 'main',
  },
  {
    id: 'dem-v4-trat-farm',
    tab: 'dem_farmacos',
    type: 'flowchart',
    color: 'blue',
    order: 2,
    local_protocol: true,
    title: 'Tratamiento farmacológico — Protocolo Local HCSFB',
    content: 'Iniciar siempre con consentimiento informado, idealmente con indicación de especialidad',
    details: [
      '━━━ DEMENCIA LEVE-MODERADA (GDS 4–5) ━━━',
      'Donepezilo (primera línea oral)',
      '~ Inicio: 5 mg/noche × 4 semanas',
      '~ Mantención: subir a 10 mg/noche',
      '~ Si no hay mejoría sintomática: suspender en el siguiente control anual',
      'Rivastigmina cápsulas',
      '~ Inicio: 1.5 mg c/12h',
      '~ Titular cada 2 semanas hasta 6 mg c/12h',
      'Rivastigmina parche (mejor tolerancia gastrointestinal)',
      '~ Inicio: 4.6 mg/24h × 4 semanas',
      '~ Mantención: 9.5 mg/24h',
      '━━━ DEMENCIA MODERADA-SEVERA (GDS 6–7) o intolerancia a IAChE ━━━',
      'Memantina',
      '~ Inicio: 5 mg/día semana 1',
      '~ Titular +5 mg/semana hasta máximo 20 mg/día',
      'Combinación Donepezilo + Memantina puede indicarse en GDS 5–6',
      '━━━ SEGUIMIENTO INICIAL ━━━',
      'Control a las 4 semanas tras inicio del fármaco',
      'Luego control cada 3–6 meses',
      'Plazo de inicio del tratamiento: ≤ 30 días desde confirmación (garantía GES)',
    ],
    layout_position: 'main',
  },
  {
    id: 'dem-v4-conductuales',
    tab: 'dem_farmacos',
    type: 'flowchart',
    color: 'purple',
    order: 3,
    local_protocol: true,
    title: 'Síntomas psicológicos y conductuales — manejo HCSFB',
    content: 'Ningún fármaco tiene evidencia alta. Preferir medidas no farmacológicas; farmacológico solo si fallan',
    details: [
      '━━━ MEDIDAS NO FARMACOLÓGICAS (primera línea) ━━━',
      'Higiene del sueño y rutinas fijas de actividad',
      'Adaptaciones ambientales: reducir estímulos, aumentar iluminación diurna',
      'Estrategias tranquilizantes: música, reminiscencia, contacto afectivo',
      'Evitar desencadenantes conocidos (ruido, cambios de entorno)',
      'Seguridad para deambular y prevención de caídas',
      '━━━ TRATAMIENTO FARMACOLÓGICO (si las medidas no farmacológicas fallan) ━━━',
      'Apatía → Metilfenidato 10 mg/día VO',
      'Agitación verbal o física → Sertralina 50–200 mg, Citalopram 20 mg, o Escitalopram 10 mg',
      '~ Si agitación severa: Risperidona 1–3 mg VO, usar mínima dosis efectiva',
      'Trastorno del sueño → Melatonina 3 mg (disminuye despertares) o Trazodona 100 mg (mejora horas totales)',
      '~ No usar benzodiacepinas en demencia',
      'Depresión asociada → ISRS (Sertralina, Escitalopram); evitar tricíclicos por efecto anticolinérgico',
      '━━━ SÍNTOMAS A EVALUAR EN CADA CONTROL ━━━',
      'Psicológicos: apatía, ansiedad, ánimo bajo, delirios, identificaciones erróneas',
      'Conductuales: vagabundeo, resistencia a cuidados, conductas sexuales inapropiadas',
    ],
    layout_position: 'main',
  },

  // ─── PESTAÑA: FLUJOGRAMAS ────────────────────────────────────────────────
  {
    id: 'dem-v4-mermaid',
    tab: 'dem_flujogramas',
    type: 'mermaid',
    order: 1,
    title: 'Flujograma HCSFB 117 — Detección y manejo de demencia',
    content: `flowchart TD
    EN([Enfermera: EMPAM alterado\\no deterioro cognitivo\\ndetectado en atención]) --> AS1[Asistente Social:\\nevaluación red de apoyo\\ny cuidadores]
    EN --> MM[Médico Morbilidad:\\nabre sospecha GES\\nsolicita batería de exámenes]
    MC([Médico Morbilidad\\nconsulta espontánea:\\nabre sospecha GES]) --> AS2[Asistente Social]
    MC --> TO2[Terapeuta Ocupacional:\\nevaluación extendida]
    MC --> PS2[Psicólogo: MMSE\\nMoCA · Reloj]
    MC --> MAT2[Matrón/a:\\nconsejería VIH]
    MM --> TO[Terapeuta Ocupacional:\\nevaluación funcional\\ncon instrumentos]
    MM --> PS[Psicólogo: MMSE\\nMoCA · Test del Reloj]
    MM --> MAT[Matrón/a:\\nconsejería VIH]
    AS1 --> MSM[Médico Salud Mental:\\nconfirma · descarta\\no deriva a Neurología HHM\\nextendiendo plazo sospecha]
    TO --> MSM
    PS --> MSM
    MAT --> MSM
    AS2 --> MSM
    TO2 --> MSM
    PS2 --> MSM
    MAT2 --> MSM
    MSM --> OK([Confirmado GDS 4-7:\\ninicio tratamiento farmacológico\\nseguimiento PROSAM c/3-6m])
    MSM --> NO([Descartado:\\nmanejo por morbilidad general\\nestimulación cognitiva si GDS 3])
    MSM --> DER([Deriva a Neurología HHM\\nvía Teleprocesos:\\natípico · menor 65 años\\nrápido · refractario])`,
    layout_position: 'main',
  },

  // ─── PESTAÑA: POST-DX ────────────────────────────────────────────────────
  {
    id: 'dem-v4-seguimiento',
    tab: 'dem_post_dx',
    type: 'criteria',
    color: 'green',
    order: 1,
    local_protocol: true,
    title: 'Seguimiento post-diagnóstico',
    content: 'Cadencia de controles y dimensiones a evaluar en cada uno',
    items: [
      '━━━ PRIMER CONTROL ━━━',
      'A las 4 semanas tras inicio de fármaco',
      'Evaluar tolerancia, adherencia y efectos adversos (gastrointestinales, bradicardia)',
      '━━━ CONTROLES DE MANTENCIÓN ━━━',
      'Cada 3–6 meses según severidad y evolución',
      'Reevaluar GDS y funcionalidad (Barthel) anualmente',
      '━━━ QUÉ EVALUAR EN CADA CONTROL ━━━',
      'Síntomas cognitivos: memoria, orientación, lenguaje',
      'Síntomas conductuales: agitación, sueño, ánimo, apatía',
      'Funcionalidad: ABVD, AIVD',
      'Estado del cuidador: sobrecarga, signos de claudicación',
      '━━━ AJUSTES DE TRATAMIENTO ━━━',
      'Si no hay respuesta clínica tras 6 meses: evaluar suspender o cambiar fármaco',
      'Combinar Donepezilo + Memantina puede indicarse en GDS 5–6',
    ],
    layout_position: 'main',
  },
  {
    id: 'dem-v4-derivacion',
    tab: 'dem_post_dx',
    type: 'criteria',
    color: 'red',
    order: 2,
    local_protocol: true,
    title: 'Criterios de derivación a Neurología HHM',
    content: 'Cuándo, adónde y cómo derivar al especialista',
    items: [
      '━━━ DESTINO ━━━',
      'Neurología del Hospital Herminda Martín (HHM), Chillán',
      '━━━ VÍA ━━━',
      'Interconsulta por Teleprocesos MINSAL (sistema electrónico HCSFB)',
      '━━━ ADJUNTAR ━━━',
      'Resumen clínico actualizado',
      'Resultados completos de la batería de exámenes',
      'Puntaje GDS y resultados de MMSE / MoCA / Reloj',
      '━━━ INDICACIONES DE DERIVACIÓN ━━━',
      'Diagnóstico incierto o presentación atípica (frontotemporal, Lewy, vascular)',
      'Edad de inicio menor a 65 años (demencia precoz)',
      'Deterioro cognitivo rápido en menos de 6 meses (descartar causa orgánica urgente)',
      'Síntomas conductuales severos refractarios al manejo local',
      'Necesidad de neuroimagen avanzada (RM cerebral con contraste)',
      'Evaluación neuropsicológica formal especializada',
      'Sin respuesta a tratamiento farmacológico tras 6 meses',
    ],
    layout_position: 'main',
  },
  {
    id: 'dem-v4-ref-hipo',
    tab: 'dem_post_dx',
    type: 'reference',
    order: 3,
    title: 'Ver también',
    reference_type: 'topic',
    reference_id: ID_TIRO,
    reference_label: 'HCSFB 98 — Hipotiroidismo (descartar como causa reversible de deterioro cognitivo)',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// HIPOTIROIDISMO (HCSFB 98) — modo 3 pestañas (sin tab field, autodetectado)
// ════════════════════════════════════════════════════════════════════════════

const HIPO_BLOCKS = [
  {
    id: 'hipo-v4-flujo',
    type: 'flowchart',
    color: 'blue',
    order: 10,
    local_protocol: true,
    title: 'Flujo de atención — Policlínico HCSFB 98',
    content: 'Responsables y secuencia del manejo del hipotiroidismo primario en policlínico APS',
    details: [
      '1. MÉDICO: detecta sospecha clínica o pertenencia a grupo de tamizaje, solicita TSH + T4L en ayunas',
      '2. LABORATORIO HCSFB: resultado TSH disponible en 24–48 horas hábiles',
      '3. MÉDICO: interpreta resultado, inicia Levotiroxina o deriva si corresponde',
      '4. QUÍMICO-FARMACÉUTICO: co-gestiona controles alternados c/6 meses; deja orden interna TSH + perfil lipídico para el siguiente control médico',
      '5. MÉDICO: control anual cuando el paciente está compensado (dos TSH consecutivos en rango)',
      '6. DERIVACIÓN A ENDOCRINOLOGÍA HHM si se cumplen criterios, vía Teleprocesos MINSAL',
      '━━━ TOMA DE MUESTRA ━━━',
      'En ayunas, antes de tomar la dosis de Levotiroxina del día',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-v4-tamizaje',
    type: 'criteria',
    color: 'blue',
    order: 11,
    local_protocol: true,
    title: 'Grupos de tamizaje — ¿a quién solicitar TSH?',
    content: 'Población a la que se debe solicitar perfil tiroideo según protocolo local HCSFB 98',
    items: [
      'Antecedente de cirugía tiroidea, radioyodo o radioterapia cervical',
      'Disfunción tiroidea previa o anticuerpos antitiroideos (AcTPO) positivos',
      'Hipercolesterolemia',
      'Obesidad (IMC mayor a 30)',
      'Infertilidad',
      'Enfermedades autoinmunes: DM tipo 1, Sjögren, artritis reumatoidea, Addison, enfermedad celíaca, vitíligo',
      'Uso crónico de amiodarona o litio',
      'Depresión confirmada en menores de 65 años',
      'Mayores de 65 años con sospecha de depresión o deterioro cognitivo',
      'Síndrome de Down o Turner',
      'Embarazadas (solicitar también T4 libre)',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-v4-laboratorio',
    type: 'flowchart',
    color: 'green',
    order: 12,
    local_protocol: true,
    title: 'Valores de referencia — Laboratorio HCSFB',
    content: 'Rangos normales utilizados en el laboratorio del HCSFB. No usar valores de laboratorios externos.',
    details: [
      '━━━ TSH ADULTOS ━━━',
      '0.38 – 5.33 µUI/mL',
      '━━━ TSH GESTANTES POR TRIMESTRE ━━━',
      '1° trimestre: 0.05 – 3.70 µUI/mL',
      '2° trimestre: 0.31 – 4.35 µUI/mL',
      '3° trimestre: 0.41 – 5.18 µUI/mL',
      '━━━ T4 LIBRE ━━━',
      '0.6 – 1.2 ng/dL',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-v4-farmacos',
    type: 'flowchart',
    color: 'amber',
    order: 13,
    local_protocol: true,
    title: 'Tratamiento con Levotiroxina — dosis, ajustes y metas',
    content: 'Esquema de inicio, ajuste y metas terapéuticas según nivel de TSH y características del paciente',
    details: [
      '━━━ INICIO POR NIVEL DE TSH ━━━',
      'TSH 5–10 µUI/mL (subclínico leve): no iniciar salvo AcTPO+ o síntomas evidentes',
      'TSH 10–20 µUI/mL: iniciar LT4 25–50 µg/día, titular a 50–100 µg/día',
      'TSH mayor a 20 µUI/mL: LT4 1.0–1.6 µg/kg/día según edad y peso corporal ideal',
      '━━━ ADULTOS MAYORES (≥ 75 años) ━━━',
      'Inicio 12.5–25 µg/día con titulación muy lenta cada 8–12 semanas',
      'No iniciar si TSH menor a 10 µUI/mL (beneficio no demostrado)',
      '━━━ AJUSTES DE DOSIS ━━━',
      '±25–50 µg cada 6–8 semanas en adultos',
      '±12.5–25 µg cada 8–12 semanas en adultos mayores',
      '━━━ ADMINISTRACIÓN ━━━',
      'En ayunas, 30–60 minutos antes del desayuno',
      'Misma hora todos los días',
      '━━━ INTERACCIONES (separar la toma) ━━━',
      'Calcio',
      'Hierro',
      'Omeprazol y otros inhibidores de bomba de protones',
      'Estatinas',
      'Anticonvulsivantes',
      '━━━ METAS TERAPÉUTICAS DE TSH ━━━',
      'Adultos menores de 70 años: 1 – 3 µUI/mL',
      'Adultos de 70 años o más: 3 – 6 µUI/mL (más conservador)',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-v4-derivacion',
    type: 'criteria',
    color: 'red',
    order: 14,
    local_protocol: true,
    title: 'Criterios de derivación a Endocrinología HHM',
    content: 'Cuándo, adónde y cómo derivar al especialista',
    items: [
      '━━━ DESTINO ━━━',
      'Endocrinología del Hospital Herminda Martín (HHM), Chillán',
      '━━━ VÍA ━━━',
      'Interconsulta por Teleprocesos MINSAL o telemedicina según disponibilidad',
      '━━━ ADJUNTAR ━━━',
      'Resumen clínico actualizado',
      'TSH, T4L y AcTPO',
      'Listado de medicamentos actuales',
      '━━━ INDICACIONES DE DERIVACIÓN ━━━',
      'Antecedente de cáncer tiroideo (cualquier TSH)',
      'Cardiopatía coronaria o insuficiencia cardíaca asociada',
      'Nódulo tiroideo palpable o bocio persistente',
      'TSH fuera de rango tras 3 ajustes de dosis (derivar antes de 6 meses)',
      'Sospecha de hipotiroidismo severo o mixedema',
      'Hipotiroidismo secundario (TSH normal o baja con T4L baja)',
      'Uso de amiodarona o litio (titulación compleja)',
      'Embarazo con o sin tratamiento previo (objetivos TSH estrictos por trimestre)',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-v4-ref-dem',
    type: 'reference',
    order: 15,
    title: 'Ver también',
    reference_type: 'topic',
    reference_id: ID_DEM,
    reference_label: 'HCSFB 117 — Demencia (tamizar TSH al sospechar deterioro cognitivo en mayores)',
  },
  {
    id: 'hipo-v4-mermaid',
    type: 'mermaid',
    order: 20,
    title: 'Algoritmo HCSFB 98 — Manejo del hipotiroidismo en policlínico APS',
    content: `flowchart TD
    A([Sospecha clínica o grupo\\nde tamizaje identificado]) --> B[Solicitar TSH + T4L\\nen ayunas · antes de LT4]
    B --> C{Resultado TSH\\nLaboratorio HCSFB}
    C -->|TSH menor a 5.33\\nnormal| D([Sin hipotiroidismo\\nControl según patología base])
    C -->|TSH 5-10\\nsubclínico leve| E{¿AcTPO+\\no sintomático?}
    E -->|No| F[Observar · repetir TSH\\nen 6 meses]
    E -->|Sí| G
    C -->|TSH 10-20| G[Iniciar LT4 25-50 µg/día\\ntitular a 50-100 µg/día]
    C -->|TSH mayor a 20| H[LT4 1.0-1.6 µg/kg/día\\nsegún edad y peso]
    G --> I{¿Edad\\nmayor o igual a 75 años?}
    H --> I
    I -->|Sí| J[Inicio 12.5-25 µg/día\\ntitulación muy lenta]
    I -->|No| K[Inicio 25-50 µg/día\\ntitular c/6-8 semanas]
    J --> L[Control TSH en 6-8 semanas\\nmás AcTPO y perfil lipídico]
    K --> L
    L --> M{¿TSH en meta?\\nmenor 70a: 1-3\\nmayor o igual 70a: 3-6}
    M -->|Sí| N{¿2 TSH en\\nrango consecutivos?}
    N -->|No| L
    N -->|Sí| O[Control anual médico\\nc/6m alternado QF]
    M -->|No · ajustar dosis| P{¿3 ajustes sin\\ncompensación?}
    P -->|No| Q[Ajustar más menos 25 µg\\nnuevo control 6-8 semanas]
    Q --> L
    P -->|Sí| R([Derivar a Endocrinología HHM\\nvía Teleprocesos MINSAL])`,
    layout_position: 'main',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DEMENCIA & HIPOTIROIDISMO v4 — ${APPLY ? 'APPLY MODE' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

async function migrateTopic({ id, label, oldIds, newBlocks, authors }) {
  const { data, error } = await supabase
    .from('topics')
    .select('content_blocks, protocol_authors, authors')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Fetch ${label}:`, error.message);
    return;
  }

  const existing  = data.content_blocks || [];
  const preserved = existing.filter(b => !oldIds.has(b.id));
  const merged    = [...preserved, ...newBlocks].sort(
    (a, b) => (a.order || 99) - (b.order || 99)
  );

  const checklistKept = preserved.filter(b => b.type === 'checklist').length;
  const removed       = existing.length - preserved.length;

  console.log(`${label}`);
  console.log(`  bloques actuales: ${existing.length}`);
  console.log(`  removidos (IDs antiguos): ${removed}`);
  console.log(`  preservados (incluye ${checklistKept} checklist): ${preserved.length}`);
  console.log(`  agregados (v4): ${newBlocks.length}`);
  console.log(`  total final: ${merged.length}`);
  if (authors) {
    console.log(`  protocol_authors:`);
    authors.forEach(a => console.log(`    - ${a.name} (${a.role})`));
  }
  console.log('');

  if (!APPLY) return;

  const update = { content_blocks: merged, last_updated: new Date().toISOString() };
  if (authors) update.protocol_authors = authors;

  const { error: e } = await supabase.from('topics').update(update).eq('id', id);
  if (e) console.error(`  Error update ${label}:`, e.message);
  else   console.log(`  Actualizado.\n`);
}

await migrateTopic({
  id:        ID_DEM,
  label:     'Demencia (HCSFB 117)',
  oldIds:    OLD_DEM_IDS,
  newBlocks: DEM_BLOCKS,
  authors:   DEM_AUTHORS,
});

await migrateTopic({
  id:        ID_TIRO,
  label:     'Hipotiroidismo (HCSFB 98)',
  oldIds:    OLD_HIPO_IDS,
  newBlocks: HIPO_BLOCKS,
  authors:   null,  // mantener los actuales
});

if (!APPLY) {
  console.log('Modo dry-run. Agregá --apply para escribir en la base de datos.');
}
