/**
 * GCL 3.2-3 — Protocolo Manejo de Brote Epidémico en HCSFB.
 * Edición Segunda, Junio 2026, Vigencia Junio 2031.
 *
 * Sigue el axioma: bloques con tab, separadores ━━━ SECCIÓN ━━━,
 * autores en protocol_authors, contenido operativo completo y consistente.
 *
 * Uso:
 *   node --env-file=.env scripts/insert-brote-epidemico-hcsfb-v1.mjs
 *   node --env-file=.env scripts/insert-brote-epidemico-hcsfb-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const APPLY = process.argv.includes('--apply');
const CATEGORY_ID = '696ea6ff245ef362de4f431d'; // Hospitalizados
const ISOLATION_TOPIC_ID = '870238a5-3f41-4e46-ba26-a88396d85cb3'; // GCL 3.3.2
const TODAY = new Date().toISOString();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPIC = {
  id: randomUUID(),
  name: 'Manejo de Brote Epidémico en el HCSFB',
  category_id: CATEGORY_ID,
  subcategory: 'Seguridad del Paciente',
  status: 'published',
  has_local_protocol: true,
  tipo_contenido: ['protocolo'],
  tags: [
    'brote epidémico',
    'IAAS',
    'epidemiología',
    'SICARS',
    'aislamiento',
    'vigilancia activa',
    'seguridad del paciente',
    'HCSFB',
  ],
  protocol_code: 'GCL 3.2-3',
  protocol_edition: 'Segunda',
  protocol_date: 'Junio 2026',
  protocol_validity: 'Junio 2031',
  protocol_file_url: '',
  protocol_objective: 'Establecer lineamientos para el manejo de brotes que puedan generarse dentro del Hospital Comunitario de Salud Familiar de Bulnes, con el fin de controlar y prevenir brotes epidémicos mediante la supervisión del cumplimiento de medidas de contención.',
  description: 'Protocolo local para detección, notificación, investigación, manejo, cierre e informe de brotes epidémicos asociados a IAAS en el HCSFB.',
  protocol_authors: [
    { name: 'Dra. Daniella Sbarbaro Arias', role: 'Elaboradora — Médica Encargada PCI HCSFB' },
    { name: 'María Teresa Medina Bravo', role: 'Elaboradora — EU Asesora estratégica OCYSP HCSFB' },
    { name: 'Fernando Cáceres Polanco', role: 'Elaborador — EU Encargado Epidemiología HCSFB' },
    { name: 'Cecilia Monsalve Ávila', role: 'Revisora — EU Encargada IAAS HCSFB' },
    { name: 'Carmen Gloria Gutiérrez', role: 'V° Bueno — Oficina de Calidad y Seguridad del Paciente HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos', role: 'Aprobador — Director HCSFB' },
  ],
  related_topics: [
    {
      topic_id: ISOLATION_TOPIC_ID,
      label: 'GCL 3.3.2 — Aislamiento de Pacientes: precauciones según vía de transmisión',
    },
  ],
  content_blocks: [
    {
      id: 'brote-objetivo-alcance',
      tab: 'brote_protocolo',
      type: 'text',
      color: 'blue',
      order: 1,
      title: 'Objetivo, alcance y activación',
      content: `### Objetivo general
Establecer lineamientos para el manejo de brotes que puedan generarse dentro del Hospital Comunitario de Salud Familiar de Bulnes, a fin de controlar y prevenir brotes epidémicos mediante supervisión del cumplimiento de medidas de contención.

### Objetivos específicos
- Identificar aumento en la incidencia de casos.
- Identificar brotes epidémicos.
- Identificar factores de riesgo.
- Determinar el manejo y estudio de brotes.
- Caracterizar oportunamente un problema.

### Alcance
Aplica al nivel directivo, servicios de atención clínica abierta y cerrada, servicios de apoyo clínico y administrativo, alumnos de carreras de la salud, pacientes, acompañantes y visitas. Fuera del establecimiento requiere coordinación con Epidemiología SEREMI de Salud, IAAS del Servicio de Salud Ñuble, Programa de Control de Infecciones MINSAL y otros establecimientos de la red cuando corresponda.

### Activación inmediata
Ante sospecha de brote epidémico se activa el protocolo cuando exista incremento de un agente patógeno, microorganismos similares en un corto periodo de tiempo y espacio, aumento de IAAS asociadas a procedimiento invasivo, aumento de aislamientos de un microorganismo específico o detección de más de un caso de un microorganismo no identificado previamente.`,
      layout_position: 'main',
    },
    {
      id: 'brote-responsables',
      tab: 'brote_protocolo',
      type: 'criteria',
      color: 'slate',
      order: 2,
      title: 'Responsables de ejecución',
      content: 'Roles institucionales definidos para alerta, investigación, decisión, contención y seguimiento del brote.',
      items: [
        'Dirección del Hospital: conoce, participa en decisiones y apoya acciones/estrategias de IAAS y del Comité de contingencia cuando corresponda.',
        'Subdirección Médica: conoce, participa del Comité si se constituye y apoya acciones propuestas por IAAS.',
        'Subdirección de Gestión del Cuidado: lidera estrategias de gestión del cuidado orientadas a prevención y control del brote y participa del Comité.',
        'Equipo IAAS: alerta condición de brote, lidera investigación, analiza casos/factores de riesgo, recomienda medidas, coordina Comité, supervisa intervenciones y cumple requerimientos SICARS.',
        'Comité de contingencia brote: asesora técnicamente a directivos, vigila evolución, sesiona periódicamente y propone estrategias/medidas de control.',
        'Laboratorio Clínico: asesora técnicamente, colabora en diagnóstico, estudios moleculares/reservorios, envío de muestras, vigilancia, patógenos relevantes y mecanismos de resistencia.',
        'Abastecimiento: asegura disponibilidad de insumos para control del alerta o brote, como pecheras, jabón antiséptico, toalla desechable y guantes.',
        'Departamento de Calidad y Seguridad: conoce brotes y notifica si corresponde a organismos pertinentes.',
        'Jefes de Servicio: apoyan acciones dictadas, participan en investigación si el servicio está involucrado y elaboran plan de mejora acorde.',
        'Unidad de Epidemiología: participa en investigación o Comité, recolecta datos, supervisa notificación oportuna y actúa como nexo con SEREMI.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-definiciones-base',
      tab: 'brote_definiciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Definiciones operativas',
      content: 'Glosario mínimo para clasificar alerta, brote y seguimiento epidemiológico.',
      items: [
        'Aumento de incidencia de casos: aumento de casos en un periodo determinado que no excede el umbral de referencia definido.',
        'Brote epidémico: agrupación de casos relacionados en tiempo y espacio donde se sospeche causa infecciosa transmisible.',
        'Brote prolongado: brote epidémico de IAAS de más de 4 semanas (28 días) desde la fecha de conocimiento del caso índice.',
        'Caso índice: primer caso detectado en la comunidad con diagnóstico predefinido en el estudio de brote.',
        'Caso primario: caso que adquiere la enfermedad a partir de la fuente infectante.',
        'Contacto: paciente sin infección o colonización por el microorganismo involucrado que ha estado en contacto con caso confirmado.',
        'Endemia: número de casos esperados de una infección determinada en área geográfica definida y tiempo determinado.',
        'Reaparición de brote: nuevos casos atribuibles al mismo agente etiológico durante los 3 meses posteriores a la finalización del brote inicial.',
        'Repetición de brote: brote causado por agente o localización ya observado en el establecimiento después de tres meses de finalizado.',
        'Tasa de ataque: número de casos dividido por número de pacientes expuestos, multiplicado por 100.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-definiciones-especificas',
      tab: 'brote_definiciones',
      type: 'criteria',
      color: 'amber',
      order: 2,
      title: 'Definiciones específicas de brote',
      content: 'Umbrales señalados en el protocolo para síndromes y agentes seleccionados.',
      items: [
        '━━━ Gastrointestinal en lactantes ━━━',
        'Doble del promedio semanal de casos institucionales calculado para semanas sin brote durante el año anterior en Pediatría y/o Ginecología-Obstetricia, por E. coli enteropatógena, enterotoxigénica, enterohemorrágica, Salmonella, Shigella, Rotavirus u otros identificados.',
        'Si el promedio semanal del año anterior fue cero: 2 o más casos con nexo epidemiológico o mismo patógeno confirmado en 1 semana.',
        '━━━ Clostridioides difficile en adultos médico-quirúrgicos ━━━',
        'Doble del promedio semanal esperado o endemia de casos institucionales calculado para semanas sin brote, observado en dos semanas epidemiológicas consecutivas.',
        '━━━ SARS-CoV-2 en adultos no UPC y pediátricos hospitalizados ━━━',
        '3 o más casos con nexo epidemiológico, identificando al menos un paciente entre ellos como caso índice, primario o secundario. Finaliza tras 10 días sin casos nuevos.',
        '━━━ Infección respiratoria viral en lactantes ━━━',
        '3 o más casos por el mismo virus respiratorio, con nexo epidemiológico y sintomatología respiratoria de inicio intrahospitalario, en el periodo de 1 semana.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-notificacion-datos',
      tab: 'brote_estudio',
      type: 'criteria',
      color: 'red',
      order: 1,
      title: 'Notificación y datos mínimos del estudio',
      content: 'Todo estudio de brote epidémico debe notificarse inmediatamente a la Autoridad Sanitaria Regional (SEREMI).',
      items: [
        'La notificación inmediata la realiza el Enfermero Encargado de Epidemiología mediante correo electrónico oficial y la plataforma requerida según el caso.',
        'El equipo clínico debe notificar directa e inmediatamente al Médico referente IAAS y Enfermero referente de Epidemiología ante incremento de síndrome concordante o detección de agente patógeno.',
        'Ante cultivos positivos debe realizarse antibiograma para identificar microorganismos con resistencia antimicrobiana.',
        'El estudio y manejo deben iniciarse lo antes posible, recolectando información del Anexo 1 Formulario para estudio de brote epidémico.',
        'Se cita a Comité IAAS a reunión extraordinaria para revisar el estudio del brote y acordar acciones correctivas y preventivas.',
        'Datos mínimos: responsables y contactos; definición de caso; número de expuestos; fallecidos; unidades afectadas; tipo de infección/síntomas; agente sospechoso o identificado; fecha del caso índice e inicio de investigación; factores de riesgo; medidas adoptadas; cultivos; controles ambientales si procede.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-etapas-investigacion',
      tab: 'brote_estudio',
      type: 'flowchart',
      color: 'blue',
      order: 2,
      title: 'Etapas del estudio de brote',
      content: 'Secuencia operativa para confirmar, caracterizar, intervenir, comprobar hipótesis y cerrar el brote.',
      details: [
        '━━━ 1. Verificar diagnóstico y confirmar brote ━━━',
        'Revisión bibliográfica: cuadro clínico, microorganismo, fuente/reservorio, vías de transmisión, periodo de incubación e información local actual/esperada.',
        '━━━ 2. Definir caso y estrategia de búsqueda ━━━',
        'Usar criterios clínicos, de laboratorio (cultivos informados por Tecnólogo/a Médico del PCI) y epidemiológicos.',
        'Caracterizar tiempo (curva epidémica), lugar (servicios involucrados, localizado o generalizado) y tipo de pacientes (edad, género, patología).',
        '━━━ 3. Describir el brote ━━━',
        'Identificar caso primario, caso índice, población expuesta, tasa de ataque y letalidad.',
        '━━━ 4. Formular hipótesis ━━━',
        'Analizar condiciones comunes de pacientes, procedimientos, ubicación, localización de infección, fuente de contagio y vía de transmisión.',
        '━━━ 5. Estudios adicionales si corresponde ━━━',
        'Caso-control, cohorte o estudio transversal; biología molecular si se requiere clonalidad de cepas aisladas.',
        '━━━ 6. Comprobar hipótesis ━━━',
        'Si resultados son coherentes: reforzar medidas. Si no son coherentes: revisar base de la hipótesis e intervenciones.',
        '━━━ 7. Control definitivo y cierre ━━━',
        'Reforzar, modificar, suprimir o incorporar medidas; emitir informe y cierre en SICARS cuando IAAS defina brote controlado.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-mermaid',
      tab: 'brote_estudio',
      type: 'mermaid',
      order: 3,
      title: 'Flujo general de manejo de brote GCL 3.2-3',
      content: 'flowchart TD\n    A(["Sospecha de brote<br/>incremento de casos, síndrome o agente"]) --> B["Notificación inmediata<br/>Médico IAAS + Enfermero Epidemiología"]\n    B --> C["Notificar a SEREMI<br/>correo oficial / plataforma según caso"]\n    B --> D["Recolectar datos Anexo 1<br/>definición de caso, expuestos, unidades, cultivos"]\n    D --> E{"¿Cumple criterio<br/>de brote?"}\n    E -->|"No"| F["Vigilancia activa<br/>seguir tendencia y registrar"]\n    E -->|"Sí"| G["Reunión extraordinaria<br/>Comité IAAS"]\n    G --> H["Medidas inmediatas<br/>precauciones estándar, aislamiento, visitas, alumnos"]\n    H --> I["Investigación epidemiológica<br/>tiempo, lugar, persona, tasa de ataque"]\n    I --> J["Hipótesis<br/>fuente, vía, factores de riesgo"]\n    J --> K{"¿Medidas controlan<br/>el brote?"}\n    K -->|"Sí"| L["Informe final<br/>SICARS + medidas permanentes"]\n    K -->|"No"| M["Estudios adicionales<br/>caso-control, cohorte, biología molecular"]\n    M --> N["Ajustar medidas<br/>reforzar, modificar, suprimir o incorporar"]\n    N --> K\n    L --> O(["Cierre definido por IAAS<br/>según epidemiología y cese de casos"])',
      layout_position: 'main',
    },
    {
      id: 'brote-control-inmediato',
      tab: 'brote_medidas',
      type: 'criteria',
      color: 'red',
      order: 1,
      title: 'Medidas de control inmediatas',
      content: 'Reforzar cumplimiento de prácticas de atención desde la sospecha, antes de completar toda la investigación.',
      items: [
        '━━━ Precauciones estándar (GCL 3.3-1) ━━━',
        'Higiene de manos.',
        'Uso de barreras protectoras.',
        'Prevención de accidentes cortopunzantes.',
        'Higiene respiratoria y buenos hábitos al toser o estornudar.',
        'Manejo de equipos, desechos y ropa de pacientes.',
        '━━━ Aislamiento según vía de transmisión (GCL 3.3-2) ━━━',
        'Aislamiento por gotitas.',
        'Aislamiento por contacto directo.',
        'Aislamiento por vía aérea.',
        'Aislamiento protector.',
        '━━━ Control administrativo ━━━',
        'Restricción de visitas según evaluación del brote.',
        'Limitación y/o restricción del ingreso de alumnos.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-control-definitivo',
      tab: 'brote_medidas',
      type: 'flowchart',
      color: 'green',
      order: 2,
      title: 'Medidas definitivas, seguimiento y cierre',
      content: 'Las medidas definitivas se establecen según confirmación de hipótesis y evolución epidemiológica.',
      details: [
        'Medidas definitivas: reforzar medidas de intervención inicial.',
        'Medidas definitivas: modificar elementos de la intervención inicial.',
        'Medidas definitivas: suprimir elementos de la intervención inicial.',
        'Medidas definitivas: incorporar elementos no incluidos en la intervención inicial.',
        'Emitir informe semanal de evolución del brote para Comité IAAS, Comité de contingencia, MINSAL y Dirección de Servicio Ñuble vía SICARS.',
        'Elaborar propuestas de medidas y/o actividades para nivel directivo y servicios clínicos/administrativos involucrados.',
        'Elaborar y/o actualizar normativas locales si corresponde.',
        'Conformar Comité de contingencia brotes si corresponde según criterios definidos.',
        'IAAS define cuándo el brote está controlado considerando epidemiología del microorganismo, factores de riesgo y cese de casos nuevos.',
        'Al cierre: ingresar informe final vía SICARS y cesar funciones del Comité de contingencia si se constituyó, con acta correspondiente.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-informe-final',
      tab: 'brote_registros',
      type: 'criteria',
      color: 'purple',
      order: 1,
      title: 'Informe final de brote — contenidos mínimos',
      content: 'El informe final de brote asociado a IAAS debe quedar por escrito y cumplir mínimos definidos por Calidad y Seguridad del Paciente MINSAL.',
      items: [
        'Definición de caso.',
        'Agente infeccioso identificado.',
        'Tipos de infecciones y número de casos.',
        'Letalidad: casos fallecidos / casos totales.',
        'Auditoría de muerte en casos fallecidos: muerte atribuible a infección, muerte asociada o sin relación entre infección y muerte.',
        'Curva epidémica: gráfico de casos por semana desde el inicio del brote.',
        'Servicios afectados y tipo de pacientes, por ejemplo procedimientos determinados.',
        'Listado de causas probables del brote.',
        'Intervenciones realizadas para cada causa probable.',
        'Medidas permanentes establecidas como consecuencia del brote.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-registros-anexos',
      tab: 'brote_registros',
      type: 'criteria',
      color: 'slate',
      order: 2,
      title: 'Registros y anexos operativos',
      content: 'Documentos y formularios que sostienen trazabilidad del estudio y seguimiento.',
      items: [
        'Registros oficiales: ficha clínica, Formulario de Brote Epidémico, SICARS y pauta de vigilancia activa de IAAS.',
        'Anexo 1 — Formulario para estudio de brote epidémico: integrantes, agente etiológico, mecanismo de transmisión, datos de casos, factores de riesgo, fallecidos, fecha de caso índice, inicio de investigación, contactos, tasa de ataque, medidas generales/específicas, cultivos y controles ambientales posteriores a limpieza/desinfección.',
        'Anexo 1 — Datos de caso: nombre paciente, unidad, denominación de caso, análisis laboratorio, edad, diagnóstico, invasivos, ficha clínica, fecha ingreso, derivado desde, fecha egreso, inicio síntomas, periodo de incubación y cama.',
        'Anexo 1 — Factores de riesgo: inmunocompromiso severo, múltiples compromisos severos, aumento de tratamiento con antibióticos y medidas de prevención IAAS inefectivas.',
        'Anexo 1 — Vigilancia activa en pacientes con dependencia severa: registro diario desde instalación/retiro de catéter urinario permanente y signos de ITU.',
        'Anexo 2 — Consolidado mensual de vigilancia epidemiológica IAAS asociadas a CUP adultos HCSFB.',
        'Anexo 3 — Hoja de seguimiento de pacientes CUP IAAS HCSFB: continuidad del dispositivo, con registro I (instalación), T (retiro/egreso) y X por cada día con CUP.',
      ],
      layout_position: 'main',
    },
    {
      id: 'brote-referencias',
      tab: 'brote_registros',
      type: 'text',
      color: 'slate',
      order: 3,
      title: 'Documentación de referencia',
      content: `- Norma Técnica N°124 de Programas de Prevención y Control de IAAS, octubre 2011.
- Circular C13 N°1 sobre supervisión en prolongación, reaparición o repetición de brotes epidémicos de IAAS, Subsecretaría de Redes Asistenciales, enero 2015.
- Circular N°8 sobre notificación de brotes epidémicos de IIH, MINSAL, octubre 2006.
- Monsalve A. et al. Sistema de vigilancia de IAAS en pacientes hospitalizados del HCSFB, 3° edición, 2019.
- Subsecretaría de Redes Asistenciales, MINSAL Chile (2021). Sistema de Vigilancia Epidemiológica de IAAS. Circular C37 N°08.
- MINSAL (1998). Sistema de Vigilancia de las Infecciones Intrahospitalarias.
- Heymann D. (2008). Control of Communicable Diseases Manual, 19th ed. American Public Health Association.
- Circular N°3F/189. Manejo de brotes de infecciones gastrointestinales intrahospitalarias en servicios pediátricos, octubre 1987.
- Ordinario 2124. Instrucciones para estudio de brote IAAS en pandemia COVID-19, julio 2020.
- Circular N°30. Norma para manejo de brotes por diarreas por Clostridium difficile, septiembre 2023.`,
      layout_position: 'main',
    },
    {
      id: 'brote-ref-aislamiento',
      tab: 'brote_medidas',
      type: 'reference',
      order: 99,
      title: 'Ver también',
      reference_type: 'topic',
      reference_id: ISOLATION_TOPIC_ID,
      reference_label: 'GCL 3.3.2 — Aislamiento de Pacientes: precauciones por gotitas, contacto, vía aérea y protector',
      layout_position: 'main',
    },
  ],
};

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  GCL 3.2-3 — Brote Epidémico HCSFB — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const tabs = TOPIC.content_blocks.reduce((acc, block) => {
  acc[block.tab] = (acc[block.tab] || 0) + 1;
  return acc;
}, {});

Object.entries(tabs).forEach(([tab, count]) => console.log(`  ${tab.padEnd(22)} ${count} bloque(s)`));
console.log(`\n  Total bloques: ${TOPIC.content_blocks.length}`);
console.log(`  Autores: ${TOPIC.protocol_authors.length}`);
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
  console.error('ERROR: ya existe un topic con protocol_code GCL 3.2-3:');
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
  console.error(`\nERROR insertando GCL 3.2-3: ${error.message}\n`);
  process.exit(1);
}

console.log(`Insertado correctamente: ${TOPIC.id}`);
console.log(`Bloques: ${TOPIC.content_blocks.length} | Vigencia: ${TOPIC.protocol_validity}\n`);

const { data: isolationTopic, error: isolationFetchError } = await supabase
  .from('topics')
  .select('content_blocks')
  .eq('id', ISOLATION_TOPIC_ID)
  .single();

if (isolationFetchError) {
  console.error(`No se pudo leer GCL 3.3.2 para reference reverso: ${isolationFetchError.message}`);
  process.exit(1);
}

const reverseRefId = 'aisl-ref-brote-gcl323';
const currentBlocks = isolationTopic.content_blocks || [];
const hasReverseRef = currentBlocks.some((block) => block.id === reverseRefId || block.reference_id === TOPIC.id);

if (!hasReverseRef) {
  const reverseRef = {
    id: reverseRefId,
    tab: 'aisl_protocolo',
    type: 'reference',
    order: 99,
    title: 'Ver también',
    reference_type: 'topic',
    reference_id: TOPIC.id,
    reference_label: 'GCL 3.2-3 — Manejo de Brote Epidémico en HCSFB',
    layout_position: 'main',
  };

  const { error: reverseError } = await supabase
    .from('topics')
    .update({ content_blocks: [...currentBlocks, reverseRef], last_updated: TODAY })
    .eq('id', ISOLATION_TOPIC_ID);

  if (reverseError) {
    console.error(`No se pudo agregar reference reverso a GCL 3.3.2: ${reverseError.message}`);
    process.exit(1);
  }

  console.log('Reference reverso agregado en GCL 3.3.2 — Aislamiento de Pacientes.');
}
