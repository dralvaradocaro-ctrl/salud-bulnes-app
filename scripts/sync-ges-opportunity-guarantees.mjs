import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const CATEGORY_SLUG = 'patologias-ges';
const OFFICIAL_GES_COUNT = 90;
const PAGE_BASE_URL = 'https://auge.minsal.cl/problemasdesalud/index/';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function decodeHtml(value = '') {
  const namedEntities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&aacute;': 'á',
    '&Aacute;': 'Á',
    '&eacute;': 'é',
    '&Eacute;': 'É',
    '&iacute;': 'í',
    '&Iacute;': 'Í',
    '&oacute;': 'ó',
    '&Oacute;': 'Ó',
    '&uacute;': 'ú',
    '&Uacute;': 'Ú',
    '&ntilde;': 'ñ',
    '&Ntilde;': 'Ñ',
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
    '&ordm;': 'º',
    '&ordf;': 'ª',
    '&deg;': '°',
  };

  let decoded = value.replace(/&(nbsp|amp|quot|apos|lt|gt|aacute|Aacute|eacute|Eacute|iacute|Iacute|oacute|Oacute|uacute|Uacute|ntilde|Ntilde|uuml|Uuml|ordm|ordf|deg|#39);/g, (entity) => namedEntities[entity] ?? entity);

  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));

  return decoded;
}

function stripHtml(value = '') {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|ol|ul|h[1-6]|table|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\ufb01/g, 'fi')
    .replace(/\ufb02/g, 'fl')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function compactGuaranteeText(value = '') {
  return value
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^(?:[ivxlcdm]+|\d+)\.\s*/i, '')
    .trim();
}

function splitEnumeratedText(value = '') {
  const normalized = stripHtml(value);
  const matches = [...normalized.matchAll(/(?:^|\n)\s*(?:[ivxlcdm]+|\d+)\.\s*([\s\S]*?)(?=(?:\n\s*(?:[ivxlcdm]+|\d+)\.\s)|$)/gi)];

  if (matches.length > 0) {
    return matches
      .map((match) => compactGuaranteeText(match[1]))
      .filter(Boolean);
  }

  const compacted = compactGuaranteeText(normalized);
  return compacted ? [compacted] : [];
}

function extractOpportunitySection(html) {
  const start = html.indexOf('id="oportunidad"');
  if (start === -1) return null;

  const protectionsIndex = html.indexOf('id="protecciones"', start);
  if (protectionsIndex === -1) return html.slice(start);

  const end = html.lastIndexOf('<div class="tab-pane fade"', protectionsIndex);
  if (end === -1) return html.slice(start, protectionsIndex);

  return html.slice(start, end);
}

function extractOpportunityEntries(html) {
  const section = extractOpportunitySection(html);
  if (!section) return [];

  const entries = [];
  const panelChunks = section
    .split(/<div class="panel panel-primary">/gi)
    .slice(1);

  for (const panelChunk of panelChunks) {
    const headingMatch = panelChunk.match(/<div class="panel-heading">([\s\S]*?)<\/div>/i);
    if (!headingMatch) continue;

    const heading = stripHtml(headingMatch[1]);
    const bodyStart = panelChunk.search(/<div class="panel-body[^"]*">/i);
    if (bodyStart === -1) continue;

    const bodyHtml = panelChunk
      .slice(bodyStart)
      .replace(/^[\s\S]*?<div class="panel-body[^"]*">/i, '');

    const itemMatches = [...bodyHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];

    if (itemMatches.length > 0) {
      for (const itemMatch of itemMatches) {
        const text = compactGuaranteeText(stripHtml(itemMatch[1]));
        if (!text) continue;
        entries.push({ heading, text });
      }
      continue;
    }

    const splitEntries = splitEnumeratedText(bodyHtml);
    for (const text of splitEntries) {
      entries.push({ heading, text });
    }
  }

  return entries;
}

function parseTimeframe(entryText = '') {
  const normalizedText = stripHtml(entryText);

  const dayMatch = normalizedText.match(/(\d+)\s*d[ií]as?/i);
  if (dayMatch) {
    return { kind: 'days', value: Number(dayMatch[1]) };
  }

  const hourMatch = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*horas?/i);
  if (hourMatch) {
    return { kind: 'hours', value: Number(hourMatch[1].replace(',', '.')) };
  }

  const minuteMatch = normalizedText.match(/<?\s*(\d+)\s*min/i);
  if (minuteMatch) {
    return { kind: 'minutes', value: Number(minuteMatch[1]) };
  }

  if (/inmediat[oa]/i.test(normalizedText)) {
    return { kind: 'immediate', value: 0 };
  }

  return null;
}

function buildGuaranteePayload(entries = []) {
  if (entries.length === 0) {
    return { guarantee_days: null, guarantee_details: null };
  }

  const details = entries
    .map(({ heading, text }) => `${heading}: ${text}`)
    .join('\n');

  const nonTamizajeEntries = entries.filter(({ heading }) => normalize(heading) !== 'tamizaje');
  const summaryPool = nonTamizajeEntries.length > 0 ? nonTamizajeEntries : entries;
  const firstEntryTimeframe = summaryPool.length > 0 ? parseTimeframe(summaryPool[0].text) : null;
  if (firstEntryTimeframe?.kind === 'days') {
    return {
      guarantee_days: firstEntryTimeframe.value,
      guarantee_details: details,
    };
  }

  if (firstEntryTimeframe) {
    return {
      guarantee_days: 0,
      guarantee_details: details,
    };
  }

  const fallbackDayTimeframe = summaryPool
    .map(({ text }) => parseTimeframe(text))
    .find((timeframe) => timeframe?.kind === 'days');

  if (fallbackDayTimeframe) {
    return {
      guarantee_days: fallbackDayTimeframe.value,
      guarantee_details: details,
    };
  }

  return {
    guarantee_days: null,
    guarantee_details: details,
  };
}

async function fetchGuaranteePayload(problemNumber) {
  const response = await fetch(`${PAGE_BASE_URL}${problemNumber}`);
  if (!response.ok) {
    throw new Error(`No se pudo obtener la ficha oficial GES N.${problemNumber}: HTTP ${response.status}`);
  }

  const html = await response.text();
  const entries = extractOpportunityEntries(html);
  return buildGuaranteePayload(entries);
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

  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, name, order, clasificacion_ges, guarantee_days, guarantee_details')
    .eq('category_id', category.id)
    .eq('clasificacion_ges', 'GES')
    .order('order');

  if (topicsError) throw topicsError;

  const officialTopics = topics.filter((topic) =>
    Number.isInteger(topic.order) && topic.order >= 1 && topic.order <= OFFICIAL_GES_COUNT
  );

  const operations = [];
  const missing = [];

  for (const topic of officialTopics) {
    const payload = await fetchGuaranteePayload(topic.order);

    if (!payload.guarantee_details) {
      missing.push({ order: topic.order, name: topic.name });
      continue;
    }

    operations.push({
      id: topic.id,
      order: topic.order,
      name: topic.name,
      payload,
    });
  }

  const summary = {
    category: category.name,
    officialTopics: officialTopics.length,
    parsedGuarantees: operations.length,
    missingGuarantees: missing.length,
    missing,
    sample: operations.slice(0, 12).map((operation) => ({
      order: operation.order,
      name: operation.name,
      guarantee_days: operation.payload.guarantee_days,
      guarantee_details: operation.payload.guarantee_details,
    })),
  };

  console.log(`Modo: ${APPLY ? 'APLICAR CAMBIOS' : 'SIMULACIÓN'}`);
  console.log(JSON.stringify(summary, null, 2));

  if (!APPLY) {
    console.log('\nEjecuta este script con --apply para persistir los cambios.');
    return;
  }

  for (const operation of operations) {
    const { error } = await supabase
      .from('topics')
      .update({
        guarantee_days: operation.payload.guarantee_days,
        guarantee_details: operation.payload.guarantee_details,
      })
      .eq('id', operation.id);

    if (error) {
      throw new Error(`No se pudo actualizar ${operation.name}: ${error.message}`);
    }
  }

  console.log(`\nActualización completada: ${operations.length} temas GES sincronizados.`);
}

main().catch((error) => {
  console.error('\nError al sincronizar garantías de oportunidad GES:', error);
  process.exit(1);
});
