import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORY_ID = '696ea6ff245ef362de4f431e';
const TOPIC_NAME = 'Criterios de derivación a Urología Adulto';

function textBlock(title, content, tab = 'Resumen') {
  return { id: randomUUID(), type: 'text', title, content, tab };
}

function tableBlock(title, headers, rows, tab = 'Criterios') {
  return { id: randomUUID(), type: 'table', title, headers, rows, tab };
}

function alertBlock(title, content, variant = 'info', tab = 'Resumen') {
  return { id: randomUUID(), type: 'alert', title, content, variant, tab };
}

function headerBlock() {
  return {
    id: randomUUID(),
    type: 'protocol_header',
    tab: 'Resumen',
    ordinario: 'ACTUALIZACIÓN DE RED',
    title: TOPIC_NAME,
    institution: 'Servicio de Urología · Unidad de Gestión de la Demanda NO GES',
    department: 'Teleprocesos Urología · Red Ñuble',
    date: 'Fuente local 2019 - mayo 2026',
    summary:
      'Criterios clínico-administrativos para derivación de usuarios mayores de 15 años a Urología mediante Teleprocesos, con priorización oncológica, exclusiones y requisitos mínimos.',
  };
}

const content_blocks = [
  headerBlock(),
  alertBlock(
    'Regla general',
    'Teleprocesos es la vía de ingreso para primeras consultas de Urología. No volver a subir interconsultas si ya existe una en plataforma; ante dudas administrativas, contactar por correo según la fuente local.',
  ),
  textBlock(
    'Contexto de red',
    'La estrategia de Teleprocesos Urología se implementó desde 2019 como evaluación asincrónica previa a la atención presencial. La fuente reporta 15.250 interconsultas ingresadas hasta mayo de 2026, 96,2% contestadas y tiempo promedio de respuesta de 5 días.',
  ),
  tableBlock(
    'Requisitos generales de toda interconsulta',
    ['Elemento', 'Debe incluir'],
    [
      ['Historia clínica', 'Motivo de derivación claro, evolución del problema y antecedentes relevantes.'],
      ['Examen físico urológico', 'Examen completo según problema; tacto rectal y genital si corresponde, incluyendo fosa renal cuando aplique.'],
      ['Tacto rectal', 'Describir volumen prostático grado I-IV, consistencia blanda o dura y presencia de nódulo duro o pétreo.'],
      ['Patología prostática', 'Adjuntar antígeno prostático específico, examen de orina y urocultivo cuando corresponda.'],
      ['Informes e imágenes', 'Adjuntar informes completos disponibles; si hay imágenes externas, incluir link o forma de acceso.'],
      ['Edad', 'Derivar usuarios mayores de 15 años.'],
      ['Diabetes', 'Pacientes diabéticos deben estar compensados antes de evaluar problemas como ITU a repetición o síntomas obstructivos.'],
      ['Paciente neurológico secuelado', 'Definir pronóstico vital y objetivos de manejo para limitar esfuerzos cuando corresponda.'],
    ],
    'Resumen',
  ),
  tableBlock(
    'Prioridad alta',
    ['Condición', 'Criterio operativo', 'Adjuntar'],
    [
      ['Sospecha de cáncer de próstata', 'Derivación prioritaria por sospecha oncológica.', 'APE, tacto rectal descrito, examen de orina/urocultivo e informes disponibles.'],
      ['Sospecha de cáncer de vejiga', 'Hematuria macroscópica o sospecha clínica compatible.', 'Examen de orina, urocultivo, imágenes/informes disponibles.'],
      ['Sospecha de cáncer de pene', 'Lesión sospechosa o evolución compatible con neoplasia.', 'Descripción clínica, examen físico e imágenes/fotos clínicas si el circuito local lo permite.'],
      ['Sospecha de cáncer de urotelio', 'Sospecha clínica o imagenológica de lesión urotelial.', 'Informe completo de imagen y exámenes disponibles.'],
      ['Cáncer confirmado en extrasistema u otro hospital', 'Paciente con diagnóstico oncológico ya establecido.', 'Biopsia y exámenes disponibles para evitar repetición.'],
      ['Hiperplasia prostática complicada', 'Hematuria, litiasis vesical, sonda Foley/cistostomía, falla renal o infección a repetición.', 'APE, orina/urocultivo, creatinina e imágenes si están disponibles.'],
      ['Litiasis complicada', 'Litiasis con catéter doble J o falla renal.', 'Imagen completa, función renal y antecedentes de manejo previo.'],
    ],
  ),
  tableBlock(
    'APE: cuándo pedir e interpretar',
    ['Situación', 'Conducta'],
    [
      ['Asintomático 50 a 75 años', 'Solicitar APE como evaluación de pesquisa según criterio clínico.'],
      ['Mayor de 40 años con antecedente familiar directo', 'Solicitar APE si padre o hermanos tuvieron cáncer de próstata antes de los 65 años.'],
      ['Mayor de 75 años sintomático', 'Realizar tacto rectal. Si está alterado, solicitar APE.'],
      ['Mayor de 75 años asintomático', 'No solicitar APE como tamizaje general.'],
      ['APE 4 a 7', 'Derivar con dos mediciones separadas por 3 meses, porque una proporción importante normaliza en ese plazo.'],
    ],
  ),
  tableBlock(
    'Prioridad media y baja',
    ['Prioridad', 'Condiciones'],
    [
      ['Media', 'Litiasis renal o ureteral sintomática.'],
      ['Media', 'Hematuria microscópica en paciente con antecedente de tabaquismo: mínimo 3 exámenes de orina con más de 5 glóbulos rojos por campo, sin infección urinaria.'],
      ['Baja', 'Patología prostática benigna.'],
      ['Baja', 'Patología genital masculina o femenina, como carúncula uretral o quiste parauretral.'],
      ['Baja', 'Incontinencia urinaria pura.'],
      ['Baja', 'Vejiga inestable.'],
      ['Baja', 'Incontinencia urinaria mixta con prueba farmacológica previa de imipramina.'],
      ['Baja', 'Litiasis renal asintomática como hallazgo en ecografía abdominal.'],
      ['Baja', 'Solicitud de vasectomía.'],
    ],
  ),
  tableBlock(
    'No derivar por Teleprocesos',
    ['Situación', 'Conducta correcta'],
    [
      ['Cáncer de testículo', 'Derivar directamente por GES.'],
      ['Cáncer de riñón', 'Derivar directamente por GES.'],
      ['Paciente ya ingresado previamente a GES', 'No duplicar por Teleprocesos.'],
      ['Paciente ya aceptado previamente en Teleprocesos', 'No volver a derivar; revisar plataforma o gestionar por correo si falta información.'],
      ['Examen urológico normal, por ejemplo ecografía testicular normal', 'No derivar solo por hallazgo normal.'],
      ['Quiste renal simple o Bosniak I-II por TAC', 'No derivar por Teleprocesos.'],
      ['Diabética con ITU a repetición o diabético con síntomas obstructivos sin compensación metabólica', 'Compensar diabetes antes de derivar.'],
      ['Disfunción sexual', 'No derivar por esta vía.'],
      ['Paciente secuelado/postrado con vejiga neurogénica y sonda Foley', 'No derivar por Teleprocesos; definir objetivos de cuidado y pronóstico.'],
      ['Litiasis renal menor de 7 mm', 'No derivar por Teleprocesos.'],
      ['Litiasis ureteral menor de 5 mm', 'Manejo médico expulsivo: tamsulosina 2 comprimidos en la noche por 15 días según fuente local.'],
    ],
    'No derivar',
  ),
  tableBlock(
    'Requisitos adicionales',
    ['Tema', 'Indicación local'],
    [
      ['Vejiga inestable', 'Tratar con imipramina por 3 meses y luego reevaluar síntomas.'],
      ['Incontinencia urinaria mixta', 'Realizar prueba farmacológica previa con imipramina antes de derivar.'],
      ['Patología genital con ecografía normal', 'Descartar problema de neuritis inguinal.'],
      ['Diagnóstico oncológico', 'Adjuntar biopsia y exámenes disponibles si los tiene, para evitar repetir estudios.'],
      ['Diagnóstico no urológico', 'No derivar patologías que no son de resorte urológico, como hernia inguinal o patología rectal.'],
    ],
    'Adjuntar',
  ),
  tableBlock(
    'Plantilla breve para Teleprocesos',
    ['Sección', 'Contenido sugerido'],
    [
      ['Motivo', 'Diagnóstico o sospecha y pregunta clínica concreta para Urología.'],
      ['Historia', 'Inicio, evolución, síntomas urinarios, dolor, hematuria, infecciones, litiasis, sondas o procedimientos previos.'],
      ['Examen físico', 'Tacto rectal/genital/fosa renal según corresponda, con hallazgos descritos.'],
      ['Laboratorio', 'APE con fechas si aplica, orina completa, urocultivo, creatinina y otros resultados pertinentes.'],
      ['Imágenes', 'Informe completo y acceso a imagen. Evitar copiar solo una frase del informe.'],
      ['Estado administrativo', 'Confirmar que no existe interconsulta previa aceptada ni ingreso GES duplicado.'],
    ],
    'Adjuntar',
  ),
  tableBlock(
    'Errores frecuentes',
    ['Error', 'Corrección'],
    [
      ['Usar módulo de lista de espera para primeras consultas.', 'No usarlo; ingresar por Teleprocesos según estrategia local.'],
      ['Reenviar una interconsulta ya aceptada.', 'Revisar plataforma y gestionar aclaraciones por correo si corresponde.'],
      ['Enviar informes incompletos o solo conclusiones.', 'Adjuntar informe completo y acceso a imágenes.'],
      ['Derivar sin tacto rectal descrito en patología prostática.', 'Registrar grado, consistencia y nódulos si los hay.'],
      ['Pedir APE como tamizaje general en mayores de 75 años asintomáticos.', 'No solicitar; en sintomáticos realizar tacto rectal y pedir APE solo si está alterado.'],
      ['Derivar patologías no urológicas.', 'Resolver o derivar por la especialidad correspondiente.'],
    ],
    'Errores',
  ),
  alertBlock(
    'Gestión administrativa',
    'Si ya existe una interconsulta en plataforma, no subir una nueva. La fuente local indica contactar a igor.gebauer@redsalud.gob.cl para gestión administrativa o aclaración posterior a respuesta del urólogo.',
    'warning',
    'Errores',
  ),
  textBlock(
    'Nota de conversión',
    'Este tema corresponde a una actualización operativa de red basada en el documento local convertido a Markdown: data/markdown/criterios-derivacion-urologia.md. No se presenta como protocolo institucional.',
    'Errores',
  ),
];

const payload = {
  name: TOPIC_NAME,
  title: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: 'Urología',
  description:
    'Criterios clínico-administrativos para derivación a Urología Adulto mediante Teleprocesos, con prioridades, exclusiones y requisitos mínimos.',
  tags: [
    'urología',
    'teleprocesos',
    'derivación',
    'APE',
    'cáncer de próstata',
    'hematuria',
    'litiasis',
    'hiperplasia prostática',
    'incontinencia urinaria',
    'GES',
  ],
  order: 93,
  status: 'published',
  layout_mode: 'tabs',
  tipo_contenido: ['criterios_derivacion', 'actualizacion_red', 'contenido_medico'],
  clasificacion_ges: 'No GES',
  has_local_protocol: false,
  authors: [
    { name: 'Dr. Igor Gebauer Peña', role: 'Servicio de Urología' },
    { name: 'Enfermero Sebastián Bustos Vázquez', role: 'Unidad de Gestión de la Demanda NO GES' },
  ],
  content_blocks,
  related_topics: [],
  related_tools: [],
  clinical_summary:
    'Teleprocesos es la vía de ingreso para primeras consultas de Urología Adulto. La interconsulta debe ser pertinente, completa y categorizable, con especial priorización de sospecha oncológica y patología complicada.',
  diagnostic_orientation:
    'Definir el problema urológico, descartar condiciones que no corresponden a Teleprocesos, describir examen físico urológico y aportar exámenes mínimos según patología.',
  complementary_studies:
    'Adjuntar APE cuando corresponda, orina completa, urocultivo, creatinina, informes completos de imágenes y biopsia en diagnósticos oncológicos ya confirmados.',
  initial_treatment:
    'Antes de derivar, compensar diabetes cuando corresponda, realizar prueba farmacológica local para vejiga inestable/incontinencia mixta y manejar litiasis pequeñas según indicación local.',
  protocol_code: null,
  protocol_edition: null,
  protocol_date: null,
  protocol_validity: null,
  protocol_authors: [],
  protocol_objective: null,
};

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name')
    .eq('category_id', CATEGORY_ID)
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (findError) throw findError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from('topics')
      .update(payload)
      .eq('id', existing.id)
      .select('id,name')
      .single();
    if (error) throw error;
    console.log(`Updated topic: ${data.name} (${data.id})`);
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id,name')
    .single();
  if (error) throw error;
  console.log(`Created topic: ${data.name} (${data.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
