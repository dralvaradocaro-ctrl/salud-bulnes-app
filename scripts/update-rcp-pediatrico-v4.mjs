/**
 * v4 — Enriquece el protocolo GCL 1.4 B RCP/PCR Pediátrico.
 *
 * Uso:
 *   node --env-file=.env scripts/update-rcp-pediatrico-v4.mjs
 *   node --env-file=.env scripts/update-rcp-pediatrico-v4.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TOPIC_NAME = 'Reanimación Cardiopulmonar Pediátrica';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const blocks = [
  {
    id: 'rcpp-v4-resumen',
    type: 'text',
    tab: 'rcpp_protocolo',
    color: 'blue',
    order: 2,
    title: '1. Activación y confirmación del PCR',
    content: `### Cuando se detecta un niño crítico
- Verificar seguridad de la escena y respuesta del paciente.
- Si no responde o requiere intervención inmediata, pedir ayuda en voz alta y activar la respuesta local.
- Solicitar carro de paro pediátrico, monitor/desfibrilador, oxígeno, aspiración y material de vía aérea.

### Confirmación en 10 segundos
- Evaluar respiración y pulso central en 5 a 10 segundos.
- Si no respira, solo jadea/boquea, o el pulso es ausente/dudoso, iniciar RCP.
- Si tiene pulso pero respiración inadecuada, ventilar con bolsa-mascarilla y reevaluar pulso cada 2 minutos.

### Activación local fuera de Pediatría/Urgencia
- En pasillos, patios u otros servicios: activar código azul de urgencias, llamar al 425894, informar nombre, lugar y urgencia correspondiente.
- Trasladar a Urgencia cuando las condiciones clínicas lo permitan.`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-marco-local',
    type: 'text',
    tab: 'rcpp_protocolo',
    color: 'slate',
    order: 99,
    title: 'Documento base y alcance GCL 1.4',
    content: `### Documento base revisado
Protocolo de Reanimación Cardiopulmonar Avanzada Pediátrica, Hospital Comunitario de Salud Familiar de Bulnes. Código GCL 1.4, cuarta edición, febrero 2024, vigencia febrero 2029.

### Objetivo del protocolo local
Establecer el procedimiento de RCP avanzada pediátrica dentro de la institución para asegurar una atención coordinada, de calidad y con foco en seguridad del paciente.

### Alcance operativo
Aplicar a todo paciente pediátrico que requiere RCP avanzada en Unidad de Urgencia, Servicio Clínico de Pediatría u otros espacios del establecimiento. Todo funcionario que participe en la respuesta debe conocer su rol, activar ayuda y ejecutar las acciones asignadas por el líder.`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-rcp-calidad',
    type: 'flowchart',
    tab: 'rcpp_protocolo',
    color: 'red',
    order: 3,
    title: '2. Iniciar RCP de alta calidad',
    description: 'Primer ciclo de intervención: compresiones, ventilación y mínima interrupción.',
    details: [
      'Frecuencia → 100 a 120 compresiones por minuto en todos los grupos pediátricos.',
      'Profundidad → lactante: 4 cm o 1/3 diámetro anteroposterior; niño: 5 cm o 1/3 diámetro anteroposterior; adolescente: 5 a 6 cm.',
      'Técnica lactante → 1 rescatador: 2 dedos bajo línea intermamilar; 2 rescatadores: 2 pulgares rodeando tórax.',
      'Técnica niño → talón de una o dos manos en mitad inferior del esternón según tamaño del paciente.',
      'Relación compresión:ventilación sin vía aérea avanzada → 30:2 con 1 reanimador; 15:2 con 2 reanimadores pediátricos.',
      'Con vía aérea avanzada → compresiones continuas + 1 ventilación cada 2 a 3 segundos, evitando hiperventilación.',
      'Pausas → detener compresiones solo para análisis de ritmo/descarga y mantener pausas menores a 10 segundos.',
      'Rotación → cambiar compresor cada 2 minutos o antes si hay fatiga.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-desfibrilacion',
    type: 'flowchart',
    tab: 'rcpp_protocolo',
    color: 'orange',
    order: 4,
    title: '3. Monitorizar, clasificar ritmo y desfibrilar si corresponde',
    description: 'Esta decisión se repite cada 2 minutos durante el código.',
    details: [
      'Conectar monitor/desfibrilador tan pronto esté disponible sin suspender RCP más de lo necesario.',
      'Ritmo desfibrilable → fibrilación ventricular o taquicardia ventricular sin pulso.',
      'Primera descarga → 2 J/kg; reanudar RCP inmediatamente por 2 minutos.',
      'Segunda descarga → 4 J/kg; reanudar RCP inmediatamente.',
      'Descargas posteriores → al menos 4 J/kg, hasta 10 J/kg o dosis adulta máxima según equipo.',
      'Ritmo no desfibrilable → asistolia o actividad eléctrica sin pulso: RCP + adrenalina precoz + causas reversibles.',
      'DEA pediátrico → usar atenuador pediátrico si disponible; si no existe, usar DEA estándar sin retrasar descarga.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-signos-premonitorios',
    type: 'criteria',
    tab: 'rcpp_protocolo',
    color: 'amber',
    order: 1,
    title: '0. Deterioro previo y criterios de PCR',
    content: 'En pediatría el paro suele seguir a falla respiratoria o shock. La detección temprana evita progresión a bradicardia, hipotensión y PCR.',
    items: [
      'Falla respiratoria: taquipnea para la edad con retracciones, aleteo nasal, quejido o respiración paradojal.',
      'Falla respiratoria avanzada: disminución de frecuencia/esfuerzo respiratorio o excursión torácica, especialmente si hay depresión sensorial.',
      'Cianosis o respiración anormal pese a oxígeno suplementario.',
      'Shock compensado: taquicardia, extremidades frías/pálidas, llene capilar mayor de 2 segundos, pulsos periféricos débiles con PAS aún normal.',
      'Shock descompensado: compromiso de conciencia, oliguria, acidosis metabólica, taquipnea, pulsos centrales débiles, piel moteada e hipotensión.',
      'Hipotensión: RNT PAS <60; lactante 1-12 meses <70; 1-10 años <70 + edad x2; mayores de 10 años <90 mmHg.',
      'PCR clínico: no responde, no respira normalmente o solo jadea/boquea, y pulso ausente o no detectable en 10 segundos.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-equipo-pediatria',
    type: 'flowchart',
    tab: 'rcpp_equipo',
    color: 'indigo',
    order: 6,
    title: 'Equipo ante PCR en Servicio de Pediatría',
    description: 'Roles definidos por el protocolo institucional GCL 1.4 para horario hábil y no hábil.',
    details: [
      'Horario hábil: médico de turno (MT), enfermera de Pediatría (E1), enfermero de Medicina 2 (E2), TENS/paramédico de Pediatría (PM1), TENS/paramédico de Medicina 2 (PM2).',
      'Horario no hábil: médico de turno (MT), enfermero de Medicina 2 (E1), paramédico de Urgencia (PM1), paramédico de Pediatría (PM2), paramédico de Medicina 2 (PM3).',
      'Si el evento ocurre en pasillo, patio u otro servicio: activar código azul de urgencias, llamar al 425894, informar nombre, lugar y urgencia, y trasladar al paciente al Servicio de Urgencias cuando corresponda.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-equipo-urgencia',
    type: 'flowchart',
    tab: 'rcpp_equipo',
    color: 'blue',
    order: 7,
    title: 'Equipo ante PCR en Unidad de Urgencia',
    description: 'Dotación mínima operativa descrita en el documento local.',
    details: [
      'Horario hábil: médico de turno (MT), enfermera de Urgencia (E1), enfermero de Medicina 1 (E2), paramédico de Urgencia (PM1) y paramédico de Urgencia (PM2).',
      'Horario no hábil: médico de turno (MT), enfermero de Urgencia (E1), enfermero de Medicina 1 (E2), paramédico de Urgencia (PM1) y paramédico de Urgencia (PM2).',
      'Las funciones son equivalentes a las del PCR en Pediatría; el líder puede reasignarlas según disponibilidad y competencias del equipo presente.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-responsabilidades-equipo',
    type: 'criteria',
    tab: 'rcpp_equipo',
    color: 'emerald',
    order: 8,
    title: 'Responsabilidades durante la reanimación',
    content: 'Las funciones pueden modificarse por indicación del líder clínico, pero siempre deben quedar cubiertas.',
    items: [
      'MT: lidera el equipo, maneja vía aérea, prescribe fármacos, entrega instrucciones claras e informa a la familia.',
      'E1: obtiene acceso venoso o intraóseo, prepara y administra medicamentos.',
      'E2: instala monitor cardíaco, programa desfibrilador/cardioversión y realiza descarga indicada.',
      'PM1: realiza masaje cardíaco de alta calidad.',
      'PM2: registra tiempos, ritmos, fármacos, dosis, descargas, ROSC y traslado.',
      'PM1 y PM2 deben alternar compresiones cada ciclo de 2 minutos o antes si hay fatiga.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-calculadora-peso',
    type: 'dose_calculator',
    tab: 'rcpp_farmacos',
    color: 'green',
    order: 9,
    title: 'Calculadora rápida de dosis por peso',
    description: 'Ingresa el peso del paciente para calcular dosis de fármacos críticos del PCR pediátrico.',
    medications: [
      {
        name: 'Adrenalina IV/IO',
        route: 'IV/IO',
        dose_per_kg: 0.01,
        dose_label: '0.01 mg/kg; repetir cada 3-5 min',
        unit: 'mg',
        max_dose: 1,
        concentration: 0.1,
        concentration_label: '0.1 mg/mL, dilución 1:10.000',
        indication: 'PCR; precoz en asistolia/AESP',
        note: 'Disponible según protocolo local como ampolla 1:1.000. Preparar 1 mg/1 mL + 9 mL SF para obtener 0.1 mg/mL.',
      },
      {
        name: 'Adrenalina endotraqueal',
        route: 'ET',
        dose_per_kg: 0.1,
        dose_label: '0.1 mg/kg si no hay IV/IO',
        unit: 'mg',
        max_dose: 2.5,
        concentration: 1,
        concentration_label: '1 mg/mL, 1:1.000',
        indication: 'Solo mientras se obtiene acceso IV/IO',
        note: 'Misma ampolla 1:1.000 disponible localmente.',
      },
      {
        name: 'Atropina',
        route: 'IV/IO',
        dose_per_kg: 0.02,
        dose_label: '0.02 mg/kg; mínimo 0.1 mg',
        unit: 'mg',
        max_dose: 0.5,
        concentration: 1,
        concentration_label: '1 mg/mL',
        indication: 'Bradiarritmia vagal o bloqueo AV',
        note: 'Presentación descrita en protocolo: ampolla 1 mg/mL. En adolescentes el máximo descrito es 1 mg.',
      },
      {
        name: 'Amiodarona',
        route: 'IV/IO',
        dose_per_kg: 5,
        dose_label: '5 mg/kg en bolo',
        unit: 'mg',
        max_dose: 300,
        indication: 'FV/TV sin pulso refractaria',
        note: 'Incluida en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Lidocaína',
        route: 'IV/IO',
        dose_per_kg: 1,
        dose_label: '1 mg/kg en bolo',
        unit: 'mg',
        max_dose: 100,
        indication: 'Alternativa a amiodarona',
        note: 'Incluida en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Sulfato de magnesio',
        route: 'IV/IO',
        dose_per_kg: 50,
        dose_label: '25-50 mg/kg; calculado a 50 mg/kg',
        unit: 'mg',
        max_dose: 2000,
        indication: 'Torsades de pointes o hipomagnesemia',
        note: 'Incluido en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Cloruro de calcio',
        route: 'IV/IO',
        dose_per_kg: 20,
        dose_label: '20 mg/kg lento',
        unit: 'mg',
        max_dose: 2000,
        indication: 'HiperK, hipocalcemia o bloqueadores de calcio',
        note: 'Incluido en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Gluconato de calcio',
        route: 'IV/IO',
        dose_per_kg: 100,
        dose_label: '100 mg/kg lento',
        unit: 'mg',
        indication: 'Alternativa de calcio IV/IO',
        note: 'Incluido en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Bicarbonato de sodio',
        route: 'IV/IO',
        dose_per_kg: 1,
        dose_label: '1 mEq/kg',
        unit: 'mEq',
        indication: 'HiperK, tricíclicos, acidosis grave o PCR prolongado con indicación',
        note: 'Incluido en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Glucosa SG 10%',
        route: 'IV/IO',
        dose_per_kg: 0.5,
        dose_label: '0.5 g/kg; equivale a 5 mL/kg de SG 10%',
        unit: 'g',
        concentration: 0.1,
        concentration_label: '0.1 g/mL, SG 10%',
        indication: 'Hipoglicemia',
        note: 'Incluida en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Adenosina primera dosis',
        route: 'IV/IO',
        dose_per_kg: 0.1,
        dose_label: '0.1 mg/kg rápido',
        unit: 'mg',
        max_dose: 6,
        indication: 'TSV regular con pulso',
        note: 'Incluida en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Adenosina segunda dosis',
        route: 'IV/IO',
        dose_per_kg: 0.2,
        dose_label: '0.2 mg/kg rápido',
        unit: 'mg',
        max_dose: 12,
        indication: 'TSV persistente tras primera dosis',
        note: 'Incluida en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
      {
        name: 'Procainamida',
        route: 'IV/IO',
        dose_per_kg: 15,
        dose_label: '15 mg/kg en 30-60 min',
        unit: 'mg',
        indication: 'TV/TSV con pulso estable y monitorización',
        note: 'Incluida en medicamentos usados en RCP del protocolo GCL 1.4.',
      },
    ],
    footer: 'Medicamentos limitados a los descritos como usados en RCP en el protocolo local GCL 1.4. Confirmar stock real del carro de paro, peso, concentración disponible, vía, indicación y dosis máxima antes de administrar.',
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-acceso-via-aerea',
    type: 'flowchart',
    tab: 'rcpp_protocolo',
    color: 'blue',
    order: 5,
    title: '4. Intervenciones paralelas: acceso vascular y vía aérea',
    description: 'Se realizan en paralelo al ciclo de RCP, sin retrasar compresiones ni descargas.',
    details: [
      'Acceso IV periférico → intentar rápido mientras continúa RCP.',
      'Acceso IO → indicar si no se obtiene IV en aproximadamente 60 segundos o tras 2 intentos fallidos; es vía de elección rápida en PCR pediátrico.',
      'Flush posterior a fármacos → administrar bolo de SF 5 mL según protocolo local, 5 a 10 mL según edad/tamaño, y elevar extremidad si IV periférico.',
      'Vía ET → tercera opción si no hay IV/IO; usar solo fármacos liposolubles disponibles y autorizados por el líder clínico, empujar con 5 mL SF y dar 5 ventilaciones rápidas.',
      'Bolsa-mascarilla → técnica de 2 operadores cuando sea posible; oxígeno alto flujo; verificar elevación torácica.',
      'Vía aérea avanzada → considerar si ventilación con bolsa-mascarilla es inefectiva o PCR prolongado; confirmar con capnografía/capnometría.',
      'ETCO2 → si persistentemente bajo, revisar calidad de compresiones, posición tubo, ventilación y causas reversibles.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-causas',
    type: 'criteria',
    tab: 'rcpp_protocolo',
    color: 'amber',
    order: 6,
    title: '5. Buscar y tratar causas reversibles en cada ciclo',
    content: 'H y T pediátricas: tratarlas cambia el pronóstico.',
    items: [
      'Hipoxia: causa frecuente en pediatría; asegurar vía aérea, sello de mascarilla, oxígeno, aspiración si secreciones.',
      'Hipovolemia: trauma, diarrea/vómitos, sepsis, hemorragia; considerar cristaloide 10 a 20 mL/kg con reevaluación.',
      'Hidrogeniones/acidosis: mejorar ventilación/perfusión; bicarbonato solo si indicación específica.',
      'Hipoglicemia: control de HGT obligatorio y corrección inmediata si baja.',
      'Hipo/hiperkalemia: buscar ERC, medicamentos, quemaduras, arritmias; calcio/insulina-glucosa/bicarbonato según caso.',
      'Hipotermia: recalentamiento activo y adaptar tiempos según severidad.',
      'Neumotórax a tensión: descompresión inmediata si sospecha clínica.',
      'Taponamiento cardiaco: considerar en trauma, post-procedimiento, pericarditis; ecografía si disponible sin retrasar RCP.',
      'Tóxicos: opioides, tricíclicos, beta-bloqueadores, bloqueadores de calcio, organofosforados; antídotos según sospecha.',
      'Trombosis pulmonar/coronaria: rara en niños, considerar cardiopatía, catéteres, trombofilia o adolescente.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-salida-evento',
    type: 'flowchart',
    tab: 'rcpp_protocolo',
    color: 'purple',
    order: 7,
    title: '6. Salida del ciclo: ROSC, traslado o continuidad',
    description: 'Al cierre de cada ciclo se decide si continuar RCP, pasar a post-PCR o activar derivación.',
    details: [
      'Si no hay ROSC → continuar ciclos de RCP de 2 minutos, reevaluar ritmo, calidad de compresiones, ventilación, acceso y causas reversibles.',
      'Si hay ROSC → pasar inmediatamente a cuidados post-PCR: oxigenación, ventilación, PA, glucosa, temperatura, ECG y causa probable.',
      'Si el paciente queda crítico o requiere soporte no disponible localmente → activar flujo local de derivación y traslado.',
      'Si se decide continuar o suspender maniobras → la decisión debe quedar liderada por MT, registrada con tiempos, ritmos, fármacos, descargas y fundamento clínico.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-mermaid-general',
    type: 'mermaid',
    tab: 'rcpp_flujogramas',
    order: 20,
    title: 'Flujograma general PCR pediátrico',
    description: 'Secuencia desde reconocimiento hasta ROSC o continuidad del algoritmo.',
    content: `flowchart TD
    A([Niño/lactante sin respuesta]) --> B[Activar ayuda y pedir carro de paro pediátrico]
    B --> C[Evaluar respiración y pulso central 5-10 s]
    C --> D{¿Pulso claro y respiración efectiva?}
    D -->|Sí| E[Oxígeno, monitor, evaluar causa y traslado según gravedad]
    D -->|No o duda| F[Iniciar RCP de alta calidad]
    F --> G[Conectar monitor/desfibrilador]
    G --> H{¿Ritmo desfibrilable?}
    H -->|Sí: FV/TVSP| I[Descarga 2 J/kg]
    I --> J[RCP 2 min + IV/IO]
    J --> K[Descarga 4 J/kg si persiste]
    K --> L[RCP 2 min + adrenalina c/3-5 min]
    L --> M[Descargas >=4 J/kg + amiodarona o lidocaína]
    M --> N[Buscar y tratar H y T]
    N --> O{¿ROSC?}
    H -->|No: asistolia/AESP| P[RCP 2 min + IV/IO]
    P --> Q[Adrenalina lo antes posible y c/3-5 min]
    Q --> N
    O -->|Sí| R([Cuidados post-PCR y traslado])
    O -->|No| G`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-mermaid-svb',
    type: 'mermaid',
    tab: 'rcpp_flujogramas',
    order: 21,
    title: 'Flujograma SVB pediátrico',
    description: 'Resumen del soporte vital básico incluido en el documento institucional.',
    content: `flowchart TD
    A([Sin respuesta]) --> B[Sin respiración o solo boquea: activar ayuda y pedir DEA]
    B --> C[Verificar pulso central máximo 10 s]
    C --> D{¿Tiene pulso?}
    D -->|Sí| E[1 ventilación cada 3 s]
    E --> F{¿Pulso menor a 60/min con hipoperfusión pese a oxígeno y ventilación?}
    F -->|Sí| G[Iniciar RCP]
    F -->|No| H[Reevaluar pulso cada 2 min]
    D -->|No| G
    G --> I{¿Cuántos reanimadores?}
    I -->|1| J[30 compresiones : 2 ventilaciones]
    I -->|2 o más| K[15 compresiones : 2 ventilaciones]
    J --> L[Tras 2 min activar sistema si estaba solo y usar DEA]
    K --> L
    L --> M{¿Ritmo desfibrilable?}
    M -->|Sí| N[1 descarga y RCP inmediata 2 min]
    M -->|No| O[RCP inmediata 2 min y revisar ritmo]
    N --> M
    O --> M`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-mermaid-pals-sistematico',
    type: 'mermaid',
    tab: 'rcpp_flujogramas',
    order: 23,
    title: 'Flujograma de enfoque sistemático PALS',
    description: 'Secuencia evaluar-identificar-intervenir antes, durante y después del evento.',
    content: `flowchart TD
    A[Evaluación inicial: aspecto, respiración, circulación y color] --> B{¿No responde o requiere intervención inmediata?}
    B -->|Sí| C[Pedir ayuda y activar respuesta de emergencia]
    B -->|No| D{¿Compromiso grave de vía aérea, respiración o perfusión?}
    C --> E{¿Respira y tiene pulso?}
    E -->|No| F[Iniciar RCP C-A-B y pasar a algoritmo PCR]
    E -->|Respiración anormal con pulso| G[Mantener vía aérea, ventilación de rescate, oxígeno, pulso y oximetría]
    G --> H{¿Pulso menor a 60/min con mala perfusión pese a soporte?}
    H -->|Sí| F
    H -->|No| I[Evaluación primaria y secundaria]
    D -->|Sí| J[Soporte A-B-C, oxígeno, monitorización]
    D -->|No| I
    J --> I
    I --> K[Identificar problema principal]
    K --> L[Intervenir]
    L --> I`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-mermaid-taquicardia',
    type: 'mermaid',
    tab: 'rcpp_flujogramas',
    order: 24,
    title: 'Flujograma taquicardia pediátrica con pulso',
    description: 'Complementa el PCR: permite intervenir antes de que el paciente progrese a paro.',
    content: `flowchart TD
    A[Taquicardia con pulso] --> B[ABC, oxígeno, monitor, PA, oximetría, ECG 12 derivaciones si disponible, acceso IV/IO]
    B --> C{¿Insuficiencia cardiopulmonar?}
    C -->|Sí| D{QRS estrecho <=0.09 s o ancho >0.09 s}
    D -->|Cualquiera inestable| E[Cardioversión sincronizada 0.5-1 J/kg]
    E --> F[Si no responde: 2 J/kg y sedar si no retrasa]
    C -->|No| G{QRS estrecho <=0.09 s}
    G -->|Sí| H{¿Compatible con TSV?}
    H -->|Sí| I[Maniobras vagales si procede]
    I --> J[Adenosina 0.1 mg/kg rápido; segunda 0.2 mg/kg]
    H -->|No| K[Taquicardia sinusal: buscar y tratar causa]
    G -->|No| L[Posible TV con pulso]
    L --> M[Consultar experto; si regular y monomórfica considerar adenosina]
    M --> N[Considerar procainamida o amiodarona según contexto y monitorización]`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-mermaid-derivacion-local',
    type: 'mermaid',
    tab: 'rcpp_flujogramas',
    order: 25,
    title: 'Flujograma local de derivación y traslado',
    description: 'Secuencia operativa para coordinar destino tras PCR pediátrico o paciente crítico inestable.',
    content: `flowchart TD
    A([PCR pediátrico o paciente crítico]) --> B{Lugar del evento}
    B -->|Pediatría o Urgencia| C[Equipo local asume roles MT/E1/E2/PM]
    B -->|Pasillo, patio u otro servicio| D[Activar código azul de urgencias: llamar 425894, informar nombre, lugar y urgencia]
    D --> E[Trasladar a Unidad de Urgencia si las condiciones lo permiten]
    C --> F[RCP/estabilización según algoritmo]
    E --> F
    F --> G{¿ROSC o paciente estabilizable para traslado?}
    G -->|Sí| H[MT define necesidad de derivación a centro de mayor complejidad/UCI pediátrica]
    G -->|No| I[Continuar RCP, reevaluar H y T y definir conducta con equipo]
    H --> J[Contactar red de derivación/regulación y centro receptor según disponibilidad]
    J --> K[Preparar resumen: tiempos, ritmo, descargas, fármacos, vía aérea, accesos, signos vitales]
    K --> L[Coordinar traslado medicalizado/SAMU según gravedad y requerimientos]
    L --> M[Entregar paciente con registro clínico, DAU/ficha y comunicación a familia]
    I --> F`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-mermaid-roles',
    type: 'mermaid',
    tab: 'rcpp_equipo',
    order: 9,
    title: 'Flujograma de roles del equipo local',
    description: 'Distribución funcional MT/E1/E2/PM del protocolo HCSFB.',
    content: `flowchart LR
    MT[Médico de turno MT] --> L[Lidera, vía aérea, prescribe fármacos, informa a familia]
    E1[Enfermera/o E1] --> A[Acceso venoso o intraóseo, prepara y administra fármacos]
    E2[Enfermera/o E2] --> D[Monitor cardíaco, desfibrilador, cardioversión y descarga]
    PM1[Paramédico PM1] --> C[Compresiones torácicas]
    PM2[Paramédico PM2] --> R[Registro de tiempos, ritmo, dosis, descargas y ROSC]
    PM3[Paramédico PM3 si horario no hábil] --> S[Apoyo operativo según reasignación del líder]
    C --> X[Rotar compresor cada 2 min con PM2 si corresponde]`,
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-derivacion-local',
    type: 'flowchart',
    tab: 'rcpp_postparo',
    color: 'blue',
    order: 29,
    title: 'Flujo local de derivación post-PCR',
    description: 'Usar cuando hay ROSC, paciente crítico persistente o necesidad de soporte no disponible localmente.',
    details: [
      'Responsable → médico de turno lidera la decisión de derivación y comunicación clínica con la red/centro receptor.',
      'Criterios de derivación → ROSC post-PCR, ventilación avanzada, shock persistente, requerimiento de vasoactivos, convulsiones, causa no resuelta o necesidad de UCI pediátrica.',
      'Destino → coordinar con la red asistencial según disponibilidad y complejidad; considerar UCI pediátrica/centro de mayor complejidad definido por regulación.',
      'Antes de traslado → asegurar vía aérea, oxígeno, acceso IV/IO, monitor, control de glucosa, temperatura, presión arterial y plan de fármacos.',
      'Documentación → enviar ficha clínica o DAU, hoja de registro del PCR, dosis, horarios, descargas, ritmo inicial/final, hora de ROSC y condición neurológica inicial.',
      'Comunicación familiar → informar estado, motivo de derivación, destino propuesto y responsable del traslado.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-postrosc',
    type: 'flowchart',
    tab: 'rcpp_postparo',
    color: 'purple',
    order: 30,
    title: 'Cuidados post-PCR inmediatos',
    description: 'Tras ROSC, el objetivo es evitar lesión secundaria y coordinar traslado.',
    details: [
      'Oxigenación → titular FiO2 para SpO2 94 a 99%; evitar hipoxemia e hiperoxia sostenida.',
      'Ventilación → evitar hipo/hipercapnia; usar capnografía si hay vía aérea avanzada.',
      'Hemodinamia → monitor cardíaco, PA frecuente o invasiva si disponible; tratar hipotensión con fluidos y vasoactivos según respuesta.',
      'Glucosa → controlar HGT precoz y seriado; corregir hipo/hiperglicemia significativa.',
      'Temperatura → evitar fiebre; manejo activo si T mayor a 38 °C.',
      'Neurológico → evaluar pupilas, Glasgow/AVPU, convulsiones; considerar manejo anticonvulsivante si crisis.',
      'ECG y causa → ECG 12 derivaciones, electrolitos, gases, lactato, hemograma y búsqueda dirigida según evento.',
      'Traslado → coordinar UCI pediátrica/Hospital Herminda Martín u otro centro definido, con resumen de tiempos, ritmos, descargas, fármacos y respuesta.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-registro',
    type: 'criteria',
    tab: 'rcpp_postparo',
    color: 'green',
    order: 31,
    title: 'Registro mínimo obligatorio del evento',
    items: [
      'Hora de colapso o hallazgo, hora de inicio de RCP y hora de activación del equipo.',
      'Ritmos observados y tiempos de análisis.',
      'Descargas: energía J/kg y hora de cada descarga.',
      'Fármacos: nombre, concentración, dosis mg/kg o mL/kg, vía y hora.',
      'Accesos: IV/IO/ETT, sitio, número de intentos y responsable.',
      'Vía aérea: método, tamaño tubo si corresponde, confirmación y ETCO2 si disponible.',
      'ROSC: hora, signos, PA, SatO2, HGT, temperatura y condición neurológica inicial.',
      'Comunicación con familia y centro receptor; responsable del traslado.',
    ],
    layout_position: 'main',
  },
  {
    id: 'rcpp-v4-alerta-seguridad',
    type: 'alert',
    tab: 'rcpp_postparo',
    order: 32,
    title: 'Nota de seguridad clínica',
    content: 'Este resumen es apoyo operativo para el protocolo local. Las dosis deben verificarse contra peso estimado/real, concentración disponible, tabla de Broselow y criterio del líder de reanimación. Actualizar con el documento institucional oficial cuando esté disponible.',
    layout_position: 'main',
  },
];

const protocolMedications = [];

async function main() {
  const { data: topic, error: findError } = await supabase
    .from('topics')
    .select('id,name,content_blocks')
    .ilike('name', `%${TOPIC_NAME}%`)
    .limit(1)
    .single();

  if (findError || !topic) {
    throw new Error(`No se encontró "${TOPIC_NAME}": ${findError?.message || 'sin datos'}`);
  }

  console.log(`\nRCP Pediátrico v4 — ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Topic: ${topic.name} (${topic.id})`);
  console.log(`Bloques actuales: ${(topic.content_blocks || []).length}`);
  console.log(`Bloques nuevos: ${blocks.length}`);
  console.log(`Tabs: ${[...new Set(blocks.map(b => b.tab).filter(Boolean))].join(', ')}`);

  if (!APPLY) {
    console.log('\nModo dry-run. Usa --apply para escribir en Supabase.');
    return;
  }

  const { error: updateError } = await supabase
    .from('topics')
    .update({
      description: 'Protocolo operativo de reanimación cardiopulmonar pediátrica con técnica por edad, algoritmo por ritmo, fármacos por kg, causas reversibles, roles del equipo y cuidados post-PCR.',
      protocol_objective: 'Estandarizar la atención del PCR pediátrico en HCSFB mediante RCP de alta calidad, desfibrilación oportuna, administración segura de fármacos ajustados a peso, búsqueda de causas reversibles y coordinación post-ROSC.',
      tags: ['RCP pediátrico', 'PCR pediátrico', 'PALS', 'Código Azul Pediátrico', 'Urgencias', 'Fármacos por peso'],
      content_blocks: blocks,
      protocol_medications: protocolMedications,
      protocol_flowchart: [],
      last_updated: new Date().toISOString(),
    })
    .eq('id', topic.id);

  if (updateError) throw updateError;
  console.log('Actualizado correctamente.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
