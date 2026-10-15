// Body presence is an editorial completeness check, not clinical validation/approval.
const bodyKeys = ['content', 'description', 'details', 'items', 'actions', 'rows', 'dose', 'indication'];
const placeholders = /^(hola[s]?|test|prueba|pendiente(?: de .*)?|por completar|sin contenido)[.!\s]*$/i;
function bodyText(value) {
  if (typeof value === 'string') {
    const text = value.replace(/<[^>]*>/g, ' ').trim();
    return placeholders.test(text) || /^[━═─]{3}/.test(text) ? '' : text;
  }
  if (Array.isArray(value)) return value.map(bodyText).filter(Boolean).join(' ');
  if (!value || typeof value !== 'object') return '';
  return bodyKeys.map(key => bodyText(value[key])).filter(Boolean).join(' ');
}
export function hasProtocolBody(topic) {
  if (!topic) return false;
  const blocks = Array.isArray(topic.content_blocks) ? topic.content_blocks.filter(block => block && !['protocol_header', 'reference', 'checklist'].includes(block.type)) : [];
  const content = [bodyText(blocks), ...['clinical_summary', 'diagnostic_orientation', 'complementary_studies', 'initial_treatment', 'protocol_flowchart', 'protocol_medications'].map(key => bodyText(topic[key]))].filter(Boolean).join(' ');
  // Avoid promoting metadata, placeholders or isolated stubs to a developed local protocol.
  return content.length >= 160;
}
export function localContentPending(topic) {
  return topic?.has_local_protocol === true && !hasProtocolBody(topic);
}
export const protocolBlockAnchor = (block, index = 0) => `protocol-block-${encodeURIComponent(block?.id || `section-${index}`).replace(/%/g, '_')}`;
export const TOPIC_CALCULATORS = {
  '696efee3e40fc675b3e7bc69': ['sri'],
  '699b852031a1223efb78b00a': ['nrs2002'],
  '699c845c6050f253dd81526f': ['nrs2002'],
};
export function topicCalculatorIds(topic) {
  return [...new Set([...(TOPIC_CALCULATORS[topic?.id] || []), ...(Array.isArray(topic?.related_tools) ? topic.related_tools.filter(t => t.embedded === true).map(t => t.tool_id) : [])])];
}

// Read adapter: expose existing legacy clinical text without rewriting persisted content.
export function legacyClinicalBlocks(topic) {
  return [
    ['clinical_summary', 'Resumen clínico'],
    ['diagnostic_orientation', 'Orientación diagnóstica'],
    ['complementary_studies', 'Estudios complementarios'],
    ['initial_treatment', 'Tratamiento inicial'],
  ].filter(([key]) => typeof topic?.[key] === 'string' && topic[key].trim()).map(([key, title], order) => ({
    id: `legacy-${key}`, type: 'text', title, content: topic[key], order, layout_position: 'main',
  }));
}
