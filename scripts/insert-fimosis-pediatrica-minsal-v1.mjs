/**
 * Orientación Técnica para el Manejo de la Fimosis Pediátrica — MINSAL 2025.
 * Documento nacional (Res. Exenta 142 / 2025), no protocolo local HCSFB.
 * Categoría: Policlínico · Subcategoría: Pediatría · Etiqueta: "ordinario minsal".
 *
 * Sigue el axioma: bloques con tab, separadores ━━━ SECCIÓN ━━━,
 * sin emojis decorativos, sin viñetas en items, autores en protocol_authors,
 * contenido operativo completo (ejecutable sin abrir el PDF).
 *
 * Uso:
 *   node --env-file=.env scripts/insert-fimosis-pediatrica-minsal-v1.mjs
 *   node --env-file=.env scripts/insert-fimosis-pediatrica-minsal-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const APPLY = process.argv.includes('--apply');
const CATEGORY_ID = '696ea6ff245ef362de4f431e'; // Policlínico
const TODAY = new Date().toISOString();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL      || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPIC = {
  id: randomUUID(),
  name: 'Manejo de la Fimosis Pediátrica',
  category_id: CATEGORY_ID,
  subcategory: 'Pediatría',
  status: 'published',
  // Orientación Técnica nacional MINSAL, no protocolo local HCSFB → no lleva el
  // badge "Protocolo Local". Las pestañas se renderizan por el campo `tab` de cada
  // bloque (hasTabs), independiente de este flag. La insignia "Ordinario MINSAL"
  // se deriva del tag homónimo (ver hasMinsalOrdinarioBadge en topicStatus.ts).
  has_local_protocol: false,
  tipo_contenido: ['protocolo'],
  tags: [
    'ordinario minsal',
    'MINSAL',
    'fimosis',
    'pediatría',
    'prepucio',
    'corticoides tópicos',
    'betametasona',
    'circuncisión',
    'parafimosis',
    'balanitis',
    'BXO',
    'derivación',
    'urología pediátrica',
    'cirugía pediátrica',
    'policlínico',
  ],
  protocol_code: 'Res. Ex. 142 / 2025 — MINSAL',
  protocol_edition: '2025',
  protocol_date: '2025',
  protocol_validity: 'Vigente (Orientación Técnica nacional MINSAL)',
  protocol_file_url: '',
  protocol_objective: 'Mejorar el diagnóstico y estandarizar el manejo de la fimosis en niños de la red pública de salud en Chile, asegurando un abordaje basado en la mejor evidencia disponible y criterios homogéneos a nivel nacional según el nivel de complejidad: definir criterios claros para tratamiento médico, quirúrgico y derivación; promover el uso racional de terapias conservadoras; y optimizar la pertinencia de la derivación a Cirugía Pediátrica.',
  description: 'Orientación Técnica MINSAL 2025 para el manejo de la fimosis pediátrica en la red asistencial: clasificación (fisiológica/asintomática/sintomática), tratamiento con corticoides tópicos, criterios de referencia y contrarreferencia, y educación a la familia. DIVAP / DIGERA, Subsecretaría de Redes Asistenciales.',
  protocol_authors: [
    { name: 'Dra. Francisca Yankovic Barceló', role: 'Elaboradora — Urólogo Pediatra, Hospital Exequiel González Cortés' },
    { name: 'Dr. José Manuel Campos Varas', role: 'Elaborador — Cirujano Pediátrico, Hospital Roberto del Río' },
    { name: 'Patricia Vega Cornejo', role: 'Revisora — Jefa Depto. Cuidados Integrales, DIVAP, MINSAL' },
    { name: 'Carolina Isla Meneses', role: 'Revisora — Jefa Depto. Gestión Ambulatoria y Apoyo Diagnóstico, DIGERA, MINSAL' },
    { name: 'Margarita Ramos Martínez', role: 'Revisora — Jefa Depto. Ciclo Vital, DIPRECE, MINSAL' },
    { name: 'Dr. Camilo Becerra Rodríguez', role: 'Revisor — Médico Familiar, DIVAP, MINSAL' },
    { name: 'Dr. Víctor Arancibia Vergara', role: 'Revisor — Médico de Familia, DIGERA, MINSAL' },
    { name: 'Solange Burgos Estrada', role: 'Revisora — Matrona, DIGERA, MINSAL' },
  ],
  content_blocks: [
    {
      id: 'fimo-definiciones',
      tab: 'fimo_protocolo',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Definiciones operativas',
      content: 'El diagnóstico de adherencias balanoprepuciales, fimosis y parafimosis se realiza únicamente mediante la exploración física.',
      items: [
        'Fimosis: no retracción del prepucio por debajo del glande en niños.',
        'Fimosis patológica: la no retracción se asocia a cicatrices, infecciones recurrentes o síntomas que afectan el bienestar y la salud del niño.',
        'Balanitis xerótica obliterante (BXO): enfermedad inflamatoria crónica de la piel del prepucio (Liquen Sclerosus); puede causar blanqueamiento, adelgazamiento y cicatrices fibrosas de piel, meato y/o uretra. Diagnóstico histopatológico; el examen del prepucio resecado se justifica por las consecuencias para el seguimiento.',
        'Balanopostitis: infección del glande y/o del prepucio.',
        'Balonamiento: la orina queda atrapada bajo el prepucio no retráctil durante la micción, inflándolo. Puede ser parte del desarrollo normal.',
        'Parafimosis: condición urgente; el prepucio retráctil queda retraído detrás del glande y lo constriñe, impidiendo que vuelva a su posición normal.',
        'Esmegma y adherencias balanoprepuciales: fenómenos normales del desarrollo; no son criterio de derivación.',
        'Circuncisión: procedimiento quirúrgico de remoción total o parcial del prepucio.',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-clasificacion',
      tab: 'fimo_protocolo',
      type: 'criteria',
      color: 'indigo',
      order: 2,
      title: 'Clasificación inicial para la toma de decisiones',
      content: 'La imposibilidad de retraer el prepucio en la infancia es habitualmente fisiológica: al nacer <4% tiene prepucio retráctil y el porcentaje aumenta con la edad. Más del 95% logra retracción normal antes de los 15 años sin tratamiento. La clasificación guía el plan de manejo.',
      items: [
        '━━━ Fimosis fisiológica ━━━',
        'No retractilidad normal del lactante y niño pequeño por adherencias naturales entre epitelio prepucial y glande, que se separan gradualmente con el tiempo. No se asocia a cicatrices, inflamación ni síntomas. Hallazgo normal.',
        '━━━ Fimosis asintomática ━━━',
        'Prepucio no retráctil, pero sin morbilidad asociada (sin dolor, infección ni dificultad urinaria).',
        '━━━ Fimosis sintomática ━━━',
        'No retracción asociada a síntomas (dolor, dificultad para orinar, infección, adherencias) o complicaciones. Indica necesidad de manejo farmacológico o quirúrgico.',
        '━━━ Indagar en todo niño con sospecha ━━━',
        'Edad de inicio, síntomas asociados a la queja, grado de retracción, antecedente de balanitis previas, alteraciones de la micción, episodios de retención aguda de orina e infecciones del tracto urinario.',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-asintomatica',
      tab: 'fimo_protocolo',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Manejo de la fimosis asintomática',
      content: 'Directrices basadas en la mejor evidencia para todo paciente con fimosis asintomática.',
      items: [
        'No requiere derivación: la fimosis es parte normal del desarrollo y el prepucio suele volverse retráctil al crecer.',
        'No requiere exámenes ni seguimiento.',
        'No se indica retracción forzada: puede causar desgarros y cicatrices que deriven en fimosis patológica.',
        'Educación a cuidadores y al niño sobre la evolución fisiológica, para evitar preocupaciones y consultas especializadas sin indicación clínica.',
        'Esmegma y adherencias balanoprepuciales son normales: no son criterio de derivación.',
        '━━━ Desde los 6 años (aun asintomáticos) ━━━',
        'Existen razones válidas para explorar manejo médico: mayor probabilidad de fimosis patológica con la edad, mayor riesgo de complicaciones quirúrgicas en adolescentes e impacto de la cirugía tardía en la imagen corporal.',
        'Se puede ofrecer corticoide tópico hasta por 3 ciclos antes de considerar la derivación a Cirugía Pediátrica.',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-retraccion-forzada',
      tab: 'fimo_protocolo',
      type: 'alert',
      color: 'red',
      order: 4,
      title: 'No realizar retracción forzada',
      content: 'La retracción forzada del prepucio puede causar desgarros y cicatrices que conduzcan a una fimosis patológica. Permitir la evolución natural salvo complicaciones o signos de molestia/infección.',
      layout_position: 'main',
    },
    {
      id: 'fimo-corticoides',
      tab: 'fimo_protocolo',
      type: 'flowchart',
      color: 'blue',
      order: 5,
      title: 'Tratamiento con corticoides tópicos',
      content: 'En fimosis sintomática, antes de indicar referencia para eventual cirugía, iniciar corticoides tópicos. La evidencia (revisión Cochrane reciente y múltiples estudios) muestra aumento significativo de resolución completa o parcial vs placebo, alta eficacia en todos los grupos etarios y grados, y baja frecuencia de efectos adversos.',
      details: [
        '━━━ Esquema de aplicación ━━━',
        'Betametasona 0,05% en crema, aplicada por los cuidadores directamente sobre la zona estenótica del prepucio, dos veces al día durante 4 a 8 semanas (recomendación de experto: indicar ciclos de 8 semanas).',
        'Alternativas de igual frecuencia y duración por ciclo: hidrocortisona 1% y clobetasol 0,05%. Cualquier corticoide tópico sirve; estos tres son los de mayor efectividad.',
        '━━━ Retracción concomitante ━━━',
        'Durante y después de la aplicación, alentar la retracción gentil del prepucio siempre que no cause dolor ni molestias.',
        '━━━ Repetición ━━━',
        'El tratamiento puede repetirse hasta 3 veces (3 ciclos) antes de considerar la derivación.',
        '━━━ Resultados ━━━',
        'Resuelve: alta.',
        'No resuelve pero queda asintomático (prepucio no retráctil): volver al manejo de usuarios asintomáticos.',
        'No resuelve y persiste sintomático: derivar a Cirugía / Urología Pediátrica para evaluación.',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-referencia',
      tab: 'fimo_derivacion',
      type: 'criteria',
      color: 'red',
      order: 1,
      title: 'Criterios de referencia a especialidad',
      content: 'El/la médico/a del primer nivel realiza derivación priorizada a Cirugía / Urología Pediátrica en usuarios que presentan:',
      items: [
        'Fimosis asintomática en niños mayores de 6 años tratados al menos dos veces con corticoides tópicos, sin respuesta o con recidiva de la fimosis.',
        'Balanitis recurrente que, tras uso de corticoide tópico, no obtuvo respuesta.',
        'Fimosis con sospecha o confirmación de malformación urogenital o infección urinaria recurrente.',
        'Niños con fimosis cicatricial o Balanitis Xerótica Obliterante (BXO).',
        'Parafimosis (condición urgente).',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-contrarreferencia',
      tab: 'fimo_derivacion',
      type: 'criteria',
      color: 'green',
      order: 2,
      title: 'Criterios de contrarreferencia a APS',
      content: 'La decisión clínica de observar, indicar tratamiento médico o proceder a cirugía corresponde al/la cirujano/a pediátrico/a tratante, en coordinación con la familia y según protocolos locales del recinto.',
      items: [
        'Todo usuario que no presente fimosis o cuya fimosis no sea de resolución quirúrgica.',
        'Usuarios ya tratados quirúrgicamente y con criterio de alta quirúrgica de su patología, para manejo en el primer nivel de atención.',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-subproceso',
      tab: 'fimo_derivacion',
      type: 'text',
      color: 'slate',
      order: 3,
      title: 'Subproceso clínico y plazos',
      content: `El subproceso clínico debe desarrollarse idealmente en menos de 8 semanas desde la primera evaluación clínica hasta la resolución o derivación, considerando seguimiento y educación parental. Las decisiones deben ser clínicas, documentadas y bajo criterios consensuados en la red.

En caso de dudas o persistencia del cuadro, el paciente puede ser derivado nuevamente desde APS al servicio de cirugía. El equipo de cirugía pediátrica evalúa, según priorización, cada caso derivado, conforme a los flujos de derivación y contrarreferencia vigentes en la red asistencial.`,
      layout_position: 'main',
    },
    {
      id: 'fimo-mermaid',
      tab: 'fimo_flujograma',
      type: 'mermaid',
      order: 1,
      title: 'Algoritmo de manejo de la fimosis pediátrica',
      content: 'flowchart TD\n    A(["Fimosis"]) --> B{"¿Asintomática o<br/>sintomática?"}\n    B -->|"Asintomática"| C{"¿Edad?"}\n    C -->|"< 6 años"| D["Educar · No derivar<br/>No exámenes · No seguimiento<br/>No retracción forzada"]\n    C -->|"≥ 6 años"| E["Corticoide tópico<br/>repetir hasta 3 ciclos"]\n    B -->|"Sintomática"| F{"Tipo de cuadro"}\n    F -->|"Balanitis · ardor<br/>irritación · otros síntomas"| E\n    F -->|"Parafimosis · sospecha BXO<br/>ITU recurrente o malformación urogenital"| G["Derivar a Cirugía /<br/>Urología Pediátrica"]\n    E --> H{"Resultado"}\n    H -->|"Resuelve"| I(["Alta"])\n    H -->|"No resuelve<br/>asintomático"| J["Continuar manejo<br/>de asintomáticos"]\n    H -->|"No resuelve<br/>sintomático"| G',
      layout_position: 'main',
    },
    {
      id: 'fimo-edu-familia',
      tab: 'fimo_educacion',
      type: 'criteria',
      color: 'teal',
      order: 1,
      title: 'Educación a la familia — usuarios asintomáticos (Anexo 1)',
      content: 'La fimosis es muy común en niños y no necesariamente una enfermedad; en la mayoría se resuelve espontáneamente con el crecimiento (más del 95% retracción normal antes de los 15 años). Alternativas de manejo: observación, crema con corticoide o cirugía.',
      items: [
        'No es necesario hacer exámenes ni consultar a especialistas si no hay molestias.',
        'No se debe forzar la retracción del prepucio: puede causar lesiones.',
        'Es normal la presencia de esmegma (sustancia blanca) y de adherencias entre el glande y el prepucio.',
        'El balonamiento al orinar (inflado del prepucio) también puede ser parte del desarrollo normal.',
        'Observación: no se realiza tratamiento; alternativa segura si no hay síntomas ni complicaciones.',
        'Crema con betametasona 0,05%: dos veces al día por dos meses; efectiva en cerca de la mitad de los casos; primera línea ante algunos síntomas; indolora y se aplica en casa.',
        'Cirugía (circuncisión): la indica el/la cirujano/a ante persistencia de síntomas tras la crema o en circunstancias especiales; con anestesia general; riesgo de complicaciones bajo (alrededor de 1 de cada 100).',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-edu-corticoide',
      tab: 'fimo_educacion',
      type: 'flowchart',
      color: 'blue',
      order: 2,
      title: 'Cómo aplicar el corticoide tópico (Anexo 2)',
      content: 'Crema con corticoide (betametasona, clobetasol o hidrocortisona), dos veces al día, todos los días durante 2 meses. Es común que el niño se resista al principio; con paciencia y constancia la mayoría se acostumbra después de dos semanas.',
      details: [
        'Asear y secar el pene cuidadosamente. Puede usarse solo agua y una toalla limpia.',
        'Retracción suave del prepucio: tirar la piel lentamente hacia atrás hasta identificar la zona estrecha. No debe causar dolor ni sangrado.',
        'Aplicar el medicamento: una cantidad pequeña (como una lenteja) directamente sobre la zona estrecha, cubriéndola bien. No importa si parte de la crema toca el glande.',
        'Volver el prepucio a su lugar, tirándolo nuevamente hacia adelante.',
      ],
      layout_position: 'main',
    },
    {
      id: 'fimo-edu-advertencias',
      tab: 'fimo_educacion',
      type: 'criteria',
      color: 'amber',
      order: 3,
      title: 'Mantención y seguridad de los corticoides (Anexo 2)',
      content: 'Indicaciones para entregar a los cuidadores tras finalizar el tratamiento.',
      items: [
        'Mantener la retracción: tras finalizar el tratamiento, continuar la retracción suave diaria, idealmente al orinar y al bañarse, para mantener el prepucio abierto incluso sin crema. Inicialmente la realizan los cuidadores y progresivamente la asume el paciente según su edad.',
        'Seguridad: los efectos adversos que aparecen al buscar "corticoides" se asocian a pastillas o inyecciones; aquí el medicamento se usa en dosis muy baja (0,05%) y tópica, con absorción mínima.',
        'El único efecto adverso reportado es una posible irritación local, infrecuente, que suele resolverse al suspender la aplicación por algunos días.',
      ],
      layout_position: 'main',
    },
  ],
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  Fimosis Pediátrica MINSAL 2025 — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const tabs = TOPIC.content_blocks.reduce((acc, block) => {
  acc[block.tab] = (acc[block.tab] || 0) + 1;
  return acc;
}, {});

Object.entries(tabs).forEach(([tab, count]) => console.log(`  ${tab.padEnd(18)} ${count} bloque(s)`));
console.log(`\n  Total bloques: ${TOPIC.content_blocks.length}`);
console.log(`  Autores: ${TOPIC.protocol_authors.length}`);
console.log(`  Categoría: Policlínico · Subcategoría: ${TOPIC.subcategory}`);
console.log(`  ID nuevo: ${TOPIC.id}\n`);

let warnings = 0;
for (const block of TOPIC.content_blocks) {
  if (!block.tab) {
    console.warn(`WARN: bloque ${block.id} sin tab`);
    warnings++;
  }
}

const { data: existing, error: findError } = await supabase
  .from('topics')
  .select('id,name,protocol_code')
  .eq('protocol_code', TOPIC.protocol_code);

if (findError) {
  console.error(`Error verificando duplicados: ${findError.message}`);
  process.exit(1);
}

if (existing?.length) {
  console.error('ERROR: ya existe un topic con ese protocol_code:');
  existing.forEach((topic) => console.error(`  ${topic.id} — ${topic.name}`));
  process.exit(1);
}

if (!APPLY) {
  console.log(`Modo dry-run OK (${warnings} warning(s)). Agrega --apply para escribir.\n`);
  process.exit(0);
}

const payload = {
  ...TOPIC,
  published_date: TODAY.slice(0, 10),
  last_updated: TODAY,
};

const { error } = await supabase.from('topics').insert(payload);
if (error) {
  console.error(`\nERROR insertando Fimosis Pediátrica: ${error.message}\n`);
  process.exit(1);
}

console.log(`Insertado correctamente: ${TOPIC.id}`);
console.log(`Bloques: ${TOPIC.content_blocks.length} | Tabs: ${Object.keys(tabs).length}\n`);
