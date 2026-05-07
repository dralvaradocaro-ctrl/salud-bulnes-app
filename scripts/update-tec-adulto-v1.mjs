/**
 * v1 - Actualiza el protocolo HCSFB 130 TEC adulto en urgencias.
 *
 * Uso:
 *   node --env-file=.env scripts/update-tec-adulto-v1.mjs
 *   node --env-file=.env scripts/update-tec-adulto-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TOPIC_ID = 'b05b625c-73d9-4413-98e1-15b246f90381';
const PROTOCOL_URL = 'https://drive.google.com/file/d/1k1BhB39-jfn2a1SLKSTWjDsWSPqG0Ops/view?usp=drivesdk';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const blocks = [
  {
    id: 'tec-adulto-v1-marco-local',
    type: 'text',
    tab: 'tec_adulto_protocolo',
    color: 'slate',
    order: 1,
    title: 'Documento base HCSFB 130',
    content: `### Protocolo local revisado
Protocolo Manejo de Traumatismo Craneoencefálico del Adulto en Servicio de Urgencias Hospital de Bulnes. Código HCSFB 130, primera edición, abril 2025, vigencia abril 2030.

### Alcance
Pacientes de la microrred Bulnes, Santa Clara y Quillón que consulten por trauma en cráneo, con especial énfasis en sospecha de TEC moderado o grave.

### Propósito operativo
Estandarizar diagnóstico, seguimiento, educación al alta, identificación de signos de alarma y derivación oportuna a hospital regional o centro de mayor complejidad.`,
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-secuencia-evento',
    type: 'flowchart',
    tab: 'tec_adulto_protocolo',
    color: 'blue',
    order: 2,
    title: 'Secuencia lógica en urgencias',
    description: 'Orden sugerido para el evento real: entrada, triage, evaluación médica, decisión de imagen/observación y destino.',
    details: [
      'Inscripción → realizar en admisión si el paciente está estable; si llega crítico, ingresar directo a reanimador y regularizar luego.',
      'Triage → enfermero o TENS categoriza según apariencia clínica, historia de trauma y factores predictores de mala evolución.',
      'C1-C2 → pasar inmediatamente a box de reanimación.',
      'C3 → comunicar a médico de turno; puede esperar en sala si el médico lo determina.',
      'C4 → espera en sala de espera con reevaluación si cambia condición clínica.',
      'Evaluación médica → ABCDE del trauma, signos vitales, GCS después de reanimación, pupilas, focalidad, signos de base de cráneo y factores de riesgo.',
      'Decisión → alta educada si TEC leve sin factores de riesgo ni deterioro; observación local si corresponde; derivación si hay criterios de TC, TEC moderado/grave o compromiso clínico.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-definicion-clasificacion',
    type: 'flowchart',
    tab: 'tec_adulto_clinica',
    color: 'indigo',
    order: 3,
    title: 'Definición y clasificación',
    description: 'El GCS debe calcularse después de manejar ABC y reanimar adecuadamente.',
    details: [
      'TEC operacional → trauma de cráneo con al menos alteración de conciencia o amnesia, cambio neurológico/neurofisiológico, o fractura/lesión intracraneal atribuible al trauma.',
      'Contusión de cráneo → trauma de cráneo que no cumple definición operacional de TEC.',
      'TEC cerrado → sin daño meníngeo.',
      'TEC abierto → rotura de duramadre, herida penetrante, fractura con rotura dural o base de cráneo; implica mayor mortalidad, secuelas y riesgo de infección del SNC.',
      'Leve → GCS 14-15.',
      'Moderado → GCS 9-13.',
      'Severo → GCS 3-8.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-factores-riesgo',
    type: 'criteria',
    tab: 'tec_adulto_clinica',
    color: 'amber',
    order: 4,
    title: 'Factores de riesgo a buscar activamente',
    content: 'Tabla 1 del protocolo local: aumentan la sospecha de lesión intracraneal o mala evolución.',
    items: [
      'Accidente de alta energía.',
      'Muerte de otro accidentado en el mismo evento.',
      'Sospecha de lesión penetrante de cráneo.',
      'Edad mayor de 65 años.',
      'Epilepsia.',
      'Anticoagulación oral o coagulopatía conocida.',
      'Antecedente de enfermedad neuroquirúrgica.',
      'Alcoholismo crónico o abuso de drogas.',
      'Paciente sin redes de apoyo.',
      'Segunda consulta por el mismo evento.',
      'Pérdida de conciencia mayor de 5 minutos.',
      'Cefalea intensa/progresiva.',
      'Vómitos explosivos o recurrentes.',
      'Convulsiones.',
      'Amnesia pre o postraumática.',
      'Déficit neurológico, focalidad, agitación psicomotora o deterioro de conciencia.',
      'Otorrea, otorragia, rinorragia o signos de fractura de base de cráneo.',
      'Evidencia radiológica de fractura de cráneo.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-imagen-observacion',
    type: 'flowchart',
    tab: 'tec_adulto_clinica',
    color: 'purple',
    order: 5,
    title: 'Imagen, observación y alta educada',
    description: 'La radiografía de cráneo es un recurso local limitado y no reemplaza la TC cuando hay criterios.',
    details: [
      'Indicación de TC/derivación para neuroimagen → GCS 15 con factores de riesgo.',
      'Indicación de TC/derivación para neuroimagen → GCS 14 o menor.',
      'Indicación de TC/derivación para neuroimagen → anisocoria mayor a 2 mm con midriasis unilateral, sugerente de herniación uncal.',
      'Radiografía de cráneo → disponible localmente como evaluación básica; considerar solo en GCS 15 sin factores de riesgo, entendiendo sus falsos negativos.',
      'Observación sin factores de riesgo → al menos 2 horas desde ocurrido el TEC, con reevaluación y registro de GCS.',
      'Si no es posible observar el tiempo estipulado → entregar hoja de signos de alarma si existe tercer observador capaz de vigilar al paciente.',
      'Alta → educar verbalmente y entregar hoja de alta para TEC leve, dejando claros motivos de reconsulta.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-neuroproteccion',
    type: 'flowchart',
    tab: 'tec_adulto_neuroproteccion',
    color: 'green',
    order: 6,
    title: 'Neuroprotección en TEC moderado o severo',
    description: 'Medidas generales descritas para estabilizar antes y durante la derivación.',
    details: [
      'Posición → supino con cabecera a 30 grados, cabeza en posición neutra e inmovilizador cervical.',
      'Vía aérea → iniciar ABCDE; considerar vía aérea avanzada si GCS menor a 8, no mantiene vía aérea, hipoxemia pese a oxígeno, inestabilidad que no revierte, alto riesgo durante traslado o agitación que exige sedación con riesgo respiratorio.',
      'Oxigenación → objetivo PaO2 mayor a 60 mmHg; en realidad local, vigilar saturación sobre 92-94%.',
      'Ventilación → objetivo PaCO2 35-45 mmHg; si se usa capnometría, objetivo ETCO2 30-35 mmHg.',
      'Temperatura → mantener normotermia; monitorizar con termómetro axilar seriado.',
      'Presión arterial → evitar hipotensión; metas PAS: 15-49 años mayor a 110 mmHg, 50-69 años mayor a 100 mmHg, mayores de 70 años mayor a 110 mmHg.',
      'Glicemia → mantener entre 80 y 180 mg/dL; controlar con HGT seriado.',
      'Fluidos → usar cristaloide isotónico tibio si no se cumplen objetivos de perfusión/PA; evitar soluciones hipotónicas salvo corrección de hipoglicemia.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-procedimientos',
    type: 'flowchart',
    tab: 'tec_adulto_neuroproteccion',
    color: 'orange',
    order: 7,
    title: 'Procedimientos y preparación para traslado',
    description: 'Acciones prácticas que sostienen la derivación segura.',
    details: [
      'Monitorización → signos vitales seriados, GCS, pupilas, saturación, PA no invasiva programada y HGT según condición.',
      'Reanimador → C1-C2, GCS menor a 14, anisocoria, compromiso de vía aérea, convulsión, inestabilidad o sospecha de HTIC/herniación.',
      'Intubación → realizar con estabilización cervical; retirar porción anterior de collar solo para laringoscopía si se requiere y evitar posición de olfateo.',
      'SRI → usar drogas de latencia corta; el protocolo local menciona pretratamiento con fentanilo o lidocaína disponibles, e inducción considerando estado hemodinámico.',
      'Imagen local → radiografía de cráneo AP, lateral y Towne solo como recurso básico en GCS 15 sin factores de riesgo; no debe retrasar derivación si hay criterios de TC.',
      'Ley de Urgencia → activar ante sospecha de TEC moderado/grave y previa derivación a centro de mayor complejidad.',
      'Registro → documentar DAU, GCS seriado, factores de riesgo, examen neurológico, educación/hoja de alta, activación de Ley de Urgencia y traslado.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-calculadora',
    type: 'dose_calculator',
    tab: 'tec_adulto_farmacos',
    color: 'green',
    order: 8,
    title: 'Calculadora por peso para fármacos/volúmenes del protocolo',
    description: 'Apoyo rápido para indicaciones dependientes de peso descritas en el protocolo local.',
    medications: [
      {
        name: 'Suero fisiológico 0.9% bolo bajo',
        route: 'EV',
        dose_per_kg: 20,
        dose_label: '20 mL/kg',
        unit: 'mL',
        indication: 'Hipoperfusión o PA bajo meta',
        note: 'Usar cristaloide isotónico tibio y reevaluar perfusión, PA y signos de sobrecarga.',
      },
      {
        name: 'Suero fisiológico 0.9% bolo alto',
        route: 'EV',
        dose_per_kg: 40,
        dose_label: '40 mL/kg',
        unit: 'mL',
        indication: 'Rango superior descrito por protocolo',
        note: 'Evitar exceso de fluidos por riesgo de empeorar edema cerebral.',
      },
      {
        name: 'Fenitoína carga estimada',
        route: 'EV',
        dose_per_kg: 18,
        dose_label: '18 mg/kg; no exceder 50 mg/min',
        unit: 'mg',
        max_dose: 1000,
        indication: 'Convulsión posterior a benzodiacepina',
        note: 'El documento ejemplifica fenitoína 1 g en 1 L de SS 0.9%. Vigilar PA, ECG y compatibilidad.',
      },
    ],
    footer: 'La calculadora no reemplaza prescripción médica ni revisión de concentración/presentación disponible. En adultos, varias indicaciones del protocolo son dosis fijas o por criterio clínico.',
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-farmacos-locales',
    type: 'flowchart',
    tab: 'tec_adulto_farmacos',
    color: 'red',
    order: 9,
    title: 'Fármacos disponibles o mencionados para manejo local',
    description: 'Consolidado único para evitar repetir farmacoterapia en distintas pestañas.',
    details: [
      'Convulsión en reanimador → benzodiacepina como primera elección; ejemplo local: lorazepam 4 mg EV.',
      'Anticonvulsivante de mayor duración → fenitoína; ejemplo local: 1 g en 1 L SS 0.9%, a 18 mg/kg/hora EV, velocidad no mayor a 50 mg/min.',
      'Hemorragia/trauma con indicación → ácido tranexámico 1 g EV en los primeros 10 minutos, luego 1 g EV en BIC durante 8 horas.',
      'Fluidos → preferir SS 0.9% tibio en bolos de 20-40 mL/kg cuando no se cumplen objetivos de perfusión y PA.',
      'Vasoactivos disponibles → dopamina y noradrenalina; en infusión continua, preferir noradrenalina según protocolo.',
      'Pretratamiento SRI disponible → fentanilo o lidocaína para disminuir respuesta adrenérgica cuando corresponda.',
      'Inducción SRI → el protocolo menciona propofol, ketamina y etomidato; etomidato figura como opción disponible en realidad local.',
      'Bloqueo neuromuscular → succinilcolina o rocuronio como BNM de latencia corta; confirmar stock antes de indicar.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-derivacion-local',
    type: 'flowchart',
    tab: 'tec_adulto_derivacion',
    color: 'blue',
    order: 10,
    title: 'Flujo local de derivación',
    description: 'Basado en el término de procedimiento HCSFB 130.',
    details: [
      'Centro derivador → Hospital Clínico Herminda Martín para evaluación/TC y manejo de mayor complejidad según disponibilidad y red.',
      'TEC moderado o grave → activar Ley de Urgencia y coordinar derivación a centro de mayor complejidad.',
      'Paciente estable → HCSFB cuenta con 2 móviles básicos con chofer y TENS para traslado.',
      'Paciente inestable → contactar SAMU y solicitar móvil avanzado.',
      'Caso de extrema gravedad → si el móvil avanzado no está disponible o el tiempo de llegada amenaza la vida, médico jefe de turno puede autorizar medicalización de ambulancia básica según protocolo de transporte de pacientes.',
      'Móvil básico sugerido → GCS 13-15, sin manejo avanzado de vía aérea, sin caída progresiva de GCS, hemodinámicamente estable y sin requerimiento de DVA.',
      'Móvil avanzado → casos que no cumplen criterios de móvil básico, incluyendo necesidad de vía aérea avanzada, DVA, inestabilidad o deterioro neurológico.',
      'Cierre del procedimiento → paciente con TEC leve entregado por TENS de traslado en HCHM, o TEC moderado/grave entregado a SAMU para traslado a centro de referencia.',
    ],
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-mermaid-inicial',
    type: 'mermaid',
    tab: 'tec_adulto_flujogramas',
    order: 20,
    title: 'Flujo inicial del paciente con trauma en cráneo',
    description: 'Desde admisión hasta la primera decisión clínica.',
    content: `flowchart TD
    A([Trauma en cráneo adulto]) --> B{¿Paciente crítico o inestable?}
    B -->|Sí| C[Ingreso directo a reanimador]
    B -->|No| D[Inscripción en admisión]
    C --> E[Triage por enfermería/TENS]
    D --> E
    E --> F{Categoría C1-C2?}
    F -->|Sí| G[Box de reanimación inmediato]
    F -->|No| H{Categoría C3?}
    H -->|Sí| I[Comunicar a médico de turno]
    H -->|No: C4| J[Espera con reevaluación si cambia condición]
    G --> K[Evaluación médica ABCDE + GCS + pupilas + factores de riesgo]
    I --> K
    J --> K`,
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-mermaid-decision',
    type: 'mermaid',
    tab: 'tec_adulto_flujogramas',
    order: 21,
    title: 'Decisión clínica: alta, observación o derivación',
    description: 'Integra GCS, factores de riesgo y disponibilidad local de imagen.',
    content: `flowchart TD
    A[Evaluación ABCDE completa] --> B[Calcular GCS tras reanimación]
    B --> C{GCS 14 o menor?}
    C -->|Sí| D[Derivar para TC/centro de mayor complejidad]
    C -->|No: GCS 15| E{¿Factores de riesgo?}
    E -->|Sí| D
    E -->|No| F[Observación al menos 2 h desde el evento + GCS seriado]
    F --> G{¿Deterioro, cefalea progresiva, vómitos, convulsión o focalidad?}
    G -->|Sí| D
    G -->|No| H{¿Puede cumplir observación y tiene red?}
    H -->|Sí| I[Alta educada + hoja signos de alarma]
    H -->|No| J[Prolongar observación o derivar según criterio médico]
    D --> K[Activar Ley de Urgencia si TEC moderado/grave]`,
    layout_position: 'main',
  },
  {
    id: 'tec-adulto-v1-mermaid-neuroproteccion',
    type: 'mermaid',
    tab: 'tec_adulto_flujogramas',
    order: 22,
    title: 'Neuroprotección y traslado seguro',
    description: 'Resumen de preparación del TEC moderado/grave antes del traslado.',
    content: `flowchart TD
    A[TEC moderado/grave o sospecha HTIC] --> B[ABCDE + cabecera 30 grados + collar cervical]
    B --> C[Oxígeno: SatO2 >92-94%]
    C --> D[Ventilación: PaCO2 35-45 o ETCO2 30-35]
    D --> E[PA según edad: evitar hipotensión]
    E --> F[HGT: 80-180 mg/dL y normotermia]
    F --> G{¿Convulsión?}
    G -->|Sí| H[Lorazepam EV y fenitoína según protocolo]
    G -->|No| I{¿Hemorragia/trauma con indicación?}
    H --> I
    I -->|Sí| J[Ácido tranexámico 1 g EV + 1 g/8 h]
    I -->|No| K[Coordinar centro derivador]
    J --> K
    K --> L{¿Estable, GCS 13-15, sin VA avanzada ni DVA?}
    L -->|Sí| M[Móvil básico HCSFB]
    L -->|No| N[SAMU / móvil avanzado]`,
    layout_position: 'main',
  },
];

const metadata = {
  has_local_protocol: true,
  protocol_code: 'HCSFB 130',
  protocol_edition: 'Primera',
  protocol_date: 'Abril 2025',
  protocol_validity: 'Abril 2030',
  protocol_objective: 'Estandarizar el diagnóstico, seguimiento, educación, manejo inicial y derivación del traumatismo craneoencefálico adulto en urgencias del HCSFB Bulnes.',
  protocol_file_url: PROTOCOL_URL,
  clinical_summary: 'TEC adulto en urgencias HCSFB: triage por gravedad, ABCDE, GCS post reanimación, búsqueda de factores de riesgo, decisión de observación/alta o derivación para TC y manejo de mayor complejidad.',
  diagnostic_orientation: 'Clasificar por GCS: leve 14-15, moderado 9-13 y severo 3-8. Derivar para neuroimagen si GCS 14 o menor, GCS 15 con factores de riesgo o anisocoria mayor a 2 mm con midriasis unilateral.',
  complementary_studies: 'Radiografía de cráneo AP, lateral y Towne solo como recurso local básico en GCS 15 sin factores de riesgo. TC de cerebro requiere derivación a centro de mayor complejidad.',
  initial_treatment: 'ABCDE del trauma, neuroprotección, cabecera 30 grados, inmovilización cervical, normoxia, normocarbia, normotermia, metas de PAS por edad, glicemia 80-180 mg/dL, SS 0.9% tibio si hipoperfusión y manejo de convulsión/hemorragia según protocolo.',
  protocol_medications: [],
  last_updated: new Date().toISOString(),
};

const { data: topic, error: readError } = await supabase
  .from('topics')
  .select('id,name,content_blocks')
  .eq('id', TOPIC_ID)
  .single();

if (readError) {
  console.error('Error leyendo topic:', readError);
  process.exit(1);
}

console.log(`Topic: ${topic.name}`);
console.log(`Bloques actuales: ${(topic.content_blocks || []).length}`);
console.log(`Bloques nuevos: ${blocks.length}`);

if (!APPLY) {
  console.log('Dry-run. Ejecuta con --apply para actualizar Supabase.');
  process.exit(0);
}

const { error: updateError } = await supabase
  .from('topics')
  .update({
    ...metadata,
    content_blocks: blocks,
  })
  .eq('id', TOPIC_ID);

if (updateError) {
  console.error('Error actualizando topic:', updateError);
  process.exit(1);
}

console.log('Protocolo TEC adulto actualizado correctamente.');
