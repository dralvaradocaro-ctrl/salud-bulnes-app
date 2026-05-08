/**
 * Crea topic "Urgencias en Cuidados Paliativos" en categoría
 * Dependencia Severa, Cuidados Paliativos y Alivio del Dolor.
 *
 * Fuente: Elías Díaz-Albo Hermida y Wilson Astudillo A.
 * "Manejo de Situaciones Urgentes en Cuidados Paliativos".
 *
 * Uso:  node scripts/create-paliativos-urgencias-v1.mjs
 *       node scripts/create-paliativos-urgencias-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f4320';
const TOPIC_NAME  = 'Urgencias en Cuidados Paliativos';
const TOPIC_TAGS  = ['Urgencias paliativas', 'Hemorragia', 'Disnea terminal', 'Hipercalcemia', 'Compresión medular'];

const content_blocks = [
  // ── HEADER ───────────────────────────────────────────────────────────────
  {
    id: 'urgpal-header',
    type: 'protocol_header',
    ordinario: 'REFERENCIA CLÍNICA',
    title: 'Manejo de Situaciones Urgentes en Cuidados Paliativos',
    institution: 'Sociedad Vasca de Cuidados Paliativos',
    department: 'Capítulo de referencia',
    date: 'Autores: Elías Díaz-Albo Hermida y Wilson Astudillo A.',
    summary:
      'Síntesis del capítulo sobre detección y manejo de las urgencias más frecuentes en cuidados paliativos: hemorragias, insuficiencia respiratoria, síndromes oncológicos urgentes (taponamiento, SVCS, HIC, hipercalcemia, compresión medular), estatus epiléptico, agitación, claudicación familiar y agonía — adaptado al arsenal HCSFB.',
    order: 1,
  },

  // ── PESTAÑA 1: VALORACIÓN INICIAL ──────────────────────────────────────
  {
    id: 'urgpal-concepto',
    type: 'text',
    tab: 'Valoración',
    color: 'blue',
    order: 10,
    title: '¿Qué es una urgencia paliativa?',
    content:
      'Situaciones que amenazan a corto plazo el equilibrio del enfermo y su familia (crisis de necesidades). Pueden ser objetivamente graves o de gravedad subjetiva. ' +
      'La labor inicial del equipo es valorar si el paciente está o no en fase terminal según criterios SECPAL, si la causa es reversible en domicilio, y decidir el nivel de actuación. ' +
      'Una buena comunicación con la familia es tan importante como el tratamiento médico.',
  },
  {
    id: 'urgpal-tres-errores',
    type: 'criteria',
    tab: 'Valoración',
    color: 'red',
    order: 11,
    title: 'Tres errores a evitar en la valoración',
    items: [
      '━━━ 1. TRATAR AL TERMINAL COMO RECUPERABLE ━━━',
      'Riesgo de obstinación / encarnizamiento terapéutico',
      'Lo indicado en el paciente agudo puede estar contraindicado en el moribundo',
      'UVIs móviles y reanimación pueden hacer sufrir más al paciente que la propia enfermedad',
      '━━━ 2. PENSAR QUE "YA NO HAY NADA QUE HACER" ━━━',
      'El abandono es una mala práctica médica',
      'Siempre se puede aliviar síntomas y reducir sufrimiento',
      'No controlar síntomas en moribundos es éticamente inaceptable',
      '━━━ 3. ETIQUETAR COMO TERMINAL A QUIEN NO LO ES ━━━',
      'Pacientes con cáncer pueden mantenerse estables por largo tiempo',
      'Las crisis pueden deberse a causas reversibles: ITU, desequilibrio hidroelectrolítico, fármacos, descompensación cardíaca',
      'Ante una crisis, descartar siempre causas tratables antes de asumir progresión',
    ],
  },
  {
    id: 'urgpal-variables',
    type: 'criteria',
    tab: 'Valoración',
    color: 'amber',
    order: 12,
    title: 'Variables a considerar antes de actuar',
    items: [
      'Estado funcional (Karnofsky, ECOG, PPS)',
      'Presencia y grado de deterioro cognitivo',
      'Velocidad de progresión de la enfermedad',
      'Alteración de la ingesta y malnutrición',
      'Reversibilidad potencial de la situación',
      'Efecto esperado de revertir el síntoma',
      'Hospitalizaciones previas y sus complicaciones',
      'Comorbilidad presente',
      'Deseos del paciente (voluntades anticipadas)',
      'Deseos y capacidad de los cuidadores',
      'Si el tratamiento activo mantendría o mejoraría la calidad de vida',
    ],
  },

  // ── PESTAÑA 2: HEMORRAGIAS ─────────────────────────────────────────────
  {
    id: 'urgpal-hemorragias-general',
    type: 'flowchart',
    tab: 'Hemorragias',
    color: 'red',
    order: 20,
    title: 'Hemorragia masiva — manejo en domicilio o servicio',
    content: 'Incidencia 6–10% en cáncer avanzado. Las pequeñas hemorragias pueden ser aviso de una mayor. La atención debe ser rápida y con foco en disminuir el impacto visual y emocional.',
    details: [
      'Valorar situación hemodinámica: clínica, PA, pulso',
      'Disponer una vía endovenosa cuanto antes para administración de fármacos',
      '~No se considera reposición de volumen si paciente próximo a fallecer',
      '~Vía subcutánea no útil por hipoperfusión periférica',
      'Preparar toallas verdes o azules para reducir impacto visual de la sangre sobre ropa de cama blanca',
      'Hablar con la familia sobre la sedación con midazolam',
      'Sedación urgente — Midazolam (HCSFB ampolla 5 mg/mL):',
      '~EV: bolo 5–10 mg, repetir cada 5 min hasta sedación',
      '~SC: 5–10 mg, repetir cada 10–15 min',
      '~Si no es posible vía: diazepam rectal 5–10 mg (HCSFB comp 10 mg)',
      'Si hay disnea asociada: agregar morfina 5–10 mg EV o SC (1/6 dosis diaria si ya la tomaba)',
      'Permanecer con el paciente — la propia hemorragia disminuirá el nivel de conciencia',
      'Comunicación constante con la familia, presencia y contención emocional',
    ],
  },
  {
    id: 'urgpal-hematuria',
    type: 'criteria',
    tab: 'Hemorragias',
    color: 'orange',
    order: 21,
    title: 'Hematuria',
    content: 'Basta poca sangre para teñir la orina. La gravedad depende de la etiología y la presencia de coágulos (riesgo de retención aguda).',
    items: [
      'Aproximación etiológica: descartar infección urinaria',
      'Hematuria importante: lavados vesicales varias veces al día',
      'Si no cede y no se deriva: sonda Foley de tres vías con lavado continuo con suero frío',
      'Sangrado discontinuo: ácido tranexámico 500 mg cada 8 h por 3 días (HCSFB comp 500 mg, sol inyectable 1 g/10 mL)',
      'Suspender ácido tranexámico si favorece formación de más coágulos',
    ],
  },
  {
    id: 'urgpal-hemoptisis',
    type: 'flowchart',
    tab: 'Hemorragias',
    color: 'red',
    order: 22,
    title: 'Hemoptisis con riesgo vital',
    content: 'Criterios de gravedad: sangrado > 200 mL/día, insuficiencia respiratoria, inestabilidad hemodinámica. El fallecimiento suele ser por asfixia, no por la cantidad.',
    details: [
      'Coger vía endovenosa para acceso rápido',
      'Posicionar al paciente en decúbito lateral sobre el lado del pulmón afectado (evita aspiración al pulmón sano)',
      'Suspender AINEs',
      'Pautar antitusígeno',
      'Ácido tranexámico 500 mg – 1 g EV cada 8 h (HCSFB sol inyectable 1 g/10 mL)',
      'Aerosol de adrenalina 1/1000 diluida en SF 0,9% (1 mg en 5 mL)',
      'Derivación a hospital si candidato a radioterapia paliativa',
      'Si refractario y paciente en últimos días: considerar sedación paliativa',
    ],
  },

  // ── PESTAÑA 3: RESPIRATORIAS ───────────────────────────────────────────
  {
    id: 'urgpal-ira',
    type: 'criteria',
    tab: 'Respiratorias',
    color: 'cyan',
    order: 30,
    title: 'Insuficiencia respiratoria aguda (IRA)',
    content: 'Clínica tan informativa como la gasometría. La oxigenoterapia debe titularse según el tipo de IRA.',
    items: [
      '━━━ SIGNOS DE GRAVEDAD ━━━',
      'Cianosis, disminución del nivel de conciencia',
      'Aumento de frecuencia respiratoria, uso de musculatura accesoria, tiraje',
      'Estridor: inspiratorio en obstrucción traqueal; bifásico en bronquios principales; espiratorio en vías bajas',
      '━━━ MANEJO ━━━',
      'Si broncoespasmo u obstrucción parcial: dexametasona 4–8 mg/día VO/EV/SC (HCSFB comp 4 mg, sol inyectable 4 mg/mL)',
      'Salbutamol nebulizado 5 mg (HCSFB sol nebulización 5 mg/mL) ± ipratropio (HCSFB sol nebulización 0,25 mg/mL)',
      '━━━ OXIGENOTERAPIA ━━━',
      'IRA parcial: mantener saturación > 90%',
      'IRA global: objetivo saturación 85–90% (no superior — riesgo de depresión del centro respiratorio en hipercápnicos)',
    ],
  },
  {
    id: 'urgpal-disnea-terminal',
    type: 'flowchart',
    tab: 'Respiratorias',
    color: 'red',
    order: 31,
    title: 'Disnea terminal — sensación de morir asfixiado',
    content: 'Disnea multifactorial y refractaria que aparece en la agonía, en pacientes con compromiso respiratorio previo. No dejar nunca solo al paciente.',
    details: [
      'Acceso EV o SC permeable',
      'Morfina 5 mg EV (HCSFB sol inyectable 10 mg/mL)',
      '~Si paciente ya tomaba morfina: 1/6 de la dosis diaria total',
      'Midazolam 2,5–5 mg EV (HCSFB ampolla 5 mg/mL)',
      '~Repetir cada 10 min hasta control',
      '~Aumentar dosis de morfina 30–50% sobre la habitual si persiste disnea',
      'Escopolamina butilbromuro 20 mg SC cada 6–8 h para secreciones bronquiales (HCSFB ampolla 20 mg/mL)',
      'Compañía permanente, ambiente tranquilo, sin estímulos innecesarios',
      'Considerar sedación paliativa si refractaria',
    ],
  },

  // ── PESTAÑA 4: SÍNDROMES ONCOLÓGICOS ───────────────────────────────────
  {
    id: 'urgpal-taponamiento',
    type: 'criteria',
    tab: 'Síndromes oncológicos',
    color: 'red',
    order: 40,
    title: 'Taponamiento cardíaco',
    content: 'Causa más frecuente: enfermedad metastásica (pulmón, mama, leucemias, linfomas, melanoma). Otras: tumores pericárdicos primarios, radioterapia, quimioterápicos.',
    items: [
      '━━━ CLÍNICA ━━━',
      'Disnea progresiva en días/semanas',
      'Tos, dolor torácico, náuseas, vómitos, molestias abdominales',
      'Casos severos: bajo gasto, obnubilación, oliguria, ansiedad, mareo',
      'Examen: taquicardia, taquipnea, ingurgitación yugular, hipotensión, pulso paradójico, signo de Kussmaul, hepatomegalia',
      '━━━ DIAGNÓSTICO ━━━',
      'Rx tórax, ECG y especialmente ecocardiograma',
      '━━━ MANEJO ━━━',
      'Oxígeno, fluidoterapia y vasoactivos (HCSFB: dopamina, norepinefrina)',
      'Diuréticos y vasodilatadores: CONTRAINDICADOS',
      'Pericardiocentesis evacuadora (alta tasa de recidiva)',
      'Pericardiostomía subxifoidea como tratamiento definitivo',
      'Derivación urgente si paciente candidato a tratamiento activo',
    ],
  },
  {
    id: 'urgpal-svcs',
    type: 'flowchart',
    tab: 'Síndromes oncológicos',
    color: 'orange',
    order: 41,
    title: 'Síndrome de vena cava superior (SVCS)',
    content: 'Obstrucción del flujo de la VCS hacia la aurícula derecha. 80% por compresión extrínseca tumoral (cáncer pulmonar, linfoma, metástasis adenopáticas mediastínicas de mama, riñón o seminoma). Signo de mal pronóstico en cáncer pulmonar.',
    details: [
      '━━━ PRESENTACIÓN ━━━',
      'Subaguda: disnea, hinchazón facial y del cuello',
      'Cianosis, somnolencia, circulación colateral en tórax',
      '━━━ DIAGNÓSTICO ━━━',
      'Rx tórax frecuentemente anormal (ensanchamiento mediastínico, derrame pleural)',
      'TAC con contraste: localización, extensión, causa subyacente',
      '━━━ MANEJO INICIAL EN DOMICILIO/SERVICIO ━━━',
      'Incorporar al paciente en la cama (semisentado)',
      'Oxigenoterapia',
      'Dexametasona 16 mg/día VO/EV (HCSFB comp 4 mg, sol inyectable 4 mg/mL)',
      '~Si disnea súbita: bolus hasta 40 mg EV',
      'Si no hay buena respuesta: derivar al hospital',
      '━━━ MANEJO DEFINITIVO ━━━',
      'Si origen neoplásico: radioterapia (especialmente efectiva en linfomas)',
      'Quimioterapia útil si SVCS de desarrollo lento',
      'Si causa cateter venoso: retirar + heparina para evitar embolia',
      'Cirugía: alta morbilidad, escaso éxito',
    ],
  },
  {
    id: 'urgpal-hic',
    type: 'flowchart',
    tab: 'Síndromes oncológicos',
    color: 'purple',
    order: 42,
    title: 'Hipertensión endocraneal (HIC)',
    content: 'Aumento de presión intracraneal por tumor cerebral o metástasis. Cefalea progresiva que no respeta el sueño, vómitos en escopetazo, alteraciones visuales y de marcha, trastornos de personalidad. Puede evolucionar a coma.',
    details: [
      '━━━ SIGNOS Y SÍNTOMAS ━━━',
      'Estado alterado de conciencia, agitación, delirio',
      'Cefalea, cervicalgia, crisis focales o generalizadas',
      'Postura de decerebración, midriasis, parálisis pares craneales II/IV/VI',
      'Disartria, disfagia, hipertermia, vómitos, hipo, sialorrea',
      '━━━ MEDIDAS GENERALES ━━━',
      'Elevar cabecera 30° sobre la horizontal',
      'Hiperventilación breve si paciente colabora (reduce PaCO₂ → vasoconstricción intracraneal)',
      '━━━ TRATAMIENTO FARMACOLÓGICO ━━━',
      'Dexametasona — primera línea (HCSFB comp 4 mg, sol inyectable 4 mg/mL)',
      '~Dosis: 24–60 mg/día VO/EV/SC, hasta 100 mg/día en casos severos',
      '~Mejoría clínica en 6–24 h, máximo 3–7 h tras la primera dosis',
      '~Mantención: 16–24 mg cada 24 h una vez controlado',
      'Manitol al 20% (NO disponible en HCSFB) si signos agudos: 1–4 mg/kg',
      '~No usar más de 150–200 g/día ni > 3–4 días por efecto rebote',
      '~Contraindicado en hemorragia intracerebral',
      'Si convulsiones o vómitos: diazepam 5–10 mg EV lento o midazolam 10 mg EV/IM, repetir cada hora si persisten',
    ],
  },
  {
    id: 'urgpal-hipercalcemia',
    type: 'flowchart',
    tab: 'Síndromes oncológicos',
    color: 'orange',
    order: 43,
    title: 'Hipercalcemia tumoral',
    content: 'Complicación metabólica más frecuente y grave en cáncer avanzado, con o sin metástasis óseas. Calcio total > 10,5 mg/dL. Corregir según albúmina: +1 mg/dL por cada g/dL bajo lo normal.',
    details: [
      '━━━ CLÍNICA ━━━',
      'Debilidad progresiva, obnubilación, alteraciones conductuales',
      'Anorexia, náuseas, empeoramiento progresivo hasta coma',
      'Sospechar siempre como causa de delirium en paciente terminal',
      '━━━ MANEJO ━━━',
      'Hidratación EV con suero fisiológico 0,9% — 2–3 litros en 24 h',
      'Furosemida 20–40 mg/día EV (HCSFB sol inyectable 20 mg/mL) para aumentar la eliminación renal de calcio',
      '~Solo después de hidratación adecuada (no usar en hipovolemia)',
      'Bifosfonatos cuando hidratación insuficiente:',
      '~Ácido zoledrónico 4 mg EV en 15 min (HCSFB sol inyectable 4 mg/5 mL)',
      '~Pamidronato 60–90 mg EV en 2–4 h (HCSFB liofilizado 30 y 90 mg)',
      '~Efecto en 48–72 h, duración 2–4 semanas',
      '━━━ PREVENCIÓN ━━━',
      'Hidratación adecuada y movilización en pacientes en riesgo',
      'La hipercalcemia es factor de mal pronóstico (aumento de mortalidad en pocos meses)',
    ],
  },
  {
    id: 'urgpal-compresion-medular',
    type: 'flowchart',
    tab: 'Síndromes oncológicos',
    color: 'red',
    order: 44,
    title: 'Síndrome de compresión medular (SCM) — emergencia',
    content: '5–10% de pacientes con metástasis óseas. Localización más frecuente: dorsal. EMERGENCIA — la evolución a paraparesia o paraplejia puede ser de horas. Sospechar en todo paciente oncológico con dolor de espalda.',
    details: [
      '━━━ CLÍNICA ━━━',
      'Dolor — síntoma inicial casi universal',
      '~Empeora con decúbito, mejora al sentarse o ponerse de pie',
      '~Empeora con flexión del cuello, elevación de piernas o tos',
      '~La presión de las apófisis espinosas localiza la lesión',
      'Debilidad en extremidades, alteración de marcha y equilibrio',
      'Posteriormente: alteraciones esfinterianas y sensitivas',
      'Retención aguda de orina (frecuentemente indolora — diferencial)',
      '━━━ DIAGNÓSTICO ━━━',
      'RNM (de elección)',
      'Bloqueo mielográfico, Rx columna (90% localiza lesión)',
      '━━━ MANEJO INMEDIATO — NO ESPERAR CONFIRMACIÓN ━━━',
      'Reposo absoluto',
      'Dexametasona en bolo: 20–40 mg EV (HCSFB sol inyectable 4 mg/mL — usar 5–10 ampollas)',
      '~Si progresión rápida: hasta 100 mg en bolo',
      '~Continuar con 4–16 mg cada 6 h, ajustar a deterioro neurológico',
      'Derivación urgente para radioterapia (compresión extradural)',
      'Cirugía: tumores radiorresistentes, refractarios a RT, dudas diagnósticas, inestabilidad espinal',
      '━━━ PRONÓSTICO ━━━',
      'Diagnóstico cuando aún camina: 80% de recuperación',
      'Con retención urinaria + paraparesia: 50% de recuperación',
      'Con paraplejia instaurada: la mayoría no recupera función',
    ],
  },

  // ── PESTAÑA 5: NEUROLÓGICAS Y PSICOSOCIALES ────────────────────────────
  {
    id: 'urgpal-status-epileptico',
    type: 'flowchart',
    tab: 'Neuro / Psicosocial',
    color: 'purple',
    order: 50,
    title: 'Estatus epiléptico',
    content: 'Crisis > 5 minutos o ≥ 2 crisis sin recuperación de conciencia entre ellas. Éxito del tratamiento: 80% si se inicia en ≤ 30 min, baja a 60% si se retrasa > 2 h.',
    details: [
      '━━━ MEDIDAS GENERALES ━━━',
      'Apoyo cardiocirculatorio y respiratorio, evitar hipoxia',
      'Glicemia capilar — descartar hipoglicemia',
      'Tiamina 100 mg EV (HCSFB sol inyectable 30 mg/mL) en alcohólicos o desnutridos',
      'Suero glucosado 5% si hipoglicemia',
      '━━━ PRIMERA LÍNEA — BENZODIACEPINAS ━━━',
      'Lorazepam 0,1 mg/kg EV en bolo lento 1–2 min (HCSFB sol inyectable 4 mg/mL)',
      '~Repetir a los 5 min si persiste',
      '~Vida media anticonvulsiva más larga que diazepam',
      'Diazepam 0,15–0,25 mg/kg EV (HCSFB sol inyectable 10 mg/mL)',
      '~Inicio en segundos pero efecto breve — 2da dosis a los 20–30 min',
      '~Vía rectal: 5 mg niños, 10 mg adultos',
      'Midazolam 0,2 mg/kg EV bolo, luego 0,05–0,5 mg/kg/h infusión (HCSFB ampolla 5 mg/mL)',
      '~En adultos mayores iniciar con 1–2 mg',
      '━━━ SEGUNDA LÍNEA ━━━',
      'Fenitoína 20 mg/kg EV diluida en SF 0,9%, pasar en 1 h (HCSFB sol inyectable 250 mg/5 mL)',
      'Fenobarbital 100–200 mg EV/IM si fracasan benzodiacepinas (HCSFB comp 100 mg)',
      '━━━ REFRACTARIO — UCI ━━━',
      'Sedoanestesia con midazolam alto, propofol o tiopental',
      'Derivación urgente al hospital de mayor complejidad (HHM)',
    ],
  },
  {
    id: 'urgpal-agitacion',
    type: 'criteria',
    tab: 'Neuro / Psicosocial',
    color: 'orange',
    order: 51,
    title: 'Agitación psicomotriz',
    content: 'Trastorno de conducta con aumento de actividad motora y alteración emocional. Causa: orgánica (síndrome confusional / delirium), psíquica o farmacológica.',
    items: [
      '━━━ EVALUACIÓN ━━━',
      'Historia clínica + exploraciones complementarias básicas',
      'Descartar causas reversibles: hipoxia, dolor, retención urinaria, fecalomas, hipoglicemia, deshidratación, hipercalcemia',
      'Atención: en demencia con cuerpos de Lewy NO usar neurolépticos típicos',
      '━━━ NEUROLÉPTICOS — primera línea ━━━',
      'Haloperidol 2,5–5 mg VO/IM/EV cada 30 min (HCSFB comp 1/5 mg, sol inyectable 5 mg/mL)',
      '~Dosis máxima: 100 mg/día (en adulto mayor usar 1/3 = 30 mg/día)',
      'Risperidona 0,5–2 mg/día en 1–2 tomas (HCSFB comp 1 mg)',
      'Olanzapina 10 mg VO/IM (HCSFB comp 10 mg)',
      'Quetiapina 25–100 mg en demencia o Parkinson (HCSFB comp 25 y 100 mg)',
      '━━━ ASOCIACIONES ━━━',
      'Lorazepam 2–5 mg/día (HCSFB comp 2 mg) potencia el efecto del haloperidol',
      'Midazolam 0,1 mg/kg IM o 2–2,5 mg EV en 2–3 min',
      'Diazepam 5–10 mg VO/IM/EV',
    ],
  },
  {
    id: 'urgpal-ansiedad',
    type: 'criteria',
    tab: 'Neuro / Psicosocial',
    color: 'amber',
    order: 52,
    title: 'Crisis de ansiedad y de pánico',
    items: [
      '━━━ CRISIS DE PÁNICO ━━━',
      'Aparición súbita de miedo intenso, sudoración, taquicardia, sensación de ahogo',
      'Sensación de muerte inminente que aumenta en minutos y luego cede',
      'Frecuentemente nocturna, con pulsioximetría normal',
      'Lorazepam 0,5–1 mg SL (HCSFB comp SL 2 mg) — inicio rápido',
      'Alprazolam 0,25–1 mg VO (HCSFB comp 0,5 mg)',
      '━━━ TRASTORNO DE ANSIEDAD GENERALIZADA ━━━',
      'Inquietud, irritabilidad, dificultad para relajarse',
      'Sensación de "estar al límite", nudo en la garganta',
      'Respuesta exagerada a pequeños estímulos, dificultad de atención, insomnio',
      'Clotiazepam 5–10 mg cada 8 h (HCSFB comp 10 mg — protocolo local HCSFB 153)',
      'No despachar como "tiene que relajarse" — la ansiedad es un síntoma médico que requiere tratamiento',
    ],
  },
  {
    id: 'urgpal-claudicacion',
    type: 'text',
    tab: 'Neuro / Psicosocial',
    color: 'gray',
    order: 53,
    title: 'Claudicación familiar',
    content:
      'Sensación de la familia de no poder seguir atendiendo al paciente por agotamiento físico o psíquico del cuidador. ' +
      'Es un DIAGNÓSTICO clínico que debe quedar reflejado en la ficha. Se manifiesta con bloqueos emocionales, hostilidad o agresividad hacia el enfermo o el equipo, demanda repetida de atención y peticiones de ingreso. ' +
      'Diagnóstico diferencial: "problema social" (sin familiares directos o que no quieren hacerse cargo). ' +
      'Manejo: explicar el proceso a la familia, contactar el hospital antes del traslado para que la atención sea rápida, evaluar derivación a unidad de paliativos y refuerzo del soporte domiciliario.',
  },

  // ── PESTAÑA 6: AGONÍA Y SEDACIÓN ───────────────────────────────────────
  {
    id: 'urgpal-agonia-concepto',
    type: 'text',
    tab: 'Agonía',
    color: 'blue',
    order: 60,
    title: 'Agonía — proceso de morir',
    content:
      'Habitualmente < 1 semana, menor si hay disminución de conciencia. Debería ser un tiempo de calma, atendiendo necesidades reales del enfermo y evitando molestias. ' +
      'Se transmite a la familia que se proporciona el tratamiento adecuado para esta etapa, evitando sensación de abandono. Se replantean objetivos: suspender fármacos sin beneficio claro (insulina, hipoglicemiantes, antibióticos, antidepresivos, antiarrítmicos, diuréticos, laxantes, broncodilatadores). Los corticoides pueden mantenerse.',
  },
  {
    id: 'urgpal-distanasia',
    type: 'alert',
    tab: 'Agonía',
    color: 'red',
    order: 61,
    title: 'Distanasia — verdadera urgencia paliativa',
    content:
      'Muerte con dolor, disnea, agitación o agonía prolongada. El equipo se siente fracasado y la familia se muestra hostil. Es el morir en malas condiciones y constituye una verdadera urgencia. ' +
      'Un buen manejo de la agonía la evita.',
  },
  {
    id: 'urgpal-vias-en-agonia',
    type: 'criteria',
    tab: 'Agonía',
    color: 'amber',
    order: 62,
    title: 'Vías y cuidados en la agonía',
    items: [
      'A medida que entra en semi-inconsciencia, la vía oral se hace imposible',
      'Vía subcutánea para fármacos (ver topic Vía Subcutánea)',
      'Evitar sondas, salvo retención aguda que provoque inquietud',
      'Vía endovenosa solo si se necesita control inmediato (disnea, hemorragia)',
      'Sugerir a la familia intensificar el contacto físico',
      'Mantener contacto estrecho equipo–familia',
      'Habitación individual, ambiente tranquilo, presencia y disponibilidad',
    ],
  },
  {
    id: 'urgpal-sedacion-urgencia',
    type: 'flowchart',
    tab: 'Agonía',
    color: 'purple',
    order: 63,
    title: 'Sedación paliativa urgente — síntoma refractario',
    content: '~25% de los pacientes terminales presentan síntomas refractarios. La sedación disminuye el nivel de conciencia para controlar síntomas que no se alivian de otra forma. Requiere consentimiento informado del paciente o familia y registro detallado en ficha.',
    details: [
      '━━━ MIDAZOLAM SC — primera línea ━━━',
      'HCSFB: ampolla 5 mg/mL',
      'Inducción: 2,5 mg SC cada 15 min hasta nivel de sedación deseado',
      '~Mantención: 30–60 mg/día por infusión continua SC (no superar 180 mg/día)',
      '━━━ MIDAZOLAM EV — sedación urgente ━━━',
      'Diluir 1 ampolla de 15 mg (3 mL) en 7 mL de SF 0,9%',
      'Inyección lenta EV ajustando velocidad según respuesta',
      'Continuar con infusión continua según dosis efectiva',
      '━━━ LEVOMEPROMACINA — segunda línea ━━━',
      'NO disponible en arsenal HCSFB',
      'Si fracasa midazolam o predomina delirium: derivar para acceso a este fármaco',
      'Dosis referencial: 75–150 mg/día SC',
      '━━━ FÁRMACOS COADYUVANTES EN AGONÍA ━━━',
      'Escopolamina butilbromuro 20–40 mg cada 8 h SC para estertores premortem (HCSFB ampolla 20 mg/mL)',
      'Morfina: NO retirar nunca, mantener para control de dolor y disnea',
      'Registrar en ficha: indicación, consentimiento, fármacos, dosis, escalada y reevaluaciones',
    ],
  },

  // ── PESTAÑA 7: VADEMÉCUM HCSFB ─────────────────────────────────────────
  {
    id: 'urgpal-vademecum',
    type: 'criteria',
    tab: 'Vademécum HCSFB',
    color: 'blue',
    order: 70,
    title: 'Vademécum de urgencias paliativas — disponibilidad HCSFB',
    content: 'Fármacos de uso frecuente en urgencias paliativas según arsenal HCSF (Resolución Exenta N°5235/2023, Servicio de Salud Ñuble).',
    items: [
      '━━━ ANTIHEMORRÁGICOS ━━━',
      'Ácido tranexámico comp 500 mg + sol inyectable 1 g/10 mL (Programa AD y CP/CPU)',
      'Adrenalina (epinefrina) sol inyectable 1 mg/mL (carro de paro) — para aerosol en hemoptisis',
      '━━━ OPIOIDES ━━━',
      'Morfina sol inyectable 10 mg/mL y 20 mg/mL + gotas 2% (Programa AD y CP/CPU)',
      'Fentanilo ampolla 0,1 mg/2 mL y 0,5 mg/10 mL + parche 25/50 µg/h (Programa AD y CP)',
      '━━━ ANTISECRETORES BRONQUIALES ━━━',
      'Escopolamina butilbromuro ampolla 20 mg/mL (CPU) — estertores premortem',
      '━━━ BENZODIACEPINAS ━━━',
      'Midazolam sol inyectable 5 mg/mL (carro de paro) — sedación, status epiléptico',
      'Diazepam comp 10 mg + sol inyectable 10 mg/mL (carro de paro)',
      'Lorazepam comp 2 mg + comp SL 2 mg + sol inyectable 4 mg/mL (Programa AD y CP/CPU)',
      'Alprazolam comp 0,5 mg (CPU)',
      'Clonazepam comp 0,5 y 2 mg',
      'Clotiazepam comp 10 mg (HCSFB 153)',
      '━━━ NEUROLÉPTICOS ━━━',
      'Haloperidol comp 1/5 mg + sol inyectable 5 mg/mL (CPU)',
      'Risperidona comp 1 mg + 3 mg + gotas 1 mg/mL',
      'Olanzapina comp 10 mg',
      'Quetiapina comp 25 mg y 100 mg',
      'Clorpromazina comp 25/100 mg + sol inyectable 12,5 mg/mL (CPU)',
      'Levomepromacina: NO disponible (alternativa para sedación: midazolam + neuroléptico oral)',
      '━━━ CORTICOIDES ━━━',
      'Dexametasona comp 4 mg + sol inyectable 4 mg/mL (CPU/Programa AD y CP)',
      'Prednisona comp 5 y 20 mg + susp oral 20 mg/5 mL',
      'Hidrocortisona polvo para sol inyectable 100 y 500 mg (carro de paro)',
      '━━━ DIURÉTICOS ━━━',
      'Furosemida comp 40 mg + sol inyectable 20 mg/mL (carro de paro)',
      '━━━ BIFOSFONATOS ━━━',
      'Ácido zoledrónico sol inyectable 4 mg/5 mL (Programa AD y CP)',
      'Pamidronato liofilizado 30 y 90 mg (Programa AD y CP)',
      '━━━ ANTICONVULSIVANTES ━━━',
      'Fenitoína comp 100 mg + sol inyectable 250 mg/5 mL (carro de paro)',
      'Fenobarbital comp 100 mg',
      'Ácido valproico comp 200/250 mg + gotas 10 mg/gota',
      '━━━ FLUIDOS Y ELECTROLITOS ━━━',
      'Suero fisiológico 0,9% (carro de paro)',
      'Suero glucosado 5%, 10%, 30% (carro de paro)',
      'Ringer lactato (carro de paro)',
      'Cloruro de potasio sol inyectable 10% (carro de paro)',
      'Bicarbonato de sodio 8,4% (carro de paro)',
      '━━━ NO DISPONIBLES — ALTERNATIVAS ━━━',
      'Manitol (HIC severa): no disponible — usar dexametasona alta dosis y derivar a HHM',
      'Levomepromacina (sedación delirium): no disponible — usar midazolam + haloperidol',
      'Octreotida (oclusión intestinal): no disponible — manejo con escopolamina + dexametasona',
    ],
  },

  // ── PESTAÑA 8: ALGORITMO ───────────────────────────────────────────────
  {
    id: 'urgpal-mermaid',
    type: 'mermaid',
    tab: 'Algoritmo',
    color: 'red',
    order: 80,
    title: 'Algoritmo general — abordaje de la urgencia paliativa',
    diagram: `flowchart TD
  A[Crisis en paciente paliativo] --> B[Valoración inicial<br/>Estado funcional<br/>Reversibilidad<br/>Deseos paciente/familia]
  B --> C{Causa identificada?}
  C -->|Sí, reversible| D[Tratamiento etiológico<br/>+ alivio sintomático]
  C -->|Sí, no reversible o terminal| E{Tipo de urgencia}
  C -->|No clara| F[Tratamiento sintomático<br/>+ búsqueda de causa<br/>en paralelo]
  E -->|Hemorragia masiva| G[Toallas verdes/azules<br/>Midazolam 5-10 mg EV/SC<br/>Morfina si disnea<br/>Acompañamiento]
  E -->|Disnea terminal| H[Morfina 5 mg EV<br/>Midazolam 2,5-5 mg<br/>Escopolamina 20 mg SC<br/>Compañía permanente]
  E -->|Compresión medular| I[EMERGENCIA<br/>Dexametasona 20-40 mg EV bolo<br/>Reposo absoluto<br/>Derivación urgente RT]
  E -->|Hipercalcemia| J[Hidratación SF 2-3 L/24h<br/>+ Furosemida<br/>+ Ác. zoledrónico 4 mg EV]
  E -->|HIC| K[Cabecera 30 grados<br/>Dexametasona 24-60 mg/día<br/>Anticonvulsivantes si crisis]
  E -->|SVCS| L[Semisentado + O2<br/>Dexametasona 16-40 mg<br/>Derivar para RT]
  E -->|Status epiléptico| M[Lorazepam 0,1 mg/kg EV<br/>o Diazepam 10 mg EV<br/>Si refractario: midazolam<br/>infusión + derivar UCI]
  E -->|Agitación| N[Descartar causa reversible<br/>Haloperidol 2,5-5 mg<br/>+ Lorazepam 2 mg]
  E -->|Crisis pánico| O[Lorazepam SL 2 mg<br/>o Alprazolam 0,5 mg]
  E -->|Claudicación familiar| P[Diagnóstico clínico<br/>Refuerzo soporte<br/>Considerar derivación]
  G --> Q{Síntoma controlado?}
  H --> Q
  I --> Q
  J --> Q
  K --> Q
  L --> Q
  M --> Q
  N --> Q
  O --> Q
  Q -->|Sí| R[Reevaluación frecuente<br/>Mantener cuidados]
  Q -->|Refractario| S[Sedación paliativa<br/>Midazolam SC 2,5 mg c/15 min<br/>hasta control<br/>Mantención 30-60 mg/24h]
  D --> R
  F --> R
  P --> R
  S --> R`,
  },
];

// ── INSERT ───────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  URGENCIAS PALIATIVAS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`📋 Topic: ${TOPIC_NAME}`);
console.log(`   Bloques: ${content_blocks.length}`);
console.log(`   Pestañas: ${[...new Set(content_blocks.map(b => b.tab).filter(Boolean))].join(' | ')}\n`);

const { data: existing } = await supabase
  .from('topics').select('id, name').eq('category_id', CATEGORY_ID).ilike('name', `%urgencias en cuidados%`);
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
  content_blocks,
  status: 'published',
  has_local_protocol: false,
  tags: TOPIC_TAGS,
  authors: {
    elaborado: ['Elías Díaz-Albo Hermida', 'Wilson Astudillo A.'],
    revisado: ['Sociedad Vasca de Cuidados Paliativos'],
    aprobado: [],
  },
}).select().single();

if (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log(`\n✅ Topic creado: ${data.id}`);
console.log(`   Ver en: /Category?id=${CATEGORY_ID}`);
