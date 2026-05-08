/**
 * Crea topic "Sedación Paliativa" en categoría
 * Dependencia Severa, Cuidados Paliativos y Alivio del Dolor.
 *
 * Fuente: Marcos Gómez Sancho (coord.) y col. Guía de Sedación Paliativa.
 * Organización Médica Colegial / SECPAL — 2021.
 *
 * Uso:  node scripts/create-paliativos-sedacion-v1.mjs
 *       node scripts/create-paliativos-sedacion-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f4320';
const TOPIC_NAME  = 'Sedación Paliativa';
const TOPIC_DESCRIPTION = 'Disminución deliberada de la conciencia para aliviar síntomas refractarios al final de la vida.';
const TOPIC_TAGS = ['Sedación', 'Síntomas refractarios', 'Final de vida'];

const content_blocks = [
  // ── HEADER ───────────────────────────────────────────────────────────────
  {
    id: 'sed-header',
    type: 'protocol_header',
    ordinario: 'REFERENCIA CLÍNICA',
    title: 'Guía de Sedación Paliativa',
    institution: 'Organización Médica Colegial — SECPAL',
    department: 'Observatorio Atención Médica al final de la vida',
    date: 'Coord: Marcos Gómez Sancho — Julio 2021',
    summary:
      'Síntesis de la Guía de Sedación Paliativa de la OMC y SECPAL: definiciones, indicaciones, diferencia con eutanasia, procedimiento, consentimiento informado, esquemas farmacológicos (midazolam, levomepromacina, propofol, fenobarbital), monitorización con escalas Ramsay y RASS y consideraciones pediátricas — adaptado al arsenal HCSFB.',
    order: 1,
  },

  // ── PESTAÑA 1: CONCEPTOS ────────────────────────────────────────────────
  {
    id: 'sed-definicion',
    type: 'text',
    tab: 'Conceptos',
    color: 'blue',
    order: 10,
    title: 'Definición',
    content:
      'La sedación paliativa es la disminución deliberada de la conciencia del enfermo, una vez obtenido el consentimiento, mediante fármacos en dosis proporcionadas, con el objetivo de evitar un sufrimiento insostenible causado por uno o más síntomas refractarios. ' +
      'Sigue siempre el principio de proporcionalidad: alcanzar el nivel de sedación suficiente para aliviar el sufrimiento, no más profundo de lo necesario.',
  },
  {
    id: 'sed-tipos',
    type: 'criteria',
    tab: 'Conceptos',
    color: 'purple',
    order: 11,
    title: 'Tipos de sedación paliativa',
    items: [
      'Sedación paliativa — concepto general; puede ser superficial o profunda, transitoria o continua',
      '~ Indicada en cualquier momento de enfermedad avanzada con síntoma refractario',
      'Sedación paliativa en la agonía — últimos días u horas de vida',
      '~ Continua y tan profunda como sea necesario para aliviar el sufrimiento intenso',
      'Sedación intermitente — pautada de forma transitoria',
      '~ Se retira en plazo determinado para reevaluar la persistencia del sufrimiento',
      '~ Útil en síntomas que pueden tener carácter reversible',
    ],
  },
  {
    id: 'sed-glosario',
    type: 'criteria',
    tab: 'Conceptos',
    color: 'amber',
    order: 12,
    title: 'Glosario clínico',
    items: [
      '━━━ ENFERMEDAD INCURABLE AVANZADA ━━━',
      'Curso gradual y progresivo, sin respuesta a tratamiento curativo',
      '~ Evoluciona a la muerte a corto o medio plazo en contexto de fragilidad y pérdida de autonomía',
      '━━━ SITUACIÓN DE AGONÍA ━━━',
      'Precede a la muerte cuando ésta es gradual',
      '~ Deterioro físico intenso, debilidad extrema, trastornos cognitivos, dificultad para ingesta',
      '~ Pronóstico de vida en horas o pocos días',
      '━━━ SÍNTOMA REFRACTARIO ━━━',
      'No puede ser controlado con tratamientos disponibles',
      '~ Aplicados por médicos expertos, en plazo razonable',
      '~ El alivio del sufrimiento requiere disminuir la conciencia (sedación paliativa)',
      '━━━ CUIDADOS PALIATIVOS — BUENA PRÁCTICA ━━━',
      'Atención integral cuando la enfermedad no responde a tratamiento curativo',
      '~ Afirman la vida y consideran la muerte un proceso normal',
      '~ Ni aceleran ni retrasan la muerte',
      '~ Aplicación de medidas terapéuticas proporcionadas, evitando obstinación o abandono',
    ],
  },

  // ── PESTAÑA 2: INDICACIONES ─────────────────────────────────────────────
  {
    id: 'sed-indicaciones-criterios',
    type: 'criteria',
    tab: 'Indicaciones',
    color: 'red',
    order: 20,
    title: 'Cuándo está indicada',
    content: 'Para enfermos con sufrimiento intolerable que no han respondido a los tratamientos adecuados. La condición de refractariedad debe demostrarse antes de plantear la sedación.',
    items: [
      '━━━ SÍNTOMAS REFRACTARIOS MÁS FRECUENTES ━━━',
      'Delirium agitado refractario',
      'Disnea terminal',
      'Dolor refractario',
      'Náuseas y vómitos persistentes',
      'Hemorragia masiva (urgencia, sedación de emergencia)',
      'Crisis de pánico o ansiedad refractaria',
      'Sufrimiento existencial refractario',
      '━━━ EN SITUACIÓN DE AGONÍA ━━━',
      'La indicación puede ser la simple percepción de sufrimiento del paciente',
      '~ Cuando éste persiste a pesar de dosis adecuadas de opioide',
      '~ No es aceptable esperar más fármacos en contexto de agonía con sufrimiento activo',
      '━━━ DOCUMENTACIÓN OBLIGATORIA EN FICHA ━━━',
      'Naturaleza e intensidad de los síntomas',
      'Medidas previas usadas (fármacos, dosis, recursos humanos y materiales)',
      'Justificación de refractariedad',
      'En caso de duda: solicitar valoración de profesional experto en control de síntomas',
    ],
  },
  {
    id: 'sed-existencial',
    type: 'text',
    tab: 'Indicaciones',
    color: 'gray',
    order: 21,
    title: 'Sufrimiento existencial refractario',
    content:
      'Sentimiento de que la propia vida está vacía o sin sentido en el contexto de enfermedad avanzada. ' +
      'Algunos pacientes lo perciben como insoportable y desean la muerte como salida. ' +
      'No se ajusta del todo a la interpretación clásica del síntoma refractario tributario de sedación. ' +
      'Solo puede catalogarse como refractario tras evaluación de un equipo con experiencia, cuando los cuidados psicológicos y espirituales aplicados por tiempo razonable no logran aliviarlo. ' +
      'En estos casos suele indicarse sedación provisional, transitoria o intermitente; puede llegar a ser definitiva si el paciente está en agonía. ' +
      'Requiere extraordinaria competencia técnica, ética y legal.',
  },
  {
    id: 'sed-no-indicada',
    type: 'alert',
    tab: 'Indicaciones',
    color: 'red',
    order: 22,
    title: 'Cuándo NO está indicada (abuso)',
    content:
      'No es aceptable la sedación: (1) en pacientes sin síntomas refractarios; (2) con dosis que superan lo necesario para alivio adecuado, con intención de acelerar la muerte; (3) como alternativa a la falta de competencia del equipo; (4) para aliviar la pena de la familia o la carga laboral del personal asistencial; (5) en síntomas difíciles que aún no han demostrado refractariedad.',
  },

  // ── PESTAÑA 3: SEDACIÓN vs EUTANASIA ────────────────────────────────────
  {
    id: 'sed-vs-eutanasia',
    type: 'criteria',
    tab: 'Sedación vs Eutanasia',
    color: 'blue',
    order: 30,
    title: 'Diferencias éticas y deontológicas',
    content: 'La frontera está en la intención, el procedimiento y el resultado.',
    items: [
      '━━━ SEDACIÓN PALIATIVA ━━━',
      'Intención: disminuir el nivel de conciencia',
      '~ Para que el paciente no perciba el síntoma refractario',
      'Procedimiento: dosis mínima necesaria de fármacos sedantes',
      '~ Titulación proporcional al alivio buscado',
      'Resultado: alivio del sufrimiento, sin acelerar la muerte como objetivo',
      '~ La muerte llega por la enfermedad de base',
      '━━━ EUTANASIA ━━━',
      'Intención: provocar deliberadamente la muerte',
      '~ Para terminar con el sufrimiento del paciente',
      'Procedimiento: fármacos a dosis letales',
      '~ Sin titulación proporcional al síntoma',
      'Resultado: la muerte directa por el fármaco',
      '━━━ CONCLUSIÓN ÉTICA ━━━',
      'La sedación bien indicada y administrada es buena práctica médica',
      '~ Es ética y deontológicamente obligatoria cuando hay síntoma refractario',
      '~ NO admite objeción de conciencia',
    ],
  },

  // ── PESTAÑA 4: PROCEDIMIENTO ───────────────────────────────────────────
  {
    id: 'sed-procedimiento',
    type: 'flowchart',
    tab: 'Procedimiento',
    color: 'blue',
    order: 40,
    title: 'Procedimiento — pasos clínicos obligatorios',
    content: 'Aplicable en hospital o domicilio. Cada paso debe quedar reflejado en la historia clínica.',
    details: [
      'Verificar indicación: sufrimiento intolerable causado por síntoma refractario',
      '~ Si hay duda: consultar con profesional experto en control de síntomas',
      '~ Documentar la naturaleza, intensidad y medidas previas',
      'Obtener consentimiento del paciente o representantes',
      '~ Idealmente planificado con anticipación cuando el paciente está sereno',
      '~ Informar a la familia para que comprenda y acompañe',
      'Procurar que el paciente haya satisfecho asuntos pendientes',
      'Prescribir fármacos adecuados a dosis proporcionadas',
      '~ Empezar por la dosis mínima eficaz e ir titulando',
      'Evaluación continuada supervisada por el médico responsable',
      '~ Aplicar Escala de Ramsay modificada o RASS',
      '~ Registrar evolución: temperatura, secreciones, FR, FC, diámetro pupilar',
      'Mantener cuidados básicos exigidos por la dignidad (higiene, posicionamiento, hidratación si procede)',
      'Acompañar a la familia: presencia, comprensión, disponibilidad y privacidad',
      '~ Transmitir que el enfermo adecuadamente sedado no sufre',
    ],
  },
  {
    id: 'sed-consentimiento',
    type: 'criteria',
    tab: 'Procedimiento',
    color: 'amber',
    order: 41,
    title: 'Consentimiento informado',
    items: [
      '━━━ A FAVOR DEL CONSENTIMIENTO ━━━',
      'Riesgo de la sedación profunda en paciente frágil',
      'Pérdida posiblemente definitiva de la conciencia',
      'Permite al paciente concluir asuntos pendientes y despedirse',
      '━━━ EN CONTRA (limitaciones) ━━━',
      'Impacto emocional brusco al conocer mal pronóstico inmediato',
      'En el momento de necesitar sedación, el paciente puede no tener capacidad cognitiva intacta',
      '━━━ SOLUCIÓN: PLANIFICACIÓN ANTICIPADA ━━━',
      'Esbozar verbalmente la posibilidad cuando el paciente está sereno y libre de síntomas',
      '~ Presentarla como herramienta médica conocida que garantiza ausencia de sufrimiento',
      '~ Puede requerir varias entrevistas',
      'Registrar en la ficha: información dada, comprensión del paciente, preferencias',
      'En pediatría (< 16 años): consentimiento por representación + asentimiento del menor según madurez',
    ],
  },
  {
    id: 'sed-equipo',
    type: 'text',
    tab: 'Procedimiento',
    color: 'gray',
    order: 42,
    title: 'Implicaciones para el equipo',
    content:
      'Tomar la decisión de sedar no es sencillo. Implica reconocer que no se puede aliviar el síntoma de otra forma, disminuir la conciencia posiblemente de forma definitiva, sostener una conversación difícil con paciente y familia y manejar fármacos con rango terapéutico estrecho. ' +
      'Recomendaciones: tomar las decisiones en equipo, consultar a colegas ante mínima duda, derivar a comité de ética asistencial cuando hay confrontación entre opinión del paciente/familia y criterio médico.',
  },

  // ── PESTAÑA 5: TRATAMIENTO FARMACOLÓGICO ───────────────────────────────
  {
    id: 'sed-eleccion-farmaco',
    type: 'text',
    tab: 'Fármacos',
    color: 'blue',
    order: 50,
    title: 'Elección del fármaco',
    content:
      'Primera opción: midazolam (excepto en delirium hiperactivo, donde levomepromacina es la primera opción). ' +
      'Si fracasa la monoterapia: combinar midazolam + levomepromacina. ' +
      'Si la combinación falla: fenobarbital SC (en domicilio) o propofol EV (en hospital). ' +
      'En sedación en la agonía: valorar retirar fármacos no necesarios y la hidratación/nutrición artificiales, salvo razón expresa para mantenerlos.',
  },
  {
    id: 'sed-midazolam-sc',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'green',
    order: 51,
    title: 'Midazolam SC — primera línea',
    content: 'HCSFB: ampolla 5 mg/mL (carro de paro). Inicio de acción SC: 10–15 min. Vida media 2–5 h. Pautar siempre en mg, no en mL.',
    details: [
      '━━━ INDUCCIÓN ━━━',
      'Naive a benzodiacepinas: 2,5–5 mg SC en bolo, individualizar según fragilidad',
      '~ Repetir dosis igual a la inicial si persiste agitación o síntoma refractario',
      '~ Tantas dosis de rescate como sean necesarias hasta lograr sedación',
      'Tolerante (uso previo de benzodiacepinas): inducción 5–10 mg SC',
      '━━━ TRAS 24 H — INFUSIÓN CONTINUA ━━━',
      'Sumar todas las dosis (inducción + rescates) administradas en las primeras 24 h',
      '~ Cargar el infusor de 24 h con esa cantidad total',
      '~ O dividir entre 24 para obtener mg/h por bomba de infusión',
      'Rescate posterior: 1/6 de la dosis diaria total, repetible',
      '━━━ DOSIS HABITUALES ━━━',
      'Inicio: 0,5–1 mg/h',
      'Efectiva habitual: 1–20 mg/h',
      '~ No se recomiendan dosis > 180 mg/día',
    ],
  },
  {
    id: 'sed-midazolam-ev',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'green',
    order: 52,
    title: 'Midazolam EV — urgencia',
    content: 'Reservada para urgencias (asfixia, hemorragia masiva) o pacientes con vía venosa ya canalizada. Inicio en segundos.',
    details: [
      'Bolo lento 1,5–3,5 mg EV',
      '~ Repetir cada 5 min hasta nivel mínimo de sedación con control del síntoma',
      '~ La suma de las dosis usadas = dosis de inducción',
      'Infusión continua durante las primeras 24 h: dosis de inducción × 6',
      'Rescate EV: misma dosis que la inducción, tantas veces como precise',
      'Tras 24 h: recalcular ritmo de infusión (igual que en SC)',
    ],
  },
  {
    id: 'sed-levomepromacina',
    type: 'criteria',
    tab: 'Fármacos',
    color: 'red',
    order: 53,
    title: 'Levomepromacina — primera línea en delirium',
    items: [
      'NO disponible en arsenal HCSFB',
      '~ Si se requiere: gestionar acceso o derivar a centro con disponibilidad',
      '━━━ DOSIFICACIÓN REFERENCIAL (presentación: ampolla 25 mg/1 mL) ━━━',
      'Si paciente ya tiene midazolam: reducir éste 50% al iniciar levomepromacina',
      '~ Bajar progresivamente midazolam según respuesta',
      'Inducción SC: 12,5–25 mg cada 6–8 h',
      '~ Vida media 15–30 h',
      'Mantención por infusión continua: ~100 mg/día',
      '~ Dosis techo aproximada: 300 mg/día',
      '━━━ ALTERNATIVA EV: CLORPROMAZINA ━━━',
      'HCSFB: comp 25/100 mg + sol inyectable 12,5 mg/mL (CPU)',
      '~ NO administrar por vía subcutánea (riesgo de necrosis)',
      'Inducción EV: 12,5–25 mg cada 6–8 h',
      'Mantención: 12,5–50 mg cada 6–8 h, dosis techo 300 mg/día',
    ],
  },
  {
    id: 'sed-fenobarbital',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'orange',
    order: 54,
    title: 'Fenobarbital SC — refractarios en domicilio',
    content: 'HCSFB: comp 100 mg (no hay solución inyectable en arsenal HCSF; gestionar disponibilidad por farmacia para uso paliativo).',
    details: [
      'Antes de iniciar: suspender benzodiacepinas y neurolépticos',
      '~ Reducir opioide al menos 50%',
      'Dosis inicial de inducción: 100 mg',
      '~ Esperar al menos 2 h para concentración plasmática máxima',
      'Dosis total primer día: ~600 mg en perfusión continua SC',
      'Ajustar en días sucesivos hasta sedación adecuada',
    ],
  },
  {
    id: 'sed-propofol',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'red',
    order: 55,
    title: 'Propofol EV — uso hospitalario por personal experto',
    content: 'Anestésico ultracorto. Inicio 30 segundos, duración 5 min, vida media plasmática 40–60 min. Requiere supervisión por médico con experiencia en su manejo.',
    details: [
      '━━━ PREPARACIÓN ━━━',
      'Propofol 10 mg/mL: usar puro o diluido en SG 5% o SF 0,9% (frascos de vidrio)',
      'Agitar el envase antes; usar solo soluciones homogéneas y envases intactos',
      '━━━ MITIGAR DOLOR EN INYECCIÓN ━━━',
      'Acceso venoso central preferible',
      '~ Lidocaína 1% 1 mL EV antes del propofol (HCSFB sol inyectable 2%)',
      '~ O mezclar lidocaína 20 mg/200 mg propofol inmediatamente antes de iniciar',
      '━━━ INFUSIÓN ━━━',
      'Inicio: 0,5–1 mg/kg/h EV',
      '~ Incrementar 0,25–0,5 mg/kg/h cada 5–10 min',
      '~ Dosis efectiva habitual: 1–2 mg/kg/h',
      'Para sedación rápida: bolo a 1 mg/kg/min por 2–5 min',
      '━━━ INDUCCIÓN POR BOLOS (alternativa) ━━━',
      'Bolo 0,25–0,5 mg/kg EV lento en 3–5 min, repetible cada 5–10 min',
      '~ Mantención: 0,5–1 mg/kg/h (500–1100 mg/día)',
      '~ Rescate: 50% de la dosis de inducción',
      '━━━ MONITORIZACIÓN ━━━',
      'Estricta en primeras horas; luego controles a 2, 6 y 12 h',
      'Si sobre-sedación o depresión respiratoria: suspender 2–3 min y reiniciar a dosis menor',
      'Si refractariedad a 4 mg/kg/h: suplementar con midazolam SC',
      '━━━ AJUSTES ━━━',
      'Reducir 20–30% en ancianos, debilitados o hipovolémicos',
    ],
  },
  {
    id: 'sed-coadyuvantes',
    type: 'criteria',
    tab: 'Fármacos',
    color: 'amber',
    order: 56,
    title: 'Otros fármacos durante la sedación',
    items: [
      '━━━ EN SEDACIÓN PALIATIVA (reversible) ━━━',
      'Mantener todos los fármacos pautados previamente, salvo extraordinarios',
      '━━━ EN SEDACIÓN EN AGONÍA — MANTENER ESENCIALES ━━━',
      'Anticolinérgicos para secreciones bronquiales (estertores premortem)',
      '~ Escopolamina butilbromuro 20–40 mg cada 8 h SC/EV — HCSFB ampolla 20 mg/mL (CPU)',
      'Opioides: NO retirar; reducir dosis si procede',
      '~ Morfina mantiene capacidad sedante intrínseca útil en este contexto',
      '━━━ FÁRMACOS A SUSPENDER EN AGONÍA ━━━',
      'Insulina, hipoglicemiantes, antibióticos, antirretrovirales, antidepresivos, antiarrítmicos, diuréticos, laxantes, broncodilatadores',
      '~ Los corticoides pueden mantenerse en algunos casos',
    ],
  },

  // ── PESTAÑA 6: MONITOREO ───────────────────────────────────────────────
  {
    id: 'sed-evaluacion',
    type: 'criteria',
    tab: 'Monitoreo',
    color: 'blue',
    order: 60,
    title: 'Recomendaciones de seguimiento',
    items: [
      'Revisar nivel de sedación periódicamente con escala de Ramsay modificada o RASS',
      'Evaluar y registrar en ficha: temperatura, secreciones, frecuencia respiratoria, frecuencia cardíaca, diámetro pupilar',
      'Evaluar continuamente el estado emocional de la familia',
      '~ Proporcionar presencia, comprensión, disponibilidad y privacidad (habitación individual)',
      '~ Transmitir que el enfermo adecuadamente sedado no sufre',
    ],
  },
  {
    id: 'sed-ramsay',
    type: 'criteria',
    tab: 'Monitoreo',
    color: 'green',
    order: 61,
    title: 'Escala de Ramsay modificada (Ramsay ICO)',
    items: [
      'Nivel I — Agitado, angustiado',
      'Nivel II — Tranquilo, orientado y colaborador',
      'Nivel IIIa — Respuesta agitada a estímulos verbales',
      'Nivel IIIb — Respuesta tranquila a estímulos verbales',
      'Nivel IVa — Respuesta rápida y agitada a estímulos dolorosos',
      'Nivel IVb — Respuesta rápida y tranquila a estímulos dolorosos',
      'Nivel V — Respuesta perezosa a estímulos dolorosos',
      'Nivel VI — Sin respuesta',
    ],
  },
  {
    id: 'sed-rass',
    type: 'criteria',
    tab: 'Monitoreo',
    color: 'purple',
    order: 62,
    title: 'Escala RASS (Richmond Agitation-Sedation Scale)',
    items: [
      '━━━ POSITIVOS (agitación) ━━━',
      '+4 Combativo — violento, peligro directo para los profesionales',
      '+3 Muy agitado — tira o se quita la sonda o catéter, agresivo',
      '+2 Agitado — movimientos no intencionados, intenta quitarse mascarilla u oxígeno',
      '+1 Inquieto — ansioso pero sin agresividad en los movimientos',
      '━━━ NEUTRO ━━━',
      '0 Despierto y calmado',
      '━━━ NEGATIVOS (sedación) — estimulación verbal ━━━',
      '-1 Adormilado — abre ojos y mantiene contacto visual ≥ 10 s con la voz',
      '-2 Sedación ligera — abre ojos < 10 s con la voz',
      '-3 Sedación moderada — se mueve o abre ojos pero sin contacto visual',
      '━━━ NEGATIVOS — estimulación física ━━━',
      '-4 Sedación profunda — sin respuesta verbal, responde con movimientos al estímulo físico',
      '-5 Inconsciente — sin respuesta a la voz ni a estímulos físicos',
    ],
  },
  {
    id: 'sed-rass-procedimiento',
    type: 'flowchart',
    tab: 'Monitoreo',
    color: 'orange',
    order: 63,
    title: 'Procedimiento de evaluación RASS',
    details: [
      'Observar al paciente',
      '~ Si está alerta, inquieto o agitado: puntuación de 0 a +4',
      'Si no está alerta: decir su nombre y pedirle que abra los ojos y mire',
      '~ Despierta y mantiene contacto visual: -1',
      '~ Despierta con contacto visual pero no lo mantiene: -2',
      '~ Movimiento como respuesta a la voz, sin contacto visual: -3',
      'Si no responde a estímulos verbales: estimular físicamente (hombro o frotar esternón)',
      '~ Realiza movimiento ante estimulación física: -4',
      '~ Sin respuesta a ninguna estimulación: -5',
    ],
  },

  // ── PESTAÑA 7: PEDIATRÍA ───────────────────────────────────────────────
  {
    id: 'sed-pediatria',
    type: 'text',
    tab: 'Pediatría',
    color: 'pink',
    order: 70,
    title: 'Consideraciones especiales',
    content:
      'En enfermedad avanzada en edad pediátrica, los síntomas refractarios más frecuentes son dolor y disnea; el delirium es excepcional y el sufrimiento existencial es difícil de evaluar. ' +
      'La valoración requiere colaboración estrecha con los padres y observación minuciosa del equipo. ' +
      'El consentimiento informado es por representación hasta los 16 años, pero se debe informar al menor según su madurez (criterio subjetivo + edad) para que participe en las decisiones, atendiendo siempre al mayor beneficio para su vida o salud. ' +
      'Es conveniente recabar consentimiento escrito de padres o representantes, archivado en ficha clínica.',
  },
  {
    id: 'sed-pediatria-farmacos',
    type: 'criteria',
    tab: 'Pediatría',
    color: 'pink',
    order: 71,
    title: 'Esquemas farmacológicos pediátricos',
    items: [
      '━━━ MIDAZOLAM — primera línea ━━━',
      'Inducción: 0,05 mg/kg (máx 1,5–3 mg)',
      '~ En niños con enfermedades neurológicas o debilidad muscular: 0,025 mg/kg',
      'Mantención: 0,05–0,1 mg/kg/h (máx 0,6–0,8 mg/kg/h)',
      '━━━ LEVOMEPROMAZINA — segunda línea (uso menos frecuente) ━━━',
      'IV o SC: 0,25–1 mg/kg cada 24 h (continua o cada 8 h)',
      '~ Dosis máxima en niños: 25 mg/24 h',
      '━━━ FENOBARBITAL — tercera línea / status convulsivo ━━━',
      'Antes de administrar: suspender benzodiacepinas y neurolépticos, reducir opioides 50%',
      '~ No mezclar con otros fármacos',
      'Inducción IV: 1–6 mg/kg, incrementar 1–2 mg/kg cada 3–5 min',
      'Mantención IV: 1 mg/kg/h, ajustar según respuesta',
      '━━━ PROPOFOL — solo personal experto, hospital ━━━',
      'Vía exclusiva EV; no mezclar con otros fármacos',
      '~ Antes: retirar benzodiacepinas, neurolépticos y reducir opioides 50%',
      'Inducción: 0,25–0,5 mg/kg, repetir si necesario',
      'Mantención: 1–4 mg/kg/h',
      'Rescate: 50% de la dosis de inducción',
      '━━━ FÁRMACOS ACOMPAÑANTES ━━━',
      'Mantener opioides para dolor o disnea de base',
      'Mantener escopolamina para secreciones',
      'Igual que en adultos',
    ],
  },

  // ── PESTAÑA 8: ALGORITMO ───────────────────────────────────────────────
  {
    id: 'sed-mermaid',
    type: 'mermaid',
    tab: 'Algoritmo',
    color: 'purple',
    order: 80,
    title: 'Algoritmo de decisión — sedación paliativa',
    diagram: `flowchart TD
  A[Paciente paliativo<br/>con síntoma intenso] --> B{Síntoma controlable<br/>con tratamiento estándar?}
  B -->|Sí| C[Optimizar tratamiento<br/>específico]
  B -->|No| D{Refractariedad demostrada?<br/>medidas previas + experto<br/>+ tiempo razonable}
  D -->|No| E[Continuar manejo<br/>+ consulta a especialista]
  D -->|Sí| F{Consentimiento disponible?<br/>paciente o representantes}
  F -->|No, capacidad intacta| G[Conversar con el paciente<br/>Planificación anticipada<br/>Recoger preferencias]
  F -->|Sí| H{Tipo de sedación}
  G --> H
  H -->|Síntoma reversible| I[Sedación intermitente<br/>Reevaluar al retirar]
  H -->|Agonía + síntoma severo| J[Sedación continua<br/>profunda]
  H -->|Delirium hiperactivo| K[Levomepromacina<br/>primera elección]
  I --> L[Midazolam SC<br/>2,5-5 mg inducción<br/>Titular hasta control]
  J --> L
  K --> M[Levomepromacina<br/>12,5-25 mg c/6-8h<br/>+ reducir midazolam 50% si lo tenía]
  L --> N{Respuesta?}
  M --> N
  N -->|Sí| O[Mantención según<br/>dosis efectiva 24h<br/>+ rescates 1/6 dosis diaria]
  N -->|No, refractario| P{Asociar segundo fármaco}
  P -->|Domicilio| Q[Fenobarbital SC<br/>100 mg inducción<br/>600 mg/día primer día]
  P -->|Hospital| R[Propofol EV<br/>0,5-1 mg/kg/h<br/>solo personal experto]
  Q --> O
  R --> O
  O --> S[Monitoreo continuo<br/>Ramsay o RASS<br/>FR / FC / secreciones / pupilas]
  S --> T{Nivel adecuado?}
  T -->|No, sub-sedado| U[Aumentar dosis o agregar rescate]
  T -->|No, sobre-sedado| V[Reducir dosis o pausar]
  T -->|Sí| W[Continuar<br/>Mantener escopolamina + opioides<br/>Cuidados básicos<br/>Acompañar familia]
  U --> S
  V --> S`,
  },
];

// ── INSERT ───────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  SEDACIÓN PALIATIVA v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`📋 Topic: ${TOPIC_NAME}`);
console.log(`   Bloques: ${content_blocks.length}`);
console.log(`   Pestañas: ${[...new Set(content_blocks.map(b => b.tab).filter(Boolean))].join(' | ')}\n`);

const { data: existing } = await supabase
  .from('topics').select('id, name').eq('category_id', CATEGORY_ID).ilike('name', `%sedaci%paliativ%`);
if (existing && existing.length > 0) {
  console.log(`⚠️  Ya existe:`);
  existing.forEach(t => console.log(`   ${t.id} — ${t.name}`));
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run.');
  process.exit(0);
}

if (existing && existing.length > 0) {
  console.error('❌ Ya existe — abortando.');
  process.exit(1);
}

const { data, error } = await supabase.from('topics').insert({
  name: TOPIC_NAME,
  category_id: CATEGORY_ID,
  description: TOPIC_DESCRIPTION,
  content_blocks,
  status: 'published',
  has_local_protocol: false,
  tipo_contenido: ['tema_complementario'],
  tags: TOPIC_TAGS,
  authors: {
    elaborado: ['Marcos Gómez Sancho (coord.) y col.'],
    revisado: ['Organización Médica Colegial — SECPAL'],
    aprobado: ['Asociación Española Contra el Cáncer (AECC)', 'CERMI'],
  },
}).select().single();

if (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log(`\n✅ Topic creado: ${data.id}`);
console.log(`   Ver en: /Category?id=${CATEGORY_ID}`);
