const GES_AREA_RULES = [
  { area: 'Oncología', theme: 'rose', keywords: ['cancer', 'linfoma', 'leucemia', 'tumor', 'osteosarcoma', 'mieloma'] },
  { area: 'Cardiovascular', theme: 'blue', keywords: ['infarto', 'cardiopatia', 'marcapasos', 'hipertension', 'cerebrovascular', 'aneurisma', 'valvula'] },
  { area: 'Respiratorio', theme: 'cyan', keywords: ['asma', 'epoc', 'respiratoria', 'respiratorio', 'neumonia', 'broncopulmonar', 'tabaco'] },
  { area: 'Oftalmología', theme: 'indigo', keywords: ['catarata', 'retina', 'retinopatia', 'refraccion', 'estrabismo', 'ocular'] },
  { area: 'Salud Mental', theme: 'violet', keywords: ['esquizofrenia', 'depresion', 'bipolar', 'alcohol', 'drogas', 'demencia', 'alzheimer'] },
  { area: 'Ginecología y Obstetricia', theme: 'fuchsia', keywords: ['cervicouterino', 'parto', 'gestante', 'ovario', 'sexual'] },
  { area: 'Digestivo y Hepatología', theme: 'amber', keywords: ['gastrico', 'helicobacter', 'hepatitis', 'cirrosis', 'vesicula'] },
  { area: 'Nefrología y Urología', theme: 'teal', keywords: ['renal', 'prostata', 'vesical'] },
  { area: 'Endocrinología y Metabólico', theme: 'emerald', keywords: ['diabetes', 'hipotiroidismo'] },
  { area: 'Neurología', theme: 'purple', keywords: ['epilepsia', 'parkinson', 'disrafias'] },
  { area: 'Traumatología y Rehabilitación', theme: 'orange', keywords: ['cadera', 'rodilla', 'escoliosis', 'hernia', 'politraumatizado', 'traumatismo', 'gran quemado', 'luxante'] },
  { area: 'Pediatría y Neonatología', theme: 'pink', keywords: ['prematuro', 'recien nacido', 'menores de 15 anos', 'menores de 4 anos', 'ninos y ninas', 'labiopalatina'] },
  { area: 'Reumatología e Inmunología', theme: 'sky', keywords: ['artritis', 'lupus', 'esclerosis multiple'] },
  { area: 'Otorrinolaringología', theme: 'lime', keywords: ['hipoacusia', 'audifono'] },
  { area: 'Odontología y Salud Oral', theme: 'yellow', keywords: ['odontologica', 'salud oral'] },
];

const GES_THEME_MAP = {
  rose: {
    hero: 'from-rose-500 via-rose-600 to-red-600',
    surface: 'from-rose-50 via-white to-red-50',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'rose',
  },
  blue: {
    hero: 'from-sky-500 via-blue-600 to-indigo-700',
    surface: 'from-sky-50 via-white to-indigo-50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'blue',
  },
  cyan: {
    hero: 'from-cyan-500 via-sky-600 to-blue-700',
    surface: 'from-cyan-50 via-white to-blue-50',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'blue',
  },
  indigo: {
    hero: 'from-indigo-500 via-indigo-600 to-blue-700',
    surface: 'from-indigo-50 via-white to-blue-50',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'purple',
  },
  violet: {
    hero: 'from-violet-500 via-purple-600 to-indigo-700',
    surface: 'from-violet-50 via-white to-indigo-50',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'purple',
  },
  fuchsia: {
    hero: 'from-fuchsia-500 via-pink-600 to-rose-600',
    surface: 'from-fuchsia-50 via-white to-pink-50',
    badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'purple',
  },
  amber: {
    hero: 'from-amber-500 via-orange-500 to-amber-700',
    surface: 'from-amber-50 via-white to-orange-50',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'orange',
  },
  teal: {
    hero: 'from-teal-500 via-emerald-600 to-cyan-700',
    surface: 'from-teal-50 via-white to-emerald-50',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'green',
  },
  emerald: {
    hero: 'from-emerald-500 via-green-600 to-teal-700',
    surface: 'from-emerald-50 via-white to-green-50',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'green',
  },
  purple: {
    hero: 'from-purple-500 via-indigo-600 to-violet-700',
    surface: 'from-purple-50 via-white to-violet-50',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'purple',
  },
  orange: {
    hero: 'from-orange-500 via-amber-500 to-red-500',
    surface: 'from-orange-50 via-white to-amber-50',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'orange',
  },
  pink: {
    hero: 'from-pink-500 via-rose-500 to-fuchsia-600',
    surface: 'from-pink-50 via-white to-rose-50',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'purple',
  },
  sky: {
    hero: 'from-sky-500 via-cyan-600 to-blue-700',
    surface: 'from-sky-50 via-white to-cyan-50',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'blue',
  },
  lime: {
    hero: 'from-lime-500 via-green-600 to-emerald-700',
    surface: 'from-lime-50 via-white to-green-50',
    badge: 'bg-lime-100 text-lime-700 border-lime-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'green',
  },
  yellow: {
    hero: 'from-yellow-500 via-amber-500 to-orange-600',
    surface: 'from-yellow-50 via-white to-amber-50',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'orange',
  },
  slate: {
    hero: 'from-slate-500 via-slate-600 to-slate-800',
    surface: 'from-slate-50 via-white to-slate-100',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    softBadge: 'bg-white/15 text-white border-white/20',
    accent: 'blue',
  },
};

const AREA_STARTER_PRESETS = {
  'Oncología': {
    focus: '{topic} requiere una ruta GES orientada a sospecha precoz, confirmación diagnóstica y derivación ordenada hacia la red oncológica.',
    intake: [
      'Confirmar si existe síntoma de alarma, hallazgo de tamizaje o estudio sugerente.',
      'Precisar tiempo de evolución, compromiso funcional y antecedentes personales relevantes.',
      'Revisar documentos y exámenes disponibles sin retrasar la derivación por completar estudios no indispensables.',
      'Verificar edad, sexo o condición de ingreso exigida por la cobertura GES.',
    ],
    algorithm: [
      'Reconocer el hallazgo o síntoma compatible con la sospecha oncológica.',
      'Ordenar la evaluación inicial disponible y documentar la sospecha clínica.',
      'Activar la interconsulta priorizada y la ruta administrativa GES.',
      'Coordinar confirmación diagnóstica, etapificación y derivación a la unidad tratante.',
      'Mantener seguimiento de oportunidad, síntomas y educación del paciente.',
    ],
    flow: [
      'Ingreso por APS, tamizaje, control o urgencia con hallazgo sugerente.',
      'Evaluación clínica inicial y revisión de antecedentes clave.',
      'Derivación preferente con examen físico, exámenes y documentos disponibles.',
      'Confirmación diagnóstica y definición terapéutica por equipo especializado.',
      'Seguimiento clínico, soporte y control de oportunidad en la red.',
    ],
    checklist: [
      'Registrar motivo de sospecha y fecha de detección.',
      'Adjuntar exámenes, informes e imágenes ya disponibles.',
      'Dejar trazabilidad de la activación GES y del destino de derivación.',
      'Informar al paciente y familia sobre pasos siguientes y plazos.',
    ],
    watchouts: [
      'Deterioro rápido del estado general.',
      'Sangrado significativo o dolor no controlado.',
      'Compromiso respiratorio, neurológico o funcional progresivo.',
      'Imposibilidad de asegurar seguimiento u oportunidad.',
    ],
  },
  'Cardiovascular': {
    focus: '{topic} debe ordenarse con evaluación cardiovascular dirigida, estratificación de gravedad y coordinación oportuna con APS, urgencia y especialidad.',
    intake: [
      'Registrar síntomas principales, tiempo de evolución y factores de riesgo cardiovascular.',
      'Controlar signos vitales y buscar inestabilidad hemodinámica o compromiso agudo.',
      'Revisar fármacos en uso, antecedentes cardiovasculares y comorbilidades.',
      'Definir si se trata de un cuadro urgente, subagudo o de seguimiento programable.',
    ],
    algorithm: [
      'Reconocer el problema cardiovascular y descartar criterios de urgencia.',
      'Solicitar evaluación inicial y monitorizar según severidad del cuadro.',
      'Activar la ruta GES y coordinar derivación con antecedentes completos.',
      'Iniciar manejo de soporte y medidas de protección clínica disponibles.',
      'Planificar seguimiento y control de oportunidad en la red definida.',
    ],
    flow: [
      'Consulta en APS, urgencia u hospitalización por síntomas cardiovasculares o hallazgo relevante.',
      'Evaluación inicial, estratificación de riesgo y estudios básicos.',
      'Definición de derivación, hospitalización o seguimiento según estabilidad.',
      'Resolución por cardiología, hemodinamia o cirugía según corresponda.',
      'Control posterior, adherencia y seguimiento longitudinal.',
    ],
    checklist: [
      'Anotar fecha de inicio de síntomas y antecedentes cardiovasculares.',
      'Registrar signos vitales, ECG o estudios disponibles si corresponde.',
      'Documentar la indicación de derivación y red receptora.',
      'Reforzar señales de alarma y plan de control.',
    ],
    watchouts: [
      'Dolor torácico persistente o disnea progresiva.',
      'Síncope, hipotensión o alteración del estado de conciencia.',
      'Signos de insuficiencia cardíaca o perfusión inadecuada.',
      'Empeoramiento clínico mientras espera derivación.',
    ],
  },
  'Respiratorio': {
    focus: '{topic} requiere una ruta base centrada en gravedad respiratoria, activación GES y continuidad asistencial según edad y nivel de resolución.',
    intake: [
      'Determinar síntomas respiratorios, duración, gatillantes y respuesta a tratamientos previos.',
      'Evaluar frecuencia respiratoria, uso de musculatura accesoria, saturación y tolerancia al esfuerzo.',
      'Revisar antecedentes de hospitalizaciones, tabaquismo, alergias o prematurez según el caso.',
      'Identificar si corresponde a descompensación aguda, control ambulatorio o secuela en seguimiento.',
    ],
    algorithm: [
      'Identificar gravedad clínica y definir si requiere manejo inmediato.',
      'Realizar evaluación inicial y estudios de apoyo disponibles según contexto.',
      'Activar cobertura GES y ruta de derivación cuando corresponda.',
      'Iniciar medidas de soporte y educación sobre adherencia o control.',
      'Asegurar reevaluación o seguimiento según riesgo.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control respiratorio o seguimiento neonatal.',
      'Evaluación clínica y clasificación de gravedad.',
      'Estudios básicos, tratamiento inicial y decisión de derivación.',
      'Resolución por especialidad, hospitalización o control programado.',
      'Seguimiento de adherencia, rehabilitación y prevención de exacerbaciones.',
    ],
    checklist: [
      'Registrar saturación, signos de esfuerzo y factores desencadenantes.',
      'Adjuntar exámenes, espirometría o imágenes disponibles si existen.',
      'Documentar criterios de severidad y plan de control.',
      'Entregar educación de alarmas y uso correcto de tratamientos o apoyos.',
    ],
    watchouts: [
      'Desaturación, cianosis o dificultad respiratoria progresiva.',
      'Incapacidad para alimentarse o hablar por disnea.',
      'Somnolencia, agotamiento o compromiso hemodinámico.',
      'Empeoramiento rápido pese a manejo inicial.',
    ],
  },
  'Oftalmología': {
    focus: '{topic} debe abordarse con pesquisa visual dirigida, confirmación diagnóstica y derivación oportuna para evitar pérdida funcional evitable.',
    intake: [
      'Precisar síntomas visuales, lateralidad, tiempo de evolución y antecedentes oftalmológicos.',
      'Buscar dolor ocular, fotopsias, trauma, pérdida súbita o progresiva de visión.',
      'Revisar comorbilidades relevantes como diabetes, prematurez o cirugía previa.',
      'Definir si la presentación exige derivación urgente o atención programada.',
    ],
    algorithm: [
      'Reconocer compromiso visual compatible con la patología GES.',
      'Realizar evaluación visual básica y recopilar antecedentes clave.',
      'Activar derivación oftalmológica con prioridad según gravedad.',
      'Coordinar estudios, procedimiento o tratamiento en la red indicada.',
      'Registrar seguimiento y educación para proteger la visión remanente.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control crónico o pesquisa programada.',
      'Evaluación clínica inicial y medición funcional disponible.',
      'Definición de prioridad y envío a oftalmología.',
      'Confirmación diagnóstica y tratamiento específico en el nivel resolutivo.',
      'Seguimiento funcional, adherencia y control de secuelas.',
    ],
    checklist: [
      'Anotar agudeza visual o limitación funcional observada.',
      'Registrar lateralidad, síntomas y antecedentes relevantes.',
      'Documentar la prioridad de derivación y la red receptora.',
      'Entregar indicaciones de alarma visual al paciente o cuidador.',
    ],
    watchouts: [
      'Pérdida súbita de visión o progresión acelerada.',
      'Dolor ocular importante o trauma asociado.',
      'Fotopsias, sombras, secreción o signos inflamatorios intensos.',
      'Imposibilidad de asegurar control en el tiempo garantizado.',
    ],
  },
  'Salud Mental': {
    focus: '{topic} requiere evaluación biopsicosocial, pesquisa de riesgo y coordinación continua con la red de salud mental y apoyo familiar.',
    intake: [
      'Precisar motivo de consulta, síntomas predominantes y tiempo de evolución.',
      'Explorar riesgo suicida, heteroagresividad, psicosis, abandono o vulneración.',
      'Revisar antecedentes psiquiátricos, consumo de sustancias y apoyos disponibles.',
      'Definir necesidad de contención inmediata, urgencia o seguimiento programado.',
    ],
    algorithm: [
      'Realizar evaluación clínica y de seguridad en el primer contacto.',
      'Definir gravedad, necesidad de derivación urgente o contención protegida.',
      'Activar la ruta GES y la red local de salud mental.',
      'Iniciar plan terapéutico y medidas de apoyo disponibles.',
      'Asegurar seguimiento estrecho, adherencia y trabajo con la familia o cuidadores.',
    ],
    flow: [
      'Ingreso por APS, urgencia, interconsulta o pesquisa comunitaria.',
      'Evaluación de síntomas, funcionalidad y riesgos.',
      'Definición de manejo ambulatorio intensivo, derivación o hospitalización.',
      'Intervención interdisciplinaria y continuidad en la red.',
      'Seguimiento longitudinal y reevaluación periódica del riesgo.',
    ],
    checklist: [
      'Registrar riesgo actual y factores protectores.',
      'Documentar red de apoyo, contacto de cuidador y plan de seguridad.',
      'Dejar indicada la ruta de derivación y controles próximos.',
      'Verificar adherencia, acceso y barreras para continuidad.',
    ],
    watchouts: [
      'Ideación o conducta suicida, psicosis o agitación grave.',
      'Abandono del autocuidado o deterioro funcional marcado.',
      'Violencia, consumo de riesgo o descompensación rápida.',
      'Ausencia de red de apoyo o imposibilidad de seguimiento seguro.',
    ],
  },
  'Ginecología y Obstetricia': {
    focus: '{topic} necesita una ruta coordinada entre APS, urgencia y especialidad, con énfasis en oportunidad, bienestar materno-perinatal y continuidad de cuidados.',
    intake: [
      'Precisar edad gestacional, síntomas, antecedentes gineco-obstétricos y factores de riesgo.',
      'Buscar sangrado, dolor, dinámica uterina, signos infecciosos o compromiso hemodinámico.',
      'Revisar controles previos, exámenes disponibles y red de apoyo.',
      'Definir si corresponde atención inmediata o derivación programada.',
    ],
    algorithm: [
      'Identificar el motivo de ingreso y clasificar gravedad obstétrica o ginecológica.',
      'Solicitar evaluación inicial y asegurar vigilancia clínica adecuada.',
      'Activar la ruta GES y coordinar derivación a la red obstétrica o ginecológica.',
      'Iniciar medidas de soporte, acompañamiento e información clara a la usuaria.',
      'Mantener seguimiento de oportunidad y continuidad asistencial.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control gestacional o derivación interna.',
      'Evaluación clínica y definición de riesgo.',
      'Estudios básicos, estabilización si se requiere y coordinación de traslado.',
      'Resolución por especialidad, maternidad o unidad correspondiente.',
      'Seguimiento posterior, educación y controles definidos.',
    ],
    checklist: [
      'Registrar edad gestacional o antecedente ginecológico clave.',
      'Anotar signos vitales, exámenes y ecografías disponibles.',
      'Documentar la indicación de derivación y red receptora.',
      'Entregar señales de alarma y plan de control.',
    ],
    watchouts: [
      'Sangrado, dolor intenso o inestabilidad hemodinámica.',
      'Disminución de movimientos fetales o signos de parto inminente.',
      'Sospecha de infección, violencia o vulneración aguda.',
      'Dificultad para acceso oportuno a maternidad o especialidad.',
    ],
  },
  'Digestivo y Hepatología': {
    focus: '{topic} requiere evaluación digestiva dirigida, confirmación diagnóstica y definición de derivación según riesgo de complicaciones.',
    intake: [
      'Precisar síntomas digestivos, dolor, sangrado, baja de peso o antecedentes hepáticos.',
      'Revisar evolución clínica, medicamentos y comorbilidades relevantes.',
      'Buscar signos de descompensación o compromiso sistémico.',
      'Definir si el caso puede seguirse en forma programada o requiere prioridad.',
    ],
    algorithm: [
      'Identificar el síndrome digestivo o hepatológico predominante.',
      'Solicitar estudios básicos disponibles y valorar gravedad clínica.',
      'Activar la ruta GES y coordinar derivación oportuna.',
      'Iniciar medidas de soporte, educación y vigilancia de complicaciones.',
      'Mantener seguimiento según oportunidad y respuesta clínica.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control o programa crónico.',
      'Evaluación clínica inicial y revisión de exámenes previos.',
      'Definición de estudio, derivación o tratamiento inicial.',
      'Resolución por gastroenterología, cirugía o hepatología.',
      'Seguimiento clínico y control de adherencia o recaídas.',
    ],
    checklist: [
      'Registrar síntomas cardinales y tiempo de evolución.',
      'Adjuntar laboratorio, imágenes o endoscopías disponibles.',
      'Documentar riesgo de complicaciones y red de derivación.',
      'Reforzar signos de alarma y plan de control.',
    ],
    watchouts: [
      'Sangrado digestivo, compromiso hemodinámico o dolor severo.',
      'Ictericia progresiva, ascitis o encefalopatía.',
      'Vómitos persistentes o intolerancia oral marcada.',
      'Empeoramiento clínico mientras espera derivación.',
    ],
  },
  'Nefrología y Urología': {
    focus: '{topic} debe organizarse con vigilancia de función renal o urinaria, ajuste oportuno de derivación y prevención de descompensaciones evitables.',
    intake: [
      'Revisar síntomas urinarios, edema, diuresis y antecedentes renales o urológicos.',
      'Registrar presión arterial, balance, laboratorio previo y comorbilidades.',
      'Identificar signos de progresión, infección, obstrucción o falla renal.',
      'Definir nivel de urgencia y requerimiento de especialista.',
    ],
    algorithm: [
      'Reconocer el problema nefrológico o urológico y valorar estabilidad.',
      'Solicitar evaluación inicial con laboratorio y estudios disponibles.',
      'Activar la ruta GES y coordinar derivación según gravedad.',
      'Iniciar medidas de soporte, ajuste terapéutico y educación.',
      'Planificar seguimiento de función renal o control de síntomas.',
    ],
    flow: [
      'Ingreso por APS, urgencia, programa crónico o control especializado.',
      'Evaluación clínica, de laboratorio y estratificación de riesgo.',
      'Definición de manejo local, derivación o ingreso hospitalario.',
      'Resolución por nefrología, urología o unidad de diálisis si corresponde.',
      'Seguimiento, adherencia y vigilancia de complicaciones.',
    ],
    checklist: [
      'Registrar creatinina, diuresis y antecedentes relevantes.',
      'Adjuntar laboratorio, imágenes o exámenes ya disponibles.',
      'Documentar criterios de derivación y plan de control.',
      'Educar sobre signos de alarma y autocuidado.',
    ],
    watchouts: [
      'Oliguria, edema progresivo o disnea por sobrecarga.',
      'Dolor intenso, hematuria significativa o obstrucción.',
      'Descompensación metabólica o síntomas urémicos.',
      'Incapacidad para garantizar seguimiento o acceso a terapia.',
    ],
  },
  'Endocrinología y Metabólico': {
    focus: '{topic} requiere control metabólico ordenado, prevención de complicaciones y coordinación progresiva con APS y especialidad.',
    intake: [
      'Precisar síntomas, controles previos y descompensaciones recientes.',
      'Revisar adherencia, monitorización, comorbilidades y tratamientos actuales.',
      'Buscar complicaciones agudas o crónicas que cambien la prioridad.',
      'Definir si corresponde ajuste ambulatorio, derivación o manejo urgente.',
    ],
    algorithm: [
      'Identificar el problema endocrino o metabólico y valorar gravedad.',
      'Solicitar evaluación inicial y revisar parámetros de control.',
      'Activar la ruta GES y coordinar derivación si corresponde.',
      'Iniciar medidas educativas, terapéuticas y de seguimiento disponibles.',
      'Controlar respuesta y pesquisar complicaciones de manera periódica.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control crónico o pesquisa programada.',
      'Evaluación clínica, laboratorio y revisión de adherencia.',
      'Definición de ajustes, derivación y plan de educación.',
      'Resolución por especialidad o continuidad en APS según estabilidad.',
      'Seguimiento longitudinal con metas y prevención de complicaciones.',
    ],
    checklist: [
      'Registrar parámetros de control y último laboratorio disponible.',
      'Anotar tratamientos actuales, barreras de adherencia y educación entregada.',
      'Documentar plan de derivación o seguimiento.',
      'Reforzar signos de descompensación y próximos controles.',
    ],
    watchouts: [
      'Síntomas de descompensación metabólica aguda.',
      'Alteración del estado de conciencia o compromiso hemodinámico.',
      'Deterioro visual, renal o neurológico progresivo.',
      'Dificultad importante para adherencia o acceso terapéutico.',
    ],
  },
  'Neurología': {
    focus: '{topic} debe manejarse con evaluación neurológica dirigida, pesquisa de gravedad y coordinación rápida con la red especialista.',
    intake: [
      'Precisar síntomas neurológicos, inicio, progresión y antecedentes relevantes.',
      'Buscar déficit focal, convulsiones, cefalea intensa o compromiso de conciencia.',
      'Revisar tratamientos actuales, eventos previos y comorbilidades.',
      'Definir si el cuadro es urgente o de resolución programable.',
    ],
    algorithm: [
      'Reconocer el síndrome neurológico y valorar estabilidad.',
      'Solicitar estudios iniciales disponibles y documentar examen neurológico.',
      'Activar la ruta GES y coordinar derivación con prioridad adecuada.',
      'Iniciar medidas de soporte y prevención de complicaciones inmediatas.',
      'Planificar seguimiento según evolución y oportunidad.',
    ],
    flow: [
      'Ingreso por APS, urgencia, hospitalización o control neurológico.',
      'Evaluación clínica inicial y clasificación de gravedad.',
      'Estudios básicos y decisión de derivación o ingreso.',
      'Resolución por neurología, neurocirugía o rehabilitación.',
      'Seguimiento funcional y continuidad del tratamiento.',
    ],
    checklist: [
      'Registrar hora de inicio, examen neurológico y funcionalidad.',
      'Adjuntar estudios previos o imágenes disponibles.',
      'Documentar la red de derivación y criterio de prioridad.',
      'Educar sobre signos de alarma y adherencia al control.',
    ],
    watchouts: [
      'Compromiso de conciencia o déficit neurológico progresivo.',
      'Convulsiones repetidas o prolongadas.',
      'Cefalea explosiva, vómitos o signos de hipertensión intracraneana.',
      'Deterioro funcional rápido o dificultades para el cuidado seguro.',
    ],
  },
  'Traumatología y Rehabilitación': {
    focus: '{topic} necesita una ruta funcional y quirúrgica ordenada, con evaluación del dolor, la movilidad y la oportunidad de derivación.',
    intake: [
      'Precisar dolor, limitación funcional, mecanismo lesional y tiempo de evolución.',
      'Revisar imágenes previas, ayudas técnicas y tratamientos realizados.',
      'Buscar signos de compromiso neurovascular, infección o deterioro rápido.',
      'Definir si la prioridad es urgente, quirúrgica programada o de rehabilitación.',
    ],
    algorithm: [
      'Reconocer el problema traumatológico o de rehabilitación y valorar gravedad.',
      'Solicitar evaluación inicial e imágenes disponibles según el caso.',
      'Activar la ruta GES y coordinar ortopedia, cirugía o rehabilitación.',
      'Iniciar manejo sintomático, inmovilización o apoyo funcional cuando corresponda.',
      'Mantener seguimiento de oportunidad, dolor y recuperación funcional.',
    ],
    flow: [
      'Ingreso por APS, urgencia, hospitalización o control postoperatorio.',
      'Evaluación clínica, funcional e imagenológica inicial.',
      'Definición de derivación, cirugía, rehabilitación o seguimiento local.',
      'Resolución por traumatología, cirugía o equipo de rehabilitación.',
      'Control funcional, adherencia y prevención de complicaciones.',
    ],
    checklist: [
      'Registrar dolor, rango funcional y apoyos requeridos.',
      'Adjuntar imágenes, informes y evolución previa.',
      'Documentar prioridad de derivación y metas funcionales.',
      'Educar sobre inmovilización, descarga y señales de alarma.',
    ],
    watchouts: [
      'Dolor desproporcionado, fiebre o signos infecciosos.',
      'Déficit neurovascular o imposibilidad súbita de apoyo.',
      'Deterioro funcional acelerado o inmovilidad prolongada.',
      'Riesgo alto de caída o dificultad para autocuidado.',
    ],
  },
  'Pediatría y Neonatología': {
    focus: '{topic} exige coordinación pediátrica o neonatal con vigilancia del crecimiento, desarrollo y oportunidad de intervención temprana.',
    intake: [
      'Revisar edad, antecedentes perinatales, crecimiento y desarrollo.',
      'Precisar síntomas actuales, alimentación y controles previos.',
      'Buscar signos de compromiso respiratorio, neurológico o funcional.',
      'Definir si requiere evaluación urgente o derivación programada precoz.',
    ],
    algorithm: [
      'Identificar el problema pediátrico o neonatal y estimar severidad.',
      'Recopilar antecedentes clínicos, perinatales y exámenes disponibles.',
      'Activar la ruta GES y la red especializada pertinente.',
      'Iniciar medidas de soporte, educación familiar y vigilancia.',
      'Asegurar continuidad del control y seguimiento del desarrollo.',
    ],
    flow: [
      'Ingreso por APS, maternidad, seguimiento neonatal o urgencia.',
      'Evaluación clínica, antecedentes y clasificación de prioridad.',
      'Derivación a pediatría, neonatología o subespecialidad.',
      'Resolución diagnóstica y terapéutica en el centro de referencia.',
      'Seguimiento con familia, rehabilitación y controles periódicos.',
    ],
    checklist: [
      'Registrar edad, peso, controles previos y antecedentes perinatales.',
      'Adjuntar exámenes, tamizajes o imágenes disponibles.',
      'Documentar la red receptora y plan familiar de seguimiento.',
      'Entregar señales de alarma claras a cuidadores.',
    ],
    watchouts: [
      'Apneas, cianosis o dificultad respiratoria.',
      'Compromiso alimentario, deshidratación o letargia.',
      'Retroceso del desarrollo o deterioro neurológico.',
      'Dificultad para asegurar controles y adherencia familiar.',
    ],
  },
  'Reumatología e Inmunología': {
    focus: '{topic} necesita vigilancia inflamatoria, pesquisa de daño orgánico y derivación oportuna a la red reumatológica.',
    intake: [
      'Precisar dolor, inflamación, limitación funcional y manifestaciones sistémicas.',
      'Revisar antecedentes autoinmunes, tratamientos y evolución reciente.',
      'Buscar compromiso renal, respiratorio, hematológico o neurológico.',
      'Definir necesidad de derivación preferente o seguimiento programado.',
    ],
    algorithm: [
      'Reconocer el síndrome inflamatorio o autoinmune predominante.',
      'Solicitar evaluación inicial y laboratorio disponible.',
      'Activar la ruta GES y coordinar derivación especializada.',
      'Iniciar medidas de soporte, educación y vigilancia de complicaciones.',
      'Planificar seguimiento funcional y de actividad de enfermedad.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control crónico o derivación interna.',
      'Evaluación clínica, articular y sistémica inicial.',
      'Definición de estudios y prioridad de derivación.',
      'Resolución por reumatología y equipo interdisciplinario.',
      'Seguimiento de respuesta, adherencia y daño acumulado.',
    ],
    checklist: [
      'Registrar articulaciones o sistemas comprometidos.',
      'Adjuntar laboratorio, imágenes y tratamientos previos.',
      'Documentar criterio de derivación y plan de vigilancia.',
      'Educar sobre signos de reactivación o complicaciones.',
    ],
    watchouts: [
      'Compromiso sistémico, renal o neurológico.',
      'Dolor o inflamación con rápida pérdida funcional.',
      'Fiebre persistente o sospecha de infección asociada.',
      'Barreras importantes para continuidad del tratamiento.',
    ],
  },
  'Otorrinolaringología': {
    focus: '{topic} requiere pesquisa funcional auditiva u otorrinolaringológica, confirmación diagnóstica y derivación oportuna.',
    intake: [
      'Precisar lateralidad, duración del síntoma y antecedente de pérdidas auditivas previas.',
      'Buscar síntomas asociados como vértigo, otalgia o secreción.',
      'Revisar apoyos auditivos previos, controles y exámenes disponibles.',
      'Definir prioridad de derivación según compromiso funcional.',
    ],
    algorithm: [
      'Reconocer el problema auditivo o ORL y estimar impacto funcional.',
      'Realizar evaluación inicial y recopilar antecedentes clave.',
      'Activar la ruta GES con derivación a ORL o audiología.',
      'Coordinar estudio confirmatorio, ayudas técnicas o tratamiento.',
      'Mantener seguimiento de adherencia y funcionalidad.',
    ],
    flow: [
      'Ingreso por APS, pesquisa, control o urgencia.',
      'Evaluación clínica inicial y confirmación funcional disponible.',
      'Derivación a ORL, audiología o centro de apoyo.',
      'Resolución diagnóstica y terapéutica por especialidad.',
      'Seguimiento del uso de ayudas y rehabilitación.',
    ],
    checklist: [
      'Registrar impacto funcional y lateralidad.',
      'Adjuntar exámenes previos o tamizajes auditivos.',
      'Documentar red de derivación y ayudas requeridas.',
      'Educar sobre control y uso de dispositivos si aplica.',
    ],
    watchouts: [
      'Pérdida auditiva de instalación rápida.',
      'Dolor intenso, secreción o vértigo incapacitante.',
      'Dificultad marcada de comunicación y funcionalidad.',
      'Falta de acceso oportuno a evaluación especializada.',
    ],
  },
  'Odontología y Salud Oral': {
    focus: '{topic} debe resolverse con evaluación odontológica dirigida, alivio sintomático, prevención de complicaciones y acceso oportuno a la red dental.',
    intake: [
      'Precisar dolor, sangrado, inflamación, trauma o limitación funcional.',
      'Revisar antecedentes odontológicos, controles y comorbilidades.',
      'Buscar compromiso infeccioso, fiebre o dificultad para alimentarse.',
      'Definir urgencia y alcance de la atención requerida.',
    ],
    algorithm: [
      'Reconocer el problema odontológico y valorar gravedad.',
      'Resolver la necesidad inmediata de analgesia o manejo inicial disponible.',
      'Activar la ruta GES y coordinar atención odontológica.',
      'Planificar tratamiento integral, controles y educación.',
      'Mantener seguimiento hasta cierre o rehabilitación necesaria.',
    ],
    flow: [
      'Ingreso por APS, atención dental programada o urgencia.',
      'Evaluación clínica y definición de prioridad.',
      'Manejo inicial y derivación a red odontológica si corresponde.',
      'Tratamiento integral o procedimiento definido.',
      'Control, educación y mantención de salud oral.',
    ],
    checklist: [
      'Registrar dolor, foco dentario y signos infecciosos.',
      'Anotar antecedentes relevantes y tratamientos previos.',
      'Documentar derivación, plan dental y control.',
      'Educar en higiene, adherencia y señales de alarma.',
    ],
    watchouts: [
      'Compromiso infeccioso de partes blandas o fiebre.',
      'Dolor no controlado o sangrado persistente.',
      'Limitación para alimentarse o apertura oral reducida.',
      'Evolución desfavorable o falta de acceso a resolución.',
    ],
  },
  'GES General': {
    focus: '{topic} cuenta con una ruta base GES para ordenar evaluación inicial, activación administrativa, derivación y seguimiento mientras se define el protocolo local.',
    intake: [
      'Verificar criterios de edad, sexo o etapa de vida cuando correspondan.',
      'Registrar motivo de consulta, antecedentes y documentos ya disponibles.',
      'Definir gravedad clínica y necesidad de derivación priorizada.',
      'Coordinar la red asistencial según el nivel resolutivo disponible.',
    ],
    algorithm: [
      'Reconocer el problema de salud y documentar la sospecha o confirmación.',
      'Solicitar estudios básicos disponibles y registrar hallazgos relevantes.',
      'Activar la ruta GES y la derivación correspondiente.',
      'Planificar manejo inicial y continuidad de atención.',
      'Mantener seguimiento de oportunidad y educación al paciente.',
    ],
    flow: [
      'Ingreso por APS, urgencia, control o pesquisa programada.',
      'Evaluación inicial y recopilación de antecedentes clave.',
      'Definición de prioridad, red de derivación y documentación.',
      'Resolución por especialidad, hospital o programa correspondiente.',
      'Seguimiento y cierre de brechas asistenciales.',
    ],
    checklist: [
      'Confirmar datos de identificación y cobertura.',
      'Documentar la decisión clínica y administrativa.',
      'Adjuntar exámenes o antecedentes disponibles.',
      'Entregar plan de control y señales de alarma.',
    ],
    watchouts: [
      'Inestabilidad clínica o deterioro rápido.',
      'Imposibilidad de asegurar seguimiento.',
      'Brechas de acceso que amenacen la oportunidad.',
      'Necesidad de reevaluación prioritaria por evolución desfavorable.',
    ],
  },
};

const AREA_CLINICAL_PRESETS = {
  'Oncología': {
    suspicion: 'Baja de peso inexplicada (> 5% en 3 meses), masa palpable, sangrado sin causa aparente, síndrome constitucional (fatiga, fiebre, sudoración nocturna), hallazgo imagenológico o citológico sugerente, o resultado anómalo en tamizaje dirigido.',
    evaluation: 'Anamnesis completa con tiempo de evolución, antecedentes familiares oncológicos y factores de riesgo. Examen físico con búsqueda activa de adenopatías, hepato-esplenomegalia y masas. No retrasar la derivación para completar estudios no indispensables.',
    workup: 'Hemograma + VHS + PCR + LDH + función hepática y renal. Imagen dirigida según sospecha (ecografía, Rx o TC). Marcadores tumorales específicos si la clínica lo orienta.',
    procedures: 'Biopsia o citología indispensable para confirmación histológica. No iniciar tratamiento sin confirmación cuando el tiempo lo permite. En GES oncológico el plazo para confirmación es ≤ 45 días desde la sospecha fundada.',
  },

  'Cardiovascular': {
    suspicion: 'Dolor torácico (opresivo, irradiado a brazo o mandíbula), disnea de esfuerzo o reposo, palpitaciones, síncope, edema de extremidades inferiores, ortopnea, soplo cardíaco o HTA de difícil control.',
    evaluation: 'Signos vitales completos, auscultación cardíaca y pulmonar, pulsos periféricos, ingurgitación yugular. Clasificar si el cuadro es agudo/urgente o crónico/programable. ECG de 12 derivaciones en toda sospecha cardiovascular activa.',
    workup: 'ECG (indispensable). Hemograma, función renal, glicemia, perfil lipídico. Troponinas y BNP/NT-proBNP ante sospecha de SCA o insuficiencia cardíaca. Radiografía de tórax AP.',
    procedures: 'Ecocardiograma transtorácico para valoración estructural y funcional. Holter, prueba de esfuerzo o coronariografía según derivación a cardiología.',
  },
  'Respiratorio': {
    suspicion: 'Tos de más de 3 semanas, disnea progresiva, sibilancias recurrentes, hemoptisis, saturación < 94% en reposo, neumonías recurrentes o tabaquismo prolongado con síntomas.',
    evaluation: 'Frecuencia respiratoria, saturometría de pulso, auscultación pulmonar, uso de musculatura accesoria, capacidad funcional (¿puede hablar con frases completas?). Clasificar gravedad: leve / moderada / severa.',
    workup: 'Espirometría para patología obstructiva o restrictiva (EPOC, asma). Radiografía de tórax. Hemograma, PCR. Gases arteriales si saturación < 92% o sospecha de insuficiencia respiratoria. Cultivo de esputo si corresponde.',
    procedures: 'Broncoscopía o TC tórax para lesiones, hemoptisis o tumor pulmonar. Polisomnografía ante sospecha de SAHOS. Rehabilitación pulmonar como componente del manejo crónico.',
  },
  'Oftalmología': {
    suspicion: 'Disminución progresiva o brusca de agudeza visual, miodesopsias o fotopsias, dolor ocular, ojo rojo sin mejora, halos alrededor de luces (sospecha glaucoma). En diabetes o prematurez: tamizaje activo aunque sea asintomático.',
    evaluation: 'Lateralidad y tiempo de evolución. Agudeza visual con y sin corrección. Búsqueda de trauma, cuerpo extraño, signos inflamatorios o de presión intraocular elevada. Derivación urgente ante pérdida brusca de visión o glaucoma agudo.',
    workup: 'Fondo de ojo con dilatación (si disponible en APS). Tonometría para pesquisa de glaucoma. Retinografía en retinopatía diabética. OCT, biometría y campimetría se realizan en oftalmología especializada.',
    procedures: 'Fotocoagulación láser (retinopatía, CRVO), cirugía de cataratas (facoemulsificación), trabeculectomía en glaucoma. Derivación urgente ante sospecha de desprendimiento de retina.',
  },
  'Salud Mental': {
    suspicion: 'Tristeza persistente sin remisión (> 2 semanas), ansiedad marcada, insomnio crónico, cambios conductuales o funcionales significativos, aislamiento social, deterioro cognitivo, ideación suicida o autolesiones. Siempre pesquisar en enfermedades crónicas.',
    evaluation: 'PHQ-9 (depresión), GAD-7 (ansiedad), AUDIT-C (alcohol). Evaluar riesgo suicida: ideación, plan, acceso a medios e intención. Determinar nivel de funcionamiento y red de apoyo disponible.',
    workup: 'TSH (descarte tiroideo en depresión). Hemograma, perfil bioquímico, vitamina B12 y folato si deterioro cognitivo. El diagnóstico es esencialmente clínico; los exámenes descartan causas orgánicas.',
    procedures: 'Psicoterapia (TCC, ACT) como primera línea en depresión y ansiedad leve-moderada. Farmacoterapia según diagnóstico y gravedad. Derivación urgente a psiquiatría en psicosis activa, riesgo suicida alto o episodio maníaco.',
  },
  'Ginecología y Obstetricia': {
    suspicion: 'Sangrado vaginal anormal (intermenstrual, postcoital o postmenopáusico), dolor pélvico crónico, masa pelviana, cambios en ciclo menstrual. En embarazo: sangrado, dinámica uterina antes de término, hipertensión, fiebre o falta de movimientos fetales.',
    evaluation: 'Anamnesis gineco-obstétrica: FUM, paridad, PAP al día, método anticonceptivo. En embarazo: PA, edema, altura uterina, FCF y membranas. Examen pélvico con especuloscopía si corresponde.',
    workup: 'Ecografía pelviana o transvaginal. BhCG si sospecha de embarazo. PAP si no está vigente. Hemograma, VHS, orina completa. En preeclampsia: proteinuria, ácido úrico, LDH.',
    procedures: 'Colposcopía ante PAP alterado. Histeroscopía o legrado por sangrado uterino anormal. Laparoscopía diagnóstica/terapéutica. Cesárea o parto instrumentado según indicación obstétrica.',
  },
  'Digestivo y Hepatología': {
    suspicion: 'Dolor abdominal persistente o recurrente, disfagia progresiva, sangrado digestivo (hematemesis, melena, hematoquecia), baja de peso, ictericia, ascitis de novo, alteración de pruebas hepáticas o hepatomegalia palpable.',
    evaluation: 'Tiempo de evolución, síntomas asociados (náuseas, vómitos, cambio del hábito intestinal, pirosis). Examen abdominal con búsqueda de organomegalia, ascitis (matidez cambiante) o dolor localizado.',
    workup: 'Hemograma, PCR, función hepática completa (TGO, TGP, GGT, FA, bilirrubina), coagulación, albúmina. Ecografía abdominal completa. Antígeno de H. pylori en heces o test de aliento.',
    procedures: 'Endoscopía alta (VEDA) o colonoscopía para diagnóstico y tratamiento. CPER en patología biliopancreática obstructiva. Biopsia hepática en hepatopatía crónica sin etiología aclarada.',
  },
  'Nefrología y Urología': {
    suspicion: 'Edema, hematuria macro o microscópica, proteinuria, HTA de difícil control, oliguria, síntomas miccionales (disuria, urgencia, nicturia, disminución del chorro), dolor lumbar o cólico renal, masa renal o pelviana.',
    evaluation: 'PA, edema y distribución, examen renal (puño-percusión de Giordano), evaluación de micción. Antecedentes de diabetes, HTA, litiasis, ITU a repetición o uso crónico de AINEs.',
    workup: 'Creatinina + TFG (CKD-EPI), BUN, electrolitos. Orina completa con sedimento. Índice proteína/creatinina o proteinuria de 24h. Ecografía renal y vesical. Hemograma, VHS.',
    procedures: 'Biopsia renal en síndrome nefrótico/nefrítico sin causa clara. Litotricia o ureteroscopía en litiasis. RTU en tumores vesicales. Inicio de diálisis (HD o DP) según progresión de ERC.',
  },
  'Endocrinología y Metabólico': {
    suspicion: 'Poliuria/polidipsia, baja o alza de peso inexplicada, intolerancia al frío o calor, sudoración excesiva, fatiga crónica, alteraciones menstruales, osteoporosis precoz, HTA de difícil control o dislipidemia grave en persona joven.',
    evaluation: 'Antecedentes familiares de diabetes, tiroides o dislipidemia. IMC, PA, perímetro abdominal. Signos de hipo/hipertiroidismo, acromegalia, hipercortisolismo o hipogonadismo.',
    workup: 'Glicemia en ayunas + HbA1c. TSH. Perfil lipídico completo. Función renal y hepática. Calcemia, fosfemia y PTH si sospecha paratiroidea. Densitometría ósea según indicación.',
    procedures: 'TSOG en prediabetes o diagnóstico dudoso. Ecografía tiroidea + PAAF si nódulo ≥ 1 cm. RM silla turca en sospecha de adenoma hipofisario. Densitometría ósea en seguimiento de osteoporosis.',
  },
  'Neurología': {
    suspicion: 'Déficit motor o sensitivo focal agudo, cefalea brusca severa ("la peor de la vida"), alteración de conciencia, convulsiones de inicio reciente, vértigo con inestabilidad de marcha, diplopia, disfagia, disartria o deterioro cognitivo progresivo.',
    evaluation: 'Glasgow, evaluación de pares craneales, fuerza y tono por segmento, reflejos osteotendinosos, sensibilidad y marcha. Tiempo de instalación (agudo: minutos-horas / subagudo: días-semanas). Signos meníngeos si hay cefalea con fiebre.',
    workup: 'TC cerebro sin contraste (urgente en déficit focal agudo, cefalea súbita o compromiso de conciencia). RM cerebro para patología subaguda/crónica. EEG si convulsiones. Hemograma, glicemia, PCR, coagulación.',
    procedures: 'Punción lumbar en sospecha de meningitis o HSA con TC negativa. Electromiografía en neuropatía periférica. Angiografía cerebral (CTA o DSA) para aneurismas o MAV. tPA o trombectomía en ACV isquémico agudo según criterios.',
  },
  'Traumatología y Rehabilitación': {
    suspicion: 'Dolor articular o musculoesquelético de más de 6 semanas sin causa traumática clara, limitación funcional progresiva, deformidad articular, fractura de baja energía (sospecha osteoporosis) o deterioro progresivo de movilidad.',
    evaluation: 'Localización, tiempo y mecanismo de inicio. Evaluar rango articular, fuerza muscular, estabilidad ligamentosa y marcha. Señales de alarma: dolor nocturno que despierta, fiebre, baja de peso (descartar tumor óseo o infección).',
    workup: 'Radiografía simple (primera línea en fractura, artropatía y lesión ósea). Hemograma + VHS + PCR si proceso inflamatorio. Densitometría ósea en sospecha de osteoporosis. RM para lesiones de partes blandas o cartílago.',
    procedures: 'Artroplastia total de cadera o rodilla. Artroscopía diagnóstica y terapéutica. Osteosíntesis en fracturas. Rehabilitación kinésica estructurada como parte integral del tratamiento, no solo post-cirugía.',
  },
  'Pediatría y Neonatología': {
    suspicion: 'Retraso del desarrollo psicomotor, curva pondoestatural alterada (< p3 o cruce de percentilos), infecciones graves o recurrentes, convulsiones, ictericia neonatal prolongada (> 2 semanas), cianosis o soplo cardíaco, prematurez o bajo peso al nacer.',
    evaluation: 'Curva de crecimiento y hitos del desarrollo por edad gestacional corregida. En neonato: Apgar, peso, EG, dificultad respiratoria, termorregulación y alimentación. Examen neurológico pediátrico según edad.',
    workup: 'Hemograma + PCR + VHS en infección. Bilirrubina total y fraccionada en ictericia. Glicemia y electrolitos en neonato. Tamizaje neonatal universal (PKU, hipotiroidismo, cardiopatía crítica). Neuroimagen si convulsiones o daño neurológico.',
    procedures: 'Fototerapia en hiperbilirrubinemia neonatal. Cirugía correctiva en cardiopatías congénitas. CPAP/ventilación en SDR del prematuro. Vacunación y controles del niño sano como pilar preventivo.',
  },
  'Reumatología e Inmunología': {
    suspicion: 'Artritis de más de 6 semanas, rigidez matutina prolongada (> 1 hora), compromiso simétrico de pequeñas articulaciones, úlceras orales recurrentes, rash malar o fotosensibilidad, fenómeno de Raynaud, uveítis anterior.',
    evaluation: 'Número y distribución de articulaciones comprometidas, duración de la rigidez matutina, signos inflamatorios (calor, rubor, aumento de volumen). Búsqueda de compromiso sistémico: pulmón, riñón, piel, sistema nervioso.',
    workup: 'Hemograma + VHS + PCR. Factor reumatoideo (FR) y Anti-CCP. ANA y anti-DNA + complemento (C3, C4) si sospecha de LES. Ácido úrico en artritis gotosa. Radiografías articulares comparativas.',
    procedures: 'Artrocentesis diagnóstica y terapéutica. Biopsia sinovial o de piel. Terapia biológica (anti-TNF, anti-IL-6, anti-CD20) según derivación a reumatología. Educación sobre protección articular y adherencia.',
  },
  'Otorrinolaringología': {
    suspicion: 'Hipoacusia progresiva bilateral, acúfenos persistentes, vértigo con inestabilidad de marcha, disfagia u odinofagia > 3 semanas, disfonía persistente, epistaxis recurrente, obstrucción nasal crónica, adenopatía cervical dura o ronquido severo con apneas observadas.',
    evaluation: 'Lateralidad y tiempo de evolución. Otoscopía básica. Inspección de fosas nasales, faringe y laringe. Evaluación de voz, deglución y apertura oral. Palpación de cuello buscando masa o adenopatía.',
    workup: 'Audiometría tonal liminar para hipoacusia. Nasofibroscopía ante disfonía > 3 semanas o masa faríngolaríngea. Ecografía cervical para adenopatías. TC de senos paranasales en sinusopatía crónica. TC/RM cuello para masas o tumores.',
    procedures: 'Audífonos en hipoacusia severa. Implante coclear en hipoacusia profunda bilateral. Timpanoplastia, adenoamigdalectomía. CPAP en SAHOS. Cirugía oncológica ORL según estadio.',
  },
  'Odontología y Salud Oral': {
    suspicion: 'Dolor dental o maxilofacial persistente, infección odontogénica (trismo, fiebre, celulitis facial), traumatismo dentofacial, lesiones de mucosa oral > 2 semanas sin mejora (descartar lesión premaligna), maloclusión severa con compromiso funcional.',
    evaluation: 'Localización del dolor, tiempo de evolución, presencia de fiebre o trismo (signo de complicación grave). Inspección de cavidad oral, mucosa, encías y tejidos blandos pericraneales. Buscar signos de absceso o celulitis.',
    workup: 'Radiografía periapical o panorámica (OPG). Hemograma + PCR en infección con compromiso sistémico. Cultivo de exudado en infección severa o paciente inmunosuprimido.',
    procedures: 'Exodoncia, endodoncia, drenaje de absceso (urgencia). Cirugía ortognática en maloclusión severa. Rehabilitación protésica (removible, fija o implantosoportada). Biopsia de lesiones premalignas de mucosa oral.',
  },
  'GES General': {
    suspicion: 'Evaluar el motivo de consulta con anamnesis dirigida. Identificar síntomas de alarma: baja de peso inexplicada, sangrado, dolor persistente, masa palpable, deterioro funcional o compromiso del estado general.',
    evaluation: 'Signos vitales, tiempo de evolución, antecedentes relevantes y tratamientos en curso. Examen físico completo orientado al sistema comprometido. Identificar señales de alarma que requieran derivación urgente.',
    workup: 'Hemograma, función renal, hepática y glicemia como batería general. Imágenes básicas o estudio dirigido según orientación clínica. Solicitar los exámenes que cambiarán la conducta, no como rutina sin propósito.',
    procedures: 'Activar ruta GES según patología identificada. Toda sospecha fundada debe documentarse y derivarse sin esperar confirmación cuando los plazos GES lo exigen. El plazo corre desde la fecha de sospecha documentada.',
  },
};

const TOPIC_STARTER_OVERRIDES = [
  {
    keywords: ['alivio del dolor', 'cuidados paliativos'],
    preset: {
      focus: '{topic} debe centrarse en alivio sintomático, control del dolor, soporte psicosocial y continuidad coordinada en la red paliativa.',
      algorithm: [
        'Evaluar dolor, otros síntomas y carga funcional del paciente.',
        'Determinar severidad, necesidades de apoyo y riesgo de descompensación.',
        'Activar la ruta GES y coordinar cuidados paliativos o apoyo domiciliario.',
        'Ajustar medidas de confort, educación y soporte al cuidador.',
        'Asegurar seguimiento cercano y reevaluación de síntomas.',
      ],
      watchouts: [
        'Dolor refractario, disnea o delirium.',
        'Sangrado, vómitos persistentes o deshidratación.',
        'Agotamiento del cuidador o ausencia de soporte.',
        'Deterioro rápido que requiera escalamiento de cuidados.',
      ],
    },
  },
  {
    keywords: ['infarto'],
    preset: {
      focus: '{topic} exige reconocimiento inmediato, estratificación rápida y derivación sin demora a la red cardiovascular resolutiva.',
      intake: [
        'Precisar dolor torácico, tiempo de inicio y síntomas asociados.',
        'Registrar signos vitales, ECG disponible y estabilidad hemodinámica.',
        'Revisar factores de riesgo, medicación actual y eventos previos.',
        'Definir si se encuentra en contexto de urgencia vital o secuela grave.',
      ],
      watchouts: [
        'Dolor persistente, hipotensión o shock.',
        'Arritmias, síncope o edema agudo pulmonar.',
        'Cambios dinámicos compatibles con isquemia aguda.',
        'Retraso en acceso a red de reperfusión o evaluación especializada.',
      ],
    },
  },
  {
    keywords: ['ataque cerebrovascular', 'subaracnoidea', 'aneurismas cerebrales'],
    preset: {
      focus: '{topic} necesita activación rápida, evaluación neurológica dirigida y coordinación inmediata con la red neurovascular.',
      intake: [
        'Precisar hora de inicio o última vez visto sano.',
        'Registrar examen neurológico, conciencia y signos vitales.',
        'Identificar anticoagulación, comorbilidades y antecedentes vasculares.',
        'Definir urgencia y factibilidad de traslado inmediato.',
      ],
      watchouts: [
        'Déficit neurológico progresivo o compromiso de conciencia.',
        'Cefalea súbita intensa, vómitos o inestabilidad.',
        'Convulsiones o compromiso respiratorio.',
        'Demora en acceso a imagen o red neurovascular.',
      ],
    },
  },
  {
    keywords: ['diabetes mellitus tipo 1', 'diabetes mellitus tipo 2'],
    preset: {
      focus: '{topic} requiere control metabólico estructurado, educación intensiva y vigilancia activa de complicaciones agudas y crónicas.',
      checklist: [
        'Registrar glicemias, HbA1c o controles recientes si existen.',
        'Anotar tratamiento actual, adherencia y educación entregada.',
        'Documentar pesquisa de pie, visión, función renal y factores de riesgo.',
        'Dejar plan de control, interconsulta y signos de descompensación.',
      ],
      watchouts: [
        'Hipoglicemia, cetosis o síntomas de descompensación metabólica.',
        'Compromiso renal, visual o neurológico progresivo.',
        'Dificultad importante para adherencia o acceso a insumos.',
        'Infección o deshidratación que empeore el control.',
      ],
    },
  },
  {
    keywords: ['hipotiroidismo'],
    preset: {
      focus: '{topic} debe organizarse con confirmación diagnóstica, evaluación de severidad y seguimiento del reemplazo hormonal y sus barreras de acceso.',
      watchouts: [
        'Compromiso hemodinámico, letargia marcada o deterioro progresivo.',
        'Descompensación clínica por suspensión o mala adherencia.',
        'Comorbilidades que dificulten ajuste y seguimiento.',
        'Persistencia sintomática pese a controles previos.',
      ],
    },
  },
  {
    keywords: ['vih', 'sida'],
    preset: {
      focus: '{topic} requiere confirmación diagnóstica, ingreso ordenado a control y coordinación continua para tratamiento, adherencia y prevención.',
      checklist: [
        'Registrar fecha y vía de diagnóstico, controles previos y carga de apoyo.',
        'Adjuntar exámenes disponibles y antecedentes de infecciones oportunistas si existieran.',
        'Documentar derivación a programa o especialidad y fecha objetivo.',
        'Entregar consejería, plan de control y señales de alarma.',
      ],
      watchouts: [
        'Fiebre persistente, baja de peso marcada o compromiso respiratorio.',
        'Diarrea prolongada, lesiones oportunistas o deterioro neurológico.',
        'Barreras relevantes para adherencia o continuidad.',
        'Ausencia de red de apoyo en contexto de alta vulnerabilidad.',
      ],
    },
  },
  {
    keywords: ['hepatitis crónica'],
    preset: {
      focus: '{topic} debe abordarse con confirmación etiológica, vigilancia de daño hepático y derivación ordenada para tratamiento y seguimiento.',
      watchouts: [
        'Ictericia, ascitis o encefalopatía.',
        'Sangrado digestivo o dolor abdominal persistente.',
        'Deterioro acelerado de laboratorio o estado general.',
        'Dificultad para continuidad diagnóstica o terapéutica.',
      ],
    },
  },
  {
    keywords: ['cirrosis'],
    preset: {
      focus: '{topic} requiere seguimiento estrecho de descompensación hepática, coordinación farmacológica y vigilancia de complicaciones.',
      watchouts: [
        'Ascitis, encefalopatía o sangrado digestivo.',
        'Ictericia progresiva, fiebre o dolor abdominal.',
        'Confusión, somnolencia o mala adherencia terapéutica.',
        'Reingresos reiterados o imposibilidad de control oportuno.',
      ],
    },
  },
  {
    keywords: ['helicobacter pylori'],
    preset: {
      focus: '{topic} debe organizarse con confirmación diagnóstica, indicación terapéutica ordenada y verificación posterior de erradicación según red disponible.',
      watchouts: [
        'Baja de peso, sangrado digestivo o anemia.',
        'Dolor persistente o vómitos recurrentes.',
        'Fracaso terapéutico o recaída sintomática.',
        'Falta de seguimiento para comprobar erradicación.',
      ],
    },
  },
  {
    keywords: ['retinopatia diabetica', 'retinopatía diabética', 'retinopatia del prematuro', 'desprendimiento de retina'],
    preset: {
      focus: '{topic} exige pesquisa visual dirigida, coordinación temprana con oftalmología y control estricto de oportunidad para proteger la visión.',
      watchouts: [
        'Pérdida de visión, metamorfopsias o sombras.',
        'Fotopsias o progresión acelerada de síntomas.',
        'Dificultad para control especializado oportuno.',
        'Comorbilidades que aceleren el deterioro visual.',
      ],
    },
  },
  {
    keywords: ['cataratas', 'refraccion', 'estrabismo', 'trauma ocular'],
    preset: {
      focus: '{topic} debe organizarse con evaluación visual inicial, confirmación oftalmológica y resolución oportuna para evitar secuelas funcionales.',
    },
  },
  {
    keywords: ['esquizofrenia', 'trastorno bipolar', 'depresion', 'depresión', 'alzheimer', 'demencias'],
    preset: {
      focus: '{topic} necesita evaluación de riesgo, continuidad terapéutica y coordinación con la red de salud mental o apoyo familiar según funcionalidad.',
    },
  },
  {
    keywords: ['alcohol y drogas', 'tabaco'],
    preset: {
      focus: '{topic} requiere intervención motivacional, evaluación de riesgo y seguimiento estructurado para sostener el cambio terapéutico.',
      checklist: [
        'Registrar patrón de consumo, motivación al cambio y comorbilidades.',
        'Documentar riesgo actual, red de apoyo y barreras de adherencia.',
        'Definir plan terapéutico, derivación y controles próximos.',
        'Entregar señales de alarma y contacto para rescate terapéutico.',
      ],
      watchouts: [
        'Síndrome de abstinencia, riesgo suicida o violencia.',
        'Consumo concomitante de múltiples sustancias.',
        'Fracaso reiterado por falta de apoyo o acceso.',
        'Descompensación psiquiátrica o médica asociada.',
      ],
    },
  },
  {
    keywords: ['agresion sexual', 'agresión sexual'],
    preset: {
      focus: '{topic} debe priorizar contención, seguridad, atención integral y coordinación clínica, psicosocial y legal sin revictimización.',
      intake: [
        'Asegurar privacidad, acompañamiento y contención inicial.',
        'Buscar lesiones, sangrado, dolor, riesgo vital y necesidad de profilaxis o atención urgente.',
        'Registrar tiempo del evento, apoyos disponibles y voluntad informada de la persona.',
        'Coordinar la red clínica, psicosocial y de protección según la edad.',
      ],
      watchouts: [
        'Riesgo vital, sangrado o trauma importante.',
        'Crisis aguda, riesgo suicida o ausencia de red protectora.',
        'Necesidad urgente de coordinación intersectorial.',
        'Pérdida de oportunidad de atención integral por demoras.',
      ],
    },
  },
  {
    keywords: ['parto prematuro', 'analgesia del parto'],
    preset: {
      focus: '{topic} requiere evaluación obstétrica oportuna, vigilancia materno-fetal y coordinación clara con la red perinatal.',
    },
  },
  {
    keywords: ['prematuro', 'recien nacido', 'recién nacido', 'hipoacusia moderada', 'hipoacusia neurosensorial'],
    preset: {
      focus: '{topic} debe sostener seguimiento neonatal o pediátrico precoz, con intervención temprana y coordinación con familia y subespecialidad.',
    },
  },
  {
    keywords: ['gran quemado', 'politraumatizado', 'traumatismo cráneo'],
    preset: {
      focus: '{topic} exige estabilización inicial, pesquisa de gravedad y derivación prioritaria a la red de trauma o cuidado crítico.',
      watchouts: [
        'Compromiso de vía aérea, shock o deterioro neurológico.',
        'Dolor intenso, sangrado o progresión clínica rápida.',
        'Falta de acceso oportuno a centro resolutivo.',
        'Complicaciones infecciosas o funcionales tempranas.',
      ],
    },
  },
  {
    keywords: ['ayudas técnicas'],
    preset: {
      focus: '{topic} debe coordinarse con evaluación funcional, indicación oportuna de apoyo y seguimiento de uso efectivo para preservar autonomía.',
    },
  },
  {
    keywords: ['rehabilitacion sars', 'rehabilitación sars'],
    preset: {
      focus: '{topic} necesita evaluación funcional y respiratoria, planificación de rehabilitación progresiva y seguimiento de secuelas.',
    },
  },
  {
    keywords: ['marcapasos', 'valvula', 'válvula', 'cardiopatias congenitas', 'cardiopatías congénitas'],
    preset: {
      focus: '{topic} requiere evaluación cardiovascular especializada, coordinación de procedimiento y seguimiento de seguridad y funcionalidad.',
    },
  },
  {
    keywords: ['hemofilia'],
    preset: {
      focus: '{topic} exige reconocimiento de sangrado, coordinación con hematología y prevención de complicaciones hemorrágicas.',
      watchouts: [
        'Sangrado activo, dolor articular importante o trauma.',
        'Compromiso neurológico o abdominal sugerente de sangrado interno.',
        'Falta de acceso a tratamiento o control oportuno.',
        'Dificultad para reconocer y consultar precozmente.',
      ],
    },
  },
];

export function normalizeGesText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function getGesTopicMeta(topicName = '') {
  const normalizedName = normalizeGesText(topicName);
  const rule = GES_AREA_RULES.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(keyword))
  );

  const area = rule?.area || 'GES General';
  const theme = GES_THEME_MAP[rule?.theme || 'slate'];

  return { area, theme };
}

function includesAnyKeyword(normalizedName, keywords = []) {
  return keywords.some((keyword) => normalizedName.includes(normalizeGesText(keyword)));
}

function mergePreset(basePreset = {}, overridePreset = {}) {
  return {
    ...basePreset,
    ...overridePreset,
    intake: overridePreset.intake || basePreset.intake || [],
    algorithm: overridePreset.algorithm || basePreset.algorithm || [],
    flow: overridePreset.flow || basePreset.flow || [],
    checklist: overridePreset.checklist || basePreset.checklist || [],
    watchouts: overridePreset.watchouts || basePreset.watchouts || [],
  };
}

export function getGesStarterPreset(topicName = '', area) {
  const normalizedName = normalizeGesText(topicName);
  const basePreset = AREA_STARTER_PRESETS[area] || AREA_STARTER_PRESETS['GES General'];
  const override = TOPIC_STARTER_OVERRIDES.find(({ keywords }) =>
    includesAnyKeyword(normalizedName, keywords)
  );

  return mergePreset(basePreset, override?.preset);
}

function toMarkdownList(items = []) {
  return items.map((item) => `- ${item}`).join('\n');
}

export function hasMeaningfulGesContent(topic = {}) {
  const textFields = [
    topic.description,
    topic.clinical_summary,
    topic.diagnostic_orientation,
    topic.complementary_studies,
    topic.initial_treatment,
    topic.protocol_objective,
    topic.protocol_file_url,
    topic.guarantee_details,
  ];

  const hasTextContent = textFields.some((value) => typeof value === 'string' && value.trim().length > 0);
  const hasStructuredContent = [
    topic.content_blocks,
    topic.protocol_flowchart,
    topic.protocol_algorithm,
    topic.protocol_medications,
    topic.protocol_authors,
    topic.protocol_participants,
    topic.related_topics,
    topic.related_tools,
  ].some((value) => Array.isArray(value) && value.length > 0);

  return hasTextContent || hasStructuredContent;
}

export function buildGesStarterContent(topic) {
  const { area, theme } = getGesTopicMeta(topic.name);
  const preset = getGesStarterPreset(topic.name, area);
  const gesLabel = topic.order ? `GES N.${topic.order}` : 'Problema de salud GES';
  const localProtocolMessage = topic.has_local_protocol
    ? 'Este tema mantiene protocolo local activo. Priorizar la ruta institucional y usar esta ficha solo como apoyo visual complementario.'
    : 'Contenido base transitorio mientras se libera el protocolo local institucional. Adaptar la conducta a lineamientos GES vigentes, disponibilidad local y criterio clínico.';

  const summaryContent = [
    `**${preset.focus.replaceAll('{topic}', topic.name)}**`,
    '',
    '### Qué debe resolverse en el primer contacto',
    toMarkdownList(preset.intake),
  ].join('\n');

  const clinicalPreset = AREA_CLINICAL_PRESETS[area] || AREA_CLINICAL_PRESETS['GES General'];
  const clinicalSections = [
    { label: 'Cuándo sospechar', content: clinicalPreset.suspicion },
    { label: 'Evaluación inicial', content: clinicalPreset.evaluation },
    { label: 'Exámenes de primera línea', content: clinicalPreset.workup },
    { label: 'Procedimientos clave', content: clinicalPreset.procedures },
  ].filter(s => s.content);

  const checklistContent = [
    '### Checklist operativa',
    toMarkdownList(preset.checklist),
  ].join('\n');

  const watchoutsContent = [
    '### Escalar sin demora si aparece',
    toMarkdownList(preset.watchouts),
  ].join('\n');

  return {
    area,
    theme,
    gesLabel,
    summaryContent,
    clinicalSections,
    algorithmDetails: preset.algorithm,
    flowDetails: preset.flow,
    checklistContent,
    watchoutsContent,
    localProtocolMessage,
    description: `Ruta base GES para ${topic.name}, con activación, derivación y seguimiento mientras se libera el protocolo local.`,
  };
}

export function buildGesFallbackBlocks(topic) {
  const starter = buildGesStarterContent(topic);

  return [
    {
      id: `ges-clinical-${topic.id}`,
      type: 'clinical',
      title: 'Orientación Clínica',
      sections: starter.clinicalSections,
      area: starter.area,
      layout_position: 'main',
    },
    {
      id: `ges-summary-${topic.id}`,
      type: 'text',
      title: 'Ruta GES — Primer contacto',
      content: starter.summaryContent,
      layout_position: 'main',
    },
    {
      id: `ges-algorithm-${topic.id}`,
      type: 'algorithm',
      title: 'Secuencia de activación',
      description: 'Pasos para ordenar la conducta clínica y administrativa GES.',
      details: starter.algorithmDetails,
      color: starter.theme.accent,
      layout_position: 'main',
    },
    {
      id: `ges-flow-${topic.id}`,
      type: 'flowchart',
      title: 'Flujo asistencial',
      description: 'Ruta inter-niveles: APS → derivación → especialidad → seguimiento.',
      details: starter.flowDetails,
      color: starter.theme.accent,
      layout_position: 'main',
    },
    {
      id: `ges-checklist-${topic.id}`,
      type: 'text',
      title: 'Checklist operativa',
      content: starter.checklistContent,
      layout_position: 'sidebar',
    },
    {
      id: `ges-watchouts-${topic.id}`,
      type: 'text',
      title: 'Señales de escalamiento',
      content: starter.watchoutsContent,
      layout_position: 'sidebar',
    },
    {
      id: `ges-alert-${topic.id}`,
      type: 'alert',
      title: topic.has_local_protocol ? 'Protocolo local activo' : 'Protocolo local pendiente',
      content: starter.localProtocolMessage,
      layout_position: 'sidebar',
    },
  ];
}

export function buildGesClinicalBlock(topic) {
  const starter = buildGesStarterContent(topic);
  return {
    id: `ges-clinical-${topic.id}`,
    type: 'clinical',
    title: 'Orientación Clínica',
    sections: starter.clinicalSections,
    area: starter.area,
    layout_position: 'main',
  };
}

export function buildGesStarterPayload(topic) {
  return {
    description: topic.description?.trim() || buildGesStarterContent(topic).description,
    layout_mode: 'two-panel-6040',
    content_blocks: buildGesFallbackBlocks(topic),
  };
}
