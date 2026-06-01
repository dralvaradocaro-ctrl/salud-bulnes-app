/**
 * Crea/actualiza el topic "Fibromialgia — Referencia y Contrarreferencia"
 * en la categoría Policlínico.
 *
 * Fuente: Protocolo de Abordaje Clínico: Referencia y Contrarreferencia de
 * Fibromialgia, Servicio de Salud Ñuble. Código PRO-074, Edición SEGUNDA,
 * Febrero 2026, vigencia Febrero 2031. Res. Exenta 1C N° 705 (13-02-2026).
 *
 * Actualización 2ª edición (vs 1ª ed. Dic 2024 / Res. N° 0291):
 *  - Pregabalina y Duloxetina pasan a ser arsenal APS (Sí/Sí), iniciadas en APS
 *    para dolor refractario tras ≥3 meses de manejo multimodal (antes: solo especialista).
 *  - Posología explícita: Pregabalina 37,5–75 → 150 mg/día; Duloxetina 30 → 60 mg/día;
 *    prescripción asociada a CIE-10 M79.7 en Rayen.
 *  - Flujograma actualizado: control a 3 meses con inicio de pregabalina/duloxetina en APS,
 *    y control a ~6 meses antes de derivar a Fisiatría.
 *  - Indicador: umbral 90%. Derivación a Fisiatría también por intolerancia a pregabalina/duloxetina.
 *
 * Protocolo SSÑ (no es protocolo interno del hospital) → has_local_protocol: false,
 * clasificacion_ges: null, protocol_code 'PRO-074'.
 *
 * Uso: node scripts/create-policlinico-fibromialgia-v1.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f431e'; // Policlínico
const TOPIC_NAME = 'Fibromialgia — Referencia y Contrarreferencia';
const LEGACY_NAMES = ['Fibromialgia', 'Abordaje Clínico de Fibromialgia'];

// PDF opcional: si existe el archivo en disco se sube a storage; si no, se omite.
const PDF_PATH = process.env.FIBRO_PDF_PATH || '';
const STORAGE_PATH = 'protocolos/policlinico/fibromialgia-ssn-pro074-v2.pdf';

const today = new Date().toISOString();

const content_blocks = [
  // ───────────────────────── Header (fuera de pestañas) ─────────────────────────
  {
    id: 'fibro-header',
    type: 'protocol_header',
    ordinario: 'PROTOCOLO SSÑ · PRO-074',
    title: 'Abordaje Clínico de Fibromialgia: Referencia y Contrarreferencia',
    institution: 'Servicio de Salud Ñuble',
    department: 'Sección Gestión de Rehabilitación y Salud Respiratoria',
    date: 'Edición Segunda · Febrero 2026',
    summary:
      'Criterios de referencia y contrarreferencia de personas con fibromialgia entre APS (CESFAM/HCSF) y nivel secundario (HCHM/HSC), y lineamientos del manejo multidisciplinario en atención primaria.',
    order: 1,
  },

  // ───────────────────────────── Tab: Inicio ─────────────────────────────
  {
    id: 'fibro-que-es',
    type: 'text',
    tab: 'Inicio',
    order: 10,
    title: '¿Qué es la fibromialgia?',
    content:
      'Cuadro de dolor musculoesquelético generalizado y crónico, asociado a fatiga, alteraciones del sueño, problemas de memoria, ánimo y síntomas somáticos. Es la tercera causa de dolor musculoesquelético crónico tras la artrosis de rodilla y el lumbago. Su etiología es desconocida y el diagnóstico es exclusivamente clínico: no se apoya en laboratorio, imagen ni anatomía patológica. El enfoque terapéutico debe ser integral y multidisciplinario.',
  },
  {
    id: 'fibro-objetivos',
    type: 'criteria',
    tab: 'Inicio',
    color: 'blue',
    order: 11,
    title: 'Objetivos del protocolo',
    items: [
      'Establecer criterios de referencia y contrarreferencia de personas con fibromialgia desde HCSF y CESFAM hacia HCHM u HSC según corresponda.',
      'Orientar a los equipos de rehabilitación de APS sobre el manejo multidisciplinario.',
      '━━━ ESPECÍFICOS ━━━',
      'Definir criterios de derivación desde APS a cada especialidad asociada (Reumatología, Fisiatría, Psiquiatría).',
      'Definir los requisitos que deben acompañar la derivación a especialista.',
      'Mejorar la pertinencia de las derivaciones a especialidad.',
      'Favorecer la pesquisa y el diagnóstico de fibromialgia en APS.',
      'Entregar lineamientos del manejo integral por equipos de APS.',
      'Estandarizar el manejo de personas con diagnóstico de fibromialgia.',
    ],
  },
  {
    id: 'fibro-alcance',
    type: 'criteria',
    tab: 'Inicio',
    color: 'cyan',
    order: 12,
    title: 'Alcance — establecimientos de la red Ñuble',
    items: [
      'Hospital Herminda Martín de Chillán (HCHM).',
      'Hospital San Carlos (HSC).',
      'Hospitales Comunitarios de Salud Familiar de Bulnes, Quirihue, Coelemu, El Carmen y Yungay.',
      'Centros de Salud Familiar de la Región de Ñuble (29).',
    ],
  },
  {
    id: 'fibro-roles',
    type: 'criteria',
    tab: 'Inicio',
    color: 'purple',
    order: 13,
    title: 'Roles del equipo',
    items: [
      '━━━ MÉDICO/A APS ━━━',
      'Evaluar y definir si corresponde fibromialgia; iniciar manejo integral con los 3 pilares y tratamiento farmacológico con arsenal básico APS.',
      'Si sospecha mesenquimopatía, derivar vía SIC a Reumatología con exámenes.',
      'A los 3 meses, en refractarios al manejo multimodal (adherencia verificada, idealmente por QF): progresar con pregabalina en baja dosis y, en trastorno depresivo asociado, cambiar ISRS a duloxetina 30 mg.',
      'Pasados 2-3 meses, nuevo control: ajustar hasta duloxetina 60 mg/día y pregabalina 150 mg/día en casos refractarios.',
      'Derivar a nivel secundario (Fisiatría) ante fracaso del manejo multimodal tras 5-6 meses; solicitar consultoría si no hay respuesta del equipo de salud mental.',
      '━━━ KINESIÓLOGO/A y/o TERAPEUTA OCUPACIONAL APS ━━━',
      'Entrevista, evaluación inicial según pautas y sesiones de rehabilitación basadas en ejercicio físico (individual y grupal) y educación, que es el punto de inicio de la rehabilitación.',
      '━━━ PSICÓLOGO/A APS ━━━',
      'Atención psicológica enfocada en autocuidado y autogestión (TCC, manejo del catastrofismo, terapias de aceptación y compromiso).',
      'Gestionar consultoría con psiquiatra cuando corresponda.',
      '━━━ SOME ━━━',
      'Subir la SIC al MLE, agendar ingresos y sesiones, rescatar de DOCLID altas y contrarreferencias, y rebajar SIC del MLE.',
      '━━━ MÉDICOS ESPECIALISTAS (Fisiatra, Reumatólogo, Psiquiatra) ━━━',
      'Ajustar el manejo farmacológico, indicar exámenes u otra intervención; realizar altas o contrarreferencias. Ante buena respuesta se mantiene la receta del especialista en HCHM por 1 año. En Fisiatría se agenda control en 6 meses.',
    ],
  },

  {
    id: 'fibro-flujo-atencion',
    type: 'flowchart',
    tab: 'Inicio',
    color: 'green',
    order: 14,
    title: 'Flujo de atención en APS — paso a paso',
    details: [
      'Consulta por dolor musculoesquelético persistente (morbilidad o control). Aplicar la lista de chequeo de sospecha.',
      '~ Si 3 o más de las 6 preguntas son positivas, la fibromialgia es altamente probable.',
      'Si se sospecha mesenquimopatía, solicitar exámenes (Hemograma, VHS, PCR, Perfil Hepático, Creatinina, Orina completa, CK y Perfil Tiroideo).',
      'Nueva consulta médica (30 min): revisar exámenes y aplicar los criterios diagnósticos ACR 2016.',
      '~ Si se confirma mesenquimopatía: emitir SIC a Reumatología (no excluye el manejo paralelo de la fibromialgia).',
      'Confirmada la fibromialgia: iniciar manejo multimodal con los 3 pilares (farmacológico con arsenal básico + rehabilitación + salud mental).',
      'Control médico a los 3 meses: evaluar la respuesta. Si es refractario al manejo multimodal, iniciar pregabalina y/o duloxetina en APS (ver pestaña Tratamiento).',
      'Nuevo control a los 2-3 meses (≈6 meses desde el inicio): si persiste el fracaso del manejo multimodal, derivar al especialista que corresponda (Fisiatría / Reumatología / Psiquiatría).',
    ],
  },

  // ───────────────────────────── Tab: Diagnóstico ─────────────────────────────
  {
    id: 'fibro-dx-alert',
    type: 'alert',
    tab: 'Diagnóstico',
    color: 'amber',
    order: 20,
    title: 'El diagnóstico de fibromialgia es clínico',
    content:
      'No existe prueba objetiva (laboratorio, imagen ni anatomía patológica). El diagnóstico es válido independientemente de otros diagnósticos: la presencia de fibromialgia no excluye otras enfermedades clínicamente importantes.',
  },
  {
    id: 'fibro-dx-sospecha',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'blue',
    order: 21,
    title: 'Lista de chequeo de sospecha en APS',
    items: [
      '¿Dolor físico musculoesquelético (articular y muscular) por más de 3 meses de evolución?',
      '¿Cansancio o fatiga física desde el despertar, que se exacerba con actividades antes toleradas?',
      '¿Mal dormir, problemas de conciliación o sueño superficial?',
      '¿Alteración de memoria reciente o dificultad en la concentración?',
      '¿Adormecimiento de manos o sensación de piel quemada u otros indicios de dolor neuropático?',
      '¿El examen físico detecta hiperalgesia, alodinia o puntos sensibles?',
      '━━━ INTERPRETACIÓN ━━━',
      'Si 3 o más de estas 6 preguntas son positivas, el diagnóstico de fibromialgia es altamente probable. Confirmar luego con criterios ACR 2016.',
    ],
  },
  {
    id: 'fibro-dx-acr',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'green',
    order: 22,
    title: 'Criterios diagnósticos ACR 2016 — 4 condiciones',
    items: [
      'Dolor en 4 de las 5 regiones del Índice de Dolor Generalizado.',
      'IDG >=7 y ESS >=5, o bien IDG 4-6 y ESS >=9.',
      'Síntomas presentes por al menos 3 meses.',
      'El diagnóstico se hará exista o no otro proceso asociado.',
    ],
  },
  {
    id: 'fibro-dx-calculadora',
    type: 'fibromyalgia_acr_calculator',
    tab: 'Diagnóstico',
    order: 23,
  },
  {
    id: 'fibro-dx-fs',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'purple',
    order: 24,
    title: 'Puntajes y seguimiento (Escala de Severidad de Fibromialgia)',
    items: [
      'IDG (Índice de Dolor Generalizado / WPI): 0-19 áreas corporales con dolor en la última semana.',
      'ESS (Escala de Severidad de Síntomas): 0-12 = 3 síntomas cardinales (0-3 c/u: fatiga, sueño no reparador, trastornos cognitivos) + 3 somáticos (0-1: cefalea, dolor abdominal, depresión).',
      'FS (Escala de Severidad de Fibromialgia) = IDG + ESS = 0-31. Orienta la evolución entre revisiones.',
      'La AAPT 2019 plantea una evaluación alternativa, pero para este protocolo se utilizan los criterios ACR 2016.',
    ],
  },

  // ───────────────────────────── Tab: Tratamiento (subtabs) ─────────────────────────────
  {
    id: 'fibro-tx-intro',
    type: 'text',
    tab: 'Tratamiento',
    order: 30,
    title: 'Tratamiento integral: 3 pilares',
    content:
      'El tratamiento es sintomático y combina 3 pilares: manejo farmacológico, manejo de salud mental y actividad física. La educación es el punto de inicio de la rehabilitación y, combinada con terapia psicológica, facilita el afrontamiento activo y la adherencia. El manejo no farmacológico es la intervención de primera línea.',
  },
  {
    id: 'fibro-tx-farmacos',
    type: 'criteria',
    tab: 'Tratamiento',
    subtab: 'Farmacológico',
    color: 'blue',
    order: 31,
    title: 'Fármacos de arsenal APS — manejo inicial',
    items: [
      'Paracetamol: manejo de dolor nociceptivo de carácter leve.',
      'Meloxicam: manejo de dolor nociceptivo de carácter moderado.',
      'Amitriptilina (ATC): alivio por inhibición de recaptación de serotonina y noradrenalina; reduce dolor ~30% (similar a duloxetina); efecto moderado en sueño.',
      'Ciclobenzaprina: relajante muscular similar a ATC; mejora general en dolor y trastornos del sueño.',
      'Sertralina: manejo de trastornos del ánimo asociados.',
      'Fluoxetina: manejo de trastornos del ánimo; controvertida para dolor, sueño y fatiga.',
    ],
  },
  {
    id: 'fibro-tx-farmacos-refractario',
    type: 'criteria',
    tab: 'Tratamiento',
    subtab: 'Farmacológico',
    color: 'amber',
    order: 32,
    title: 'Fármacos de arsenal APS — dolor refractario',
    items: [
      'Pregabalina y duloxetina están disponibles en el arsenal APS para fibromialgia confirmada que previamente haya recibido tratamiento multimodal, al menos 3 meses con fármacos del manejo inicial.',
      'Pregabalina: neuromodulador; reduce el dolor y mejora el ciclo sueño-vigilia y la calidad de vida.',
      'Duloxetina: antidepresivo dual; disminución significativa del dolor (~50%) y mejora del ánimo y la calidad de vida.',
      'Se inician en APS (no requieren derivación a especialista para indicarlas).',
    ],
  },
  {
    id: 'fibro-tx-disponibilidad',
    type: 'table',
    tab: 'Tratamiento',
    subtab: 'Farmacológico',
    color: 'green',
    order: 33,
    title: 'Disponibilidad en la red APS',
    headers: ['Fármaco', 'CESFAM', 'HCSF'],
    rows: [
      ['Paracetamol', 'Sí', 'Sí'],
      ['Meloxicam', 'Sí', 'Sí'],
      ['Amitriptilina', 'Sí', 'Sí'],
      ['Sertralina', 'Sí', 'Sí'],
      ['Fluoxetina', 'Sí', 'Sí'],
      ['Ciclobenzaprina', 'Sí', 'Sí'],
      ['Pregabalina', 'Sí', 'Sí'],
      ['Duloxetina', 'Sí', 'Sí'],
    ],
  },
  {
    id: 'fibro-tx-posologia',
    type: 'table',
    tab: 'Tratamiento',
    subtab: 'Farmacológico',
    color: 'blue',
    order: 34,
    title: 'Posología — presentaciones del arsenal de Bulnes',
    headers: ['Fármaco', 'Presentación', 'Inicio', 'Ajuste / máximo', 'Indicación'],
    rows: [
      ['Paracetamol', 'comp 500 mg', 'Según dolor', '—', 'Dolor nociceptivo leve'],
      ['Meloxicam', 'comp 15 mg', '15 mg 1 vez/día', '—', 'Dolor nociceptivo moderado'],
      ['Amitriptilina', 'comp 25 mg', '25 mg en la noche', 'Según respuesta', 'Dolor y sueño (ATC)'],
      ['Ciclobenzaprina', 'comp 10 mg', '10 mg', 'Según respuesta', 'Relajante muscular; dolor y sueño'],
      ['Sertralina', 'comp 50 mg', '50 mg/día', 'Según ánimo', 'Trastorno del ánimo asociado'],
      ['Fluoxetina', 'comp 20 mg', '20 mg/día', 'Según ánimo', 'Trastorno del ánimo asociado'],
      ['Pregabalina', 'comp/cáps 75 mg', '37,5–75 mg 1 vez/día', 'Hasta 150 mg/día', 'Dolor generalizado mod-severo (ENA ≥4) refractario'],
      ['Duloxetina', 'comp 30 mg', '30 mg/día post comida', 'Hasta 60 mg/día', 'Episodio depresivo / ánimo secundario / fatiga severa, refractarios'],
    ],
  },
  {
    id: 'fibro-tx-escalonamiento',
    type: 'mermaid',
    tab: 'Tratamiento',
    subtab: 'Farmacológico',
    color: 'blue',
    order: 35,
    title: 'Escalonamiento farmacológico — paso a paso',
    description: 'Secuencia de inicio y ajuste de fármacos en APS según respuesta al manejo multimodal.',
    content: `flowchart TD
    A["Inicio: arsenal básico APS\\n(paracetamol/meloxicam +\\nATC/ciclobenzaprina ± ISRS según ánimo)"] --> B["Control a los 3 meses\\nadherencia verificada (idealmente por QF)"]
    B --> C{"¿Refractario al\\nmanejo multimodal?"}
    C -->|"No"| D["Continúa manejo en APS"]
    C -->|"Sí · dolor ENA ≥4"| E["Pregabalina 37,5–75 mg/día"]
    C -->|"Sí · trastorno del ánimo"| F["Cambio de ISRS a\\nDuloxetina 30 mg/día"]
    E --> G["Nuevo control 2–3 meses\\n(≈6 meses desde el inicio)"]
    F --> G
    G --> H{"¿Persiste dolor severo\\ny trastorno del ánimo?"}
    H -->|"No"| D
    H -->|"Sí"| I["Ajuste: Pregabalina 150 mg/día\\ny/o Duloxetina 60 mg/día"]
    I --> J["Fracaso multimodal ≥5–6 meses\\no intolerancia → SIC a Fisiatría"]`,
  },
  {
    id: 'fibro-tx-rayen',
    type: 'alert',
    tab: 'Tratamiento',
    subtab: 'Farmacológico',
    color: 'amber',
    order: 36,
    title: 'Registro en Rayen y disponibilidad de comprimido',
    content:
      'Toda prescripción de pregabalina y/o duloxetina en el marco de este protocolo debe quedar asociada al diagnóstico de Fibromialgia con CIE-10 M79.7 (pertinencia, trazabilidad y coherencia). La pregabalina 75 mg puede venir como cápsulas o comprimidos: antes de indicar 37,5 mg, confirmar con la jefatura de farmacia la disponibilidad de comprimido fraccionable; si solo hay cápsulas, no es posible el fraccionamiento.',
  },
  {
    id: 'fibro-tx-salud-mental',
    type: 'criteria',
    tab: 'Tratamiento',
    subtab: 'Salud mental',
    color: 'purple',
    order: 34,
    title: 'Manejo de salud mental',
    items: [
      'Enfoque en autocuidado y autogestión de síntomas.',
      'Terapia cognitivo-conductual (TCC): mejora la confianza y las estrategias de afrontamiento del dolor crónico.',
      'Manejo del catastrofismo.',
      'Terapias de aceptación y compromiso.',
      'Consultoría con psiquiatra cuando se requiera; define si continúa en el mismo nivel o se deriva.',
    ],
  },
  {
    id: 'fibro-tx-ejercicio',
    type: 'criteria',
    tab: 'Tratamiento',
    subtab: 'Ejercicio',
    color: 'cyan',
    order: 35,
    title: 'Actividad física y educación',
    items: [
      'La educación es el punto de inicio de la rehabilitación: da sentido a la condición y reduce la incertidumbre de la etiqueta de fibromialgia.',
      'La actividad física y el ejercicio regular son las intervenciones no farmacológicas con mayor evidencia (dolor, funcionalidad, calidad de vida, fatiga, fuerza, rigidez, sueño y ánimo).',
      'Ninguna modalidad es superior: para favorecer la adherencia, el paciente elige la modalidad con asesoría clínica.',
      'Dosificar con escala de esfuerzo percibido (Borg) a intensidad moderada; ajustar según tolerancia al dolor.',
    ],
  },

  // ───────────────────────────── Tab: Derivación ─────────────────────────────
  {
    id: 'fibro-deriv-requisitos-atencion',
    type: 'criteria',
    tab: 'Derivación',
    color: 'red',
    order: 39,
    title: 'Requisitos a completar en las atenciones (para que la derivación sea pertinente)',
    items: [
      'Diagnóstico de fibromialgia documentado según criterios ACR 2016.',
      'Tiempo de evolución del cuadro registrado.',
      'Dolor medido con escala ENA/EVA: valor basal y en cada control.',
      'Escalas funcionales aplicadas y registradas: PSFS y FIQ-R (basal y seguimiento).',
      'Manejo farmacológico: medicamentos, dosis, resultados y RAM.',
      'Rehabilitación: intervención realizada y sus resultados.',
      'Salud mental: intervención de psicólogo y/o psiquiatría.',
      'Manejo integral con los 3 pilares por al menos 6 meses en APS.',
      'Objetivo claro de la derivación: manejo de dolor, no respuesta al manejo de APS establecido, u otro.',
      '━━━ NOTA ━━━',
      'Estos son los antecedentes que debe contener la SIC y los puntos que evalúa la Pauta de Cotejo. Sin ellos, la derivación se considera no pertinente.',
    ],
  },
  {
    id: 'fibro-deriv-cuando',
    type: 'text',
    tab: 'Derivación',
    order: 40,
    title: 'Cuándo derivar a nivel secundario',
    content:
      'No hay dificultad en el diagnóstico ni tratamiento de la fibromialgia en APS; su derivación rutinaria al nivel secundario no se justifica meramente por el diagnóstico. La SIC se dirige a la especialidad correspondiente por diagnóstico diferencial, falta de mejora con el manejo integral de APS, y/o patología psiquiátrica sin compensación.',
  },
  {
    id: 'fibro-deriv-sic',
    type: 'criteria',
    tab: 'Derivación',
    color: 'blue',
    order: 41,
    title: 'Requisitos de la SIC',
    items: [
      'Historia detallada de síntomas y signos.',
      'Aplicación de escalas de evaluación.',
      'Tiempo de evolución del cuadro.',
      'Manejo farmacológico y no farmacológico desarrollado.',
      'Objetivo claro de la solicitud: manejo de dolor, no respuesta al manejo de APS establecido, u otro.',
    ],
  },
  {
    id: 'fibro-deriv-reuma',
    type: 'criteria',
    tab: 'Derivación',
    color: 'amber',
    order: 42,
    title: 'Derivación a Reumatología',
    items: [
      'Toda persona que en la evaluación presente alteración de exámenes de laboratorio, signos inflamatorios, dolor puramente articular o síntomas sistémicos que hagan sospechar patología reumatológica.',
      'El reumatólogo definirá la existencia o no de mesenquimopatía; si es negativa, alta y contrarreferencia a APS.',
      '━━━ EXÁMENES A ENVIAR ━━━',
      'Hemograma, VHS, PCR, Creatinina, Perfil Hepático, Perfil Tiroideo e idealmente CK (si está disponible).',
    ],
  },
  {
    id: 'fibro-deriv-fisiatria',
    type: 'criteria',
    tab: 'Derivación',
    color: 'green',
    order: 43,
    title: 'Derivación a Fisiatría',
    items: [
      'Mantener dolor moderado/severo o no presentar disminución de 3 puntos de dolor en escala ENA tras el manejo integral (3 pilares) en APS por 6 meses.',
      'No presentar cambios en la funcionalidad según PSFS (cambio mínimo detectable: 3 puntos en actividad específica y 2 en el promedio).',
      'Y/o según FIQ-R (diferencia mínima clínicamente importante: 14%).',
      'También se derivarán los pacientes que presenten intolerancia a pregabalina y/o duloxetina.',
      'La SIC debe contener el objetivo claro: manejo de dolor, no respuesta al manejo de APS establecido, otro.',
    ],
  },
  {
    id: 'fibro-deriv-psiquiatria',
    type: 'criteria',
    tab: 'Derivación',
    color: 'purple',
    order: 44,
    title: 'Derivación a Psiquiatría',
    items: [
      'Si tras el manejo por el equipo de salud mental no se aprecian mejoras clínicas, se desarrolla una Consultoría.',
      'En la consultoría se define si corresponde o no la derivación a psiquiatra, según el mapa de derivación de salud mental.',
    ],
  },
  {
    id: 'fibro-deriv-contrarreferencia',
    type: 'text',
    tab: 'Derivación',
    order: 45,
    title: 'Contrarreferencia',
    content:
      'En cualquiera de las tres especialidades se ajustará el manejo farmacológico, exámenes u otra intervención. Ante buena respuesta al ajuste de fármacos se contrarreferirá a APS para continuidad del manejo integral, manteniendo la receta del especialista en el HCHM por el período de 1 año. La contrarreferencia incluirá sugerencias para el manejo. En Fisiatría se agenda un control en 6 meses para evaluar la evolución y definir el tratamiento a seguir; si no hay mejora, continúa en tratamiento paralelo en Hospital y APS.',
  },

  // ───────────────────────────── Tab: Flujograma ─────────────────────────────
  {
    id: 'fibro-flujograma',
    type: 'mermaid',
    tab: 'Flujograma',
    color: 'blue',
    order: 50,
    title: 'Flujo de referencia y contrarreferencia',
    description: 'Recorrido del usuario con dolor musculoesquelético persistente entre APS y nivel secundario.',
    content: `flowchart TD
    A["Usuario con dolor ME persistente\\natención médica + exámenes si procede"] --> B["Prueba de sospecha y dx precoz de FBM"]
    B -->|"Sospecha negativa"| C["Continúa manejo en APS\\nsegún diagnóstico — alta"]
    B -->|"Sospecha positiva"| D["Control de otros problemas de salud / ECICEP\\natención 30 min + criterios ACR 2016"]
    D --> E{"¿Sospecha\\nmesenquimopatía?"}
    E -->|"Sí"| F["SIC a Reumatología con exámenes\\n(no excluye manejo paralelo de FBM)"]
    E -->|"No / además FBM"| G{"¿Cumple criterios\\nACR 2016?"}
    G -->|"No"| C
    G -->|"Sí"| H["Inicio manejo multimodal (3 pilares):\\nfarmacológico + rehabilitación + salud mental"]
    H --> I["Control médico a los 3 meses"]
    I --> J{"¿Respuesta refractaria?"}
    J -->|"No"| K["Continúa tratamiento en APS"]
    J -->|"Sí · físico"| L["Evaluar entrega en APS de\\npregabalina y/o duloxetina"]
    J -->|"Sí · salud mental"| M["Consultoría SM"]
    M --> N{"¿Se deriva\\na Psiquiatría?"}
    N -->|"No"| K
    N -->|"Sí"| O["SIC a Psiquiatría"]
    L --> P["Nuevo control ≈6 meses\\ndesde el inicio multimodal"]
    P --> Q{"¿Dolor mod-severo / sin baja\\nde 3 ptos ENA / sin cambios funcionalidad?"}
    Q -->|"No"| K
    Q -->|"Sí · o intolerancia a fármacos"| R["SIC a Fisiatría"]
    F --> S["Atención especialista\\nReumatología / Fisiatría / Psiquiatría"]
    R --> S
    O --> S
    S --> T["Control en 6 meses"]
    T --> U{"¿Mejora\\nfuncionalidad y dolor?"}
    U -->|"Sí"| V["Alta / contrarreferencia a APS"]
    U -->|"No"| W["Continúa en tratamiento\\nparalelo Hospital + APS"]`,
  },

  // ───────────────────────────── Tab: Escalas (subtabs) ─────────────────────────────
  {
    id: 'fibro-escalas-intro',
    type: 'text',
    tab: 'Escalas',
    order: 60,
    title: 'Escalas e instrumentos de evaluación',
    content:
      'Apoyan la evaluación y el seguimiento del manejo no farmacológico en APS. La PSFS y la FIQ-R son las escalas requeridas para fundamentar la derivación a Fisiatría. Se sugiere complementar según criterio clínico.',
  },
  {
    id: 'fibro-escalas-fiqr',
    type: 'criteria',
    tab: 'Escalas',
    subtab: 'FIQ-R',
    color: 'blue',
    order: 61,
    title: 'FIQ-R — Cuestionario Revisado de Impacto de la Fibromialgia',
    items: [
      '21 ítems en 3 dominios: Funcionalidad Física (9 ítems), Impacto Global (2 ítems) y Síntomas (10 ítems).',
      'Escala numérica de 0 a 10 por ítem; puntaje total 0-100 (a mayor puntaje, mayor impacto).',
      'Dominio 1: sumar 9 preguntas y dividir por 3. Dominio 2: solo sumar. Dominio 3: sumar 10 preguntas y dividir por 2.',
      'Cambio mínimo clínicamente importante: 14%.',
    ],
  },
  {
    id: 'fibro-escalas-psfs',
    type: 'criteria',
    tab: 'Escalas',
    subtab: 'PSFS',
    color: 'green',
    order: 62,
    title: 'PSFS — Escala Funcional Específica del Paciente',
    items: [
      'El paciente escoge 1 a 3 (o más) actividades afectadas por el problema actual.',
      'Cada actividad se puntúa 0 (incapaz de realizar) a 10 (al nivel previo a la lesión).',
      'Puntuación total = suma de actividades / número de actividades.',
      'Cambio mínimo detectable: 2 puntos en la media; 3 puntos en una sola actividad.',
    ],
  },
  {
    id: 'fibro-escalas-pcs',
    type: 'criteria',
    tab: 'Escalas',
    subtab: 'Catastrofización',
    color: 'amber',
    order: 63,
    title: 'PCS — Escala de Catastrofización del Dolor',
    items: [
      '13 frases sobre pensamientos y sentimientos al sentir dolor; cada una se puntúa de 0 (nunca) a 4 (siempre).',
      'Más de 30 puntos representa un nivel clínicamente significativo de catastrofización del dolor.',
    ],
  },
  {
    id: 'fibro-escalas-tsk',
    type: 'criteria',
    tab: 'Escalas',
    subtab: 'Kinesiofobia',
    color: 'purple',
    order: 64,
    title: 'TSK-11 SV — Escala de Tampa para Kinesiofobia',
    items: [
      '11 afirmaciones; cada una de 1 (totalmente en desacuerdo) a 4 (totalmente de acuerdo).',
      'Puntuación 11 (kinesiofobia insignificante) a 44 (miedo grave a experimentar dolor al moverse).',
      'Mide el miedo al movimiento relacionado con el dolor.',
    ],
  },
  {
    id: 'fibro-escalas-tests',
    type: 'criteria',
    tab: 'Escalas',
    subtab: 'Tests funcionales',
    color: 'cyan',
    order: 65,
    title: 'Tests funcionales',
    items: [
      'Chair Stand Test (sentarse/levantarse 30 s): fuerza del tren inferior. Cambio mínimo detectable: 3 repeticiones.',
      'Test de marcha 6 minutos: respuesta integrada al ejercicio. Cambio mínimo detectable: 65,2 m.',
      'Timed Up and Go (TUG): riesgo de caídas. Normal <=10 s; riesgo leve 11-20 s; alto riesgo >20 s.',
      'Test de agarre (dinamómetro): fuerza de prensión; registrar el mayor de 3 intentos. Cambio mínimo detectable: 4,04 kg.',
    ],
  },

  // ───────────────────────────── Tab: Pauta de Cotejo ─────────────────────────────
  {
    id: 'fibro-cotejo-indicador',
    type: 'criteria',
    tab: 'Pauta de Cotejo',
    color: 'blue',
    order: 70,
    title: 'Indicador de proceso',
    items: [
      'Porcentaje de SIC con diagnóstico de fibromialgia pertinentes derivadas a Fisiatría del HCHM desde HSCF y CESFAM.',
      'Numerador: N° de SIC con diagnóstico de fibromialgia pertinentes a Fisiatría.',
      'Denominador: N° total de SIC con diagnóstico de fibromialgia a Fisiatría × 100.',
      'Umbral: 90%. Periodicidad: cuatrimestral. Fuente: SIC del MLE.',
      'SIC pertinente = manejo integral (3 pilares: rehabilitación, salud mental y tratamiento farmacológico) en APS por 6 meses sin cambios en la funcionalidad según PSFS.',
    ],
  },
  {
    id: 'fibro-cotejo-pauta',
    type: 'criteria',
    tab: 'Pauta de Cotejo',
    color: 'green',
    order: 71,
    title: 'Pauta de cotejo — requisitos de cumplimiento de la SIC',
    items: [
      'Diagnóstico de fibromialgia.',
      'SIC en MLE.',
      'Tratamiento farmacológico en APS: medicamentos, dosis, resultados, RAM.',
      'Rehabilitación: hay intervención y resultados.',
      'Salud mental: intervención de psicólogo/psiquiatría.',
      'Objetivo claro de la derivación: manejo de dolor, no respuesta al manejo de APS establecido, otro.',
    ],
  },
];

const topicPayload = {
  name: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: 'Reumatología',
  status: 'published',
  title: TOPIC_NAME,
  description:
    'Protocolo SSÑ de abordaje clínico, diagnóstico (ACR 2016), manejo multidisciplinario en APS y criterios de referencia/contrarreferencia de fibromialgia.',
  tags: ['Fibromialgia', 'Reumatología', 'Dolor crónico', 'Referencia y contrarreferencia', 'APS', 'Protocolo SSÑ'],
  order: 50,
  authors: ['Servicio de Salud Ñuble'],
  published_date: today,
  last_updated: today,
  layout_mode: 'protocol',
  tipo_contenido: ['contenido_medico'],
  clasificacion_ges: null,
  has_local_protocol: false,
  content_blocks,
  related_topics: [],
  related_tools: [
    { tool_id: 'fibromyalgia-acr', label: 'Fibromialgia — Criterios diagnósticos ACR 2016' },
  ],
  clinical_summary:
    'Fibromialgia: dolor musculoesquelético generalizado crónico con fatiga, sueño no reparador y síntomas cognitivos. Diagnóstico clínico por criterios ACR 2016 (IDG + ESS). Manejo integral de 3 pilares en APS.',
  diagnostic_orientation:
    'Aplicar lista de chequeo de sospecha (>=3/6) y criterios ACR 2016: dolor en >=4/5 regiones, IDG/ESS según umbral, síntomas >=3 meses. Descartar mesenquimopatía si hay signos inflamatorios o exámenes alterados.',
  complementary_studies:
    'Solo para diagnóstico diferencial / sospecha de mesenquimopatía: Hemograma, VHS, PCR, Creatinina, Perfil Hepático, Perfil Tiroideo e idealmente CK.',
  initial_treatment:
    'Manejo integral en APS: farmacológico (paracetamol, meloxicam, amitriptilina, ciclobenzaprina, ISRS según ánimo), rehabilitación con educación + ejercicio, y salud mental (TCC). En refractarios al manejo multimodal (≥3 meses), iniciar en APS pregabalina (37,5–75 → 150 mg/día) y/o duloxetina (30 → 60 mg/día), con CIE-10 M79.7 en Rayen.',
  protocol_code: 'PRO-074',
  protocol_edition: 'Edición Segunda',
  protocol_date: '2026-02-01',
  protocol_validity: 'Febrero 2031',
  protocol_authors: [
    { name: 'Marcelo Pérez Gaete', role: 'Jefe Servicio de Medicina Física y Rehabilitación HCHM (elaboración)' },
    { name: 'Dra. Daniela Sandoval Navarrete', role: 'Fisiatra HCHM (elaboración)' },
    { name: 'Paula Herrera Oñate', role: 'Kinesióloga Sección Gestión de Rehabilitación y Salud Respiratoria SSÑ (elaboración)' },
    { name: 'Andrea Muñoz Parra', role: 'Jefa Sección Gestión de Rehabilitación y Salud Respiratoria SSÑ (revisión)' },
    { name: 'Susana Rocha Castillo', role: 'Jefa Depto. de Gestión Farmacéutica SSÑ (revisión)' },
    { name: 'Marianela Sandoval Bustos', role: 'Directora de Atención Primaria SSÑ (revisión)' },
    { name: 'Elizabeth Abarca Triviño', role: 'Directora Servicio de Salud Ñuble (aprobación)' },
  ],
  protocol_objective:
    'Establecer criterios de referencia y contrarreferencia de personas con fibromialgia entre APS y nivel secundario, y orientar el manejo multidisciplinario en APS.',
  protocol_participants: ['Médicos/as APS', 'Kinesiólogos/as y T.O.', 'Psicólogos/as', 'SOME', 'Especialistas: Fisiatría, Reumatología, Psiquiatría'],
  protocol_flowchart: [],
  protocol_algorithm: [],
  protocol_medications: [],
};

async function uploadPdf() {
  if (!PDF_PATH) {
    console.log('PDF_PATH no definido — se omite la subida del PDF (protocol_file_url quedará null).');
    return null;
  }
  const bytes = await readFile(PDF_PATH);
  const { error } = await supabase.storage.from('files').upload(STORAGE_PATH, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('files').getPublicUrl(STORAGE_PATH);
  return data.publicUrl;
}

function logDistribution() {
  const byTab = {};
  for (const b of content_blocks) {
    if (b.type === 'protocol_header') continue;
    const key = b.subtab ? `${b.tab} › ${b.subtab}` : b.tab;
    byTab[key] = (byTab[key] || 0) + 1;
  }
  console.log('Distribución de bloques por pestaña:');
  for (const [tab, n] of Object.entries(byTab)) console.log(`  ${tab}: ${n}`);
  console.log(`  TOTAL: ${content_blocks.length} bloques (incluye header).`);
}

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name')
    .eq('category_id', CATEGORY_ID)
    .in('name', [TOPIC_NAME, ...LEGACY_NAMES])
    .limit(1);
  if (findError) throw findError;
  const existingTopic = existing?.[0] || null;

  const protocol_file_url = await uploadPdf();
  const payload = { ...topicPayload, protocol_file_url };

  logDistribution();

  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'dry-run', existing: existingTopic }, null, 2));
    console.log('\nDry-run: nada se escribió. Ejecuta con --apply para aplicar.');
    return;
  }

  if (existingTopic?.id) {
    const { data, error } = await supabase
      .from('topics')
      .update(payload)
      .eq('id', existingTopic.id)
      .select('id,name')
      .single();
    if (error) throw error;
    console.log(JSON.stringify({ action: 'updated', topic: data }, null, 2));
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id,name')
    .single();
  if (error) throw error;
  console.log(JSON.stringify({ action: 'inserted', topic: data }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
