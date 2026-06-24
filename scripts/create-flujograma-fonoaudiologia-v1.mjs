/**
 * Crea/actualiza el tema "Flujograma de derivación a Fonoaudiología HB 2026".
 *
 * Uso:
 *   node --env-file=.env scripts/create-flujograma-fonoaudiologia-v1.mjs
 *   node --env-file=.env scripts/create-flujograma-fonoaudiologia-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const CATEGORY_ID = '696ea6ff245ef362de4f431e'; // Policlínico
const TOPIC_NAME = 'Flujograma de derivación a Fonoaudiología HB 2026';
const PDF_PATH = '/Users/fernandoalvarado/Downloads/Flujograma derivación a Fonoaudiología HB 2026.pdf';
const STORAGE_PATH = 'protocolos/policlinico/flujograma-derivacion-fonoaudiologia-hb-2026.pdf';
const THUMBNAIL_URL = 'https://gcuevpxondfepbowvyqa.supabase.co/storage/v1/object/public/files/protocolos/policlinico/flujograma-derivacion-fonoaudiologia-hb-2026.png';
const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const tags = [
  'Flujo local',
  'Fonoaudiología',
  'Policlínico',
  'derivación interna',
  'Chile Crece Contigo',
  'Ley TEA',
  'NANEAS',
  'trastorno del lenguaje',
  'selectividad alimentaria',
  'dislalia',
  'dislexia',
  'anquiloglosia',
  'deglución atípica',
  'respirador oral',
  'disfonía',
  'tartamudez',
  'audición',
  'hipoacusia',
  'vértigo',
  'disfagia',
  'ACV',
  'Parkinson',
  'demencias',
  'parálisis cerebral',
  'autismo',
  'TEA',
];

const referralRows = [
  ['Niñez 0 a 4 años 11 meses', 'Inicio tardío del lenguaje, EEDP/TEPSI descendido sin diagnóstico neurológico, atención desde Chile Crece Contigo.', 'Derivación interna a Fono CHCC.'],
  ['Niñez, adolescentes y jóvenes hasta 20 años 11 meses', 'Trastorno del lenguaje, selectividad alimentaria, alteraciones del habla, dislalia, baja inteligibilidad, dificultades lectoescritura/dislexia.', 'Derivación interna a Fonoaudiología.'],
  ['Derivaciones odontológicas / ORL', 'Anquiloglosia, deglución atípica, interposición lingual, respirador oral y otros motivos odontopediátricos, odontológicos u otorrinolaringológicos.', 'Derivación interna a Fonoaudiología según flujo.'],
  ['Diagnóstico confirmado de autismo', 'Trastorno del lenguaje y comunicación asociado a autismo, con certificado diagnóstico.', 'Derivación interna a Programa Ley TEA / Fono Ley TEA.'],
  ['NANEAS', 'EEDP/TEPSI descendido con diagnóstico de base, TDAH, discapacidad intelectual, trastorno del lenguaje u otros según flujo.', 'Derivación interna según condición basal y ruta local.'],
  ['Adultos 18 años en adelante', 'Audición, hipoacusia neurosensorial GES, patologías vestibulares, vértigos periféricos o centrales, lavado de oídos.', 'Derivación interna a Fonoaudiología adultos / neurorehabilitación según flujo.'],
  ['Adultos con patología neurológica', 'Trastornos del lenguaje y habla, disfagia o disfonía asociada a ACV, Parkinson, demencias, parálisis cerebral u otras neurológicas.', 'Derivación interna a Fonoaudiología adultos / neurorehabilitación según flujo.'],
];

const contactsRows = [
  ['Chile Crece Contigo / estimulación temprana', 'Flga. Jannice Devaud', 'flga.jdevaud@gmail.com'],
  ['Atención infanto-juvenil', 'Flga. Valentina Arévalo', 'flga.valentina.arevalo@gmail.com'],
  ['Neurorehabilitación / adultos', 'Flgo. Diego Olivares', 'diego.olivares.g@redsalud.gob.cl'],
  ['Programa Ley TEA', 'Flgo. Richard Hernández', 'flgorichardhernandez@gmail.com'],
];

const flowSteps = [
  'Confirmar edad y programa de entrada: CHCC, infanto-juvenil, Ley TEA, NANEAS o adultos.',
  'Identificar motivo principal: lenguaje, habla, voz, audición, deglución, equilibrio, comunicación, TEA o patología neurológica.',
  'Verificar si existe diagnóstico confirmado de autismo o diagnóstico neurológico/de base, porque cambia la ruta interna.',
  'Emitir orden interna correspondiente: Fono CHCC, Fonoaudiología o Fono Ley TEA.',
  'Derivar al referente indicado en el flujo local según rango etario y motivo clínico.',
];

const relatedKeywords = [
  'demencia',
  'hipoacusia',
  'parkinson',
  'ataque cerebrovascular',
  'acv',
  'autismo',
  'trastorno del lenguaje',
  'disfagia',
  'disfonía',
  'vértigo',
  'parálisis cerebral',
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function findRelatedTopics() {
  const { data, error } = await supabase
    .from('topics')
    .select('id,name,description,subcategory,tags,status')
    .eq('status', 'published')
    .limit(1000);
  if (error) throw error;

  const matches = [];
  for (const topic of data || []) {
    if (topic.name === TOPIC_NAME) continue;
    const haystack = normalize([
      topic.name,
      topic.description,
      topic.subcategory,
      ...(topic.tags || []),
    ].join(' '));
    const matched = relatedKeywords.find((keyword) => haystack.includes(normalize(keyword)));
    if (matched) {
      matches.push({
        topic_id: topic.id,
        label: topic.name,
        matched,
      });
    }
  }

  const byId = new Map();
  for (const match of matches) {
    if (!byId.has(match.topic_id)) {
      byId.set(match.topic_id, { topic_id: match.topic_id, label: match.label });
    }
  }
  return [...byId.values()].slice(0, 8);
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

  const content_blocks = [
    {
      id: 'fono-flujo-resumen',
      type: 'text',
      tab: 'Resumen',
      color: 'sky',
      order: 10,
      title: 'Flujo local de derivación',
      content:
        'Flujograma local HB 2026 para ordenar derivaciones internas a Fonoaudiología según rango etario, programa de atención y motivo clínico. Es un flujo de derivación, no un protocolo clínico completo.',
      details: flowSteps,
      layout_position: 'main',
    },
    {
      id: 'fono-flujo-rutas',
      type: 'table',
      tab: 'Rutas',
      color: 'sky',
      order: 20,
      title: 'Rutas de derivación según flujo',
      headers: ['Población / ruta', 'Motivos incluidos', 'Orden / destino'],
      rows: referralRows,
      layout_position: 'main',
    },
    {
      id: 'fono-flujo-referentes',
      type: 'table',
      tab: 'Referentes',
      color: 'blue',
      order: 30,
      title: 'Referentes indicados en el flujograma',
      headers: ['Área', 'Referente', 'Contacto'],
      rows: contactsRows,
      layout_position: 'main',
    },
    {
      id: 'fono-flujo-visual',
      type: 'image_gallery',
      tab: 'Índice',
      color: 'sky',
      order: 40,
      title: 'Flujograma visual',
      description: 'Vista rápida del flujo local HB 2026 para derivación a Fonoaudiología.',
      images: [
        {
          url: THUMBNAIL_URL,
          alt: 'Flujograma de derivación a Fonoaudiología HB 2026',
          caption: 'Flujograma de derivación a atención fonoaudiológica HB 2026',
          description:
            'Usar como referencia visual para seleccionar ruta de derivación interna según edad, programa, diagnóstico de base y motivo clínico.',
        },
      ],
      source: 'Flujograma derivación a Fonoaudiología HB 2026',
      layout_position: 'main',
    },
  ];

  const payload = {
    id: randomUUID(),
    name: TOPIC_NAME,
    title: TOPIC_NAME,
    category_id: CATEGORY_ID,
    subcategory: 'Derivaciones',
    status: 'published',
    description:
      'Flujo local HB 2026 para derivación interna a Fonoaudiología según edad, programa, diagnóstico de base y motivo clínico.',
    order: 119,
    tags,
    authors: [{ name: 'Equipo Fonoaudiología HB', role: 'Fuente local' }],
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
      'Flujograma local para orientar derivación a Fonoaudiología en niñez, adolescentes, jóvenes, programa Ley TEA, NANEAS y adultos.',
    diagnostic_orientation:
      'Definir edad/programa, motivo de derivación y presencia de autismo confirmado o diagnóstico neurológico/de base antes de emitir la orden interna.',
    complementary_studies:
      'No aplica como protocolo diagnóstico. Usar EEDP/TEPSI cuando corresponda según control infantil y adjuntar antecedentes clínicos relevantes.',
    initial_treatment:
      'Emitir orden interna según ruta: Fono CHCC, Fonoaudiología o Fono Ley TEA, y derivar al referente definido en el flujo local.',
    protocol_code: 'Flujo local Fonoaudiología HB 2026',
    protocol_edition: 'Documento local',
    protocol_date: '2026',
    protocol_validity: '',
    protocol_authors: [{ name: 'Equipo Fonoaudiología HB', role: 'Fuente local' }],
    protocol_objective:
      'Ordenar las derivaciones internas a Fonoaudiología según ciclo vital, programa y motivo clínico.',
  };

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
      tags: tags.length,
      related_topics,
      pdfPath: PDF_PATH,
      storagePath: STORAGE_PATH,
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
      .select('id,name,protocol_file_url,related_topics')
      .single();
    if (error) throw error;
    topic = data;
  } else {
    const { data, error } = await supabase
      .from('topics')
      .insert(writePayload)
      .select('id,name,protocol_file_url,related_topics')
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
