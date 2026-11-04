// Lectura del contenido de bloques para la vista modular del protocolo:
// separadores "━━━ TÍTULO ━━━" como subgrupos, títulos en mayúsculas a frase,
// números de paso duplicados, pares "Clave: valor" y el reparto de anchos en la grilla.

const SEPARATOR_RE = /^[━═─]{3}/;

// Siglas que se conservan en mayúsculas al pasar un título a frase.
const ACRONYMS = new Set([
  'VO', 'IM', 'EV', 'IV', 'SC', 'SL', 'RASS', 'GCS', 'CAM', 'BARS', 'HCHM', 'HCSFB', 'SSÑ', 'GES', 'MINSAL',
  'ECG', 'TC', 'RM', 'SOS', 'UCI', 'UPC', 'IAM', 'ACV', 'AIT', 'HTA', 'ERC', 'EPOC', 'RCP', 'PCR', 'SRI',
  'CIE', 'APS', 'CESFAM', 'SAMU', 'PSCV', 'TEC', 'VIH', 'ITS', 'TBC', 'NIHSS', 'ESI', 'SAPU', 'SAR',
]);

export const isSeparator = (text) => typeof text === 'string' && SEPARATOR_RE.test(text.trim());

export const separatorLabel = (text) => text.trim().replace(/^[━═─\s]+|[━═─\s]+$/g, '').trim();

// "VÍA ORAL (paciente cooperador)" → "Vía oral (paciente cooperador)"; respeta siglas y texto ya en frase.
const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
const isShouted = (word) => word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase() && !ACRONYMS.has(word);

export function toSentenceCase(text) {
  const value = String(text || '').trim();
  if (!(value.match(WORD_RE) || []).some(w => isShouted(w) && w.length > 2)) return value;
  let first = true;
  return value.replace(WORD_RE, (word) => {
    // Letras sueltas ("Y", "A") también bajan, salvo al inicio.
    const single = word.length === 1 && word !== word.toLowerCase();
    const out = isShouted(word) || (single && !first) ? word.toLowerCase() : word;
    if (first) { first = false; return ACRONYMS.has(out) ? out : out.charAt(0).toUpperCase() + out.slice(1); }
    return out;
  });
}

// "+4 Combativo", "−1 a −3 Estimulación", "0 Alerta" → { code, rest }. Para escalas cuyos ítems ya traen su puntaje.
export function leadingCode(text) {
  const match = String(text || '').trim().match(/^([+\-−]\d+(?:\s*a\s*[+\-−]\d+)?|0)\s*[:.]?\s+(\S.*)$/);
  return match ? { code: match[1], rest: match[2] } : null;
}

// Una lista cuyos ítems llevan su propio código no se numera además.
export const listCarriesCodes = (texts = []) => {
  const lines = texts.filter(t => String(t || '').trim());
  return lines.length > 1 && lines.filter(t => leadingCode(t)).length >= Math.ceil(lines.length * 0.6);
};

// "3. Solicita evaluación" → "Solicita evaluación" (la numeración la pone la vista).
export const stripStepPrefix = (text) => String(text || '').replace(/^\s*\d{1,2}\s*[.)-]\s+/, '');

// "Dosis: 25 mg VO" → { key: 'Dosis', value: '25 mg VO' }. Una clave corta, sin cifras, sin hora (10:30).
export function parseKeyValue(text) {
  const match = String(text || '').match(/^\s*([^:\d]{1,29}?)\s*:\s+(.+)$/);
  if (!match) return null;
  const key = match[1].trim();
  if (key.split(/\s+/).length > 4) return null;
  return { key, value: match[2].trim() };
}

// Agrupa una lista con separadores. Las líneas vacías se descartan; sin separadores queda un grupo sin título.
export function groupBySeparators(items = []) {
  const groups = [];
  let current = { title: null, items: [] };
  for (const raw of items) {
    if (typeof raw !== 'string') continue;
    if (raw.trim() === '') continue;
    if (isSeparator(raw)) {
      if (current.title !== null || current.items.length > 0) groups.push(current);
      current = { title: toSentenceCase(separatorLabel(raw)), items: [] };
      continue;
    }
    current.items.push(raw);
  }
  if (current.title !== null || current.items.length > 0) groups.push(current);
  return groups;
}

// Ancho que pide cada bloque en la grilla de 12 columnas.
const FULL_TYPES = new Set([
  'table', 'mermaid', 'image_gallery', 'medications', 'clinical', 'checklist', 'protocol_header',
  'hearts_pathway', 'hearts_ladder', 'dose_calculator', 'score_calculator',
]);

export function blockSize(block) {
  if (!block) return 'narrow';
  if (block.layout_position === 'full') return 'full';
  if (FULL_TYPES.has(block.type) || /calculator|assistant/.test(block.type || '')) return 'full';
  const lines = (block.items || block.details || []).filter(l => typeof l === 'string' && l.trim());
  const textLength = (block.content || '').length + lines.join(' ').length;
  if (block.type === 'reference' || block.type === 'alert') return 'narrow';
  if (lines.length > 7 || textLength > 700) return 'wide';
  return 'narrow';
}

// Reparte los bloques en filas que suman 12: completo = 12; ancho + angosto = 8 + 4; dos angostos = 6 + 6.
// Nunca tres por fila: en la columna de 1024 px de la app una tarjeta de 4/12 (~320 px) obliga a leer en columnas estrechas.
export function packRows(sizes = []) {
  const spans = new Array(sizes.length).fill(12);
  let i = 0;
  while (i < sizes.length) {
    const a = sizes[i];
    const b = sizes[i + 1];
    if (a === 'full' || b === undefined || b === 'full') { spans[i] = 12; i += 1; continue; }
    if (a === 'wide' && b === 'narrow') { spans[i] = 8; spans[i + 1] = 4; i += 2; continue; }
    if (a === 'narrow' && b === 'wide') { spans[i] = 4; spans[i + 1] = 8; i += 2; continue; }
    if (a === 'narrow' && b === 'narrow') { spans[i] = 6; spans[i + 1] = 6; i += 2; continue; }
    spans[i] = 12; i += 1; // dos anchos seguidos: cada uno en su fila
  }
  return spans;
}

const TYPE_NOUNS = {
  flowchart: 'flujo', algorithm: 'algoritmo', criteria: 'criterios', alert: 'alertas', text: 'texto',
  reference: 'referencias', mermaid: 'diagrama', table: 'tabla', medications: 'fármacos', checklist: 'pauta',
  image_gallery: 'imágenes', clinical: 'orientación clínica',
};

// Resumen de una pestaña a partir de lo que contiene: "Flujo, criterios y referencias".
export function summarizeBlocks(blocks = []) {
  const nouns = [];
  for (const block of blocks) {
    const noun = TYPE_NOUNS[block?.type] || (/calculator|assistant/.test(block?.type || '') ? 'calculadora' : null);
    if (noun && !nouns.includes(noun)) nouns.push(noun);
  }
  if (nouns.length === 0) return '';
  const list = nouns.length === 1 ? nouns[0] : `${nouns.slice(0, -1).join(', ')} y ${nouns[nouns.length - 1]}`;
  return list.charAt(0).toUpperCase() + list.slice(1);
}

// Bloques administrativos del documento ("Documento base HCSFB 130", "Objetivo y alcance", "Propósito y alcance"):
// la vista modular los muestra en la ficha del documento, no entre el contenido clínico.
const DOCUMENT_INFO_TITLE = /^\s*(documento base|objetivos?\b|prop[oó]sito|alcance)/i;
const OPERATIVE_WORDS = /activaci|proceso|criterio|algoritmo|manejo|tratamiento|flujo/i;

export function isDocumentInfoBlock(block) {
  if (!block || (block.type !== 'text' && block.type !== 'criteria')) return false;
  const title = String(block.title || '');
  return DOCUMENT_INFO_TITLE.test(title) && !OPERATIVE_WORDS.test(title);
}

export const KEY_FACT_TONES = ['neutral', 'blue', 'teal', 'amber', 'red'];

// "Lo esencial": hasta 4 datos guardados como un bloque key_facts dentro de content_blocks.
export function readKeyFacts(blocks = []) {
  const block = (blocks || []).find(b => b?.type === 'key_facts');
  if (!block) return [];
  return (block.facts || [])
    .filter(f => f && String(f.value || '').trim())
    .slice(0, 4)
    .map(f => ({
      label: String(f.label || '').trim(),
      value: String(f.value).trim(),
      note: String(f.note || '').trim(),
      tone: KEY_FACT_TONES.includes(f.tone) ? f.tone : 'neutral',
    }));
}
