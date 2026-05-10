/**
 * HCSFB 162 — Protocolo Manejo Pérdida Reproductiva, HCSF Bulnes.
 * Edición Primera, Febrero 2026, Vigencia Febrero 2030.
 *
 * Estructura según axioma:
 *   Protocolo · Definiciones · Fármacos · Flujogramas · Post-evento
 *
 * Uso:
 *   node --env-file=.env scripts/update-perdida-reproductiva-v1.mjs
 *   node --env-file=.env scripts/update-perdida-reproductiva-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TOPIC_ID = '69701c61dce79987fb05319a';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ── PROTOCOL_AUTHORS ────────────────────────────────────────────────
const protocol_authors = [
  { name: 'Verónica Ceballos Valerio', role: 'Médico Jefe Servicio de Ginecología y Obstetricia HCSFB — Elaborado por' },
  { name: 'Beatriz Jara Paredes',      role: 'Matrona Jefe (S) Servicio de Ginecología y Obstetricia HCSFB — Elaborado por' },
  { name: 'Dra. Micaela Fasani Montagna', role: 'Subdirectora Médica HCSF Bulnes — Revisado por' },
  { name: 'Álvaro Lagos Llanos',       role: 'Director HCSFB — Autorizado por' },
  { name: 'Valeska Vivallo P.',        role: 'V° Bueno OFICYSP' },
  { name: 'Dr. René Fabbri Aguilera',  role: 'Colaborador — Médico Jefe Ginecología y Obstetricia Hospital Clínico Herminda Martín' },
  { name: 'Felipe Acevedo Sylvester',  role: 'Colaborador — Coordinador Programa Salud Sexual y Reproductiva SSÑ' },
];

// ── BLOQUES ─────────────────────────────────────────────────────────
const blocks = [
  // ════════════════════════════════════════════════════════════════
  // PESTAÑA: Protocolo
  // ════════════════════════════════════════════════════════════════
  {
    id: 'pr-objetivo',
    type: 'text',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_triage',
    color: 'rose',
    order: 1,
    title: 'Objetivo y alcance',
    content: `### Objetivo general
Asegurar medidas concretas que permitan atención humanizada y estandarizada de usuarias y usuarios que se enfrenten a proceso de pérdida reproductiva en HCSF Bulnes.

### Alcance
Mujeres en edad fértil pertenecientes a la **microrred Hospital Comunitario de Salud Familiar Bulnes**.

### Responsables de ejecución
- Profesionales matronas/es — Servicio clínico G-O y Policlínico HCSFB
- Médicos generales HCSFB
- TENS — Servicio clínico G-O HCSFB

### Supervisión
- Médico jefe Servicio clínico G-O HCSFB
- Matrona supervisora Servicio clínico G-O HCSFB`,
    layout_position: 'main',
  },

  {
    id: 'pr-recepcion',
    type: 'flowchart',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_triage',
    color: 'blue',
    order: 2,
    title: 'Manejo inicial común — Síntomas/Amenaza de aborto',
    description: 'Recepción y evaluación inicial de toda paciente que consulta por sospecha de pérdida reproductiva.',
    details: [
      'Recepción de usuaria, motivo de consulta y control de signos vitales — TENS.',
      'Anamnesis completa — Matrona de turno.',
      'Examen ginecológico y obstétrico — Matrona de turno.',
      'Solicitud de orina completa, urocultivo y exámenes de sangre — Matrona/Médico de Turno.',
      'Presentación del caso a Médico de Turno — Matrona de turno.',
      'Evaluación clínica y análisis de exámenes — Médico de Turno.',
      'Educación y contención en box — TENS, Matrona y Médico de Turno.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-sintomas-precoz',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'amber',
    order: 3,
    title: 'Síntomas de aborto precoz (<12+6 semanas)',
    items: [
      '━━━ Hospitalización en HCSFB ━━━',
      'Reposo en cama.',
      'Analgesia SOS.',
      'Ecografía transvaginal en sala por profesional capacitado al día siguiente.',
      'Seguimiento por psicología y equipo ChCC (Chile Crece Contigo) HCSFB.',
      'Conducta posterior según hallazgos ecográficos y evolución clínica.',
      '',
      '━━━ Seguimiento ambulatorio ━━━',
      'Reposo relativo y abstinencia sexual mientras persistan molestias.',
      'Analgesia SOS.',
      'Ecografía de control por profesional capacitado en urgencia maternal según necesidad o indicación médica/matronería.',
      'Conducta posterior según hallazgo ecográfico y evolución clínica.',
      '',
      '━━━ Sin disponibilidad de ecografía al día siguiente ━━━',
      'No hospitalizar en HCSFB; derivar a UGO HHM para evaluación con ecografía.',
      'Si la paciente rechaza derivación, ofrecer seguimiento ecográfico ambulatorio diferido.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-sintomas-tardio',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'amber',
    order: 4,
    title: 'Síntomas de aborto tardío (≥13 semanas)',
    items: [
      'Manejar como metrorragia de II trimestre.',
      'Médico de Turno presenta caso a Ginecólogo/a de turno HHM.',
      'Realizar interconsulta y derivar a Urgencia Ginecología y Obstetricia (UGO) Hospital Herminda Martín.',
      '',
      '━━━ Sospecha de infección ovular o aborto séptico ━━━',
      'Iniciar manejo de soporte.',
      'Ceftriaxona 1 g EV + Metronidazol 500 mg EV.',
      'Derivar a UGO HHM bajo sospecha clínica de huevo roto infectado o aborto séptico.',
      'Alergia a penicilina: Clindamicina 900 mg c/8 h EV + Gentamicina 5 mg/kg/día EV.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-aborto-inevitable',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'red',
    order: 5,
    title: 'Aborto inevitable',
    items: [
      '━━━ Criterios diagnósticos ━━━',
      'Modificaciones cervicales (cuello uterino).',
      'Rotura ovular (rotura de membranas ovulares).',
      'Aborto séptico.',
      'Metrorragia abundante (sangrado uterino abundante).',
      '',
      '━━━ Manejo ━━━',
      'Si signos ecográficos de desprendimiento o huevo roto NO infectado: el profesional que realiza la ecografía debe educar respecto al pronóstico ominoso.',
      'Equipo G-O HCSF Bulnes y ChCC realizan seguimiento al caso.',
      'Médico de turno o médico que realice la ecografía queda como responsable del caso.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-aborto-evolucion',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'orange',
    order: 6,
    title: 'Aborto en evolución',
    items: [
      'Diagnóstico: clínico (metrorragia + modificaciones cervicales + dolor cólico intenso, ± restos palpables).',
      '',
      '━━━ Manejo inicial ━━━',
      'Recepción y signos vitales — TENS.',
      'Anamnesis y examen ginecológico — Matrona de turno.',
      'Instalación de VVP + exámenes de sangre.',
      'Presentación del caso a Médico de Turno.',
      'Evaluación clínica y de exámenes — Médico de Turno.',
      'Educación y contención en box.',
      '',
      '━━━ Decisión por edad gestacional ━━━',
      'Aborto en evolución precoz sin signos clínicos de infección: candidata a manejo en HCSF Bulnes.',
      'Embarazo ≥12 semanas con clínica compatible: derivar y evaluar en HHM.',
      '',
      '━━━ Si se hospitaliza en Bulnes ━━━',
      'Información a usuaria, contención e inicio de manejo de duelo perinatal (Ley Dominga).',
      'Reposo relativo.',
      'Manejo del dolor con analgesia SOS — se sugiere Paracetamol.',
      'En sala, evaluar signos clínicos y ecográficos de aborto completo/incompleto y descartar infecciones asociadas.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-aborto-incompleto',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'red',
    order: 7,
    title: 'Aborto incompleto',
    items: [
      '━━━ Diagnóstico ━━━',
      'Evidencia o historia de expulsión de restos ovulares.',
      'Dolor variable, metrorragia escasa.',
      'Ecografía: restos de ecogenicidad variable, medición endometrial ≥15 mm.',
      '',
      '━━━ Manejo — Paciente hospitalizada o citada con ecografía ━━━',
      'Médico ecografista o Médico de Turno explica situación clínica y ofrece alternativas.',
      'EXPECTANTE: medición endometrial 15–20 mm sin metrorragia severa ni fiebre → alta con manejo expectante, control con ecografía por urgencias en 48 días.',
      'MÉDICO: con paciente hospitalizada. Misoprostol según FIGO 2023 (ver pestaña Fármacos).',
      '',
      '━━━ Seguimiento clínico y ecográfico ━━━',
      'Exámenes preoperatorios y régimen 0 desde 00:00 h por si se requiere derivar a HHM al día siguiente para legrado.',
      'QUIRÚRGICO: si rechaza manejo médico o este es frustro tras 24 h de misoprostol → derivar a HHM para legrado. Médico de sala presenta caso, realiza interconsulta y deriva.',
      '',
      '━━━ Reacciones adversas a misoprostol ━━━',
      'Hipertermia transitoria, hiper/hipotensión, edema, mareos, cefalea, ansiedad, tos, artralgia, mialgia, hipertonía uterina, calosfríos, rash.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-aborto-completo',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'emerald',
    order: 8,
    title: 'Aborto completo',
    items: [
      '━━━ Diagnóstico ━━━',
      'Embarazo intrauterino confirmado previo.',
      'Cuadro compatible con aborto.',
      'Útero de tamaño normal o menor a edad gestacional.',
      'Cuello cerrado o con leves modificaciones.',
      'Metrorragia escasa o nula, dolor disminuido o ausente.',
      'Ecografía: endometrio homogéneo <15 mm en diámetro AP.',
      '',
      '━━━ Manejo ━━━',
      'Hospitalización en Bulnes si la condición clínica lo amerita o por ruralidad; o citar a control con ecografía ambulatoria.',
      'Manejo de duelo perinatal (Ley Dominga) según flujo HCSFB.',
      'Alta sin necesidad de derivación a HHM.',
      'Educación ante signos de alarma: nueva metrorragia, dolor intenso, fiebre.',
      'Abstinencia sexual por 14 días.',
      'Control en 7 días con matrona para regulación de fertilidad y seguimiento.',
      'Seguimiento psicosocial ChCC en APS si la usuaria lo desea.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-aborto-retenido',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_aborto',
    color: 'purple',
    order: 9,
    title: 'Aborto retenido',
    items: [
      '━━━ Diagnóstico ecográfico ━━━',
      'Embrión con LCN >7 mm sin LCF.',
      'Ausencia de embrión con LCF después de 14 días de saco gestacional sin saco vitelino.',
      'Ausencia de embrión con LCF después de 14 días de saco gestacional con saco vitelino.',
      'Saco gestacional ≥25 mm sin embrión.',
      '',
      '━━━ Manejo en gestaciones <12 semanas ━━━',
      'Ofrecer alternativa expectante vs activa.',
      '',
      '━━━ Expectante ━━━',
      'Explicar que es altamente probable la evolución espontánea en 4–8 semanas.',
      'Explicar escenarios clínicos y signos de alarma.',
      'Si evolución espontánea con consulta posterior: enfrentar como aborto en evolución.',
      'Si no evoluciona en 4 semanas: volver a consultar, hospitalizar y realizar manejo médico activo en HCSFB (si la paciente lo desea, según Ley Dominga).',
      '',
      '━━━ Activo ━━━',
      'Recomendaciones FIGO 2023 (ver pestaña Fármacos).',
      'Analgesia: Paracetamol horario + AINES SOS.',
      'Vigilar contracciones uterinas, metrorragia y expulsión de restos ovulares.',
      'Ecografía de control: si persiste retenido o incompleto → presentar caso a UGO HHM y derivar para legrado. Si compatible con completo → alta.',
      'Manejo de duelo perinatal según flujo HCSFB.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-ectopico',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_otras',
    color: 'red',
    order: 10,
    title: 'Embarazo ectópico (EE)',
    items: [
      '━━━ Diagnóstico ━━━',
      'Clínico + ecográfico ± curva de β-hCG.',
      'β-hCG >2000 mUI/mL sin embarazo intrauterino: buscar dirigidamente.',
      'Distinguir entre ectópico complicado (roto) vs no complicado.',
      '',
      '━━━ Factores de riesgo ━━━',
      'Antecedente de embarazo tubario previo.',
      'Uso de DIU.',
      'Infertilidad.',
      'Recanalización tubaria.',
      'Proceso inflamatorio pelviano (PIP).',
      'Antecedente de patología tubaria o salpingectomía (ej. EE en trompa contralateral).',
      'Cesárea anterior (EE en cicatriz de cesárea).',
      '',
      '━━━ Manejo ━━━',
      'Recepción, anamnesis, examen ginecológico, VVP + sangre.',
      'Presentación del caso a Médico de Turno.',
      'Evaluar disponibilidad de ecografía TV en urgencias HCSFB por profesional capacitado.',
      'Sospecha de EE COMPLICADO: estabilizar a la paciente y derivar a UGO HHM.',
      'Sospecha o confirmación de EE NO complicado: derivar a UGO HHM para evaluación y manejo específico por especialidad.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-molar',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_otras',
    color: 'red',
    order: 11,
    title: 'Embarazo molar',
    items: [
      '━━━ Diagnóstico ━━━',
      'Sospecha clínica con altura uterina mayor a edad gestacional.',
      'Eliminación de vesículas por orificio cervical externo (OCE).',
      'Ecotomografía compatible.',
      'Cuantificación de β-hCG exageradamente alta.',
      '',
      '━━━ Manejo ━━━',
      'Habitualmente consulta espontánea en urgencias o derivada desde policlínico/microrred.',
      'Evaluación por Médico de Turno.',
      'Derivar a UGO HHM para evaluación por especialidad y manejo específico.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-perdida-2trim',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_otras',
    color: 'red',
    order: 12,
    title: 'Pérdida reproductiva II trimestre (13–22 semanas)',
    items: [
      '━━━ Diagnóstico ━━━',
      'Clínico, imagenológico.',
      'Ausencia de LCF ecográfica o expulsión espontánea del feto.',
      '',
      '━━━ Estudio y manejo ━━━',
      'Derivar a HHM para evaluación y manejo específico por especialidad.',
      'Activar Flujo Duelo Perinatal y hacer seguimiento al caso.',
      'Si se produce expulsión espontánea del feto en HCSF Bulnes o en domicilio y la madre lo trae: actuar según protocolo Duelo Perinatal Ley Dominga.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-mfiu',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_otras',
    color: 'red',
    order: 13,
    title: 'Muerte fetal intrauterina (MFIU) >22 semanas',
    items: [
      '━━━ Diagnóstico ━━━',
      'Clínico: historia de desaparición de movimientos fetales, LCF ausentes al sonógrafo.',
      'Confirmación: ecografía obstétrica compatible.',
      '',
      '━━━ Conducta ante sospecha por ausencia de LCF ━━━',
      'Evaluar disponibilidad de ecografía inmediata por profesional capacitado en HCSFB.',
      'Sin disponibilidad: presentar caso y derivar a UGO HHM.',
      'Con confirmación: realizar acogida y contención inicial en HCSFB; luego presentar caso a UGO HHM y derivar.',
      '',
      '━━━ Sospecha de óbito + signos clínicos de infección ━━━',
      'Estabilización inicial y administrar primera dosis: Ceftriaxona 1 g EV + Metronidazol 500 mg VO mientras se coordina traslado.',
      'Alergia a penicilina: Clindamicina 900 mg c/8 h EV + Gentamicina 5 mg/kg/día EV.',
      '',
      '━━━ Registro y seguimiento ━━━',
      'En casos confirmados, Matrona de turno informa a matrona ChCC para realizar seguimiento.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-muerte-neonatal',
    type: 'criteria',
    tab: 'pr_protocolo',
    subtab: 'pr_protocolo_otras',
    color: 'red',
    order: 14,
    title: 'Muerte neonatal precoz',
    items: [
      'Definición: muerte de neonato ocurrida en los primeros 7 días de vida.',
      'Diagnóstico: clínico.',
      '',
      '━━━ Si ocurre en HCSF Bulnes con causa conocida ━━━',
      'Médico de Turno confirma diagnóstico y emite certificado de defunción.',
      'Médico informa a madre y familia.',
      'Ejecución de registros para auditoría.',
      'Registro de evento centinela "muerte inesperada".',
      'Contención inicial y manejo de duelo perinatal.',
      'Matrona de turno notifica a dupla psicosocial ChCC para activación del seguimiento.',
      '',
      '━━━ Si causa de fallecimiento es desconocida ━━━',
      'Médico debe confirmar diagnóstico y contactar a fiscalía; seguir flujo según indicación.',
      'Siempre realizar contención en box y manejo de duelo perinatal.',
      'Seguir protocolo establecido en Norma 100.',
    ],
    layout_position: 'main',
  },

  // ════════════════════════════════════════════════════════════════
  // PESTAÑA: Definiciones
  // ════════════════════════════════════════════════════════════════
  {
    id: 'pr-def-generales',
    type: 'criteria',
    tab: 'pr_definiciones',
    color: 'slate',
    order: 1,
    title: 'Definiciones generales',
    items: [
      'Pérdidas Reproductivas: gestaciones que no culminan en el nacimiento de un nuevo ser humano por cualquier causa, incluyendo aquellas en que el feto muere antes, durante o después del parto.',
      'Amenaza o Síntomas de Aborto: gestación intrauterina <20 semanas con metrorragia leve-moderada objetivable, sin modificaciones cervicales, ± dolor hipogástrico cólico.',
      'Aborto Inevitable: gestación <22 semanas con condición irreversible que evolucionará a aborto, con productos de la concepción aún no expulsados.',
      'Aborto Precoz: aquel en embarazos <12+6 semanas (≈80% de las pérdidas reproductivas).',
      'Aborto Tardío: aquel en embarazos ≥13 semanas y <22 semanas (≈20% de las pérdidas reproductivas).',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-def-tipos',
    type: 'criteria',
    tab: 'pr_definiciones',
    color: 'slate',
    order: 2,
    title: 'Tipos de aborto',
    items: [
      'Aborto en Evolución: pérdida <22 semanas con metrorragia + modificaciones cervicales (dilatación de OCI y borramiento) + dolor hipogástrico tipo cólico intenso. Eventualmente partes fetales o restos ovulares palpables en cuello.',
      'Aborto Incompleto: pérdida <22 semanas parcial, con persistencia de restos ovulares o partes embrionarias en útero, sangrado vaginal persistente y cuello dilatado con evidencia ecográfica o física de restos retenidos.',
      'Aborto Completo: pérdida <22 semanas en que restos ovulares o partes embrionarias han sido expulsados completamente. Metrorragia escasa o nula y cuello uterino cerrado.',
      'Aborto Retenido: gestación intrauterina <22 semanas, sin actividad cardíaca, o saco gestacional >24 mm sin embrión (huevo anembrionado).',
      'Aborto Séptico: pérdida <22 semanas con signos de infección uterina: fiebre, flujo vaginal purulento y dolor abdominal.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-def-otras',
    type: 'criteria',
    tab: 'pr_definiciones',
    color: 'slate',
    order: 3,
    title: 'Otras pérdidas reproductivas',
    items: [
      'Embarazo Ectópico: implantación de óvulo fecundado en cualquier parte de cavidad pelviana o abdominal que no sea la cavidad intrauterina.',
      'Embarazo Molar: enfermedad trofoblástica gestacional benigna, con fecundación anormal y proliferación atípica del trofoblasto en ausencia de embrión/feto. Tipos: parcial o completa.',
      'Muerte Fetal Intrauterina (MFIU) >22 semanas: ausencia de signos de viabilidad fetal >22 semanas, ante feto >500 g EPF o >25 cm LCN si se desconoce edad gestacional. Sinónimo: óbito.',
      'Muerte Neonatal Precoz: muerte de neonato ocurrida en los primeros 7 días de vida.',
      'Pérdida Reproductiva II Trimestre (13–22 sem): ausencia de signos de viabilidad fetal entre 13 y 22+6 semanas.',
    ],
    layout_position: 'main',
  },

  // ════════════════════════════════════════════════════════════════
  // PESTAÑA: Fármacos
  // ════════════════════════════════════════════════════════════════
  {
    id: 'pr-misoprostol-tabla',
    type: 'criteria',
    tab: 'pr_farmacos',
    color: 'blue',
    order: 1,
    title: 'Misoprostol — régimen FIGO 2023 (cuando mifepristona NO disponible)',
    items: [
      '━━━ ≤12 semanas ━━━',
      'Aborto perdido / embarazo anembrionado: Misoprostol 800 µg BUC/SL/PV cada 3 h hasta la expulsión.',
      'Aborto incompleto: 400 µg SL única dosis · 600 µg VO única dosis · 800 µg BUC única dosis.',
      'Preparación cervical antes de aspiración: no se requiere.',
      '',
      '━━━ 13–17 semanas ━━━',
      'Aborto perdido: Misoprostol 400 µg BUC/SL/PV cada 3 h hasta la expulsión.',
      'Aborto incompleto: 400 µg BUC/SL cada 3 h.',
      'Preparación cervical: 400 µg BUC/SL/PV 1–2 h antes del procedimiento.',
      '',
      '━━━ 18–24 semanas ━━━',
      'Aborto perdido / muerte fetal: 400 µg BUC/SL/PV cada 3 h hasta la expulsión.',
      'Aborto incompleto: 400 µg BUC/SL cada 3 h.',
      'Preparación cervical: usar dilatadores osmóticos 1–2 días antes + Misoprostol 400 µg BUC/SL/PV 1–2 h antes del procedimiento.',
      '',
      '━━━ 25–27 semanas ━━━',
      'Aborto inducido / muerte fetal: 200 µg BUC/SL/PV cada 4 h hasta la expulsión.',
      'Inducción del parto: 25–50 µg PV cada 4 h, o 25–50 µg VO cada 2 h.',
      '',
      '━━━ ≥28 semanas ━━━',
      'Muerte fetal: 25–50 µg cada 4 h PV, o 50–100 µg VO cada 2 h.',
      'Inducción del parto: 25–50 µg cada 4 h PV, o 25–50 µg VO cada 2 h.',
      '',
      '━━━ Posparto ━━━',
      'Profilaxis HPP: Misoprostol 600 µg SL única dosis.',
      'Tratamiento HPP: Misoprostol 800 µg SL única dosis.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-misoprostol-notas',
    type: 'criteria',
    tab: 'pr_farmacos',
    color: 'amber',
    order: 2,
    title: 'Notas y precauciones — Misoprostol',
    items: [
      '━━━ Vía de administración ━━━',
      'La vía SL/VO se asocia con más efectos secundarios.',
      'Evitar la vía vaginal si hay sangrado vaginal.',
      '',
      '━━━ Seguridad y cesárea anterior ━━━',
      'Es seguro antes de las 28 semanas, incluso con antecedente de cesárea anterior.',
      'NO se recomienda en mujeres ≥28 semanas con antecedente de cesárea anterior.',
      '',
      '━━━ Dosis y contraindicaciones ━━━',
      'NO existe dosis máxima.',
      'Si llega a 5 dosis sin completar el aborto: continuar dosis adicionales o pausar 12 h y reiniciar.',
      'Contraindicado en grandes multíparas.',
      'Tras la medicación para el aborto no se requiere ni se recomienda aspiración de rutina.',
      '',
      '━━━ Reacciones adversas ━━━',
      'Hipertermia transitoria, hiper/hipotensión, edema, mareos, cefalea, ansiedad, tos.',
      'Artralgia, mialgia, hipertonía uterina, calosfríos, rash.',
      '',
      '━━━ Siglas ━━━',
      'BUC = bucal · SL = sublingual · PV = vía vaginal · VO = vía oral.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-atb-septico',
    type: 'criteria',
    tab: 'pr_farmacos',
    color: 'red',
    order: 3,
    title: 'Antibióticos — Aborto séptico / huevo roto infectado / sospecha de óbito infectado',
    items: [
      '━━━ Esquema estándar ━━━',
      'Ceftriaxona 1 g EV — primera dosis.',
      'Metronidazol 500 mg EV (o VO si traslado en curso para MFIU).',
      'Coordinar traslado a UGO HHM.',
      '',
      '━━━ Alergia a penicilina ━━━',
      'Clindamicina 900 mg cada 8 h EV.',
      'Gentamicina 5 mg/kg/día EV.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-analgesia',
    type: 'criteria',
    tab: 'pr_farmacos',
    color: 'emerald',
    order: 4,
    title: 'Analgesia',
    items: [
      'Paracetamol horario — primera línea durante hospitalización por aborto en evolución.',
      'AINES SOS — coadyuvante en aborto retenido en manejo activo.',
      'Analgesia SOS según protocolo local en síntomas de aborto y seguimiento ambulatorio.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-rh',
    type: 'criteria',
    tab: 'pr_farmacos',
    color: 'violet',
    order: 5,
    title: 'Profilaxis Rh',
    items: [
      'Administrar vacuna Rhogham (Inmunoglobulina anti-D) en toda usuaria Rh(-) no sensibilizada.',
      'Indicada en cualquier pérdida reproductiva confirmada que cumpla criterios.',
    ],
    layout_position: 'main',
  },

  // ════════════════════════════════════════════════════════════════
  // PESTAÑA: Flujogramas
  // ════════════════════════════════════════════════════════════════
  {
    id: 'pr-mermaid-triage',
    type: 'mermaid',
    tab: 'pr_flujogramas',
    color: 'blue',
    order: 1,
    title: '1. Triage inicial — ¿Manejo en Bulnes o derivación a HHM?',
    content: `flowchart TD
    A([Consulta]) --> B[Recepción + SV<br/>Anamnesis + examen GO<br/>VVP + exámenes]
    B --> C{Cuadro<br/>clínico}
    C -->|Síntomas aborto<br/><13 sem| D[Manejo en Bulnes<br/>o seguimiento]
    C -->|Aborto en evolución<br/>incompleto / completo<br/>retenido <12 sem| E[Manejo en Bulnes<br/>ver flujograma 2]
    C -->|≥13 sem<br/>metrorragia II trim| F[Derivar UGO HHM]
    C -->|EE · Molar<br/>MFIU >22 sem| F
    C -->|Sospecha infección<br/>aborto séptico| G[ATB EV<br/>+ Derivar HHM]

    style A fill:#fce7f3,color:#831843,stroke:#be185d
    style F fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    style G fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    style D fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
    style E fill:#dbeafe,color:#1e3a8a,stroke:#2563eb`,
    layout_position: 'main',
  },

  {
    id: 'pr-mermaid-manejo-local',
    type: 'mermaid',
    tab: 'pr_flujogramas',
    color: 'amber',
    order: 2,
    title: '2. Manejo local — Aborto incompleto / retenido / en evolución',
    content: `flowchart TD
    A([Aborto en Bulnes]) --> B{Tipo}
    B -->|En evolución<br/><12 sem sin infección| C[Hospitalizar<br/>Manejo médico Misoprostol]
    B -->|Incompleto| D{Endometrio mm}
    D -->|15-20 mm sin fiebre| E[Expectante<br/>Control 48 días]
    D -->|>20 mm o sintomática| F[Misoprostol FIGO 2023]
    F -->|Frustro 24 h<br/>o rechaza| G[Derivar HHM<br/>para legrado]
    B -->|Retenido <12 sem| H{Decisión<br/>usuaria}
    H -->|Expectante| I[Educar 4-8 sem]
    H -->|Activo| F
    I -->|Si evoluciona| C
    B -->|Completo| J[Alta + duelo<br/>+ control APS]

    style A fill:#fef3c7,color:#78350f,stroke:#d97706
    style G fill:#fed7aa,color:#7c2d12,stroke:#ea580c
    style J fill:#d1fae5,color:#064e3b,stroke:#059669`,
    layout_position: 'main',
  },

  {
    id: 'pr-mermaid-cierre',
    type: 'mermaid',
    tab: 'pr_flujogramas',
    color: 'green',
    order: 3,
    title: '3. Cierre — Toda pérdida reproductiva',
    content: `flowchart TD
    A([Pérdida confirmada]) --> B[Manejo de duelo<br/>Ley Dominga]
    B --> C[VDRL + VIH<br/>Rhogham si Rh -]
    C --> D[Registros: DAU<br/>ingreso, IC, epicrisis]
    D --> E{Edad<br/>gestacional}
    E -->|<22 sem| F[Permiso 7 d hábiles<br/>ambos progenitores<br/>Ley 21.371]
    E -->|≥22+1 sem| G[Padre: 7 d hábiles<br/>Madre: post-natal 12 sem]
    F --> H[Control APS<br/>matrona]
    G --> H
    H --> I{¿Derivar?}
    I -->|2 abortos consecutivos<br/>>22 sem causa no explicada<br/>EE · Molar · repetición| J[Derivar Ginecología<br/>HHM ambulatorio]
    I -->|Próximo embarazo:<br/>Incompetencia cervical<br/>Óbito · Repetición| K[Ingresar a ARO]
    I -->|Sin criterios| L[Seguimiento<br/>habitual APS]

    style A fill:#dbeafe,color:#1e3a8a,stroke:#2563eb
    style J fill:#fef3c7,color:#78350f,stroke:#d97706
    style K fill:#fee2e2,color:#7f1d1d,stroke:#dc2626
    style L fill:#d1fae5,color:#064e3b,stroke:#059669`,
    layout_position: 'main',
  },

  // ════════════════════════════════════════════════════════════════
  // PESTAÑA: Post-evento
  // ════════════════════════════════════════════════════════════════
  {
    id: 'pr-termino',
    type: 'criteria',
    tab: 'pr_post',
    color: 'blue',
    order: 1,
    title: 'Término del procedimiento — toda pérdida reproductiva',
    items: [
      'Solicitar VDRL y VIH en todos los casos.',
      'Administrar vacuna Rhogham en usuaria Rh(-) no sensibilizada.',
      '',
      '━━━ Registros obligatorios ━━━',
      'DAU (Documento de Atención de Urgencia).',
      'Ingreso, interconsulta, consentimiento informado.',
      'Evoluciones en ficha clínica.',
      'Solicitudes de exámenes y epicrisis.',
      '',
      '━━━ Si aplica ━━━',
      'Informe de auditoría de muerte fetal e infantil (DEIS).',
      'Certificado de defunción.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-licencias',
    type: 'criteria',
    tab: 'pr_post',
    color: 'violet',
    order: 2,
    title: 'Permisos y licencias médicas (Ley 21.371)',
    items: [
      '━━━ Muerte gestacional <22 semanas ━━━',
      'Permiso laboral para ambos progenitores: 7 días hábiles.',
      'Para hacerlo efectivo deben presentar el DAU o certificado médico ante el empleador.',
      'Puede complementarse con licencia médica para completar la recuperación, según lo estime el médico tratante.',
      '',
      '━━━ Muerte gestacional ≥22+1 semanas ━━━',
      'Padre: permiso laboral según Ley 21.371 — 7 días hábiles.',
      'Madre: descanso de maternidad de 12 semanas posparto (licencia post-natal).',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-control-aps',
    type: 'criteria',
    tab: 'pr_post',
    color: 'emerald',
    order: 3,
    title: 'Control en APS y derivaciones',
    items: [
      'Control con matrona en APS para regulación de fertilidad.',
      'Recomendar evitar nueva gestación antes de 3–6 meses (según diagnóstico).',
      '',
      '━━━ Derivar a Ginecología para estudio si ━━━',
      '2 abortos consecutivos con el mismo progenitor.',
      'Pérdida reproductiva >22 semanas de causa no explicada.',
      '',
      '━━━ Seguimiento ambulatorio por especialidad en HHM ━━━',
      'Embarazo molar.',
      'Embarazo ectópico.',
      'Pérdidas reproductivas a repetición (>2 con misma pareja).',
      'Verificar en control ambulatorio si tienen horas agendadas.',
    ],
    layout_position: 'main',
  },

  {
    id: 'pr-aro',
    type: 'alert',
    tab: 'pr_post',
    color: 'red',
    order: 4,
    title: 'Derivación a ARO en siguiente embarazo',
    content: `Se debe derivar a **Alto Riesgo Obstétrico (ARO)** en el siguiente embarazo en caso de:

- Historia de pérdida reproductiva con incompetencia cervical, al ingreso prenatal.
- Historia de óbito fetal (>22 semanas).
- Historia de pérdida reproductiva a repetición.`,
    layout_position: 'main',
  },

  {
    id: 'pr-doc-referencia',
    type: 'text',
    tab: 'pr_post',
    color: 'slate',
    order: 5,
    title: 'Documentación de referencia',
    content: `- Norma General y Orientación Técnica MINSAL.
- Guía Perinatal MINSAL 2015.
- Régimen FIGO para uso de Misoprostol 2023.
- Pérdida temprana del embarazo, ACOG 2018 (Boletín N° 200).

### Registro
- Plataforma **Rayen**.
- **DAU** (Documento de Atención de Urgencia).`,
    layout_position: 'main',
  },
];

// ── EJECUCIÓN ────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  HCSFB 162 — Pérdida Reproductiva — ${APPLY ? '⚡ APPLY' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const dist = blocks.reduce((acc, b) => {
  const k = b.subtab ? `${b.tab} › ${b.subtab}` : b.tab;
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});
console.log('Distribución por pestaña:');
Object.entries(dist).forEach(([t, n]) => console.log(`  ${t.padEnd(40)}  ${n} bloque(s)`));
console.log(`\nTotal bloques: ${blocks.length}`);
console.log(`Autores: ${protocol_authors.length}`);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir.\n');
  process.exit(0);
}

const updates = {
  content_blocks: blocks,
  protocol_authors,
  protocol_code: 'HCSFB 162',
  protocol_validity: 'Febrero 2030',
  has_local_protocol: true,
  description: 'Protocolo para atención humanizada y estandarizada de usuarias con pérdida reproductiva (aborto, embarazo ectópico, molar, MFIU y muerte neonatal precoz) en el Servicio de Urgencia Gineco-Obstétrica HCSF Bulnes.',
  // Limpiar campos legacy duplicados (el contenido completo está ahora en content_blocks)
  protocol_flowchart: null,
  protocol_medications: [],
  protocol_algorithm: null,
  clinical_summary: null,
  diagnostic_orientation: null,
  complementary_studies: null,
  initial_treatment: null,
};

const { error } = await supabase.from('topics').update(updates).eq('id', TOPIC_ID);
if (error) {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
}

console.log(`\n✅ Topic actualizado: ${TOPIC_ID}`);
console.log(`   ${blocks.length} bloques, ${protocol_authors.length} autores, código HCSFB 162, vigencia Febrero 2030.\n`);
