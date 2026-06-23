/**
 * Crea/actualiza el protocolo HCSFB-118 Hospitalizacion Domiciliaria.
 *
 * Fuente: /Users/fernandoalvarado/Downloads/118. HODOM_0001.pdf
 *
 * Uso:
 *   node --env-file=.env scripts/insert-hodom-v1.mjs
 *   node --env-file=.env scripts/insert-hodom-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const CATEGORY_ID = '696ea6ff245ef362de4f431d'; // Hospitalizados
const TOPIC_NAME = 'Hospitalización Domiciliaria';
const LEGACY_TOPIC_NAME = 'Hospitalizacion Domiciliaria';
const PDF_PATH = '/Users/fernandoalvarado/Downloads/118. HODOM_0001.pdf';
const STORAGE_PATH = 'protocolos/hospitalizados/hcsfb-118-hospitalizacion-domiciliaria.pdf';
const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const content_blocks = [
  {
    id: 'hodom-resumen',
    type: 'text',
    tab: 'Resumen',
    color: 'blue',
    order: 10,
    title: 'Proposito y alcance',
    content:
      'La Hospitalizacion Domiciliaria (HODOM) es una modalidad sustitutiva de hospitalizacion convencional para usuarios de 15 anos o mas, con diagnostico definido, condicion clinica estable y necesidad de cuidados de complejidad equivalente a hospitalizacion basica. Aplica a usuarios derivados desde Servicios Clinicos HCSF Bulnes excepto Pediatria, Servicio de Urgencia, Programa de Atencion Domiciliaria de Personas con Dependencia Severa y Programa de Cuidados Paliativos Universales.',
    details: [
      'Objetivo: otorgar atencion integral en domicilio a pacientes en fase aguda, fin de vida o manejo proporcional de patologias agudas, favoreciendo continuidad, recuperacion clinica y uso eficiente de camas.',
      'No corresponde a seguimiento exclusivo de cronicos estables, consulta domiciliaria ambulatoria ni respuesta a problemas exclusivamente sociales sin requerimiento clinico.',
      'Permanencia habitual transitoria: hasta 10 dias, salvo excepciones justificadas por el equipo tratante.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-cartera',
    type: 'criteria',
    tab: 'Resumen',
    color: 'green',
    order: 20,
    title: 'Cartera de prestaciones',
    content: 'Prestaciones base disponibles en HODOM segun condicion clinica y factibilidad operativa.',
    items: [
      '2 visitas medicas: ingreso y egreso; visitas adicionales si se requiere reevaluacion medica.',
      'Atencion de enfermeria diaria.',
      'Kinesioterapia respiratoria y/o motora diaria segun indicacion medica.',
      'Tratamiento endovenoso segun arsenal farmacologico en posologia de 1 vez al dia; excepcionalmente cada 12 horas si existe factibilidad tecnica y cupo operativo.',
      'Controles de laboratorio seriados hasta cada 48 horas; excepcionalmente diarios si existe indicacion clinica justificada y factibilidad operativa.',
      'Curaciones simples o avanzadas, administracion de medicamentos EV/SC/IM, toma de examenes, manejo de accesos vasculares y dispositivos invasivos cuando esten dentro de cartera.',
      'Hospitalizacion por maximo 10 dias, con posibilidad de extension una sola vez hasta 10 dias adicionales tras reevaluacion integral y registro en ficha.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-inclusion',
    type: 'criteria',
    tab: 'Criterios',
    color: 'blue',
    order: 30,
    title: 'Criterios de inclusion',
    content: 'Deben cumplirse en su totalidad para ingreso a HODOM.',
    items: [
      'Ser beneficiario FONASA o PRAIS y pertenecer a la poblacion objetivo definida por el programa.',
      'Tener 15 anos o mas.',
      'Derivacion mediante indicacion medica desde Urgencia, Servicio Medico Quirurgico, Cuidados Paliativos Universales, Dependencia Severa u otro dispositivo autorizado.',
      'Diagnostico clinico definido, plan terapeutico establecido y objetivos clinicos abordables en domicilio.',
      'Hemodinamicamente estable, bajo riesgo de complicaciones inmediatas y sin requerimiento de monitorizacion continua.',
      'Requerir prestaciones incluidas en la cartera HODOM: tratamientos EV, curaciones, controles clinicos, rehabilitacion kinesica, seguimiento de parametros, fin de vida u otras factibles.',
      'Red de apoyo adecuada con cuidador responsable disponible 24 horas, capaz de colaborar y comprender indicaciones.',
      'Condiciones domiciliarias seguras: acceso para el equipo, condiciones sanitarias adecuadas y medios de comunicacion para contacto oportuno.',
      'Residencia dentro del area de cobertura definida y factibilidad tecnica/operativa.',
      'Aceptacion voluntaria de la modalidad mediante consentimiento informado del paciente o representante legal.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-exclusion',
    type: 'criteria',
    tab: 'Criterios',
    color: 'red',
    order: 40,
    title: 'Criterios de exclusion',
    content: 'No son candidatos quienes presenten una o mas de estas condiciones.',
    items: [
      'No cumplir uno o mas criterios de inclusion.',
      'Menor de 15 anos o sin inscripcion FONASA activa/PRAIS.',
      'Rechazo del paciente o cuidador responsable a la modalidad, o negativa a firmar consentimiento informado.',
      'Ausencia de diagnostico clinico definido, plan terapeutico u objetivos abordables por HODOM.',
      'Inestabilidad hemodinamica, riesgo elevado de deterioro, necesidad de monitorizacion continua o acceso inmediato a recursos hospitalarios.',
      'Procedimientos, tratamientos, dispositivos o cuidados que exceden la capacidad resolutiva/cartera de HODOM.',
      'Patologia psiquiatrica aguda descompensada, riesgo suicida activo, abstinencia moderada o severa, trastornos conductuales graves u otra condicion de salud mental que comprometa la seguridad.',
      'Conductas agresivas, amenazas o antecedentes de violencia hacia funcionarios.',
      'Ausencia de redes de apoyo o cuidador responsable para continuidad y seguridad de cuidados.',
      'Domicilio inseguro por problemas sanitarios, ambientales o de accesibilidad.',
      'Residencia fuera del area de cobertura o sin factibilidad tecnica/operativa.',
      'Incumplimiento grave y reiterado de indicaciones terapeuticas o condiciones de permanencia.',
      'Oxigenoterapia, controles, procedimientos, frecuencia de visitas u otras prestaciones que excedan la capacidad operativa disponible.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-oxigenoterapia',
    type: 'criteria',
    tab: 'Criterios',
    color: 'cyan',
    order: 50,
    title: 'Oxigenoterapia domiciliaria excepcional',
    content: 'Puede considerarse caso a caso si no excede capacidad operativa.',
    items: [
      'Oxigenoterapia de bajo flujo hasta 3 L/min.',
      'Usuario clinicamente estable.',
      'Disponibilidad de concentrador o cilindro de oxigeno.',
      'Condiciones domiciliarias adecuadas.',
      'Cuidador responsable capacitado.',
      'Orientada principalmente a cuidados paliativos, dependencia severa y patologias agudas en destete de oxigeno.',
      'Ingreso sujeto a evaluacion del equipo tratante y factibilidad tecnica/operativa.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-patologias',
    type: 'criteria',
    tab: 'Criterios',
    color: 'amber',
    order: 60,
    title: 'Patologias frecuentemente susceptibles',
    content: 'Condiciones habituales manejables en HODOM cuando cumplen criterios y cartera.',
    items: [
      'Infecciones del tracto urinario altas y bajas.',
      'Infecciones respiratorias altas y bajas.',
      'Infecciones de piel y partes blandas.',
      'Rehabilitacion posterior a accidente cerebrovascular.',
      'Rehabilitacion postquirurgica.',
      'Pie diabetico infectado.',
      'Cuidados de fin de vida.',
      'Patologias cronicas descompensadas de baja complejidad clinica.',
      'Otras condiciones medicas o quirurgicas estables que requieran tratamiento EV, curaciones, seguimiento clinico o rehabilitacion.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-derivacion',
    type: 'flowchart',
    tab: 'Procedimiento',
    color: 'blue',
    order: 70,
    title: 'Derivacion e ingreso',
    content: 'Flujo operativo de solicitud, evaluacion e inicio de atencion domiciliaria.',
    details: [
      '1. Medico derivador evalua pertinencia clinica, informa modalidad al paciente/familia y gestiona consentimiento informado.',
      '2. Solicitud en horario habil: informar por Enfermera y/o Matrona T6. Horario inhabil: Enfermera o Matrona de turno.',
      '3. Enviar antecedentes a HODOM.HCSF.HB@gmail.com y HODOM.HB@gmail.com, adjuntando epicrisis medica y/o solicitud de derivacion + consentimiento firmado.',
      '4. Equipo HODOM evalua factibilidad: condicion clinica, prestaciones requeridas, cartera vigente, disponibilidad operativa, accesibilidad, condiciones sanitarias, seguridad, red de apoyo y documentacion.',
      '5. Puede realizar entrevista telefonica o presencial con paciente, familia, cuidador o representante legal.',
      '6. Aceptado el ingreso, primera atencion domiciliaria el mismo dia o excepcionalmente al dia siguiente segun horario y disponibilidad.',
      '7. Enfermeria realiza evaluacion inicial en primera visita. Evaluacion medica y kinesica se realiza el mismo dia o siguiente dia habil cuando corresponda.',
      '8. Registrar prestaciones, procedimientos, evaluaciones y actividades en formularios oficiales y SGH cuando corresponda.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-roles',
    type: 'table',
    tab: 'Procedimiento',
    color: 'purple',
    order: 80,
    title: 'Responsabilidades por rol',
    headers: ['Rol', 'Responsabilidades clave'],
    rows: [
      ['Medico tratante', 'Evalua pertinencia de ingreso, define diagnostico y plan terapeutico, indica tratamientos/examenes/procedimientos/interconsultas, supervisa evolucion y determina egreso, derivacion o reingreso.'],
      ['Enfermero/a clinico/a', 'Gestiona, planifica, ejecuta y supervisa cuidados; actualiza plan de cuidados; realiza procedimientos y educacion; coordina medicamentos e insumos; verifica indicaciones y registros SGH.'],
      ['TENS', 'Ejecuta procedimientos y cuidados delegados, registra prestaciones, apoya preparacion/traslado/reposicion de insumos, coordina examenes y comunica cambios clinicos.'],
      ['Kinesiologo/a', 'Evalua y ejecuta rehabilitacion motora y/o respiratoria, educa en prevencion de complicaciones, ayudas tecnicas y oxigenoterapia, y comunica deterioro al equipo.'],
      ['Coordinador/a del programa', 'Coordina funcionamiento operativo/administrativo, documentos, formularios, accesos a sistemas, traslados del equipo y gestion de recursos.'],
      ['Conductor/apoyo logistico', 'Traslado seguro y oportuno del equipo, pacientes, insumos, medicamentos, examenes y equipamiento clinico cuando corresponda.'],
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-egreso',
    type: 'criteria',
    tab: 'Egreso',
    color: 'green',
    order: 90,
    title: 'Egreso, extension y rehospitalizacion',
    content: 'Criterios de cierre del episodio o escalamiento de atencion.',
    items: [
      'Alta del programa cuando se cumplen objetivos clinicos y existe plan de continuidad.',
      'Al completar 10 dias, si objetivos no estan resueltos, medico HODOM realiza reevaluacion integral de condicion clinica, plan vigente y objetivos pendientes.',
      'Tras reevaluacion puede definirse alta, rehospitalizacion o extension HODOM por hasta 10 dias adicionales; extension solo una vez por episodio y debe quedar fundamentada en ficha.',
      'Traslado/rehospitalizacion si hay deterioro clinico, signos de descompensacion o requerimiento de procedimientos/prestaciones que excedan capacidad resolutiva.',
      'Alta voluntaria: evaluar clinicamente, registrar solicitud, confeccionar epicrisis, entregar indicaciones y explicar riesgos/consulta ante cambios.',
      'Otras causales: cambio de residencia fuera de cobertura, incumplimiento reiterado, agresiones/amenazas, o imposibilidad reiterada de realizar prestaciones por ausencia de paciente/cuidador.',
      'Fallecimiento: medico HODOM certifica si ocurre en horario de funcionamiento y cumple requisitos; fuera de horario, familiar/cuidador contacta Servicio de Urgencia para evaluacion y certificado segun normativa.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-seguimiento',
    type: 'criteria',
    tab: 'Egreso',
    color: 'blue',
    order: 100,
    title: 'Coordinacion posterior al alta',
    content: 'Todo usuario egresado debe contar con estrategia de seguimiento acorde a su condicion clinica.',
    items: [
      'Usuarios inscritos en HCSF Bulnes: control post alta por medico HODOM o profesional definido por el establecimiento, idealmente dentro de 7 dias posteriores al egreso.',
      'Usuarios de otros establecimientos APS (incluyendo Quillon, Tres Esquinas, Santa Clara u otros): control posterior por equipo de salud de su establecimiento de origen.',
      'Equipo HODOM entrega educacion al paciente/familia sobre controles requeridos, orienta solicitud de horas y realiza coordinaciones clinicas necesarias para continuidad.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-registros',
    type: 'criteria',
    tab: 'Registros',
    color: 'slate',
    order: 110,
    title: 'Registros y supervision',
    content: 'Documentacion obligatoria y responsables de cumplimiento.',
    items: [
      'Registrar todas las intervenciones en formularios oficiales definidos en anexos y/o SGH segun corresponda.',
      'Medico y enfermeria deben efectuar registro clinico electronico institucional cuando cuenten con acceso.',
      'Enfermeria coordina alta, controles posteriores y continuidad con APS u otros programas.',
      'Supervision de cumplimiento: Subdireccion Medica y Subdireccion de Gestion del Cuidado.',
      'Distribucion del protocolo: Direccion, Subdireccion Medica, Subdireccion de Gestion del Cuidado, Unidad de Emergencia, Servicios Clinicos, Epidemiologia e IAAS, Laboratorio, Imagenologia, Calidad y Seguridad del Paciente, Farmacia y SOME.',
    ],
    layout_position: 'main',
  },
  {
    id: 'hodom-flujo',
    type: 'mermaid',
    tab: 'Algoritmo',
    color: 'blue',
    order: 120,
    title: 'Algoritmo HODOM',
    content: `flowchart TD
  A[Paciente 15 anos o mas con necesidad de cuidado hospitalario basico] --> B{Derivacion medica desde unidad autorizada}
  B -->|Si| C[Evaluar criterios de inclusion y exclusion]
  B -->|No| X[No ingresa a HODOM]
  C --> D{Clinicamente estable y plan definido}
  D -->|No| Y[Hospitalizacion convencional o mayor complejidad]
  D -->|Si| E{Cuidador 24 h, domicilio seguro y cobertura}
  E -->|No| X
  E -->|Si| F{Prestaciones dentro de cartera y factibilidad operativa}
  F -->|No| Y
  F -->|Si| G[Consentimiento + epicrisis/solicitud + envio a correos HODOM]
  G --> H[Evaluacion equipo HODOM]
  H --> I{Aceptado}
  I -->|No| Z[Informar rechazo y definir alternativa asistencial]
  I -->|Si| J[Primera visita mismo dia o dia siguiente]
  J --> K[Plan de cuidados, registros y visitas programadas]
  K --> L{Evolucion}
  L -->|Cumple objetivos| M[Alta + continuidad APS/HODOM]
  L -->|Deterioro o fuera de cartera| N[Rehospitalizacion o traslado]
  L -->|10 dias sin resolver| O[Reevaluacion medica]
  O --> P{Extension justificada}
  P -->|Si, una vez| K
  P -->|No| M`,
    layout_position: 'main',
  },
];

const topicPayload = {
  id: randomUUID(),
  name: TOPIC_NAME,
  title: 'Protocolo Hospitalizacion Domiciliaria',
  category_id: CATEGORY_ID,
  subcategory: 'Hospitalizados',
  status: 'published',
  description:
    'Protocolo HCSFB-118 para ingreso, manejo, seguimiento, egreso y rehospitalizacion de usuarios en Hospitalizacion Domiciliaria del HCSF Bulnes.',
  order: 118,
  tags: ['HODOM', 'hospitalizacion domiciliaria', 'domicilio', 'hospitalizados', 'cuidados domiciliarios', 'oxigenoterapia'],
  authors: [
    { name: 'Camila Lineros Vasquez', role: 'Elaboradora - Enfermera HODOM' },
    { name: 'Dra. Micaela Fasani Montagne', role: 'Elaboradora - Subdirectora Medica HCSFB' },
    { name: 'Mauricio Contreras Parra', role: 'Revisor - Subdirector de Gestion del Cuidado HCSFB' },
    { name: 'Dr. Alvaro Lagos LL.', role: 'Aprobador - Director HCSFB' },
  ],
  published_date: '2026-06-01T00:00:00.000Z',
  last_updated: new Date().toISOString(),
  layout_mode: 'protocol',
  tipo_contenido: ['protocolo'],
  clasificacion_ges: 'No GES',
  has_local_protocol: true,
  content_blocks,
  related_topics: [],
  related_tools: [],
  clinical_summary:
    'HODOM permite manejo transitorio en domicilio de usuarios de 15 anos o mas, estables, con diagnostico y plan definido, prestaciones equivalentes a hospitalizacion basica, cuidador 24 h y domicilio seguro dentro de cobertura.',
  diagnostic_orientation:
    'Antes de derivar confirmar estabilidad hemodinamica, ausencia de requerimiento de monitorizacion continua, plan terapeutico claro, cartera HODOM compatible, red de apoyo, cuidador responsable, domicilio seguro y consentimiento informado.',
  complementary_studies:
    'Examenes segun diagnostico y plan terapeutico. Laboratorio seriado hasta cada 48 horas; excepcionalmente diario si hay indicacion clinica justificada y factibilidad operativa.',
  initial_treatment:
    'Derivar con indicacion medica, epicrisis/solicitud, consentimiento informado y plan terapeutico. HODOM evalua factibilidad, realiza primera visita el mismo dia o dia siguiente, registra en formularios/SGH y coordina continuidad.',
  protocol_code: 'HCSFB-118',
  protocol_edition: 'Primera',
  protocol_date: 'Junio 2026',
  protocol_validity: 'Junio 2031',
  protocol_authors: [
    { name: 'Camila Lineros Vasquez', role: 'Elaboradora - Enfermera HODOM 2026' },
    { name: 'Dra. Micaela Fasani Montagne', role: 'Elaboradora - Subdirectora Medica HCSFB' },
    { name: 'Mauricio Contreras Parra', role: 'Revisor - Subdirector de Gestion del Cuidado HCSFB' },
    { name: 'Dr. Alvaro Lagos LL.', role: 'Aprobador - Director HCSFB' },
    { name: 'Ma. Teresa Medina Bravo', role: 'Visto bueno OFICySP' },
  ],
  protocol_objective:
    'Implementar el modelo de Hospitalizacion Domiciliaria en el HCSF Bulnes mediante una unidad asistencial que entregue atencion integral en domicilio a pacientes estables con diagnostico definido y requerimientos de hospitalizacion basica.',
};

async function uploadPdf() {
  const bytes = await readFile(PDF_PATH);
  const { error } = await supabase.storage.from('files').upload(STORAGE_PATH, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('files').getPublicUrl(STORAGE_PATH);
  return data.publicUrl;
}

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name,protocol_file_url')
    .eq('category_id', CATEGORY_ID)
    .or(`name.eq.${TOPIC_NAME},name.eq.${LEGACY_TOPIC_NAME},protocol_code.eq.HCSFB-118`)
    .maybeSingle();

  if (findError) throw findError;

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      existing,
      topic: TOPIC_NAME,
      blocks: content_blocks.length,
      tabs: [...new Set(content_blocks.map((block) => block.tab))],
      pdfPath: PDF_PATH,
      storagePath: STORAGE_PATH,
    }, null, 2));
    console.log('\nDry-run. Ejecuta con --apply para escribir en Supabase y subir el PDF.');
    return;
  }

  const protocol_file_url = await uploadPdf();
  const payload = { ...topicPayload, protocol_file_url };

  if (existing?.id) {
    const updatePayload = { ...payload };
    delete updatePayload.id;
    const { data, error } = await supabase
      .from('topics')
      .update(updatePayload)
      .eq('id', existing.id)
      .select('id,name,protocol_file_url')
      .single();
    if (error) throw error;
    console.log(JSON.stringify({ action: 'updated', topic: data }, null, 2));
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id,name,protocol_file_url')
    .single();
  if (error) throw error;
  console.log(JSON.stringify({ action: 'inserted', topic: data }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
