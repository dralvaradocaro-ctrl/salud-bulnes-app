/**
 * Crea/actualiza el tema operativo "Atenciones Policlínico HCSF Bulnes" y
 * publica una novedad asociada.
 *
 * Fuente: /Users/fernandoalvarado/Downloads/ATENCIONES POLICLÍNICO HCSF BULNES.docx.pdf
 *
 * Uso:
 *   node --env-file=.env scripts/create-atenciones-policlinico-v1.mjs
 *   node --env-file=.env scripts/create-atenciones-policlinico-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const CATEGORY_ID = '696ea6ff245ef362de4f431e'; // Policlínico
const TOPIC_NAME = 'Atenciones Policlínico HCSF Bulnes';
const PDF_PATH = '/Users/fernandoalvarado/Downloads/ATENCIONES POLICLÍNICO HCSF BULNES.docx.pdf';
const STORAGE_PATH = 'protocolos/policlinico/atenciones-policlinico-hcsf-bulnes.pdf';
const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const mainRows = [
  ['Control/ingreso cardiovascular', 'Control de salud cardiovascular (+ ingreso HEARTS si corresponde)', 'Salud cardiovascular integral', 'Orden interna: control con nutricionista en 3-4 meses.'],
  ['Otras atenciones cardiovasculares', 'Consulta cardiovascular (+ poli de compensación si está descompensado)', 'Según atención', 'Incluye exámenes no actualizados, confirmación GES cardiovascular, fondo de ojo o poli descompensado.'],
  ['Control no cardiovascular', 'Control otros problemas de salud no cardiovasculares', 'Formulario de control de otros programas de salud', 'Rellenar solo la patología en seguimiento: hipotiroidismo, artrosis, epilepsia, AR, LES, etc.'],
  ['Sala ERA/IRA', 'Control sala ERA/IRA/mixta', 'Formulario de control de otros programas de salud', 'Ingreso ERA: completar encuesta calidad de vida y agregar actividad "Aplicación encuesta calidad de vida". Ingreso IRA: agregar PedsQL por tramo etario.'],
  ['Salud mental', 'Controles de salud mental', 'Control de salud mental', 'Si ingreso/egreso: consulta salud mental + plan de cuidado integral + clasificación N + cuestionario Goldberg.'],
  ['Niño sano 1 mes', 'Control de salud + entrega de guías anticipatorias', 'Control de crecimiento y desarrollo (control sano)', 'Rellenar alimentación y acompañamiento. Chile Crece. Score IRA y protocolo neurosensorial; si alterados derivar a Kine/sala de estimulación. Orden interna: control en 1 mes con enfermera.'],
  ['Niño sano 3 meses', 'Control de salud + entrega de guías anticipatorias', 'Control de crecimiento y desarrollo + score IRA', 'Orden interna: control en 1 mes con enfermera. Abrir GES sospecha displasia de cadera CIE10 Q65.8 y solicitar RX pelvis pediátrica por orden de procedimiento/imágenes.'],
  ['Consulta morbilidad', 'Consulta otras morbilidades', 'Sin formulario', 'Usar para morbilidad general.'],
  ['Renovación de receta sin paciente', 'Actividad abreviada y confección de recetas', 'Sin formulario', 'Usar si corresponde emisión de receta sin atención presencial.'],
  ['Administrativos / informe biomédico', 'Actividad abreviada (SOS actividad administrativa)', 'Sin formulario', 'Para informe biomédico u otras actividades administrativas.'],
  ['ECICEP', 'Poner exactamente lo indicado en papel del box', 'Todos los formularios según programa atendido', 'Seguir instrucción local pegada en cada computador.'],
  ['Paliativos', 'Control otros problemas de salud no cardiovasculares + cuidados paliativos (+ otras actividades realizadas)', 'Ingreso: otros programas de salud (Otros: alivio del dolor) + formularios según atención', 'Si se realiza visita domiciliaria oncológica o control cardiovascular, agregar actividad correspondiente.'],
  ['Dependencia severa', 'Visita domiciliaria no oncológico (+ actividades según atención)', 'Formularios según programa atendido', 'Agregar cardiovascular, morbilidad u otra actividad si corresponde.'],
  ['Telesalud', 'Telesalud - actividad realizada', 'Sin formulario', 'Registrar exactamente lo indicado en torpedo bajo teclado de computador de Telesalud.'],
  ['Poli TACO', 'Actividad abreviada', 'Sin formulario', 'Registro abreviado.'],
  ['Control prenatal', 'Control prenatal + entrega resultado Chagas', 'Control prenatal', 'Registrar entrega de resultado Chagas cuando corresponda.'],
  ['Control climaterio', 'Control climaterio', 'MRS', 'Usar formulario MRS.'],
  ['Telemedicina', 'Consultas médicas de especialidad ambulatoria nuevas o control realizadas por telemedicina', 'Sin formulario', 'Elegir nueva o control según corresponda.'],
  ['Selector de demanda', 'Consulta otras morbilidades', 'Sin formulario', 'Sin formulario.'],
  ['Atención funcionarios (UST)', 'Consulta otras morbilidades + atención a funcionarios', 'Sin formulario', 'Usar para atención de funcionarios.'],
];

const ayudasRows = [
  ['Solicitud de órtesis', 'CIE10 Ortesis (Constancia) GES; imprimir y firmar GES; entregar copia al paciente y guardar la otra en carpeta GES.', 'Planilla GES, receta GES para silla de ruedas, bastón canadiense, andador, colchón antiescara o cojín. Las hojas quedan en carpeta GES; no entregar originales al paciente. Derivar a kinesioterapia para entrega por orden interna.'],
  ['Exámenes especiales', 'Vitamina D, litio, ferritina, ferremia, reticulocitos, anti-TPO, ANA, anti-DNA, CEA.', 'Rellenar formulario de exámenes especiales (hoja verde). Entregar hoja al paciente e indicar que acuda a laboratorio para solicitar hora y entregar la hoja.'],
  ['Examen TBC', 'Rellenar solicitud de examen de TBC.', 'Entregar hoja al paciente e indicar que acuda a box TENS Ingrid (32) para toma de muestra.'],
  ['Nunca registrar', 'No usar actividades que inicien con AG_.', 'Tampoco usar cualquier actividad que al seleccionarla indique "No contabilizada en REM".'],
];

const telemedicinaRows = [
  ['Sincrónica', 'Paciente citado a box con especialista en cámara.', 'Cardiología, endocrinología infantil/adulto, psiquiatría adulto/infantil, diabetología con perfil glicémico, neurología, hematología, gastroenterología, medicina interna, broncopulmonar, ginecología, reumatología, inmunología. Alivio del dolor y geriatría: derivar a medicina interna y especificar sincrónica.'],
  ['Asincrónica - Hospital Digital', 'Evitar usar salvo indicación.', 'Nefrología ERC IIIa/IIIb requiere al menos 2 creatininas y RAC en sistema. Diabetología: preferir teleprocesos. Geriatría solicita Barthel y datos; preparar con derivación previa a TO para escalas.'],
  ['Teleprocesos', 'Preferir para cardiología, broncopulmonar, dermatología, urología, traumatología y diabetología.', 'Cardiología: adjuntar ECG. Dermatología: tomar al menos 3 fotos y enviarlas a telesaludhb@redsalud.gob.cl. Urología: presencial si cáncer renal, vesical o testicular. Diabetología: incluir perfil glicémico escrito o foto al correo.'],
];

const content_blocks = [
  {
    id: 'atenciones-poli-resumen',
    type: 'text',
    tab: 'Resumen',
    color: 'cyan',
    order: 10,
    title: 'Guía operativa de registro en Policlínico',
    content:
      'Ayuda de memoria para seleccionar actividades, formularios y observaciones frecuentes en atenciones de Policlínico HCSF Bulnes. Es una herramienta administrativa-operativa para REM/formularios, no reemplaza protocolos clínicos ni criterios de derivación.',
    details: [
      'Usar la actividad exacta cuando el documento lo explicita.',
      'Completar formularios asociados según programa atendido.',
      'Evitar actividades que inicien con AG_ o que indiquen "No contabilizada en REM".',
    ],
    layout_position: 'main',
  },
  {
    id: 'atenciones-poli-tabla-principal',
    type: 'table',
    tab: 'Tabla rápida',
    color: 'cyan',
    order: 20,
    title: 'Tabla rápida de atenciones y formularios',
    headers: ['Atención', 'Actividad REM / registro', 'Formulario', 'Observaciones'],
    rows: mainRows,
    layout_position: 'main',
  },
  {
    id: 'atenciones-poli-ayudas',
    type: 'table',
    tab: 'Ayudas',
    color: 'amber',
    order: 30,
    title: 'Otras ayudas de memoria',
    headers: ['Situación', 'Qué registrar / solicitar', 'Qué hacer'],
    rows: ayudasRows,
    layout_position: 'main',
  },
  {
    id: 'atenciones-poli-telemedicina',
    type: 'table',
    tab: 'Telemedicina',
    color: 'blue',
    order: 40,
    title: 'Telemedicina: modalidad y derivación',
    headers: ['Modalidad', 'Uso', 'Notas operativas'],
    rows: telemedicinaRows,
    layout_position: 'main',
  },
  {
    id: 'atenciones-poli-era-ecv',
    type: 'criteria',
    tab: 'ERA/IRA',
    color: 'green',
    order: 50,
    title: 'Encuesta calidad de vida Sala ERA',
    content: 'Para ingreso Sala ERA completar ECV EQ5D-ASMA y agregar la actividad de aplicación de encuesta.',
    items: [
      'Movilidad: sin problemas, algunos problemas o en cama.',
      'Cuidado personal: sin problemas, algunos problemas para lavarse/vestirse o incapaz.',
      'Actividades habituales: sin problemas, algunos problemas o incapaz.',
      'Dolor/malestar: sin dolor, moderado o mucho dolor/malestar.',
      'Angustia/depresión: no, moderada o muy angustiado/deprimido.',
    ],
    layout_position: 'main',
  },
];

const topicPayload = {
  id: randomUUID(),
  name: TOPIC_NAME,
  title: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: 'Herramientas Clínicas',
  status: 'published',
  description:
    'Tabla operativa para registrar actividades y formularios frecuentes de Policlínico HCSF Bulnes: cardiovascular, salud mental, niño sano, ERA/IRA, paliativos, dependencia severa, TACO, telemedicina y ayudas de memoria.',
  order: 118,
  tags: ['Policlínico', 'REM', 'formularios', 'consultas frecuentes', 'registro clínico', 'telemedicina'],
  authors: [{ name: 'Equipo Policlínico HCSF Bulnes', role: 'Fuente operativa local' }],
  published_date: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  layout_mode: 'protocol',
  tipo_contenido: ['herramienta_clinica'],
  clasificacion_ges: 'No GES',
  has_local_protocol: false,
  content_blocks,
  related_topics: [],
  related_tools: [],
  clinical_summary:
    'Ayuda de memoria para seleccionar actividad REM/formulario en atenciones frecuentes de Policlínico HCSF Bulnes.',
  diagnostic_orientation:
    'Identificar tipo de atención y programa asociado; elegir actividad exacta, completar formulario correspondiente y agregar observaciones/órdenes internas cuando proceda.',
  complementary_studies:
    'No aplica como protocolo clínico. Para exámenes especiales usar formulario específico; para TBC usar solicitud TBC y derivar a box TENS indicado.',
  initial_treatment:
    'Registrar actividad y formulario según tabla. No usar actividades AG_ ni opciones marcadas como no contabilizadas en REM.',
  protocol_code: 'Guía operativa Policlínico',
  protocol_edition: 'Documento local',
  protocol_date: 'Junio 2026',
  protocol_validity: '',
  protocol_authors: [{ name: 'Equipo Policlínico HCSF Bulnes', role: 'Fuente operativa local' }],
  protocol_objective:
    'Estandarizar la selección de actividades y formularios frecuentes en Policlínico HCSF Bulnes para facilitar registro administrativo y continuidad operativa.',
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

async function upsertNews(topic) {
  const payload = {
    title: 'Consultas frecuentes: atenciones de Policlínico',
    summary: 'Nueva tabla rápida con actividad REM, formulario y observaciones para registros frecuentes.',
    details: [
      'Incluye cardiovascular, sala ERA/IRA, salud mental, niño sano, morbilidad, recetas, paliativos, dependencia severa, TACO, prenatal, climaterio, telemedicina y ayudas de memoria.',
      'Recordatorio: no usar actividades que inicien con AG_ ni opciones que indiquen "No contabilizada en REM".',
    ].join('\n'),
    area: 'policlinico',
    type: 'consulta',
    status: 'published',
    published_at: new Date().toISOString(),
    topic_id: topic.id,
    link_url: `/TopicDetail?id=${topic.id}`,
    created_by: 'admin',
  };

  const { data: existing, error: findError } = await supabase
    .from('news_updates')
    .select('id')
    .eq('title', payload.title)
    .maybeSingle();
  if (findError?.code === 'PGRST205') {
    return { action: 'skipped', reason: 'news_updates table is not available in Supabase schema cache' };
  }
  if (findError) throw findError;

  if (existing?.id) {
    const { error } = await supabase.from('news_updates').update(payload).eq('id', existing.id);
    if (error) throw error;
    return { action: 'updated', id: existing.id };
  }

  const { data, error } = await supabase
    .from('news_updates')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return { action: 'inserted', id: data.id };
}

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name,protocol_file_url')
    .eq('category_id', CATEGORY_ID)
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (findError) throw findError;

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      existing,
      topic: TOPIC_NAME,
      blocks: content_blocks.length,
      tableRows: mainRows.length,
      pdfPath: PDF_PATH,
      storagePath: STORAGE_PATH,
    }, null, 2));
    console.log('\nDry-run. Ejecuta con --apply para escribir en Supabase, subir PDF y publicar novedad.');
    return;
  }

  const protocol_file_url = await uploadPdf();
  const payload = { ...topicPayload, protocol_file_url };

  let topic;
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
    topic = data;
  } else {
    const { data, error } = await supabase
      .from('topics')
      .insert(payload)
      .select('id,name,protocol_file_url')
      .single();
    if (error) throw error;
    topic = data;
  }

  const news = await upsertNews(topic);
  console.log(JSON.stringify({ topic, news }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
