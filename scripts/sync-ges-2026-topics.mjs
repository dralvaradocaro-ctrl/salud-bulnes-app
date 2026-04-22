import { createClient } from '@supabase/supabase-js';
import { getGesTopicMeta } from '../src/lib/ges.js';

const APPLY = process.argv.includes('--apply');
const CATEGORY_SLUG = 'patologias-ges';
const TODAY_ISO = new Date().toISOString();
const TODAY_DATE = TODAY_ISO.slice(0, 10);

const GES_TOPICS_2026 = [
  { number: 1, name: 'Enfermedad renal crónica etapa 4 y 5' },
  { number: 2, name: 'Cardiopatías congénitas operables' },
  { number: 3, name: 'Cáncer cervicouterino en personas de 15 años y más' },
  { number: 4, name: 'Alivio del dolor y cuidados paliativos por cáncer' },
  { number: 5, name: 'Infarto agudo del miocardio' },
  { number: 6, name: 'Diabetes mellitus tipo 1' },
  { number: 7, name: 'Diabetes mellitus tipo 2' },
  { number: 8, name: 'Cáncer de mama en personas de 15 años y más' },
  { number: 9, name: 'Disrafias espinales' },
  { number: 10, name: 'Tratamiento quirúrgico de escoliosis en personas menores de 25 años' },
  { number: 11, name: 'Tratamiento quirúrgico de cataratas' },
  { number: 12, name: 'Endoprótesis total de cadera en personas de 65 años y más con artrosis de cadera con limitación funcional severa' },
  { number: 13, name: 'Fisura labiopalatina' },
  { number: 14, name: 'Cáncer en personas menores de 15 años' },
  { number: 15, name: 'Esquizofrenia' },
  { number: 16, name: 'Cáncer de testículo en personas de 15 años y más' },
  { number: 17, name: 'Linfomas en personas de 15 años y más' },
  { number: 18, name: 'Síndrome de la inmunodeficiencia adquirida (VIH/SIDA)' },
  { number: 19, name: 'Infección respiratoria aguda (IRA) de manejo ambulatorio en personas menores de 5 años' },
  { number: 20, name: 'Neumonía adquirida en la comunidad de manejo ambulatorio en personas de 65 años y más' },
  { number: 21, name: 'Hipertensión arterial primaria o esencial en personas de 15 años y más' },
  { number: 22, name: 'Epilepsia en personas desde 1 año y menores de 15 años' },
  { number: 23, name: 'Salud oral integral para niños y niñas de 6 años' },
  { number: 24, name: 'Prevención de parto prematuro' },
  { number: 25, name: 'Trastornos de generación del impulso y conducción en personas de 15 años y más, que requieren marcapasos' },
  { number: 26, name: 'Colecistectomía preventiva del cáncer de vesícula en personas de 35 a 49 años' },
  { number: 27, name: 'Cáncer gástrico' },
  { number: 28, name: 'Cáncer de próstata en personas de 15 años y más' },
  { number: 29, name: 'Vicios de refracción en personas de 65 años y más' },
  { number: 30, name: 'Estrabismo en personas menores de 9 años' },
  { number: 31, name: 'Retinopatía diabética' },
  { number: 32, name: 'Desprendimiento de retina regmatógeno no traumático' },
  { number: 33, name: 'Hemofilia' },
  { number: 34, name: 'Depresión en personas de 15 años y más' },
  { number: 35, name: 'Tratamiento de la hiperplasia benigna de la próstata en personas sintomáticas' },
  { number: 36, name: 'Ayudas técnicas para personas de 65 años y más' },
  { number: 37, name: 'Ataque cerebrovascular isquémico en personas de 15 años y más' },
  { number: 38, name: 'Enfermedad pulmonar obstructiva crónica de tratamiento ambulatorio' },
  { number: 39, name: 'Asma bronquial moderada y grave en personas menores de 15 años' },
  { number: 40, name: 'Síndrome de dificultad respiratoria en el recién nacido' },
  { number: 41, name: 'Tratamiento médico en personas de 55 años y más con artrosis de cadera y/o rodilla, leve o moderada' },
  { number: 42, name: 'Hemorragia subaracnoidea secundaria a ruptura de uno o más aneurismas cerebrales' },
  { number: 43, name: 'Tumores primarios del sistema nervioso central en personas de 15 años y más' },
  { number: 44, name: 'Tratamiento quirúrgico de hernia del núcleo pulposo lumbar' },
  { number: 45, name: 'Leucemia en personas de 15 años y más' },
  { number: 46, name: 'Urgencia odontológica ambulatoria' },
  { number: 47, name: 'Salud oral integral de personas de 60 años' },
  { number: 48, name: 'Politraumatizado grave' },
  { number: 49, name: 'Traumatismo cráneo encefálico moderado o grave' },
  { number: 50, name: 'Trauma ocular grave' },
  { number: 51, name: 'Fibrosis quística' },
  { number: 52, name: 'Artritis reumatoidea' },
  { number: 53, name: 'Consumo perjudicial o dependencia de riesgo bajo a moderado de alcohol y drogas en personas menores de 20 años' },
  { number: 54, name: 'Analgesia del parto' },
  { number: 55, name: 'Gran quemado' },
  { number: 56, name: 'Hipoacusia bilateral en personas de 65 años y más que requieren uso de audífono' },
  { number: 57, name: 'Retinopatía del prematuro' },
  { number: 58, name: 'Displasia broncopulmonar del prematuro' },
  { number: 59, name: 'Hipoacusia neurosensorial bilateral del prematuro' },
  { number: 60, name: 'Epilepsia en personas de 15 años y más' },
  { number: 61, name: 'Asma bronquial en personas de 15 años y más' },
  { number: 62, name: 'Enfermedad de Parkinson' },
  { number: 63, name: 'Artritis idiopática juvenil' },
  { number: 64, name: 'Prevención secundaria enfermedad renal crónica terminal' },
  { number: 65, name: 'Displasia luxante de caderas' },
  { number: 66, name: 'Salud oral integral de la persona gestante' },
  { number: 67, name: 'Esclerosis múltiple remitente recurrente' },
  { number: 68, name: 'Hepatitis crónica por virus hepatitis B' },
  { number: 69, name: 'Hepatitis crónica por virus hepatitis C' },
  { number: 70, name: 'Cáncer colorrectal en personas de 15 años y más' },
  { number: 71, name: 'Cáncer de ovario epitelial' },
  { number: 72, name: 'Cáncer vesical en personas de 15 años y más' },
  { number: 73, name: 'Osteosarcoma en personas de 15 años y más' },
  { number: 74, name: 'Tratamiento quirúrgico de lesiones crónicas de la válvula aórtica en personas de 15 años y más' },
  { number: 75, name: 'Trastorno bipolar en personas de 15 años y más' },
  { number: 76, name: 'Hipotiroidismo en personas de 15 años y más' },
  { number: 77, name: 'Hipoacusia moderada, severa y profunda en personas menores de 4 años' },
  { number: 78, name: 'Lupus eritematoso sistémico' },
  { number: 79, name: 'Tratamiento quirúrgico de lesiones crónicas de las válvulas mitral y tricúspide en personas de 15 años y más' },
  { number: 80, name: 'Tratamiento de erradicación del Helicobacter pylori' },
  { number: 81, name: 'Cáncer de pulmón en personas de 15 años y más' },
  { number: 82, name: 'Cáncer de tiroides en personas de 15 años y más' },
  { number: 83, name: 'Cáncer renal en personas de 15 años y más' },
  { number: 84, name: 'Mieloma múltiple en personas de 15 años y más' },
  { number: 85, name: 'Enfermedad de Alzheimer y otras demencias' },
  { number: 86, name: 'Atención integral de salud en agresión sexual aguda' },
  { number: 87, name: 'Rehabilitación SARS-CoV-2' },
  { number: 88, name: 'Tratamiento farmacológico tras alta hospitalaria por cirrosis hepática' },
  { number: 89, name: 'Tratamiento hospitalario para personas menores de 15 años con depresión grave refractaria o psicótica con riesgo suicida' },
  { number: 90, name: 'Cesación del consumo de tabaco en personas de 25 años y más' },
];

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const RETINOPATIA_KEY = normalize('Retinopatía diabética');

const LEGACY_TO_OFFICIAL_KEY = new Map([
  ['Accidente Cerebrovascular (ACV)', 'Ataque cerebrovascular isquémico en personas de 15 años y más'],
  ['Artrosis de Cadera y/o Rodilla', 'Tratamiento médico en personas de 55 años y más con artrosis de cadera y/o rodilla, leve o moderada'],
  ['Asma Bronquial en menores de 15 años', 'Asma bronquial moderada y grave en personas menores de 15 años'],
  ['Cáncer Cervicouterino', 'Cáncer cervicouterino en personas de 15 años y más'],
  ['Cáncer de Mama', 'Cáncer de mama en personas de 15 años y más'],
  ['Cáncer Gástrico', 'Cáncer gástrico'],
  ['Cataratas', 'Tratamiento quirúrgico de cataratas'],
  ['Colelitiasis', 'Colecistectomía preventiva del cáncer de vesícula en personas de 35 a 49 años'],
  ['Demencia', 'Enfermedad de Alzheimer y otras demencias'],
  ['Depresión en personas de 15 años y más', 'Depresión en personas de 15 años y más'],
  ['Diabetes Mellitus Tipo 2', 'Diabetes mellitus tipo 2'],
  ['Enfermedad Pulmonar Obstructiva Crónica (EPOC)', 'Enfermedad pulmonar obstructiva crónica de tratamiento ambulatorio'],
  ['Hipertensión Arterial', 'Hipertensión arterial primaria o esencial en personas de 15 años y más'],
  ['Hipotiroidismo en personas de 15 años y más', 'Hipotiroidismo en personas de 15 años y más'],
  ['Infarto Agudo al Miocardio', 'Infarto agudo del miocardio'],
  ['Insuficiencia Renal Crónica Terminal (en diálisis)', 'Enfermedad renal crónica etapa 4 y 5'],
  ['Retinopatía Diabética', 'Retinopatía diabética'],
].map(([legacyName, officialName]) => [normalize(legacyName), normalize(officialName)]));

const SEARCH_ALIASES = new Map([
  ['Ataque cerebrovascular isquémico en personas de 15 años y más', ['ACV', 'Accidente Cerebrovascular']],
  ['Enfermedad pulmonar obstructiva crónica de tratamiento ambulatorio', ['EPOC']],
  ['Hipertensión arterial primaria o esencial en personas de 15 años y más', ['HTA']],
  ['Infarto agudo del miocardio', ['IAM']],
  ['Diabetes mellitus tipo 2', ['DM2']],
  ['Enfermedad renal crónica etapa 4 y 5', ['IRC', 'Insuficiencia Renal Crónica']],
  ['Retinopatía diabética', ['Retinopatía Diabética']],
].map(([officialName, aliases]) => [normalize(officialName), aliases]));

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

function mergeTags(existingTags = [], extraTags = []) {
  const seen = new Set();
  const merged = [];

  for (const tag of [...existingTags, ...extraTags]) {
    if (!tag || typeof tag !== 'string') continue;
    const key = normalize(tag);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(tag.trim());
  }

  return merged;
}

function buildTags(topic, officialTopic) {
  const { area } = getGesTopicMeta(officialTopic.name);
  const tags = [`GES ${officialTopic.number}`, 'GES', area];
  const officialKey = normalize(officialTopic.name);

  if (topic?.name && normalize(topic.name) !== officialKey) {
    tags.push(topic.name);
  }

  for (const alias of SEARCH_ALIASES.get(officialKey) || []) {
    tags.push(alias);
  }

  return mergeTags(topic?.tags || [], tags);
}

function buildUpdatePayload(topic, officialTopic, categoryId) {
  const { area } = getGesTopicMeta(officialTopic.name);
  const nextStatus = topic.status || 'published';
  const payload = {
    name: officialTopic.name,
    title: officialTopic.name,
    category_id: categoryId,
    subcategory: area,
    order: officialTopic.number,
    clasificacion_ges: 'GES',
    has_local_protocol: normalize(officialTopic.name) === RETINOPATIA_KEY,
    tipo_contenido: Array.isArray(topic.tipo_contenido) && topic.tipo_contenido.length
      ? topic.tipo_contenido
      : ['contenido_medico'],
    layout_mode: topic.layout_mode || 'auto',
    status: nextStatus,
    last_updated: TODAY_ISO,
    tags: buildTags(topic, officialTopic),
  };

  if (nextStatus === 'published' && !topic.published_date) {
    payload.published_date = TODAY_DATE;
  }

  return payload;
}

function buildCreatePayload(officialTopic, categoryId) {
  const { area } = getGesTopicMeta(officialTopic.name);
  return {
    name: officialTopic.name,
    title: officialTopic.name,
    category_id: categoryId,
    subcategory: area,
    order: officialTopic.number,
    status: 'published',
    layout_mode: 'auto',
    tipo_contenido: ['contenido_medico'],
    clasificacion_ges: 'GES',
    has_local_protocol: normalize(officialTopic.name) === RETINOPATIA_KEY,
    content_blocks: [],
    description: `Problema de salud GES N°${officialTopic.number} del área ${area}, vigente según el Decreto GES 2025-2028.`,
    tags: buildTags(null, officialTopic),
    published_date: TODAY_DATE,
    last_updated: TODAY_ISO,
  };
}

async function main() {
  const supabase = createClient(
    getRequiredEnv('VITE_SUPABASE_URL'),
    getRequiredEnv('VITE_SUPABASE_ANON_KEY')
  );

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (categoriesError) throw categoriesError;

  const category = categories.find((item) =>
    item.slug === CATEGORY_SLUG || normalize(item.name) === normalize('Patologías GES')
  );

  if (!category) {
    throw new Error('No se encontró la categoría "Patologías GES".');
  }

  const { data: existingTopics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name, title, category_id, status, published_date, clasificacion_ges, has_local_protocol, tipo_contenido, tags, order, layout_mode')
    .eq('category_id', category.id);

  if (topicsError) throw topicsError;

  const existingByKey = new Map(existingTopics.map((topic) => [normalize(topic.name), topic]));
  const usedTopicIds = new Set();
  const operations = [];

  for (const officialTopic of GES_TOPICS_2026) {
    const officialKey = normalize(officialTopic.name);
    let currentTopic = existingByKey.get(officialKey);

    if (!currentTopic) {
      currentTopic = existingTopics.find((topic) => {
        if (usedTopicIds.has(topic.id)) return false;
        return LEGACY_TO_OFFICIAL_KEY.get(normalize(topic.name)) === officialKey;
      });
    }

    if (currentTopic) {
      usedTopicIds.add(currentTopic.id);
      operations.push({
        action: 'update',
        id: currentTopic.id,
        from: currentTopic.name,
        to: officialTopic.name,
        payload: buildUpdatePayload(currentTopic, officialTopic, category.id),
      });
      continue;
    }

    operations.push({
      action: 'create',
      to: officialTopic.name,
      payload: buildCreatePayload(officialTopic, category.id),
    });
  }

  const untouchedTopics = existingTopics
    .filter((topic) => !usedTopicIds.has(topic.id))
    .map((topic) => topic.name)
    .sort((a, b) => a.localeCompare(b, 'es'));

  const summary = {
    category: category.name,
    officialCount: GES_TOPICS_2026.length,
    updates: operations.filter((operation) => operation.action === 'update').length,
    creates: operations.filter((operation) => operation.action === 'create').length,
    untouchedTopics,
  };

  console.log(`Modo: ${APPLY ? 'APLICAR CAMBIOS' : 'SIMULACIÓN'}`);
  console.log(JSON.stringify(summary, null, 2));

  if (!APPLY) {
    console.log('\nEjecuta este script con --apply para persistir los cambios.');
    return;
  }

  for (const operation of operations) {
    if (operation.action === 'update') {
      const { error } = await supabase
        .from('topics')
        .update(operation.payload)
        .eq('id', operation.id);

      if (error) throw error;
      console.log(`Actualizado: ${operation.from} -> ${operation.to}`);
      continue;
    }

    const { error } = await supabase
      .from('topics')
      .insert([operation.payload]);

    if (error) throw error;
    console.log(`Creado: ${operation.to}`);
  }

  const officialKeys = new Set(GES_TOPICS_2026.map((topic) => normalize(topic.name)));
  const { data: finalTopics, error: finalTopicsError } = await supabase
    .from('topics')
    .select('name, has_local_protocol, clasificacion_ges, order')
    .eq('category_id', category.id)
    .order('order', { ascending: true });

  if (finalTopicsError) throw finalTopicsError;

  const officialTopics = finalTopics.filter((topic) => officialKeys.has(normalize(topic.name)));
  const localProtocolTopics = officialTopics.filter((topic) => topic.has_local_protocol);
  const invalidClassification = officialTopics.filter((topic) => topic.clasificacion_ges !== 'GES');

  console.log('\nVerificación final');
  console.log(JSON.stringify({
    officialTopicsInCategory: officialTopics.length,
    officialTopicsWithLocalProtocol: localProtocolTopics.map((topic) => topic.name),
    officialTopicsWithoutGesClassification: invalidClassification.map((topic) => topic.name),
  }, null, 2));
}

main().catch((error) => {
  console.error('\nError al sincronizar GES 2026:', error);
  process.exit(1);
});
