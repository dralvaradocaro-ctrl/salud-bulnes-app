/**
 * Crea/actualiza el ordinario Ord. 5 N 783 sobre derivacion e ingreso a
 * rehabilitacion de usuarios cardio-operados de la Red Asistencial de Nuble.
 *
 * Uso:
 *   node --env-file=.env scripts/create-ord-783-rehabilitacion-cardio-operados-v1.mjs
 *   node --env-file=.env scripts/create-ord-783-rehabilitacion-cardio-operados-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const CATEGORY_ID = '696ea6ff245ef362de4f431e'; // Policlínico
const TOPIC_NAME = 'Rehabilitación post cirugía cardíaca: derivación de usuarios cardio-operados';
const PROTOCOL_CODE = 'Ord. 5 N° 783';
const PDF_PATH = '/Users/fernandoalvarado/Downloads/Ord. 5 N 783 Informa flujograma de derivación e ingreso a rehabilitación de usuarios cardio operados de la Red Asistencial de Ñuble.pdf';
const MARKDOWN_PATH = 'data/markdown/ord-5-n-783-rehabilitacion-cardio-operados-nuble.md';
const STORAGE_PATH = 'protocolos/policlinico/ord-5-n-783-rehabilitacion-cardio-operados-nuble.pdf';
const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const tags = [
  'Ordinario SSÑ',
  'ordinario red asistencial',
  'Ord. 5 N 783',
  'Flujo local',
  'Policlínico',
  'Cardiología',
  'cirugía cardíaca',
  'cardio-operados',
  'rehabilitación cardíaca',
  'kinesiología',
  'derivación interna',
  'Hospital Las Higueras',
  'HLH',
  'Red Asistencial de Ñuble',
];

const networkRows = [
  ['Hospital Clínico Herminda Martín', 'Esteban Vidal', 'esteban.vidal.j@redsalud.gob.cl'],
  ['Hospital San Carlos', 'Claudia Pinto', 'claudia.pinto@redsalud.gob.cl'],
  ['Hospital Comunitario de Yungay', 'Elvis Castillo', 'elvis.castillo@redsalud.gob.cl'],
  ['Hospital Comunitario de Coelemu', 'Jaime Pedreros', 'jaime.pedreros@redsalud.gov.cl'],
  ['HCSF Bulnes', 'Víctor Palavecino', 'victor.palavecino.m@redsalud.gob.cl'],
  ['HCSF Quirihue', 'Daniela Mardones', 'daniela.mardones@redsalud.gob.cl'],
];

const flowSteps = [
  'Usuario de la Red Asistencial de Ñuble es sometido a cirugía cardíaca en Hospital Las Higueras de Talcahuano.',
  'Durante la hospitalización, el Servicio de Medicina Física y Rehabilitación de HLH entrega prestaciones de rehabilitación inicial.',
  'Al alta hospitalaria se genera epicrisis.',
  'Kinesióloga Catalina Zapata envía la epicrisis por correo a los referentes de rehabilitación de la red.',
  'El referente del establecimiento gestiona hora de ingreso a rehabilitación y contacta al usuario con fecha y hora.',
  'En paralelo, enfermera supervisora HLH informa el proceso por correo a UNITEL Chillán y San Carlos.',
];

const content_blocks = [
  {
    id: 'ord-783-resumen',
    type: 'text',
    tab: 'Resumen',
    color: 'cyan',
    order: 10,
    title: 'Alcance del ordinario',
    content:
      'Ordinario que informa el flujograma de derivación e ingreso a rehabilitación de usuarios de la Red Asistencial de Ñuble cardio-operados en Hospital Las Higueras de Talcahuano. El objetivo operativo es asegurar continuidad del cuidado y acceso oportuno a rehabilitación posterior al alta.',
    details: [
      'Aplica a todo usuario post operado cardíaco de la red derivado desde HLH con epicrisis.',
      'El documento solicita difundir el procedimiento a los equipos involucrados y cumplir las acciones del flujograma.',
      `Texto convertido a Markdown disponible en ${MARKDOWN_PATH}.`,
    ],
    layout_position: 'main',
  },
  {
    id: 'ord-783-accion-local',
    type: 'criteria',
    tab: 'Acción local',
    color: 'green',
    order: 20,
    title: 'Conducta en Policlínico HCSF Bulnes',
    content:
      'Cuando el paciente post cirugía cardíaca sea recibido en policlínico, se debe dejar orden interna a kinesiología para rehabilitación post cirugía cardíaca.',
    items: [
      'Confirmar que el paciente corresponde a post operado cardíaco derivado desde HLH.',
      'Revisar epicrisis o antecedente clínico enviado desde HLH.',
      'Emitir orden interna a Kinesiología/Rehabilitación: "rehabilitación post cirugía cardíaca".',
      'Coordinar ingreso con el referente local de rehabilitación: Víctor Palavecino.',
      'Registrar en ficha la derivación interna y las indicaciones entregadas al paciente.',
    ],
    layout_position: 'main',
  },
  {
    id: 'ord-783-flujo-red',
    type: 'flowchart',
    tab: 'Flujo',
    color: 'sky',
    order: 30,
    title: 'Flujo de derivación desde HLH',
    content: 'Secuencia resumida del flujograma informado por el ordinario.',
    details: flowSteps,
    layout_position: 'main',
  },
  {
    id: 'ord-783-referente-local',
    type: 'criteria',
    tab: 'Referentes',
    color: 'blue',
    order: 40,
    title: 'Referente local rescatado',
    content: 'Kinesiólogo local para Hospital Comunitario de Salud Familiar de Bulnes.',
    items: [
      'Víctor Palavecino — Servicio de Rehabilitación HCSF Bulnes.',
      'Correo: victor.palavecino.m@redsalud.gob.cl',
      'Rol operativo: recibir/gestionar ingreso a rehabilitación y coordinar hora con el usuario según realidad local.',
    ],
    layout_position: 'main',
  },
  {
    id: 'ord-783-referentes-red',
    type: 'table',
    tab: 'Referentes',
    color: 'cyan',
    order: 50,
    title: 'Referentes de rehabilitación mencionados',
    headers: ['Establecimiento', 'Referente', 'Correo'],
    rows: networkRows,
    layout_position: 'main',
  },
  {
    id: 'ord-783-mermaid',
    type: 'mermaid',
    tab: 'Flujo',
    order: 60,
    title: 'Algoritmo operativo local',
    content: `flowchart TD
    A([Paciente cardio-operado en HLH]) --> B[Alta hospitalaria y epicrisis]
    B --> C[HLH envia epicrisis a referente de rehabilitacion]
    C --> D[Referente local: Victor Palavecino]
    D --> E[Gestionar hora de ingreso a rehabilitacion]
    E --> F[Contactar al usuario]
    F --> G([Ingreso a rehabilitacion])
    H([Paciente recibido en Policlínico HCSF Bulnes]) --> I[Revisar epicrisis o antecedente HLH]
    I --> J[Dejar orden interna a Kinesiologia]
    J --> D`,
    layout_position: 'main',
  },
];

async function findRelatedTopics() {
  const { data, error } = await supabase
    .from('topics')
    .select('id,name,subcategory,tags,description,status')
    .eq('status', 'published')
    .limit(1000);
  if (error) throw error;

  const keywords = ['cardiología', 'cardiologia', 'cardiovascular', 'taco', 'infarto', 'hipertensión', 'marcapasos'];
  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const matches = [];
  for (const topic of data || []) {
    if (topic.name === TOPIC_NAME) continue;
    const haystack = normalize([
      topic.name,
      topic.description,
      topic.subcategory,
      ...(topic.tags || []),
    ].join(' '));
    if (keywords.some((keyword) => haystack.includes(normalize(keyword)))) {
      matches.push({ topic_id: topic.id, label: topic.name });
    }
  }
  return matches.slice(0, 8);
}

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
  const related_topics = await findRelatedTopics();
  const now = new Date().toISOString();

  const payload = {
    id: randomUUID(),
    name: TOPIC_NAME,
    title: TOPIC_NAME,
    category_id: CATEGORY_ID,
    subcategory: 'Derivaciones',
    status: 'published',
    description:
      'Flujograma SSÑ para derivación e ingreso a rehabilitación de usuarios cardio-operados en HLH, con acción local en Policlínico HCSF Bulnes.',
    order: 118,
    tags,
    authors: [{ name: 'Red Asistencial de Ñuble', role: 'Fuente del ordinario' }],
    published_date: now,
    last_updated: now,
    layout_mode: 'protocol',
    tipo_contenido: ['flujo_local'],
    clasificacion_ges: 'No GES',
    has_local_protocol: false,
    content_blocks,
    related_topics,
    related_tools: [],
    clinical_summary:
      'Todo post operado cardíaco derivado desde HLH debe ingresar al flujo de rehabilitación cardíaca de la red. En Bulnes, al recibirlo en policlínico, dejar orden interna a kinesiología para rehabilitación post cirugía cardíaca.',
    diagnostic_orientation:
      'Identificar antecedente de cirugía cardíaca en HLH, epicrisis de alta y necesidad de continuidad de rehabilitación.',
    complementary_studies:
      'No corresponde como protocolo diagnóstico. Adjuntar o revisar epicrisis HLH y antecedentes clínicos disponibles.',
    initial_treatment:
      'Emitir orden interna a Kinesiología/Rehabilitación post cirugía cardíaca y coordinar con Víctor Palavecino, referente local.',
    protocol_code: PROTOCOL_CODE,
    protocol_edition: 'Ordinario SSÑ',
    protocol_date: 'N° Inter 395',
    protocol_validity: '',
    protocol_authors: [{ name: 'Red Asistencial de Ñuble', role: 'Emisor del ordinario' }],
    protocol_objective:
      'Informar y operacionalizar el flujograma de derivación e ingreso a rehabilitación de usuarios cardio-operados de la Red Asistencial de Ñuble.',
  };

  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name,protocol_code,protocol_file_url')
    .eq('category_id', CATEGORY_ID)
    .or(`name.eq.${TOPIC_NAME},protocol_code.eq.${PROTOCOL_CODE}`)
    .maybeSingle();
  if (findError) throw findError;

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      existing,
      topic: TOPIC_NAME,
      protocol_code: PROTOCOL_CODE,
      blocks: content_blocks.length,
      tags,
      localKinesiologist: 'Víctor Palavecino',
      markdownPath: MARKDOWN_PATH,
      pdfPath: PDF_PATH,
      storagePath: STORAGE_PATH,
      related_topics,
    }, null, 2));
    console.log('\nDry-run. Ejecuta con --apply para escribir en Supabase y subir PDF.');
    return;
  }

  const protocol_file_url = await uploadPdf();
  const writePayload = { ...payload, protocol_file_url };

  let topic;
  if (existing?.id) {
    const updatePayload = { ...writePayload };
    delete updatePayload.id;
    const { data, error } = await supabase
      .from('topics')
      .update(updatePayload)
      .eq('id', existing.id)
      .select('id,name,protocol_code,protocol_file_url')
      .single();
    if (error) throw error;
    topic = data;
  } else {
    const { data, error } = await supabase
      .from('topics')
      .insert(writePayload)
      .select('id,name,protocol_code,protocol_file_url')
      .single();
    if (error) throw error;
    topic = data;
  }

  console.log(JSON.stringify({ topic }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
