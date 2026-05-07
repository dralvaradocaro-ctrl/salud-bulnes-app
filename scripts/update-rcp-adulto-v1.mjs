/**
 * RCP Adultos (GCL 1.4 A) — Enriquecimiento completo siguiendo la lógica del RCP Pediátrico.
 * 5 pestañas: Protocolo | Equipo | Fármacos | Flujogramas | Post-PCR
 *
 * Uso:  node scripts/update-rcp-adulto-v1.mjs
 *       node scripts/update-rcp-adulto-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '34f0aac7-eee5-4df4-8bf4-a94d0eef1424';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 1: rcpa_protocolo — Algoritmo paso a paso
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLO_BLOCKS = [
  {
    id: 'rcpa-v1-deterioro',
    tab: 'rcpa_protocolo',
    type: 'criteria',
    color: 'amber',
    order: 1,
    title: '0. Signos de deterioro previo y criterios de PCR',
    content: 'El PCR en adultos suele ser de origen cardíaco. La detección temprana de signos premonitorios puede evitar la progresión al paro.',
    items: [
      'Deterioro hemodinámico: hipotensión, taquicardia, palidez, frialdad extrema, llene capilar mayor a 3 segundos.',
      'Deterioro respiratorio: taquipnea o bradipnea, saturación en descenso pese a oxígeno, uso de musculatura accesoria.',
      'Deterioro neurológico: compromiso de conciencia brusco, agitación extrema, convulsiones, respuesta motora anómala.',
      'Dolor torácico + compromiso hemodinámico: pensar síndrome coronario agudo como causa probable.',
      'PCR clínico confirmado: sin respuesta a estímulos, no respira o solo jadea/boquea, pulso carotídeo ausente o dudoso en 10 segundos.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-activacion',
    tab: 'rcpa_protocolo',
    type: 'text',
    order: 2,
    title: '1. Activación del sistema de respuesta',
    content: `### Ante un adulto sin respuesta
- Verificar seguridad de la escena y respuesta del paciente (sacudir hombros, voz fuerte).
- Si no responde: activar sistema de respuesta en voz alta y solicitar carro de paro, monitor/desfibrilador, oxígeno y material de vía aérea.

### Confirmación de PCR en 10 segundos
- Evaluar pulso carotídeo y respiración de forma simultánea durante 5 a 10 segundos.
- Si pulso ausente o dudoso, o si la respiración es anormal (solo jadea), iniciar RCP.
- Si tiene pulso pero no respira: ventilar con bolsa-mascarilla y reevaluar pulso cada 2 minutos.

### Fuera de Urgencias o de la cama del paciente
- Activar código azul: llamar al interno 425974 o 425902, informar nombre, servicio y urgencia.
- Iniciar RCP en el lugar hasta la llegada del equipo de urgencias.`,
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-rcp-calidad',
    tab: 'rcpa_protocolo',
    type: 'flowchart',
    color: 'red',
    order: 3,
    title: '2. RCP de alta calidad',
    description: 'Primer ciclo de intervención: compresiones torácicas de alta calidad desde el primer momento.',
    details: [
      'Frecuencia → 100 a 120 compresiones por minuto en forma constante.',
      'Profundidad → al menos 5 cm pero no más de 6 cm en adultos.',
      'Técnica → talón de ambas manos en mitad inferior del esternón, brazos extendidos, comprimir con peso corporal.',
      'Retroceso completo → permitir que el tórax recupere su posición entre cada compresión sin levantar las manos del esternón.',
      'Relación sin vía aérea avanzada → 30 compresiones por 2 ventilaciones, alternando sin interrupción prolongada.',
      'Con vía aérea avanzada (ETT/supraglótica) → compresiones continuas a 100-120/min + 1 ventilación cada 5 a 6 segundos.',
      'Pausas → interrumpir compresiones solo para análisis de ritmo o descarga; mantener pausa menor a 10 segundos.',
      'Rotación → cambiar compresor cada 2 minutos o antes si hay signos de fatiga.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-desfibrilacion',
    tab: 'rcpa_protocolo',
    type: 'flowchart',
    color: 'orange',
    order: 4,
    title: '3. Análisis de ritmo y desfibrilación',
    description: 'Esta decisión se repite al término de cada ciclo de 2 minutos de RCP.',
    details: [
      'Conectar monitor/desfibrilador tan pronto esté disponible sin suspender compresiones más de lo necesario.',
      'Ritmo desfibrilable → fibrilación ventricular (FV) o taquicardia ventricular sin pulso (TV sin pulso).',
      'Primera descarga → 200 J bifásico; reanudar RCP inmediatamente por 2 minutos sin verificar pulso.',
      'Descargas posteriores → 200 J o energía máxima del equipo; no retrasar por análisis prolongado.',
      'Ritmo no desfibrilable → asistolia o actividad eléctrica sin pulso (AESP): RCP continuo + adrenalina precoz + buscar causas reversibles.',
      'DEA disponible → seguir instrucciones de voz; no retrasar descarga en espera del médico.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-viaarea-acceso',
    tab: 'rcpa_protocolo',
    type: 'flowchart',
    color: 'blue',
    order: 5,
    title: '4. Acceso vascular y manejo de vía aérea',
    description: 'Se realizan en paralelo al ciclo de RCP sin retrasar compresiones ni descargas.',
    details: [
      'Acceso IV periférico → primer intento rápido mientras continúan las compresiones.',
      'Acceso IO → indicar si no se obtiene IV en aproximadamente 60 segundos o tras 2 intentos fallidos; vía de elección rápida en PCR.',
      'Flush post-fármaco → SF 20 mL en bolo seguido de elevación de la extremidad si es IV periférico.',
      'Bolsa-mascarilla → técnica de 2 operadores cuando sea posible; sello hermético; O2 a alto flujo.',
      'Vía aérea avanzada → considerar intubación orotraqueal o dispositivo supraglótico si la ventilación con mascarilla es inefectiva o el PCR se prolonga.',
      'Confirmar posición → auscultación bilateral, radiografía si posible, capnografía cuantitativa continua (objetivo ETCO2 mayor a 10 mmHg durante RCP).',
      'ETCO2 persistente bajo → revisar calidad de compresiones, posición del tubo, ventilación y causas reversibles.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-causas',
    tab: 'rcpa_protocolo',
    type: 'criteria',
    color: 'red',
    order: 6,
    title: '5. Causas reversibles — 4H y 4T',
    content: 'Identificar y tratar en cada ciclo de 2 minutos. En adultos la causa más frecuente es coronaria.',
    items: [
      '━━━ 4H ━━━',
      'Hipoxia: asegurar vía aérea permeable, sello de mascarilla, O2 al 100%, aspirar secreciones.',
      'Hipovolemia: trauma, hemorragia, deshidratación grave; cristaloide en bolo.',
      'Hipo/hiperkalemia y electrolitos: calcio IV si hiperK; bicarbonato si acidosis grave o hiperK severa.',
      'Hipotermia: recalentar activamente; adaptar tiempos y fármacos según temperatura central.',
      '━━━ 4T ━━━',
      'Taponamiento cardíaco: sospecha en trauma torácico, post-procedimiento o pericarditis; ecoscopia si disponible.',
      'Trombosis coronaria (IAM): el contexto más frecuente en adultos; pensar en angiografía post-ROSC.',
      'Tromboembolismo pulmonar: considerar en PCR sin causa obvia, historia de trombosis o inmovilización; alteplase 50 mg IV si confirmado o alta sospecha durante RCP.',
      'Tórax a tensión (neumotórax): descompresión inmediata con aguja 2° espacio intercostal línea medioclavicular si sospecha clínica.',
      '━━━ ADEMÁS ━━━',
      'Hipoglicemia: HGT obligatorio en todo PCR; corregir con SG 50% 50 mL IV si menor a 70 mg/dL.',
      'Intoxicación: preguntar a acompañante, revisar medicamentos pautados, naloxona si sospecha de opioides.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-salida',
    tab: 'rcpa_protocolo',
    type: 'flowchart',
    color: 'purple',
    order: 7,
    title: '6. Salida del ciclo: ROSC, traslado o continuidad',
    description: 'Al término de cada ciclo de 2 minutos se evalúa el ritmo y se toma la decisión de continuar o escalar.',
    details: [
      'Sin ROSC → continuar ciclos de RCP de 2 minutos, reevaluar ritmo y calidad, buscar causas reversibles, administrar fármacos según ritmo.',
      'Con ROSC → iniciar inmediatamente cuidados post-PCR: oxígeno, PA, glucemia, ECG 12 derivaciones, temperatura, causa probable.',
      'ETCO2 con aumento brusco mayor a 40 mmHg → puede indicar ROSC antes de verificar pulso; confirmar con palpación carotídea.',
      'Suspensión de maniobras → decisión del médico tratante, documentada con tiempos, ritmos, fármacos administrados y fundamento clínico.',
      'Si requiere soporte no disponible localmente → activar flujo de derivación al Hospital Herminda Martín u otro centro definido por la red.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-marco',
    tab: 'rcpa_protocolo',
    type: 'text',
    color: 'slate',
    order: 99,
    title: 'Documento base y alcance GCL 1.4 A',
    content: `### Documento base revisado
Protocolo de Reanimación Cardiopulmonar Avanzada en Adultos, Hospital Comunitario de Salud Familiar de Bulnes. Código GCL 1.4 A, cuarta edición, julio 2023, vigencia julio 2028.

### Objetivo del protocolo local
Estandarizar la respuesta ante el paro cardiorrespiratorio en adultos dentro del establecimiento, asegurando una atención coordinada, de calidad y con foco en la seguridad del paciente.

### Alcance operativo
Aplica a todo paciente adulto que requiera RCP en la Unidad de Urgencias, servicios clínicos de hospitalización u otros espacios del establecimiento. Todo funcionario que participe en la respuesta debe conocer su rol, activar la ayuda correspondiente y ejecutar las acciones asignadas por el líder.`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 2: rcpa_equipo — Roles del equipo HCSFB
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPO_BLOCKS = [
  {
    id: 'rcpa-v1-equipo-urgencia',
    tab: 'rcpa_equipo',
    type: 'flowchart',
    color: 'blue',
    order: 10,
    title: 'Equipo ante PCR en Unidad de Urgencias',
    description: 'Dotación estándar descrita en el documento local GCL 1.4 A.',
    details: [
      'Horario hábil: médico de turno (MT), enfermera de Urgencias (E1), enfermero de Medicina 1 (E2), paramédico de Urgencias (PM1), paramédico de Urgencias 2 (PM2).',
      'Horario no hábil: médico de turno (MT), enfermero de Urgencias (E1), enfermero de Medicina 1 (E2), paramédico de Urgencias (PM1), paramédico de Urgencias 2 (PM2).',
      'El líder puede redistribuir funciones según las competencias y la disponibilidad real del personal presente.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-equipo-hospitalizacion',
    tab: 'rcpa_equipo',
    type: 'flowchart',
    color: 'indigo',
    order: 11,
    title: 'Equipo ante PCR en Servicio de Hospitalización',
    description: 'Para eventos en Medicina, Cirugía u otros servicios clínicos.',
    details: [
      'Horario hábil: médico de turno del servicio (MT), enfermera del servicio (E1), enfermero de apoyo (E2), TENS/paramédico del servicio (PM1), TENS/paramédico de apoyo (PM2).',
      'Horario no hábil: médico de turno general (MT), enfermero de turno del servicio (E1), paramédico de apoyo del servicio contiguo (PM1), paramédico de Urgencias en código azul (PM2).',
      'Si el evento ocurre en pasillo, patio u otro espacio: activar código azul llamando al 425974 o 425902, informar nombre, lugar y urgencia, e iniciar RCP en el lugar hasta la llegada del equipo de Urgencias.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-responsabilidades',
    tab: 'rcpa_equipo',
    type: 'criteria',
    color: 'emerald',
    order: 12,
    title: 'Responsabilidades durante la reanimación',
    content: 'Las funciones pueden modificarse por indicación del líder clínico, pero todas deben quedar cubiertas en todo momento.',
    items: [
      'MT (Médico de turno): lidera el equipo, maneja la vía aérea, prescribe fármacos, toma decisiones clínicas e informa a la familia.',
      'E1 (Enfermera/o 1): obtiene acceso venoso o intraóseo, prepara y administra medicamentos según indicación del MT.',
      'E2 (Enfermera/o 2): instala monitor cardíaco, programa el desfibrilador y ejecuta la descarga indicada por el MT.',
      'PM1 (Paramédico/TENS 1): realiza las compresiones torácicas de alta calidad.',
      'PM2 (Paramédico/TENS 2): registra tiempos, ritmos, fármacos con dosis, descargas, ROSC y traslado.',
      'PM1 y PM2 alternan compresiones cada ciclo de 2 minutos o antes si hay fatiga.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-mermaid-roles',
    tab: 'rcpa_equipo',
    type: 'mermaid',
    order: 13,
    title: 'Flujograma de roles del equipo local',
    content: `flowchart LR
    MT[Médico de turno MT] --> L[Lidera · vía aérea · prescribe fármacos · informa familia]
    E1[Enfermera/o E1] --> A[Acceso IV/IO · prepara y administra fármacos]
    E2[Enfermera/o E2] --> D[Monitor · desfibrilador · ejecuta descarga]
    PM1[Paramédico PM1] --> C[Compresiones torácicas de alta calidad]
    PM2[Paramédico PM2] --> R[Registra tiempos · ritmos · dosis · descargas · ROSC]
    C --> X[Rotar con PM2 cada 2 min o antes si hay fatiga]`,
    description: 'Distribución funcional MT/E1/E2/PM del protocolo local GCL 1.4 A.',
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 3: rcpa_farmacos — Tabla y calculadora
// ─────────────────────────────────────────────────────────────────────────────
const FARMACOS_BLOCKS = [
  {
    id: 'rcpa-v1-farmacos-tabla',
    tab: 'rcpa_farmacos',
    type: 'criteria',
    color: 'green',
    order: 14,
    title: 'Fármacos del Carro de Paro — Dosis en Adultos',
    content: 'Dosis estándar para el PCR adulto. En adultos las dosis son fijas (no por kg), salvo lidocaína y bicarbonato.',
    items: [
      '━━━ FÁRMACOS DE PRIMERA LÍNEA ━━━',
      'Adrenalina 1 mg/mL: 1 mg IV/IO cada 3 a 5 minutos — indicada en FV/TV y en asistolia/AESP.',
      'Amiodarona 150 mg/3 mL: 300 mg IV bolo en FV/TV refractaria tras segunda descarga; 150 mg si recurrencia.',
      '━━━ FÁRMACOS DE SEGUNDA LÍNEA ━━━',
      'Lidocaína 2%: 1 a 1.5 mg/kg IV — alternativa si amiodarona no disponible; típicamente 75 a 100 mg en adulto de 70 kg.',
      'Sulfato de magnesio 1 g/5 mL: 1 a 2 g IV lento — indicado en Torsades de Pointes.',
      'Atropina 0.5 mg/mL: 0.5 a 1 mg IV en bradicardia sintomática; no se usa en asistolia durante RCP.',
      '━━━ TRATAMIENTO DE CAUSAS ESPECÍFICAS ━━━',
      'Bicarbonato de sodio 8.4%: 1 mEq/kg IV — en acidosis severa documentada o hiperkalemia grave.',
      'Glucosa al 50%: 50 mL IV (25 g) — en hipoglicemia documentada menor a 70 mg/dL.',
      'Cloruro de calcio 10%: 10 mL IV lento — en hiperkalemia, hipocalcemia o intoxicación por calcioantagonistas.',
      'Alteplase: 50 mg IV en bolo — solo en TEP masivo durante RCP con confirmación o alta sospecha clínica.',
      'Naloxona 0.4 mg/mL: 0.4 a 2 mg IV — en sospecha de intoxicación por opioides.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-calculadora-postparo',
    tab: 'rcpa_farmacos',
    type: 'dose_calculator',
    color: 'blue',
    order: 15,
    title: 'Calculadora de vasopresores post-PCR',
    description: 'Ingresa el peso del paciente para calcular dosis de inicio de vasopresores en el manejo post-ROSC. Las infusiones se ajustan según respuesta hemodinámica (objetivo PAM mayor a 65 mmHg).',
    footer: 'Dosis calculadas para infusión continua en bomba. Confirmar concentración disponible, peso real y respuesta hemodinámica antes de ajustar. Fármacos según disponibilidad local HCSFB.',
    medications: [
      {
        name: 'Noradrenalina — dosis inicial',
        dose_per_kg: 0.1,
        unit: 'mcg',
        route: 'IV infusión continua',
        dose_label: '0.1 mcg/kg/min de inicio; ajustar hasta PAM >65 mmHg',
        indication: 'Shock vasopléjico post-PCR; vasopresor de elección en adultos',
        max_dose: 210,
        note: 'Concentración estándar: 4 mg en 100 mL SF → 40 mcg/mL. Dosis calculada es el valor inicial por minuto.',
        concentration: 40,
        concentration_label: '40 mcg/mL (4 mg/100 mL SF)',
      },
      {
        name: 'Adrenalina — vasopresor post-ROSC',
        dose_per_kg: 0.05,
        unit: 'mcg',
        route: 'IV infusión continua',
        dose_label: '0.05 mcg/kg/min de inicio; ajustar según respuesta',
        indication: 'Cuando noradrenalina es insuficiente o falla cardíaca asociada',
        max_dose: 140,
        note: 'Concentración estándar: 2 mg en 100 mL SF → 20 mcg/mL. Dosis calculada es el valor inicial por minuto.',
        concentration: 20,
        concentration_label: '20 mcg/mL (2 mg/100 mL SF)',
      },
      {
        name: 'Dopamina — dosis dopaminérgica',
        dose_per_kg: 5,
        unit: 'mcg',
        route: 'IV infusión continua',
        dose_label: '5 mcg/kg/min de inicio; rango 5 a 20 mcg/kg/min',
        indication: 'Bradicardia post-ROSC o soporte inotrópico moderado',
        max_dose: 1400,
        note: 'Concentración estándar: 200 mg en 100 mL SF → 2000 mcg/mL. Dosis calculada es el valor inicial por minuto.',
        concentration: 2000,
        concentration_label: '2000 mcg/mL (200 mg/100 mL SF)',
      },
      {
        name: 'Lidocaína — dosis inicial (PCR)',
        dose_per_kg: 1.5,
        unit: 'mg',
        route: 'IV bolo',
        dose_label: '1 a 1.5 mg/kg IV bolo — alternativa a amiodarona',
        indication: 'FV/TV refractaria cuando amiodarona no está disponible',
        max_dose: 100,
        note: 'Presentación local: ampolla 2% (20 mg/mL). Dosis calculada a 1.5 mg/kg.',
        concentration: 20,
        concentration_label: '20 mg/mL, Lidocaína 2%',
      },
      {
        name: 'Bicarbonato de sodio',
        dose_per_kg: 1,
        unit: 'mEq',
        route: 'IV bolo lento',
        dose_label: '1 mEq/kg IV — solo en acidosis severa o hiperkalemia documentada',
        indication: 'Acidosis metabólica grave (pH <7.1), hiperkalemia, intoxicación por tricíclicos',
        note: 'Presentación local: NaHCO3 8.4% → 1 mEq/mL.',
        concentration: 1,
        concentration_label: '1 mEq/mL, NaHCO3 8.4%',
      },
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 4: rcpa_flujogramas — Diagramas Mermaid
// ─────────────────────────────────────────────────────────────────────────────
const FLUJOGRAMAS_BLOCKS = [
  {
    id: 'rcpa-v1-mermaid-general',
    tab: 'rcpa_flujogramas',
    type: 'mermaid',
    order: 20,
    title: 'Flujograma general PCR adulto',
    content: `flowchart TD
    A([Adulto sin respuesta\\nno respira o solo jadea]) --> B[Activar ayuda · código azul\\n425974 o 425902]
    B --> C[Evaluar pulso carotídeo y respiración\\nsimultáneamente · 5-10 seg]
    C --> D{¿Pulso y respiración\\npresentes?}
    D -->|Sí| E[Oxígeno · monitor · evaluar causa\\ntraslado según gravedad]
    D -->|No o dudosos| F[Iniciar RCP de alta calidad\\n100-120/min · 5-6 cm]
    F --> G[Conectar monitor/desfibrilador\\ncuando esté disponible]
    G --> H{¿Ritmo\\ndesfibrilable?}
    H -->|Sí: FV/TV sin pulso| I[Descarga 200 J bifásico]
    I --> J[RCP 2 min + IV/IO\\nAdrenalina 1 mg cada 3-5 min]
    J --> K[Descarga 200 J si persiste FV/TV]
    K --> L[RCP 2 min + Amiodarona 300 mg IV]
    L --> M[Continuar ciclos + buscar causas 4H/4T]
    H -->|No: asistolia/AESP| N[RCP 2 min + IV/IO]
    N --> O[Adrenalina 1 mg IV lo antes posible\\y cada 3-5 min]
    O --> M
    M --> P{¿ROSC?}
    P -->|Sí| Q([Cuidados post-PCR\\nO2 · PA · ECG · temperatura])
    P -->|No| G`,
    description: 'Secuencia desde el reconocimiento hasta el ROSC o la continuidad del algoritmo.',
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-mermaid-svb',
    tab: 'rcpa_flujogramas',
    type: 'mermaid',
    order: 21,
    title: 'Flujograma SVB adulto',
    content: `flowchart TD
    A([Adulto sin respuesta]) --> B[Sin respiración o solo jadea:\\nactivar ayuda y pedir DEA]
    B --> C[Verificar pulso carotídeo máximo 10 seg]
    C --> D{¿Tiene pulso?}
    D -->|Sí| E[1 ventilación cada 5 a 6 segundos]
    E --> F{¿Pulso menor a 60/min\\ncon hipoperfusión?}
    F -->|Sí| G[Iniciar RCP]
    F -->|No| H[Reevaluar pulso cada 2 min]
    D -->|No| G
    G --> I{¿Cuántos\\nreanimadores?}
    I -->|1| J[30 compresiones : 2 ventilaciones]
    I -->|2 o más| K[30 compresiones : 2 ventilaciones\\nrolar compresor cada 2 min]
    J --> L[Tras 2 min: usar DEA]
    K --> L
    L --> M{¿Ritmo\\ndesfibrilable?}
    M -->|Sí| N[1 descarga y RCP inmediata 2 min]
    M -->|No| O[RCP inmediata 2 min y revisar ritmo]
    N --> M
    O --> M`,
    description: 'Soporte vital básico adulto antes de la llegada del equipo avanzado.',
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-mermaid-taquicardia',
    tab: 'rcpa_flujogramas',
    type: 'mermaid',
    order: 22,
    title: 'Flujograma taquicardia adulto con pulso',
    content: `flowchart TD
    A[Taquicardia con pulso] --> B[ABC · O2 · monitor · PA · oximetría · ECG 12D · IV/IO]
    B --> C{¿Inestable?\\nHipotensión · síncope · dolor torácico · IC aguda}
    C -->|Sí| D[Cardioversión sincronizada\\n100-200 J bifásico con sedación si no retrasa]
    C -->|No — estable| E{QRS estrecho\\nmenos de 0.12 seg}
    E -->|Sí| F{¿Compatible\\ncon TSV?}
    F -->|Sí| G[Maniobras vagales si procede]
    G --> H[Adenosina 6 mg rápido IV · flush 20 mL SF\\nSi no responde: 12 mg repetir hasta 3 veces]
    F -->|No — taquicardia sinusal| I[Buscar y tratar causa subyacente]
    E -->|No — QRS ancho| J{¿Regular y monomórfica?}
    J -->|Sí| K[Considerar adenosina si ritmo regular\\nAmiodarona 150 mg IV en 10 min si TV]
    J -->|No o dudoso| L[Consultar experto · preparar cardioversión]`,
    description: 'Complementa el algoritmo de PCR: permite intervenir antes de que progrese a paro.',
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-mermaid-derivacion',
    tab: 'rcpa_flujogramas',
    type: 'mermaid',
    order: 23,
    title: 'Flujograma local de derivación y traslado',
    content: `flowchart TD
    A([PCR adulto o paciente crítico\\nen HCSFB]) --> B{Lugar del evento}
    B -->|Urgencias| C[Equipo local asume roles MT/E1/E2/PM]
    B -->|Hospitalización| D[Activar código azul · 425974 o 425902\\niniciar RCP en el lugar]
    D --> E[Trasladar a Urgencias cuando sea posible]
    C --> F[RCP y estabilización según algoritmo]
    E --> F
    F --> G{¿ROSC o estabilizable\\npara traslado?}
    G -->|Sí| H[MT define necesidad de derivación\\na Hospital Herminda Martín u otro centro]
    G -->|No| I[Continuar RCP · reevaluar 4H/4T · decidir con equipo]
    H --> J[Coordinar con regulación y centro receptor\\nsegún disponibilidad]
    J --> K[Preparar resumen: tiempos · ritmo · descargas\\nfármacos · vía aérea · accesos · signos vitales]
    K --> L[Traslado medicalizado o SAMU según\\ngravedad y requerimientos]
    L --> M[Entregar con ficha/DAU · comunicación a familia]
    I --> F`,
    description: 'Secuencia operativa para coordinar destino tras PCR adulto o paciente crítico inestable.',
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 5: rcpa_postparo — Cuidados post-PCR
// ─────────────────────────────────────────────────────────────────────────────
const POSTPARO_BLOCKS = [
  {
    id: 'rcpa-v1-postrosc',
    tab: 'rcpa_postparo',
    type: 'flowchart',
    color: 'purple',
    order: 30,
    title: 'Cuidados post-PCR inmediatos (post-ROSC)',
    description: 'Tras el ROSC el objetivo es evitar lesión secundaria y coordinar traslado oportuno.',
    details: [
      'Oxigenación → ajustar FiO2 para SpO2 entre 94 y 98%; evitar hiperoxia sostenida (daño por reperfusión).',
      'Ventilación → evitar hipoventilación e hiperventilación; usar capnografía si hay vía aérea avanzada (ETCO2 objetivo 35-45 mmHg).',
      'Hemodinamia → monitorizar PA continua; objetivo PAM mayor a 65 mmHg; tratar hipotensión con fluidos y vasopresores según respuesta.',
      'Glucosa → HGT precoz y seriado; corregir hipoglicemia de inmediato y evitar hiperglicemia mayor a 180 mg/dL.',
      'Temperatura → evitar fiebre (T mayor a 37.8 °C); considerar manejo activo de temperatura en paciente inconsciente post-PCR.',
      'Neurológico → evaluar pupilas, nivel de conciencia (Glasgow), respuesta motora; vigilar convulsiones y tratar si corresponde.',
      'ECG y causa → ECG 12 derivaciones urgente; electrolitos, gases arteriales, lactato, troponina; buscar causa subyacente.',
      'Traslado → coordinar Hospital Herminda Martín u otro centro de mayor complejidad; enviar resumen clínico completo.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-derivacion',
    tab: 'rcpa_postparo',
    type: 'flowchart',
    color: 'blue',
    order: 31,
    title: 'Flujo local de derivación post-PCR',
    description: 'Usar cuando hay ROSC, paciente crítico persistente o necesidad de soporte no disponible en HCSFB.',
    details: [
      'Responsable → médico de turno lidera la decisión de derivación y la comunicación con la red y el centro receptor.',
      'Criterios de derivación → ROSC post-PCR, ventilación avanzada sostenida, shock persistente con vasoactivos, convulsiones, causa no resuelta, necesidad de UCI o intervención coronaria.',
      'Destino preferente → Hospital Herminda Martín (HHM), Chillán, o centro definido por la regulación asistencial.',
      'Antes del traslado → asegurar vía aérea, oxígeno, acceso IV/IO, monitor, control de glucosa, temperatura y PA; preparar medicamentos para el traslado.',
      'Documentación → enviar ficha/DAU con hora de colapso, hora de inicio de RCP, ritmos observados, descargas, fármacos, accesos, ROSC y condición neurológica inicial.',
      'Comunicación familiar → informar estado, causa probable, destino y responsable del traslado.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-registro',
    tab: 'rcpa_postparo',
    type: 'criteria',
    color: 'green',
    order: 32,
    title: 'Registro mínimo obligatorio del evento',
    items: [
      'Hora de colapso o hallazgo, hora de inicio de RCP y hora de activación del equipo.',
      'Ritmos observados y tiempo de cada análisis.',
      'Descargas: energía en J y hora de cada descarga.',
      'Fármacos: nombre, dosis, vía y hora de administración.',
      'Accesos: IV periférico o IO, sitio, número de intentos y responsable.',
      'Vía aérea: método utilizado, tamaño si fue intubado, confirmación de posición y ETCO2 si disponible.',
      'ROSC: hora, signos, PA, SpO2, HGT, temperatura y nivel de conciencia inicial.',
      'Comunicación con familia y centro receptor; nombre del responsable del traslado.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpa-v1-alerta-seguridad',
    tab: 'rcpa_postparo',
    type: 'alert',
    order: 33,
    title: 'Nota de seguridad clínica',
    content: 'Este resumen es apoyo operativo para el protocolo local GCL 1.4 A. Las dosis de vasopresores deben ajustarse según respuesta hemodinámica real. Confirmar concentración disponible en farmacia antes de preparar. Actualizar con el documento institucional oficial cuando esté disponible.',
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ALL_BLOCKS = [
  ...PROTOCOLO_BLOCKS,
  ...EQUIPO_BLOCKS,
  ...FARMACOS_BLOCKS,
  ...FLUJOGRAMAS_BLOCKS,
  ...POSTPARO_BLOCKS,
];

const tabs = [...new Set(ALL_BLOCKS.filter(b => b.tab).map(b => b.tab))];

console.log(`\n${'═'.repeat(55)}`);
console.log(`  RCP ADULTOS v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`${'═'.repeat(55)}`);
console.log(`\nBloques totales: ${ALL_BLOCKS.length}`);
console.log(`Pestañas: ${tabs.join(' | ')}`);
tabs.forEach(t => {
  const count = ALL_BLOCKS.filter(b => b.tab === t).length;
  console.log(`  ${t}: ${count} bloques`);
});

if (!APPLY) {
  console.log('\n⚠️  Dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Dr. Sebastián Bustos Sepúlveda', role: 'Revisor — Jefe Servicio Urgencias HCSFB' },
      { name: 'EU. María Teresa Medina Bravo', role: 'Revisora — Oficina de Calidad y Seguridad del Paciente' },
      { name: 'Dr. Álvaro Lagos Llanos', role: 'Aprobador — Director HCSFB' },
    ],
    content_blocks: ALL_BLOCKS,
    last_updated: new Date().toISOString(),
  })
  .eq('id', TOPIC_ID);

if (error) { console.error('\n❌ Error:', error.message); process.exit(1); }
console.log('\n✅ RCP Adultos actualizado con estructura de 5 pestañas.');
